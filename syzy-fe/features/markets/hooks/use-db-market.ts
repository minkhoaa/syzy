"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/kubb";

export interface DbMarket {
  id: string;
  marketId: string;
  title: string;
  description: string | null;
  question: string | null;
  slug: string | null;
  imageUrl: string | null;
  source: string | null;
  category: string | null;
  creatorWallet: string | null;
  yesTokenMint: string | null;
  noTokenMint: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  // Pump.fun token fields
  underlyingTokenMint: string | null;
  metricType: number | null;
  // Token news fields
  tokenSymbol: string | null;
  tokenAddress: string | null;
  // Polymarket resolution sync fields
  polymarketConditionId: string | null;
  polymarketSlug: string | null;
  polymarketMarketId: string | null;
  resolutionSource: string | null;
  winningOutcome: number | null;
  resolvedAt: string | null;
}

/** Unwrap NestJS { success, data } wrapper if present */
function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in payload && "success" in payload) {
    return (payload as Record<string, unknown>).data as T;
  }
  return payload as T;
}

/**
 * Fetches the database market record by PDA (marketId).
 * Auto-creates the DB record if it doesn't exist yet.
 * Returns the DB UUID needed for comments.
 */
export function useDbMarket(marketPda: string, title?: string) {
  const [dbMarket, setDbMarket] = useState<DbMarket | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!marketPda) return;

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    const params = title ? `?title=${encodeURIComponent(title)}` : "";

    apiClient
      .get(`/api/markets/by-market-id/${marketPda}${params}`)
      .then((res) => {
        if (!cancelled) {
          const data = unwrap<DbMarket>(res.data);
          setDbMarket(data);
        }
      })
      .catch(() => {
        if (!cancelled) setDbMarket(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [marketPda, title]);

  return { dbMarket, dbMarketId: dbMarket?.id ?? null, loading };
}
