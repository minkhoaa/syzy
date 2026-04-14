"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCoinGeckoPrice } from "@/features/analytics/hooks/use-coingecko";
import { useDbMarket } from "@/features/markets/hooks/use-db-market";
import { usePredictionMarket } from "@/features/trading/hooks/use-prediction-market";
import { buildEventFromMarket } from "@/app/(dashboard)/markets/_utils/build-event-from-market";
import { CommentSection } from "./comment-section";
import { MarketNewsSection } from "./market-news-section";
import { OrderTicket } from "./order-ticket";
import { MarketPositionCard } from "./market-position-card";
import type { BackendMarket } from "@/app/(dashboard)/markets/_utils/market-list-adapter";
import type { SubMarketData } from "@/features/markets/hooks/use-multi-market-detail";

/** Convert slug-style strings to title case (e.g. "democratic-party" → "Democratic party") */
function unslugify(slug: string): string {
  if (!slug || !slug.includes("-")) return slug;
  return slug
    .replace(/-/g, " ")
    .replace(/^(\w)/, (c) => c.toUpperCase());
}
import { MultiOutcomeChart } from "./multi-outcome-chart";

const OUTCOME_COLORS = [
  "#2563eb", // blue-600
  "#dc2626", // red-600
  "#16a34a", // green-600
  "#9333ea", // purple-600
  "#0d9488", // teal-600
  "#0891b2", // cyan-600
  "#c026d3", // fuchsia-600
  "#65a30d", // lime-600
];

interface MultiOutcomeDetailContentProps {
  parentMarket: BackendMarket;
  subMarkets: SubMarketData[];
  refresh: () => void;
}

export function MultiOutcomeDetailContent({
  parentMarket,
  subMarkets,
  refresh,
}: MultiOutcomeDetailContentProps) {
  const { data: solPrice } = useCoinGeckoPrice("solana");
  const solUsdPrice = solPrice?.current_price ?? 0;
  const { swap, claimWinnings, resolveViaOracle } = usePredictionMarket();
  const { dbMarketId } = useDbMarket(parentMarket.id, parentMarket.title);

  // Sort sub-markets by probability descending for default selection
  const sortedSubMarkets = useMemo(() => {
    return [...subMarkets].sort(
      (a, b) => (b.stats?.yesChances ?? 0) - (a.stats?.yesChances ?? 0)
    );
  }, [subMarkets]);

  // State: selected outcome for trading sidebar
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedSide, setSelectedSide] = useState<"yes" | "no">("yes");
  const selected = sortedSubMarkets[selectedIndex] ?? null;

  // Total volume across all sub-markets
  const totalVolume = subMarkets.reduce(
    (sum, s) => sum + (s.stats?.volume ?? 0),
    0
  );
  const totalVolumeUsd = totalVolume * solUsdPrice;
  const formattedVolume = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(totalVolumeUsd);

  const endDate = parentMarket.endDate ? new Date(parentMarket.endDate) : null;
  const endDateLabel = endDate
    ? endDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  // Build Event for the selected sub-market (for OrderTicket)
  const selectedEvent = useMemo(() => {
    if (!selected?.chainData || !selected.stats) return null;
    return buildEventFromMarket(
      selected.dbData.marketId,
      selected.chainData,
      selected.stats
    );
  }, [selected]);

  // Sub-market PDAs for chart
  const subMarketPdas = subMarkets.map((s) => s.dbData.marketId);

  return (
    <div className="min-h-screen bg-background pb-28 lg:pb-20 relative">
      {/* Hero background gradient */}
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-br from-primary/10 via-transparent to-secondary/5 pointer-events-none" />

      <div className="container mx-auto px-4 pt-4 md:pt-6 relative z-20">
        {/* Back link */}
        <Link
          href="/markets"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Markets
        </Link>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          {parentMarket.imageUrl && (
            <div className="shrink-0 w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-white/5 relative">
              <Image
                src={parentMarket.imageUrl}
                alt=""
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {parentMarket.category && (
                <Badge variant="outline" className="text-xs">
                  {parentMarket.category}
                </Badge>
              )}
              <Badge
                variant="outline"
                className="text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
              >
                {parentMarket.status || "active"}
              </Badge>
              {parentMarket.mutuallyExclusive && (
                <Badge
                  variant="outline"
                  className="text-xs bg-primary/10 text-primary border-primary/20"
                >
                  Mutually Exclusive
                </Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight mb-3">
              {parentMarket.title}
            </h1>

            {/* Outcomes Summary Bar */}
            <OutcomesSummaryBar
              subMarkets={sortedSubMarkets}
              selectedIndex={selectedIndex}
              onSelect={setSelectedIndex}
            />

            {/* Stats row */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground mt-3">
              <div className="flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4" />
                <span className="font-mono font-bold text-foreground">
                  {formattedVolume}
                </span>
                <span>Volume</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{subMarkets.length} Outcomes</span>
              </div>
              {endDateLabel && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{endDateLabel}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          {/* Left column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Multi-outcome chart */}
            <MultiOutcomeChart
              subMarkets={sortedSubMarkets}
              subMarketPdas={subMarketPdas}
              totalVolume={totalVolume}
              solUsdPrice={solUsdPrice}
              endDateLabel={endDateLabel}
            />

            {/* Outcomes List */}
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4">Outcomes</h2>
              <div className="space-y-2">
                {sortedSubMarkets.map((sub, idx) => {
                  const probability = sub.stats?.yesChances ?? 0;
                  const volume = sub.stats?.volume ?? 0;
                  const volumeUsd = volume * solUsdPrice;
                  const formattedVol = new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    notation: "compact",
                    maximumFractionDigits: 1,
                  }).format(volumeUsd);
                  const color = OUTCOME_COLORS[idx % OUTCOME_COLORS.length];
                  const isSelected = selectedIndex === idx;

                  return (
                    <div
                      key={sub.dbData.marketId}
                      onClick={() => setSelectedIndex(idx)}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all",
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border hover:border-primary/30 hover:bg-white/5"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        {sub.dbData.imageUrl && (
                          <div className="w-8 h-8 rounded-lg overflow-hidden relative shrink-0">
                            <Image
                              src={sub.dbData.imageUrl}
                              alt=""
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-sm font-semibold truncate block">
                            {unslugify(sub.dbData.outcomeLabel || sub.dbData.title)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formattedVol} Vol.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <span className="font-mono text-lg font-black tabular-nums">
                          {probability.toFixed(0)}%
                        </span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs font-bold bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-black"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedIndex(idx);
                              setSelectedSide("yes");
                            }}
                          >
                            Yes
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs font-bold bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-black"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedIndex(idx);
                              setSelectedSide("no");
                            }}
                          >
                            No
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* News */}
            <MarketNewsSection
              title={parentMarket.title}
              category={parentMarket.category}
            />

            {/* Comments */}
            <CommentSection dbMarketId={dbMarketId} />
          </div>

          {/* Right column — Trade Sidebar */}
          <div className="hidden lg:block lg:col-span-4 space-y-4 lg:sticky lg:top-4 lg:self-start">
            {selected && selectedEvent && selected.chainData && selected.stats ? (
              <>
                <div className="text-sm font-bold text-muted-foreground mb-2">
                  Trading:{" "}
                  <span className="text-foreground">
                    {unslugify(selected.dbData.outcomeLabel || selected.dbData.title)}
                  </span>
                </div>
                <OrderTicket
                  event={selectedEvent}
                  market={selected.chainData}
                  stats={selected.stats}
                  balances={selected.balances ?? undefined}
                  swap={swap!}
                  refresh={refresh}
                  claimWinnings={claimWinnings}
                  resolveViaOracle={resolveViaOracle}
                  initialSide={selectedSide}
                />
                <MarketPositionCard
                  marketAddress={selected.dbData.marketId}
                  market={selected.chainData}
                  balances={selected.balances ?? undefined}
                  claimWinnings={claimWinnings}
                  refresh={refresh}
                />
              </>
            ) : (
              <Card className="p-4">
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">
                    {subMarkets.length === 0
                      ? "Loading sub-markets..."
                      : "Select an outcome to trade"}
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Horizontal summary bar with colored dots + outcome names + percentages */
function OutcomesSummaryBar({
  subMarkets,
  selectedIndex,
  onSelect,
}: {
  subMarkets: SubMarketData[];
  selectedIndex: number;
  onSelect: (idx: number) => void;
}) {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      {subMarkets.map((sub, idx) => {
        const probability = sub.stats?.yesChances ?? 0;
        const color = OUTCOME_COLORS[idx % OUTCOME_COLORS.length];
        const isSelected = selectedIndex === idx;

        return (
          <button
            key={sub.dbData.marketId}
            onClick={() => onSelect(idx)}
            className={cn(
              "flex items-center gap-1.5 text-sm transition-all",
              isSelected
                ? "font-bold text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="truncate max-w-[120px]">
              {unslugify(sub.dbData.outcomeLabel || sub.dbData.title)}
            </span>
            <span className="font-mono font-black tabular-nums">
              {probability.toFixed(0)}%
            </span>
          </button>
        );
      })}
    </div>
  );
}
