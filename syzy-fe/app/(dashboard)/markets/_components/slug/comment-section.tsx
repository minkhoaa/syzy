"use client";

import { useRef, useCallback } from "react";
import { MessageCircle, Loader2 } from "lucide-react";
import { useComments } from "@/features/content/hooks/use-comments";
import { CommentEditor } from "./comment-editor";
import { CommentItem } from "./comment-item";
import { useReownWallet } from "@/features/auth/hooks/use-reown-wallet";

interface CommentSectionProps {
  dbMarketId: string | null;
}

export function CommentSection({ dbMarketId }: CommentSectionProps) {
  const {
    comments,
    meta,
    loading,
    loadingMore,
    submitting,
    hasMore,
    loadMore,
    loadReplies,
    createComment,
    deleteComment,
    currentUser,
    isAuthenticated,
  } = useComments(dbMarketId);

  const { connected, openModal } = useReownWallet();

  const observerRef = useRef<IntersectionObserver | null>(null);

  // Infinite scroll sentinel
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node || !hasMore || loadingMore) return;
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !loadingMore) {
            loadMore();
          }
        },
        { threshold: 0.1 }
      );
      observerRef.current.observe(node);
    },
    [hasMore, loadingMore, loadMore]
  );

  const handleSubmit = async (content: string, images: File[]) => {
    await createComment(content, images);
  };

  if (!dbMarketId) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-white/10 overflow-hidden bg-background/40 backdrop-blur-xl shadow-xl relative p-6 space-y-6">
      {/* Glass texture overlay */}
      <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />

      <div className="flex items-center gap-3 pb-3 border-b border-white/10 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-black text-foreground">
            Comments
          </h2>
          {meta && meta.total > 0 && (
            <p className="text-xs font-medium text-muted-foreground">
              {meta.total} {meta.total === 1 ? 'comment' : 'comments'}
            </p>
          )}
        </div>
      </div>

      {/* Comment Editor */}
      <CommentEditor
        onSubmit={handleSubmit}
        isSubmitting={submitting}
        isAuthenticated={isAuthenticated}
        isConnected={connected}
        onLogin={() => openModal()}
        placeholder="Share your thoughts on this market..."
      />

      {/* Comments List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 rounded-2xl bg-gradient-to-br from-muted/10 to-transparent border border-border/30 backdrop-blur-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-muted/20 to-muted/10 flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-muted-foreground/60" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            No comments yet. Be the first to share your thoughts!
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUser?.id}
              isAuthenticated={isAuthenticated}
              isConnected={connected}
              onReply={createComment}
              onDelete={deleteComment}
              onLoadReplies={loadReplies}
              dbMarketId={dbMarketId}
            />
          ))}

          {/* Infinite scroll sentinel */}
          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-4">
              {loadingMore && (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
