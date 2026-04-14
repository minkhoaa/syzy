"use client";

import { RefreshCw, Users, Wallet, TrendingUp, Clock, AlertTriangle, Activity, DollarSign } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminMetrics, DateRange } from "@/features/admin/hooks/use-admin-metrics";

function MetricCard({
  icon: Icon,
  label,
  value,
  subValue,
  isLoading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subValue?: string;
  isLoading: boolean;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
      <div className="p-2 rounded-md bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        {isLoading ? (
          <Skeleton className="h-6 w-16 mt-1" />
        ) : (
          <>
            <p className="text-lg font-semibold">{value}</p>
            {subValue && (
              <p className="text-xs text-muted-foreground">{subValue}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function formatHours(hours: number | null): string {
  if (hours === null) return "N/A";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

function formatVolume(volume: number): string {
  if (volume >= 1_000_000) {
    return `${(volume / 1_000_000).toFixed(2)}M SOL`;
  }
  if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(2)}K SOL`;
  }
  return `${volume.toFixed(4)} SOL`;
}

export function ProductMetricsCard() {
  const {
    summary,
    isLoading,
    error,
    dateRange,
    setDateRange,
    refresh,
  } = useAdminMetrics();

  return (
    <div className="space-y-6">
      {/* Product Metrics */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Product Metrics</CardTitle>
              <CardDescription>
                User acquisition and trade funnel analytics
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Tabs
                value={dateRange}
                onValueChange={(v) => setDateRange(v as DateRange)}
              >
                <TabsList className="h-8">
                  <TabsTrigger value="7d" className="text-xs px-2 h-6">
                    7D
                  </TabsTrigger>
                  <TabsTrigger value="30d" className="text-xs px-2 h-6">
                    30D
                  </TabsTrigger>
                  <TabsTrigger value="all" className="text-xs px-2 h-6">
                    All
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={refresh}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-destructive" />
              <p>{error}</p>
              <Button variant="outline" size="sm" onClick={refresh} className="mt-4">
                Retry
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <MetricCard
                icon={Users}
                label="Unique Wallets"
                value={summary?.uniqueWallets ?? 0}
                isLoading={isLoading}
              />
              <MetricCard
                icon={Wallet}
                label="Wallet Connects"
                value={summary?.walletConnects ?? 0}
                isLoading={isLoading}
              />
              <MetricCard
                icon={TrendingUp}
                label="Trade Conversion"
                value={`${summary?.tradeConversion ?? 0}%`}
                isLoading={isLoading}
              />
              <MetricCard
                icon={Clock}
                label="Avg Time to First Trade"
                value={formatHours(summary?.avgTimeToFirstTrade ?? null)}
                isLoading={isLoading}
              />
              <MetricCard
                icon={Clock}
                label="Median Time to First Trade"
                value={formatHours(summary?.medianTimeToFirstTrade ?? null)}
                isLoading={isLoading}
              />
              <MetricCard
                icon={AlertTriangle}
                label="Failed Trades"
                value={summary?.failedTrades ?? 0}
                isLoading={isLoading}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* On-chain Metrics */}
      <Card>
        <CardHeader className="pb-4">
          <div>
            <CardTitle>On-chain Metrics</CardTitle>
            <CardDescription>
              Transaction and volume analytics
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-4 text-muted-foreground">
              <p>Failed to load on-chain metrics</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                icon={Activity}
                label="Total Transactions"
                value={summary?.totalTransactions ?? 0}
                subValue="Trade attempts"
                isLoading={isLoading}
              />
              <MetricCard
                icon={DollarSign}
                label="Total Volume"
                value={formatVolume(summary?.totalVolume ?? 0)}
                subValue="Completed trades"
                isLoading={isLoading}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
