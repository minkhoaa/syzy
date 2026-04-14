"use client";

import { useQuery } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import { useAppKitAccount } from "@reown/appkit/react";
import { apiClient, $ } from "@/lib/kubb";
import { usePredictionMarket } from "@/features/trading/hooks/use-prediction-market";
import type { MarketAccount } from "@/types/prediction-market.types";
import type { BackendMarket } from "@/app/(dashboard)/markets/_utils/market-list-adapter";

/** Unwrap NestJS { success, data } wrapper */
function unwrap<T>(payload: unknown): T {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    "success" in payload
  ) {
    return (payload as Record<string, unknown>).data as T;
  }
  return payload as T;
}

export interface SubMarketData {
  dbData: BackendMarket;
  chainData: MarketAccount | null;
  stats: {
    yesPrice: number;
    noPrice: number;
    yesChances: number;
    noChances: number;
    yesReserves: number;
    noReserves: number;
    totalReserves: number;
    volume: number;
  } | null;
  balances: {
    yesBalance: number;
    noBalance: number;
    yesValueInSol: number;
    noValueInSol: number;
  } | null;
}

export interface MultiMarketDetailResult {
  parentMarket: BackendMarket | null;
  subMarkets: SubMarketData[];
  loading: boolean;
  refresh: () => void;
}

export function useMultiMarketDetail(slug: string): MultiMarketDetailResult {
  const { getMarket, getUserTokenBalances } = usePredictionMarket();
  const { address, isConnected } = useAppKitAccount();

  // 1. Fetch parent market by slug
  const {
    data: parentMarket,
    isLoading: parentLoading,
    refetch: refetchParent,
  } = useQuery({
    queryKey: ["market-by-slug", slug],
    queryFn: async () => {
      const res = await apiClient.get(`/api/markets/by-slug/${slug}`);
      return unwrap<BackendMarket>(res.data);
    },
    enabled: !!slug,
    ...$.query,
  });

  // 2. Fetch on-chain data for each sub-market
  const subMarketPdas = parentMarket?.subMarkets?.map((s) => s.marketId) ?? [];
  const {
    data: subMarkets,
    isLoading: subMarketsLoading,
    refetch: refetchSubMarkets,
  } = useQuery({
    queryKey: ["multi-market-chain-data", slug, subMarketPdas.join(","), address],
    queryFn: async () => {
      if (!parentMarket?.subMarkets?.length) return [];

      const rawResults: SubMarketData[] = await Promise.all(
        parentMarket.subMarkets.map(async (sub) => {
          let chainData: MarketAccount | null = null;
          let stats: SubMarketData["stats"] = null;
          let balances: SubMarketData["balances"] = null;

          try {
            const pubkey = new PublicKey(sub.marketId);
            chainData = (await getMarket(pubkey)) ?? null;

            if (chainData) {
              const yesReserves =
                parseFloat(String(chainData.realYesTokenReserves ?? 0)) / 1e6;
              const noReserves =
                parseFloat(String(chainData.realNoTokenReserves ?? 0)) / 1e6;
              const yesSol =
                parseFloat(String(chainData.realYesSolReserves ?? 0)) / 1e9;
              const noSol =
                parseFloat(String(chainData.realNoSolReserves ?? 0)) / 1e9;
              const yesPrice = yesReserves > 0 ? yesSol / yesReserves : 0;
              const noPrice = noReserves > 0 ? noSol / noReserves : 0;
              const totalUnitCost = yesPrice + noPrice;
              const yesChances =
                totalUnitCost > 0 ? (yesPrice / totalUnitCost) * 100 : 50;
              const noChances =
                totalUnitCost > 0 ? (noPrice / totalUnitCost) * 100 : 50;
              const volume = yesSol + noSol;

              stats = {
                yesPrice,
                noPrice,
                yesChances,
                noChances,
                yesReserves,
                noReserves,
                totalReserves: yesReserves + noReserves,
                volume,
              };

              // Fetch user balances if connected
              if (isConnected && address && chainData.yesTokenMint && chainData.noTokenMint) {
                try {
                  const bal = await getUserTokenBalances(
                    chainData.yesTokenMint,
                    chainData.noTokenMint
                  );
                  balances = bal ?? null;
                } catch {
                  // Non-critical
                }
              }
            }
          } catch {
            // Chain data fetch failed — return null chainData
          }

          return { dbData: sub, chainData, stats, balances };
        })
      );

      // Normalize probabilities so they sum to 100% for mutually exclusive outcomes
      const totalRawProb = rawResults.reduce(
        (sum, r) => sum + (r.stats?.yesChances ?? 0),
        0
      );
      if (totalRawProb > 0) {
        for (const r of rawResults) {
          if (r.stats) {
            const normalized = (r.stats.yesChances / totalRawProb) * 100;
            r.stats.yesChances = normalized;
            r.stats.noChances = 100 - normalized;
          }
        }
      }

      return rawResults;
    },
    enabled: !!parentMarket?.subMarkets?.length,
    staleTime: 10_000,
    gcTime: 30_000,
    refetchInterval: 15_000,
  });

  const refresh = () => {
    refetchParent();
    refetchSubMarkets();
  };

  return {
    parentMarket: parentMarket ?? null,
    subMarkets: subMarkets ?? [],
    loading: parentLoading || subMarketsLoading,
    refresh,
  };
}
