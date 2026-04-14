"use client";

import { useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { toast } from "sonner";

import { useMockWalletStore } from "@/lib/mock/stores/mock-chain-store";

// ---------------------------------------------------------------------------
// Types (matching the real hook's return)
// ---------------------------------------------------------------------------

export interface CreateFeedResult {
  feedPubkey: PublicKey;
  signature: string;
}

export interface FeedUpdateResult {
  instructions: unknown[];
  lookupTables: unknown[];
}

export interface UseSwitchboardFeedReturn {
  /** Create a Switchboard oracle feed for a pump.fun token's USD market cap */
  createFeed: (tokenMint: string) => Promise<CreateFeedResult | undefined>;
  /** Create a Switchboard oracle feed from any OracleJob definition */
  createCustomFeed: (job: unknown, feedName: string) => Promise<CreateFeedResult | undefined>;
  /** Fetch fresh oracle update instructions to bundle before resolveViaOracle */
  getUpdateIx: (feedPubkey: PublicKey) => Promise<FeedUpdateResult | undefined>;
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

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSwitchboardFeed(): UseSwitchboardFeedReturn {
  const wallet = useMockWalletStore();

  const createFeed = useCallback(
    async (tokenMint: string): Promise<CreateFeedResult | undefined> => {
      if (!wallet.isConnected) {
        toast.error("Please connect your wallet first");
        return undefined;
      }
      if (!tokenMint) {
        toast.error("Token mint address is required");
        return undefined;
      }

      const toastId = toast.loading("Creating oracle feed...");

      try {
        await delay(1000);
        const feedPubkey = PublicKey.unique();
        const signature = fakeTxSig();

        toast.dismiss(toastId);
        toast.success("Oracle feed created!");
        return { feedPubkey, signature };
      } catch (error) {
        toast.dismiss(toastId);
        toast.error("Failed to create feed: " + (error as Error).message);
        return undefined;
      }
    },
    [wallet.isConnected]
  );

  const createCustomFeed = useCallback(
    async (_job: unknown, feedName: string): Promise<CreateFeedResult | undefined> => {
      if (!wallet.isConnected) {
        toast.error("Please connect your wallet first");
        return undefined;
      }

      const toastId = toast.loading(`Creating custom feed "${feedName}"...`);

      try {
        await delay(1500);
        const feedPubkey = PublicKey.unique();
        const signature = fakeTxSig();

        toast.dismiss(toastId);
        toast.success(`Custom feed "${feedName}" created!`);
        return { feedPubkey, signature };
      } catch (error) {
        toast.dismiss(toastId);
        toast.error("Failed to create custom feed: " + (error as Error).message);
        return undefined;
      }
    },
    [wallet.isConnected]
  );

  const getUpdateIx = useCallback(
    async (_feedPubkey: PublicKey): Promise<FeedUpdateResult | undefined> => {
      await delay(500);
      // Return empty instructions — in mock mode, oracle updates are no-ops
      return {
        instructions: [],
        lookupTables: [],
      };
    },
    []
  );

  return { createFeed, createCustomFeed, getUpdateIx };
}
