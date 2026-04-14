"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/kubb";

export type Timeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";

export interface OHLCVData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  volumeUsd: number;
}

export interface TokenSourceData {
  tokenMint: string;
  tokenName: string | null;
  tokenSymbol: string | null;
  activeMarketCount: number;
  isActive: boolean;
  lastFetchedAt: string | null;
  lastPrice: number | null;
}

interface PriceResponse {
  price: number | null;
  cached: boolean;
}

// Stale time configuration by timeframe (in ms)
const STALE_TIME_MAP: Record<Timeframe, number> = {
  "1m": 30 * 1000, // 30 seconds
  "5m": 2 * 60 * 1000, // 2 minutes
  "15m": 5 * 60 * 1000, // 5 minutes
  "1h": 15 * 60 * 1000, // 15 minutes
  "4h": 30 * 60 * 1000, // 30 minutes
  "1d": 60 * 60 * 1000, // 1 hour
};

// Refetch interval configuration by timeframe (in ms)
const REFETCH_INTERVAL_MAP: Record<Timeframe, number> = {
  "1m": 60 * 1000, // 1 minute
  "5m": 5 * 60 * 1000, // 5 minutes
  "15m": 15 * 60 * 1000, // 15 minutes
  "1h": 30 * 60 * 1000, // 30 minutes
  "4h": 60 * 60 * 1000, // 1 hour
  "1d": 2 * 60 * 60 * 1000, // 2 hours
};

/**
 * Hook to fetch OHLCV data for a pump.fun token.
 */
export function usePumpTokenOHLCV(
  tokenMint: string | null | undefined,
  timeframe: Timeframe = "1h",
  options?: {
    from?: string;
    to?: string;
    limit?: number;
    enabled?: boolean;
  }
) {
  const { from, to, limit = 100, enabled = true } = options || {};

  return useQuery({
    queryKey: ["pump-ohlcv", tokenMint, timeframe, from, to, limit],
    queryFn: async (): Promise<OHLCVData[]> => {
      if (!tokenMint) return [];

      const params = new URLSearchParams();
      params.set("timeframe", timeframe);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (limit) params.set("limit", limit.toString());

      const response = await apiClient.get<OHLCVData[]>(
        `/api/token-data/${tokenMint}/ohlcv?${params.toString()}`
      );

      return response.data;
    },
    enabled: enabled && !!tokenMint,
    staleTime: STALE_TIME_MAP[timeframe],
    refetchInterval: REFETCH_INTERVAL_MAP[timeframe],
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

/**
 * Hook to fetch the latest price for a pump.fun token.
 */
export function usePumpTokenPrice(
  tokenMint: string | null | undefined,
  options?: {
    enabled?: boolean;
  }
) {
  const { enabled = true } = options || {};

  return useQuery({
    queryKey: ["pump-price", tokenMint],
    queryFn: async (): Promise<number | null> => {
      if (!tokenMint) return null;

      const response = await apiClient.get<PriceResponse>(
        `/api/token-data/${tokenMint}/price`
      );

      return response.data.price;
    },
    enabled: enabled && !!tokenMint,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
    retry: 2,
  });
}

/**
 * Hook to fetch token source metadata.
 */
export function usePumpTokenSource(
  tokenMint: string | null | undefined,
  options?: {
    enabled?: boolean;
  }
) {
  const { enabled = true } = options || {};

  return useQuery({
    queryKey: ["pump-source", tokenMint],
    queryFn: async (): Promise<TokenSourceData | null> => {
      if (!tokenMint) return null;

      try {
        const response = await apiClient.get<TokenSourceData>(
          `/api/token-data/${tokenMint}/source`
        );

        return response.data;
      } catch (error) {
        // Token source may not exist if market hasn't been created yet
        console.warn(`Token source not found: ${tokenMint}`);
        return null;
      }
    },
    enabled: enabled && !!tokenMint,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry 404s
  });
}

/**
 * Convert OHLCV data to chart-compatible format.
 */
export function ohlcvToChartData(data: OHLCVData[]) {
  return data.map((d) => ({
    time: new Date(d.timestamp).getTime(),
    value: d.close,
    open: d.open,
    high: d.high,
    low: d.low,
    close: d.close,
    volume: d.volume,
  }));
}
