"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient, $ } from "@/lib/kubb";
import type { TimeRange, SnapshotPoint } from "./use-market-snapshots";

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

export type { TimeRange, SnapshotPoint };

// ---------------------------------------------------------------------------
// Fallback mock chart data (same PRNG as useMarketSnapshots)
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  }
  return h;
}

function generateFallbackSnapshots(
  marketId: string,
  range: TimeRange,
): SnapshotPoint[] {
  const rng = mulberry32(hashStr(marketId));
  const now = Date.now();

  let span: number;
  let count: number;
  if (range === "1d") {
    span = 24 * 3600_000;
    count = 48;
  } else if (range === "1w") {
    span = 7 * 24 * 3600_000;
    count = 168;
  } else {
    span = 30 * 24 * 3600_000;
    count = 360;
  }

  const startTime = now - span;
  const step = span / count;
  const targetYes = 30 + rng() * 40;
  let yesPrice = targetYes + (rng() - 0.5) * 20;
  yesPrice = Math.max(5, Math.min(95, yesPrice));
  const volatility = 0.8 + rng() * 1.5;
  const trendBias = (targetYes - yesPrice) / count * 0.5;

  const points: SnapshotPoint[] = [];
  for (let i = 0; i <= count; i++) {
    const ts = startTime + i * step;
    yesPrice += (rng() - 0.5) * 2 * volatility + trendBias;
    yesPrice = Math.max(2, Math.min(98, yesPrice));
    points.push({
      yesPrice: Math.round(yesPrice * 100) / 100,
      noPrice: Math.round((100 - yesPrice) * 100) / 100,
      timestamp: new Date(ts).toISOString(),
    });
  }
  return points;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface MultiMarketSnapshotsResult {
  snapshots: Record<string, SnapshotPoint[]>;
  loading: boolean;
  error: string | null;
}

/**
 * Fetch snapshot history for multiple sub-market PDAs in parallel.
 * Falls back to deterministic mock data when the API has no data.
 */
export function useMultiMarketSnapshots(
  marketIds: string[],
  range: TimeRange
): MultiMarketSnapshotsResult {
  // Pre-compute fallback data so results are always available
  const fallbackMap = useMemo(() => {
    const map: Record<string, SnapshotPoint[]> = {};
    for (const id of marketIds) {
      map[id] = generateFallbackSnapshots(id, range);
    }
    return map;
  }, [marketIds, range]);

  const {
    data: snapshots,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["multi-market-snapshots", marketIds.join(","), range],
    queryFn: async () => {
      const results: Record<string, SnapshotPoint[]> = {};

      await Promise.all(
        marketIds.map(async (id) => {
          try {
            const res = await apiClient.get(`/api/snapshots/${id}`, {
              params: { range },
            });
            const data = unwrap<SnapshotPoint[]>(res.data);
            results[id] = Array.isArray(data) && data.length > 0
              ? data
              : fallbackMap[id] ?? [];
          } catch {
            // Use fallback mock data instead of empty array
            results[id] = fallbackMap[id] ?? [];
          }
        })
      );

      return results;
    },
    enabled: marketIds.length > 0,
    ...$.query,
  });

  return {
    snapshots: snapshots ?? fallbackMap,
    loading: isLoading,
    error: error ? "Failed to load chart data" : null,
  };
}
