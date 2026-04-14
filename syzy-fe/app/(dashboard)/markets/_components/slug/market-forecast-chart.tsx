"use client";

import { useState, useMemo } from "react";
import { useTheme } from "next-themes";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/components/ui/animated-number";
import type { Event } from "@/app/(dashboard)/markets/_types";
import {
  useMarketSnapshots,
  type TimeRange,
  type SnapshotPoint,
} from "@/features/markets/hooks/use-market-snapshots";

const TIME_RANGES: { label: string; value: TimeRange }[] = [
  { label: "1D", value: "1d" },
  { label: "1W", value: "1w" },
  { label: "ALL", value: "all" },
];

interface ChartDataPoint {
  time: number;
  timeLabel: string;
  yes: number;
  no: number;
}

function formatTimeLabel(isoString: string, range: TimeRange): string {
  const d = new Date(isoString);
  if (range === "1d") {
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  if (range === "1w") {
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

interface MarketForecastChartProps {
  event: Event;
  stats?: { yesChances: number; noChances: number } | null;
}

export function MarketForecastChart({
  event,
  stats,
}: MarketForecastChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [hoverData, setHoverData] = useState<ChartDataPoint | null>(null);

  const { snapshots, loading, error } = useMarketSnapshots({
    marketId: event.id,
    range: timeRange,
    currentYesChances: stats?.yesChances ?? null,
    currentNoChances: stats?.noChances ?? null,
  });

  const chartData: ChartDataPoint[] = useMemo(() => {
    return snapshots.map((s: SnapshotPoint) => ({
      time: new Date(s.timestamp).getTime(),
      timeLabel: formatTimeLabel(s.timestamp, timeRange),
      yes: Math.round(s.yesPrice * 100) / 100,
      no: Math.round(s.noPrice * 100) / 100,
    }));
  }, [snapshots, timeRange]);

  const currentYes = hoverData?.yes ?? stats?.yesChances ?? 50;
  const currentNo = hoverData?.no ?? stats?.noChances ?? 50;

  const change = useMemo(() => {
    if (chartData.length < 2) return null;
    const first = chartData[0].yes;
    const last = chartData[chartData.length - 1].yes;
    return last - first;
  }, [chartData]);

  const yesColor = "#26a65b";
  const noColor = "#ef4444";
  const gridColor = isDark ? "#1e222d" : "#f0f0f0";
  const tickColor = isDark ? "#787B86" : "#999999";
  const cursorColor = isDark ? "#505050" : "#9B9B9B";

  return (
    <div className="rounded-3xl border border-white/10 overflow-hidden bg-background/40 backdrop-blur-xl shadow-xl relative">
      {/* Glass texture overlay */}
      <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />

      {/* Edge highlight */}
      <div className="absolute inset-0 rounded-3xl ring-1 ring-white/10 pointer-events-none" />

      {/* Header */}
      <div className="px-4 pt-4 pb-2 relative z-10">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* YES indicator */}
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div
                  className="w-3 h-3 rounded-full animate-pulse-subtle"
                  style={{ backgroundColor: yesColor }}
                />
                <div
                  className="absolute inset-0 w-3 h-3 rounded-full opacity-40 animate-ping"
                  style={{ backgroundColor: yesColor }}
                />
              </div>
              <div>
                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider">
                  Yes
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-500 tabular-nums">
                  <AnimatedNumber value={currentYes} decimals={1} suffix="%" />
                </div>
              </div>
            </div>

            {/* NO indicator */}
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div
                  className="w-3 h-3 rounded-full animate-pulse-subtle"
                  style={{ backgroundColor: noColor }}
                />
                <div
                  className="absolute inset-0 w-3 h-3 rounded-full opacity-40 animate-ping"
                  style={{ backgroundColor: noColor }}
                />
              </div>
              <div>
                <div className="text-[10px] font-bold text-red-600 dark:text-red-500 uppercase tracking-wider">
                  No
                </div>
                <div className="text-2xl font-black text-red-600 dark:text-red-500 tabular-nums">
                  <AnimatedNumber value={currentNo} decimals={1} suffix="%" />
                </div>
              </div>
            </div>
          </div>

          {/* Change indicator badge */}
          {change !== null && Math.abs(change) > 0.1 && (
            <div
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold backdrop-blur-sm",
                change > 0
                  ? "bg-secondary/15 text-secondary border border-secondary/30"
                  : "bg-primary/15 text-primary border border-primary/30"
              )}
            >
              {change > 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span className="tabular-nums">
                {change > 0 ? "+" : ""}
                {change.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Chart area */}
      <div className="h-[240px] sm:h-[340px] w-full relative z-10">
        {loading && chartData.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <span className="text-sm text-destructive">
              Failed to load chart data
            </span>
          </div>
        )}
        {chartData.length === 0 && !loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <span className="text-sm text-muted-foreground">
              No history data yet. Check back soon.
            </span>
          </div>
        )}

        {chartData.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, bottom: 20, left: 0 }}
              onMouseMove={(e) => {
                const payload = (
                  e as {
                    activePayload?: Array<{ payload: ChartDataPoint }>;
                  }
                ).activePayload?.[0]?.payload;
                if (payload) setHoverData(payload);
              }}
              onMouseLeave={() => setHoverData(null)}
            >
              <defs>
                {/* Enhanced gradients with multiple stops */}
                <linearGradient id="yesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={yesColor} stopOpacity={0.4} />
                  <stop offset="50%" stopColor={yesColor} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={yesColor} stopOpacity={0.02} />
                </linearGradient>

                {/* Glow filter for the line */}
                <filter id="glowFilter">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke={gridColor}
                strokeDasharray="4 4"
                opacity={0.3}
              />
              <XAxis
                dataKey="time"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: tickColor, fontWeight: 500 }}
                tickFormatter={(ts: number) =>
                  formatTimeLabel(new Date(ts).toISOString(), timeRange)
                }
                dy={10}
                height={30}
              />
              <YAxis
                orientation="right"
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={(v: number) => `${v}%`}
                tick={{ fontSize: 10, fill: tickColor, fontWeight: 500 }}
                width={40}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as ChartDataPoint;
                    return (
                      <div className="bg-surface-2/95 dark:bg-surface-2/95 backdrop-blur-md border border-border/50 rounded-xl shadow-premium p-3 min-w-[140px] animate-fade-scale-in">
                        <div className="text-xs font-bold text-muted-foreground mb-2.5 tracking-wide">
                          {data.timeLabel}
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2.5 h-2.5 rounded-full ring-2 ring-background"
                                style={{ backgroundColor: yesColor }}
                              />
                              <span className="text-xs font-medium text-foreground">
                                Yes
                              </span>
                            </div>
                            <span className="text-sm font-black text-foreground tabular-nums">
                              {data.yes.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2.5 h-2.5 rounded-full ring-2 ring-background"
                                style={{ backgroundColor: noColor }}
                              />
                              <span className="text-xs font-medium text-foreground">
                                No
                              </span>
                            </div>
                            <span className="text-sm font-black text-foreground tabular-nums">
                              {data.no.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{
                  stroke: cursorColor,
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
                isAnimationActive={false}
              />
              <Area
                type="stepAfter"
                dataKey="yes"
                stroke={yesColor}
                strokeWidth={3}
                fill="url(#yesGradient)"
                dot={false}
                activeDot={{
                  r: 6,
                  strokeWidth: 3,
                  stroke: "#ffffff",
                  fill: yesColor,
                  className: "animate-success-bounce",
                }}
                isAnimationActive={false}
                filter="url(#glowFilter)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Time range buttons */}
      <div className="border-t border-border/50 p-3 flex items-center justify-center sm:justify-end relative z-10">
        <div className="flex gap-1 bg-muted/30 dark:bg-muted/20 p-1 rounded-full">
          {TIME_RANGES.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setTimeRange(value)}
              className={cn(
                "px-4 py-1.5 rounded-full text-[11px] font-bold transition-all duration-300",
                timeRange === value
                  ? "bg-foreground text-background shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
