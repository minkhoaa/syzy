import { PublicKey } from "@solana/web3.js";
import { Program, BN } from "@coral-xyz/anchor";
import { PredictionMarket } from "@/lib/types/prediction-market";
import { Outcome, Side } from "@/lib/constants/programs";

/**
 * Result returned when creating a new market
 */
export interface CreateMarketResult {
  signature: string;
  marketPda: PublicKey;
  yesToken: PublicKey;
  noToken: PublicKey;
}

export interface Lp {
  lpAddress: PublicKey;
  amount: BN;
}

export interface MarketAccount {
  yesTokenMint: PublicKey;
  noTokenMint: PublicKey;
  creator: PublicKey;
  marketName?: string;
  question?: string;
  slug?: string;
  imageUrl?: string;
  source?: string;
  category?: string;
  createdAt?: BN;

  initialYesTokenReserves: BN;
  realYesTokenReserves: BN;
  realYesSolReserves: BN;
  tokenYesTotalSupply: BN;

  initialNoTokenReserves: BN;
  realNoTokenReserves: BN;
  realNoSolReserves: BN;
  tokenNoTotalSupply: BN;

  isCompleted: boolean;
  winningOutcome: number | null;
  startSlot: BN | null;
  endingSlot: BN | null;
  /** Unix timestamp (seconds) when the market opens for trading */
  startDate: BN | null;
  /** Unix timestamp (seconds) when the market closes */
  endDate: BN | null;

  lps: Lp[];
  totalLpAmount: BN;

  // Oracle resolution fields
  oracleFeed: PublicKey | null;
  priceTarget: BN | null;
  comparisonType: number | null;
  metricType: number | null;
  oracleResolutionFinished: boolean;
  resolvedAt: BN | null;
  resolvedBy: number | null;
}

/**
 * Return type for usePredictionMarket hook
 */
export interface CreateMarketOptions {
  marketName: string;
  question?: string;
  slug?: string;
  imageUrl?: string;
  source?: string;
  category?: string;
  startSlot?: number;
  endingSlot?: number;
  /** Unix timestamp (seconds) - when the market opens for trading */
  startDate?: number;
  /** Unix timestamp (seconds) - when the market closes */
  endDate?: number;

  // Oracle resolution params (optional — omit for admin-only resolution)
  oracleFeed?: PublicKey;
  priceTarget?: BN;
  comparisonType?: number; // 0=GT, 1=LT, 2=EQ
  metricType?: number;     // 0=price, 1=mcap, 2=curve_pct
}

export interface UsePredictionMarketReturn {
  createMarket: (marketName: string, question?: string, startSlot?: number, endingSlot?: number, startDate?: number, endDate?: number) => Promise<CreateMarketResult | undefined>;
  createMarketWithOptions: (options: CreateMarketOptions) => Promise<CreateMarketResult | undefined>;

  initializeMaster: () => Promise<string | undefined>;

  swap: (yesToken: PublicKey, noToken: PublicKey, amount: number | string, direction: Side, tokenType: Outcome, minReceive?: number | string, isSolAmount?: boolean) => Promise<string | undefined>;

  resolution: (yesToken: PublicKey, noToken: PublicKey, winningOutcome: Outcome) => Promise<string | undefined>;

  resolveViaOracle: (yesToken: PublicKey, noToken: PublicKey, oracleFeed: PublicKey) => Promise<string | undefined>;

  claimWinnings: (yesToken: PublicKey, noToken: PublicKey) => Promise<string | undefined>;

  getUserTokenBalances: (yesToken: PublicKey, noToken: PublicKey) => Promise<{ yesBalance: number; noBalance: number; yesValueInSol: number; noValueInSol: number } | undefined>;

  calculateTokensForSolAmount: (yesToken: PublicKey, noToken: PublicKey, solAmount: number, tokenType: Outcome) => Promise<number | undefined>;

  calculateBuyOutput: (yesToken: PublicKey, noToken: PublicKey, solAmount: number, tokenType: Outcome) => Promise<number | undefined>;

  getMarket: (marketAddress: PublicKey) => Promise<MarketAccount | undefined>;

  getAllMarkets?: () => Promise<{ publicKey: PublicKey; account: MarketAccount }[]>;

  updateMarket: (marketAddress: PublicKey, params: { marketName?: string; question?: string; slug?: string; imageUrl?: string; source?: string; category?: string }) => Promise<string | undefined>;

  getConfigTiers: () => Promise<{
    platformBuyFeeBps: number;
    platformSellFeeBps: number;
    lpBuyFeeBps: number;
    lpSellFeeBps: number;
    stakingFeeShareBps: number;
    bronzeMin: number; bronzeDiscount: number;
    silverMin: number; silverDiscount: number;
    goldMin: number;   goldDiscount: number;
    diamondMin: number; diamondDiscount: number;
  } | null>;

  // v1 conditional token
  depositCollateral: (marketPubkey: PublicKey, amount: number) => Promise<string | undefined>;
  withdrawCollateral: (marketPubkey: PublicKey, pairs: number) => Promise<string | undefined>;
  swapV2: (marketPubkey: PublicKey, amountIn: number, minAmountOut: number, buyYes: boolean) => Promise<string | undefined>;
  claimWinningsV2: (marketPubkey: PublicKey) => Promise<string | undefined>;

  program: Program<PredictionMarket> | null;
}
