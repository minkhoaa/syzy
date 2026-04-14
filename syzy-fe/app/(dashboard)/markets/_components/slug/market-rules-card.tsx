"use client";

import { useState } from "react";
import { Info, Clock, ChevronDown, Calendar, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Event } from "@/app/(dashboard)/markets/_types";

interface MarketRulesCardProps {
  event: Event;
}

export function MarketRulesCard({ event }: MarketRulesCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="rounded-3xl border border-white/10 overflow-hidden bg-background/40 backdrop-blur-xl shadow-xl relative">
      {/* Glass texture overlay */}
      <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />

      {/* Edge highlight */}
      <div className="absolute inset-0 rounded-3xl ring-1 ring-white/10 pointer-events-none" />

      {/* Header - Collapsible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors relative z-10 group"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Info className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-black text-base text-foreground">Rules</h3>
        </div>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-muted-foreground transition-transform duration-300",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      {/* Content - Animated collapse */}
      <div
        className={cn(
          "grid transition-all duration-300 ease-out relative z-10",
          isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="p-4 pt-0 space-y-4">
            {/* Timeline */}
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-black/50 border border-black/5 dark:border-white/10 hover:border-blue-500/30 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Market Start
                  </div>
                  <div className="text-sm font-semibold text-foreground tabular-nums">
                    {event.start_date ? new Date(event.start_date).toLocaleString() : "No start date"}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-black/50 border border-black/5 dark:border-white/10 hover:border-teal-500/30 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 dark:bg-teal-500/20 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-teal-500 dark:text-teal-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Market Expiration
                  </div>
                  <div className="text-sm font-semibold text-foreground tabular-nums">
                    {event.end_date ? new Date(event.end_date).toLocaleString() : "No end date"}
                  </div>
                </div>
              </div>
            </div>

            {/* Resolution Rules */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/5 to-transparent border border-emerald-500/20 backdrop-blur-sm">
              <div className="flex items-start gap-2.5 mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-foreground mb-1">Resolution Criteria</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    This market will resolve to <span className="font-bold text-emerald-500">&#34;Yes&#34;</span> if the outcome occurs.
                    Otherwise it resolves to <span className="font-bold text-teal-500">&#34;No&#34;</span>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
