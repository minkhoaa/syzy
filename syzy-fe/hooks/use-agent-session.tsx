"use client"

import React, { useState, useCallback, useEffect, useRef, createContext, useContext } from "react"
import {
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  Connection,
} from "@solana/web3.js"
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountIdempotentInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react"
import { RPC_URL, CLUSTER } from "@/lib/constants/network"

const USDC_MINT_DEVNET = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU")
const USDC_DECIMALS = 6

const SESSION_STORAGE_KEY = "oyrade-agent-session"
const SESSION_META_KEY = "oyrade-agent-session-meta"
// Public key cached in localStorage — safe to store, used for cross-device balance checks
const SESSION_PUBKEY_KEY = "oyrade-agent-session-pubkey"
// Legacy backup key kept for backward compatibility
const BACKUP_STORAGE_KEY = "oyrade-agent-session-backup"

/**
 * Fixed derivation message — the same wallet always signs the same bytes,
 * producing the same ed25519 signature, which seeds the same session keypair.
 * This makes sessions device-independent and recoverable after storage is cleared.
 */
const SESSION_DERIVATION_MESSAGE = new TextEncoder().encode(
  "Syzy Agent Session v1\nThis signature derives your ephemeral session wallet.\nDo not share."
)

async function deriveSessionKeypair(walletProvider: {
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
}): Promise<Keypair> {
  const signature = await walletProvider.signMessage(SESSION_DERIVATION_MESSAGE)
  // First 32 bytes of the ed25519 signature are used as the keypair seed
  return Keypair.fromSeed(signature.slice(0, 32))
}

function getConnection() {
  return new Connection(RPC_URL, CLUSTER)
}

interface SessionState {
  keypair: Keypair | null
  publicKey: PublicKey | null
  balance: number
  totalFunded: number
  isActive: boolean
  /** Non-null when we detected on-chain USDC at the cached pubkey before signing */
  recoverableBalance: number | null
}

function useAgentSessionInternal() {
  const { address } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider("solana")

  const [session, setSession] = useState<SessionState>({
    keypair: null,
    publicKey: null,
    balance: 0,
    totalFunded: 0,
    isActive: false,
    recoverableBalance: null,
  })

  const connectionRef = useRef<Connection>(getConnection())
  // Mutable ref so checkSufficientBalance always reads the latest balance,
  // even from stale closures (avoids the stale closure / multiple-instance race condition)
  const balanceRef = useRef<number>(0)

  // On mount: try sessionStorage first, then check for recoverable balance via stored pubkey
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY)
      if (stored) {
        const secretKey = new Uint8Array(JSON.parse(stored))
        const keypair = Keypair.fromSecretKey(secretKey)
        let totalFunded = 0
        try {
          const meta = sessionStorage.getItem(SESSION_META_KEY)
          if (meta) totalFunded = JSON.parse(meta).totalFunded ?? 0
        } catch {
          // ignore
        }
        setSession((prev) => ({
          ...prev,
          keypair,
          publicKey: keypair.publicKey,
          totalFunded,
          isActive: true,
        }))
        return // fast path — no need to check localStorage
      }

      // No sessionStorage keypair. Check if we have a stored pubkey from a previous session.
      let storedPubkey: string | null = null
      try {
        storedPubkey = localStorage.getItem(SESSION_PUBKEY_KEY)
        // Also check legacy backup for old sessions
        if (!storedPubkey) {
          const backup = localStorage.getItem(BACKUP_STORAGE_KEY)
          if (backup) {
            const secretKey = new Uint8Array(JSON.parse(backup))
            const keypair = Keypair.fromSecretKey(secretKey)
            storedPubkey = keypair.publicKey.toBase58()
          }
        }
      } catch {
        // ignore
      }

      if (storedPubkey) {
        const pubkey = new PublicKey(storedPubkey)
        getAssociatedTokenAddress(USDC_MINT_DEVNET, pubkey)
          .then((ata) => getAccount(connectionRef.current, ata))
          .then((account) => {
            const balance = Number(account.amount) / 10 ** USDC_DECIMALS
            if (balance > 0) {
              setSession((prev) => ({ ...prev, recoverableBalance: balance }))
            }
          })
          .catch(() => {
            // No ATA or zero balance — nothing to show
          })
      }
    } catch {
      // Invalid stored session
    }
  }, [])

  // Refresh balance when session becomes active
  useEffect(() => {
    if (session.isActive && session.publicKey) {
      refreshBalance()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.isActive, session.publicKey?.toBase58()])

  const refreshBalance = useCallback(async (): Promise<number> => {
    if (!session.publicKey) return balanceRef.current

    try {
      const ata = await getAssociatedTokenAddress(
        USDC_MINT_DEVNET,
        session.publicKey
      )
      const account = await getAccount(connectionRef.current, ata)
      const balance = Number(account.amount) / 10 ** USDC_DECIMALS
      balanceRef.current = balance
      setSession((prev) => ({ ...prev, balance }))
      return balance
    } catch {
      setSession((prev) => ({ ...prev, balance: 0 }))
      return 0
    }
  }, [session.publicKey])

  const createSession = useCallback(
    async (budgetUsdc: number) => {
      if (!address || !walletProvider) {
        throw new Error("Wallet not connected")
      }

      const provider = walletProvider as {
        signMessage: (msg: Uint8Array) => Promise<Uint8Array>
        signAndSendTransaction?: (tx: Transaction) => Promise<{ signature?: string } | string>
        signTransaction?: (tx: Transaction) => Promise<Transaction>
      }

      // Derive deterministic session keypair — same wallet always yields the same session
      const keypair = await deriveSessionKeypair(provider)

      const connection = connectionRef.current
      const userPubkey = new PublicKey(address)

      const sessionAta = await getAssociatedTokenAddress(
        USDC_MINT_DEVNET,
        keypair.publicKey
      )
      const userAta = await getAssociatedTokenAddress(
        USDC_MINT_DEVNET,
        userPubkey
      )

      // Check existing session balance before transferring
      let existingBalance = 0
      try {
        const existing = await getAccount(connection, sessionAta)
        existingBalance = Number(existing.amount) / 10 ** USDC_DECIMALS
      } catch {
        // ATA doesn't exist yet
      }

      const tx = new Transaction()

      // Fund session wallet with SOL for rent — only if balance is low
      const sessionSolBalance = await connection.getBalance(keypair.publicKey)
      if (sessionSolBalance < 2_000_000) {
        tx.add(
          SystemProgram.transfer({
            fromPubkey: userPubkey,
            toPubkey: keypair.publicKey,
            lamports: 3_000_000, // ~0.003 SOL
          })
        )
      }

      // Create session wallet's USDC ATA (idempotent — safe if it already exists)
      tx.add(
        createAssociatedTokenAccountIdempotentInstruction(
          userPubkey,
          sessionAta,
          keypair.publicKey,
          USDC_MINT_DEVNET,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      )

      // Transfer USDC from user to session wallet
      const amount = Math.floor(budgetUsdc * 10 ** USDC_DECIMALS)
      tx.add(
        createTransferInstruction(
          userAta,
          sessionAta,
          userPubkey,
          amount,
          [],
          TOKEN_PROGRAM_ID
        )
      )

      const { blockhash } = await connection.getLatestBlockhash()
      tx.recentBlockhash = blockhash
      tx.feePayer = userPubkey

      if (provider.signAndSendTransaction) {
        await provider.signAndSendTransaction(tx)
      } else if (provider.signTransaction) {
        const signed = await provider.signTransaction(tx)
        await connection.sendRawTransaction(signed.serialize())
      }

      const newTotalFunded = existingBalance + budgetUsdc
      const optimisticBalance = existingBalance + budgetUsdc

      // Cache keypair in sessionStorage (avoids re-signing on same-tab refresh)
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(Array.from(keypair.secretKey)))
      sessionStorage.setItem(SESSION_META_KEY, JSON.stringify({ totalFunded: newTotalFunded }))
      // Store pubkey in localStorage for cross-device balance checks
      localStorage.setItem(SESSION_PUBKEY_KEY, keypair.publicKey.toBase58())
      // Legacy backup
      try {
        localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(Array.from(keypair.secretKey)))
      } catch {
        // localStorage might be full
      }

      balanceRef.current = optimisticBalance
      setSession({
        keypair,
        publicKey: keypair.publicKey,
        balance: optimisticBalance,
        totalFunded: newTotalFunded,
        isActive: true,
        recoverableBalance: null,
      })
    },
    [address, walletProvider]
  )

  const getSessionSigner = useCallback(() => {
    return session.keypair
  }, [session.keypair])

  const fundSession = useCallback(
    async (amount: number) => {
      if (!address || !walletProvider || !session.publicKey) {
        throw new Error("No active session or wallet")
      }

      const connection = connectionRef.current
      const userPubkey = new PublicKey(address)

      const sessionAta = await getAssociatedTokenAddress(
        USDC_MINT_DEVNET,
        session.publicKey
      )
      const userAta = await getAssociatedTokenAddress(
        USDC_MINT_DEVNET,
        userPubkey
      )

      const tx = new Transaction()
      const lamports = Math.floor(amount * 10 ** USDC_DECIMALS)
      tx.add(
        createTransferInstruction(
          userAta,
          sessionAta,
          userPubkey,
          lamports,
          [],
          TOKEN_PROGRAM_ID
        )
      )

      const { blockhash } = await connection.getLatestBlockhash()
      tx.recentBlockhash = blockhash
      tx.feePayer = userPubkey

      const provider = walletProvider as {
        signAndSendTransaction?: (tx: Transaction) => Promise<{ signature?: string } | string>
        signTransaction?: (tx: Transaction) => Promise<Transaction>
      }

      if (provider.signAndSendTransaction) {
        await provider.signAndSendTransaction(tx)
      } else if (provider.signTransaction) {
        const signed = await provider.signTransaction(tx)
        await connection.sendRawTransaction(signed.serialize())
      }

      const newTotalFunded = session.totalFunded + amount
      balanceRef.current = balanceRef.current + amount
      setSession((prev) => ({
        ...prev,
        balance: prev.balance + amount,
        totalFunded: newTotalFunded,
      }))

      sessionStorage.setItem(SESSION_META_KEY, JSON.stringify({ totalFunded: newTotalFunded }))

      // Refresh actual on-chain balance
      setTimeout(() => refreshBalance(), 2000)
    },
    [address, walletProvider, session.publicKey, session.totalFunded, refreshBalance]
  )

  const withdrawAll = useCallback(async () => {
    if (!address || !session.keypair || !session.publicKey) {
      throw new Error("No active session")
    }

    const connection = connectionRef.current
    const userPubkey = new PublicKey(address)

    const sessionAta = await getAssociatedTokenAddress(
      USDC_MINT_DEVNET,
      session.publicKey
    )
    const userAta = await getAssociatedTokenAddress(
      USDC_MINT_DEVNET,
      userPubkey
    )

    try {
      const account = await getAccount(connection, sessionAta)
      const balance = Number(account.amount)

      if (balance > 0) {
        const tx = new Transaction()
        tx.add(
          createTransferInstruction(
            sessionAta,
            userAta,
            session.publicKey,
            balance,
            [],
            TOKEN_PROGRAM_ID
          )
        )

        const { blockhash } = await connection.getLatestBlockhash()
        tx.recentBlockhash = blockhash
        tx.feePayer = session.publicKey

        tx.sign(session.keypair)
        await connection.sendRawTransaction(tx.serialize())
      }
    } catch {
      // ATA might not exist, nothing to withdraw
    }

    sessionStorage.removeItem(SESSION_STORAGE_KEY)
    sessionStorage.removeItem(SESSION_META_KEY)
    localStorage.removeItem(SESSION_PUBKEY_KEY)
    localStorage.removeItem(BACKUP_STORAGE_KEY)
    setSession({
      keypair: null,
      publicKey: null,
      balance: 0,
      totalFunded: 0,
      isActive: false,
      recoverableBalance: null,
    })
  }, [address, session.keypair, session.publicKey])

  /**
   * Recover session by re-signing the deterministic derivation message.
   * Works even after clearing site data or on a new device with the same wallet.
   * Returns true if USDC balance > 0, false if the session has no funds.
   */
  const recoverSession = useCallback(async (): Promise<boolean> => {
    if (!walletProvider) return false

    const provider = walletProvider as {
      signMessage: (msg: Uint8Array) => Promise<Uint8Array>
    }

    const keypair = await deriveSessionKeypair(provider)

    // Check on-chain balance
    let balance = 0
    try {
      const ata = await getAssociatedTokenAddress(USDC_MINT_DEVNET, keypair.publicKey)
      const account = await getAccount(connectionRef.current, ata)
      balance = Number(account.amount) / 10 ** USDC_DECIMALS
    } catch {
      // No ATA — no funds
    }

    // Restore totalFunded from meta if available, else use current balance
    let totalFunded = balance
    try {
      const meta = sessionStorage.getItem(SESSION_META_KEY)
      if (meta) totalFunded = JSON.parse(meta).totalFunded ?? balance
    } catch {
      // ignore
    }

    // Re-cache in sessionStorage so subsequent refreshes don't need to re-sign
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(Array.from(keypair.secretKey)))
    sessionStorage.setItem(SESSION_META_KEY, JSON.stringify({ totalFunded }))
    localStorage.setItem(SESSION_PUBKEY_KEY, keypair.publicKey.toBase58())

    balanceRef.current = balance
    setSession({
      keypair,
      publicKey: keypair.publicKey,
      balance,
      totalFunded,
      isActive: balance > 0,
      recoverableBalance: null,
    })

    return balance > 0
  }, [walletProvider])

  const checkSufficientBalance = useCallback(
    (estimatedCost: number) => {
      const cost =
        typeof estimatedCost === "string"
          ? parseFloat((estimatedCost as string).replace(/[^0-9.]/g, ""))
          : estimatedCost
      // Use balanceRef so this always reads the latest balance regardless of closure age
      const currentBalance = balanceRef.current
      return {
        sufficient: currentBalance >= cost,
        deficit: Math.max(0, cost - currentBalance),
      }
    },
    []
  )

  return {
    ...session,
    // Whether the connected wallet could have a recoverable session (even if storage is empty)
    canRecover: !!address && !!walletProvider,
    createSession,
    fundSession,
    withdrawAll,
    recoverSession,
    checkSufficientBalance,
    refreshBalance,
    getSessionSigner,
  }
}

type AgentSessionValue = ReturnType<typeof useAgentSessionInternal>

const AgentSessionContext = createContext<AgentSessionValue | null>(null)

export function AgentSessionProvider({ children }: { children: React.ReactNode }) {
  const value = useAgentSessionInternal()
  return <AgentSessionContext.Provider value={value}>{children}</AgentSessionContext.Provider>
}

export function useAgentSession() {
  const ctx = useContext(AgentSessionContext)
  if (!ctx) throw new Error("useAgentSession must be used within AgentSessionProvider")
  return ctx
}
