"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/kubb";

export interface TwitterNewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  sourceDomain: string;
  publishedAt: string;
  name: string;
  screenName: string;
  avatar: string;
  image: string[];
  likeCount: number;
  replyCount: number;
}

interface TwitterNewsResponse {
  news: TwitterNewsItem[];
  symbol: string;
  cached: boolean;
}

export function useTwitterNews(
  symbol: string | undefined | null,
  options?: { limit?: number; type?: string }
) {
  return useQuery<TwitterNewsResponse>({
    queryKey: [
      "twitter-news",
      symbol,
      options?.limit ?? 5,
      options?.type ?? "Top",
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("limit", String(options?.limit ?? 5));
      params.set("type", options?.type ?? "Top");
      const res = await apiClient.get(
        `/api/news/twitter/${symbol}?${params.toString()}`
      );
      const payload = res.data;
      return payload?.data ?? payload;
    },
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}
