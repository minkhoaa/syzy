"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/kubb";

export interface RecentTrade {
  id: string;
  marketId: string;
  marketTitle: string;
  walletAddress: string;
  amount: number;
  direction: "YES" | "NO";
  timestamp: string;
}

export function useRecentTrades(limit = 20) {
  return useQuery({
    queryKey: ["recent-trades", limit],
    queryFn: async () => {
      const { data } = await apiClient.get<{
        success: boolean;
        data: RecentTrade[];
      }>("/api/markets/recent-trades", { params: { limit } });
      return data.data;
    },
    staleTime: 15_000,
    refetchInterval: 15_000,
    gcTime: 30_000,
  });
}
