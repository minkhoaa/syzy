"use client";

import { useState } from "react";
import type { Event } from "@/app/(dashboard)/markets/_types";
import type { MarketAccount } from "@/types/prediction-market.types";
import { MarketDetailHeader } from "@/app/(dashboard)/markets/_components/slug/market-detail-header";
import { MarketForecastChart } from "@/app/(dashboard)/markets/_components/slug/market-forecast-chart";
import { MarketRulesCard } from "@/app/(dashboard)/markets/_components/slug/market-rules-card";
import {
  OrderTicket,
  type SwapFn,
  type ClaimWinningsFn,
  type ResolveViaOracleFn,
} from "@/app/(dashboard)/markets/_components/slug/order-ticket";
import { MarketPositionCard } from "@/app/(dashboard)/markets/_components/slug/market-position-card";
import { OracleResolutionCard } from "@/app/(dashboard)/markets/_components/slug/oracle-resolution-card";
import { EditMarketDialog } from "@/app/(dashboard)/markets/_components/slug/edit-market-dialog";
import { CommentSection } from "@/app/(dashboard)/markets/_components/slug/comment-section";
import { MarketNewsSection } from "@/app/(dashboard)/markets/_components/slug/market-news-section";
import { Badge } from "@/components/ui/badge";
import { SolIcon } from "@/components/ui/sol-icon";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Pencil, Clock, TrendingUp } from "lucide-react";
import { useDbMarket } from "@/features/markets/hooks/use-db-market";
import { useCoinGeckoPrice } from "@/features/analytics/hooks/use-coingecko";
import { useIsAdmin } from "@/features/admin/hooks/use-is-admin";
import { cn } from "@/lib/utils";
import { useTour } from "@/features/onboarding/hooks/use-tour";
import { steps as marketDetailSteps, TOUR_ID, TOUR_VERSION } from "@/features/onboarding/tours/market-detail-tour";

function formatEndDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "No end date";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "No end date";
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 30) return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h left`;
  return "Ends soon";
}

export interface MarketDetailContentProps {
  event: Event;
  market: MarketAccount;
  stats: { yesChances: number; noChances: number; totalReserves: number };
  balances:
  | {
    yesBalance: number;
    noBalance: number;
    yesValueInSol: number;
    noValueInSol: number;
  }
  | undefined;
  swap: SwapFn;
  refresh: () => void;
  claimWinnings?: ClaimWinningsFn;
  resolveViaOracle?: ResolveViaOracleFn;
}

export function MarketDetailContent({
  event,
  market,
  stats,
  balances,
  swap,
  refresh,
  claimWinnings,
  resolveViaOracle,
}: MarketDetailContentProps) {
  useTour({ tourId: TOUR_ID, steps: marketDetailSteps, version: TOUR_VERSION });

  // event.id is the PDA (slug) -- fetch DB market to get UUID for comments
  // Pass title so the backend auto-creates the DB record if missing
  const { dbMarket, dbMarketId } = useDbMarket(event.id, event.title);
  const { data: solPrice } = useCoinGeckoPrice("solana");
  const { isAdmin } = useIsAdmin();
  const [editOpen, setEditOpen] = useState(false);
  const [tradeSheetOpen, setTradeSheetOpen] = useState(false);
  const solUsdPrice = solPrice?.current_price ?? 0;
  const volumeSol = new Intl.NumberFormat("en-US", { notation: "compact", compactDisplay: "short", maximumFractionDigits: 1 }).format(event.volume);
  const volumeUsd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", compactDisplay: "short", maximumFractionDigits: 1 }).format(event.volume * solUsdPrice);

  return (
    <div className="min-h-screen bg-background pb-28 lg:pb-20 relative">
      {/* Hero background gradient */}
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-br from-primary/10 via-transparent to-secondary/5 pointer-events-none" />

      {/* Subtle noise texture */}
      <div className="fixed inset-0 bg-noise opacity-[0.02] pointer-events-none" />

      <div className="container mx-auto px-4 pt-4 md:pt-6 relative z-20">
        <MarketDetailHeader event={event} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 relative z-20">
          <div className="lg:col-span-8 space-y-6 md:space-y-8">
            {/* Hero Section */}
            <div
              data-tour="market-hero"
              className="flex flex-col sm:flex-row gap-4 md:gap-6 animate-slide-up-fade"
              style={{
                animationDelay: "0ms",
                animationFillMode: "backwards",
              }}
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 shrink-0 relative group">
                <div className="absolute -inset-1 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <img
                  src={event.icon_url}
                  alt={event.title}
                  className="relative w-full h-full object-cover rounded-full border-4 border-border/50 shadow-premium ring-4 ring-background transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex-1 space-y-3">
                {/* Metadata badges */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 dark:bg-slate-800 backdrop-blur-xl border border-white/20 dark:border-slate-700 shadow-lg">
                    <Clock className="w-3.5 h-3.5 text-foreground/70" />
                    <span className="font-bold text-foreground">
                      {formatEndDate(event.end_date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 backdrop-blur-xl border border-black/5 dark:border-slate-700 shadow-sm">
                    <SolIcon className="w-3.5 h-3.5" />
                    <span className="font-bold text-foreground">{volumeSol}</span>
                    <span className="text-muted-foreground/50">~</span>
                    <span className="font-medium text-foreground/70">
                      {volumeUsd}
                    </span>
                  </div>
                  {(() => {
                    const hasEnded = market.isCompleted || (event.end_date && new Date(event.end_date).getTime() <= Date.now());
                    return (
                      <Badge
                        variant={hasEnded ? "secondary" : "default"}
                        className={cn(
                          "text-[10px] font-bold shadow-sm",
                          !hasEnded && "animate-pulse-subtle"
                        )}
                      >
                        {hasEnded ? "Ended" : "Live"}
                      </Badge>
                    );
                  })()}
                  {market.winningOutcome !== null && (
                    <Badge className={cn(
                      "text-[10px] font-bold border shadow-sm",
                      market.winningOutcome === 0
                        ? "bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/20"
                        : "bg-rose-500 text-white border-rose-600 shadow-rose-500/20"
                    )}>
                      Winner: {market.winningOutcome === 0 ? "YES" : "NO"}
                    </Badge>
                  )}
                  {dbMarket?.resolutionSource && (
                    <Badge variant="outline" className="text-[10px] font-medium">
                      Resolves via: {dbMarket.resolutionSource}
                    </Badge>
                  )}
                </div>

                {/* Title with gradient */}
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight bg-gradient-to-br from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent tracking-tight">
                    {event.title}
                  </h1>
                  {isAdmin && (
                    <button
                      onClick={() => setEditOpen(true)}
                      className="text-muted-foreground hover:text-foreground transition-all duration-200 p-1.5 rounded-lg hover:bg-muted/50 hover:scale-110 active:scale-95"
                      title="Edit market"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Chart Section */}
            <div
              data-tour="probability-chart"
              className="animate-slide-up-fade"
              style={{
                animationDelay: "100ms",
                animationFillMode: "backwards",
              }}
            >
              <MarketForecastChart event={event} stats={stats} />
            </div>

            {/* News Section */}
            <div
              className="animate-slide-up-fade"
              style={{
                animationDelay: "150ms",
                animationFillMode: "backwards",
              }}
            >
              <MarketNewsSection
                title={event.title}
                category={dbMarket?.category}
                tokenSymbol={dbMarket?.tokenSymbol}
              />
            </div>

            {/* Rules Section */}
            <div
              className="animate-slide-up-fade"
              style={{
                animationDelay: "250ms",
                animationFillMode: "backwards",
              }}
            >
              <MarketRulesCard event={event} />
            </div>

            {/* Comments Section */}
            <div
              className="animate-slide-up-fade"
              style={{
                animationDelay: "350ms",
                animationFillMode: "backwards",
              }}
            >
              <CommentSection dbMarketId={dbMarketId} />
            </div>
          </div>

          {/* Desktop sidebar */}
          <div className="hidden lg:block lg:col-span-4 space-y-4 lg:sticky lg:top-4 lg:self-start">
            <div
              className="animate-slide-up-fade"
              style={{ animationDelay: "100ms", animationFillMode: "backwards" }}
            >
              <OrderTicket
                event={event}
                market={market}
                stats={stats}
                balances={balances}
                swap={swap}
                refresh={refresh}
                claimWinnings={claimWinnings}
                resolveViaOracle={resolveViaOracle}
              />
            </div>
            <div
              className="animate-slide-up-fade"
              style={{ animationDelay: "200ms", animationFillMode: "backwards" }}
            >
              <MarketPositionCard
                marketAddress={event.id}
                market={market}
                balances={balances}
                claimWinnings={claimWinnings}
                refresh={refresh}
              />
            </div>
            <div
              className="animate-slide-up-fade"
              style={{ animationDelay: "300ms", animationFillMode: "backwards" }}
            >
              <OracleResolutionCard
                market={market}
                resolveViaOracle={resolveViaOracle}
                refresh={refresh}
              />
            </div>
          </div>
        </div>
      </div>

      {isAdmin && (
        <EditMarketDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          market={market}
          marketAddress={event.id}
          refresh={refresh}
        />
      )}

      {/* Mobile: Floating trade button */}
      <div className="fixed bottom-6 left-4 right-4 z-40 lg:hidden">
        <button
          onClick={() => setTradeSheetOpen(true)}
          className="w-full flex items-center justify-center gap-2.5 py-4 bg-primary text-white rounded-2xl font-bold text-base shadow-xl shadow-primary/30 active:scale-[0.98] transition-transform"
        >
          <TrendingUp className="w-5 h-5" />
          Trade
        </button>
      </div>

      {/* Mobile: Trade bottom sheet */}
      <Sheet open={tradeSheetOpen} onOpenChange={setTradeSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl px-4 pb-8 pt-4">
          <SheetHeader className="mb-4">
            <SheetTitle>Trade & Positions</SheetTitle>
          </SheetHeader>
          <div className="space-y-4">
            <OrderTicket
              event={event}
              market={market}
              stats={stats}
              balances={balances}
              swap={swap}
              refresh={refresh}
              claimWinnings={claimWinnings}
              resolveViaOracle={resolveViaOracle}
            />
            <MarketPositionCard
              marketAddress={event.id}
              market={market}
              balances={balances}
              claimWinnings={claimWinnings}
              refresh={refresh}
            />
            <OracleResolutionCard
              market={market}
              resolveViaOracle={resolveViaOracle}
              refresh={refresh}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
