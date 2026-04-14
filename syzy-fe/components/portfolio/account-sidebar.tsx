"use client";

import Link from "next/link";
import Image from "next/image";
import { CopyButton } from "@/components/ui/copy-button";
import { SolIcon } from "@/components/ui/sol-icon";
import { DonutChart, type ChartData } from "./donut-chart";
import { Button } from "@/components/ui/button";
import { EyeOff, Eye, TrendingUp, TrendingDown, Wallet, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccountSidebarProps {
    stats: {
        total: string;
        totalInvested: string;
        winRate: string;
        todayPnl: string;
        todayPnlPercent: string;
        yesValue: string;
        noValue: string;
        liquidityValue: string;
    };
    connected: boolean;
    address?: string;
    shortAddress?: string;
    balanceHidden: boolean;
    onToggleBalance: () => void;
    activeCount: number;
    className?: string; // Standardize prop name
}

// Fixed color palette matching the DonutChart
const CHART_COLORS = ["#f59e0b", "#f43f5e", "#a855f7"]; // Orange-500, Rose-500, Purple-500

export function AccountSidebar({
    stats,
    connected,
    address,
    shortAddress,
    balanceHidden,
    onToggleBalance,
    activeCount,
    className,
}: AccountSidebarProps) {
    // Parse values for the chart
    const yesVal = parseFloat((stats.yesValue || "0").replace(/[$,]/g, "")) || 0;
    const noVal = parseFloat((stats.noValue || "0").replace(/[$,]/g, "")) || 0;
    const liqVal = parseFloat((stats.liquidityValue || "0").replace(/[$,]/g, "")) || 0;

    const totalBreakdown = yesVal + noVal + liqVal;

    // Calculate percentages or default to a nice visual state if empty
    const chartData: ChartData[] = totalBreakdown > 0 ? [
        { name: "Yes Positions", value: (yesVal / totalBreakdown) * 100, color: CHART_COLORS[0] },
        { name: "No Positions", value: (noVal / totalBreakdown) * 100, color: CHART_COLORS[1] },
        { name: "Liquidity", value: (liqVal / totalBreakdown) * 100, color: CHART_COLORS[2] },
    ] : [
        { name: "Yes Positions", value: 65, color: CHART_COLORS[0] },
        { name: "No Positions", value: 20, color: CHART_COLORS[1] },
        { name: "Liquidity", value: 15, color: CHART_COLORS[2] },
    ];

    // PnL Logic
    const isPnlPositive = !stats.todayPnl.startsWith("-");
    const pnlColor = isPnlPositive ? "text-emerald-600" : "text-rose-500";
    const pnlIcon = isPnlPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
    const cleanTotal = stats.total.replace(/[$,]/g, "");
    const formattedTotal = cleanTotal.split(".");

    return (
        <aside data-tour="account-sidebar" className={cn("w-full lg:w-[320px] 2xl:w-[360px] shrink-0 lg:h-full overflow-y-auto border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-background/60 backdrop-blur-xl flex flex-col scrollbar-thin z-10", className)}>
            {/* Account Header */}
            <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                        <div className="relative group cursor-pointer">
                            <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-md group-hover:blur-lg transition-all opacity-50" />
                            <div className="relative w-14 h-14 rounded-2xl bg-white dark:bg-background border border-slate-100 dark:border-slate-800 flex items-center justify-center shadow-lg transform group-hover:-translate-y-1 transition-transform duration-300">
                                <SolIcon size={28} className="text-primary" />
                            </div>
                            {connected && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-full" />
                            )}
                        </div>

                        <div className="flex flex-col">
                            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-lg tracking-tight">Account</h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={cn("text-xs font-mono px-2 py-0.5 rounded-full border",
                                    connected ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/50" : "bg-slate-50 dark:bg-muted/50 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800"
                                )}>
                                    {connected ? shortAddress || "0x...0000" : "Not Connected"}
                                </span>
                                {connected && address && <CopyButton text={address} className="w-6 h-6" iconClassName="w-3 h-3 text-slate-400 dark:text-slate-500 hover:text-primary" />}
                            </div>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-muted/50"
                        onClick={onToggleBalance}
                    >
                        {balanceHidden ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </Button>
                </div>

                {/* Balance Display */}
                <div className="mb-8 relative">
                    <div className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Wallet className="w-4 h-4" /> Total Balance
                    </div>
                    <div className="flex items-baseline gap-2 text-slate-900 dark:text-slate-100 leading-none">
                        {balanceHidden ? (
                            <span className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-100">••••••</span>
                        ) : (
                            <div className="flex items-baseline">
                                <span className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter">{formattedTotal[0]}</span>
                                <span className="text-2xl sm:text-3xl font-medium text-slate-300 dark:text-slate-600 ml-1">.{formattedTotal[1] || "0000"}</span>
                                <span className="text-xl sm:text-2xl font-medium text-slate-400 dark:text-slate-500 ml-2">XLM</span>
                            </div>
                        )}
                    </div>

                    <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold mt-4 border shadow-sm",
                        isPnlPositive ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/50" : "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-900/50"
                    )}>
                        {pnlIcon}
                        {balanceHidden ? "••••" : `${stats.todayPnl} XLM`}
                    </div>
                </div>

            </div>

            {/* Portfolio Breakdown */}
            <div className="p-4 sm:p-6 flex-1">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wide">Assets Allocation</h3>
                    <Link href="/analytics">
                        <Button variant="link" className="text-primary text-xs font-semibold p-0 h-auto hover:no-underline flex items-center gap-1 group">
                            View Analytics <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </Button>
                    </Link>
                </div>

                <DonutChart
                    data={chartData}
                    totalValue={activeCount}
                    centerLabel="Active"
                    className="mb-8"
                />

                <div className="bg-slate-50 dark:bg-muted/30 p-4 rounded-xl text-center text-xs text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800">
                    Your portfolio is <span className="text-emerald-600 dark:text-emerald-400 font-bold">up 12%</span> compared to last week.
                    Keep reducing risk by diversifying assets.
                </div>
            </div>
        </aside>
    );
}
