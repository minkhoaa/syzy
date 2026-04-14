"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import { Typography } from "@/components/ui/typography";

export type ChartData = {
    name: string;
    value: number;
    color: string;
};

interface DonutChartProps {
    data: ChartData[];
    totalValue: number | string;
    centerLabel?: string;
    className?: string;
}

export function DonutChart({ data, totalValue, centerLabel = "Active", className }: DonutChartProps) {
    const filteredData = data.filter((d) => d.value > 0);

    if (filteredData.length === 0) {
        return (
            <div className={cn("flex flex-col items-center justify-center p-6 text-slate-400", className)}>
                <div className="w-32 h-32 rounded-full border-4 border-slate-100 flex items-center justify-center">
                    <span className="text-xs">No Data</span>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("flex flex-col items-center", className)}>
            <div className="relative w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={filteredData}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={85}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={5}
                        >
                            {filteredData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                        <div className="bg-slate-900 text-white text-xs rounded px-2 py-1 shadow-lg">
                                            <span className="font-semibold">{data.name}:</span> {data.value.toFixed(1)}%
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <Typography variant="small" className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                        {centerLabel}
                    </Typography>
                    <Typography variant="h3" className="text-2xl font-bold text-slate-800">
                        {totalValue}
                    </Typography>
                </div>
            </div>

            {/* Legend */}
            <div className="w-full space-y-3 mt-6">
                {data.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm group">
                        <div className="flex items-center gap-2.5">
                            <div
                                className="w-3 h-3 rounded-full shadow-sm transition-transform group-hover:scale-110"
                                style={{ backgroundColor: item.color }}
                            />
                            <span className="text-slate-600 font-medium group-hover:text-slate-900 transition-colors">
                                {item.name}
                            </span>
                        </div>
                        <span className="text-slate-900 font-bold font-mono">
                            {item.value.toFixed(1)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
