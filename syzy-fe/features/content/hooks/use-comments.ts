"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useAuthStore } from "@/features/auth/store/use-auth-store";
import { apiClient } from "@/lib/kubb";
import { uploadFileToR2 } from "@/lib/r2-upload";
import { toast } from "sonner";

export interface CommentUser {
  id: string;
  walletAddress: string;
  username: string | null;
  avatar: string | null;
}

export interface Comment {
  id: string;
  content: string;
  images: string[];
  marketId: string;
  userId: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  user: CommentUser;
  replies?: Comment[];
  _count: {
    replies: number;
  };
}

export interface CommentMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface CommentsResponse {
  data: Comment[];
  meta: CommentMeta;
}

/** Unwrap NestJS { success, data } wrapper if present */
function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in payload && "success" in payload) {
    return (payload as Record<string, unknown>).data as T;
  }
  return payload as T;
}

export function useComments(dbMarketId: string | null) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [meta, setMeta] = useState<CommentMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const pageRef = useRef(1);
  const { accessToken, user } = useAuthStore();

  const LIMIT = 10;

  // Fetch top-level comments (page 1)
  const fetchComments = useCallback(async () => {
    if (!dbMarketId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/api/comments/market/${dbMarketId}`, {
        params: { page: 1, limit: LIMIT },
      });
      const data = unwrap<CommentsResponse>(res.data);
      setComments(data.data);
      setMeta(data.meta);
      pageRef.current = 1;
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    } finally {
      setLoading(false);
    }
  }, [dbMarketId]);

  // Load more (next page)
  const loadMore = useCallback(async () => {
    if (!dbMarketId || !meta || pageRef.current >= meta.totalPages) return;
    setLoadingMore(true);
    try {
      const nextPage = pageRef.current + 1;
      const res = await apiClient.get(`/api/comments/market/${dbMarketId}`, {
        params: { page: nextPage, limit: LIMIT },
      });
      const data = unwrap<CommentsResponse>(res.data);
      setComments((prev) => [...prev, ...data.data]);
      setMeta(data.meta);
      pageRef.current = nextPage;
    } catch (err) {
      console.error("Failed to load more comments:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [dbMarketId, meta]);

  // Load replies for a specific comment
  const loadReplies = useCallback(
    async (commentId: string, page = 1, limit = 10) => {
      try {
        const res = await apiClient.get(`/api/comments/replies/${commentId}`, {
          params: { page, limit },
        });
        const data = unwrap<CommentsResponse>(res.data);
        return data;
      } catch (err) {
        console.error("Failed to load replies:", err);
        return null;
      }
    },
    []
  );

  // Create comment (with optional images)
  const createComment = useCallback(
    async (content: string, images: File[] = [], parentId?: string) => {
      if (!dbMarketId || !accessToken) {
        toast.error("Please login to comment");
        return null;
      }

      setSubmitting(true);
      try {
        // Upload images first if any
        let imageUrls: string[] = [];
        if (images.length > 0) {
          const results = await Promise.all(
            images.map((file) => uploadFileToR2(file))
          );
          imageUrls = results.map((r) => r.url);
        }

        const res = await apiClient.post("/api/comments", {
          content,
          marketId: dbMarketId,
          parentId: parentId || undefined,
          images: imageUrls.length > 0 ? imageUrls : undefined,
        });

        const newComment = unwrap<Comment>(res.data);

        if (!parentId) {
          // Add to top of list for top-level comments
          setComments((prev) => [newComment, ...prev]);
          if (meta) {
            setMeta({ ...meta, total: meta.total + 1 });
          }
        }

        return newComment;
      } catch (err) {
        console.error("Failed to create comment:", err);
        toast.error("Failed to post comment");
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [dbMarketId, accessToken, meta]
  );

  // Delete comment
  const deleteComment = useCallback(
    async (commentId: string) => {
      if (!accessToken) return false;
      try {
        await apiClient.delete(`/api/comments/${commentId}`);
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        if (meta) {
          setMeta({ ...meta, total: meta.total - 1 });
        }
        toast.success("Comment deleted");
        return true;
      } catch (err) {
        console.error("Failed to delete comment:", err);
        toast.error("Failed to delete comment");
        return false;
      }
    },
    [accessToken, meta]
  );

  // Auto-fetch on mount and when marketId changes
  useEffect(() => {
    if (dbMarketId) {
      fetchComments();
    }
  }, [dbMarketId, fetchComments]);

  const hasMore = meta ? pageRef.current < meta.totalPages : false;

  return {
    comments,
    meta,
    loading,
    loadingMore,
    submitting,
    hasMore,
    fetchComments,
    loadMore,
    loadReplies,
    createComment,
    deleteComment,
    currentUser: user,
    isAuthenticated: !!accessToken,
  };
}
