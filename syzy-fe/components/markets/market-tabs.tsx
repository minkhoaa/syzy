"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StatusFilter, SortOption } from "@/app/(dashboard)/markets/_utils/event-filters";

interface MarketTabsProps {
  categories?: string[];
  onCategoryChange?: (tab: string) => void;
  onStatusChange?: (status: StatusFilter) => void;
  onSortChange?: (sort: SortOption) => void;
  onSearchChange?: (query: string) => void;
  statusCounts?: { active: number; endingSoon: number; ended: number };
  defaultStatus?: StatusFilter;
  sourceTabs?: {
    tabs: { label: string; value: string }[];
    activeTab: string;
    onTabChange: (tab: string) => void;
  };
}

const statusTabs: { value: StatusFilter; label: string; countKey: "active" | "endingSoon" | "ended" }[] = [
  { value: "active", label: "Active", countKey: "active" },
  { value: "ending-soon", label: "Ending Soon", countKey: "endingSoon" },
  { value: "ended", label: "Ended", countKey: "ended" },
];

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "volume", label: "Volume" },
  { value: "newest", label: "Newest" },
  { value: "trending", label: "Trending" },
];

export function MarketTabs({
  categories = [],
  onCategoryChange,
  onStatusChange,
  onSortChange,
  onSearchChange,
  statusCounts,
  defaultStatus = "active",
  sourceTabs,
}: MarketTabsProps) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeStatus, setActiveStatus] = useState<StatusFilter>(defaultStatus);

  const categoryTabs = ["All", ...categories];

  const handleCategoryClick = (tab: string) => {
    setActiveCategory(tab);
    onCategoryChange?.(tab);
  };

  const handleStatusClick = (status: StatusFilter) => {
    setActiveStatus(status);
    onStatusChange?.(status);
  };

  return (
    <div data-tour="market-filters" className="flex flex-col gap-6 mb-8">
      {/* Source tabs (admin only) */}
      {sourceTabs && (
        <div className="flex gap-2 p-1 -m-1">
          {sourceTabs.tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => sourceTabs.onTabChange(tab.value)}
              className={cn(
                "px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap border",
                sourceTabs.activeTab === tab.value
                  ? "bg-primary/15 border-primary/60 text-primary shadow-[0_0_12px_rgba(255,117,24,0.25)] scale-105"
                  : "bg-background/40 border-border/40 text-muted-foreground hover:text-foreground hover:bg-background/60 hover:border-border"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Category Pills (Primary Navigation) */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mb-2">
        {categoryTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => handleCategoryClick(tab)}
            className={cn(
              "px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap border",
              activeCategory === tab
                ? "bg-primary text-primary-foreground shadow-md scale-105 border-transparent"
                : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-muted/30"
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Secondary Controls: Search, Status, Sort */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-muted/20 p-2 sm:p-3 rounded-2xl border border-border/50">
        
        {/* Search */}
        <div className="flex-1 max-w-sm w-full relative group">
          <div className="absolute inset-0 bg-primary/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative flex items-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search markets..."
              className="pl-9 h-11 w-full rounded-xl bg-background border-border/50 text-sm focus:border-primary/50 focus:ring-primary/20 transition-all duration-300 shadow-sm"
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full xl:w-auto">
          {/* Status Segmented Control */}
          <div className="flex bg-background border border-border/50 p-1 rounded-xl shadow-sm overflow-x-auto scrollbar-hide flex-1 sm:flex-initial">
            {statusTabs.map((tab) => {
              const count = statusCounts?.[tab.countKey];
              const isActive = activeStatus === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => handleStatusClick(tab.value)}
                  className={cn(
                    "relative px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap flex items-center justify-center gap-2 flex-1 sm:flex-initial",
                    isActive
                      ? "text-foreground shadow-sm bg-muted"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <span className="relative z-10">{tab.label}</span>
                  {count !== undefined && (
                    <span
                      className={cn(
                        "relative z-10 text-[10px] tabular-nums font-bold min-w-[1.25rem] text-center rounded-full px-1.5 py-0.5",
                        isActive
                          ? "bg-primary/20 text-primary"
                          : "bg-muted-foreground/10 text-muted-foreground"
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sort Select */}
          <Select onValueChange={(v) => onSortChange?.(v as SortOption)} defaultValue="volume">
            <SelectTrigger className="w-[140px] flex-shrink-0 h-11 rounded-xl bg-background border border-border/50 hover:border-border text-sm font-medium transition-all shadow-sm">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent className="glass-panel rounded-xl border-black/5 dark:border-white/10 p-1 min-w-[160px]">
              {sortOptions.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="rounded-lg focus:bg-primary/10 focus:text-primary cursor-pointer font-medium py-2.5 px-3 transition-colors my-0.5"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
