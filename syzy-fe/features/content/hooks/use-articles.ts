"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { apiClient } from "@/lib/kubb";

export interface Article {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  tweetUrl: string;
  featured: boolean;
  authorWallet: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ArticlesResponse {
  data: Article[];
  meta: PaginationMeta;
}

/** Unwrap NestJS { success, data } wrapper if present */
function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in payload && "success" in payload) {
    return (payload as Record<string, unknown>).data as T;
  }
  return payload as T;
}

export function useArticles(limit = 9) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageRef = useRef(1);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/articles", {
        params: { page: 1, limit },
      });
      const data = unwrap<ArticlesResponse>(res.data);
      setArticles(data.data);
      setMeta(data.meta);
      pageRef.current = 1;
    } catch (err) {
      console.error("Failed to fetch articles:", err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const loadMore = useCallback(async () => {
    if (!meta || pageRef.current >= meta.totalPages) return;
    setLoadingMore(true);
    try {
      const nextPage = pageRef.current + 1;
      const res = await apiClient.get("/api/articles", {
        params: { page: nextPage, limit },
      });
      const data = unwrap<ArticlesResponse>(res.data);
      setArticles((prev) => [...prev, ...data.data]);
      setMeta(data.meta);
      pageRef.current = nextPage;
    } catch (err) {
      console.error("Failed to load more articles:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [meta, limit]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const hasMore = meta ? pageRef.current < meta.totalPages : false;

  return {
    articles,
    meta,
    loading,
    loadingMore,
    hasMore,
    fetchArticles,
    loadMore,
  };
}
