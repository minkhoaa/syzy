"use client";

import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Shield,
  ShieldCheck,
  TrendingUp,
  X,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { useMultiSidebar } from "@/components/ui/multi-sidebar";
import { usePortfolio, useTradeHistory, type Position, type TradeHistoryItem } from "@/features/portfolio/hooks/use-portfolio";
import { formatSolValue } from "@/features/portfolio/utils/portfolio";

function HistoryCard({ item }: { item: TradeHistoryItem }) {
  const direction = item.metadata?.direction?.toString().toUpperCase();
  const tokenType = item.metadata?.tokenType?.toString().toUpperCase();
  const isBuy = direction === "BUY";
  const isYes = tokenType === "YES";
  const amount = item.metadata?.amount || 0;
  const txSignature = item.metadata?.txSignature;

  const solscanUrl = txSignature
    ? `https://solscan.io/tx/${txSignature}?cluster=devnet`
    : null;

  return (
    <a
      href={solscanUrl || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(!solscanUrl && "pointer-events-none")}
    >
      <Card className="p-3 bg-card/30 border-border/50 hover:bg-card/50 hover:border-primary/30 transition-all cursor-pointer">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn(
              "w-6 h-6 rounded-md flex items-center justify-center shrink-0",
              isBuy ? "bg-emerald-100" : "bg-rose-100"
            )}>
              {isBuy ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[10px] px-1.5 py-0 h-4 font-bold",
                    isYes ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  )}
                >
                  {isYes ? "YES" : "NO"}
                </Badge>
                <span className={cn(
                  "text-[10px] font-medium",
                  isBuy ? "text-emerald-600" : "text-rose-600"
                )}>
                  {isBuy ? "Buy" : "Sell"}
                </span>
              </div>
              {txSignature && (
                <Typography variant="small" className="text-[10px] text-muted-foreground font-mono truncate">
                  {txSignature.slice(0, 6)}...{txSignature.slice(-4)}
                </Typography>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <Typography variant="small" weight="semibold" className="text-xs">
              {formatSolValue(amount)}
            </Typography>
            <Typography variant="small" className="text-[10px] text-muted-foreground">
              {new Date(item.createdAt).toLocaleDateString()}
            </Typography>
          </div>
          {solscanUrl && (
            <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
          )}
        </div>
      </Card>
    </a>
  );
}

function PositionCard({ position }: { position: Position }) {
  return (
    <Card
      className={cn(
        "p-4 backdrop-blur-sm border hover:shadow-sm transition-all",
        position.isShielded
          ? "bg-primary/5 border-primary/30 hover:bg-primary/10"
          : "bg-card/30 border-border/50 hover:bg-card/50"
      )}
    >
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div className="flex gap-3 flex-1">
            <div
              className={cn(
                "w-8 h-8 rounded-lg overflow-hidden shrink-0 border relative",
                position.isShielded ? "border-primary/40" : "border-border/50"
              )}
            >
              {position.imageUrl ? (
                <Image
                  src={position.imageUrl}
                  alt=""
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted/50 flex items-center justify-center text-sm">
                  {position.avatar}
                </div>
              )}
              {position.isShielded && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                  <ShieldCheck className="w-2.5 h-2.5 text-primary-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <Typography variant="small" weight="semibold" className="line-clamp-1 leading-tight text-foreground">
                  {position.eventTitle || position.market}
                </Typography>
                {position.isShielded && (
                  <Shield className="w-3 h-3 text-primary shrink-0" />
                )}
              </div>
              {position.marketTitle && (
                <Typography variant="small" className="line-clamp-2 leading-tight text-muted-foreground text-xs mt-0.5">
                  {position.marketTitle}
                </Typography>
              )}
            </div>
          </div>
          <Link href={`/markets/${position.marketId}`}>
            <Button variant="ghost" size="icon-sm" className="h-6 w-6 text-muted-foreground hover:text-primary">
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={position.position === "Yes" ? "default" : "secondary"}
            className={cn(
              "text-xs font-semibold",
              position.isShielded && "ring-1 ring-primary/40"
            )}
          >
            {position.position.toUpperCase()}
          </Badge>
          <span
            className={cn(
              "text-xs font-medium flex items-center gap-1",
              position.isProfit ? "text-secondary" : "text-destructive"
            )}
          >
            <TrendingUp className="h-3 w-3" />
            {position.change}
          </span>
          {position.isShielded && (
            <Badge variant="secondary" className="text-xs font-medium">
              SHIELDED
            </Badge>
          )}
        </div>

        <div
          className={cn(
            "grid grid-cols-2 gap-y-2 gap-x-3 pt-2 border-t text-xs",
            position.isShielded ? "border-primary/20" : "border-border/30"
          )}
        >
          <div>
            <div className="text-muted-foreground font-medium mb-0.5">Current Value</div>
            <span
              className={cn(
                "font-semibold",
                position.isProfit ? "text-secondary" : "text-destructive"
              )}
            >
              {position.valueNow}
            </span>
          </div>
          <div className="text-right">
            <div className="text-muted-foreground font-medium mb-0.5">Payout</div>
            <div className="font-semibold text-foreground">{position.payoutIfWin}</div>
          </div>
          <div>
            <div className="text-muted-foreground font-medium mb-0.5">Contracts</div>
            <div className="text-foreground font-medium">{position.contracts}</div>
          </div>
          <div className="text-right">
            <div className="text-muted-foreground font-medium mb-0.5">Avg Price</div>
            <div className="text-foreground font-medium">{position.avgPrice}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function RightSidebar() {
  const { toggleRightSidebar } = useMultiSidebar();
  const [activeTab, setActiveTab] = useState<"position" | "history">("position");
  const { positions, stats, isLoading, tradeStats } = usePortfolio();
  const { data: historyData, isLoading: isLoadingHistory } = useTradeHistory(1, 10);

  // Convert new stats format to display-friendly format
  const displayStats = {
    total: `${stats.totalValueSol.toFixed(4)} SOL`,
    change: stats.totalPositions > 0 ? `${stats.activePositions} active` : "",
    positions: String(stats.totalPositions),
    cash: `${tradeStats?.totalVolume?.toFixed(2) || "0"} SOL`,
    interest: `${tradeStats?.successRate?.toFixed(0) || 0}% win`,
  };

  const tabs = [
    { id: "position" as const, label: "Position" },
    { id: "history" as const, label: "History" },
  ];

  if (isLoading) {
    return (
      <div className="h-full w-full bg-background flex items-center justify-center border-l border-border/50">
        <Typography variant="small" className="text-muted-foreground">
          Loading portfolio...
        </Typography>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-background flex flex-col border-l border-border/50">
      {/* Header */}
      <div className="border-b border-border/50 p-4 shrink-0">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <Typography variant="h3" weight="semibold">
              Portfolio
            </Typography>
            <Typography variant="small" className="text-muted-foreground">
              {displayStats.total} total
            </Typography>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleRightSidebar}
            className="h-6 w-6"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Main Balance */}
      <div className="p-4 border-b border-border/50 text-center">
        <div className="flex items-center justify-center gap-2">
          <Typography variant="h1" weight="semibold" className="text-3xl tracking-tight">
            {displayStats.total}
          </Typography>
          <Typography variant="small" className="text-secondary font-medium text-sm">
            {displayStats.change}
          </Typography>
        </div>
      </div>

      {/* Stats Row */}
      <div className="p-4 border-b border-border/50">
        <div className="flex justify-center gap-8">
          <div className="flex flex-col gap-1 text-center">
            <Typography variant="small" className="text-muted-foreground font-medium text-xs uppercase tracking-wide">
              Positions
            </Typography>
            <Typography variant="small" weight="semibold" className="text-base">
              {displayStats.positions}
            </Typography>
          </div>

          <div className="flex flex-col gap-1 text-center group cursor-pointer hover:opacity-70 transition-opacity">
            <div className="flex items-center justify-center gap-1">
              <Typography variant="small" className="text-muted-foreground font-medium text-xs uppercase tracking-wide">
                Volume
              </Typography>
              <Plus className="h-3 w-3 text-muted-foreground" />
            </div>
            <Typography variant="small" weight="semibold" className="text-base">
              {displayStats.cash}
            </Typography>
          </div>

          <div className="flex flex-col gap-1 text-center group cursor-pointer hover:opacity-70 transition-opacity">
            <div className="flex items-center justify-center gap-1">
              <Typography variant="small" className="text-muted-foreground font-medium text-xs uppercase tracking-wide">
                Win Rate
              </Typography>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
            </div>
            <Typography variant="small" weight="semibold" className="text-base">
              {displayStats.interest}
            </Typography>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-border/50">
        <nav className="flex justify-center px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "pb-3 pt-2 px-6 border-b-2 font-medium text-sm transition-colors",
                activeTab === tab.id
                  ? "border-primary font-semibold text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === "position" && (
          <div className="space-y-3">
            {positions.length > 0 ? (
              positions.map((position) => (
                <PositionCard key={position.id} position={position} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Typography variant="small" className="text-muted-foreground">
                  No active positions
                </Typography>
                <Typography variant="small" className="text-xs mt-1 text-muted-foreground">
                  Your predictions will appear here
                </Typography>
              </div>
            )}
          </div>
        )}
        
        {activeTab === "history" && (
          <div className="space-y-2">
            {isLoadingHistory ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Typography variant="small" className="text-muted-foreground">
                  Loading history...
                </Typography>
              </div>
            ) : historyData && historyData.items.length > 0 ? (
              historyData.items.map((item) => (
                <HistoryCard key={item.id} item={item} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Typography variant="small" className="text-muted-foreground">
                  No transaction history
                </Typography>
                <Typography variant="small" className="text-xs mt-1 text-muted-foreground">
                  Your completed predictions will appear here
                </Typography>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}