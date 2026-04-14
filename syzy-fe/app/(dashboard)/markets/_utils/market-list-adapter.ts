import type { MarketItem } from "@/features/markets/hooks/use-market-list";
import type { Event, Market } from "@/app/(dashboard)/markets/_types";

/** Convert slug-style strings to title case (e.g. "democratic-party" → "Democratic party") */
function unslugify(slug: string): string {
  if (!slug || !slug.includes("-")) return slug;
  return slug
    .replace(/-/g, " ")
    .replace(/^(\w)/, (c) => c.toUpperCase());
}

/** Backend Market response shape (with sub-market fields) */
export interface BackendMarket {
  id: string;
  marketId: string;
  title: string;
  slug: string;
  imageUrl?: string;
  category?: string;
  status?: string;
  volume?: number;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
  creatorWallet?: string;
  parentMarketId?: string | null;
  outcomeLabel?: string | null;
  sortOrder?: number;
  isMultiOutcome?: boolean;
  mutuallyExclusive?: boolean;
  groupPda?: string | null;
  yesTokenMint?: string;
  noTokenMint?: string;
  source?: string;
  subMarkets?: BackendMarket[];
}

/**
 * Convert a single MarketItem (from chain) to Event format for UI components.
 */
export function marketItemToEvent(item: MarketItem): Event {
  const marketPda = item.publicKey.toString();
  const endDateTs = item.account.endDate != null ? Number(item.account.endDate) : null;
  const startDateTs = item.account.startDate != null ? Number(item.account.startDate) : null;
  const endDateStr =
    endDateTs != null && endDateTs > 0
      ? new Date(endDateTs * 1000).toISOString()
      : null;
  const startDateStr =
    startDateTs != null && startDateTs > 0
      ? new Date(startDateTs * 1000).toISOString()
      : null;

  // Use PDA as slug for reliable URL lookup
  const prob = item.yesPercentage; // YES chance
  const market: Market = {
    id: marketPda,
    condition_id: marketPda,
    question_id: marketPda,
    event_id: item.publicKey.toString(),
    title: item.question,
    short_title: item.ticker,
    slug: item.slug,
    icon_url: item.image,
    is_active: !item.account.isCompleted,
    is_resolved: item.account.isCompleted ?? false,
    block_number: 0,
    block_timestamp: new Date().toISOString(),
    volume_24h: 0,
    volume: item.volume,
    end_time: endDateStr ?? undefined,
    created_at: startDateStr ?? (item.createdAt ? new Date(item.createdAt * 1000).toISOString() : new Date().toISOString()),
    updated_at: new Date().toISOString(),
    price: prob / 100,
    probability: prob,
    condition: { id: "c", slug: "s" },
    outcomes: [
      {
        id: "yes",
        label: "Yes",
        price: prob / 100,
        color: "hsl(var(--secondary))",
      },
      {
        id: "no",
        label: "No",
        price: (100 - prob) / 100,
        color: "hsl(var(--destructive))",
      },
    ],
  };

  return {
    id: item.publicKey.toString(),
    slug: marketPda, // Use PDA for URL lookup
    title: item.question,
    creator: "Syzy",
    icon_url: item.image,
    show_market_icons: false,
    status: item.account.isCompleted ? "resolved" : "active",
    active_markets_count: 1,
    total_markets_count: 1,
    volume: item.volume,
    start_date: startDateStr,
    end_date: endDateStr,
    created_at: startDateStr ?? (item.createdAt ? new Date(item.createdAt * 1000).toISOString() : new Date().toISOString()),
    updated_at: new Date().toISOString(),
    main_tag: item.category,
    tags: [{ id: 0, name: item.category, slug: item.category.toLowerCase(), isMainCategory: true }],
    is_bookmarked: false,
    is_trending: item.volume > 0.1,
    markets: [market],
    source: item.source,
  };
}

/**
 * Convert MarketItem[] to Event[] for dashboard/markets grid.
 */
export function marketItemsToEvents(items: MarketItem[]): Event[] {
  return items.map((item) => marketItemToEvent(item));
}

/**
 * Convert a backend parent market (isMultiOutcome) with subMarkets[] into an Event
 * with multiple Market entries, enriched with live chain data.
 */
function backendParentToEvent(
  parent: BackendMarket,
  items: MarketItem[]
): Event | null {
  const subMarkets = (parent.subMarkets ?? [])
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const groupMarkets: Market[] = subMarkets
    .map((sub) => {
      const chainItem = items.find(
        (item) => item.publicKey.toString() === sub.marketId
      );
      if (!chainItem) return null;
      const ev = marketItemToEvent(chainItem);
      const market = ev.markets[0];
      market.outcome_label = unslugify(sub.outcomeLabel ?? sub.title);
      return market;
    })
    .filter(Boolean) as Market[];

  if (groupMarkets.length === 0) return null;

  // Normalize probabilities so they sum to 100% for mutually exclusive outcomes
  const totalRawProb = groupMarkets.reduce((sum, m) => sum + m.probability, 0);
  if (totalRawProb > 0) {
    for (const m of groupMarkets) {
      m.probability = (m.probability / totalRawProb) * 100;
      m.price = m.probability / 100;
      m.outcomes = [
        { id: "yes", label: "Yes", price: m.price, color: "hsl(var(--secondary))" },
        { id: "no", label: "No", price: 1 - m.price, color: "hsl(var(--destructive))" },
      ];
    }
  }

  const totalVolume = groupMarkets.reduce((sum, m) => sum + m.volume, 0);

  return {
    id: parent.id,
    slug: parent.slug,
    title: parent.title,
    creator: parent.creatorWallet || "Syzy",
    icon_url: parent.imageUrl || "",
    show_market_icons: false,
    status: parent.status === "active" ? "active" : "resolved",
    active_markets_count: groupMarkets.length,
    total_markets_count: subMarkets.length,
    volume: totalVolume,
    start_date: null,
    end_date: parent.endDate || null,
    created_at: parent.createdAt || new Date().toISOString(),
    updated_at: parent.updatedAt || new Date().toISOString(),
    main_tag: parent.category || "Crypto",
    tags: [
      {
        id: 0,
        name: parent.category || "Crypto",
        slug: (parent.category || "crypto").toLowerCase(),
        isMainCategory: true,
      },
    ],
    is_bookmarked: false,
    is_trending: totalVolume > 0.5,
    markets: groupMarkets,
    group_type: parent.mutuallyExclusive
      ? "mutually_exclusive"
      : "independent",
    group_slug: parent.slug,
  } as Event;
}

/**
 * Merge chain markets with backend parent markets into a unified Event[].
 *
 * Parent markets (isMultiOutcome with subMarkets[]) become multi-market Events.
 * Ungrouped standalone markets stay as single-market Events.
 */
export function mergeMarketsWithGroups(
  items: MarketItem[],
  backendMarkets?: BackendMarket[]
): Event[] {
  const claimedMarketIds = new Set<string>();

  // 1. Convert backend parent markets (isMultiOutcome) to multi-market Events
  const parentEvents: Event[] = [];
  if (backendMarkets) {
    for (const bm of backendMarkets) {
      if (!bm.isMultiOutcome || !bm.subMarkets?.length) continue;
      // Always claim sub-market IDs to hide them from standalone list
      for (const sub of bm.subMarkets) {
        claimedMarketIds.add(sub.marketId);
      }
      const ev = backendParentToEvent(bm, items);
      if (ev) {
        parentEvents.push(ev);
      }
    }
  }

  // 2. Convert ungrouped markets to single-market Events
  const ungroupedEvents = items
    .filter((item) => !claimedMarketIds.has(item.publicKey.toString()))
    .map((item) => marketItemToEvent(item));

  // 3. Combine and sort by volume descending
  const allEvents = [...parentEvents, ...ungroupedEvents];

  // Deduplicate by slug
  const seen = new Set<string>();
  const deduped = allEvents.filter((ev) => {
    if (seen.has(ev.slug)) return false;
    seen.add(ev.slug);
    return true;
  });

  return deduped.sort((a, b) => b.volume - a.volume);
}
