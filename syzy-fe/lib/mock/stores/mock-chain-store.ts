import { create } from 'zustand'
import { MOCK_ADDRESS } from '../data/user'

// ---------------------------------------------------------------------------
// Wallet state
// ---------------------------------------------------------------------------

interface MockWalletState {
  isConnected: boolean
  address: string | null
  balance: number // SOL balance (display units, not lamports)
  connect: () => void
  disconnect: () => void
}

const INITIAL_BALANCE = 8_450.75 // XLM

export const useMockWalletStore = create<MockWalletState>((set) => ({
  isConnected: true, // Auto-connected in mock mode
  address: MOCK_ADDRESS,
  balance: INITIAL_BALANCE,
  connect: () => set({ isConnected: true, address: MOCK_ADDRESS }),
  disconnect: () => set({ isConnected: false, address: null }),
}))

// ---------------------------------------------------------------------------
// On-chain state (markets, balances, staking)
// ---------------------------------------------------------------------------

export interface MarketReserves {
  yesTokenReserves: number
  yesSolReserves: number
  noTokenReserves: number
  noSolReserves: number
}

export interface UserTokenBalances {
  yes: number
  no: number
}

interface MockChainState {
  // Market reserves keyed by market publicKey
  marketReserves: Record<string, MarketReserves>
  // User token balances keyed by market publicKey
  userBalances: Record<string, UserTokenBalances>
  // Staking
  stakedAmount: number
  pendingRewards: number
  // Wallet SOL balance (mirrors useMockWalletStore.balance for chain ops)
  walletBalance: number

  // Mutators
  updateReserves: (
    marketKey: string,
    reserves: Partial<MarketReserves>,
  ) => void
  updateUserBalance: (
    marketKey: string,
    balances: Partial<UserTokenBalances>,
  ) => void
  adjustWalletBalance: (delta: number) => void
  setStaking: (staked: number, rewards: number) => void
}

export const useMockChainStore = create<MockChainState>((set) => ({
  marketReserves: {},
  userBalances: {},
  stakedAmount: 15_000 * 1_000_000, // 15,000 XLM staked (raw with 6 decimals)
  pendingRewards: Math.round(3.75 * 1_000_000_000), // 3.75 XLM pending rewards
  walletBalance: INITIAL_BALANCE,

  updateReserves: (marketKey, reserves) =>
    set((state) => ({
      marketReserves: {
        ...state.marketReserves,
        [marketKey]: {
          ...(state.marketReserves[marketKey] ?? {
            yesTokenReserves: 0,
            yesSolReserves: 0,
            noTokenReserves: 0,
            noSolReserves: 0,
          }),
          ...reserves,
        },
      },
    })),

  updateUserBalance: (marketKey, balances) =>
    set((state) => ({
      userBalances: {
        ...state.userBalances,
        [marketKey]: {
          ...(state.userBalances[marketKey] ?? { yes: 0, no: 0 }),
          ...balances,
        },
      },
    })),

  adjustWalletBalance: (delta) =>
    set((state) => ({
      walletBalance: Math.max(0, state.walletBalance + delta),
    })),

  setStaking: (staked, rewards) =>
    set({ stakedAmount: staked, pendingRewards: rewards }),
}))
