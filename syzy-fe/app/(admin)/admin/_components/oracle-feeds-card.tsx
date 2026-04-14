"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/ui/copy-button";
import { useMarketList } from "@/features/markets/hooks/use-market-list";
import { METRIC_LABELS } from "@/lib/switchboard/job-templates";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { ChevronDown, ChevronRight, ExternalLink, Search } from "lucide-react";
import Link from "next/link";

const COMPARISON_LABELS: Record<number, string> = {
  0: ">",
  1: "<",
  2: "=",
};

interface FeedMarket {
  publicKey: PublicKey;
  marketName: string;
  question: string;
  slug: string;
  category: string;
  isCompleted: boolean;
  priceTarget: number;
  comparisonType: number | null;
  comparisonLabel: string;
}

interface OracleFeedGroup {
  feedAddress: string;
  metricType: number | null;
  metricLabel: string;
  markets: FeedMarket[];
}

export function OracleFeedsCard() {
  const { markets, isLoading } = useMarketList();
  const [searchQuery, setSearchQuery] = useState("");
  const [metricFilter, setMetricFilter] = useState<string>("all");
  const [expandedFeeds, setExpandedFeeds] = useState<Set<string>>(new Set());

  const feedGroups = useMemo(() => {
    const groupMap = new Map<string, OracleFeedGroup>();

    for (const market of markets) {
      const oracleFeed = market.account.oracleFeed;
      if (!oracleFeed || oracleFeed.equals(SystemProgram.programId)) continue;

      const feedAddr = oracleFeed.toString();
      const metricType = market.account.metricType ?? null;
      const comparisonType = market.account.comparisonType ?? null;
      const priceTargetRaw = market.account.priceTarget;
      const priceTarget = priceTargetRaw ? Number(priceTargetRaw) / 1e9 : 0;

      const feedMarket: FeedMarket = {
        publicKey: market.publicKey,
        marketName: market.ticker,
        question: market.question,
        slug: market.slug,
        category: market.category,
        isCompleted: market.account.isCompleted,
        priceTarget,
        comparisonType,
        comparisonLabel: comparisonType !== null
          ? COMPARISON_LABELS[comparisonType] ?? String(comparisonType)
          : "?",
      };

      if (groupMap.has(feedAddr)) {
        groupMap.get(feedAddr)!.markets.push(feedMarket);
      } else {
        groupMap.set(feedAddr, {
          feedAddress: feedAddr,
          metricType,
          metricLabel: metricType !== null
            ? METRIC_LABELS[metricType] ?? `Type ${metricType}`
            : "Unknown",
          markets: [feedMarket],
        });
      }
    }

    return Array.from(groupMap.values());
  }, [markets]);

  const uniqueMetricTypes = useMemo(() => {
    const types = new Map<number, string>();
    for (const group of feedGroups) {
      if (group.metricType !== null) {
        types.set(group.metricType, group.metricLabel);
      }
    }
    return Array.from(types.entries()).sort((a, b) => a[0] - b[0]);
  }, [feedGroups]);

  const filteredGroups = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return feedGroups.filter((group) => {
      if (metricFilter !== "all" && String(group.metricType) !== metricFilter) {
        return false;
      }
      if (!query) return true;
      if (group.feedAddress.toLowerCase().includes(query)) return true;
      if (group.metricLabel.toLowerCase().includes(query)) return true;
      return group.markets.some(
        (m) =>
          m.marketName.toLowerCase().includes(query) ||
          m.question.toLowerCase().includes(query)
      );
    });
  }, [feedGroups, searchQuery, metricFilter]);

  const totalMarkets = feedGroups.reduce((sum, g) => sum + g.markets.length, 0);

  const toggleFeed = (feedAddress: string) => {
    setExpandedFeeds((prev) => {
      const next = new Set(prev);
      if (next.has(feedAddress)) next.delete(feedAddress);
      else next.add(feedAddress);
      return next;
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Oracle Feeds</CardTitle>
          <CardDescription>Loading oracle feed data...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Oracle Feeds</CardTitle>
            <CardDescription>
              Switchboard oracle feeds used across prediction markets
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{feedGroups.length} feeds</Badge>
            <Badge variant="outline">{totalMarkets} markets</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search & Filter */}
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
        </div>

        {/* Feed List */}
        {feedGroups.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No oracle feeds found</p>
            <p className="text-xs mt-1">
              Markets with oracle feeds will appear here
            </p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No feeds match your search</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredGroups.map((group) => {
              const isExpanded = expandedFeeds.has(group.feedAddress);
              const firstMarket = group.markets[0];

              return (
                <div
                  key={group.feedAddress}
                  className="border rounded-lg overflow-hidden"
                >
                  {/* Collapsed row */}
                  <button
                    type="button"
                    onClick={() => toggleFeed(group.feedAddress)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}

                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <code className="text-xs font-mono truncate max-w-[200px]">
                        {group.feedAddress.slice(0, 8)}...{group.feedAddress.slice(-6)}
                      </code>
                      <CopyButton text={group.feedAddress} size="sm" />
                    </div>

                    <Badge variant="secondary" className="shrink-0">
                      {group.metricLabel}
                    </Badge>
                    <Badge variant="outline" className="shrink-0">
                      {group.markets.length} market{group.markets.length !== 1 ? "s" : ""}
                    </Badge>

                    <span className="text-xs text-muted-foreground truncate max-w-[200px] hidden md:inline">
                      {firstMarket.marketName}
                      {firstMarket.comparisonLabel && firstMarket.priceTarget
                        ? ` ${firstMarket.comparisonLabel} ${firstMarket.priceTarget}`
                        : ""}
                    </span>
                  </button>

                  {/* Expanded sub-list */}
                  {isExpanded && (
                    <div className="border-t bg-muted/30">
                      <div className="px-3 py-2 text-xs text-muted-foreground font-medium border-b">
                        Full address:{" "}
                        <code className="font-mono">{group.feedAddress}</code>
                        <CopyButton
                          text={group.feedAddress}
                          size="sm"
                          className="ml-1 inline-flex"
                        />
                      </div>
                      {group.markets.map((m) => (
                        <div
                          key={m.publicKey.toString()}
                          className="flex items-center gap-3 px-3 py-2.5 border-b last:border-b-0 hover:bg-muted/50"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {m.marketName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {m.question}
                            </p>
                          </div>

                          <Badge
                            variant={m.isCompleted ? "outline" : "default"}
                            className="shrink-0"
                          >
                            {m.isCompleted ? "Resolved" : "Active"}
                          </Badge>

                          <span className="text-xs font-mono text-muted-foreground shrink-0">
                            {m.comparisonLabel} {m.priceTarget}
                          </span>

                          {m.slug && (
                            <Link
                              href={`/markets/${m.slug}`}
                              className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
