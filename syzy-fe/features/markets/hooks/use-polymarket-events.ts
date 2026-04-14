"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/kubb";

export interface PolymarketMarket {
  id: string;
  question: string;
  slug: string;
  conditionId: string;
  outcomes: string[];
  outcomePrices: number[];
  volume24hr: number;
  liquidity: number;
  active: boolean;
  closed: boolean;
  resolutionSource: string;
  negRisk: boolean;
}

export interface PolymarketEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  imageUrl: string;
  category: string;
  volume24hr: number;
  liquidity: number;
  active: boolean;
  closed: boolean;
  endDate: string;
  polymarketUrl: string;
  marketCount: number;
  markets: PolymarketMarket[];
}

export function usePolymarketEvents(params?: {
  limit?: number;
  offset?: number;
  order?: string;
} | null) {
  return useQuery({
    queryKey: ["polymarket-events", params],
    queryFn: async () => {
      const { data } = await apiClient.get<{
        success: boolean;
        data: PolymarketEvent[];
      }>("/api/polymarket/events", { params: params ?? undefined });
      return data.data;
    },
    enabled: params !== null && params !== undefined,
    staleTime: 30_000,
    refetchInterval: 30_000,
    gcTime: 60_000,
  });
}
