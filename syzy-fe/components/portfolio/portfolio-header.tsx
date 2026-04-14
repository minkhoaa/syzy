"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PortfolioHeaderProps {
    activeTab: "active" | "past" | "watchlist";
    onTabChange: (tab: "active" | "past" | "watchlist") => void;
    className?: string;
    layoutId?: string;
}

export function PortfolioHeader({ activeTab, onTabChange, className, layoutId = "default" }: PortfolioHeaderProps) {
    const tabs = [
        { id: "active", label: "Active Positions" },
        { id: "past", label: "History" },
        { id: "watchlist", label: "Watchlist" },
    ] as const;

    return (
        <div className={cn("sticky top-0 bg-white/95 dark:bg-background/95 backdrop-blur-md z-30 border-b border-slate-100 dark:border-slate-800", className)}>
            {/* Sub-header with Navigation & Actions */}
            <div className="px-4 sm:px-8 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div data-tour={layoutId === "desktop" ? "portfolio-tabs" : undefined} className="flex items-center gap-1 bg-slate-50/50 dark:bg-muted p-1 rounded-xl border border-slate-100/50 dark:border-slate-800 w-full sm:w-auto overflow-x-auto scrollbar-hide">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={cn(
                                "relative px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 z-10 whitespace-nowrap",
                                activeTab === tab.id
                                    ? "text-slate-900 dark:text-slate-100"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-background/50"
                            )}
                        >
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId={`activeTabBg-${layoutId}`}
                                    className="absolute inset-0 bg-white dark:bg-background rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-700/50"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    style={{ zIndex: -1 }}
                                />
                            )}
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        className="hidden sm:flex items-center gap-2 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-muted hover:text-slate-700 dark:hover:text-slate-300"
                    >
                        <Filter className="w-4 h-4" />
                        <span>Filter</span>
                    </Button>
                    <Link href="/markets">
                        <Button className="rounded-full pl-3 pr-5 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all">
                            <Plus className="w-4 h-4 mr-2" />
                            New Prediction
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
