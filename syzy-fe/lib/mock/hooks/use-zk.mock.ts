"use client";

import { useCallback, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { toast } from "sonner";

import {
  useMockChainStore,
  useMockWalletStore,
} from "@/lib/mock/stores/mock-chain-store";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ShieldedNote {
  id: string;
  commitment: string;
  nullifier: string;
  amount: number;
  type: "SOL" | "YES" | "NO";
  marketAddress?: string;
  isSpent: boolean;
  leafIndex?: number;
  batchNumber?: number;
  createdAt: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function fakeTxSig(): string {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let sig = "";
  for (let i = 0; i < 88; i++) sig += chars[Math.floor(Math.random() * chars.length)];
  return sig;
}

function fakeHash(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useZK() {
  const wallet = useMockWalletStore();
  const { adjustWalletBalance } = useMockChainStore();

  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [shieldedBalance, setShieldedBalance] = useState(0);
  const [notes, setNotes] = useState<ShieldedNote[]>([]);

  // ── fetchShieldedBalance ──────────────────────────────────────────

  const fetchShieldedBalance = useCallback(() => {
    const balance = notes
      .filter((n: ShieldedNote) => n.type === "SOL" && !n.isSpent)
      .reduce((acc: number, curr: ShieldedNote) => acc + curr.amount, 0);
    setShieldedBalance(balance);
  }, [notes]);

  // ── shield ────────────────────────────────────────────────────────

  const shield = useCallback(
    async (amount: number, marketAddress?: string | PublicKey) => {
      if (!wallet.isConnected) {
        toast.error("Please connect your wallet first");
        return undefined;
      }
      if (amount <= 0) {
        toast.error("Amount must be greater than 0");
        return undefined;
      }

      setIsGeneratingProof(true);
      const toastId = toast.loading("Generating ZK proof...");

      try {
        await delay(2000);

        const newNote: ShieldedNote = {
          id: fakeHash().slice(0, 16),
          commitment: fakeHash(),
          nullifier: fakeHash(),
          amount,
          type: "SOL",
          marketAddress: typeof marketAddress === "string"
            ? marketAddress
            : marketAddress?.toBase58(),
          isSpent: false,
          leafIndex: notes.length,
          batchNumber: Math.floor(notes.length / 16),
          createdAt: Date.now(),
        };

        setNotes((prev: ShieldedNote[]) => [...prev, newNote]);
        adjustWalletBalance(-amount);
        setShieldedBalance((prev: number) => prev + amount);

        toast.dismiss(toastId);
        toast.success("Funds shielded successfully!");
        return fakeTxSig();
      } catch (error) {
        toast.dismiss(toastId);
        toast.error("Failed to shield: " + (error as Error).message);
        return undefined;
      } finally {
        setIsGeneratingProof(false);
      }
    },
    [wallet.isConnected, notes, adjustWalletBalance]
  );

  // ── unshield ──────────────────────────────────────────────────────

  const unshield = useCallback(
    async (note: ShieldedNote, _marketAddress?: PublicKey) => {
      if (!wallet.isConnected) {
        toast.error("Please connect your wallet first");
        return undefined;
      }

      setIsGeneratingProof(true);
      const toastId = toast.loading("Generating ZK proof...");

      try {
        await delay(2000);

        setNotes((prev: ShieldedNote[]) =>
          prev.map((n) => (n.id === note.id ? { ...n, isSpent: true } : n))
        );
        adjustWalletBalance(note.amount);
        setShieldedBalance((prev: number) => Math.max(0, prev - note.amount));

        toast.dismiss(toastId);
        toast.success("Funds unshielded successfully!");
        return fakeTxSig();
      } catch (error) {
        toast.dismiss(toastId);
        toast.error("Failed to unshield: " + (error as Error).message);
        return undefined;
      } finally {
        setIsGeneratingProof(false);
      }
    },
    [wallet.isConnected, adjustWalletBalance]
  );

  // ── privateSwap ───────────────────────────────────────────────────

  const privateSwap = useCallback(
    async (
      solNote: ShieldedNote,
      marketAddress: PublicKey,
      outcome: number,
      _amount?: number
    ) => {
      if (!wallet.isConnected) {
        toast.error("Please connect your wallet first");
        return undefined;
      }

      setIsGeneratingProof(true);
      const toastId = toast.loading("Generating ZK swap proof...");

      try {
        await delay(2500);

        // Mark original SOL note as spent
        setNotes((prev: ShieldedNote[]) =>
          prev.map((n) => (n.id === solNote.id ? { ...n, isSpent: true } : n))
        );

        // Create a new token note
        const tokenNote: ShieldedNote = {
          id: fakeHash().slice(0, 16),
          commitment: fakeHash(),
          nullifier: fakeHash(),
          amount: solNote.amount * 0.95, // simulate some slippage
          type: outcome === 0 ? "YES" : "NO",
          marketAddress: marketAddress.toBase58(),
          isSpent: false,
          leafIndex: notes.length,
          batchNumber: Math.floor(notes.length / 16),
          createdAt: Date.now(),
        };

        setNotes((prev: ShieldedNote[]) => [...prev, tokenNote]);
        setShieldedBalance((prev: number) => Math.max(0, prev - solNote.amount));

        toast.dismiss(toastId);
        toast.success("Private swap completed!");
        return fakeTxSig();
      } catch (error) {
        toast.dismiss(toastId);
        toast.error("Private swap failed: " + (error as Error).message);
        return undefined;
      } finally {
        setIsGeneratingProof(false);
      }
    },
    [wallet.isConnected, notes]
  );

  // ── privateSell ───────────────────────────────────────────────────

  const privateSell = useCallback(
    async (
      tokenNote: ShieldedNote,
      marketAddress: PublicKey,
      _amount?: number
    ) => {
      if (!wallet.isConnected) {
        toast.error("Please connect your wallet first");
        return undefined;
      }

      setIsGeneratingProof(true);
      const toastId = toast.loading("Generating ZK sell proof...");

      try {
        await delay(2500);

        // Mark token note as spent, create SOL note
        setNotes((prev: ShieldedNote[]) =>
          prev.map((n) => (n.id === tokenNote.id ? { ...n, isSpent: true } : n))
        );

        const solNote: ShieldedNote = {
          id: fakeHash().slice(0, 16),
          commitment: fakeHash(),
          nullifier: fakeHash(),
          amount: tokenNote.amount * 0.95,
          type: "SOL",
          marketAddress: marketAddress.toBase58(),
          isSpent: false,
          leafIndex: notes.length,
          batchNumber: Math.floor(notes.length / 16),
          createdAt: Date.now(),
        };

        setNotes((prev: ShieldedNote[]) => [...prev, solNote]);
        setShieldedBalance((prev: number) => prev + solNote.amount);

        toast.dismiss(toastId);
        toast.success("Private sell completed!");
        return fakeTxSig();
      } catch (error) {
        toast.dismiss(toastId);
        toast.error("Private sell failed: " + (error as Error).message);
        return undefined;
      } finally {
        setIsGeneratingProof(false);
      }
    },
    [wallet.isConnected, notes]
  );

  // ── privateSellBatch ──────────────────────────────────────────────

  const privateSellBatch = useCallback(
    async (
      tokenNotes: ShieldedNote[],
      marketAddress: PublicKey,
      _onProgress?: (step: number, total: number, status: string) => void
    ): Promise<{ txs: string[]; notes: ShieldedNote[] } | undefined> => {
      if (!wallet.isConnected) return undefined;

      setIsGeneratingProof(true);
      const toastId = toast.loading(`Selling ${tokenNotes.length} notes privately...`);

      try {
        await delay(3000);
        // Mark all as spent
        const spentIds = new Set(tokenNotes.map((n: ShieldedNote) => n.id));
        setNotes((prev: ShieldedNote[]) =>
          prev.map((n) => (spentIds.has(n.id) ? { ...n, isSpent: true } : n))
        );

        const totalAmount = tokenNotes.reduce((a: number, n: ShieldedNote) => a + n.amount, 0);
        const solNote: ShieldedNote = {
          id: fakeHash().slice(0, 16),
          commitment: fakeHash(),
          nullifier: fakeHash(),
          amount: totalAmount * 0.95,
          type: "SOL",
          marketAddress: marketAddress.toBase58(),
          isSpent: false,
          leafIndex: notes.length,
          batchNumber: Math.floor(notes.length / 16),
          createdAt: Date.now(),
        };
        setNotes((prev: ShieldedNote[]) => [...prev, solNote]);
        setShieldedBalance((prev: number) => prev + solNote.amount);

        toast.dismiss(toastId);
        toast.success(`Batch sell: ${tokenNotes.length} notes sold privately`);
        return { txs: [fakeTxSig()], notes: [solNote] };
      } finally {
        setIsGeneratingProof(false);
      }
    },
    [wallet.isConnected, notes]
  );

  // ── privateSellViaTee ─────────────────────────────────────────────

  const privateSellViaTee = useCallback(
    async (
      tokenNotes: ShieldedNote[],
      marketAddress: PublicKey,
      _onProgress?: (step: number, total: number, status: string) => void
    ): Promise<{ txs: string[]; notes: ShieldedNote[] }> => {
      setIsGeneratingProof(true);
      const toastId = toast.loading("TEE preparing batch sell...");

      try {
        await delay(2000);
        const spentIds = new Set(tokenNotes.map((n: ShieldedNote) => n.id));
        setNotes((prev: ShieldedNote[]) =>
          prev.map((n) => (spentIds.has(n.id) ? { ...n, isSpent: true } : n))
        );

        const totalAmount = tokenNotes.reduce((a: number, n: ShieldedNote) => a + n.amount, 0);
        const solNote: ShieldedNote = {
          id: fakeHash().slice(0, 16),
          commitment: fakeHash(),
          nullifier: fakeHash(),
          amount: totalAmount * 0.95,
          type: "SOL",
          marketAddress: marketAddress.toBase58(),
          isSpent: false,
          createdAt: Date.now(),
        };
        setNotes((prev: ShieldedNote[]) => [...prev, solNote]);
        setShieldedBalance((prev: number) => prev + solNote.amount);

        toast.dismiss(toastId);
        toast.success("TEE batch sell complete!");
        return { txs: [fakeTxSig()], notes: [solNote] };
      } finally {
        setIsGeneratingProof(false);
      }
    },
    []
  );

  // ── privateClaim ──────────────────────────────────────────────────

  const privateClaim = useCallback(
    async (tokenNote: ShieldedNote, _marketAddress: PublicKey) => {
      if (!wallet.isConnected) {
        toast.error("Please connect your wallet first");
        return undefined;
      }

      setIsGeneratingProof(true);
      const toastId = toast.loading("Generating Private Claim Proof...");

      try {
        await delay(2500);

        setNotes((prev: ShieldedNote[]) =>
          prev.map((n) => (n.id === tokenNote.id ? { ...n, isSpent: true } : n))
        );

        // Create SOL output note (claiming winnings)
        const solNote: ShieldedNote = {
          id: fakeHash().slice(0, 16),
          commitment: fakeHash(),
          nullifier: fakeHash(),
          amount: tokenNote.amount,
          type: "SOL",
          isSpent: false,
          leafIndex: notes.length,
          batchNumber: Math.floor(notes.length / 16),
          createdAt: Date.now(),
        };

        setNotes((prev: ShieldedNote[]) => [...prev, solNote]);
        setShieldedBalance((prev: number) => prev + solNote.amount);

        toast.dismiss(toastId);
        toast.success("Private claim completed!");
        return { claimTx: fakeTxSig(), note: solNote };
      } catch (error) {
        toast.dismiss(toastId);
        toast.error("Private claim failed: " + (error as Error).message);
        return undefined;
      } finally {
        setIsGeneratingProof(false);
      }
    },
    [wallet.isConnected, notes]
  );

  // ── privateClaimViaTee ────────────────────────────────────────────

  const privateClaimViaTee = useCallback(
    async (
      tokenNotes: ShieldedNote[],
      _marketAddress: PublicKey,
      _onProgress?: (step: number, total: number, status: string) => void
    ): Promise<{ txs: string[]; notes: ShieldedNote[] }> => {
      setIsGeneratingProof(true);
      const toastId = toast.loading(`TEE preparing batch claim: ${tokenNotes.length} notes...`);

      try {
        await delay(2000);
        const spentIds = new Set(tokenNotes.map((n: ShieldedNote) => n.id));
        setNotes((prev: ShieldedNote[]) =>
          prev.map((n) => (spentIds.has(n.id) ? { ...n, isSpent: true } : n))
        );

        const totalAmount = tokenNotes.reduce((a: number, n: ShieldedNote) => a + n.amount, 0);
        adjustWalletBalance(totalAmount);

        toast.dismiss(toastId);
        toast.success("TEE batch claim & unshield complete!");
        return { txs: [fakeTxSig()], notes: [] };
      } finally {
        setIsGeneratingProof(false);
      }
    },
    [adjustWalletBalance]
  );

  // ── privateClaimBatch ─────────────────────────────────────────────

  const privateClaimBatch = useCallback(
    async (
      tokenNotes: ShieldedNote[],
      marketAddress: PublicKey,
      onProgress?: (step: number, total: number, status: string) => void
    ): Promise<{ txs: string[]; notes: ShieldedNote[] } | undefined> => {
      if (!wallet.isConnected) return undefined;
      if (tokenNotes.length === 0) return { txs: [], notes: [] };
      return privateClaimViaTee(tokenNotes, marketAddress, onProgress);
    },
    [wallet.isConnected, privateClaimViaTee]
  );

  // ── splitTokenNote ────────────────────────────────────────────────

  const splitTokenNote = useCallback(
    async (note: ShieldedNote, amounts: number[]) => {
      if (!wallet.isConnected) {
        toast.error("Please connect your wallet first");
        return undefined;
      }

      setIsGeneratingProof(true);
      const toastId = toast.loading("Splitting token note...");

      try {
        await delay(2000);

        setNotes((prev: ShieldedNote[]) =>
          prev.map((n) => (n.id === note.id ? { ...n, isSpent: true } : n))
        );

        const newNotes: ShieldedNote[] = amounts.map((amount, i) => ({
          id: fakeHash().slice(0, 16),
          commitment: fakeHash(),
          nullifier: fakeHash(),
          amount,
          type: note.type,
          marketAddress: note.marketAddress,
          isSpent: false,
          leafIndex: notes.length + i,
          batchNumber: Math.floor((notes.length + i) / 16),
          createdAt: Date.now(),
        }));

        setNotes((prev: ShieldedNote[]) => [...prev, ...newNotes]);

        toast.dismiss(toastId);
        toast.success(`Note split into ${amounts.length} notes!`);
        return fakeTxSig();
      } finally {
        setIsGeneratingProof(false);
      }
    },
    [wallet.isConnected, notes]
  );

  // ── autoShieldAndSwap ─────────────────────────────────────────────

  const autoShieldAndSwap = useCallback(
    async (
      amount: number,
      marketAddress: PublicKey,
      outcome: number
    ) => {
      if (!wallet.isConnected) {
        toast.error("Please connect your wallet first");
        return undefined;
      }

      setIsGeneratingProof(true);
      const toastId = toast.loading("Shield + Swap in progress...");

      try {
        await delay(3000);

        adjustWalletBalance(-amount);

        const tokenNote: ShieldedNote = {
          id: fakeHash().slice(0, 16),
          commitment: fakeHash(),
          nullifier: fakeHash(),
          amount: amount * 0.95,
          type: outcome === 0 ? "YES" : "NO",
          marketAddress: marketAddress.toBase58(),
          isSpent: false,
          leafIndex: notes.length,
          batchNumber: Math.floor(notes.length / 16),
          createdAt: Date.now(),
        };

        setNotes((prev: ShieldedNote[]) => [...prev, tokenNote]);

        toast.dismiss(toastId);
        toast.success("Shield + Swap completed privately!");
        return fakeTxSig();
      } catch (error) {
        toast.dismiss(toastId);
        toast.error("Shield + Swap failed: " + (error as Error).message);
        return undefined;
      } finally {
        setIsGeneratingProof(false);
      }
    },
    [wallet.isConnected, notes, adjustWalletBalance]
  );

  // ── Stub utility functions ────────────────────────────────────────

  const getShieldedPoolAddress = useCallback(
    (_marketAddress: PublicKey): PublicKey => PublicKey.default,
    []
  );

  const getPoolIdentifier = useCallback(
    async (_poolPda: PublicKey): Promise<number[] | null> => [0, 0, 0, 0, 0, 0, 0, 0],
    []
  );

  const getNullifierShardAddress = useCallback(
    (_poolIdentifier: number[], _nullifier: string, _prefixLen: number): PublicKey =>
      PublicKey.default,
    []
  );

  const findActiveShardAddress = useCallback(
    async (_poolIdentifier: number[], _nullifier: string) => ({
      address: PublicKey.default,
      prefixLen: 1,
      prefix: [0],
    }),
    []
  );

  const splitShardIfNeeded = useCallback(
    async (
      _poolIdentifier: number[],
      _prefixLen: number,
      _prefix: number[],
      _marketAddress: PublicKey
    ): Promise<boolean> => false,
    []
  );

  const ensureShardReady = useCallback(
    async (
      _poolIdentifier: number[],
      _nullifier: string,
      _marketAddress: PublicKey,
      _connection?: unknown
    ): Promise<PublicKey> => PublicKey.default,
    []
  );

  // Stub getMarket & calculateBuyOutput to mirror the real hook
  const getMarket = useCallback(
    async (_marketAddress: PublicKey) => undefined,
    []
  );

  const calculateBuyOutput = useCallback(
    async (
      _yesToken: PublicKey,
      _noToken: PublicKey,
      _solAmount: number,
      _tokenType: number
    ): Promise<number | undefined> => undefined,
    []
  );

  return {
    shield,
    unshield,
    privateSwap,
    privateSell,
    privateSellBatch,
    privateSellViaTee,
    privateClaim,
    privateClaimViaTee,
    privateClaimBatch,
    splitTokenNote,
    autoShieldAndSwap,
    isGeneratingProof,
    shieldedBalance,
    setShieldedBalance,
    fetchShieldedBalance,
    findActiveShardAddress,
    splitShardIfNeeded,
    ensureShardReady,
    getShieldedPoolAddress,
    getPoolIdentifier,
    getNullifierShardAddress,
    getMarket,
    calculateBuyOutput,
    teeAvailable: false,
  };
}
