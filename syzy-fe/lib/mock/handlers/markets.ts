/**
 * Mock handlers for market endpoints
 *
 * GET  /api/markets
 * GET  /api/markets/by-slug/:slug
 * GET  /api/markets/by-market-id/:marketId
 * GET  /api/markets/:id
 * POST /api/markets
 * PUT  /api/markets/:id
 * GET  /api/markets/recent-trades
 */

import { MOCK_MARKETS, MOCK_MARKET_GROUPS, type MockMarket } from '../data/markets';
import { success, fakePublicKey, fakeTxSignature } from '../utils';
import type { BackendMarket } from '@/app/(dashboard)/markets/_utils/market-list-adapter';

/** Convert a MockMarket into the BackendMarket shape the frontend expects. */
function toBackendMarket(m: MockMarket): BackendMarket {
  return {
    id: m.publicKey,
    marketId: m.publicKey,
    title: m.question,
    slug: m.slug,
    imageUrl: m.imageUrl,
    category: m.category,
    status: m.isCompleted ? 'resolved' : 'active',
    volume: (m.realYesSolReserves + m.realNoSolReserves) / 1_000_000_000,
    endDate: new Date(m.endDate * 1000).toISOString(),
    createdAt: new Date(m.startDate * 1000).toISOString(),
    creatorWallet: m.creator,
    source: m.source,
    isMultiOutcome: false,
    yesTokenMint: m.yesTokenMint,
    noTokenMint: m.noTokenMint,
  };
}

export function handleFindAll(params: Record<string, unknown> | undefined) {
  const page = Number(params?.page ?? 1);
  const limit = Number(params?.limit ?? 20);
  const status = params?.status as string | undefined;
  const category = params?.category as string | undefined;
  const search = params?.search as string | undefined;

  // Convert standalone markets
  let standalone = MOCK_MARKETS.map(toBackendMarket);

  // Convert group markets (multi-outcome / NegRisk)
  const groups: BackendMarket[] = MOCK_MARKET_GROUPS.map((g) => ({
    id: g.publicKey,
    marketId: g.publicKey,
    title: g.question,
    slug: g.slug,
    imageUrl: g.imageUrl,
    category: g.category,
    status: 'active',
    volume: g.totalVolume / 1_000_000_000,
    endDate: new Date(g.endDate * 1000).toISOString(),
    createdAt: new Date(g.startDate * 1000).toISOString(),
    creatorWallet: g.creator,
    source: g.source,
    isMultiOutcome: true,
    mutuallyExclusive: true,
    groupPda: g.publicKey,
    subMarkets: g.subMarkets.map((sub, i) => ({
      id: sub.publicKey,
      marketId: sub.publicKey,
      title: sub.label,
      slug: sub.slug,
      outcomeLabel: sub.label,
      sortOrder: i,
      isMultiOutcome: false,
      yesTokenMint: sub.yesTokenMint,
      noTokenMint: sub.noTokenMint,
    })),
  }));

  let filtered: BackendMarket[] = [...standalone, ...groups];

  if (status) {
    filtered = filtered.filter((m) => {
      if (status === 'active') return m.status === 'active';
      if (status === 'resolved' || status === 'ended') return m.status === 'resolved';
      return true;
    });
  }
  if (category) {
    filtered = filtered.filter(
      (m) => m.category?.toLowerCase() === category.toLowerCase(),
    );
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (m) => m.title?.toLowerCase().includes(q) || m.slug?.toLowerCase().includes(q),
    );
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const paginatedItems = filtered.slice(start, start + limit);

  // Return nested envelope: { success, data: { data, meta } }
  // to match real backend format that useBackendMarkets expects after unwrap()
  return success({
    data: paginatedItems,
    meta: { page, limit, total, totalPages },
  });
}

export function handleFindBySlug(slug: string) {
  const market = MOCK_MARKETS.find((m) => m.slug === slug);
  if (!market) {
    return success(MOCK_MARKETS[0]);
  }
  return success(market);
}

export function handleFindByMarketId(marketId: string) {
  const market = MOCK_MARKETS.find((m) => m.publicKey === marketId);
  if (!market) {
    return success(MOCK_MARKETS[0]);
  }
  return success(market);
}

export function handleFindOne(id: string) {
  const market = MOCK_MARKETS.find(
    (m) => m.publicKey === id || m.slug === id,
  );
  if (!market) {
    return success(MOCK_MARKETS[0]);
  }
  return success(market);
}

export function handleCreate(_params: unknown, data: unknown) {
  const body = data as Record<string, unknown>;
  const name =
    (body?.slug as string) ??
    (body?.marketName ?? body?.title ?? 'new-market')
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-');
  return success({
    publicKey: fakePublicKey(),
    marketName: body?.marketName ?? body?.title ?? 'New Market',
    slug: name,
    isCompleted: false,
    createdAt: new Date().toISOString(),
    ...body,
  });
}

export function handleUpdate(id: string, _params: unknown, data: unknown) {
  const body = data as Record<string, unknown>;
  const existing = MOCK_MARKETS.find(
    (m) => m.publicKey === id || m.slug === id,
  );
  return success({
    ...(existing ?? MOCK_MARKETS[0]),
    ...body,
    updatedAt: new Date().toISOString(),
  });
}

export function handleGetRecentTrades(params: Record<string, unknown> | undefined) {
  const marketId = params?.marketId as string | undefined;
  const now = Date.now();
  const targetMarket = marketId
    ? MOCK_MARKETS.find((m) => m.publicKey === marketId)
    : undefined;
  const trades = Array.from({ length: 5 }, (_, i) => {
    const market = targetMarket ?? MOCK_MARKETS[i % MOCK_MARKETS.length] ?? MOCK_MARKETS[0];
    return {
      id: `trade-${i + 1}`,
      marketId: market?.publicKey ?? fakePublicKey(),
      marketTitle: market?.question ?? 'Unknown Market',
      walletAddress: fakePublicKey(),
      direction: i % 2 === 0 ? 'YES' : 'NO',
      amount: parseFloat((Math.random() * 5 + 0.1).toFixed(4)),
      price: parseFloat((Math.random() * 0.9 + 0.05).toFixed(4)),
      txSignature: fakeTxSignature(),
      timestamp: new Date(now - i * 60_000 * 5).toISOString(),
    };
  });
  return success(trades);
}
