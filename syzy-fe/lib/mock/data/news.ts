/**
 * Mock news items for the Syzy mock frontend.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MockNewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  relatedTokens: string[];
  imageUrl?: string;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

export const MOCK_NEWS: MockNewsItem[] = [
  {
    id: 'news-1',
    title: 'Bitcoin Breaks $120K as Institutional Demand Surges Post-Halving',
    source: 'CoinDesk',
    url: 'https://coindesk.com/markets/bitcoin-120k-institutional-demand',
    publishedAt: '2026-04-06T07:30:00Z',
    sentiment: 'positive',
    relatedTokens: ['BTC', 'bitcoin'],
    imageUrl: 'https://picsum.photos/seed/news-btc-120k/600/400',
  },
  {
    id: 'news-2',
    title: 'Solana DeFi TVL Hits All-Time High at $28 Billion',
    source: 'The Block',
    url: 'https://theblock.co/post/solana-defi-tvl-ath-28b',
    publishedAt: '2026-04-05T15:00:00Z',
    sentiment: 'positive',
    relatedTokens: ['SOL', 'solana'],
    imageUrl: 'https://picsum.photos/seed/news-sol-tvl/600/400',
  },
  {
    id: 'news-3',
    title: 'SEC Signals Willingness to Approve Solana ETF Applications',
    source: 'Bloomberg',
    url: 'https://bloomberg.com/crypto/sec-solana-etf-approval-signals',
    publishedAt: '2026-04-05T11:20:00Z',
    sentiment: 'positive',
    relatedTokens: ['SOL', 'solana'],
    imageUrl: 'https://picsum.photos/seed/news-sol-etf/600/400',
  },
  {
    id: 'news-4',
    title: 'Federal Reserve Minutes Hint at September Rate Cut',
    source: 'Reuters',
    url: 'https://reuters.com/markets/fed-minutes-september-rate-cut-hints',
    publishedAt: '2026-04-04T19:45:00Z',
    sentiment: 'positive',
    relatedTokens: ['BTC', 'ETH', 'macro'],
    imageUrl: 'https://picsum.photos/seed/news-fed-rates/600/400',
  },
  {
    id: 'news-5',
    title:
      'Ethereum L2 Ecosystem Crosses $85B TVL, Base and Arbitrum Lead Growth',
    source: 'Decrypt',
    url: 'https://decrypt.co/ethereum-l2-85b-tvl-base-arbitrum',
    publishedAt: '2026-04-04T13:00:00Z',
    sentiment: 'positive',
    relatedTokens: ['ETH', 'ethereum', 'ARB'],
    imageUrl: 'https://picsum.photos/seed/news-eth-l2/600/400',
  },
  {
    id: 'news-6',
    title: 'BONK Foundation Burns 5 Trillion Tokens in Record Deflationary Move',
    source: 'CryptoPanic',
    url: 'https://cryptopanic.com/news/bonk-foundation-5t-token-burn',
    publishedAt: '2026-04-03T22:15:00Z',
    sentiment: 'neutral',
    relatedTokens: ['BONK', 'meme'],
    imageUrl: 'https://picsum.photos/seed/news-bonk-burn/600/400',
  },
  {
    id: 'news-7',
    title:
      'Prediction Markets Gain Regulatory Clarity as CFTC Finalizes Framework',
    source: 'CoinTelegraph',
    url: 'https://cointelegraph.com/news/cftc-prediction-market-framework',
    publishedAt: '2026-04-03T10:30:00Z',
    sentiment: 'positive',
    relatedTokens: ['prediction-markets', 'regulation'],
    imageUrl: 'https://picsum.photos/seed/news-cftc-pm/600/400',
  },
  {
    id: 'news-8',
    title: 'SpaceX Starship Test Flight Delayed to Q3; Mars Timeline Uncertain',
    source: 'TechCrunch',
    url: 'https://techcrunch.com/spacex-starship-delay-q3-mars-timeline',
    publishedAt: '2026-04-02T16:00:00Z',
    sentiment: 'negative',
    relatedTokens: ['spacex', 'science'],
    imageUrl: 'https://picsum.photos/seed/news-spacex-delay/600/400',
  },
];
