import type { Event, Market } from "@/app/(dashboard)/markets/_types";
import type { MarketAccount } from "@/types/prediction-market.types";

const DEFAULT_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCvFvFW9EqlH20zsrvyQkFmIlHSkGEMF7JME76U4vajye5A2Pyy5NdAeZFeq-9h4lT5l816dykc2a2bgfGlBoA3RVn0JVM0hIGAxroabXjBicOuWN-KSqYN7G0VuGwF0JgnsCc2VcgXS9JPONLvog7_y3HjwCEh83OFcEevhN6W1qnSBYHQFbrChrrPZzsA__03L2t0VqJALuBVUyBvWd00PJji37mSRxPIWo39Mezg_RLqe5kdXQQmHXbIm0oUiOUzgho8U9ynT78";

/** Mock orderbook when no real data -- keeps UI intact */
export function generateOrderBook(price: number) {
  const bids: { price: string; size: number }[] = [];
  const asks: { price: string; size: number }[] = [];
  const depth = 8;
  for (let i = 0; i < depth; i++) {
    bids.push({
      price: (price - (i + 1) * 0.005).toFixed(3),
      size: Math.floor(Math.random() * 5000) + 500,
    });
    asks.push({
      price: (price + (i + 1) * 0.005).toFixed(3),
      size: Math.floor(Math.random() * 5000) + 500,
    });
  }
  return { bids, asks };
}

/**
 * Build Event + markets from chain data for UI (chart, orderbook, forecast)
 */
export function buildEventFromMarket(
  slug: string,
  market: MarketAccount,
  stats: { yesChances: number; noChances: number; totalReserves: number }
): Event {
  const yesPrice = stats.yesChances / 100;
  const noPrice = stats.noChances / 100;
  const question = market.question || market.marketName || "Market";
  const iconUrl = market.imageUrl || DEFAULT_IMAGE;

  // Use actual SOL reserves (not token reserves which are much larger numbers)
  const yesSolReserves = parseFloat(String(market.realYesSolReserves ?? 0)) / 1e9;
  const noSolReserves = parseFloat(String(market.realNoSolReserves ?? 0)) / 1e9;
  const volSol = yesSolReserves + noSolReserves;

  const endDateTs = market.endDate != null ? Number(market.endDate) : null;
  const startDateTs = market.startDate != null ? Number(market.startDate) : null;
  const endDateStr =
    endDateTs != null && endDateTs > 0
      ? new Date(endDateTs * 1000).toISOString()
      : null;
  const startDateStr =
    startDateTs != null && startDateTs > 0
      ? new Date(startDateTs * 1000).toISOString()
      : null;

  const yesMarket: Market = {
    id: "yes",
    condition_id: slug,
    question_id: slug,
    event_id: slug,
    title: "Yes",
    slug: "yes",
    short_title: "Yes",
    icon_url: iconUrl,
    is_active: !market.isCompleted,
    is_resolved: market.isCompleted ?? false,
    block_number: 0,
    block_timestamp: new Date().toISOString(),
    volume_24h: 0,
    volume: volSol,
    end_time: endDateStr,
    created_at: startDateStr ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
    price: yesPrice,
    probability: stats.yesChances,
    outcomes: [],
    condition: { id: "c", slug: "s" },
  };

  const noMarket: Market = {
    ...yesMarket,
    id: "no",
    short_title: "No",
    title: "No",
    slug: "no",
    price: noPrice,
    probability: stats.noChances,
  };

  return {
    id: slug,
    slug,
    title: question,
    creator: "Syzy",
    icon_url: iconUrl,
    show_market_icons: false,
    status: market.isCompleted ? "resolved" : "active",
    active_markets_count: 2,
    total_markets_count: 2,
    volume: volSol,
    start_date: startDateStr,
    end_date: endDateStr,
    created_at:
      startDateStr ??
      (market.createdAt != null
        ? new Date(Number(market.createdAt) * 1000).toISOString()
        : new Date().toISOString()),
    updated_at: new Date().toISOString(),
    markets: [yesMarket, noMarket],
    tags: [],
    main_tag: market.category ?? "Crypto",
    is_bookmarked: false,
    is_trending: false,
  };
}
