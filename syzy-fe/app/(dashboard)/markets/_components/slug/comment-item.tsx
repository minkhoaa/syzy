"use client";

import { useState } from "react";
import {
  Reply,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CommentEditor } from "./comment-editor";
import type { Comment } from "@/features/content/hooks/use-comments";

interface CommentItemProps {
  comment: Comment;
  currentUserId: string | undefined;
  isAuthenticated: boolean;
  isConnected: boolean;
  onReply: (
    content: string,
    images: File[],
    parentId?: string
  ) => Promise<Comment | null>;
  onDelete: (commentId: string) => Promise<boolean>;
  onLoadReplies: (
    commentId: string,
    page?: number,
    limit?: number
  ) => Promise<{ data: Comment[]; meta: { total: number; totalPages: number; page: number } } | null>;
  dbMarketId: string;
  depth?: number;
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  return `${Math.floor(months / 12)}y ago`;
}

function shortenAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function CommentItem({
  comment,
  currentUserId,
  isAuthenticated,
  isConnected,
  onReply,
  onDelete,
  onLoadReplies,
  dbMarketId,
  depth = 0,
}: CommentItemProps) {
  const [showReplyEditor, setShowReplyEditor] = useState(false);
  const [showReplies, setShowReplies] = useState(
    (comment.replies && comment.replies.length > 0) || false
  );
  const [replies, setReplies] = useState<Comment[]>(comment.replies || []);
  const [repliesLoaded, setRepliesLoaded] = useState(
    (comment.replies && comment.replies.length > 0) || false
  );
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replyPage, setReplyPage] = useState(1);
  const [replyMeta, setReplyMeta] = useState<{
    total: number;
    totalPages: number;
    page: number;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [imageModal, setImageModal] = useState<string | null>(null);

  const isOwner = currentUserId === comment.userId;
  const replyCount = comment._count?.replies || 0;
  const maxDepth = 3;

  const handleToggleReplies = async () => {
    if (showReplies) {
      setShowReplies(false);
      return;
    }

    setShowReplies(true);

    if (!repliesLoaded && replyCount > 0) {
      setLoadingReplies(true);
      const result = await onLoadReplies(comment.id, 1, 10);
      if (result) {
        setReplies(result.data);
        setReplyMeta(result.meta);
        setReplyPage(1);
      }
      setRepliesLoaded(true);
      setLoadingReplies(false);
    }
  };

  const handleLoadMoreReplies = async () => {
    if (!replyMeta || replyPage >= replyMeta.totalPages) return;
    setLoadingReplies(true);
    const nextPage = replyPage + 1;
    const result = await onLoadReplies(comment.id, nextPage, 10);
    if (result) {
      setReplies((prev) => [...prev, ...result.data]);
      setReplyMeta(result.meta);
      setReplyPage(nextPage);
    }
    setLoadingReplies(false);
  };

  const handleReply = async (content: string, images: File[]) => {
    const newComment = await onReply(content, images, comment.id);
    if (newComment) {
      setReplies((prev) => [...prev, newComment]);
      setShowReplies(true);
      setRepliesLoaded(true);
      setShowReplyEditor(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(comment.id);
    setDeleting(false);
  };

  const displayName =
    comment.user.username || shortenAddress(comment.user.walletAddress);

  return (
    <>
      <div
        className={cn(
          "group py-3",
          depth > 0 && "ml-3 sm:ml-6 border-l-2 border-border/40 pl-2 sm:pl-4"
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-1.5">
          {/* Avatar */}
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/30 to-primary/60 flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0 overflow-hidden">
            {comment.user.avatar ? (
              <img
                src={comment.user.avatar}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>

          <span className="text-sm font-medium text-foreground">
            {displayName}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTimeAgo(comment.createdAt)}
          </span>
        </div>

        {/* Content */}
        <div className="ml-9">
          <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words leading-relaxed">
            {comment.content}
          </p>

          {/* Images */}
          {comment.images && comment.images.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {comment.images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setImageModal(img)}
                  className="relative group/img"
                >
                  <img
                    src={img}
                    alt={`Image ${i + 1}`}
                    className="h-20 w-20 object-cover rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 rounded-lg transition-colors flex items-center justify-center">
                    <ExternalLink className="w-4 h-4 text-white opacity-0 group-hover/img:opacity-100 transition-opacity drop-shadow" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 mt-2">
            {/* Reply button */}
            {depth < maxDepth && isAuthenticated && (
              <button
                type="button"
                onClick={() => setShowReplyEditor(!showReplyEditor)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Reply className="w-3.5 h-3.5" />
                Reply
              </button>
            )}

            {/* Show replies */}
            {replyCount > 0 && (
              <button
                type="button"
                onClick={handleToggleReplies}
                className="flex items-center gap-1 text-xs text-primary/80 hover:text-primary transition-colors font-medium"
              >
                {showReplies ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
                {replyCount} {replyCount === 1 ? "reply" : "replies"}
              </button>
            )}

            {/* Delete */}
            {isOwner && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
              >
                {deleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Delete
              </button>
            )}
          </div>

          {/* Reply Editor */}
          {showReplyEditor && (
            <div className="mt-3">
              <CommentEditor
                onSubmit={handleReply}
                isSubmitting={false}
                isAuthenticated={isAuthenticated}
                isConnected={isConnected}
                placeholder={`Reply to ${displayName}...`}
                autoFocus
                compact
                onCancel={() => setShowReplyEditor(false)}
              />
            </div>
          )}

          {/* Replies */}
          {showReplies && (
            <div className="mt-2">
              {loadingReplies && replies.length === 0 ? (
                <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading replies...
                </div>
              ) : (
                <>
                  {replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      currentUserId={currentUserId}
                      isAuthenticated={isAuthenticated}
                      isConnected={isConnected}
                      onReply={onReply}
                      onDelete={onDelete}
                      onLoadReplies={onLoadReplies}
                      dbMarketId={dbMarketId}
                      depth={depth + 1}
                    />
                  ))}
                  {replyMeta &&
                    replyPage < replyMeta.totalPages && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-primary/80 mt-1"
                        onClick={handleLoadMoreReplies}
                        disabled={loadingReplies}
                      >
                        {loadingReplies ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : null}
                        Load more replies
                      </Button>
                    )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Image Lightbox Modal */}
      {imageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setImageModal(null)}
        >
          <div className="relative max-w-[calc(100vw-2rem)] sm:max-w-4xl max-h-[90vh]">
            <img
              src={imageModal}
              alt="Full size"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button
              type="button"
              onClick={() => setImageModal(null)}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-colors"
            >
              <span className="sr-only">Close</span>
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
