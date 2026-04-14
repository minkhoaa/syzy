/**
 * Mock content data: blog posts, articles, and comments.
 */

import { MOCK_MARKETS } from './markets';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MockBlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  authorWallet: string;
  publishedAt: string;
  coverImage: string;
  featured: boolean;
  tags: string[];
}

export interface MockArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  publishedAt: string;
  coverImage: string;
  featured: boolean;
  relatedMarketSlug: string | null;
}

export interface MockComment {
  id: string;
  marketId: string;
  userId: string;
  walletAddress: string;
  content: string;
  createdAt: string;
  parentId: string | null;
  likes: number;
}

// ---------------------------------------------------------------------------
// Blog Posts
// ---------------------------------------------------------------------------

export const MOCK_BLOG_POSTS: MockBlogPost[] = [
  {
    id: 'blog-1',
    title: 'Introducing Syzy: Decentralized Prediction Markets on Solana',
    slug: 'introducing-oyrade',
    content: `# Introducing Syzy

Prediction markets have long been one of the most powerful tools for aggregating collective intelligence. With Syzy, we bring this power to the Solana blockchain, combining the speed and low fees of Solana with the transparency and censorship resistance of decentralized infrastructure.

## What Makes Syzy Different?

### Zero-Knowledge Privacy
Unlike other prediction markets, Syzy offers **shielded trading** powered by ZK-SNARKs (Groth16 proofs). Your positions, trade sizes, and strategies remain private while still being verifiable on-chain.

### Conditional Token Framework
Our v1 markets use a proper Conditional Token Framework where \`1 YES + 1 NO = 1 SOL\`. This means fixed face-value payouts, eliminating the dilution problems found in parimutuel models.

### Multi-Outcome Events (NegRisk)
With Market Groups and NegRisk conversion, we support complex multi-outcome events like elections and tournaments, where probabilities across all outcomes must sum to 100%.

## Getting Started

1. Connect your Solana wallet (Phantom or Solflare)
2. Browse active markets or create your own
3. Trade YES or NO tokens based on your predictions
4. Claim winnings when markets resolve

Stay tuned for more updates as we roll out new features.`,
    excerpt:
      'Prediction markets meet Solana speed, ZK privacy, and the Conditional Token Framework.',
    author: 'Syzy Team',
    authorWallet: '4RQ8yjeGKNTfUTBZt3vHUPFiqzSygq6rXFNkFoGmuDrQ',
    publishedAt: '2026-03-15T10:00:00Z',
    coverImage: 'https://picsum.photos/seed/introducing-oyrade/1200/630',
    featured: true,
    tags: ['announcement', 'solana', 'prediction-markets'],
  },
  {
    id: 'blog-2',
    title: 'Understanding ZK-Shielded Trading',
    slug: 'understanding-zk-shielded-trading',
    content: `# Understanding ZK-Shielded Trading

Privacy in prediction markets matters. When whales move into a position, it can shift the market before they finish building their position. Syzy's shielded pools solve this.

## How It Works

1. **Shield** your SOL into the shielded pool, receiving an encrypted note commitment
2. **Private Swap** — trade within the pool without revealing your position or size
3. **Unshield** — withdraw your tokens back to your wallet

All operations generate Groth16 ZK proofs that verify correctness without revealing transaction details. The on-chain program verifies these proofs using embedded verification keys.

## The Tech Stack

- **Circom 2.1.4** for circuit definitions
- **Groth16** proving system on BN254 curve
- **Poseidon** hash function for commitments and Merkle trees
- **MMR (Merkle Mountain Range)** for efficient batch processing
- **TEE batch service** for aggregating operations

## When to Use Shielded Trading

Shielded trading is ideal for:
- Large positions where front-running is a concern
- Strategic trading where hiding your thesis matters
- Any situation where privacy adds value`,
    excerpt:
      'How Syzy uses Groth16 proofs and Poseidon hashing to enable private prediction market trading.',
    author: 'Syzy Team',
    authorWallet: '4RQ8yjeGKNTfUTBZt3vHUPFiqzSygq6rXFNkFoGmuDrQ',
    publishedAt: '2026-03-22T14:00:00Z',
    coverImage: 'https://picsum.photos/seed/zk-shielded-trading/1200/630',
    featured: false,
    tags: ['zk', 'privacy', 'tutorial'],
  },
  {
    id: 'blog-3',
    title: 'Market Groups and NegRisk: Multi-Outcome Predictions',
    slug: 'market-groups-negrisk',
    content: `# Market Groups and NegRisk

Not every question has a simple yes/no answer. "Who will win the 2028 presidential election?" has multiple possible outcomes. Syzy's Market Groups handle this elegantly.

## How Market Groups Work

A Market Group bundles multiple binary (YES/NO) markets under a single event. For example, "Who wins?" could have sub-markets for each candidate:
- "DeSantis wins?" (YES/NO)
- "Newsom wins?" (YES/NO)
- "Vance wins?" (YES/NO)

## NegRisk Conversion

The key insight: if you hold NO tokens across all candidates except one, that is equivalent to holding YES on that one candidate. NegRisk conversion enables:

\`\`\`
Burn NO on markets A, B → Get YES on market C + SOL refund
\`\`\`

This keeps probabilities consistent and enables efficient portfolio management.

## Creating Event Groups

Admins can create Market Groups, add individual binary markets, and initialize the NegRisk configuration. Once locked, the group's composition is fixed.`,
    excerpt:
      'How Syzy supports multi-outcome events with Market Groups and NegRisk portfolio conversion.',
    author: 'Syzy Team',
    authorWallet: '4RQ8yjeGKNTfUTBZt3vHUPFiqzSygq6rXFNkFoGmuDrQ',
    publishedAt: '2026-04-01T09:00:00Z',
    coverImage: 'https://picsum.photos/seed/market-groups-negrisk/1200/630',
    featured: false,
    tags: ['negrisk', 'multi-outcome', 'tutorial'],
  },
];

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

export const MOCK_ARTICLES: MockArticle[] = [
  {
    id: 'article-1',
    title: 'Bitcoin Bull Case: Why $150K Is Within Reach',
    slug: 'bitcoin-bull-case-150k',
    content: `Institutional adoption, the halving cycle, and macro tailwinds converge to make the case for Bitcoin at $150,000 by end of 2026. ETF inflows remain strong, and on-chain metrics suggest accumulation by long-term holders.

Key catalysts include potential Fed rate cuts, continued adoption in emerging markets, and the 2024 halving reducing supply issuance by 50%.`,
    excerpt:
      'Institutional adoption and macro tailwinds make the case for $150K BTC.',
    author: 'Research Desk',
    publishedAt: '2026-03-28T11:00:00Z',
    coverImage: 'https://picsum.photos/seed/btc-bull-case/1200/630',
    featured: true,
    relatedMarketSlug: 'btc-150k-dec-2026',
  },
  {
    id: 'article-2',
    title: 'Solana L1 Performance: State of the Network Q1 2026',
    slug: 'solana-network-q1-2026',
    content: `Solana processed an average of 4,200 TPS in Q1 2026, with peak throughput hitting 65,000 TPS during a DeFi event. Network uptime was 99.95% for the quarter. The Firedancer client is now running on 15% of validators, improving decentralization and resilience.

Total value locked in Solana DeFi grew 340% YoY, driven by Jupiter, Drift, and prediction market platforms.`,
    excerpt:
      'Q1 2026 network stats show Solana averaging 4,200 TPS with 99.95% uptime.',
    author: 'Research Desk',
    publishedAt: '2026-04-02T08:30:00Z',
    coverImage: 'https://picsum.photos/seed/solana-q1-2026/1200/630',
    featured: false,
    relatedMarketSlug: 'sol-300-q3-2026',
  },
  {
    id: 'article-3',
    title: 'AI and Standardized Testing: The Bar Exam Milestone',
    slug: 'ai-bar-exam-milestone',
    content: `In a landmark achievement, a multimodal AI system scored 99.2% on the Uniform Bar Examination in February 2026, surpassing human performance across all sections. Legal professionals debate the implications for the profession.

The result settled the "AI passes bar exam with 99%" prediction market on Syzy with a YES outcome, paying out 890 SOL in total to winning token holders.`,
    excerpt:
      'AI scores 99.2% on the bar exam, settling an 890 SOL prediction market.',
    author: 'Research Desk',
    publishedAt: '2026-04-03T16:00:00Z',
    coverImage: 'https://picsum.photos/seed/ai-bar-exam/1200/630',
    featured: false,
    relatedMarketSlug: 'ai-passes-bar-exam-99',
  },
];

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export const MOCK_COMMENTS: MockComment[] = [
  {
    id: 'comment-1',
    marketId: MOCK_MARKETS[0].publicKey, // BTC $150K
    userId: 'user-alpha',
    walletAddress: '3Xp7RqYz1mN2oBcDeFgH1jK2LmN3oPqRsT4uVwXyZ5a',
    content:
      'The ETF inflows this month have been insane. $150K feels like a matter of time at this pace.',
    createdAt: '2026-04-04T14:23:00Z',
    parentId: null,
    likes: 12,
  },
  {
    id: 'comment-2',
    marketId: MOCK_MARKETS[0].publicKey, // BTC $150K
    userId: 'user-beta',
    walletAddress: '8Yq4RsTu5VwXyZ6aBcDeFgH1jK2LmN3oPqRsT4uVwXy',
    content:
      'Be cautious — the last time everyone was this bullish, we saw a 30% correction. I am hedging with NO tokens on the 2026 target.',
    createdAt: '2026-04-04T15:10:00Z',
    parentId: 'comment-1',
    likes: 5,
  },
  {
    id: 'comment-3',
    marketId: MOCK_MARKETS[5].publicKey, // Fed rate cut
    userId: 'user-gamma',
    walletAddress: '2Zr5sTu6VwXyZ7bCdEfGh1jK2LmN3oPqRsT4uVwXyZa',
    content:
      'CPI data came in cooler than expected. The September cut is looking very likely now. Loaded up on YES.',
    createdAt: '2026-04-05T09:45:00Z',
    parentId: null,
    likes: 8,
  },
  {
    id: 'comment-4',
    marketId: MOCK_MARKETS[8].publicKey, // AI bar exam (resolved)
    userId: 'user-alpha',
    walletAddress: '3Xp7RqYz1mN2oBcDeFgH1jK2LmN3oPqRsT4uVwXyZ5a',
    content:
      'Claimed my winnings! The AI model was GPT-6 variant and scored 99.2%. Easy call in hindsight.',
    createdAt: '2026-04-01T20:00:00Z',
    parentId: null,
    likes: 15,
  },
  {
    id: 'comment-5',
    marketId: MOCK_MARKETS[3].publicKey, // TRUMP token
    userId: 'user-delta',
    walletAddress: '4As6tUv7WxYz8CdEfGh1jK2LmN3oPqRsT4uVwXyZaB',
    content:
      'This market ends in 3 days and TRUMP is at $38. The $50 target seems unlikely unless there is a massive catalyst.',
    createdAt: '2026-04-06T08:15:00Z',
    parentId: null,
    likes: 3,
  },
];
