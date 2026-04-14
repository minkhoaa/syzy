"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useMarketDetail } from "@/features/markets/hooks/use-market-detail";
import { usePredictionMarket } from "@/features/trading/hooks/use-prediction-market";
import { buildEventFromMarket } from "@/app/(dashboard)/markets/_utils/build-event-from-market";
import { MarketDetailContent } from "@/app/(dashboard)/markets/_components/slug/market-detail-content";
import { MultiOutcomeDetailContent } from "@/app/(dashboard)/markets/_components/slug/multi-outcome-detail-content";
import { useMultiMarketDetail } from "@/features/markets/hooks/use-multi-market-detail";
import { PublicKey } from "@solana/web3.js";

function isValidPublicKey(str: string): boolean {
  try {
    new PublicKey(str);
    return true;
  } catch {
    return false;
  }
}

export default function MarketDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = React.use(params);
  const slug = resolvedParams.slug;

  // Path 1: Try as PDA (existing single-market path)
  const isPda = isValidPublicKey(slug);
  const { market, stats, balances, loading: chainLoading, refresh } = useMarketDetail(
    isPda ? slug : ""
  );
  const { swap, claimWinnings, resolveViaOracle } = usePredictionMarket();

  // Path 2: Try as backend slug (may be multi-outcome or single)
  const {
    parentMarket,
    subMarkets,
    loading: multiLoading,
    refresh: multiRefresh,
  } = useMultiMarketDetail(!isPda ? slug : "");

  // Determine which path resolved
  const isMultiOutcome = !isPda && parentMarket?.isMultiOutcome;
  const isSingleFromSlug = !isPda && parentMarket && !parentMarket.isMultiOutcome;

  // For single-market resolved via slug, try to load chain data using the marketId PDA
  const slugMarketPda = isSingleFromSlug ? parentMarket.marketId : "";
  const {
    market: slugMarket,
    stats: slugStats,
    balances: slugBalances,
    loading: slugChainLoading,
    refresh: slugRefresh,
  } = useMarketDetail(slugMarketPda);

  // Loading states
  const loading = isPda ? chainLoading : multiLoading;
  const slugSingleLoading = isSingleFromSlug && slugChainLoading;

  if ((loading || slugSingleLoading) && !market && !parentMarket) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Multi-outcome detail page
  if (isMultiOutcome) {
    return (
      <div key={slug}>
        <MultiOutcomeDetailContent
          parentMarket={parentMarket!}
          subMarkets={subMarkets}
          refresh={multiRefresh}
        />
      </div>
    );
  }

  // Single market from PDA
  if (isPda && market && stats) {
    const event = buildEventFromMarket(slug, market, stats);
    return (
      <div key={slug}>
        <MarketDetailContent
          event={event}
          market={market}
          stats={stats}
          balances={balances}
          swap={swap!}
          refresh={refresh}
          claimWinnings={claimWinnings}
          resolveViaOracle={resolveViaOracle}
        />
      </div>
    );
  }

  // Single market from backend slug (resolved via marketId PDA)
  if (isSingleFromSlug && slugMarket && slugStats) {
    const event = buildEventFromMarket(slugMarketPda, slugMarket, slugStats);
    return (
      <div key={slug}>
        <MarketDetailContent
          event={event}
          market={slugMarket}
          stats={slugStats}
          balances={slugBalances}
          swap={swap!}
          refresh={slugRefresh}
          claimWinnings={claimWinnings}
          resolveViaOracle={resolveViaOracle}
        />
      </div>
    );
  }

  // Not found
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-muted-foreground">Market not found</p>
      <Link href="/markets">
        <Button>Back to Markets</Button>
      </Link>
    </div>
  );
}
