"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Clock, Layers } from "lucide-react";
import { MarketCard } from "@/app/(dashboard)/markets/_components/market-card";
import { PolymarketEventCard } from "@/app/(dashboard)/markets/_components/polymarket-event-card";
import { KalshiEventCard } from "@/app/(dashboard)/markets/_components/kalshi-event-card";
import { MarketTabs } from "@/components/markets/market-tabs";
import { useMarketList } from "@/features/markets/hooks/use-market-list";
import { mergeMarketsWithGroups } from "@/app/(dashboard)/markets/_utils/market-list-adapter";
import { useBackendMarkets } from "@/features/markets/hooks/use-backend-markets";
import { usePolymarketEvents } from "@/features/markets/hooks/use-polymarket-events";
import { useKalshiEvents } from "@/features/markets/hooks/use-kalshi-events";
import { useIsAdmin } from "@/features/admin/hooks/use-is-admin";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  type StatusFilter,
  type SortOption,
  filterByStatus,
  sortEvents,
  computeStatusCounts,
} from "@/app/(dashboard)/markets/_utils/event-filters";

const COMING_SOON_CATEGORIES = ["politics", "elections", "science-and-technology"];

export default function MarketsPage() {
  const { markets, isLoading } = useMarketList();
  const { data: backendMarkets } = useBackendMarkets();
  const events = mergeMarketsWithGroups(markets, backendMarkets);
  const { isAdmin } = useIsAdmin();

  const [sourceTab, setSourceTab] = useState<"oyrade" | "polymarket" | "kalshi">("oyrade");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [sortBy, setSortBy] = useState<SortOption>("volume");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: polymarketEvents, isLoading: polymarketLoading } =
    usePolymarketEvents(
      sourceTab === "polymarket" ? { limit: 25, order: "volume24hr" } : null
    );

  const { data: kalshiEvents, isLoading: kalshiLoading } =
    useKalshiEvents(sourceTab === "kalshi" ? { limit: 25 } : null);

  // Compute status counts from all events (before any other filtering)
  const statusCounts = useMemo(() => computeStatusCounts(events), [events]);

  // Filter pipeline: status → category → search → sort
  const gridEvents = useMemo(() => {
    let filtered = filterByStatus(events, statusFilter);

    if (selectedCategory !== "All") {
      filtered = filtered.filter((e) => e.main_tag === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((e) => e.title.toLowerCase().includes(q));
    }

    // "ending-soon" already pre-sorted by soonest end date, skip re-sort
    if (statusFilter !== "ending-soon") {
      filtered = sortEvents(filtered, sortBy);
    }

    return filtered;
  }, [events, statusFilter, selectedCategory, searchQuery, sortBy]);

  // Derive categories from status-filtered events
  const categories = useMemo(() => {
    const statusFiltered = filterByStatus(events, statusFilter);
    return [...new Set(statusFiltered.map((e) => e.main_tag).filter(Boolean))];
  }, [events, statusFilter]);

  const sectionHeading = useMemo(() => {
    if (statusFilter === "ended") return "Resolved Markets";
    if (statusFilter === "ending-soon") return "Ending Soon";
    return selectedCategory;
  }, [statusFilter, selectedCategory]);

  const handleSourceTabChange = (tab: string) => {
    setSourceTab(tab as "oyrade" | "polymarket" | "kalshi");
    setStatusFilter("active");
    setSelectedCategory("All");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background relative">
        {/* Subtle background gradient */}
        <div className="fixed inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

        {/* Animated noise texture */}
        <div className="fixed inset-0 -z-10 bg-noise opacity-[0.02] pointer-events-none" />

        <div className="container mx-auto px-4 py-8 space-y-8">
          <Skeleton className="h-10 w-64 animate-skeleton-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="animate-stagger-fade"
                style={{
                  animationDelay: `${i * 50}ms`,
                  animationFillMode: 'backwards'
                }}
              >
                <Skeleton className="h-[220px] rounded-2xl bg-gradient-to-br from-surface-1 to-surface-2 border border-border/50 animate-skeleton-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

      {/* Animated noise texture */}
      <div className="fixed inset-0 -z-10 bg-noise opacity-[0.02] pointer-events-none" />

      <div className="container mx-auto px-4 py-8 space-y-8">
        <MarketTabs
          categories={sourceTab === "oyrade" ? categories : []}
          onCategoryChange={setSelectedCategory}
          onStatusChange={setStatusFilter}
          onSortChange={setSortBy}
          onSearchChange={setSearchQuery}
          statusCounts={sourceTab === "oyrade" ? statusCounts : undefined}
          defaultStatus="active"
          sourceTabs={
            isAdmin
              ? {
                  tabs: [
                    { label: "Syzy", value: "oyrade" },
                    { label: "Polymarket", value: "polymarket" },
                    { label: "Kalshi", value: "kalshi" },
                  ],
                  activeTab: sourceTab,
                  onTabChange: handleSourceTabChange,
                }
              : undefined
          }
        />

        {sourceTab === "kalshi" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Trending on Kalshi
              </h2>
              <span className="text-sm text-muted-foreground tabular-nums font-medium">
                {kalshiEvents?.length ?? 0} events
              </span>
            </div>

            {kalshiLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={i}
                    className="animate-stagger-fade"
                    style={{
                      animationDelay: `${i * 50}ms`,
                      animationFillMode: "backwards",
                    }}
                  >
                    <Skeleton className="h-[280px] rounded-2xl bg-gradient-to-br from-surface-1 to-surface-2 border border-border/50 animate-skeleton-pulse" />
                  </div>
                ))}
              </div>
            ) : kalshiEvents && kalshiEvents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {kalshiEvents.map((event, index) => (
                  <div
                    key={event.eventTicker}
                    className="animate-stagger-fade"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animationFillMode: "backwards",
                    }}
                  >
                    <KalshiEventCard event={event} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 space-y-4 animate-fade-scale-in">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                  <Clock className="w-10 h-10 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium text-muted-foreground">
                  No Kalshi events found
                </p>
                <p className="text-sm text-muted-foreground/70">
                  Check back later for trending events
                </p>
              </div>
            )}
          </div>
        ) : sourceTab === "polymarket" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Trending on Polymarket
              </h2>
              <span className="text-sm text-muted-foreground tabular-nums font-medium">
                {polymarketEvents?.length ?? 0} events
              </span>
            </div>

            {polymarketLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={i}
                    className="animate-stagger-fade"
                    style={{
                      animationDelay: `${i * 50}ms`,
                      animationFillMode: "backwards",
                    }}
                  >
                    <Skeleton className="h-[280px] rounded-2xl bg-gradient-to-br from-surface-1 to-surface-2 border border-border/50 animate-skeleton-pulse" />
                  </div>
                ))}
              </div>
            ) : polymarketEvents && polymarketEvents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {polymarketEvents.map((event, index) => (
                  <div
                    key={event.id}
                    className="animate-stagger-fade"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animationFillMode: "backwards",
                    }}
                  >
                    <PolymarketEventCard event={event} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 space-y-4 animate-fade-scale-in">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                  <Clock className="w-10 h-10 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium text-muted-foreground">
                  No Polymarket events found
                </p>
                <p className="text-sm text-muted-foreground/70">
                  Check back later for trending events
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                {sectionHeading}
              </h2>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground tabular-nums font-medium">
                  {gridEvents.length} results
                </span>
                <Button asChild size="sm" variant="outline" className="shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                  <Link href="/markets/create-group">
                    <Layers className="mr-1.5 h-4 w-4" />
                    Multi-Outcome
                  </Link>
                </Button>
                <Button asChild size="sm" className="shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                  <Link href="/markets/create">
                    <Plus className="mr-1.5 h-4 w-4" />
                    Create Market
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {gridEvents.map((event, index) => (
                <div
                  key={event.id}
                  className="animate-stagger-fade"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: 'backwards'
                  }}
                >
                  <MarketCard event={event} />
                </div>
              ))}
            </div>

            {gridEvents.length === 0 && (
              <div className="text-center py-20 space-y-4 animate-fade-scale-in">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                  <Clock className="w-10 h-10 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium text-muted-foreground">
                  No markets found
                </p>
                <p className="text-sm text-muted-foreground/70">
                  {statusFilter === "ended"
                    ? "No resolved markets yet"
                    : statusFilter === "ending-soon"
                    ? "No markets ending within 7 days"
                    : "Create one to get started"}
                </p>
                {statusFilter === "active" && (
                  <Button asChild className="mt-4">
                    <Link href="/markets/create">
                      <Plus className="mr-1.5 h-4 w-4" />
                      Create Market
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
