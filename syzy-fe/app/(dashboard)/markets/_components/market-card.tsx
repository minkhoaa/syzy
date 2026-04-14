"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Event } from '@/app/(dashboard)/markets/_types';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PlusCircle, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BinaryOutcomeButton } from '@/app/(dashboard)/markets/_components/binary-outcome-button';
import { QuickTradeModal } from '@/app/(dashboard)/markets/_components/quick-trade-modal';
import { useWatchlist } from '@/features/portfolio/hooks/use-watchlist';
import { useAuthStore } from '@/features/auth/store/use-auth-store';
import { toast } from 'sonner';
import { useCoinGeckoPrice } from '@/features/analytics/hooks/use-coingecko';
import { SolIcon } from '@/components/ui/sol-icon';

interface MarketCardProps {
    event: Event;
}

export function MarketCard({ event }: MarketCardProps) {
    const router = useRouter();
    const { data: solPrice } = useCoinGeckoPrice("solana");
    const solUsdPrice = solPrice?.current_price ?? 0;
    const tvlUsd = event.volume * solUsdPrice;
    const totalVolume = new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short", maximumFractionDigits: 1 }).format(event.volume);
    const totalVolumeUsd = new Intl.NumberFormat('en-US', { style: "currency", currency: "USD", notation: "compact", compactDisplay: "short", maximumFractionDigits: 1 }).format(tvlUsd);

    // Quick Trade State
    const [isQuickTradeOpen, setIsQuickTradeOpen] = useState(false);
    const [selectedMarketId, setSelectedMarketId] = useState<string>(event.markets?.[0]?.id ?? '');
    const [tradeSide, setTradeSide] = useState<'yes' | 'no'>('yes');

    // Focus State for Group Events (Animation Logic)
    const [focusedMarketId, setFocusedMarketId] = useState<string | null>(null);

    // Watchlist
    const { isAuthenticated } = useAuthStore();
    const { isWatched, toggleWatchlist, isAdding, isRemoving } = useWatchlist();

    // Guard: skip rendering if event has no markets
    if (!event.markets?.length) return null;

    // The market id already contains the PDA (set from market-list-adapter.ts)
    const marketPda = event.markets[0]?.id || '';
    const isMarketWatched = isWatched(marketPda);
    const isWatchlistLoading = isAdding || isRemoving;

    // Classification
    const isGroupEvent = event.markets.length > 1;
    const primaryMarket = event.markets[0];

    // Helper for Group View Focus
    const focusedMarket = event.markets.find(m => m.id === focusedMarketId);

    // Determine if we are currently looking at the expanded UI for a specific item
    // If so, we want to hide the footer to give more room to the UI.
    const isFocusing = isGroupEvent && focusedMarketId !== null;

    // Dynamic Image Selection: Use focused market icon if available, else event icon
    const displayImage = (focusedMarket && focusedMarket.icon_url) ? focusedMarket.icon_url : event.icon_url;

    // Time Badge
    const getTimeBadge = () => {
        const endDate = event.end_date || primaryMarket?.end_time;
        if (!endDate) return null;
        const now = new Date();
        const end = new Date(endDate);
        if (isNaN(end.getTime())) return null;
        const diffMs = end.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        const diffDays = diffHours / 24;
        if (diffMs <= 0) return { label: "ENDED", urgent: false };
        if (diffHours <= 24) return { label: "ENDS SOON", urgent: true };
        if (diffDays <= 3) return { label: `${Math.ceil(diffDays)}D LEFT`, urgent: true };
        if (diffDays <= 7) return { label: `${Math.ceil(diffDays)}D LEFT`, urgent: false };
        const formatted = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return { label: `BY ${formatted.toUpperCase()}`, urgent: false };
    };
    const timeBadge = getTimeBadge();
    const isEnded = event.markets[0]?.is_resolved || (timeBadge?.label === "ENDED") || event.status === 'resolved';

    const handleCardClick = (e: React.MouseEvent) => {
        if (
            (e.target as HTMLElement).closest('button')
        ) return;
        router.push(`/markets/${event.slug}`);
    };

    const toggleFocus = (e: React.MouseEvent, marketId: string) => {
        e.stopPropagation();
        setFocusedMarketId(prev => prev === marketId ? null : marketId);
    };

    const openQuickTrade = (e: React.MouseEvent, marketId: string, side: 'yes' | 'no') => {
        e.stopPropagation();
        setSelectedMarketId(marketId);
        setTradeSide(side);
        setIsQuickTradeOpen(true);
    };

    return (
        <>
            <Card
                onClick={handleCardClick}
                className={cn(
                    "group relative flex flex-col h-[280px] overflow-hidden rounded-3xl cursor-pointer",
                    isEnded
                        ? "bg-card/30 border-border/30 opacity-60 saturate-50"
                        : "glass-card"
                )}
            >
                {/* Glow Overlay (hidden for ended) */}
                {!isEnded && (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-accent-blue/5 transition-all duration-700 pointer-events-none" />
                )}

                {/* CARD HEADER */}
                <div className="relative z-10 px-4 pt-4 pb-0 flex gap-3 shrink-0">
                    <div className="shrink-0 relative pt-1">
                        {/* Avatar */}
                        <div
                            className={cn(
                                "w-12 h-12 relative ring-2 rounded-2xl shadow-lg transition-all duration-500 overflow-hidden bg-background cursor-pointer hover:opacity-80 active:scale-95 z-20",
                                isEnded
                                    ? "ring-white/5"
                                    : "ring-white/5 group-hover:ring-primary/50 group-hover:shadow-[0_0_20px_rgba(255,117,24,0.3)]"
                            )}
                            onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/markets/${event.slug}`);
                            }}
                        >
                            {displayImage ? (
                                <Image
                                    src={displayImage}
                                    alt=""
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground/50 text-xl font-bold bg-muted/20">?</div>
                            )}

                            {/* Pump.fun badge */}
                            {(['PENGUIN', 'WhiteWhale', 'Fartcoin', 'Pnut'].some(token =>
                                event.title.includes(token) || event.id.includes(token)
                            )) && (
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-black rounded-full border border-white/10 flex items-center justify-center shadow-lg animate-float z-10">
                                        <Image
                                            src="https://pump.fun/pump-logomark.svg?dpl=dpl_7Vzk37o98F9gWraF4NU9oBv7iZon"
                                            alt="Pump.fun"
                                            width={14}
                                            height={14}
                                            className="object-contain"
                                        />
                                    </div>
                                )}
                        </div>
                    </div>

                    <div className="min-w-0 flex-1 flex flex-col justify-start gap-1">
                        <div className="flex items-center gap-2">
                            {event.source === "Polymarket" && (
                                <span className="text-[9px] font-semibold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded">
                                    Polymarket
                                </span>
                            )}
                            {event.markets[0]?.winning_outcome !== undefined && event.markets[0]?.winning_outcome !== null && (
                                <span className={cn(
                                    "text-[9px] font-bold px-1.5 py-0.5 rounded",
                                    event.markets[0].winning_outcome === 0
                                        ? "text-emerald-600 bg-emerald-500/10"
                                        : "text-rose-600 bg-rose-500/10"
                                )}>
                                    {event.markets[0].winning_outcome === 0 ? "YES" : "NO"} Won
                                </span>
                            )}
                            {isGroupEvent && (
                                <Badge
                                    variant="outline"
                                    className="px-2 py-0.5 h-5 text-[10px] font-bold tracking-wider uppercase border-0 backdrop-blur-md bg-primary/10 text-primary"
                                >
                                    {event.markets.length} Outcomes
                                </Badge>
                            )}
                            {timeBadge && (
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "px-2 py-0.5 h-5 text-[10px] font-bold tracking-wider uppercase border-0 backdrop-blur-md",
                                        isEnded
                                            ? "bg-white/5 text-muted-foreground/60"
                                            : timeBadge.urgent
                                            ? "bg-red-500/20 text-red-400 animate-pulse-subtle"
                                            : "bg-white/5 text-muted-foreground"
                                    )}
                                >
                                    {timeBadge.label}
                                </Badge>
                            )}
                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">
                                {event.main_tag}
                            </span>
                        </div>
                        <h3 className={cn(
                            "text-sm font-semibold leading-tight transition-colors duration-300",
                            isEnded ? "text-muted-foreground" : "text-foreground group-hover:text-primary"
                        )}>
                            {event.title}
                        </h3>
                    </div>
                </div>

                {/* CARD BODY (Markets List / Single View) */}
                <div className={cn(
                    "flex-1 px-4 relative overflow-y-auto min-h-0 selection:bg-primary/20",
                    isFocusing ? "pb-2" : "pb-3"
                )}>
                    {isGroupEvent ? (
                        <div className="relative h-full flex flex-col justify-center">
                            {focusedMarketId && focusedMarket ? (
                                // FOCUSED VIEW
                                <div className="animate-in slide-in-from-right-4 fade-in duration-300 h-full flex flex-col justify-between cursor-default">
                                    <button
                                        onClick={(e) => toggleFocus(e, focusedMarket.id)}
                                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-2 group/back"
                                    >
                                        <ArrowLeft className="w-4 h-4 group-hover/back:-translate-x-1 transition-transform" />
                                        Back to list
                                    </button>

                                    <div className="flex items-center justify-between mb-4">
                                        <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">{focusedMarket.outcome_label || focusedMarket.short_title || "Outcome"}</span>
                                        <span className="text-2xl font-black text-primary tracking-tight">{focusedMarket.probability}%</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mt-auto">
                                        <BinaryOutcomeButton
                                            label="Yes"
                                            price={focusedMarket.price}
                                            side="yes"
                                            onClick={(e) => openQuickTrade(e, focusedMarket.id, 'yes')}
                                            compact={true}
                                            disabled={isEnded}
                                        />
                                        <BinaryOutcomeButton
                                            label="No"
                                            price={1 - focusedMarket.price}
                                            side="no"
                                            onClick={(e) => openQuickTrade(e, focusedMarket.id, 'no')}
                                            compact={true}
                                            disabled={isEnded}
                                        />
                                    </div>
                                </div>
                            ) : (
                                // LIST VIEW
                                <div className="space-y-1.5 pt-1">
                                    {event.markets.slice(0, 3).map((market) => (
                                        <div
                                            key={market.id}
                                            className="flex items-center justify-between py-2 group/row hover:bg-white/5 rounded-lg px-2 -mx-2 cursor-pointer transition-colors"
                                            onClick={(e) => toggleFocus(e, market.id)}
                                        >
                                            <span className="text-sm font-medium text-muted-foreground group-hover/row:text-foreground transition-colors truncate max-w-[120px]">
                                                {market.outcome_label || market.short_title || market.title}
                                            </span>
                                            <div className="flex items-center gap-3">
                                                <span className={cn(
                                                    "font-mono text-base font-black tabular-nums transition-all",
                                                    isEnded
                                                        ? "text-muted-foreground/50"
                                                        : "text-foreground opacity-90 group-hover/row:opacity-100 group-hover/row:text-emerald-400"
                                                )}>
                                                    {Number(market.probability).toFixed(1)}%
                                                </span>
                                                <div className={cn("flex gap-1 transition-opacity", isEnded ? "pointer-events-none opacity-20" : "opacity-0 group-hover/row:opacity-100")}>
                                                    <button onClick={(e) => openQuickTrade(e, market.id, 'yes')} disabled={isEnded} className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-black flex items-center justify-center font-bold text-[10px] transition-colors">Y</button>
                                                    <button onClick={(e) => openQuickTrade(e, market.id, 'no')} disabled={isEnded} className="w-6 h-6 rounded bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-black flex items-center justify-center font-bold text-[10px] transition-colors">N</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {event.markets.length > 3 && (
                                        <div className="text-xs text-center text-muted-foreground py-1">+{event.markets.length - 3} more outcomes</div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        // SINGLE MARKET BIG BUTTONS
                        <div className="h-full flex flex-col justify-center">
                            <div className="flex items-end justify-between mb-3 px-1">
                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Current Probability</span>
                                <span className={cn(
                                    "text-3xl font-black tracking-tight tabular-nums pb-1 leading-normal",
                                    isEnded ? "text-muted-foreground/60" : "text-foreground"
                                )}>
                                    {Number(primaryMarket.probability).toFixed(1)}<span className="text-lg text-muted-foreground/60">%</span>
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {primaryMarket.outcomes.slice(0, 2).map((outcome, idx) => (
                                    <BinaryOutcomeButton
                                        key={outcome.id}
                                        label={outcome.label}
                                        price={outcome.price}
                                        side={idx === 0 ? 'yes' : 'no'}
                                        onClick={(e) => openQuickTrade(e, primaryMarket.id, idx === 0 ? 'yes' : 'no')}
                                        compact={true}
                                        disabled={isEnded}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* CARD FOOTER */}
                {!isFocusing && (
                    <div className="relative z-10 px-4 pb-2 pt-2 flex items-center justify-between animate-in fade-in duration-500">
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                isEnded
                                    ? "bg-muted-foreground/40"
                                    : "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                            )} />
                            <div className="flex items-baseline gap-1.5 text-xs font-mono">
                                <span className="font-black tracking-tight text-foreground">{totalVolumeUsd}</span>
                                <span className="text-muted-foreground font-bold">Vol</span>
                            </div>
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!isAuthenticated) {
                                    toast.error("Connect to watch");
                                    return;
                                }
                                toggleWatchlist(marketPda);
                            }}
                            disabled={isWatchlistLoading}
                            className="text-muted-foreground hover:text-foreground transition-colors p-1"
                        >
                            {isWatchlistLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : isMarketWatched ? (
                                <CheckCircle className="w-4 h-4 text-primary animate-scale-in" />
                            ) : (
                                <PlusCircle className="w-4 h-4 opacity-50 hover:opacity-100" />
                            )}
                        </button>
                    </div>
                )}
            </Card>

            <QuickTradeModal
                isOpen={isQuickTradeOpen}
                onClose={() => setIsQuickTradeOpen(false)}
                event={event}
                selectedMarketId={selectedMarketId}
                tradeSide={tradeSide}
                setTradeSide={setTradeSide}
            />
        </>
    );
}