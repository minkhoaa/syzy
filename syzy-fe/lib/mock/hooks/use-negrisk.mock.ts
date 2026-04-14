"use client";

import { useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { toast } from "sonner";

import {
  useMockChainStore,
  useMockWalletStore,
} from "@/lib/mock/stores/mock-chain-store";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LAMPORTS_PER_SOL = 1_000_000_000;

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function fakeTxSig(): string {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let sig = "";
  for (let i = 0; i < 88; i++) sig += chars[Math.floor(Math.random() * chars.length)];
  return sig;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useNegRisk() {
  const wallet = useMockWalletStore();
  const { adjustWalletBalance } = useMockChainStore();

  /**
   * Deposit SOL -> receive YES tokens on ALL N markets in the group.
   */
  const groupSplitCollateral = useCallback(
    async (
      _marketGroupPubkey: PublicKey,
      _markets: { publicKey: PublicKey; yesTokenMint: PublicKey; noTokenMint: PublicKey }[],
      amountLamports: { toNumber: () => number } | number
    ): Promise<string | undefined> => {
      if (!wallet.isConnected) {
        toast.error("Please connect your wallet first");
        return undefined;
      }

      await delay(1500);

      const amount = typeof amountLamports === "number"
        ? amountLamports
        : amountLamports.toNumber();
      adjustWalletBalance(-amount / LAMPORTS_PER_SOL);

      toast.success("Group split collateral deposited!");
      return fakeTxSig();
    },
    [wallet.isConnected, adjustWalletBalance]
  );

  /**
   * Burn YES from ALL N markets -> receive SOL.
   */
  const groupMergeCollateral = useCallback(
    async (
      _marketGroupPubkey: PublicKey,
      _markets: { publicKey: PublicKey; yesTokenMint: PublicKey; noTokenMint: PublicKey }[],
      pairs: { toNumber: () => number } | number
    ): Promise<string | undefined> => {
      if (!wallet.isConnected) {
        toast.error("Please connect your wallet first");
        return undefined;
      }

      await delay(1500);

      const amount = typeof pairs === "number" ? pairs : pairs.toNumber();
      adjustWalletBalance(amount / LAMPORTS_PER_SOL);

      toast.success("Group merge completed -- SOL returned!");
      return fakeTxSig();
    },
    [wallet.isConnected, adjustWalletBalance]
  );

  /**
   * Convert NO on selected markets -> SOL + YES on remaining markets.
   */
  const convertPositions = useCallback(
    async (
      _marketGroupPubkey: PublicKey,
      _markets: { publicKey: PublicKey; yesTokenMint: PublicKey; noTokenMint: PublicKey }[],
      pairs: { toNumber: () => number } | number,
      _selectedMarketIndices: number[]
    ): Promise<string | undefined> => {
      if (!wallet.isConnected) {
        toast.error("Please connect your wallet first");
        return undefined;
      }

      await delay(1500);

      const pairsNum = typeof pairs === "number" ? pairs : pairs.toNumber();
      const k = _selectedMarketIndices.length;
      const solReleased = (k - 1) * pairsNum;

      if (k > 1) {
        adjustWalletBalance(solReleased / LAMPORTS_PER_SOL);
        toast.success(
          `Positions converted! ${(solReleased / LAMPORTS_PER_SOL).toFixed(4)} SOL released`
        );
      } else {
        toast.success("Positions converted!");
      }

      return fakeTxSig();
    },
    [wallet.isConnected, adjustWalletBalance]
  );

  /**
   * Sync UserInfo PDA from ATA balances (fixes v1 claim bug).
   */
  const syncUserInfo = useCallback(
    async (_marketPubkey: PublicKey): Promise<string | undefined> => {
      if (!wallet.isConnected) {
        toast.error("Please connect your wallet first");
        return undefined;
      }
      await delay(1000);
      toast.success("User info synced!");
      return fakeTxSig();
    },
    [wallet.isConnected]
  );

  return {
    syncUserInfo,
    groupSplitCollateral,
    groupMergeCollateral,
    convertPositions,
  };
}
