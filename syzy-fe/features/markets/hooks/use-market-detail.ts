"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PublicKey } from "@solana/web3.js";
import { useAppKitAccount } from "@reown/appkit/react";
import { usePredictionMarket } from "@/features/trading/hooks/use-prediction-market";
import { MarketAccount } from "@/types/prediction-market.types";
import { toast } from "sonner";

export interface MarketStats {
  yesPrice: number;
  noPrice: number;
  yesChances: number;
  noChances: number;
  yesReserves: number;
  noReserves: number;
  totalReserves: number;
}

export interface UserBalances {
  yesBalance: number;
  noBalance: number;
  yesValueInSol: number;
  noValueInSol: number;
}

export function useMarketDetail(marketAddress: string) {
  const { address, isConnected } = useAppKitAccount();
  const { getMarket, getUserTokenBalances } = usePredictionMarket();
  const [market, setMarket] = useState<MarketAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [balances, setBalances] = useState<UserBalances | undefined>(undefined);
  const lastFetchedAddress = useRef<string | undefined>(undefined);

  const fetchMarket = useCallback(async () => {
    try {
      if (!marketAddress) return;
      const pubkey = new PublicKey(marketAddress);
      const data = await getMarket(pubkey);

      if (data) {
        // getMarket returns normalized MarketAccount (camelCase)
        setMarket(data);

        const yesReserves =
          parseFloat(String(data.realYesTokenReserves ?? 0)) / 1e6;
        const noReserves =
          parseFloat(String(data.realNoTokenReserves ?? 0)) / 1e6;
        const totalReserves = yesReserves + noReserves;

        const yesSol = parseFloat(String(data.realYesSolReserves ?? 0)) / 1e9;
        const noSol = parseFloat(String(data.realNoSolReserves ?? 0)) / 1e9;
        const yesPrice = yesReserves > 0 ? yesSol / yesReserves : 0;
        const noPrice = noReserves > 0 ? noSol / noReserves : 0;

        const totalUnitCost = yesPrice + noPrice;
        const yesChances =
          totalUnitCost > 0 ? (yesPrice / totalUnitCost) * 100 : 50;
        const noChances =
          totalUnitCost > 0 ? (noPrice / totalUnitCost) * 100 : 50;

        setStats({
          yesPrice,
          noPrice,
          yesChances,
          noChances,
          yesReserves,
          noReserves,
          totalReserves,
        });

        const yesMint = data.yesTokenMint;
        const noMint = data.noTokenMint;
        const balanceData =
          yesMint && noMint
            ? await getUserTokenBalances(yesMint, noMint)
            : undefined;
        setBalances(balanceData);
      }
    } catch (error) {
      console.error("Error fetching market:", error);
      toast.error("Failed to load market data");
    } finally {
      setLoading(false);
    }
  }, [marketAddress, getMarket, getUserTokenBalances]);

  useEffect(() => {
    fetchMarket();
    const interval = setInterval(fetchMarket, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [fetchMarket, refreshKey]);

  // Refetch balances when wallet connects/changes (handles page refresh scenario)
  useEffect(() => {
    if (isConnected && address && address !== lastFetchedAddress.current && market) {
      lastFetchedAddress.current = address;
      // Refetch balances now that wallet is connected
      const refetchBalances = async () => {
        const yesMint = market.yesTokenMint;
        const noMint = market.noTokenMint;
        if (yesMint && noMint) {
          const balanceData = await getUserTokenBalances(yesMint, noMint);
          setBalances(balanceData);
        }
      };
      refetchBalances();
    } else if (!isConnected || !address) {
      lastFetchedAddress.current = undefined;
    }
  }, [isConnected, address, market, getUserTokenBalances]);

  const refresh = () => {
    setLoading(true);
    setRefreshKey((prev) => prev + 1);
  };

  return {
    market,
    stats,
    balances,
    loading,
    refresh,
  };
}
