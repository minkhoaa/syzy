"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOracleFeeds } from "@/features/admin/hooks/use-oracle-feeds";
import { OracleFeedTable } from "./oracle-feed-table";
import { OracleAddFeedDialog } from "./oracle-add-feed-dialog";
import { OracleScanDialog } from "./oracle-scan-dialog";
import { CreateFeedDialog } from "@/components/prediction/create-feed-dialog";
import { useOracleFeedStore } from "@/features/admin/store/use-oracle-feed-store";

export function OracleDashboard() {
  const {
    feeds,
    isLoading,
    isScanning,
    lastRefreshed,
    refresh,
    addFeedByAddress,
    scanForMyFeeds,
    removeFeed,
    updateLabel,
    bulkAddFeeds,
  } = useOracleFeeds();

  const store = useOracleFeedStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [metricFilter, setMetricFilter] = useState<string>("all");
  const [stalenessFilter, setStalenessFilter] = useState<string>("all");
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Initial load
  useEffect(() => {
    if (!hasLoadedOnce) {
      refresh().then(() => setHasLoadedOnce(true));
    }
  }, [refresh, hasLoadedOnce]);

  // Unique metric types for filter dropdown
  const uniqueMetricTypes = useMemo(() => {
    const types = new Map<number, string>();
    for (const feed of feeds) {
      if (feed.metricType !== null) {
        types.set(feed.metricType, feed.metricLabel);
      }
    }
    return Array.from(types.entries()).sort((a, b) => a[0] - b[0]);
  }, [feeds]);

  // Filtered feeds
  const filteredFeeds = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return feeds.filter((feed) => {
      // Metric filter
      if (metricFilter !== "all" && String(feed.metricType) !== metricFilter) {
        return false;
      }

      // Staleness filter
      if (stalenessFilter === "stale" && !feed.isStale) return false;
      if (stalenessFilter === "fresh" && feed.isStale) return false;

      // Search
      if (!query) return true;
      if (feed.address.toLowerCase().includes(query)) return true;
      if (feed.name.toLowerCase().includes(query)) return true;
      if (feed.metricLabel.toLowerCase().includes(query)) return true;
      if (feed.userLabel?.toLowerCase().includes(query)) return true;
      return feed.markets.some(
        (m) =>
          m.marketName.toLowerCase().includes(query) ||
          m.question.toLowerCase().includes(query),
      );
    });
  }, [feeds, searchQuery, metricFilter, stalenessFilter]);

  // Summary stats
  const totalFeeds = feeds.length;
  const feedsWithMarkets = feeds.filter((f) => f.markets.length > 0).length;
  const staleFeeds = feeds.filter((f) => f.isStale).length;

  const handleFeedCreated = (feedPubkey: string) => {
    store.addFeed({
      address: feedPubkey,
      source: "created",
      addedAt: Date.now(),
    });
    // Refresh after a short delay to let on-chain state settle
    setTimeout(() => refresh(), 2000);
  };

  if (!hasLoadedOnce && isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-12 w-full" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="secondary" className="text-sm">
          {totalFeeds} total feed{totalFeeds !== 1 ? "s" : ""}
        </Badge>
        <Badge variant="outline" className="text-sm">
          {feedsWithMarkets} with markets
        </Badge>
        {staleFeeds > 0 && (
          <Badge variant="destructive" className="text-sm">
            {staleFeeds} stale
          </Badge>
        )}
        {lastRefreshed > 0 && (
          <span className="text-xs text-muted-foreground ml-auto">
            Last refreshed: {new Date(lastRefreshed).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <CreateFeedDialog onFeedCreated={handleFeedCreated} />
        <OracleAddFeedDialog onAddFeed={addFeedByAddress} onRefresh={refresh} />
        <OracleScanDialog
          isScanning={isScanning}
          onScan={scanForMyFeeds}
          onImport={(selectedFeeds) => {
            bulkAddFeeds(selectedFeeds);
            setTimeout(() => refresh(), 500);
          }}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1" />
          )}
          Refresh
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search feeds, markets, or metrics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={metricFilter} onValueChange={setMetricFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All metrics" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All metrics</SelectItem>
            {uniqueMetricTypes.map(([type, label]) => (
              <SelectItem key={type} value={String(type)}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stalenessFilter} onValueChange={setStalenessFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="fresh">Fresh</SelectItem>
            <SelectItem value="stale">Stale</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Feed Table */}
      {filteredFeeds.length === 0 && feeds.length > 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No feeds match your filters</p>
        </div>
      ) : (
        <OracleFeedTable
          feeds={filteredFeeds}
          onRemoveFeed={removeFeed}
          onUpdateLabel={updateLabel}
        />
      )}
    </div>
  );
}
