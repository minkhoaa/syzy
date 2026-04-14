"use client";

import React, { useState } from "react";
import { ChevronDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateOrderBook } from "@/app/(dashboard)/markets/_utils/build-event-from-market";
import type { Event } from "@/app/(dashboard)/markets/_types";

interface OrderBookSectionProps {
  event: Event;
}

export function OrderBookSection({ event }: OrderBookSectionProps) {
  const [expandedMarketId, setExpandedMarketId] = useState<string | null>(null);
  const [selectedMarketId, setSelectedMarketId] = useState<string>(
    event.markets[0].id
  );

  const toggleOrderBook = (marketId: string) => {
    setExpandedMarketId((prev) => (prev === marketId ? null : marketId));
    setSelectedMarketId(marketId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg border border-border/50">
        <TrendingUp className="w-4 h-4 text-primary" />
        <span className="font-medium text-foreground">News:</span>
        <span className="truncate">
          Graham Norton joked that he has signed &apos;so many NDAs&apos; for
          Taylor Swift...
        </span>
      </div>

      <div className="border border-border rounded-2xl overflow-hidden bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.15)] transition-all duration-300">
        {event.markets.map((m) => {
          const isExpanded = expandedMarketId === m.id;
          const isSelected = selectedMarketId === m.id;
          const orderBook = generateOrderBook(m.price);
          const maxBidSize = Math.max(...orderBook.bids.map((b) => b.size));
          const maxSize = maxBidSize;
          return (
            <div key={m.id} className="border-b border-border last:border-0">
              <div
                className={cn(
                  "flex items-center justify-between p-5 cursor-pointer hover:bg-muted/30 transition-all duration-200",
                  isSelected &&
                    "bg-muted/20 shadow-[inset_0_1px_3px_rgb(0,0,0,0.05)]"
                )}
                onClick={() => toggleOrderBook(m.id)}
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div
                    className={cn(
                      "transition-transform duration-200 text-muted-foreground",
                      isExpanded && "rotate-180"
                    )}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm truncate text-foreground">
                      {m.short_title || m.title}
                    </span>
                    <span className="text-[11px] font-bold text-muted-foreground">
                      {m.probability}% Chance
                    </span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="bg-secondary/10 text-secondary font-bold px-4 py-2 rounded-xl text-xs w-16 text-center shadow-[0_2px_8px_hsl(var(--secondary)/0.1)]">
                    Yes
                  </div>
                  <div className="bg-primary/10 text-primary font-bold px-4 py-2 rounded-xl text-xs w-16 text-center shadow-[0_2px_8px_hsl(var(--primary)/0.1)]">
                    No
                  </div>
                </div>
              </div>
              {isExpanded && (
                <div className="bg-muted/5 p-4 border-t border-border animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-2 gap-px max-w-2xl mx-auto bg-border rounded-lg overflow-hidden border border-border">
                    <div className="bg-white p-2">
                      <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground mb-2 pb-1 border-b border-border/50">
                        <span>Bid Size</span>
                        <span>Bid Price</span>
                      </div>
                      <div className="space-y-0.5">
                        {orderBook.bids.map((bid, idx) => (
                          <div
                            key={idx}
                            className="relative flex justify-between items-center text-sm font-mono h-6"
                          >
                            <div
                              className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 z-0"
                              style={{
                                width: `${(bid.size / maxSize) * 100}%`,
                              }}
                            />
                            <span className="text-muted-foreground relative z-10 pl-1">
                              {bid.size}
                            </span>
                            <span className="text-emerald-600 font-bold relative z-10 pr-1">
                              {bid.price}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white p-2">
                      <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground mb-2 pb-1 border-b border-border/50">
                        <span>Ask Price</span>
                        <span>Ask Size</span>
                      </div>
                      <div className="space-y-0.5">
                        {orderBook.asks.map((ask, idx) => (
                          <div
                            key={idx}
                            className="relative flex justify-between items-center text-sm font-mono h-6"
                          >
                            <div
                              className="absolute left-0 top-0 bottom-0 bg-rose-500/10 z-0"
                              style={{
                                width: `${(ask.size / maxSize) * 100}%`,
                              }}
                            />
                            <span className="text-rose-500 font-bold relative z-10 pl-1">
                              {ask.price}
                            </span>
                            <span className="text-muted-foreground relative z-10 pr-1">
                              {ask.size}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
