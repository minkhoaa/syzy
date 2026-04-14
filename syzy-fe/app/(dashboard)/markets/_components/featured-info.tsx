
'use client';

import { Event, Market } from "@/app/(dashboard)/markets/_types";
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { FeaturedNews } from '@/app/(dashboard)/markets/_components/featured-news';
import { extractTokenSymbol } from "@/features/markets/utils/extract-token-symbol";

interface FeaturedInfoProps {
    event: Event;
    activeMarket: Market;
    isBinary?: boolean;
    onQuickTrade?: (e: React.MouseEvent, marketId: string, side: "yes" | "no") => void;
}

function getTimeBadge(dateStr: string | null | undefined): { label: string; urgent: boolean } | null {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffHours / 24;
    if (diffMs <= 0) return { label: "ENDED", urgent: false };
    if (diffHours <= 24) return { label: "ENDS SOON", urgent: true };
    if (diffDays <= 3) return { label: `${Math.ceil(diffDays)}D LEFT`, urgent: true };
    if (diffDays <= 7) return { label: `${Math.ceil(diffDays)}D LEFT`, urgent: false };
    const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { label: `BY ${formatted.toUpperCase()}`, urgent: false };
}

export const FeaturedInfo = ({ event, activeMarket, isBinary, onQuickTrade }: FeaturedInfoProps) => {
    const tokenSymbol = extractTokenSymbol(event.title, event.main_tag);

    return (
        <div className="w-[40%] flex flex-col border-r border-border relative z-10 bg-card">
            {/* Main content area with padding */}
            <div className="flex-1 flex flex-col p-6 pb-3 min-h-0">
                {/* Header */}
                <div className="flex gap-4 mb-3 shrink-0 items-start">
                    <div className="relative shrink-0 w-16 h-16">
                        <img
                            src={event.icon_url}
                            alt={event.title}
                            className="w-full h-full object-cover rounded-full border-2 border-border shadow-sm"
                        />
                    </div>

                    <div className="space-y-1.5 min-w-0 py-0.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            {event.main_tag}
                            {(() => {
                                const badge = getTimeBadge(event.end_date || event.markets?.[0]?.end_time);
                                if (!badge) return null;
                                return (
                                    <Badge
                                        variant="outline"
                                        size="sm"
                                        className={cn(
                                            "font-bold uppercase tracking-wide text-[8px]",
                                            badge.urgent
                                                ? "text-primary border-primary/60 bg-primary/5"
                                                : "text-muted-foreground border-border bg-muted/30"
                                        )}
                                    >
                                        {badge.label}
                                    </Badge>
                                );
                            })()}
                        </div>
                        <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold leading-tight text-foreground group-hover:text-primary transition-colors tracking-tight line-clamp-4">
                            {event.title}
                        </h2>
                    </div>
                </div>

                {/* Binary outcome buttons — side by side */}
                {isBinary ? (
                    <div className="flex gap-3 interactive-area shrink-0 mt-2">
                        {activeMarket.outcomes.map((outcome, idx) => {
                            const isYes = idx === 0;
                            return (
                                <button
                                    key={outcome.id}
                                    onClick={(e) => onQuickTrade?.(e, activeMarket.id, isYes ? 'yes' : 'no')}
                                    className={cn(
                                        "relative flex-1 rounded-xl border-2 flex items-center justify-between px-3 md:px-4 py-3 bg-background overflow-hidden transition-all cursor-pointer",
                                        "shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
                                        isYes ? "border-emerald-500/30 hover:border-emerald-500" : "border-red-500/30 hover:border-red-500"
                                    )}
                                >
                                    <span className={cn("font-bold uppercase tracking-wide text-xs sm:text-sm", isYes ? "text-foreground/70" : "text-foreground/70")}>
                                        {outcome.label}
                                    </span>
                                    <span className={cn("font-extrabold tabular-nums text-lg sm:text-xl", isYes ? "text-emerald-600 dark:text-emerald-500" : "text-red-600 dark:text-red-500")}>
                                        {(outcome.price * 100).toFixed(2)}%
                                    </span>
                                    <div className="absolute bottom-0 left-0 h-1 bg-muted/50 w-full">
                                        <div
                                            className={cn("h-full transition-all duration-500", isYes ? "bg-emerald-500" : "bg-red-500")}
                                            style={{ width: `${outcome.price * 100}%` }}
                                        />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 overflow-y-auto pr-1 mt-2">
                        <div className="space-y-1">
                            {(event.markets ?? []).map((m) => (
                                <div key={m.id} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0 hover:bg-muted/30 px-2 rounded-md transition-colors">
                                    <span className="text-[14px] font-medium text-muted-foreground truncate min-w-0 flex-1 mr-4">
                                        {m.short_title || m.title}
                                    </span>
                                    <div className="flex items-center gap-4 shrink-0">
                                        <span className="text-[14px] font-bold tabular-nums text-foreground">{m.probability}%</span>
                                        <div className="flex gap-1.5 interactive-area">
                                            <button
                                                onClick={(e) => onQuickTrade?.(e, m.id, 'yes')}
                                                className="h-7 px-3 rounded-md bg-secondary/10 text-secondary hover:bg-secondary/20 text-[11px] font-bold transition-colors flex items-center justify-center"
                                            >
                                                Yes
                                            </button>
                                            <button
                                                onClick={(e) => onQuickTrade?.(e, m.id, 'no')}
                                                className="h-7 px-3 rounded-md bg-primary/10 text-primary hover:bg-primary/20 text-[11px] font-bold transition-colors flex items-center justify-center"
                                            >
                                                No
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* News Ticker or Fallback — pushed to bottom */}
                <div className="mt-auto shrink-0 overflow-hidden">
                    <FeaturedNews 
                        tokenSymbol={tokenSymbol} 
                        marketTitle={event.title} 
                        fallbackText={activeMarket.resolution_source ? `Resolution Source: ${activeMarket.resolution_source}` : undefined}
                    />
                </div>
            </div>

        </div>
    );
};
