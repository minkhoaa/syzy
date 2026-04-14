"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { ExternalLink, Plus, Layers } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { KalshiEventResponse } from "@/features/markets/hooks/use-kalshi-events";
import { CloneMarketDialog } from "./clone-market-dialog";

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

interface KalshiEventCardProps {
  event: KalshiEventResponse;
}

export function KalshiEventCard({ event }: KalshiEventCardProps) {
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const handleImgError = useCallback(() => setImgError(true), []);
  const isBinary =
    event.markets.length === 1 &&
    event.markets[0].outcomes.length === 2;

  const handleCreateMarket = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCloneDialogOpen(true);
  };

  return (
    <>
    <Card className="group relative flex flex-col bg-card/60 backdrop-blur-md hover:bg-card/80 border border-white/5 hover:border-primary/20 h-[280px] overflow-hidden rounded-3xl transition-all duration-500 shadow-sm hover:shadow-xl">
      {/* Background abstract gradient */}
      <div className="absolute -inset-24 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl pointer-events-none" />

      {/* CARD HEADER */}
      <div className="relative z-10 px-5 pt-5 pb-2 flex gap-3 shrink-0">
        <div className="shrink-0 relative pt-0.5">
          <div className="w-[52px] h-[52px] relative rounded-[18px] shadow-sm ring-1 ring-border/50 group-hover:ring-primary/30 transition-all duration-500 overflow-hidden bg-muted/10">
            {event.imageUrl && !imgError ? (
              <Image
                src={event.imageUrl}
                alt={event.title}
                fill
                unoptimized
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                onError={handleImgError}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground/40 text-xl font-bold">
                ?
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1 flex flex-col justify-start gap-1.5">
          <div className="flex flex-wrap items-center gap-1.5 overflow-hidden">
            <Badge
              variant="secondary"
              className="px-1.5 py-0 h-4 text-[9px] font-bold tracking-wider uppercase border-0 bg-teal-500/10 text-teal-500 rounded-sm"
            >
              Kalshi
            </Badge>
            {!isBinary && (
              <Badge
                variant="secondary"
                className="px-1.5 py-0 h-4 text-[9px] font-bold tracking-wider uppercase border-0 bg-teal-500/10 text-teal-500 rounded-sm"
              >
                {event.marketCount} Outcomes
              </Badge>
            )}
          </div>
          <div className="flex items-start gap-1">
            <h3 title={event.title} className="text-[15px] font-semibold leading-snug text-foreground/90 group-hover:text-foreground transition-colors duration-300 line-clamp-2">
              {event.title}
            </h3>
            {event.kalshiUrl && (
              <a
                href={event.kalshiUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                title="View on Kalshi"
                className="shrink-0 mt-0.5 text-muted-foreground/50 hover:text-primary transition-colors"
              >
                <ExternalLink className="w-[14px] h-[14px]" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* CARD BODY */}
      <div className="flex-1 px-5 relative overflow-hidden flex flex-col min-h-0 pb-1">
        {isBinary ? (
          <BinaryView market={event.markets[0]} />
        ) : (
          <MultiOutcomeView markets={event.markets} />
        )}
      </div>

      {/* CARD FOOTER */}
      <div className="relative z-10 px-5 pb-4 pt-3 mt-auto shrink-0 flex items-center justify-between border-t border-border/40 bg-background/20">
        <div className="flex items-center gap-4">
          <div className="flex items-baseline gap-1 font-mono cursor-default" title="24h Volume">
            <span className="font-bold tracking-tight text-[13px] text-foreground/80">
              {formatCompact(event.volume24hr)}
            </span>
            <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-sans">Vol</span>
          </div>
          <div className="w-[1px] h-3 bg-border/60" />
          <div className="flex items-baseline gap-1 font-mono cursor-default" title="Open Interest">
            <span className="font-bold tracking-tight text-[13px] text-foreground/80">
              {formatCompact(event.openInterest)}
            </span>
            <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-sans">OI</span>
          </div>
        </div>

        <Button
          size="sm"
          className="h-8 px-3 text-[11px] font-bold rounded-lg shadow-sm hover:shadow-md transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground bg-secondary text-secondary-foreground"
          onClick={handleCreateMarket}
        >
          {isBinary ? (
            <>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Create
            </>
          ) : (
            <>
              <Layers className="mr-1.5 h-3.5 w-3.5" />
              Create
            </>
          )}
        </Button>
      </div>
    </Card>

    <CloneMarketDialog
      open={cloneDialogOpen}
      onOpenChange={setCloneDialogOpen}
      source="kalshi"
      title={event.title}
      imageUrl={event.imageUrl}
      category={event.category}
      endDate={event.endDate}
      isBinary={isBinary}
      question={isBinary ? event.title : undefined}
      outcomes={!isBinary ? event.markets.map((m) => m.question) : undefined}
      kalshiMeta={{
        eventTicker: event.eventTicker,
        marketTicker: isBinary ? event.markets[0].ticker : undefined,
      }}
    />
    </>
  );
}

function BinaryView({
  market,
}: {
  market: KalshiEventResponse["markets"][number];
}) {
  const yesPrice = market.outcomePrices[0] ?? 0;
  const yesPercent = Math.round(yesPrice * 100);

  return (
    <div className="h-full flex flex-col justify-center pb-2">
      <div className="flex items-end justify-between mb-3 px-0.5">
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          YES Probability
        </span>
        <span className="text-[32px] font-black text-foreground tracking-tight tabular-nums leading-none">
          {yesPercent}
          <span className="text-xl text-muted-foreground/50">%</span>
        </span>
      </div>
      <div className="w-full h-3.5 rounded-full bg-muted/40 overflow-hidden relative shadow-inner">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            yesPercent > 50
              ? "bg-emerald-500"
              : yesPercent < 50
                ? "bg-rose-500"
                : "bg-teal-500"
          )}
          style={{ width: `${yesPercent}%` }}
        />
        {/* Subtly add a gloss effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-full" />
      </div>
      <div className="flex justify-between mt-2 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground/70 px-1">
        <span>Yes</span>
        <span>No</span>
      </div>
    </div>
  );
}

function MultiOutcomeView({
  markets,
}: {
  markets: KalshiEventResponse["markets"];
}) {
  const topMarkets = markets.slice(0, 3);
  const remaining = markets.length - 3;

  return (
    <div className="flex flex-col h-full justify-center space-y-2.5 pt-1 pb-1">
      {topMarkets.map((market) => {
        const yesPrice = market.outcomePrices[0] ?? 0;
        const percent = Math.round(yesPrice * 100);

        return (
          <div
            key={market.ticker}
            className="flex items-center gap-3 group/row"
          >
            <span title={market.question} className="text-[13px] font-medium text-muted-foreground group-hover/row:text-foreground/90 transition-colors truncate w-full flex-1">
              {market.question.replace(/^Will (?:the )?(.+?)(?: win.*| \?*)$/i, "$1").replace(/\?$/, "")}
            </span>
            <div className="flex flex-col items-end shrink-0 w-[52px]">
               <span className="font-mono text-sm font-black text-foreground tabular-nums">
                 {percent}%
               </span>
               <div className="w-full h-1.5 mt-0.5 rounded-full bg-muted/30 overflow-hidden">
                 <div
                   className={cn(
                     "h-full rounded-full transition-all duration-500 relative",
                     percent > 20 ? "bg-emerald-500/80" : "bg-primary/50"
                   )}
                   style={{ width: `${percent}%` }}
                 />
               </div>
            </div>
          </div>
        );
      })}
      {remaining > 0 && (
        <div className="text-[11px] font-bold text-center uppercase tracking-widest text-muted-foreground/50 pt-1">
          +{remaining} more outcomes
        </div>
      )}
    </div>
  );
}
