"use client";

import Image from 'next/image';
import { Event, Market } from '@/app/(dashboard)/markets/_types';
import { Card } from "@/components/ui/card";
import { cn } from '@/lib/utils';
import { SolIcon } from '@/components/ui/sol-icon';
import { PlusCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCoinGeckoPrice } from '@/features/analytics/hooks/use-coingecko';
import { useWatchlist } from '@/features/portfolio/hooks/use-watchlist';
import { useAuthStore } from '@/features/auth/store/use-auth-store';
import { toast } from 'sonner';
import { FeaturedChart } from '@/app/(dashboard)/markets/_components/featured-chart';

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

interface FeaturedMobileProps {
    event: Event;
    activeMarket: Market;
    isBinary: boolean;
    onQuickTrade?: (e: React.MouseEvent, marketId: string, side: 'yes' | 'no') => void;
    onCardClick?: () => void;
}

export function FeaturedMobile({ event, activeMarket, isBinary, onQuickTrade, onCardClick }: FeaturedMobileProps) {
    const { data: solPrice } = useCoinGeckoPrice("solana");
    const solUsdPrice = solPrice?.current_price ?? 0;
    const tvlUsd = event.volume * solUsdPrice;
    const volumeSol = new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short", maximumFractionDigits: 1 }).format(event.volume);
    const volumeUsd = new Intl.NumberFormat('en-US', { style: "currency", currency: "USD", notation: "compact", compactDisplay: "short", maximumFractionDigits: 1 }).format(tvlUsd);

    const { isAuthenticated } = useAuthStore();
    const { isWatched, toggleWatchlist, isAdding, isRemoving } = useWatchlist();
    const marketPda = event.markets[0]?.id || '';
    const isMarketWatched = isWatched(marketPda);
    const isWatchlistLoading = isAdding || isRemoving;

    return (
        <Card
            className="md:hidden w-full bg-background border-border shadow-lg overflow-hidden rounded-xl cursor-pointer"
            onClick={(e: React.MouseEvent) => {
                if (
                    (e.target as HTMLElement).closest('button') ||
                    (e.target as HTMLElement).closest('.interactive-area')
                ) return;
                onCardClick?.();
            }}
        >
            {/* Header */}
            <div className="p-4 pb-0">
                <div className="flex items-start gap-3">
                    <div className="shrink-0 w-11 h-11 relative">
                        <Image
                            src={event.icon_url}
                            alt=""
                            fill
                            className="object-cover rounded-full border-2 border-border shadow-sm"
                        />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5 flex items-center gap-1.5">
                            {event.main_tag}
                            {(() => {
                                const badge = getTimeBadge(event.end_date || event.markets[0]?.end_time);
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
                        <h2 className="text-sm font-bold leading-tight line-clamp-2 text-foreground">
                            {event.title}
                        </h2>
                    </div>
                </div>
            </div>

            {/* Mini Chart */}
            <div className="h-[160px] w-full">
                <FeaturedChart event={event} compact />
            </div>

            {/* Outcomes */}
            <div className="px-4 pb-3">
                {isBinary ? (
                    <div className="grid grid-cols-2 gap-2 interactive-area">
                        {activeMarket.outcomes.slice(0, 2).map((outcome, idx) => {
                            const isYes = idx === 0;
                            const prob = (outcome.price * 100).toFixed(2);
                            return (
                                <button
                                    key={outcome.id}
                                    onClick={(e) => onQuickTrade?.(e, activeMarket.id, isYes ? 'yes' : 'no')}
                                    className={cn(
                                        "relative rounded-lg border-2 flex items-center bg-background overflow-hidden h-11 transition-all cursor-pointer",
                                        isYes ? "border-emerald-500/30 hover:border-emerald-500" : "border-primary/30 hover:border-primary"
                                    )}
                                >
                                    <div className="flex items-center justify-between w-full px-3 gap-2 z-10">
                                        <span className="font-bold uppercase tracking-wide text-foreground/80 text-xs shrink-0">
                                            {outcome.label}
                                        </span>
                                        <span className={cn("font-black tabular-nums text-base shrink-0", isYes ? "text-emerald-600 dark:text-emerald-500" : "text-primary")}>
                                            {prob}%
                                        </span>
                                    </div>
                                    <div className="absolute bottom-0 left-0 h-1 bg-muted w-full">
                                        <div
                                            className={cn("h-full transition-all duration-500", isYes ? "bg-emerald-500" : "bg-primary")}
                                            style={{ width: `${prob}%` }}
                                        />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        {(event.markets ?? []).slice(0, 3).map((market) => {
                            const prob = market.probability.toFixed(2);
                            return (
                                <div key={market.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/30">
                                    <span className="text-sm font-medium text-foreground truncate flex-1 min-w-0 mr-3">
                                        {market.short_title || market.title}
                                    </span>
                                    <div className="flex items-center gap-2.5 shrink-0">
                                        <span className="text-sm font-bold text-foreground tabular-nums">
                                            {prob}%
                                        </span>
                                        <div className="flex gap-1 interactive-area">
                                            <button
                                                onClick={(e) => onQuickTrade?.(e, market.id, 'yes')}
                                                className="h-5 px-1.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 hover:bg-emerald-500/20 text-[10px] font-bold flex items-center transition-colors"
                                            >
                                                Yes
                                            </button>
                                            <button
                                                onClick={(e) => onQuickTrade?.(e, market.id, 'no')}
                                                className="h-5 px-1.5 rounded bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold flex items-center transition-colors"
                                            >
                                                No
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer - matching market-card style */}
            <div className="px-4 border-t border-border/30 flex items-center justify-between bg-muted/10 h-[34px]">
                <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground font-medium">
                    <SolIcon className="w-3.5 h-3.5" />
                    <span className="text-emerald-600 dark:text-emerald-500 font-bold opacity-90">{volumeSol}</span>
                    <span className="text-muted-foreground/50">~</span>
                    <span className="font-bold opacity-90">{volumeUsd}</span>
                    <span>TVL</span>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!isAuthenticated) {
                            toast.error("Connect your wallet to add to watchlist");
                            return;
                        }
                        toggleWatchlist(marketPda);
                    }}
                    disabled={isWatchlistLoading}
                    className={cn(
                        "transition-colors",
                        isMarketWatched
                            ? "text-primary hover:text-primary/80"
                            : "text-muted-foreground/60 hover:text-foreground"
                    )}
                >
                    {isWatchlistLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isMarketWatched ? (
                        <CheckCircle className="w-4 h-4" />
                    ) : (
                        <PlusCircle className="w-4 h-4" />
                    )}
                </button>
            </div>
        </Card>
    );
}
