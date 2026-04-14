"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Event } from '@/app/(dashboard)/markets/_types';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, PlusCircle, CheckCircle, Loader2 } from 'lucide-react';
import { SolIcon } from '@/components/ui/sol-icon';
import { useCoinGeckoPrice } from '@/features/analytics/hooks/use-coingecko';
import { useWatchlist } from '@/features/portfolio/hooks/use-watchlist';
import { useAuthStore } from '@/features/auth/store/use-auth-store';
import { toast } from 'sonner';
import { isEventEnded } from '@/app/(dashboard)/markets/_utils/event-filters';

import { FeaturedInfo } from '@/app/(dashboard)/markets/_components/featured-info';
import { FeaturedChart } from '@/app/(dashboard)/markets/_components/featured-chart';
import { FeaturedMobile } from '@/app/(dashboard)/markets/_components/featured-mobile';
import { QuickTradeModal } from '@/app/(dashboard)/markets/_components/quick-trade-modal';

interface FeaturedMarketProps {
    event: Event;
    events?: Event[];
}

export const FeaturedMarket: React.FC<FeaturedMarketProps> = ({ event: initialEvent, events = [] }) => {
    const router = useRouter();

    // Use provided events for rotation, excluding ended, sorted by volume (highest first)
    const prioritizedEvents = useMemo(() => {
        const active = events.filter((e) => !isEventEnded(e));
        if (active.length === 0) return [initialEvent];
        return [...active].sort((a, b) => b.volume - a.volume);
    }, [events, initialEvent]);

    const defaultStartEvent = prioritizedEvents[0];

    const [currentEventId, setCurrentEventId] = useState(defaultStartEvent.id);
    const [isHovering, setIsHovering] = useState(false);

    // Quick Trade State
    const [isQuickTradeOpen, setIsQuickTradeOpen] = useState(false);
    const [selectedMarketId, setSelectedMarketId] = useState<string>(defaultStartEvent.markets[0]?.id || '');
    const [tradeSide, setTradeSide] = useState<'yes' | 'no'>('yes');
    const [frozenEvent, setFrozenEvent] = useState<Event | null>(null);

    // Reset to first event when the events list changes (render-time adjustment)
    const [prevDefaultId, setPrevDefaultId] = useState(defaultStartEvent.id);
    if (prevDefaultId !== defaultStartEvent.id) {
        setPrevDefaultId(defaultStartEvent.id);
        setCurrentEventId(defaultStartEvent.id);
    }

    const event = prioritizedEvents.find(e => e.id === currentEventId) || defaultStartEvent;
    const currentIndex = prioritizedEvents.findIndex(e => e.id === event.id);
    const activeMarket = event.markets?.[0];

    // Layout Logic
    const isListLayout = (event.markets?.length ?? 0) > 2;
    const isBinary = !isListLayout && activeMarket?.outcomes?.length === 2 && activeMarket?.outcomes[0]?.label === 'Yes';

    const prevEvent = prioritizedEvents[(currentIndex - 1 + prioritizedEvents.length) % prioritizedEvents.length];
    const nextEvent = prioritizedEvents[(currentIndex + 1) % prioritizedEvents.length];

    // Event Rotation Logic
    const handleNext = useCallback(() => {
        const nextIndex = (currentIndex + 1) % prioritizedEvents.length;
        setCurrentEventId(prioritizedEvents[nextIndex].id);
    }, [currentIndex, prioritizedEvents]);

    const handlePrev = useCallback(() => {
        const prevIndex = (currentIndex - 1 + prioritizedEvents.length) % prioritizedEvents.length;
        setCurrentEventId(prioritizedEvents[prevIndex].id);
    }, [currentIndex, prioritizedEvents]);

    useEffect(() => {
        if (isHovering || isQuickTradeOpen) return;
        const timer = setInterval(() => {
            handleNext();
        }, 8000);
        return () => clearInterval(timer);
    }, [handleNext, isHovering, isQuickTradeOpen]);

    // Navigate to market page on card click
    const handleCardClick = (e: React.MouseEvent) => {
        if (
            (e.target as HTMLElement).closest('button') ||
            (e.target as HTMLElement).closest('.interactive-area')
        ) return;
        router.push(`/markets/${event.slug}`);
    };

    // Quick Trade Handler
    const openQuickTrade = (e: React.MouseEvent, marketId: string, side: 'yes' | 'no') => {
        e.stopPropagation();
        setFrozenEvent(event);
        setSelectedMarketId(marketId);
        setTradeSide(side);
        setIsQuickTradeOpen(true);
    };

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
        <>
            {/* Mobile View */}
            <FeaturedMobile
                event={event}
                activeMarket={activeMarket}
                isBinary={isBinary}
                onQuickTrade={openQuickTrade}
                onCardClick={() => router.push(`/markets/${event.slug}`)}
            />

            {/* Desktop View */}
            <div
                className="hidden md:flex w-full bg-card border border-border shadow-xl overflow-hidden relative rounded-xl group flex-col transition-all duration-300 h-[280px] lg:h-[340px] cursor-pointer"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onClick={handleCardClick}
            >
                {/* Main content row */}
                <div className="flex flex-row flex-1 min-h-0">
                    {/* LEFT PANEL */}
                    <FeaturedInfo
                        event={event}
                        activeMarket={activeMarket}
                        isBinary={isBinary}
                        onQuickTrade={openQuickTrade}
                    />

                    {/* RIGHT PANEL: Chart */}
                    <div className="w-[60%] bg-background flex-1 min-h-0">
                        <FeaturedChart event={event} />
                    </div>
                </div>

                {/* Full-width footer with single border */}
                <div className="shrink-0 h-12 border-t border-border flex items-center bg-muted/10">
                    {/* Left: TVL + Watchlist (40%) */}
                    <div className="w-[40%] flex items-center justify-between px-5 border-r border-border h-full">
                        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground font-medium">
                            <SolIcon className="w-3.5 h-3.5" />
                            <span className="text-foreground font-bold opacity-90">{volumeSol}</span>
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
                                "transition-colors interactive-area",
                                isMarketWatched
                                    ? "text-primary hover:text-primary/80"
                                    : "text-muted-foreground/60 hover:text-foreground"
                            )}
                        >
                            {isWatchlistLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : isMarketWatched ? (
                                <CheckCircle className="w-5 h-5" />
                            ) : (
                                <PlusCircle className="w-5 h-5" />
                            )}
                        </button>
                    </div>

                    {/* Right: Navigation (60%) */}
                    <div className="w-[60%] flex items-center justify-between px-5 text-sm font-semibold text-muted-foreground h-full">
                        <button onClick={handlePrev} className="flex items-center gap-2 hover:text-foreground transition-colors group py-2">
                            <ChevronLeft className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" />
                            <span className="truncate max-w-[140px] text-left hidden lg:inline">{prevEvent.title}</span>
                        </button>
                        <div className="flex gap-2">
                            {prioritizedEvents.slice(0, 5).map((e, i) => (
                                <div key={e.id} className={cn("w-2 h-2 rounded-full transition-all", i === (currentIndex % 5) ? "bg-primary w-4" : "bg-border")} />
                            ))}
                        </div>
                        <button onClick={handleNext} className="flex items-center gap-2 hover:text-foreground transition-colors group py-2">
                            <span className="truncate max-w-[140px] text-right hidden lg:inline">{nextEvent.title}</span>
                            <ChevronRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Trade Modal */}
            <QuickTradeModal
                isOpen={isQuickTradeOpen}
                onClose={() => {
                    setIsQuickTradeOpen(false);
                    setFrozenEvent(null);
                }}
                event={frozenEvent || event}
                selectedMarketId={selectedMarketId}
                tradeSide={tradeSide}
                setTradeSide={setTradeSide}
            />
        </>
    );
};