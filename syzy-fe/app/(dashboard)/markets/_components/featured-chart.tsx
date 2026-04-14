
"use client";

import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Loader2 } from 'lucide-react';
import { RollingNumber } from "@/components/ui/rolling-number";
import { Event } from '@/app/(dashboard)/markets/_types';
import { useMarketSnapshots, type SnapshotPoint } from '@/features/markets/hooks/use-market-snapshots';

interface FeaturedChartProps {
    event: Event;
    compact?: boolean;
}

function formatTimeLabel(isoString: string): string {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface ChartDataPoint {
    time: number;
    timeLabel: string;
    yes: number;
    no: number;
}

export const FeaturedChart: React.FC<FeaturedChartProps> = ({ event, compact = false }) => {
    const [hoverData, setHoverData] = useState<ChartDataPoint | null>(null);

    const activeMarket = event.markets?.[0];
    if (!activeMarket) return null;
    const isBinary = activeMarket.outcomes?.length === 2 && activeMarket.outcomes[0]?.label === 'Yes';

    const { snapshots, loading, error } = useMarketSnapshots({
        marketId: activeMarket.id,
        range: "all",
        currentYesChances: activeMarket.probability,
        currentNoChances: 100 - activeMarket.probability,
    });

    const chartData: ChartDataPoint[] = useMemo(() => {
        return snapshots.map((s: SnapshotPoint) => ({
            time: new Date(s.timestamp).getTime(),
            timeLabel: formatTimeLabel(s.timestamp),
            yes: Math.round(s.yesPrice * 100) / 100,
            no: Math.round(s.noPrice * 100) / 100,
        }));
    }, [snapshots]);

    const currentYes = Number((hoverData?.yes ?? activeMarket.probability).toFixed(2));
    const currentNo = Number((hoverData?.no ?? (100 - activeMarket.probability)).toFixed(2));
    const displayTime = hoverData ? hoverData.timeLabel.toUpperCase() : 'CURRENT';

    const yesColor = "hsl(142.0859 70.5628% 45.2941%)";
    const noColor = "hsl(21.5534 100% 59.6078%)";

    return (
        <div className={compact
            ? "w-full h-full flex flex-col pt-2 pb-2 px-3 overflow-hidden relative"
            : "w-full h-full flex flex-col pt-5 pb-4 px-6 overflow-hidden relative"
        }>
            {/* Header */}
            <div className={compact
                ? "flex items-center gap-4 mb-1 z-10 relative pointer-events-none shrink-0"
                : "flex flex-col gap-2 mb-2 z-10 relative pointer-events-none min-h-[60px] shrink-0"
            }>
                {compact ? (
                    /* Compact: single row with Yes/No percentages */
                    <>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: yesColor }} />
                            <span className="text-sm font-black text-foreground tabular-nums">
                                {currentYes.toFixed(2)}%
                            </span>
                            <span className="text-[10px] text-muted-foreground font-semibold">Yes</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: noColor }} />
                            <span className="text-sm font-black text-foreground tabular-nums">
                                {currentNo.toFixed(2)}%
                            </span>
                            <span className="text-[10px] text-muted-foreground font-semibold">No</span>
                        </div>
                    </>
                ) : (
                    /* Desktop: full header */
                    <>
                        <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                            {displayTime} FORECAST
                        </div>
                        <div className="flex items-start gap-6">
                            <div className="flex flex-col gap-0.5 min-w-[80px]">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-2.5 h-2.5 rounded-full shadow-sm shrink-0 transition-transform duration-300"
                                        style={{ backgroundColor: yesColor, transform: hoverData ? 'scale(1.2)' : 'scale(1)' }}
                                    />
                                    <span className="text-2xl font-bold text-foreground tabular-nums leading-none tracking-tight flex items-baseline">
                                        <RollingNumber value={currentYes} suffix="%" className="font-black" />
                                    </span>
                                </div>
                                <span className="text-[11px] font-semibold text-muted-foreground truncate w-full pl-5 block opacity-80 leading-tight">
                                    {isBinary ? 'Yes' : (activeMarket.short_title || activeMarket.title)}
                                </span>
                            </div>
                            <div className="flex flex-col gap-0.5 min-w-[80px]">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-2.5 h-2.5 rounded-full shadow-sm shrink-0 transition-transform duration-300"
                                        style={{ backgroundColor: noColor, transform: hoverData ? 'scale(1.2)' : 'scale(1)' }}
                                    />
                                    <span className="text-2xl font-bold text-foreground tabular-nums leading-none tracking-tight flex items-baseline">
                                        <RollingNumber value={currentNo} suffix="%" className="font-black" />
                                    </span>
                                </div>
                                <span className="text-[11px] font-semibold text-muted-foreground truncate w-full pl-5 block opacity-80 leading-tight">
                                    No
                                </span>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Chart Area */}
            <div className={compact ? "w-full flex-1 min-h-0 relative" : "w-full flex-1 min-h-0 relative -ml-2 mt-2"}>
                {loading && chartData.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                )}
                {error && !loading && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <span className="text-xs text-muted-foreground">No chart data available</span>
                    </div>
                )}
                {chartData.length === 0 && !loading && !error && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <span className="text-xs text-muted-foreground">No history data yet</span>
                    </div>
                )}

                {chartData.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={chartData}
                            margin={compact
                                ? { top: 5, right: 5, bottom: 0, left: 0 }
                                : { top: 10, right: 10, bottom: 20, left: 0 }
                            }
                            onMouseMove={(e) => {
                                const payload = (e as { activePayload?: Array<{ payload: ChartDataPoint }> }).activePayload?.[0]?.payload;
                                if (payload) setHoverData(payload);
                            }}
                            onMouseLeave={() => setHoverData(null)}
                        >
                            <defs>
                                <linearGradient id="featuredYesGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={yesColor} stopOpacity={0.3} />
                                    <stop offset="100%" stopColor={yesColor} stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} stroke="#d4d4d8" strokeDasharray="4 4" strokeOpacity={0.4} />
                            {!compact && (
                                <XAxis
                                    dataKey="timeLabel"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#71717a', fontWeight: 500 }}
                                    interval="preserveStartEnd"
                                    dy={10}
                                    height={30}
                                />
                            )}
                            <YAxis
                                orientation="right"
                                axisLine={false}
                                tickLine={false}
                                domain={[0, 100]}
                                ticks={compact ? [0, 50, 100] : [0, 25, 50, 75, 100]}
                                tickFormatter={(v) => `${v}%`}
                                tick={{ fontSize: compact ? 9 : 10, fill: '#71717a', fontWeight: 500 }}
                                width={compact ? 28 : 35}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload as ChartDataPoint;
                                        return (
                                            <div className="bg-popover border border-border rounded-lg shadow-lg p-2 min-w-[100px]">
                                                <div className="text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wide">
                                                    {data.timeLabel}
                                                </div>
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: yesColor }} />
                                                            <span className="text-[10px] font-medium text-foreground">Yes</span>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-foreground tabular-nums">
                                                            {data.yes.toFixed(2)}%
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: noColor }} />
                                                            <span className="text-[10px] font-medium text-foreground">No</span>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-foreground tabular-nums">
                                                            {data.no.toFixed(2)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                                cursor={{ stroke: '#1f2937', strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.8 }}
                                isAnimationActive={false}
                            />
                            <Area
                                type="stepAfter"
                                dataKey="yes"
                                stroke={yesColor}
                                strokeWidth={compact ? 2 : 2.5}
                                fill="url(#featuredYesGradient)"
                                dot={false}
                                activeDot={{ r: compact ? 4 : 6, strokeWidth: compact ? 2 : 3, stroke: '#ffffff', fill: yesColor }}
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};
