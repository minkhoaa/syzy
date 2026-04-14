"use client";

import { useState, useMemo } from "react";
import { Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MarketAccount } from "@/types/prediction-market.types";
import type { ResolveViaOracleFn } from "./order-ticket";

interface OracleResolutionCardProps {
  market: MarketAccount;
  resolveViaOracle?: ResolveViaOracleFn;
  refresh: () => void;
}

export function OracleResolutionCard({
  market,
  resolveViaOracle,
  refresh,
}: OracleResolutionCardProps) {
  const [isResolving, setIsResolving] = useState(false);

  const marketDateStatus = useMemo(() => {
    const now = Date.now() / 1000;
    const endDate = market.endDate ? Number(market.endDate) : null;
    return {
      isExpired: endDate ? now > endDate : false,
      endDateStr: endDate
        ? new Date(endDate * 1000).toLocaleString()
        : null,
    };
  }, [market]);

  // Only show if oracle is configured
  if (!market.oracleFeed) return null;

  // For resolved markets, show resolution info
  if (market.isCompleted) {
    if (market.resolvedBy === null) return null;
    return (
      <div className="bg-white dark:bg-background/40 dark:backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-xl border border-border/50 p-4 relative overflow-hidden">
        {/* Decorative effects for dark mode */}
        <div className="absolute inset-0 bg-noise opacity-[0.015] pointer-events-none hidden dark:block" />
        <div className="absolute inset-0 rounded-3xl shadow-[inset_0_0_60px_rgba(255,255,255,0.05)] pointer-events-none hidden dark:block" />

        <div className="text-center space-y-2 relative z-10">
          <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center mb-2">
            <Zap className="w-6 h-6 text-secondary" />
          </div>
          <p className="font-bold text-sm text-foreground">
            Resolved {market.resolvedBy === 1 ? "via Oracle" : "by Admin"}
          </p>
          {market.resolvedAt && (
            <p className="text-xs text-muted-foreground tabular-nums bg-muted/20 dark:bg-muted/10 rounded-lg px-3 py-1.5 inline-block">
              {new Date(Number(market.resolvedAt) * 1000).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    );
  }

  const handleResolve = async () => {
    if (!resolveViaOracle || !market.oracleFeed) return;
    setIsResolving(true);
    try {
      await resolveViaOracle(
        market.yesTokenMint,
        market.noTokenMint,
        market.oracleFeed
      );
      refresh();
    } catch (err) {
      console.error("Oracle resolution failed:", err);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="rounded-3xl border border-border/50 overflow-hidden bg-white dark:bg-background/40 dark:backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-xl relative p-4 space-y-3">
      {/* Decorative effects for dark mode */}
      <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none hidden dark:block" />
      <div className="absolute inset-0 rounded-3xl ring-1 ring-black/5 dark:ring-white/10 pointer-events-none hidden dark:block" />
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-teal-500/20 rounded-full blur-3xl animate-pulse-subtle pointer-events-none hidden dark:block" />

      <div className="flex items-center gap-2.5 relative z-10">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500/20 to-teal-500/20 flex items-center justify-center">
          <Zap className="w-4 h-4 text-teal-500 animate-pulse-subtle" />
        </div>
        <h3 className="text-sm font-bold text-foreground">Oracle Resolution</h3>
      </div>

      <p className="text-xs text-muted-foreground relative z-10 bg-muted/20 dark:bg-muted/10 rounded-lg px-3 py-2 border border-border/30 backdrop-blur-sm">
        This market is configured for automatic oracle resolution.
      </p>

      <div className="grid grid-cols-2 gap-2.5 text-xs relative z-10">
        <div className="p-3 rounded-xl bg-gradient-to-br from-muted/20 to-muted/10 border border-border/30 hover:border-teal-500/30 transition-all hover:shadow-md">
          <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider mb-1.5">
            Oracle Feed
          </span>
          <p className="font-mono text-[10px] truncate font-medium text-foreground">
            {market.oracleFeed.toString()}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-br from-muted/20 to-muted/10 border border-border/30 hover:border-teal-500/30 transition-all hover:shadow-md">
          <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider mb-1.5">
            Target
          </span>
          <p className="font-mono font-black text-sm text-foreground tabular-nums">
            {market.priceTarget
              ? (Number(market.priceTarget) / 1_000_000_000).toLocaleString()
              : "N/A"}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-br from-muted/20 to-muted/10 border border-border/30 hover:border-teal-500/30 transition-all hover:shadow-md">
          <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider mb-1.5">
            Condition
          </span>
          <p className="font-bold text-foreground">
            {market.comparisonType === 0
              ? "Greater Than"
              : market.comparisonType === 1
                ? "Less Than"
                : market.comparisonType === 2
                  ? "Equal To"
                  : "N/A"}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-br from-muted/20 to-muted/10 border border-border/30 hover:border-teal-500/30 transition-all hover:shadow-md">
          <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider mb-1.5">
            Metric
          </span>
          <p className="font-bold text-foreground">
            {market.metricType === 0
              ? "Market Cap"
              : market.metricType === 1
                ? "Market Cap"
                : market.metricType === 2
                  ? "Curve %"
                  : "Market Cap"}
          </p>
        </div>
      </div>

      {marketDateStatus.isExpired ? (
        resolveViaOracle && (
          <Button
            size="sm"
            className="w-full bg-gradient-to-r from-teal-500/15 to-teal-500/15 hover:from-teal-500/25 hover:to-teal-500/25 text-teal-600 dark:text-teal-400 border-2 border-teal-500/40 font-bold text-xs shadow-md hover:shadow-lg hover:shadow-teal-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] relative z-10"
            variant="outline"
            disabled={isResolving}
            onClick={handleResolve}
          >
            {isResolving ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                Resolving...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-1.5" />
                Resolve via Oracle
              </>
            )}
          </Button>
        )
      ) : (
        <p className="text-[11px] text-center text-muted-foreground bg-muted/20 dark:bg-muted/10 rounded-lg px-3 py-2.5 border border-border/30 backdrop-blur-sm relative z-10">
          Resolution available after market end date
          {marketDateStatus.endDateStr
            ? ` (${marketDateStatus.endDateStr})`
            : ""}
          .
        </p>
      )}
    </div>
  );
}
