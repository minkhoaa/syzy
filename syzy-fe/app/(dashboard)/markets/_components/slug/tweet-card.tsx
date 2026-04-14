"use client";

import { useCallback, useRef, useState, useLayoutEffect } from "react";
import { Heart, MessageCircle, Link2, Info } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { TwitterNewsItem } from "@/features/markets/hooks/use-twitter-news";

// Hoisted regex patterns for tweet text highlighting
const HASHTAG_RE = /(#\w+)/g;
const CASHTAG_RE = /(\$[A-Z]+)/g;
const MENTION_RE = /(@\w+)/g;
const HIGHLIGHT_RE = new RegExp(
  `(${HASHTAG_RE.source}|${CASHTAG_RE.source}|${MENTION_RE.source})`,
  "g"
);

function XLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function highlightText(text: string) {
  const parts = text.split(HIGHLIGHT_RE);
  return parts.map((part, i) => {
    if (HASHTAG_RE.test(part) || CASHTAG_RE.test(part) || MENTION_RE.test(part)) {
      // Reset lastIndex since we use global regex
      HASHTAG_RE.lastIndex = 0;
      CASHTAG_RE.lastIndex = 0;
      MENTION_RE.lastIndex = 0;
      return (
        <span key={i} className="text-primary">
          {part}
        </span>
      );
    }
    return part;
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

interface TweetCardProps {
  tweet: TwitterNewsItem;
  className?: string;
}

export function TweetCard({ tweet, className }: TweetCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (el) {
      setIsClamped(el.scrollHeight > el.clientHeight);
    }
  }, [tweet.title]);

  const handleCopyLink = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(tweet.url).then(() => {
      toast.success("Link copied to clipboard");
    });
  }, [tweet.url]);

  const profileUrl = `https://x.com/${tweet.screenName}`;

  return (
    <div
      className={cn(
        "rounded-xl bg-slate-50 dark:bg-black/50 border border-black/5 dark:border-white/10 p-4 space-y-3",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <a href={profileUrl} target="_blank" rel="noopener noreferrer">
            {tweet.avatar ? (
              <img
                src={tweet.avatar}
                alt={tweet.name}
                className="w-10 h-10 rounded-full shrink-0 bg-muted"
              />
            ) : (
              <div className="w-10 h-10 rounded-full shrink-0 bg-muted flex items-center justify-center text-muted-foreground text-sm font-bold">
                {tweet.name?.charAt(0)?.toUpperCase()}
              </div>
            )}
          </a>
          <div className="min-w-0">
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold text-foreground hover:underline truncate block"
            >
              {tweet.name}
            </a>
            <div className="flex items-center gap-1">
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground truncate"
              >
                @{tweet.screenName}
              </a>
              <span className="text-muted-foreground/50">&middot;</span>
              <a
                href={`https://x.com/intent/follow?screen_name=${tweet.screenName}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold text-primary hover:text-primary/80 shrink-0"
              >
                Follow
              </a>
            </div>
          </div>
        </div>
        <a
          href={tweet.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          <XLogo className="w-5 h-5" />
        </a>
      </div>

      {/* Tweet text */}
      <div>
        <div
          ref={textRef}
          className={cn(
            "text-sm text-foreground leading-relaxed whitespace-pre-line",
            !isExpanded && "line-clamp-3"
          )}
        >
          {highlightText(tweet.title)}
        </div>
        {(isClamped || isExpanded) ? (
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="text-sm text-blue-500 hover:text-blue-400 mt-1"
          >
            {isExpanded ? "Show less" : "Show more"}
          </button>
        ) : null}
      </div>

      {/* Images */}
      {tweet.image.length > 0 ? (
        <div
          className={cn(
            "grid gap-1 rounded-xl overflow-hidden",
            tweet.image.length === 1 ? "grid-cols-1" : "grid-cols-2"
          )}
        >
          {tweet.image.slice(0, 4).map((src, i) => (
            <a
              key={i}
              href={tweet.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={src}
                alt={`Tweet image ${i + 1}`}
                className="w-full h-auto max-h-64 object-cover bg-muted"
                loading="lazy"
              />
            </a>
          ))}
        </div>
      ) : null}

      {/* Footer */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          {formatDate(tweet.publishedAt)}
        </p>

        <div className="flex items-center gap-1 border-t border-black/5 dark:border-white/5 pt-2">
          {/* Reply */}
          <a
            href={`https://x.com/intent/post?in_reply_to=${tweet.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 p-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            {tweet.replyCount > 0 ? (
              <span className="text-xs">{formatCount(tweet.replyCount)}</span>
            ) : null}
          </a>

          {/* Like */}
          <a
            href={`https://x.com/intent/like?tweet_id=${tweet.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 p-1.5 rounded-full text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
          >
            <Heart className="w-4 h-4" />
            {tweet.likeCount > 0 ? (
              <span className="text-xs">{formatCount(tweet.likeCount)}</span>
            ) : null}
          </a>

          {/* Copy link */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1 p-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Link2 className="w-4 h-4" />
          </button>

          {/* Info */}
          <a
            href="https://help.x.com/en/x-for-websites-ads-info-and-privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 p-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors ml-auto"
          >
            <Info className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
