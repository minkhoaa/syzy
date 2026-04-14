"use client";

import { useCallback, useMemo } from "react";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { PublicKey, Connection, VersionedTransaction, Transaction } from "@solana/web3.js";
import { OracleJob } from "@switchboard-xyz/common";
import { toast } from "sonner";

import { RPC_URL, CLUSTER } from "@/lib/constants/network";
import {
  createPumpFunPriceFeed,
  createGenericFeed,
  fetchFeedUpdateIx,
  type CreateFeedResult,
  type FeedUpdateResult,
  type SwitchboardWallet,
} from "@/lib/switchboard/feed";

export interface UseSwitchboardFeedReturn {
  /** Create a Switchboard oracle feed for a pump.fun token's USD market cap */
  createFeed: (tokenMint: string) => Promise<CreateFeedResult | undefined>;
  /** Create a Switchboard oracle feed from any OracleJob definition */
  createCustomFeed: (job: ReturnType<typeof OracleJob.fromObject>, feedName: string) => Promise<CreateFeedResult | undefined>;
  /** Fetch fresh oracle update instructions to bundle before resolveViaOracle */
  getUpdateIx: (feedPubkey: PublicKey) => Promise<FeedUpdateResult | undefined>;
}

/**
 * Hook for creating and managing Switchboard oracle feeds.
 *
 * Usage for market creators:
 * ```
 * const { createFeed } = useSwitchboardFeed();
 * const feed = await createFeed("TOKEN_MINT_ADDRESS");
 * // feed.feedPubkey → pass to createMarketWithOptions({ oracleFeed: feed.feedPubkey })
 * ```
 *
 * Usage for custom feeds:
 * ```
 * const { createCustomFeed } = useSwitchboardFeed();
 * const job = OracleJob.fromObject({ tasks: [...] });
 * const feed = await createCustomFeed(job, "my-feed");
 * ```
 *
 * Usage for resolution:
 * ```
 * const { getUpdateIx } = useSwitchboardFeed();
 * const update = await getUpdateIx(market.oracleFeed);
 * // update.instructions → bundle before resolveViaOracle in same transaction
 * ```
 */
export function useSwitchboardFeed(): UseSwitchboardFeedReturn {
  const { address } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("solana");

  const connection = useMemo(() => new Connection(RPC_URL, CLUSTER), []);

  const getWallet = useCallback((): SwitchboardWallet | null => {
    if (!walletProvider || !address) return null;
    return {
      publicKey: new PublicKey(address),
      signTransaction: async <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => {
        return await (walletProvider as any).signTransaction(tx);
      },
      signAllTransactions: async <T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> => {
        return await (walletProvider as any).signAllTransactions(txs);
      },
    };
  }, [walletProvider, address]);

  const createFeed = useCallback(
    async (tokenMint: string): Promise<CreateFeedResult | undefined> => {
      const wallet = getWallet();
      if (!wallet) {
        toast.error("Please connect your wallet first");
        return undefined;
      }

      try {
        toast.info("Creating Switchboard oracle feed...");
        const result = await createPumpFunPriceFeed(connection, wallet, tokenMint);
        toast.success(`Oracle feed created: ${result.feedPubkey.toBase58().slice(0, 8)}...`);
        return result;
      } catch (error: any) {
        toast.error(`Failed to create oracle feed: ${error?.message?.slice(0, 80) ?? "Unknown error"}`);
        console.error("createFeed error:", error);
        return undefined;
      }
    },
    [connection, getWallet],
  );

  const createCustomFeed = useCallback(
    async (job: ReturnType<typeof OracleJob.fromObject>, feedName: string): Promise<CreateFeedResult | undefined> => {
      const wallet = getWallet();
      if (!wallet) {
        toast.error("Please connect your wallet first");
        return undefined;
      }

      try {
        toast.info("Creating Switchboard oracle feed...");
        const result = await createGenericFeed(connection, wallet, job, feedName);
        toast.success(`Oracle feed created: ${result.feedPubkey.toBase58().slice(0, 8)}...`);
        return result;
      } catch (error: any) {
        toast.error(`Failed to create oracle feed: ${error?.message?.slice(0, 80) ?? "Unknown error"}`);
        console.error("createCustomFeed error:", error);
        return undefined;
      }
    },
    [connection, getWallet],
  );

  const getUpdateIx = useCallback(
    async (feedPubkey: PublicKey): Promise<FeedUpdateResult | undefined> => {
      const wallet = getWallet();
      try {
        return await fetchFeedUpdateIx(connection, feedPubkey, wallet ?? undefined);
      } catch (error: any) {
        console.error("getUpdateIx error:", error);
        return undefined;
      }
    },
    [connection, getWallet],
  );

  return { createFeed, createCustomFeed, getUpdateIx };
}
