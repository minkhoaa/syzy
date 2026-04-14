"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useRecentTrades } from "@/features/markets/hooks/use-recent-trades";

function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  return `${Math.floor(diffHr / 24)}d`;
}

function formatAmount(amount: number): string {
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
  return amount.toFixed(2);
}

function truncateTitle(title: string | undefined, maxLen = 40): string {
  if (!title) return "Unknown";
  if (title.length <= maxLen) return title;
  return title.slice(0, maxLen) + "...";
}

export function TradeFeedTicker() {
  const { data: trades } = useRecentTrades(20);

  const items = useMemo(() => {
    if (!trades || trades.length === 0) return [];
    // Duplicate for seamless loop
    return [...trades, ...trades];
  }, [trades]);

  if (!trades || trades.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden border-b border-border/30 bg-background/80 backdrop-blur-sm">
      <div className="flex items-center h-8">
        {/* Fixed label */}
        <div className="shrink-0 flex items-center gap-2 px-3 border-r border-border/30 h-full bg-background/90 z-10">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Feed
          </span>
        </div>

        {/* Scrolling area */}
        <div className="flex-1 overflow-hidden relative group/ticker">
          <div
            className="flex items-center gap-6 whitespace-nowrap animate-ticker group-hover/ticker:[animation-play-state:paused]"
            style={{
              animationDuration: `${Math.max(trades.length * 4, 30)}s`,
            }}
          >
            {items.map((trade, idx) => (
              <span
                key={`${trade.id}-${idx}`}
                className="inline-flex items-center gap-1.5 text-xs"
              >
                <span className="text-muted-foreground/70 tabular-nums">
                  {formatRelativeTime(trade.timestamp)}
                </span>
                <span className="font-semibold text-foreground tabular-nums">
                  {formatAmount(trade.amount)} XLM
                </span>
                <span
                  className={cn(
                    "font-bold text-[10px] uppercase",
                    trade.direction === "YES"
                      ? "text-emerald-500"
                      : "text-red-500"
                  )}
                >
                  {trade.direction}
                </span>
                <span className="text-muted-foreground">on</span>
                <span className="text-foreground/80 font-medium">
                  &ldquo;{truncateTitle(trade.marketTitle)}&rdquo;
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-ticker {
          animation: ticker linear infinite;
        }
      `}</style>
    </div>
  );
}
