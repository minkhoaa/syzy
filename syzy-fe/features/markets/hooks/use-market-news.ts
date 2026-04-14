"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/kubb";

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  sourceDomain: string;
  publishedAt: string;
  sentiment?: "positive" | "negative" | "neutral";
  votes?: { positive: number; negative: number };
}

export interface NewsResponse {
  news: NewsItem[];
  symbol: string;
  cached: boolean;
}

export function useMarketNews(
  symbol: string | undefined | null,
  options?: { limit?: number; filter?: string; title?: string }
) {
  return useQuery<NewsResponse>({
    queryKey: ["market-news", symbol, options?.limit, options?.filter, options?.title],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.limit) params.set("limit", String(options.limit));
      if (options?.filter) params.set("filter", options.filter);
      if (options?.title) params.set("title", options.title);
      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await apiClient.get(`/api/news/${symbol}${query}`);
      const payload = res.data;
      return payload?.data ?? payload;
    },
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}
