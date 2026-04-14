"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { PullFeed, AnchorUtils } from "@switchboard-xyz/on-demand";
import { useAppKitAccount } from "@reown/appkit/react";
import { useMarketList } from "@/features/markets/hooks/use-market-list";
import {
  useOracleFeedStore,
  type StoredFeed,
} from "@/features/admin/store/use-oracle-feed-store";
import { METRIC_LABELS } from "@/lib/switchboard/job-templates";
import { detectFeedMetric } from "@/lib/switchboard/detect-metric";
import { RPC_URL, CLUSTER } from "@/lib/constants/network";

export interface FeedMarket {
  publicKey: PublicKey;
  marketName: string;
  question: string;
  slug: string;
  category: string;
  isCompleted: boolean;
  priceTarget: number;
  comparisonType: number | null;
}

export interface OracleFeedWithData {
  address: string;
  name: string;
  authority: string;
  currentValue: number | null;
  lastUpdateTimestamp: number | null;
  maxStaleness: number | null;
  isStale: boolean;
  stalenessRatio: number;
  metricType: number | null;
  metricLabel: string;
  markets: FeedMarket[];
  source: "market" | "created" | "imported" | "scanned";
  userLabel?: string;
  loadError?: string;
}

function decodeName(nameBytes: number[] | Uint8Array | undefined): string {
  if (!nameBytes) return "";
  try {
    return new TextDecoder()
      .decode(new Uint8Array(nameBytes))
      .replace(/\0/g, "")
      .trim();
  } catch {
    return "";
  }
}

function computeStaleness(
  lastUpdateTimestamp: number | null,
  maxStaleness: number | null,
): { isStale: boolean; ratio: number } {
  if (lastUpdateTimestamp == null || maxStaleness == null || maxStaleness === 0) {
    return { isStale: false, ratio: 0 };
  }
  const nowSec = Math.floor(Date.now() / 1000);
  // Switchboard maxStaleness is in slots (~0.4s each)
  const maxStalenessSeconds = maxStaleness * 0.4;
  const elapsed = nowSec - lastUpdateTimestamp;
  const ratio = maxStalenessSeconds > 0 ? elapsed / maxStalenessSeconds : 0;
  return { isStale: ratio > 1, ratio };
}

export function useOracleFeeds() {
  const { markets, isLoading: marketsLoading } = useMarketList();
  const { address: walletAddress } = useAppKitAccount();
  const store = useOracleFeedStore();
  const [feedData, setFeedData] = useState<OracleFeedWithData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<number>(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const programRef = useRef<any>(null);

  const connection = useMemo(() => new Connection(RPC_URL, CLUSTER), []);

  const getProgram = useCallback(async () => {
    if (programRef.current) return programRef.current;
    const program = await AnchorUtils.loadProgramFromConnection(connection);
    programRef.current = program;
    return program;
  }, [connection]);

  // Extract oracle feeds from on-chain markets
  const marketFeedMap = useMemo(() => {
    const map = new Map<string, { metricType: number | null; markets: FeedMarket[] }>();

    for (const market of markets) {
      const oracleFeed = market.account.oracleFeed;
      if (!oracleFeed || oracleFeed.equals(SystemProgram.programId)) continue;

      const feedAddr = oracleFeed.toString();
      const metricType = market.account.metricType ?? null;
      const priceTargetRaw = market.account.priceTarget;
      const priceTarget = priceTargetRaw ? Number(priceTargetRaw) / 1e9 : 0;

      const feedMarket: FeedMarket = {
        publicKey: market.publicKey,
        marketName: market.ticker,
        question: market.question,
        slug: market.slug,
        category: market.category,
        isCompleted: market.account.isCompleted,
        priceTarget,
        comparisonType: market.account.comparisonType ?? null,
      };

      const existing = map.get(feedAddr);
      if (existing) {
        existing.markets.push(feedMarket);
      } else {
        map.set(feedAddr, { metricType, markets: [feedMarket] });
      }
    }

    return map;
  }, [markets]);

  // Merge all feed addresses (market-derived + store-persisted)
  const allFeedAddresses = useMemo(() => {
    const addresses = new Map<
      string,
      {
        source: OracleFeedWithData["source"];
        metricType: number | null;
        metricLabel: string;
        markets: FeedMarket[];
        userLabel?: string;
      }
    >();

    // Market-derived feeds
    for (const [addr, data] of marketFeedMap) {
      addresses.set(addr, {
        source: "market",
        metricType: data.metricType,
        metricLabel:
          data.metricType !== null
            ? (METRIC_LABELS[data.metricType] ?? `Type ${data.metricType}`)
            : "Unknown",
        markets: data.markets,
      });
    }

    // Store-persisted feeds
    for (const feed of store.feeds) {
      const existing = addresses.get(feed.address);
      if (existing) {
        // Merge: keep market data but upgrade metadata if store has it
        if (feed.metricType != null && existing.metricType == null) {
          existing.metricType = feed.metricType;
          existing.metricLabel =
            METRIC_LABELS[feed.metricType] ?? feed.metricLabel ?? existing.metricLabel;
        }
        if (feed.label) existing.userLabel = feed.label;
      } else {
        addresses.set(feed.address, {
          source: feed.source,
          metricType: feed.metricType ?? null,
          metricLabel:
            feed.metricType != null
              ? (METRIC_LABELS[feed.metricType] ?? feed.metricLabel ?? "Unknown")
              : (feed.metricLabel ?? "Unknown"),
          markets: [],
          userLabel: feed.label,
        });
      }
    }

    return addresses;
  }, [marketFeedMap, store.feeds]);

  // Load on-chain data for all feeds
  const refresh = useCallback(async () => {
    const addresses = Array.from(allFeedAddresses.keys());
    if (addresses.length === 0) {
      setFeedData([]);
      return;
    }

    setIsLoading(true);
    try {
      const program = await getProgram();
      const pullFeeds = addresses.map((a) => new PullFeed(program, new PublicKey(a)));

      // Batch load feed data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let loadedData: any[];
      try {
        loadedData = await PullFeed.loadMany(program, pullFeeds);
      } catch {
        // Fallback: load individually
        loadedData = await Promise.all(
          pullFeeds.map(async (feed) => {
            try {
              return await feed.loadData();
            } catch {
              return null;
            }
          }),
        );
      }

      const results: OracleFeedWithData[] = addresses.map((addr, i) => {
        const meta = allFeedAddresses.get(addr)!;
        const data = loadedData[i];

        if (!data) {
          return {
            address: addr,
            name: "",
            authority: "",
            currentValue: null,
            lastUpdateTimestamp: null,
            maxStaleness: null,
            isStale: false,
            stalenessRatio: 0,
            metricType: meta.metricType,
            metricLabel: meta.metricLabel,
            markets: meta.markets,
            source: meta.source,
            userLabel: meta.userLabel,
            loadError: "Failed to load feed data",
          };
        }

        const name = decodeName(data.name);
        const authority = data.authority?.toString() ?? "";
        const maxStaleness = data.maxStaleness ? Number(data.maxStaleness) : null;

        // Decode current value from result (i128 with 18 decimal precision)
        let currentValue: number | null = null;
        let lastUpdateTimestamp: number | null = null;

        if (data.result) {
          try {
            const rawValue = data.result.value ?? data.result;
            if (rawValue != null) {
              currentValue = Number(rawValue.toString()) / 1e18;
            }
          } catch {
            // Ignore decode errors
          }
          if (data.result.slot) {
            // Approximate timestamp from slot (not exact, but good enough for staleness)
          }
        }

        // Use lastUpdateTimestamp if available
        if (data.lastUpdateTimestamp) {
          lastUpdateTimestamp = Number(data.lastUpdateTimestamp);
        }

        const { isStale, ratio } = computeStaleness(lastUpdateTimestamp, maxStaleness);

        return {
          address: addr,
          name,
          authority,
          currentValue,
          lastUpdateTimestamp,
          maxStaleness,
          isStale,
          stalenessRatio: ratio,
          metricType: meta.metricType,
          metricLabel: meta.metricLabel,
          markets: meta.markets,
          source: meta.source,
          userLabel: meta.userLabel,
        };
      });

      setFeedData(results);
      setLastRefreshed(Date.now());
    } catch (error) {
      console.error("[useOracleFeeds] Failed to load feed data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [allFeedAddresses, getProgram]);

  // Add a feed by address — validate, load data, detect metric, save to store
  const addFeedByAddress = useCallback(
    async (address: string): Promise<OracleFeedWithData | null> => {
      try {
        const pubkey = new PublicKey(address);
        const program = await getProgram();
        const feed = new PullFeed(program, pubkey);
        const data = await feed.loadData();

        if (!data) throw new Error("Feed not found on-chain");

        // Auto-detect metric
        const detected = await detectFeedMetric(connection, pubkey);

        const storedFeed: StoredFeed = {
          address,
          source: "imported",
          addedAt: Date.now(),
          metricType: detected?.metricType,
          metricLabel: detected?.label,
        };

        store.addFeed(storedFeed);

        const name = decodeName(data.name);
        const authority = data.authority?.toString() ?? "";
        const maxStaleness = data.maxStaleness ? Number(data.maxStaleness) : null;

        let currentValue: number | null = null;
        let lastUpdateTimestamp: number | null = null;

        if (data.result) {
          try {
            const rawValue = data.result.value ?? data.result;
            if (rawValue != null) {
              currentValue = Number(rawValue.toString()) / 1e18;
            }
          } catch {
            // Ignore
          }
        }
        if (data.lastUpdateTimestamp) {
          lastUpdateTimestamp = Number(data.lastUpdateTimestamp);
        }

        const { isStale, ratio } = computeStaleness(lastUpdateTimestamp, maxStaleness);

        const result: OracleFeedWithData = {
          address,
          name,
          authority,
          currentValue,
          lastUpdateTimestamp,
          maxStaleness,
          isStale,
          stalenessRatio: ratio,
          metricType: detected?.metricType ?? null,
          metricLabel: detected?.label ?? "Unknown",
          markets: marketFeedMap.get(address)?.markets ?? [],
          source: "imported",
        };

        return result;
      } catch (error) {
        console.error("[useOracleFeeds] Failed to add feed:", error);
        return null;
      }
    },
    [connection, getProgram, store, marketFeedMap],
  );

  // Scan for all feeds owned by the connected wallet
  const scanForMyFeeds = useCallback(async (): Promise<StoredFeed[]> => {
    if (!walletAddress) return [];

    setIsScanning(true);
    try {
      const program = await getProgram();
      const walletPubkey = new PublicKey(walletAddress);

      // Load all PullFeed accounts from the Switchboard program
      // We can't use memcmp because authority offset is variable
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allAccounts = await (program.account as any)["pullFeedAccountData"].all();

      const myFeeds: StoredFeed[] = [];
      for (const account of allAccounts) {
        const authority = account.account?.authority;
        if (!authority) continue;

        if (authority.equals(walletPubkey)) {
          const addr = account.publicKey.toString();
          // Skip if already tracked
          if (
            store.feeds.some((f) => f.address === addr) ||
            marketFeedMap.has(addr)
          ) {
            continue;
          }

          myFeeds.push({
            address: addr,
            source: "scanned",
            addedAt: Date.now(),
          });
        }
      }

      return myFeeds;
    } catch (error) {
      console.error("[useOracleFeeds] Scan failed:", error);
      return [];
    } finally {
      setIsScanning(false);
    }
  }, [walletAddress, getProgram, store.feeds, marketFeedMap]);

  const removeFeed = useCallback(
    (address: string) => {
      store.removeFeed(address);
    },
    [store],
  );

  const updateLabel = useCallback(
    (address: string, label: string) => {
      store.updateFeedLabel(address, label);
    },
    [store],
  );

  return {
    feeds: feedData,
    allFeedAddresses,
    isLoading: isLoading || marketsLoading,
    isScanning,
    lastRefreshed,
    refresh,
    addFeedByAddress,
    scanForMyFeeds,
    removeFeed,
    updateLabel,
    bulkAddFeeds: store.bulkAddFeeds,
  };
}
