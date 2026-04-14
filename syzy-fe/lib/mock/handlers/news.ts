/**
 * Mock handlers for news, Kalshi, Polymarket, and graduation endpoints
 *
 * GET /api/news/:symbol
 * GET /api/kalshi/events
 * GET /api/kalshi/events/:ticker
 * GET /api/polymarket/events
 * GET /api/polymarket/events/:slug
 * GET /api/graduation/markets
 * GET /api/graduation/trending
 * GET /api/graduation/token/:mint
 */

import { MOCK_NEWS } from '../data/news';
import { success } from '../utils';

export function handleGetNews(symbol: string) {
  const q = symbol.toLowerCase();
  const filtered = MOCK_NEWS.filter((n) =>
    n.relatedTokens.some((t) => t.toLowerCase() === q),
  );
  const items = filtered.length > 0 ? filtered : MOCK_NEWS.slice(0, 5);
  // Return in the shape useMarketNews expects: { news: [], symbol, cached }
  return success({
    news: items.map((n) => ({
      id: n.id,
      title: n.title,
      url: n.url,
      source: n.source,
      sourceDomain: new URL(n.url).hostname,
      publishedAt: n.publishedAt,
      sentiment: n.sentiment,
      votes: { positive: Math.floor(Math.random() * 50) + 5, negative: Math.floor(Math.random() * 10) },
    })),
    symbol: symbol.toUpperCase(),
    cached: false,
  });
}

// ── Twitter News ──────────────────────────────────────────────

const MOCK_TWITTER_ACCOUNTS = [
  { name: 'CryptoAnalyst', screenName: 'crypto_analyst', avatar: 'https://picsum.photos/seed/tw1/48/48' },
  { name: 'DeFi Insider', screenName: 'defi_insider', avatar: 'https://picsum.photos/seed/tw2/48/48' },
  { name: 'Whale Alert', screenName: 'whale_alert', avatar: 'https://picsum.photos/seed/tw3/48/48' },
  { name: 'Market Pulse', screenName: 'market_pulse', avatar: 'https://picsum.photos/seed/tw4/48/48' },
  { name: 'Sol Maxi', screenName: 'sol_maxi_dev', avatar: 'https://picsum.photos/seed/tw5/48/48' },
];

export function handleGetTwitterNews(symbol: string) {
  const now = Date.now();
  const tweets = MOCK_TWITTER_ACCOUNTS.map((account, i) => ({
    id: `tweet-${symbol}-${i}`,
    title: `${symbol.toUpperCase()} looking strong today. Key resistance at current levels — watching for a breakout. #${symbol.toUpperCase()} #crypto`,
    url: `https://twitter.com/${account.screenName}/status/${1800000000 + i}`,
    source: 'Twitter',
    sourceDomain: 'twitter.com',
    publishedAt: new Date(now - i * 3600_000 * 2).toISOString(),
    name: account.name,
    screenName: account.screenName,
    avatar: account.avatar,
    image: [],
    likeCount: Math.floor(Math.random() * 500) + 10,
    replyCount: Math.floor(Math.random() * 50) + 2,
  }));

  return success({
    news: tweets,
    symbol: symbol.toUpperCase(),
    cached: false,
  });
}

// ── Kalshi ────────────────────────────────────────────────────

const MOCK_KALSHI_EVENTS = [
  {
    ticker: 'KXBTC-24DEC31-100K',
    title: 'Will Bitcoin reach $100K by end of 2024?',
    category: 'Crypto',
    status: 'active',
    yesPrice: 0.65,
    noPrice: 0.35,
    volume: 125_000,
    openInterest: 45_000,
    expirationDate: '2024-12-31T23:59:59Z',
  },
  {
    ticker: 'KXFED-25JAN-CUT',
    title: 'Will the Fed cut rates in January 2025?',
    category: 'Economics',
    status: 'active',
    yesPrice: 0.42,
    noPrice: 0.58,
    volume: 89_000,
    openInterest: 32_000,
    expirationDate: '2025-01-31T23:59:59Z',
  },
  {
    ticker: 'KXETH-25Q1-5K',
    title: 'Will ETH exceed $5,000 in Q1 2025?',
    category: 'Crypto',
    status: 'active',
    yesPrice: 0.28,
    noPrice: 0.72,
    volume: 67_000,
    openInterest: 21_000,
    expirationDate: '2025-03-31T23:59:59Z',
  },
  {
    ticker: 'KXSOL-25Q1-200',
    title: 'Will SOL hit $200 in Q1 2025?',
    category: 'Crypto',
    status: 'active',
    yesPrice: 0.55,
    noPrice: 0.45,
    volume: 54_000,
    openInterest: 18_000,
    expirationDate: '2025-03-31T23:59:59Z',
  },
  {
    ticker: 'KXAI-25-REGULATION',
    title: 'Will major AI regulation pass in 2025?',
    category: 'Politics',
    status: 'active',
    yesPrice: 0.35,
    noPrice: 0.65,
    volume: 43_000,
    openInterest: 15_000,
    expirationDate: '2025-12-31T23:59:59Z',
  },
];

export function handleGetKalshiEvents() {
  return success(MOCK_KALSHI_EVENTS);
}

export function handleGetKalshiEventByTicker(ticker: string) {
  const event = MOCK_KALSHI_EVENTS.find((e) => e.ticker === ticker);
  return success(event ?? MOCK_KALSHI_EVENTS[0]);
}

// ── Polymarket ────────────────────────────────────────────────

const MOCK_POLYMARKET_EVENTS = [
  {
    slug: 'bitcoin-100k-2024',
    title: 'Bitcoin to hit $100,000 in 2024',
    category: 'Crypto',
    status: 'active',
    outcomePrices: { Yes: 0.62, No: 0.38 },
    volume: 2_500_000,
    liquidity: 450_000,
    endDate: '2024-12-31T23:59:59Z',
    imageUrl: 'https://picsum.photos/seed/poly1/200/200',
  },
  {
    slug: 'eth-etf-approval',
    title: 'Ethereum Spot ETF approved by SEC',
    category: 'Crypto',
    status: 'resolved',
    outcomePrices: { Yes: 1.0, No: 0.0 },
    volume: 8_900_000,
    liquidity: 0,
    endDate: '2024-07-01T23:59:59Z',
    imageUrl: 'https://picsum.photos/seed/poly2/200/200',
  },
  {
    slug: 'solana-etf-2025',
    title: 'Will a Solana ETF be approved in 2025?',
    category: 'Crypto',
    status: 'active',
    outcomePrices: { Yes: 0.38, No: 0.62 },
    volume: 1_200_000,
    liquidity: 320_000,
    endDate: '2025-12-31T23:59:59Z',
    imageUrl: 'https://picsum.photos/seed/poly3/200/200',
  },
  {
    slug: 'fed-rate-2025',
    title: 'Fed funds rate below 4% by end of 2025',
    category: 'Economics',
    status: 'active',
    outcomePrices: { Yes: 0.45, No: 0.55 },
    volume: 3_400_000,
    liquidity: 890_000,
    endDate: '2025-12-31T23:59:59Z',
    imageUrl: 'https://picsum.photos/seed/poly4/200/200',
  },
  {
    slug: 'ai-agi-2030',
    title: 'AGI achieved by 2030',
    category: 'Science',
    status: 'active',
    outcomePrices: { Yes: 0.12, No: 0.88 },
    volume: 950_000,
    liquidity: 200_000,
    endDate: '2030-12-31T23:59:59Z',
    imageUrl: 'https://picsum.photos/seed/poly5/200/200',
  },
];

export function handleGetPolymarketEvents() {
  return success(MOCK_POLYMARKET_EVENTS);
}

export function handleGetPolymarketEventBySlug(slug: string) {
  const event = MOCK_POLYMARKET_EVENTS.find((e) => e.slug === slug);
  return success(event ?? MOCK_POLYMARKET_EVENTS[0]);
}

// ── Graduation (pump.fun) ─────────────────────────────────────

const MOCK_GRADUATION_MARKETS = [
  {
    id: 'grad-1',
    mint: 'DfnxGQUsXdDH7DYdroeeSBG8etqTy1kufxBikHwTTGTa',
    name: 'OYRADE',
    symbol: 'OYR',
    imageUrl: 'https://picsum.photos/seed/grad1/200/200',
    price: 0.45,
    marketCap: 45_000_000,
    graduated: true,
    createdAt: '2024-11-01T00:00:00Z',
  },
  {
    id: 'grad-2',
    mint: 'mockMint2xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    name: 'PumpToken',
    symbol: 'PUMP',
    imageUrl: 'https://picsum.photos/seed/grad2/200/200',
    price: 0.002,
    marketCap: 200_000,
    graduated: false,
    createdAt: '2024-12-15T00:00:00Z',
  },
  {
    id: 'grad-3',
    mint: 'mockMint3xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    name: 'MoonShot',
    symbol: 'MOON',
    imageUrl: 'https://picsum.photos/seed/grad3/200/200',
    price: 0.015,
    marketCap: 1_500_000,
    graduated: true,
    createdAt: '2024-12-20T00:00:00Z',
  },
];

const MOCK_TRENDING_TOKENS = [
  { mint: 'trend1xxxx', name: 'TrendingAlpha', symbol: 'TALPHA', price: 0.12, change24h: 45.6, volume24h: 890_000 },
  { mint: 'trend2xxxx', name: 'HypeToken', symbol: 'HYPE', price: 0.034, change24h: 120.3, volume24h: 2_300_000 },
  { mint: 'trend3xxxx', name: 'RocketFi', symbol: 'ROCK', price: 0.0089, change24h: -12.5, volume24h: 450_000 },
  { mint: 'trend4xxxx', name: 'DegenCoin', symbol: 'DEGEN', price: 0.00023, change24h: 340.0, volume24h: 5_600_000 },
  { mint: 'trend5xxxx', name: 'BasedDAO', symbol: 'BASED', price: 0.067, change24h: 8.9, volume24h: 1_100_000 },
];

export function handleGetGraduationMarkets() {
  return success(MOCK_GRADUATION_MARKETS);
}

export function handleGetTrending() {
  return success(MOCK_TRENDING_TOKENS);
}

export function handleGetTokenDetail(mint: string) {
  const token = MOCK_GRADUATION_MARKETS.find((m) => m.mint === mint);
  return success(
    token ?? {
      mint,
      name: 'Unknown Token',
      symbol: '???',
      price: 0,
      marketCap: 0,
      graduated: false,
      createdAt: new Date().toISOString(),
    },
  );
}
