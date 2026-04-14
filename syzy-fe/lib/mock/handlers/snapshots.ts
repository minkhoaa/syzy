/**
 * Mock handlers for snapshot endpoints
 *
 * GET  /api/snapshots/:marketId
 * POST /api/snapshots  (create)
 */

import { MOCK_SNAPSHOTS, generateSnapshotsForId, type MockSnapshot } from '../data/snapshots';
import { MOCK_MARKETS } from '../data/markets';
import { success } from '../utils';

/**
 * Convert raw mock snapshot (Unix ts, 0-1 prices) to the format
 * the frontend expects (ISO string ts, 0-100 percentage prices).
 */
function formatSnapshot(s: MockSnapshot) {
  return {
    yesPrice: Math.round(s.yesPrice * 10000) / 100, // 0-1 → 0-100 with 2 decimals
    noPrice: Math.round(s.noPrice * 10000) / 100,
    timestamp: new Date(s.timestamp * 1000).toISOString(),
    volume: s.volume,
  };
}

/**
 * Resolve a marketId to mock snapshots.
 * Tries: exact publicKey match → slug match → on-demand generation → first available.
 */
function resolveSnapshots(marketId: string): MockSnapshot[] {
  // 1. Direct match by publicKey
  if (MOCK_SNAPSHOTS[marketId]) {
    return MOCK_SNAPSHOTS[marketId];
  }

  // 2. Match by slug
  const bySlug = MOCK_MARKETS.find((m) => m.slug === marketId);
  if (bySlug && MOCK_SNAPSHOTS[bySlug.publicKey]) {
    return MOCK_SNAPSHOTS[bySlug.publicKey];
  }

  // 3. Generate on-demand for unknown IDs (real devnet markets, etc.)
  return generateSnapshotsForId(marketId);
}

/**
 * Filter snapshots by time range.
 */
function filterByRange(snapshots: MockSnapshot[], range?: string): MockSnapshot[] {
  if (!range || range === 'all') return snapshots;

  const now = Math.floor(Date.now() / 1000);
  let cutoff: number;
  if (range === '1d') {
    cutoff = now - 86400;
  } else if (range === '1w') {
    cutoff = now - 7 * 86400;
  } else {
    return snapshots;
  }

  return snapshots.filter((s) => s.timestamp >= cutoff);
}

export function handleGetSnapshots(marketId: string, queryParams?: Record<string, unknown>) {
  const raw = resolveSnapshots(marketId);
  const range = (queryParams?.range as string) ?? undefined;
  const filtered = filterByRange(raw, range);
  return success(filtered.map(formatSnapshot));
}

export function handleGetLatestSnapshot(marketId: string) {
  const raw = resolveSnapshots(marketId);
  if (raw.length > 0) {
    return success(formatSnapshot(raw[raw.length - 1]));
  }
  return success(null);
}

export function handleCreateSnapshot(_params: unknown, data: unknown) {
  const body = data as Record<string, unknown>;
  return success({
    id: 'mock-snapshot-' + Date.now(),
    createdAt: new Date().toISOString(),
    ...body,
  });
}
