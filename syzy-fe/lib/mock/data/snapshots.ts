/**
 * Mock price snapshot data for the Syzy mock frontend.
 *
 * Generates 30 days of price snapshots for each of the 10 single markets
 * (excludes group parent markets 11 and 12).
 *
 * Uses a seeded pseudo-random number generator for deterministic output
 * so data is consistent across renders.
 */

import { MOCK_MARKETS } from './markets';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MockSnapshot {
  /** Unix timestamp (seconds) */
  timestamp: number;
  /** YES token price (0..1) */
  yesPrice: number;
  /** NO token price (0..1) */
  noPrice: number;
  /** Volume in SOL for this snapshot period */
  volume: number;
}

// ---------------------------------------------------------------------------
// Deterministic PRNG (mulberry32)
// ---------------------------------------------------------------------------

/**
 * Mulberry32 — a simple 32-bit seeded PRNG.
 * Returns a function that produces values in [0, 1).
 */
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Simple hash of a string to a 32-bit integer (djb2).
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash;
}

// ---------------------------------------------------------------------------
// Snapshot generator
// ---------------------------------------------------------------------------

const SNAPSHOT_DAYS = 30;
const SNAPSHOTS_PER_DAY = 24; // one per hour
const TOTAL_SNAPSHOTS = SNAPSHOT_DAYS * SNAPSHOTS_PER_DAY;
const HOUR = 3600;

interface MarketSnapshotConfig {
  publicKey: string;
  /** Starting YES price (0..1) */
  startYes: number;
  /** Trend bias per snapshot (-0.001 to 0.001 typical) */
  trendBias: number;
  /** Volatility (standard deviation per step) */
  volatility: number;
  /** Average volume per snapshot (SOL) */
  avgVolume: number;
  /** Whether market is resolved (price should converge to 0 or 1) */
  resolved: boolean;
  /** If resolved, target price */
  resolvedTarget: number;
}

/**
 * Market-specific starting prices and parameters.
 * Starting YES price is derived from the target percentages defined in markets.ts,
 * but we start 30 days ago so the initial price differs slightly.
 */
const MARKET_CONFIGS: MarketSnapshotConfig[] = [
  // 1. BTC $150K — YES 62%, trending up
  {
    publicKey: MOCK_MARKETS[0].publicKey,
    startYes: 0.52,
    trendBias: 0.00015,
    volatility: 0.012,
    avgVolume: 8.2,
    resolved: false,
    resolvedTarget: 0,
  },
  // 2. SOL $300 — YES 45%, slight down then sideways
  {
    publicKey: MOCK_MARKETS[1].publicKey,
    startYes: 0.5,
    trendBias: -0.00008,
    volatility: 0.015,
    avgVolume: 6.0,
    resolved: false,
    resolvedTarget: 0,
  },
  // 3. ETH flippening — YES 12%, low and stable
  {
    publicKey: MOCK_MARKETS[2].publicKey,
    startYes: 0.15,
    trendBias: -0.00004,
    volatility: 0.008,
    avgVolume: 3.0,
    resolved: false,
    resolvedTarget: 0,
  },
  // 4. TRUMP token — YES 35%, volatile meme market
  {
    publicKey: MOCK_MARKETS[3].publicKey,
    startYes: 0.42,
    trendBias: -0.0001,
    volatility: 0.025,
    avgVolume: 17.3,
    resolved: false,
    resolvedTarget: 0,
  },
  // 5. BONK $0.001 — YES 28%, drifting lower
  {
    publicKey: MOCK_MARKETS[4].publicKey,
    startYes: 0.35,
    trendBias: -0.0001,
    volatility: 0.018,
    avgVolume: 2.2,
    resolved: false,
    resolvedTarget: 0,
  },
  // 6. Fed rate cut — YES 71%, steady uptrend on dovish data
  {
    publicKey: MOCK_MARKETS[5].publicKey,
    startYes: 0.58,
    trendBias: 0.0002,
    volatility: 0.01,
    avgVolume: 10.4,
    resolved: false,
    resolvedTarget: 0,
  },
  // 7. SpaceX Mars — YES 8%, low probability, minor drift
  {
    publicKey: MOCK_MARKETS[6].publicKey,
    startYes: 0.1,
    trendBias: -0.00003,
    volatility: 0.006,
    avgVolume: 1.5,
    resolved: false,
    resolvedTarget: 0,
  },
  // 8. Lakers NBA — YES 15%, sports market, moderate vol
  {
    publicKey: MOCK_MARKETS[7].publicKey,
    startYes: 0.18,
    trendBias: -0.00004,
    volatility: 0.01,
    avgVolume: 5.2,
    resolved: false,
    resolvedTarget: 0,
  },
  // 9. AI bar exam — RESOLVED at YES (converges to 1.0)
  {
    publicKey: MOCK_MARKETS[8].publicKey,
    startYes: 0.65,
    trendBias: 0.0005,
    volatility: 0.015,
    avgVolume: 29.7,
    resolved: true,
    resolvedTarget: 1.0,
  },
  // 10. ETH L2 TVL — YES 55%, moderate uptrend
  {
    publicKey: MOCK_MARKETS[9].publicKey,
    startYes: 0.48,
    trendBias: 0.0001,
    volatility: 0.011,
    avgVolume: 7.8,
    resolved: false,
    resolvedTarget: 0,
  },
];

function generateSnapshots(config: MarketSnapshotConfig): MockSnapshot[] {
  const rng = mulberry32(hashString(config.publicKey));
  const snapshots: MockSnapshot[] = [];

  const now = Math.floor(Date.now() / 1000);
  const startTime = now - SNAPSHOT_DAYS * 86400;

  let yesPrice = config.startYes;

  for (let i = 0; i < TOTAL_SNAPSHOTS; i++) {
    const timestamp = startTime + i * HOUR;
    const progress = i / TOTAL_SNAPSHOTS; // 0..1

    // Random walk with trend bias
    const noise = (rng() - 0.5) * 2 * config.volatility;
    let bias = config.trendBias;

    // For resolved markets, increase convergence toward target in final 20%
    if (config.resolved && progress > 0.8) {
      const convergenceStrength = (progress - 0.8) / 0.2; // 0..1 in final 20%
      bias += (config.resolvedTarget - yesPrice) * 0.02 * convergenceStrength;
    }

    yesPrice += noise + bias;

    // Clamp to [0.01, 0.99] for active markets, allow [0.001, 0.999] near resolution
    const minPrice = config.resolved && progress > 0.95 ? 0.001 : 0.01;
    const maxPrice = config.resolved && progress > 0.95 ? 0.999 : 0.99;
    yesPrice = Math.max(minPrice, Math.min(maxPrice, yesPrice));

    // Final snapshot of resolved market should be at target
    if (config.resolved && i === TOTAL_SNAPSHOTS - 1) {
      yesPrice = config.resolvedTarget;
    }

    const noPrice = Number((1 - yesPrice).toFixed(4));

    // Volume: random variation around average, with occasional spikes
    const volumeNoise = 0.5 + rng() * 1.5; // 0.5x to 2x
    const spike = rng() > 0.95 ? 2 + rng() * 3 : 1; // 5% chance of 2-5x spike
    const volume = Number((config.avgVolume * volumeNoise * spike).toFixed(2));

    snapshots.push({
      timestamp,
      yesPrice: Number(yesPrice.toFixed(4)),
      noPrice,
      volume,
    });
  }

  return snapshots;
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/**
 * Price snapshots keyed by market publicKey.
 * Each value is an array of 720 snapshots (30 days x 24 per day).
 */
export const MOCK_SNAPSHOTS: Record<string, MockSnapshot[]> = {};

for (const config of MARKET_CONFIGS) {
  MOCK_SNAPSHOTS[config.publicKey] = generateSnapshots(config);
}

// Cache for dynamically generated snapshots (unknown market IDs)
const dynamicCache: Record<string, MockSnapshot[]> = {};

/**
 * Generate deterministic snapshots for any arbitrary market ID.
 * Used as a fallback when the ID doesn't match a known mock market.
 * The seed is derived from the ID string, so the same ID always
 * produces the same chart data.
 */
export function generateSnapshotsForId(id: string): MockSnapshot[] {
  if (dynamicCache[id]) return dynamicCache[id];

  const seed = hashString(id);
  const rng = mulberry32(seed);

  // Derive plausible market parameters from the hash
  const startYes = 0.2 + rng() * 0.6; // 0.2..0.8
  const trendBias = (rng() - 0.5) * 0.0004; // -0.0002..0.0002
  const volatility = 0.008 + rng() * 0.015; // 0.008..0.023
  const avgVolume = 2 + rng() * 15;

  const config: MarketSnapshotConfig = {
    publicKey: id,
    startYes,
    trendBias,
    volatility,
    avgVolume,
    resolved: false,
    resolvedTarget: 0,
  };

  const result = generateSnapshots(config);
  dynamicCache[id] = result;
  return result;
}
