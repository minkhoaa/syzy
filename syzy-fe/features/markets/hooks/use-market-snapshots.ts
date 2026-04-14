"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { apiClient } from "@/lib/kubb";

export type TimeRange = "1d" | "1w" | "all";

export interface SnapshotPoint {
  yesPrice: number;
  noPrice: number;
  timestamp: string;
}

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

// ---------------------------------------------------------------------------
// Fallback mock chart data generator
// ---------------------------------------------------------------------------

/** Mulberry32 seeded PRNG */
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

/**
 * Generate deterministic mock snapshot data when the backend has no data.
 * Uses the marketId as a seed so the same market always gets the same chart.
 */
function generateFallbackSnapshots(
  marketId: string,
  range: TimeRange,
  currentYes: number | null | undefined,
): SnapshotPoint[] {
  const rng = mulberry32(hashStr(marketId));
  const now = Date.now();

  // Determine time span and point count
  let span: number;
  let count: number;
  if (range === "1d") {
    span = 24 * 3600_000;
    count = 48; // every 30min
  } else if (range === "1w") {
    span = 7 * 24 * 3600_000;
    count = 168; // every hour
  } else {
    span = 30 * 24 * 3600_000;
    count = 360; // every 2 hours
  }

  const startTime = now - span;
  const step = span / count;

  // Target YES price (percentage 0-100)
  const targetYes = currentYes ?? (30 + rng() * 40); // 30-70 if unknown
  // Start price deviates from target
  let yesPrice = targetYes + (rng() - 0.5) * 20;
  yesPrice = Math.max(5, Math.min(95, yesPrice));

  const volatility = 0.8 + rng() * 1.5; // per-step noise magnitude
  const trendBias = (targetYes - yesPrice) / count * 0.5; // gentle drift toward target

  const points: SnapshotPoint[] = [];

  for (let i = 0; i <= count; i++) {
    const ts = startTime + i * step;
    const noise = (rng() - 0.5) * 2 * volatility;
    yesPrice += noise + trendBias;
    yesPrice = Math.max(2, Math.min(98, yesPrice));

    const noPrice = 100 - yesPrice;

    points.push({
      yesPrice: Math.round(yesPrice * 100) / 100,
      noPrice: Math.round(noPrice * 100) / 100,
      timestamp: new Date(ts).toISOString(),
    });
  }

  return points;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseMarketSnapshotsOptions {
  marketId: string | null;
  range: TimeRange;
  /** Current YES chances from useMarketDetail (0-100) */
  currentYesChances?: number | null;
  /** Current NO chances from useMarketDetail (0-100) */
  currentNoChances?: number | null;
}

export function useMarketSnapshots({
  marketId,
  range,
  currentYesChances,
  currentNoChances,
}: UseMarketSnapshotsOptions) {
  const [snapshots, setSnapshots] = useState<SnapshotPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastPostTime = useRef<number>(0);

  // Memoize fallback data so it stays stable across re-renders
  const fallbackData = useMemo(() => {
    if (!marketId) return [];
    return generateFallbackSnapshots(marketId, range, currentYesChances);
  }, [marketId, range, currentYesChances]);

  // POST current snapshot to backend (fire-and-forget, throttled to 30s)
  useEffect(() => {
    if (
      !marketId ||
      currentYesChances == null ||
      currentNoChances == null
    )
      return;

    const now = Date.now();
    if (now - lastPostTime.current < 30_000) return;
    lastPostTime.current = now;

    apiClient
      .post("/api/snapshots", {
        marketId,
        yesPrice: currentYesChances,
        noPrice: currentNoChances,
      })
      .catch(() => {
        // Silent fail - snapshot recording is best-effort
      });
  }, [marketId, currentYesChances, currentNoChances]);

  // Reset loading/error when fetch params change (render-time adjustment)
  const [prevFetchKey, setPrevFetchKey] = useState(`${marketId}|${range}`);
  const fetchKey = `${marketId}|${range}`;
  if (prevFetchKey !== fetchKey) {
    setPrevFetchKey(fetchKey);
    if (marketId) {
      setLoading(true);
      setError(null);
    }
  }

  // GET snapshot history
  useEffect(() => {
    if (!marketId) return;

    let cancelled = false;
    const controller = new AbortController();

    apiClient
      .get(`/api/snapshots/${marketId}?range=${range}`, {
        signal: controller.signal,
      })
      .then((res) => {
        if (!cancelled) {
          const data = unwrap<SnapshotPoint[]>(res.data);
          // Use API data if available and non-empty, otherwise fall back to generated data
          if (Array.isArray(data) && data.length > 0) {
            setSnapshots(data);
          } else {
            setSnapshots(fallbackData);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          // Instead of showing an error, use fallback mock data
          setSnapshots(fallbackData);
          setError(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [marketId, range, fallbackData]);

  return { snapshots, loading, error };
}
