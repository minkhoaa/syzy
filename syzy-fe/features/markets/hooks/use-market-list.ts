"use client";

import { useEffect, useCallback, useRef } from "react";
import { usePredictionMarket } from "@/features/trading/hooks/use-prediction-market";
import { PublicKey } from "@solana/web3.js";
import type { MarketAccount } from "@/types/prediction-market.types";
import { useMarketListStore } from "@/features/markets/store/use-market-list-store";

export interface MarketItem {
  publicKey: PublicKey;
  account: MarketAccount;
  yesPercentage: number;
  noPercentage: number;
  volume: number;
  timeLeft: string;
  question: string;
  ticker: string;
  image: string;
  slug: string;
  source: string;
  category: string;
  createdAt: number | null;
}

const DEFAULT_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCvFvFW9EqlH20zsrvyQkFmIlHSkGEMF7JME76U4vajye5A2Pyy5NdAeZFeq-9h4lT5l816dykc2a2bgfGlBoA3RVn0JVM0hIGAxroabXjBicOuWN-KSqYN7G0VuGwF0JgnsCc2VcgXS9JPONLvog7_y3HjwCEh83OFcEevhN6W1qnSBYHQFbrChrrPZzsA__03L2t0VqJALuBVUyBvWd00PJji37mSRxPIWo39Mezg_RLqe5kdXQQmHXbIm0oUiOUzgho8U9ynT78";

const POLL_INTERVAL = 60_000; // 60s between polls
const STALE_THRESHOLD = 10_000; // Skip fetch if data is < 10s old

/** Markets excluded from listing pages (dashboard, markets). */
const HIDDEN_MARKETS = new Set([
  "HopzBamAghbyA332VZeeqxSHBqZtvFeJ7iqUsm5pHswq",
  "7wDZGL8Y6eiZZ2BvFwKahauXX7DtvaQNjk4zw3eXVYQ6",
  "2mTY9rAmwaFag9dmXsM4xfiBBT33Mkh6h4z4nDtHMdHe",
  "AVasbR1WeT2GLqX56Ny1oWtubLVaSbLVmKRmEMv8CtBV",
  "4GuVvCiz1eTV653t4Cy4MXhrA9VJVNkgwisUz1GoYKnQ",
  "E7UvUBBm6a76i2XZbgwckfQpWErNPtX2nqAMxBG72Lnj",
  "G9jMnEgZc31pGxc1gQNTSow9MjpUSLRxhejy5mNoq9ZT",
]);

// Global lock to prevent concurrent fetches across hook instances
let fetchInProgress = false;

export function useMarketList() {
  const { getAllMarkets } = usePredictionMarket();
  const { markets, isLoading, lastFetchedAt, setMarkets, setLoading, setLastFetchedAt } =
    useMarketListStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMarkets = useCallback(async () => {
    if (!getAllMarkets) return;

    // Deduplicate: skip if another instance is already fetching
    if (fetchInProgress) return;

    // Skip if data was fetched very recently (by another hook instance)
    if (Date.now() - lastFetchedAt < STALE_THRESHOLD) return;

    fetchInProgress = true;
    setLoading(true);
    try {
      const rawMarkets = await getAllMarkets();
      if (!rawMarkets) return;

      const formatted: MarketItem[] = rawMarkets.map(({ publicKey, account }) => {
        const yesReserves =
          parseFloat(String(account.realYesTokenReserves ?? 0)) / 1e6;
        const noReserves =
          parseFloat(String(account.realNoTokenReserves ?? 0)) / 1e6;

        const yesSol = parseFloat(String(account.realYesSolReserves ?? 0)) / 1e9;
        const noSol = parseFloat(String(account.realNoSolReserves ?? 0)) / 1e9;
        const yesPrice = yesReserves > 0 ? yesSol / yesReserves : 0;
        const noPrice = noReserves > 0 ? noSol / noReserves : 0;
        const totalUnitCost = yesPrice + noPrice;
        const yesPercentage = totalUnitCost > 0 ? (yesPrice / totalUnitCost) * 100 : 50;
        const noPercentage = 100 - yesPercentage;

        const solVolume = (yesSol + noSol);

        const isEnded = account.isCompleted ?? false;
        const endDateTs = account.endDate != null ? Number(account.endDate) : null;
        const now = Math.floor(Date.now() / 1000);
        let timeLeft: string;
        if (isEnded) {
          timeLeft = "Ended";
        } else if (endDateTs != null && endDateTs > 0) {
          if (endDateTs <= now) timeLeft = "Ended";
          else {
            const days = Math.floor((endDateTs - now) / 86400);
            const hours = Math.floor(((endDateTs - now) % 86400) / 3600);
            timeLeft = days > 0 ? `Ends in ${days}d` : hours > 0 ? `Ends in ${hours}h` : "Ends soon";
          }
        } else {
          timeLeft = "Live";
        }

        const imageUrl = account.imageUrl ?? null;
        const slug = account.slug ?? "";
        const source = account.source ?? "Syzy";
        const category = account.category ?? "Crypto";
        const createdAtRaw = account.createdAt;
        const createdAt =
          createdAtRaw != null ? Number(createdAtRaw) : null;

        return {
          publicKey,
          account,
          yesPercentage,
          noPercentage,
          volume: solVolume,
          timeLeft,
          question:
            account.question ??
            `Market ${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`,
          ticker: account.marketName ?? "PRED",
          image: imageUrl || DEFAULT_IMAGE,
          slug,
          source,
          category,
          createdAt,
        };
      });

      setMarkets(formatted.filter((m) => !HIDDEN_MARKETS.has(m.publicKey.toString())));
      setLastFetchedAt(Date.now());
    } catch (e) {
      console.error(e);
    } finally {
      fetchInProgress = false;
      setLoading(false);
    }
  }, [getAllMarkets, lastFetchedAt, setMarkets, setLoading, setLastFetchedAt]);

  useEffect(() => {
    fetchMarkets();
    intervalRef.current = setInterval(fetchMarkets, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchMarkets]);

  return { markets, isLoading, refresh: fetchMarkets };
}
