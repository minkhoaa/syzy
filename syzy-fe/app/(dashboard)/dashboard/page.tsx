"use client";

import { useMemo, useState } from "react";
import { FeaturedMarket } from "@/app/(dashboard)/markets/_components/featured-market";
import { MarketCard } from "@/app/(dashboard)/markets/_components/market-card";
import { MarketTabs } from "@/components/markets/market-tabs";
import { useMarketList } from "@/features/markets/hooks/use-market-list";
import { mergeMarketsWithGroups } from "@/app/(dashboard)/markets/_utils/market-list-adapter";
import { useBackendMarkets } from "@/features/markets/hooks/use-backend-markets";
import { Skeleton } from "@/components/ui/skeleton";
import { useTour } from "@/features/onboarding/hooks/use-tour";
import { steps as dashboardSteps, TOUR_ID, TOUR_VERSION } from "@/features/onboarding/tours/dashboard-tour";
import {
  type StatusFilter,
  type SortOption,
  filterByStatus,
  sortEvents,
  computeStatusCounts,
  isEventEnded,
} from "@/app/(dashboard)/markets/_utils/event-filters";

export default function DashboardPage() {
  useTour({ tourId: TOUR_ID, steps: dashboardSteps, version: TOUR_VERSION });
  const { markets, isLoading } = useMarketList();
  const { data: backendMarkets } = useBackendMarkets();
  const events = mergeMarketsWithGroups(markets, backendMarkets);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [sortBy, setSortBy] = useState<SortOption>("volume");
  const [searchQuery, setSearchQuery] = useState("");

  // Status counts from all events
  const statusCounts = useMemo(() => computeStatusCounts(events), [events]);

  // Active events for featured section (never show ended)
  const activeEvents = useMemo(
    () => events.filter((e) => !isEventEnded(e)),
    [events]
  );

  const featuredEvent = useMemo(
    () => activeEvents.find((e) => e.volume > 0.5 && (e.markets?.length ?? 0) > 0) || activeEvents[0],
    [activeEvents]
  );
  const hasFeatured = activeEvents.length > 0 && featuredEvent;

  // Filter pipeline: status → exclude featured → category → search → sort
  const gridEvents = useMemo(() => {
    let filtered = filterByStatus(events, statusFilter);

    // Exclude featured event from the grid (only if showing active)
    if (featuredEvent && statusFilter === "active") {
      filtered = filtered.filter((e) => e.id !== featuredEvent.id);
    }

    if (selectedCategory !== "All") {
      filtered = filtered.filter((e) => e.main_tag === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((e) => e.title.toLowerCase().includes(q));
    }

    if (statusFilter !== "ending-soon") {
      filtered = sortEvents(filtered, sortBy);
    }

    return filtered;
  }, [events, statusFilter, featuredEvent, selectedCategory, searchQuery, sortBy]);

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

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-4 md:p-6 space-y-6 md:space-y-8">
        <div className="container mx-auto space-y-6 md:space-y-8">
          <Skeleton className="h-[240px] md:h-[340px] w-full rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-[220px] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 md:p-6 space-y-6 md:space-y-8">
      <div className="container mx-auto space-y-6 md:space-y-8">
        {hasFeatured && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <FeaturedMarket event={featuredEvent} events={activeEvents} />
          </div>
        )}

        <MarketTabs
          categories={categories}
          onCategoryChange={setSelectedCategory}
          onStatusChange={setStatusFilter}
          onSortChange={setSortBy}
          onSearchChange={setSearchQuery}
          statusCounts={statusCounts}
          defaultStatus="active"
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">
              {sectionHeading}
            </h2>
            <span className="text-sm text-muted-foreground">
              {gridEvents.length} results
            </span>
          </div>

          <div data-tour="market-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 animate-in fade-in duration-700 delay-150">
            {gridEvents.map((event) => (
              <MarketCard key={event.id} event={event} />
            ))}
          </div>

          {gridEvents.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              {statusFilter === "ended"
                ? "No resolved markets yet."
                : statusFilter === "ending-soon"
                ? "No markets ending within 7 days."
                : "No markets found. Create one to get started."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
