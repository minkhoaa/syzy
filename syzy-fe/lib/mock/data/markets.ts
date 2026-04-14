/**
 * Mock prediction market data for the Syzy mock frontend.
 *
 * Reserve math (constant-product AMM, v0):
 *   yesPrice = realYesSolReserves / realYesTokenReserves
 *   noPrice  = realNoSolReserves  / realNoTokenReserves
 *   YES%     = yesPrice / (yesPrice + noPrice) * 100
 *
 * All SOL amounts are in lamports (1 SOL = 1_000_000_000).
 * Token amounts use TOKEN_MULTIPLIER = 1_000_000 where noted.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const MOCK_TEAM_WALLET = '4RQ8yjeGKNTfUTBZt3vHUPFiqzSygq6rXFNkFoGmuDrQ';
export const MOCK_WALLET_ADDRESS =
  'DemoWa11et7777777777777777777777777777777777';

const LAMPORTS_PER_SOL = 1_000_000_000;

// Helpers
const sol = (n: number) => Math.round(n * LAMPORTS_PER_SOL);
const now = Math.floor(Date.now() / 1000);
const days = (d: number) => d * 86_400;

// ---------------------------------------------------------------------------
// Mock public keys (realistic-looking base58)
// ---------------------------------------------------------------------------

const keys = {
  creator: '7Xg9hFqKmZuE4Yq2bCdnh8R3aT5kNPJ1wVmQ6Fs9D2p',
  // Market public keys
  m1: '5aBcDeFgH1jK2LmN3oPqRsT4uVwXyZ5aBcDeFgH1jK2',
  m2: '6cDeFgH1jK2LmN3oPqRsT4uVwXyZ5aBcDeFgH1jK2Lm',
  m3: '7eFgH1jK2LmN3oPqRsT4uVwXyZ5aBcDeFgH1jK2LmN3',
  m4: '8gH1jK2LmN3oPqRsT4uVwXyZ5aBcDeFgH1jK2LmN3oP',
  m5: '9H1jK2LmN3oPqRsT4uVwXyZ5aBcDeFgH1jK2LmN3oPq',
  m6: 'AjK2LmN3oPqRsT4uVwXyZ5aBcDeFgH1jK2LmN3oPqRs',
  m7: 'BK2LmN3oPqRsT4uVwXyZ5aBcDeFgH1jK2LmN3oPqRsT',
  m8: 'CLmN3oPqRsT4uVwXyZ5aBcDeFgH1jK2LmN3oPqRsT4u',
  m9: 'DmN3oPqRsT4uVwXyZ5aBcDeFgH1jK2LmN3oPqRsT4uV',
  m10: 'EN3oPqRsT4uVwXyZ5aBcDeFgH1jK2LmN3oPqRsT4uVw',
  // Group parent markets
  m11: 'FoPqRsT4uVwXyZ5aBcDeFgH1jK2LmN3oPqRsT4uVwXy',
  m12: 'GPqRsT4uVwXyZ5aBcDeFgH1jK2LmN3oPqRsT4uVwXyZ',
  // Group sub-markets
  m11a: 'HqRsT4uVwXyZ5aBcDeFgH1jK2LmN3oPqRsT4uVwXy1',
  m11b: 'JRsT4uVwXyZ5aBcDeFgH1jK2LmN3oPqRsT4uVwXy12',
  m11c: 'KsT4uVwXyZ5aBcDeFgH1jK2LmN3oPqRsT4uVwXy123',
  m11d: 'LT4uVwXyZ5aBcDeFgH1jK2LmN3oPqRsT4uVwXy1234',
  m12a: 'MT4uVwXyZ5aBcDeFgH1jK2LmN3oPqRsT4uVwXyZABC',
  m12b: 'NT4uVwXyZ5aBcDeFgH1jK2LmN3oPqRsT4uVwXyZDEF',
  m12c: 'PT4uVwXyZ5aBcDeFgH1jK2LmN3oPqRsT4uVwXyZGHJ',
  // Token mints (yes/no pairs)
  y1: 'YeS1AbCdEfGh1jK2LmN3oPqRsT4uVwXyZ5aBcDeFgH',
  n1: 'No1AbCdEfGh1jK2LmN3oPqRsT4uVwXyZ5aBcDeFgHi',
  y2: 'YeS2BcDeFgH1jK2LmN3oPqRsT4uVwXyZ5aBcDeFgHi',
  n2: 'No2BcDeFgH1jK2LmN3oPqRsT4uVwXyZ5aBcDeFgHij',
  y3: 'YeS3CdEfGh1jK2LmN3oPqRsT4uVwXyZ5aBcDeFgHij',
  n3: 'No3CdEfGh1jK2LmN3oPqRsT4uVwXyZ5aBcDeFgHijk',
  y4: 'YeS4DeFgH1jK2LmN3oPqRsT4uVwXyZ5aBcDeFgHijk',
  n4: 'No4DeFgH1jK2LmN3oPqRsT4uVwXyZ5aBcDeFgHijkl',
  y5: 'YeS5EfGh1jK2LmN3oPqRsT4uVwXyZ5aBcDeFgHijkl',
  n5: 'No5EfGh1jK2LmN3oPqRsT4uVwXyZ5aBcDeFgHijklm',
  y6: 'YeS6FgH1jK2LmN3oPqRsT4uVwXyZ5aBcDeFgHijklm',
  n6: 'No6FgH1jK2LmN3oPqRsT4uVwXyZ5aBcDeFgHijklmn',
  y7: 'YeS7GhJK2LmN3oPqRsT4uVwXyZ5aBcDeFgHijklmno',
  n7: 'No7GhJK2LmN3oPqRsT4uVwXyZ5aBcDeFgHijklmnop',
  y8: 'YeS8HjK2LmN3oPqRsT4uVwXyZ5aBcDeFgHijklmnopq',
  n8: 'No8HjK2LmN3oPqRsT4uVwXyZ5aBcDeFgHijklmnopqr',
  y9: 'YeS9JK2LmN3oPqRsT4uVwXyZ5aBcDeFgHijklmnopqr',
  n9: 'No9JK2LmN3oPqRsT4uVwXyZ5aBcDeFgHijklmnopqrs',
  y10: 'YeSaK2LmN3oPqRsT4uVwXyZ5aBcDeFgHijklmnopqrs',
  n10: 'NoaK2LmN3oPqRsT4uVwXyZ5aBcDeFgHijklmnopqrst',
  // Group sub-market mints
  y11a: 'YeSbL2LmN3oPqRsT4uVwXyZ5aBcDeFgHijklmnopq1',
  n11a: 'NobL2LmN3oPqRsT4uVwXyZ5aBcDeFgHijklmnopq12',
  y11b: 'YeScM2LmN3oPqRsT4uVwXyZ5aBcDeFgHijklmnopq2',
  n11b: 'NocM2LmN3oPqRsT4uVwXyZ5aBcDeFgHijklmnopq23',
  y11c: 'YeSdN2LmN3oPqRsT4uVwXyZ5aBcDeFgHijklmnopq3',
  n11c: 'NodN2LmN3oPqRsT4uVwXyZ5aBcDeFgHijklmnopq34',
  y11d: 'YeSeP2LmN3oPqRsT4uVwXyZ5aBcDeFgHijklmnopq4',
  n11d: 'NoeP2LmN3oPqRsT4uVwXyZ5aBcDeFgHijklmnopq45',
  y12a: 'YeSfQ2LmN3oPqRsT4uVwXyZ5aBcDeFgHijklmnopq5',
  n12a: 'NofQ2LmN3oPqRsT4uVwXyZ5aBcDeFgHijklmnopq56',
  y12b: 'YeSgR2LmN3oPqRsT4uVwXyZ5aBcDeFgHijklmnopq6',
  n12b: 'NogR2LmN3oPqRsT4uVwXyZ5aBcDeFgHijklmnopq67',
  y12c: 'YeShS2LmN3oPqRsT4uVwXyZ5aBcDeFgHijklmnopq7',
  n12c: 'NohS2LmN3oPqRsT4uVwXyZ5aBcDeFgHijklmnopq78',
  // LP addresses
  lp1: 'LPa1bCdEfGh1jK2LmN3oPqRsT4uVwXyZ5aBcDeFgHi',
  lp2: 'LPb2CdEfGh1jK2LmN3oPqRsT4uVwXyZ5aBcDeFgHij',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MockLp {
  lpAddress: string;
  amount: number;
}

export interface MockMarket {
  publicKey: string;
  marketName: string;
  question: string;
  slug: string;
  imageUrl: string;
  source: string;
  category: string;
  creator: string;
  yesTokenMint: string;
  noTokenMint: string;
  realYesTokenReserves: number;
  realYesSolReserves: number;
  realNoTokenReserves: number;
  realNoSolReserves: number;
  initialYesTokenReserves: number;
  initialNoTokenReserves: number;
  tokenYesTotalSupply: number;
  tokenNoTotalSupply: number;
  totalLpAmount: number;
  isCompleted: boolean;
  winningOutcome: number | null;
  startDate: number;
  endDate: number;
  startSlot: number | null;
  endingSlot: number | null;
  oracleFeed: string | null;
  priceTarget: number | null;
  comparisonType: number | null;
  metricType: number | null;
  oracleResolutionFinished: boolean;
  resolvedAt: number | null;
  resolvedBy: number | null;
  lps: MockLp[];
}

export interface MockMarketGroupSubMarket {
  publicKey: string;
  label: string;
  slug: string;
  yesPercent: number;
  yesTokenMint: string;
  noTokenMint: string;
}

export interface MockMarketGroup {
  publicKey: string;
  groupName: string;
  question: string;
  slug: string;
  imageUrl: string;
  source: string;
  category: string;
  creator: string;
  isNegRisk: boolean;
  isLocked: boolean;
  startDate: number;
  endDate: number;
  totalVolume: number;
  subMarkets: MockMarketGroupSubMarket[];
}

// ---------------------------------------------------------------------------
// Reserve calculator
// ---------------------------------------------------------------------------

/**
 * Given a target YES percentage and total SOL liquidity, compute reserves
 * such that: YES% = yesSolRes / yesTokenRes / (yesSolRes/yesTokenRes + noSolRes/noTokenRes)
 *
 * We set token reserves equal across both sides (constant product AMM),
 * and adjust SOL reserves to produce the target probability.
 *
 * yesPrice = yesSol / yesTokens, noPrice = noSol / noTokens
 * If yesTokens == noTokens == T, then YES% = yesSol / (yesSol + noSol)
 * => yesSol = totalSol * yesPercent, noSol = totalSol * (1 - yesPercent)
 */
function makeReserves(
  totalSolAmount: number,
  yesPct: number,
) {
  const totalSol = sol(totalSolAmount);
  const yesSol = Math.round(totalSol * (yesPct / 100));
  const noSol = totalSol - yesSol;
  // Token reserves proportional to SOL — keep tokens at 10x SOL per unit
  // (i.e. price per token is ~0.1 SOL). This is arbitrary but realistic.
  const tokenBase = Math.round(totalSolAmount * 10_000_000);
  return {
    realYesSolReserves: yesSol,
    realNoSolReserves: noSol,
    realYesTokenReserves: tokenBase,
    realNoTokenReserves: tokenBase,
    initialYesTokenReserves: tokenBase,
    initialNoTokenReserves: tokenBase,
    tokenYesTotalSupply: Math.round(tokenBase * 1.5),
    tokenNoTotalSupply: Math.round(tokenBase * 1.5),
    totalLpAmount: sol(totalSolAmount * 0.3),
  };
}

// ---------------------------------------------------------------------------
// Markets
// ---------------------------------------------------------------------------

export const MOCK_MARKETS: MockMarket[] = [
  // 1 — BTC $150K — Crypto, Active, YES 62%, 245 SOL
  {
    publicKey: keys.m1,
    marketName: 'BTC $150K by Dec 2026',
    question: 'Will BTC reach $150K by Dec 2026?',
    slug: 'btc-150k-dec-2026',
    imageUrl: 'https://picsum.photos/seed/btc-150k-dec-2026/400/400',
    source: 'crypto',
    category: 'Crypto',
    creator: keys.creator,
    yesTokenMint: keys.y1,
    noTokenMint: keys.n1,
    ...makeReserves(245, 62),
    isCompleted: false,
    winningOutcome: null,
    startDate: now - days(30),
    endDate: now + days(270),
    startSlot: 280_000_000,
    endingSlot: null,
    oracleFeed: 'GVXRSBjFk6e6J3NbVPXbvNmhbPLQwGR8FNsMd8az7Tdg',
    priceTarget: 150_000_00000000_00000000, // 150,000 * 10^18
    comparisonType: 0, // GT
    metricType: 0,
    oracleResolutionFinished: false,
    resolvedAt: null,
    resolvedBy: null,
    lps: [
      { lpAddress: keys.lp1, amount: sol(73.5) },
      { lpAddress: keys.lp2, amount: sol(49) },
    ],
  },
  // 2 — SOL $300 — Crypto, Active, YES 45%, 180 SOL
  {
    publicKey: keys.m2,
    marketName: 'SOL above $300 by Q3 2026',
    question: 'SOL above $300 by Q3 2026?',
    slug: 'sol-300-q3-2026',
    imageUrl: 'https://picsum.photos/seed/sol-300-q3-2026/400/400',
    source: 'crypto',
    category: 'Crypto',
    creator: keys.creator,
    yesTokenMint: keys.y2,
    noTokenMint: keys.n2,
    ...makeReserves(180, 45),
    isCompleted: false,
    winningOutcome: null,
    startDate: now - days(14),
    endDate: now + days(120),
    startSlot: 282_000_000,
    endingSlot: null,
    oracleFeed: 'FqmGu8dvpR2Y7jNauDftGUAEEFkRTqJKQEHoKBbP5Nww',
    priceTarget: 300_00000000_00000000, // 300 * 10^18
    comparisonType: 0,
    metricType: 0,
    oracleResolutionFinished: false,
    resolvedAt: null,
    resolvedBy: null,
    lps: [{ lpAddress: keys.lp1, amount: sol(54) }],
  },
  // 3 — ETH flippening — Crypto, Active, YES 12%, 89 SOL
  {
    publicKey: keys.m3,
    marketName: 'ETH Flips BTC Market Cap',
    question: 'Will ETH flip BTC market cap?',
    slug: 'eth-flips-btc-market-cap',
    imageUrl: 'https://picsum.photos/seed/eth-flips-btc-market-cap/400/400',
    source: 'crypto',
    category: 'Crypto',
    creator: keys.creator,
    yesTokenMint: keys.y3,
    noTokenMint: keys.n3,
    ...makeReserves(89, 12),
    isCompleted: false,
    winningOutcome: null,
    startDate: now - days(45),
    endDate: now + days(365),
    startSlot: 275_000_000,
    endingSlot: null,
    oracleFeed: null,
    priceTarget: null,
    comparisonType: null,
    metricType: null,
    oracleResolutionFinished: false,
    resolvedAt: null,
    resolvedBy: null,
    lps: [{ lpAddress: keys.lp2, amount: sol(26.7) }],
  },
  // 4 — TRUMP token — Meme, Ending Soon (endDate = now + 3 days), YES 35%, 520 SOL
  {
    publicKey: keys.m4,
    marketName: 'TRUMP Token above $50 by July',
    question: 'TRUMP token above $50 by July?',
    slug: 'trump-token-50-july',
    imageUrl: 'https://picsum.photos/seed/trump-token-50-july/400/400',
    source: 'meme',
    category: 'Meme',
    creator: keys.creator,
    yesTokenMint: keys.y4,
    noTokenMint: keys.n4,
    ...makeReserves(520, 35),
    isCompleted: false,
    winningOutcome: null,
    startDate: now - days(60),
    endDate: now + days(3),
    startSlot: 268_000_000,
    endingSlot: null,
    oracleFeed: null,
    priceTarget: null,
    comparisonType: null,
    metricType: null,
    oracleResolutionFinished: false,
    resolvedAt: null,
    resolvedBy: null,
    lps: [
      { lpAddress: keys.lp1, amount: sol(104) },
      { lpAddress: keys.lp2, amount: sol(52) },
    ],
  },
  // 5 — BONK $0.001 — Meme, Active, YES 28%, 67 SOL
  {
    publicKey: keys.m5,
    marketName: 'BONK Reaches $0.001',
    question: 'Will BONK reach $0.001?',
    slug: 'bonk-reaches-0001',
    imageUrl: 'https://picsum.photos/seed/bonk-reaches-0001/400/400',
    source: 'meme',
    category: 'Meme',
    creator: keys.creator,
    yesTokenMint: keys.y5,
    noTokenMint: keys.n5,
    ...makeReserves(67, 28),
    isCompleted: false,
    winningOutcome: null,
    startDate: now - days(20),
    endDate: now + days(200),
    startSlot: 280_500_000,
    endingSlot: null,
    oracleFeed: null,
    priceTarget: null,
    comparisonType: null,
    metricType: null,
    oracleResolutionFinished: false,
    resolvedAt: null,
    resolvedBy: null,
    lps: [{ lpAddress: keys.lp1, amount: sol(20.1) }],
  },
  // 6 — Fed rate cut — Politics, Active, YES 71%, 312 SOL
  {
    publicKey: keys.m6,
    marketName: 'US Fed Rate Cut Before Sept 2026',
    question: 'US Fed rate cut before Sept 2026?',
    slug: 'fed-rate-cut-sept-2026',
    imageUrl: 'https://picsum.photos/seed/fed-rate-cut-sept-2026/400/400',
    source: 'politics',
    category: 'Politics',
    creator: keys.creator,
    yesTokenMint: keys.y6,
    noTokenMint: keys.n6,
    ...makeReserves(312, 71),
    isCompleted: false,
    winningOutcome: null,
    startDate: now - days(50),
    endDate: now + days(150),
    startSlot: 270_000_000,
    endingSlot: null,
    oracleFeed: null,
    priceTarget: null,
    comparisonType: null,
    metricType: null,
    oracleResolutionFinished: false,
    resolvedAt: null,
    resolvedBy: null,
    lps: [
      { lpAddress: keys.lp1, amount: sol(62.4) },
      { lpAddress: keys.lp2, amount: sol(31.2) },
    ],
  },
  // 7 — SpaceX Mars — Science, Active, YES 8%, 45 SOL
  {
    publicKey: keys.m7,
    marketName: 'SpaceX Lands on Mars by 2028',
    question: 'Will SpaceX land on Mars by 2028?',
    slug: 'spacex-mars-2028',
    imageUrl: 'https://picsum.photos/seed/spacex-mars-2028/400/400',
    source: 'science',
    category: 'Science',
    creator: keys.creator,
    yesTokenMint: keys.y7,
    noTokenMint: keys.n7,
    ...makeReserves(45, 8),
    isCompleted: false,
    winningOutcome: null,
    startDate: now - days(90),
    endDate: now + days(730),
    startSlot: 260_000_000,
    endingSlot: null,
    oracleFeed: null,
    priceTarget: null,
    comparisonType: null,
    metricType: null,
    oracleResolutionFinished: false,
    resolvedAt: null,
    resolvedBy: null,
    lps: [{ lpAddress: keys.lp2, amount: sol(13.5) }],
  },
  // 8 — Lakers NBA — Sports, Active, YES 15%, 156 SOL
  {
    publicKey: keys.m8,
    marketName: 'Lakers Win NBA Championship 2027',
    question: 'Lakers win NBA Championship 2027?',
    slug: 'lakers-nba-championship-2027',
    imageUrl: 'https://picsum.photos/seed/lakers-nba-championship-2027/400/400',
    source: 'sports',
    category: 'Sports',
    creator: keys.creator,
    yesTokenMint: keys.y8,
    noTokenMint: keys.n8,
    ...makeReserves(156, 15),
    isCompleted: false,
    winningOutcome: null,
    startDate: now - days(10),
    endDate: now + days(450),
    startSlot: 283_000_000,
    endingSlot: null,
    oracleFeed: null,
    priceTarget: null,
    comparisonType: null,
    metricType: null,
    oracleResolutionFinished: false,
    resolvedAt: null,
    resolvedBy: null,
    lps: [{ lpAddress: keys.lp1, amount: sol(46.8) }],
  },
  // 9 — AI bar exam — Tech, RESOLVED (YES won), YES 100%, 890 SOL
  {
    publicKey: keys.m9,
    marketName: 'AI Passes Bar Exam with 99%',
    question: 'Will AI pass the bar exam with 99%?',
    slug: 'ai-passes-bar-exam-99',
    imageUrl: 'https://picsum.photos/seed/ai-passes-bar-exam-99/400/400',
    source: 'tech',
    category: 'Tech',
    creator: keys.creator,
    yesTokenMint: keys.y9,
    noTokenMint: keys.n9,
    ...makeReserves(890, 100),
    isCompleted: true,
    winningOutcome: 0, // YES
    startDate: now - days(120),
    endDate: now - days(5),
    startSlot: 250_000_000,
    endingSlot: 284_000_000,
    oracleFeed: null,
    priceTarget: null,
    comparisonType: null,
    metricType: null,
    oracleResolutionFinished: true,
    resolvedAt: now - days(5),
    resolvedBy: 0, // admin
    lps: [
      { lpAddress: keys.lp1, amount: sol(178) },
      { lpAddress: keys.lp2, amount: sol(89) },
    ],
  },
  // 10 — ETH L2 TVL — Crypto, Active, YES 55%, 234 SOL
  {
    publicKey: keys.m10,
    marketName: 'Ethereum L2 TVL > $100B by EOY',
    question: 'Ethereum L2 TVL > $100B by EOY?',
    slug: 'eth-l2-tvl-100b-eoy',
    imageUrl: 'https://picsum.photos/seed/eth-l2-tvl-100b-eoy/400/400',
    source: 'crypto',
    category: 'Crypto',
    creator: keys.creator,
    yesTokenMint: keys.y10,
    noTokenMint: keys.n10,
    ...makeReserves(234, 55),
    isCompleted: false,
    winningOutcome: null,
    startDate: now - days(25),
    endDate: now + days(270),
    startSlot: 281_000_000,
    endingSlot: null,
    oracleFeed: null,
    priceTarget: null,
    comparisonType: null,
    metricType: null,
    oracleResolutionFinished: false,
    resolvedAt: null,
    resolvedBy: null,
    lps: [{ lpAddress: keys.lp1, amount: sol(70.2) }],
  },
  // 11 — 2028 US Election (group parent — placeholder, not traded directly)
  {
    publicKey: keys.m11,
    marketName: '2028 US Presidential Election',
    question: 'Who wins 2028 US Election?',
    slug: '2028-us-election',
    imageUrl: 'https://picsum.photos/seed/2028-us-election/400/400',
    source: 'politics',
    category: 'Politics',
    creator: keys.creator,
    yesTokenMint: keys.y11a, // placeholder
    noTokenMint: keys.n11a,
    ...makeReserves(400, 50),
    isCompleted: false,
    winningOutcome: null,
    startDate: now - days(60),
    endDate: now + days(900),
    startSlot: 268_000_000,
    endingSlot: null,
    oracleFeed: null,
    priceTarget: null,
    comparisonType: null,
    metricType: null,
    oracleResolutionFinished: false,
    resolvedAt: null,
    resolvedBy: null,
    lps: [],
  },
  // 12 — Next $1T crypto (group parent — placeholder)
  {
    publicKey: keys.m12,
    marketName: 'Next Crypto to $1T Market Cap',
    question: 'Next crypto to reach $1T market cap?',
    slug: 'next-crypto-1t-market-cap',
    imageUrl: 'https://picsum.photos/seed/next-crypto-1t-market-cap/400/400',
    source: 'crypto',
    category: 'Crypto',
    creator: keys.creator,
    yesTokenMint: keys.y12a,
    noTokenMint: keys.n12a,
    ...makeReserves(350, 50),
    isCompleted: false,
    winningOutcome: null,
    startDate: now - days(15),
    endDate: now + days(365),
    startSlot: 282_500_000,
    endingSlot: null,
    oracleFeed: null,
    priceTarget: null,
    comparisonType: null,
    metricType: null,
    oracleResolutionFinished: false,
    resolvedAt: null,
    resolvedBy: null,
    lps: [],
  },
];

// ---------------------------------------------------------------------------
// Market Groups (multi-outcome / NegRisk)
// ---------------------------------------------------------------------------

export const MOCK_MARKET_GROUPS: MockMarketGroup[] = [
  {
    publicKey: keys.m11,
    groupName: '2028 US Presidential Election',
    question: 'Who wins 2028 US Election?',
    slug: '2028-us-election',
    imageUrl: 'https://picsum.photos/seed/2028-us-election/400/400',
    source: 'politics',
    category: 'Politics',
    creator: keys.creator,
    isNegRisk: true,
    isLocked: true,
    startDate: now - days(60),
    endDate: now + days(900),
    totalVolume: sol(1600),
    subMarkets: [
      {
        publicKey: keys.m11a,
        label: 'Ron DeSantis',
        slug: '2028-us-election-desantis',
        yesPercent: 32,
        yesTokenMint: keys.y11a,
        noTokenMint: keys.n11a,
      },
      {
        publicKey: keys.m11b,
        label: 'Gavin Newsom',
        slug: '2028-us-election-newsom',
        yesPercent: 25,
        yesTokenMint: keys.y11b,
        noTokenMint: keys.n11b,
      },
      {
        publicKey: keys.m11c,
        label: 'J.D. Vance',
        slug: '2028-us-election-vance',
        yesPercent: 22,
        yesTokenMint: keys.y11c,
        noTokenMint: keys.n11c,
      },
      {
        publicKey: keys.m11d,
        label: 'Other',
        slug: '2028-us-election-other',
        yesPercent: 21,
        yesTokenMint: keys.y11d,
        noTokenMint: keys.n11d,
      },
    ],
  },
  {
    publicKey: keys.m12,
    groupName: 'Next Crypto to $1T Market Cap',
    question: 'Next crypto to reach $1T market cap?',
    slug: 'next-crypto-1t-market-cap',
    imageUrl: 'https://picsum.photos/seed/next-crypto-1t-market-cap/400/400',
    source: 'crypto',
    category: 'Crypto',
    creator: keys.creator,
    isNegRisk: true,
    isLocked: true,
    startDate: now - days(15),
    endDate: now + days(365),
    totalVolume: sol(2100),
    subMarkets: [
      {
        publicKey: keys.m12a,
        label: 'Ethereum (ETH)',
        slug: 'next-crypto-1t-eth',
        yesPercent: 48,
        yesTokenMint: keys.y12a,
        noTokenMint: keys.n12a,
      },
      {
        publicKey: keys.m12b,
        label: 'Solana (SOL)',
        slug: 'next-crypto-1t-sol',
        yesPercent: 30,
        yesTokenMint: keys.y12b,
        noTokenMint: keys.n12b,
      },
      {
        publicKey: keys.m12c,
        label: 'Other',
        slug: 'next-crypto-1t-other',
        yesPercent: 22,
        yesTokenMint: keys.y12c,
        noTokenMint: keys.n12c,
      },
    ],
  },
];
