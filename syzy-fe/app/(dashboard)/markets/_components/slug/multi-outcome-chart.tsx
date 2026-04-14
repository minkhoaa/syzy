"use client";

import { useState, useMemo } from "react";
import { useTheme } from "next-themes";
import { Loader2 } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  useMultiMarketSnapshots,
  type TimeRange,
} from "@/features/markets/hooks/use-multi-market-snapshots";
import type { SubMarketData } from "@/features/markets/hooks/use-multi-market-detail";

const OUTCOME_COLORS = [
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#9333ea",
  "#0d9488",
  "#0891b2",
  "#c026d3",
  "#65a30d",
];

const TIME_RANGES: { label: string; value: TimeRange }[] = [
  { label: "1D", value: "1d" },
  { label: "1W", value: "1w" },
  { label: "ALL", value: "all" },
];

interface MultiOutcomeChartProps {
  subMarkets: SubMarketData[];
  subMarketPdas: string[];
  totalVolume: number;
  solUsdPrice: number;
  endDateLabel: string | null;
}

interface ChartPoint {
  time: number;
  timeLabel: string;
  [key: string]: number | string;
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
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function MultiOutcomeChart({
  subMarkets,
  subMarketPdas,
  totalVolume,
  solUsdPrice,
  endDateLabel,
}: MultiOutcomeChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [timeRange, setTimeRange] = useState<TimeRange>("all");

  const { snapshots, loading, error } = useMultiMarketSnapshots(
    subMarketPdas,
    timeRange
  );

  // Build chart data: merge all snapshots by timestamp
  const chartData: ChartPoint[] = useMemo(() => {
    const timeMap = new Map<number, ChartPoint>();

    for (let i = 0; i < subMarketPdas.length; i++) {
      const pda = subMarketPdas[i];
      const points = snapshots[pda] ?? [];
      for (const pt of points) {
        const ts = new Date(pt.timestamp).getTime();
        if (!timeMap.has(ts)) {
          timeMap.set(ts, {
            time: ts,
            timeLabel: formatTimeLabel(pt.timestamp, timeRange),
          });
        }
        const entry = timeMap.get(ts)!;
        entry[`outcome_${i}`] = Math.round(pt.yesPrice * 100) / 100;
      }
    }

    return Array.from(timeMap.values()).sort((a, b) => a.time - b.time);
  }, [snapshots, subMarketPdas, timeRange]);

  const gridColor = isDark ? "#1e222d" : "#f0f0f0";
  const tickColor = isDark ? "#787B86" : "#999999";
  const cursorColor = isDark ? "#505050" : "#9B9B9B";

  const formattedTotalVolume = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(totalVolume * solUsdPrice);

  return (
    <div className="rounded-3xl border border-white/10 overflow-hidden bg-background/40 backdrop-blur-xl shadow-xl relative">
      <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />
      <div className="absolute inset-0 rounded-3xl ring-1 ring-white/10 pointer-events-none" />

      {/* Chart area */}
      <div className="h-[280px] sm:h-[380px] w-full relative z-10 p-4">
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
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, bottom: 20, left: 0 }}
            >
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
                  if (!active || !payload?.length) return null;
                  const point = payload[0]?.payload as ChartPoint;
                  return (
                    <div className="bg-surface-2/95 backdrop-blur-md border border-border/50 rounded-xl shadow-premium p-3 min-w-[160px]">
                      <div className="text-xs font-bold text-muted-foreground mb-2">
                        {point.timeLabel}
                      </div>
                      <div className="space-y-1.5">
                        {subMarkets.map((sub, idx) => {
                          const val = point[`outcome_${idx}`];
                          if (val === undefined) return null;
                          const color =
                            OUTCOME_COLORS[idx % OUTCOME_COLORS.length];
                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: color }}
                                />
                                <span className="text-xs font-medium text-foreground truncate max-w-[100px]">
                                  {sub.dbData.outcomeLabel || sub.dbData.title}
                                </span>
                              </div>
                              <span className="text-sm font-black text-foreground tabular-nums">
                                {Number(val).toFixed(1)}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }}
                cursor={{
                  stroke: cursorColor,
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
                isAnimationActive={false}
              />
              <Legend
                content={() => (
                  <div className="flex items-center gap-4 flex-wrap px-2 pt-2">
                    {subMarkets.map((sub, idx) => {
                      const color =
                        OUTCOME_COLORS[idx % OUTCOME_COLORS.length];
                      const prob = sub.stats?.yesChances ?? 0;
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 text-xs"
                        >
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-muted-foreground truncate max-w-[80px]">
                            {sub.dbData.outcomeLabel || sub.dbData.title}
                          </span>
                          <span className="font-mono font-bold text-foreground">
                            {prob.toFixed(1)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              />
              {subMarkets.map((_, idx) => (
                <Line
                  key={idx}
                  type="stepAfter"
                  dataKey={`outcome_${idx}`}
                  stroke={OUTCOME_COLORS[idx % OUTCOME_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer: volume + end date + time range */}
      <div className="border-t border-border/50 px-4 py-3 flex items-center justify-between relative z-10">
        <div className="text-xs text-muted-foreground">
          <span className="font-bold text-foreground">{formattedTotalVolume}</span>
          {" Vol"}
          {endDateLabel && (
            <>
              {" · "}
              <span>{endDateLabel}</span>
            </>
          )}
        </div>
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
