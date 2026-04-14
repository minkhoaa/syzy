"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/kubb";

export interface KalshiMarketResponse {
  ticker: string;
  question: string;
  outcomes: string[];
  outcomePrices: number[];
  volume24hr: number;
  openInterest: number;
}

export interface KalshiEventResponse {
  eventTicker: string;
  title: string;
  category: string;
  imageUrl: string;
  volume24hr: number;
  openInterest: number;
  endDate: string;
  kalshiUrl: string;
  marketCount: number;
  markets: KalshiMarketResponse[];
}

export function useKalshiEvents(params?: { limit?: number; offset?: number } | null) {
  return useQuery({
    queryKey: ["kalshi-events", params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: KalshiEventResponse[] }>(
        "/api/kalshi/events",
        { params: params ?? undefined }
      );
      return data.data;
    },
    enabled: params !== null && params !== undefined,
    staleTime: 30_000,
    refetchInterval: 30_000,
    gcTime: 60_000,
  });
}
