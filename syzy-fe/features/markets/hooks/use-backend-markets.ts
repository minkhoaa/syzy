"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient, $ } from "@/lib/kubb";
import type { BackendMarket } from "@/app/(dashboard)/markets/_utils/market-list-adapter";

/** Unwrap NestJS { success, data } wrapper if present */
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

interface BackendMarketsResponse {
  data: BackendMarket[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

/**
 * Fetch markets from backend API. Returns the list including parent markets
 * with their subMarkets[] populated. Sub-markets are excluded by default.
 */
export function useBackendMarkets() {
  return useQuery({
    queryKey: ["backend-markets"],
    queryFn: async () => {
      const res = await apiClient.get("/api/markets", {
        params: { limit: 200 },
      });
      const result = unwrap<BackendMarketsResponse>(res.data);
      return result.data;
    },
    ...$.query,
  });
}
