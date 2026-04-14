"use client"

import { useEffect, useRef, useCallback } from 'react'
import { useAppKit, useAppKitAccount, useAppKitProvider, useDisconnect } from '@reown/appkit/react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store/use-auth-store'
import { apiClient } from '@/lib/kubb'
import { setEncryptionKey, clearEncryptionKey, fetchNotesFromBackend, hasEncryptionKey, isEncryptionKeyReady, restoreEncryptionKey } from '@/features/privacy/utils/zk-storage'
import { isTxLocked, onTxUnlock } from '@/features/trading/utils/tx-lock'
import { toast } from 'sonner'
import bs58 from 'bs58'

// Solana wallet provider interface
interface SolanaWalletProvider {
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
}

/**
 * Auto Login Component
 * Automatically performs login when wallet connects:
 * - Development: Uses dev-login endpoint (no signature required)
 * - Production: Full signature flow (nonce → sign → verify)
 */
export function AutoLogin() {
  const { address, isConnected, status } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider('solana')
  const { disconnect } = useDisconnect()
  const { isAuthenticated, setAuthState, logout } = useAuthStore()
  const queryClient = useQueryClient()
  const lastAddress = useRef<string | null>(null)
  const isLoggingIn = useRef(false)

  const isDev = process.env.NODE_ENV === 'development'

  // Derive ZK encryption key from deterministic wallet signature
  const deriveEncryptionKey = useCallback(async (walletAddress: string): Promise<boolean> => {
    const provider = walletProvider as SolanaWalletProvider
    if (!provider?.signMessage) {
      console.error('[AutoLogin] Wallet does not support message signing')
      return false
    }

    try {
      // Sign deterministic message for ZK encryption key
      // This must be the same message every time to derive the same key
      const zkKeyMessage = `Syzy ZK Encryption Key\nWallet: ${walletAddress}\nVersion: 1`
      const zkKeyMessageEncoded = new TextEncoder().encode(zkKeyMessage)
      console.log('[AutoLogin] Requesting ZK encryption key signature...')
      const zkKeySignature = await provider.signMessage(zkKeyMessageEncoded)
      const zkKeySignatureBase58 = bs58.encode(zkKeySignature)

      await setEncryptionKey(zkKeySignatureBase58)
      console.log('[AutoLogin] ZK encryption key derived successfully')
      return true
    } catch (error) {
      if (error instanceof Error && error.message.includes('User rejected')) {
        console.log('[AutoLogin] User rejected ZK key signature')
      } else {
        console.error('[AutoLogin] Failed to derive ZK encryption key:', error)
      }
      return false
    }
  }, [walletProvider])

  // Production login: full signature flow
  const performProdLogin = useCallback(async (walletAddress: string) => {
    if (isLoggingIn.current) return
    isLoggingIn.current = true

    try {
      const provider = walletProvider as SolanaWalletProvider
      if (!provider?.signMessage) {
        console.error('[AutoLogin] Wallet does not support message signing')
        return
      }

      // Step 1: Get nonce from backend
      console.log('[AutoLogin] Getting nonce for', walletAddress)
      const nonceRes = await apiClient.post('/api/auth/nonce', { walletAddress })
      const nonceData = nonceRes.data?.data || nonceRes.data

      if (!nonceData?.message) {
        console.error('[AutoLogin] No message in nonce response:', nonceRes.data)
        return
      }

      // Step 2: Sign the message
      console.log('[AutoLogin] Requesting signature...')
      const encodedMessage = new TextEncoder().encode(nonceData.message)
      const signature = await provider.signMessage(encodedMessage)

      if (!signature) {
        console.error('[AutoLogin] No signature returned')
        return
      }

      const signatureBase58 = bs58.encode(signature)

      // Step 3: Verify signature with backend
      console.log('[AutoLogin] Verifying signature...')
      const verifyRes = await apiClient.post('/api/auth/verify', {
        walletAddress,
        signature: signatureBase58,
        message: nonceData.message,
      })

      const authData = verifyRes.data?.data || verifyRes.data

      if (!authData?.access_token) {
        console.error('[AutoLogin] No access_token in verify response:', verifyRes.data)
        return
      }

      setAuthState({
        accessToken: authData.access_token,
        refreshToken: authData.refresh_token,
        user: authData.user,
      })

      // ZK encryption key derivation is handled by the re-derive effect
      // which fires when isAuthenticated becomes true

      console.log('[AutoLogin] Production login successful!')
    } catch (error) {
      // User rejected signature - disconnect wallet and show guide
      if (error instanceof Error && error.message.includes('User rejected')) {
        console.log('[AutoLogin] User rejected signature request, disconnecting...')
        disconnect()
        toast.error('Signature required', {
          description: 'You need to sign the message to authenticate. Please reconnect your wallet and approve the signature request.',
          duration: 6000,
        })
      } else {
        console.error('[AutoLogin] Login failed:', error)
      }
    } finally {
      isLoggingIn.current = false
    }
  }, [walletProvider, setAuthState, disconnect])

  // Dev login: bypass signature
  const performDevLogin = useCallback(async (walletAddress: string) => {
    if (isLoggingIn.current) return
    isLoggingIn.current = true

    try {
      console.log('[AutoLogin] Dev login for', walletAddress)
      const res = await apiClient.post('/api/auth/dev-login', { walletAddress })
      const authData = res.data?.data || res.data

      if (!authData?.access_token) {
        console.error('[AutoLogin] No access_token in dev-login response:', res.data)
        return
      }

      setAuthState({
        accessToken: authData.access_token,
        refreshToken: authData.refresh_token,
        user: authData.user,
      })

      // Dev mode uses deterministic key
      await setEncryptionKey(`dev-mode-key-${walletAddress}`)

      // Restore encrypted notes from backend into memory
      await fetchNotesFromBackend()

      console.log('[AutoLogin] Dev login successful!')
    } catch (error) {
      console.error('[AutoLogin] Dev login failed:', error)
    } finally {
      isLoggingIn.current = false
    }
  }, [setAuthState])

  const performLogin = isDev ? performDevLogin : performProdLogin
  const loginRef = useRef(performLogin)
  loginRef.current = performLogin

  // Handle wallet connection, disconnection, and switching
  useEffect(() => {
    if (!isConnected || !address) {
      // Wallet disconnected — clean up auth state and cache
      if (lastAddress.current !== null) {
        console.log('[AutoLogin] Wallet disconnected, cleaning up...')
        logout()
        clearEncryptionKey()
        queryClient.clear()
      }
      lastAddress.current = null
      return
    }

    // In production, wait for wallet provider to be ready
    if (!isDev && !walletProvider) {
      return
    }

    const isNewConnection = lastAddress.current !== address
    if (isNewConnection) {
      if (lastAddress.current !== null) {
        // Wallet switched (A→B) — clean up old session and re-login
        console.log('[AutoLogin] Wallet switched, cleaning up old session...')
        logout()
        clearEncryptionKey()
        queryClient.clear()
        lastAddress.current = address
        loginRef.current(address)
      } else {
        // First load / page refresh — check for existing persisted session
        const { isAuthenticated: hasSession, user } = useAuthStore.getState()
        if (hasSession && user?.walletAddress === address) {
          // Valid JWT tokens in localStorage — skip login, no wallet popup
          lastAddress.current = address
          console.log('[AutoLogin] Restored persisted session for', address)
        } else {
          // No session — need full login
          lastAddress.current = address
          console.log('[AutoLogin] New connection detected, logging in...')
          loginRef.current(address)
        }
      }
    }
  }, [isConnected, address, walletProvider, isDev, logout, queryClient])

  // Handle token expiration - re-authenticate (deferred if a tx is in progress)
  useEffect(() => {
    const handleTokenExpired = () => {
      if (!isConnected || !address || (!isDev && !walletProvider)) return

      if (isTxLocked()) {
        console.log('[AutoLogin] Token expired but tx in progress, deferring re-auth...')
        onTxUnlock(() => {
          console.log('[AutoLogin] Tx finished, re-authenticating now...')
          loginRef.current(address)
        })
        return
      }

      console.log('[AutoLogin] Token expired, re-authenticating...')
      loginRef.current(address)
    }

    window.addEventListener('auth:token-expired', handleTokenExpired)
    return () => window.removeEventListener('auth:token-expired', handleTokenExpired)
  }, [isConnected, address, walletProvider, isDev])

  // Fallback: wallet connected but not authenticated (e.g., page refresh)
  useEffect(() => {
    if (!isAuthenticated && isConnected && address && (isDev || walletProvider)) {
      console.log('[AutoLogin] Connected but not authenticated, will attempt login in 2s...')
      const timer = setTimeout(() => {
        if (isLoggingIn.current) return
        // Defer if a ZK transaction is in progress — signMessage would conflict
        // with signTransaction and cause Phantom to silently reject both.
        if (isTxLocked()) {
          console.log('[AutoLogin] Tx in progress, deferring fallback login...')
          onTxUnlock(() => {
            if (!isLoggingIn.current) loginRef.current(address)
          })
          return
        }
        loginRef.current(address)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, isConnected, address, walletProvider, isDev])

  // Single source of truth for ZK encryption key derivation.
  // Fires after login (isAuthenticated becomes true) or on page refresh.
  // Try to restore from sessionStorage first to avoid prompting the wallet.
  const deriveKeyRef = useRef(deriveEncryptionKey)
  deriveKeyRef.current = deriveEncryptionKey
  const isDerivingKey = useRef(false)

  useEffect(() => {
    if (!isAuthenticated || !isConnected || !address || !walletProvider) return
    if (isDerivingKey.current) return
    isDerivingKey.current = true

    const ensureKey = async () => {
      try {
        // Try restoring from memory or sessionStorage first (handles page refresh)
        if (await restoreEncryptionKey()) {
          console.log('[AutoLogin] Encryption key restored')
        } else if (isDev) {
          await setEncryptionKey(`dev-mode-key-${address}`)
          console.log('[AutoLogin] Dev encryption key set')
        } else {
          // No cached key — must prompt wallet for ZK encryption signature
          console.log('[AutoLogin] Requesting ZK encryption key signature...')
          await deriveKeyRef.current(address)
        }

        // Sync notes from backend after key is ready
        if (hasEncryptionKey()) {
          try {
            await fetchNotesFromBackend()
            console.log('[AutoLogin] ZK notes synced')
          } catch (error) {
            console.warn('[AutoLogin] Failed to sync ZK notes:', error)
          }
        }
      } finally {
        isDerivingKey.current = false
      }
    }

    ensureKey()
  }, [isAuthenticated, isConnected, address, walletProvider, isDev])

  return null
}
