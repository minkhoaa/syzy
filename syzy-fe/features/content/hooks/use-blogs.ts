"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { apiClient } from "@/lib/kubb";

export interface Blog {
  id: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  imageUrl: string;
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

interface BlogsResponse {
  data: Blog[];
  meta: PaginationMeta;
}

/** Unwrap NestJS { success, data } wrapper if present */
function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in payload && "success" in payload) {
    return (payload as Record<string, unknown>).data as T;
  }
  return payload as T;
}

export function useBlogs(limit = 9) {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageRef = useRef(1);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/blogs", {
        params: { page: 1, limit },
      });
      const data = unwrap<BlogsResponse>(res.data);
      setBlogs(data.data);
      setMeta(data.meta);
      pageRef.current = 1;
    } catch (err) {
      console.error("Failed to fetch blogs:", err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const loadMore = useCallback(async () => {
    if (!meta || pageRef.current >= meta.totalPages) return;
    setLoadingMore(true);
    try {
      const nextPage = pageRef.current + 1;
      const res = await apiClient.get("/api/blogs", {
        params: { page: nextPage, limit },
      });
      const data = unwrap<BlogsResponse>(res.data);
      setBlogs((prev) => [...prev, ...data.data]);
      setMeta(data.meta);
      pageRef.current = nextPage;
    } catch (err) {
      console.error("Failed to load more blogs:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [meta, limit]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const hasMore = meta ? pageRef.current < meta.totalPages : false;

  return {
    blogs,
    meta,
    loading,
    loadingMore,
    hasMore,
    fetchBlogs,
    loadMore,
  };
}
