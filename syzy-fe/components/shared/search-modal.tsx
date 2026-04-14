"use client";

import { useMemo, useState } from "react";
import { Search, Loader2, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useMarketList } from "@/features/markets/hooks/use-market-list";
import { marketItemsToEvents } from "@/app/(dashboard)/markets/_utils/market-list-adapter";
import type { Event } from "@/app/(dashboard)/markets/_types";

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatEndDate(dateStr: string | null): string {
  if (!dateStr) return "No end date";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "No end date";
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 30) return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h left`;
  return "Ends soon";
}

function formatVolume(vol: number): string {
  if (vol >= 1000) return `${(vol / 1000).toFixed(1)}K`;
  if (vol >= 1) return vol.toFixed(1);
  return vol.toFixed(2);
}

function SearchMarketCard({ event, onSelect }: { event: Event; onSelect: () => void }) {
  const primaryMarket = event.markets[0];
  if (!primaryMarket) return null;

  const prob = Math.round(primaryMarket.probability);
  const isHighProb = prob >= 70;
  const isLowProb = prob <= 30;

  return (
    <Link href={`/markets/${event.slug}`} onClick={onSelect}>
      <div className="flex items-center gap-3 p-3 mb-2 rounded-xl border border-border/40 hover:border-primary/40 hover:bg-accent/5 transition-all cursor-pointer group">
        {/* Image */}
        <div className="shrink-0 w-10 h-10 relative">
          {event.icon_url ? (
            <Image
              src={event.icon_url}
              alt=""
              fill
              className="object-cover rounded-full border border-border/50"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold">
              ?
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {event.main_tag}
            </span>
            {event.is_trending && (
              <TrendingUp className="w-3 h-3 text-secondary" />
            )}
          </div>
          <h3 className="text-sm font-semibold leading-snug line-clamp-1 text-foreground group-hover:text-primary transition-colors">
            {event.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
            <span>{formatVolume(event.volume)} SOL</span>
            <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40" />
            <span>{formatEndDate(event.end_date)}</span>
          </div>
        </div>

        {/* Probability */}
        <div className="shrink-0 flex flex-col items-end gap-1">
          <span className={cn(
            "text-lg font-black tabular-nums",
            isHighProb ? "text-secondary" : isLowProb ? "text-primary" : "text-foreground"
          )}>
            {prob}%
          </span>
          <div className="flex gap-1">
            <span className="h-5 px-2 rounded bg-secondary/10 text-secondary text-[10px] font-bold flex items-center">
              Yes
            </span>
            <span className="h-5 px-2 rounded bg-primary/10 text-primary text-[10px] font-bold flex items-center">
              No
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { markets, isLoading } = useMarketList();
  const events = useMemo(() => marketItemsToEvents(markets), [markets]);

  const filteredMarkets = events.filter(
    (event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.main_tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.tags.some(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (event.markets ?? []).some(market =>
        market.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        market.short_title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Search Markets</DialogTitle>
        </DialogHeader>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search prediction markets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin opacity-50" />
                <p>Loading markets...</p>
              </div>
            ) : filteredMarkets.length > 0 ? (
              filteredMarkets.map((event) => (
                <SearchMarketCard
                  key={event.id}
                  event={event}
                  onSelect={() => onOpenChange(false)}
                />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No prediction markets found</p>
                {searchQuery && (
                  <p className="text-sm">Try searching for different terms</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center pt-4 border-t border-border/50">
          <div className="text-xs text-muted-foreground">
            Press <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">ESC</kbd> to close
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}