/**
 * Mock handlers for portfolio endpoints
 *
 * GET    /api/portfolio/:wallet/stats
 * GET    /api/portfolio/:wallet/history
 * GET    /api/portfolio/:wallet/cost-basis
 * GET    /api/portfolio/watchlist
 * POST   /api/portfolio/watchlist
 * DELETE /api/portfolio/watchlist/:marketId
 * GET    /api/portfolio/watchlist/:marketId/check
 */

import { MOCK_PORTFOLIO_STATS, MOCK_TRADE_HISTORY, MOCK_POSITIONS, MOCK_WATCHLIST } from '../data/portfolio';
import { success, paginated } from '../utils';

// In-memory watchlist state for add/remove during the session
const watchlistState = new Set<string>(MOCK_WATCHLIST.map((w) => w.marketId));

export function handleGetStats() {
  return success(MOCK_PORTFOLIO_STATS);
}

export function handleGetHistory(params: Record<string, unknown> | undefined) {
  const page = Number(params?.page ?? 1);
  const limit = Number(params?.limit ?? 20);
  return paginated(MOCK_TRADE_HISTORY, page, limit);
}

export function handleGetCostBasis() {
  // Derive cost basis from positions data
  const costBasis = MOCK_POSITIONS.map((p) => ({
    marketId: p.marketId,
    marketName: p.marketName,
    outcome: p.outcome,
    totalCost: p.costBasis,
    avgPrice: p.avgEntryPrice,
    tokenBalance: p.tokenBalance,
    currentValue: p.currentValue,
    pnl: p.pnl,
    pnlPercent: p.pnlPercent,
  }));
  return success(costBasis);
}

export function handleGetWatchlist() {
  const items = MOCK_WATCHLIST.filter((w) => watchlistState.has(w.marketId));
  return success(items);
}

export function handleAddToWatchlist(_params: unknown, data: unknown) {
  const body = data as { marketId?: string } | undefined;
  const marketId = body?.marketId ?? 'unknown';
  watchlistState.add(marketId);
  return success({ marketId, createdAt: new Date().toISOString() });
}

export function handleRemoveFromWatchlist(marketId: string) {
  watchlistState.delete(marketId);
  return success({ success: true });
}

export function handleCheckWatchlist(marketId: string) {
  return success({ isWatchlisted: watchlistState.has(marketId) });
}
