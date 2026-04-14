"use client";

import { useState } from "react";
import { useMarketNews } from "@/features/markets/hooks/use-market-news";
import { useTwitterNews } from "@/features/markets/hooks/use-twitter-news";
import { extractTokenSymbol } from "@/features/markets/utils/extract-token-symbol";
import {
  Newspaper,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  ChevronDown,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TweetCard } from "./tweet-card";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface MarketNewsSectionProps {
  title: string;
  category?: string | null;
  tokenSymbol?: string | null;
}

export function MarketNewsSection({
  title,
  category,
  tokenSymbol,
}: MarketNewsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [limit, setLimit] = useState(5);

  const symbol = tokenSymbol || extractTokenSymbol(title, category);
  const { data, isLoading } = useMarketNews(symbol, { limit });
  const { data: twitterData, isLoading: isLoadingTweets } = useTwitterNews(symbol);

  // Don't render anything if no symbol can be determined
  if (!symbol) return null;

  const news = data?.news ?? [];
  const tweets = twitterData?.news ?? [];

  return (
    <div className="rounded-3xl border border-white/10 overflow-hidden bg-background/40 backdrop-blur-xl shadow-xl relative">
      {/* Glass texture overlay */}
      <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />

      {/* Edge highlight */}
      <div className="absolute inset-0 rounded-3xl ring-1 ring-white/10 pointer-events-none" />

      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors relative z-10 group"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Newspaper className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-black text-base text-foreground">
            {symbol} News
          </h3>
        </div>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-muted-foreground transition-transform duration-300",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      {/* Content */}
      <div
        className={cn(
          "grid transition-all duration-300 ease-out relative z-10",
          isExpanded
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="p-4 pt-0 space-y-2">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 p-3">
                    <Skeleton className="w-2 h-2 rounded-full mt-2 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : news.length === 0 ? (
              <div className="text-center py-6">
                <Newspaper className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No recent news for {symbol}
                </p>
              </div>
            ) : (
              <>
                {news.map((item) => {
                  const sentimentColor =
                    item.votes &&
                    item.votes.positive + item.votes.negative > 0
                      ? item.votes.positive > item.votes.negative
                        ? "bg-emerald-500"
                        : item.votes.negative > item.votes.positive
                          ? "bg-rose-500"
                          : "bg-slate-400"
                      : item.sentiment === "positive"
                        ? "bg-emerald-500"
                        : item.sentiment === "negative"
                          ? "bg-rose-500"
                          : "bg-slate-400";

                  const SentimentIcon =
                    item.sentiment === "positive"
                      ? TrendingUp
                      : item.sentiment === "negative"
                        ? TrendingDown
                        : null;

                  return (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-black/50 border border-black/5 dark:border-white/10 hover:border-primary/30 transition-colors group/item"
                    >
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full mt-2 shrink-0",
                          sentimentColor
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-2 group-hover/item:text-primary transition-colors">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[11px] text-muted-foreground font-medium">
                            {item.source !== "Unknown"
                              ? item.source
                              : item.sourceDomain}
                          </span>
                          <span className="text-muted-foreground/30">
                            &middot;
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {timeAgo(item.publishedAt)}
                          </span>
                          {SentimentIcon && (
                            <>
                              <span className="text-muted-foreground/30">
                                &middot;
                              </span>
                              <SentimentIcon
                                className={cn(
                                  "w-3 h-3",
                                  item.sentiment === "positive"
                                    ? "text-emerald-500"
                                    : "text-rose-500"
                                )}
                              />
                            </>
                          )}
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 mt-1 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                    </a>
                  );
                })}

                {news.length >= limit && (
                  <div className="pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLimit((prev) => prev + 5);
                      }}
                    >
                      Load more news
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Twitter/X Tweets Section */}
          {isLoadingTweets ? (
            <div className="p-4 pt-0 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Posts from X
                </span>
              </div>
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-slate-50 dark:bg-black/50 border border-black/5 dark:border-white/10 p-4 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3.5 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : tweets.length > 0 ? (
            <div className="p-4 pt-0 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Posts from X
                </span>
              </div>
              {tweets.map((tweet) => (
                <TweetCard key={tweet.id} tweet={tweet} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
