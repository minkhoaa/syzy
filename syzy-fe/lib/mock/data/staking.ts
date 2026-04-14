/**
 * Mock staking data for the Syzy mock frontend.
 *
 * OYRADE token uses 6 decimals (OYRADE_DECIMALS = 6).
 * All raw amounts are in micro-tokens (1 OYRADE = 1_000_000 units).
 * SOL amounts are in lamports (1 SOL = 1_000_000_000).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MockStakingPool {
  /** Total tokens staked across all users (raw, 6 decimals) */
  totalStaked: number;
  /** Reward rate: tokens per second (raw) */
  rewardRate: number;
  /** Last time rewards were updated (unix timestamp) */
  lastUpdateTime: number;
  /** Accumulated reward per staked token (scaled by PRECISION) */
  rewardPerTokenStored: string;
  /** Total rewards ever distributed (raw) */
  totalRewardsDistributed: number;
}

export interface MockStakingUser {
  /** Amount the mock user has staked (raw, 6 decimals) */
  stakedAmount: number;
  /** Reward debt for the user (scaled by PRECISION) */
  rewardDebt: string;
  /** Pending unclaimed rewards in SOL (lamports) */
  pendingRewards: number;
  /** When the user last staked (unix timestamp) */
  lastStakeTime: number;
  /** Current staking tier */
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
}

export interface MockStakingTier {
  /** Minimum OYRADE tokens staked (whole units, not raw) */
  min: number;
  /** Fee discount in basis points */
  discount: number;
}

export interface MockStaking {
  pool: MockStakingPool;
  user: MockStakingUser;
  tiers: Record<'bronze' | 'silver' | 'gold' | 'diamond', MockStakingTier>;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const now = Math.floor(Date.now() / 1000);

const OYRADE_DECIMALS = 6;
const raw = (amount: number) => amount * 10 ** OYRADE_DECIMALS;
const LAMPORTS_PER_SOL = 1_000_000_000;

export const MOCK_STAKING: MockStaking = {
  pool: {
    totalStaked: raw(2_450_000), // 2.45M OYRADE staked across all users
    rewardRate: raw(0.5), // 0.5 OYRADE per second
    lastUpdateTime: now - 120, // 2 minutes ago
    rewardPerTokenStored: '7340249209715', // accumulated precision-scaled value
    totalRewardsDistributed: raw(185_000), // 185K OYRADE distributed so far
  },
  user: {
    stakedAmount: raw(750), // 750 OYRADE (silver tier: min 500)
    rewardDebt: '5150000000000',
    pendingRewards: Math.round(2.5 * LAMPORTS_PER_SOL), // 2.5 SOL worth
    lastStakeTime: now - 86_400 * 14, // 14 days ago
    tier: 'silver',
  },
  tiers: {
    bronze: { min: 100, discount: 500 }, // 5% fee discount
    silver: { min: 500, discount: 1000 }, // 10% fee discount
    gold: { min: 2000, discount: 1500 }, // 15% fee discount
    diamond: { min: 10000, discount: 2000 }, // 20% fee discount
  },
};
