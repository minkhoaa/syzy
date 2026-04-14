"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/kubb";
import { useAuthStore } from "@/features/auth/store/use-auth-store";

export interface MetricsSummary {
  // Product metrics
  uniqueWallets: number;
  walletConnects: number;
  tradeConversion: number;
  avgTimeToFirstTrade: number | null;
  medianTimeToFirstTrade: number | null;
  failedTrades: number;
  // On-chain metrics
  totalTransactions: number;
  totalVolume: number;
}

export interface DailyMetric {
  date: string;
  signups: number;
  walletConnects: number;
  tradesInitiated: number;
  tradesConfirmed: number;
  tradesFailed: number;
}

export type DateRange = "7d" | "30d" | "all";

function getDateRange(range: DateRange): { startDate?: string; endDate?: string } {
  if (range === "all") {
    return {};
  }

  const endDate = new Date();
  const startDate = new Date();

  if (range === "7d") {
    startDate.setDate(startDate.getDate() - 7);
  } else if (range === "30d") {
    startDate.setDate(startDate.getDate() - 30);
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
}

export function useAdminMetrics() {
  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const { accessToken } = useAuthStore();

  // Reset loading state when auth changes (render-time adjustment)
  const [prevAccessToken, setPrevAccessToken] = useState(accessToken);
  if (prevAccessToken !== accessToken) {
    setPrevAccessToken(accessToken);
    if (!accessToken) {
      setIsLoading(false);
    }
  }

  const fetchSummary = useCallback(async (range: DateRange) => {
    try {
      const params = getDateRange(range);
      const response = await apiClient.get("/api/metrics/summary", { params });
      // Backend wraps responses in { success: true, data: T }
      const data = response.data?.data ?? response.data;
      setSummary(data);
      setError(null);
    } catch (err) {
      console.error("[AdminMetrics] Failed to fetch summary:", err);
      setError("Failed to load metrics summary");
    }
  }, []);

  const fetchDailyMetrics = useCallback(async (range: DateRange) => {
    try {
      const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
      const response = await apiClient.get("/api/metrics/daily", {
        params: { days },
      });
      // Backend wraps responses in { success: true, data: T }
      const data = response.data?.data ?? response.data;
      setDailyMetrics(data.daily || []);
    } catch (err) {
      console.error("[AdminMetrics] Failed to fetch daily metrics:", err);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    await Promise.all([fetchSummary(dateRange), fetchDailyMetrics(dateRange)]);
    setIsLoading(false);
  }, [fetchSummary, fetchDailyMetrics, dateRange, accessToken]);

  // Initial fetch and when date range changes (only when authenticated)
  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      await Promise.all([fetchSummary(dateRange), fetchDailyMetrics(dateRange)]);
      if (!cancelled) {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [dateRange, fetchSummary, fetchDailyMetrics, accessToken]);

  // Auto-refresh every 60 seconds (only when authenticated)
  useEffect(() => {
    if (!accessToken) return;

    const interval = setInterval(() => {
      refresh();
    }, 60000);

    return () => clearInterval(interval);
  }, [refresh, accessToken]);

  return {
    summary,
    dailyMetrics,
    isLoading,
    error,
    dateRange,
    setDateRange,
    refresh,
  };
}
