/**
 * Mock portfolio data: positions, trade history, and portfolio stats.
 */

import { MOCK_MARKETS } from './markets';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MockPosition {
  marketId: string;
  marketName: string;
  slug: string;
  imageUrl: string;
  outcome: 'yes' | 'no';
  tokenBalance: number;
  avgEntryPrice: number;
  currentPrice: number;
  costBasis: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  isCompleted: boolean;
  winningOutcome: number | null;
}

export interface MockTradeHistoryItem {
  id: string;
  type: 'buy' | 'sell' | 'claim';
  marketName: string;
  slug: string;
  outcome: 'yes' | 'no';
  /** Amount in SOL */
  amount: number;
  /** Token price at time of trade */
  price: number;
  /** Unix timestamp (seconds) */
  timestamp: number;
  /** Base58 transaction signature */
  signature: string;
}

export interface MockPortfolioStats {
  totalTrades: number;
  winRate: number;
  totalVolume: number;
  totalPnl: number;
  activePositions: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const now = Math.floor(Date.now() / 1000);
const days = (d: number) => d * 86_400;
const hours = (h: number) => h * 3_600;

function mockSig(index: number): string {
  const base =
    '5VERv8NMhPLGhzkApAiKqEBR5zFhHTiLMi5dXwTSnnpqFadBA4T3nnUGjxkNAw';
  return `${base}${String(index).padStart(4, '0')}`;
}

// ---------------------------------------------------------------------------
// Positions
// ---------------------------------------------------------------------------

const m = MOCK_MARKETS;

export const MOCK_POSITIONS: MockPosition[] = [
  // Active YES positions
  {
    marketId: m[0].publicKey, // BTC $150K
    marketName: m[0].marketName,
    slug: m[0].slug,
    imageUrl: m[0].imageUrl,
    outcome: 'yes',
    tokenBalance: 5_200_000,
    avgEntryPrice: 0.55,
    currentPrice: 0.62,
    costBasis: 2.86,
    currentValue: 3.224,
    pnl: 0.364,
    pnlPercent: 12.73,
    isCompleted: false,
    winningOutcome: null,
  },
  {
    marketId: m[5].publicKey, // Fed rate cut
    marketName: m[5].marketName,
    slug: m[5].slug,
    imageUrl: m[5].imageUrl,
    outcome: 'yes',
    tokenBalance: 3_100_000,
    avgEntryPrice: 0.6,
    currentPrice: 0.71,
    costBasis: 1.86,
    currentValue: 2.201,
    pnl: 0.341,
    pnlPercent: 18.33,
    isCompleted: false,
    winningOutcome: null,
  },
  {
    marketId: m[9].publicKey, // ETH L2 TVL
    marketName: m[9].marketName,
    slug: m[9].slug,
    imageUrl: m[9].imageUrl,
    outcome: 'yes',
    tokenBalance: 4_000_000,
    avgEntryPrice: 0.48,
    currentPrice: 0.55,
    costBasis: 1.92,
    currentValue: 2.2,
    pnl: 0.28,
    pnlPercent: 14.58,
    isCompleted: false,
    winningOutcome: null,
  },
  // Active NO position
  {
    marketId: m[6].publicKey, // SpaceX Mars
    marketName: m[6].marketName,
    slug: m[6].slug,
    imageUrl: m[6].imageUrl,
    outcome: 'no',
    tokenBalance: 8_000_000,
    avgEntryPrice: 0.88,
    currentPrice: 0.92,
    costBasis: 7.04,
    currentValue: 7.36,
    pnl: 0.32,
    pnlPercent: 4.55,
    isCompleted: false,
    winningOutcome: null,
  },
  // Resolved positions
  {
    marketId: m[8].publicKey, // AI bar exam — resolved YES
    marketName: m[8].marketName,
    slug: m[8].slug,
    imageUrl: m[8].imageUrl,
    outcome: 'yes',
    tokenBalance: 2_500_000,
    avgEntryPrice: 0.72,
    currentPrice: 1.0,
    costBasis: 1.8,
    currentValue: 2.5,
    pnl: 0.7,
    pnlPercent: 38.89,
    isCompleted: true,
    winningOutcome: 0,
  },
  {
    marketId: m[4].publicKey, // BONK — pretend a different resolved position
    marketName: 'Will DOGE hit $1 by 2026?',
    slug: 'doge-1-dollar-2026',
    imageUrl: 'https://picsum.photos/seed/doge-1-dollar-2026/400/400',
    outcome: 'yes',
    tokenBalance: 6_000_000,
    avgEntryPrice: 0.35,
    currentPrice: 0.0,
    costBasis: 2.1,
    currentValue: 0,
    pnl: -2.1,
    pnlPercent: -100,
    isCompleted: true,
    winningOutcome: 1, // NO won, our YES position lost
  },
];

// ---------------------------------------------------------------------------
// Trade History
// ---------------------------------------------------------------------------

export const MOCK_TRADE_HISTORY: MockTradeHistoryItem[] = [
  // Recent trades
  {
    id: 'th-01',
    type: 'buy',
    marketName: 'BTC $150K by Dec 2026',
    slug: 'btc-150k-dec-2026',
    outcome: 'yes',
    amount: 1.5,
    price: 0.58,
    timestamp: now - hours(2),
    signature: mockSig(1),
  },
  {
    id: 'th-02',
    type: 'buy',
    marketName: 'BTC $150K by Dec 2026',
    slug: 'btc-150k-dec-2026',
    outcome: 'yes',
    amount: 1.36,
    price: 0.55,
    timestamp: now - days(3),
    signature: mockSig(2),
  },
  {
    id: 'th-03',
    type: 'buy',
    marketName: 'US Fed Rate Cut Before Sept 2026',
    slug: 'fed-rate-cut-sept-2026',
    outcome: 'yes',
    amount: 1.86,
    price: 0.6,
    timestamp: now - days(5),
    signature: mockSig(3),
  },
  {
    id: 'th-04',
    type: 'buy',
    marketName: 'Ethereum L2 TVL > $100B by EOY',
    slug: 'eth-l2-tvl-100b-eoy',
    outcome: 'yes',
    amount: 1.92,
    price: 0.48,
    timestamp: now - days(7),
    signature: mockSig(4),
  },
  {
    id: 'th-05',
    type: 'buy',
    marketName: 'SpaceX Lands on Mars by 2028',
    slug: 'spacex-mars-2028',
    outcome: 'no',
    amount: 7.04,
    price: 0.88,
    timestamp: now - days(8),
    signature: mockSig(5),
  },
  {
    id: 'th-06',
    type: 'sell',
    marketName: 'SOL above $300 by Q3 2026',
    slug: 'sol-300-q3-2026',
    outcome: 'yes',
    amount: 2.1,
    price: 0.52,
    timestamp: now - days(10),
    signature: mockSig(6),
  },
  {
    id: 'th-07',
    type: 'buy',
    marketName: 'SOL above $300 by Q3 2026',
    slug: 'sol-300-q3-2026',
    outcome: 'yes',
    amount: 1.8,
    price: 0.42,
    timestamp: now - days(12),
    signature: mockSig(7),
  },
  {
    id: 'th-08',
    type: 'buy',
    marketName: 'AI Passes Bar Exam with 99%',
    slug: 'ai-passes-bar-exam-99',
    outcome: 'yes',
    amount: 1.8,
    price: 0.72,
    timestamp: now - days(30),
    signature: mockSig(8),
  },
  {
    id: 'th-09',
    type: 'claim',
    marketName: 'AI Passes Bar Exam with 99%',
    slug: 'ai-passes-bar-exam-99',
    outcome: 'yes',
    amount: 2.5,
    price: 1.0,
    timestamp: now - days(4),
    signature: mockSig(9),
  },
  {
    id: 'th-10',
    type: 'buy',
    marketName: 'Will DOGE hit $1 by 2026?',
    slug: 'doge-1-dollar-2026',
    outcome: 'yes',
    amount: 2.1,
    price: 0.35,
    timestamp: now - days(45),
    signature: mockSig(10),
  },
  {
    id: 'th-11',
    type: 'buy',
    marketName: 'TRUMP Token above $50 by July',
    slug: 'trump-token-50-july',
    outcome: 'yes',
    amount: 0.5,
    price: 0.32,
    timestamp: now - days(14),
    signature: mockSig(11),
  },
  {
    id: 'th-12',
    type: 'sell',
    marketName: 'TRUMP Token above $50 by July',
    slug: 'trump-token-50-july',
    outcome: 'yes',
    amount: 0.55,
    price: 0.35,
    timestamp: now - days(9),
    signature: mockSig(12),
  },
  {
    id: 'th-13',
    type: 'buy',
    marketName: 'Lakers Win NBA Championship 2027',
    slug: 'lakers-nba-championship-2027',
    outcome: 'no',
    amount: 1.2,
    price: 0.85,
    timestamp: now - days(6),
    signature: mockSig(13),
  },
  {
    id: 'th-14',
    type: 'sell',
    marketName: 'Lakers Win NBA Championship 2027',
    slug: 'lakers-nba-championship-2027',
    outcome: 'no',
    amount: 1.28,
    price: 0.87,
    timestamp: now - days(2),
    signature: mockSig(14),
  },
  {
    id: 'th-15',
    type: 'buy',
    marketName: 'ETH Flips BTC Market Cap',
    slug: 'eth-flips-btc-market-cap',
    outcome: 'no',
    amount: 3.0,
    price: 0.88,
    timestamp: now - days(20),
    signature: mockSig(15),
  },
  {
    id: 'th-16',
    type: 'sell',
    marketName: 'ETH Flips BTC Market Cap',
    slug: 'eth-flips-btc-market-cap',
    outcome: 'no',
    amount: 3.2,
    price: 0.9,
    timestamp: now - days(11),
    signature: mockSig(16),
  },
  {
    id: 'th-17',
    type: 'buy',
    marketName: 'BONK Reaches $0.001',
    slug: 'bonk-reaches-0001',
    outcome: 'yes',
    amount: 0.4,
    price: 0.25,
    timestamp: now - days(15),
    signature: mockSig(17),
  },
];

// ---------------------------------------------------------------------------
// Portfolio Stats
// ---------------------------------------------------------------------------

export const MOCK_PORTFOLIO_STATS: MockPortfolioStats = {
  totalTrades: MOCK_TRADE_HISTORY.length,
  winRate: 62.5, // percent
  totalVolume: MOCK_TRADE_HISTORY.reduce((sum, t) => sum + t.amount, 0),
  totalPnl: MOCK_POSITIONS.reduce((sum, p) => sum + p.pnl, 0),
  activePositions: MOCK_POSITIONS.filter((p) => !p.isCompleted).length,
};

// ---------------------------------------------------------------------------
// Watchlist
// ---------------------------------------------------------------------------

export interface MockWatchlistItem {
  marketId: string;
  marketName: string;
  slug: string;
  addedAt: number;
}

export const MOCK_WATCHLIST: MockWatchlistItem[] = [
  {
    marketId: MOCK_MARKETS[1].publicKey,
    marketName: MOCK_MARKETS[1].marketName,
    slug: MOCK_MARKETS[1].slug,
    addedAt: now - days(10),
  },
  {
    marketId: MOCK_MARKETS[3].publicKey,
    marketName: MOCK_MARKETS[3].marketName,
    slug: MOCK_MARKETS[3].slug,
    addedAt: now - days(7),
  },
  {
    marketId: MOCK_MARKETS[7].publicKey,
    marketName: MOCK_MARKETS[7].marketName,
    slug: MOCK_MARKETS[7].slug,
    addedAt: now - days(2),
  },
];
