import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, Idl, BN } from "@coral-xyz/anchor";
import bs58 from "bs58";
import { PROGRAM_ID, SEED_MARKET, SEED_USERINFO, SEED_MARKET_V1_CONFIG, TOKEN_MULTIPLIER } from "@/lib/constants/programs";
import { RPC_URL, CLUSTER } from "@/lib/constants/network";
import IDLJson from "@/lib/constants/IDL.json";
import type { PredictionMarket } from "@/lib/types/prediction-market";
import type { MarketAccount } from "@/types/prediction-market.types";

const predictionMarketIdl = (IDLJson as { default?: unknown }).default ?? IDLJson;

export interface UserPosition {
  marketPda: string;
  yesTokenAmount: number;
  noTokenAmount: number;
  lpAmount: number;
  isLp: boolean;
  hasClaimedYes: boolean;
  hasClaimedNo: boolean;
  // Calculated values
  yesValueInSol?: number;
  noValueInSol?: number;
  totalValueInSol?: number;
  // Market data
  market?: {
    marketName?: string;
    question?: string;
    slug?: string;
    imageUrl?: string;
    category?: string;
    yesTokenMint: string;
    noTokenMint: string;
    isCompleted: boolean;
    winningOutcome: number | null;
    yesPrice: number;
    noPrice: number;
    // Reserve/supply data for payout calculations
    realYesSolReserves: number;
    realNoSolReserves: number;
    realYesTokenReserves: number;
    realNoTokenReserves: number;
    tokenYesTotalSupply: number;
    tokenNoTotalSupply: number;
    endDate?: number; // Unix timestamp (seconds)
  };
}

export interface PortfolioStats {
  totalValueSol: number;
  yesValueSol: number;
  noValueSol: number;
  lpValueSol: number;
  totalPositions: number;
  activePositions: number;
  completedPositions: number;
  // From trade history
  totalTrades?: number;
  totalVolume?: number;
  winRate?: number;
}

interface UserInfoAccount {
  user: PublicKey;
  yesTokenAmount?: BN;
  yes_token_amount?: BN;
  noTokenAmount?: BN;
  no_token_amount?: BN;
  lpAmount?: BN;
  lp_amount?: BN;
  isLp?: boolean;
  is_lp?: boolean;
  isInitialized?: boolean;
  is_initialized?: boolean;
  hasClaimedYes?: boolean;
  has_claimed_yes?: boolean;
  hasClaimedNo?: boolean;
  has_claimed_no?: boolean;
}

function getReadOnlyProgram(connection: Connection): Program<PredictionMarket> {
  const dummyWallet = {
    publicKey: PublicKey.default,
    signTransaction: async <T>(tx: T): Promise<T> => tx,
    signAllTransactions: async <T>(txs: T[]): Promise<T[]> => txs,
  };
  const provider = new AnchorProvider(connection, dummyWallet, {
    commitment: "confirmed",
  });
  return new Program(
    predictionMarketIdl as Idl,
    provider
  ) as unknown as Program<PredictionMarket>;
}

function normalizeUserInfo(raw: UserInfoAccount): {
  yesTokenAmount: number;
  noTokenAmount: number;
  lpAmount: number;
  isLp: boolean;
  hasClaimedYes: boolean;
  hasClaimedNo: boolean;
} {
  const yesTokenAmountBN = raw.yesTokenAmount ?? raw.yes_token_amount ?? new BN(0);
  const noTokenAmountBN = raw.noTokenAmount ?? raw.no_token_amount ?? new BN(0);
  const lpAmountBN = raw.lpAmount ?? raw.lp_amount ?? new BN(0);

  return {
    yesTokenAmount: yesTokenAmountBN instanceof BN ? yesTokenAmountBN.toNumber() / 1e6 : 0,
    noTokenAmount: noTokenAmountBN instanceof BN ? noTokenAmountBN.toNumber() / 1e6 : 0,
    lpAmount: lpAmountBN instanceof BN ? lpAmountBN.toNumber() / 1e6 : 0,
    isLp: raw.isLp ?? raw.is_lp ?? false,
    hasClaimedYes: raw.hasClaimedYes ?? raw.has_claimed_yes ?? false,
    hasClaimedNo: raw.hasClaimedNo ?? raw.has_claimed_no ?? false,
  };
}

function normalizeMarketAccount(raw: Record<string, unknown>): MarketAccount {
  const get = (...keys: string[]) => {
    const k = keys.find((key) => raw[key] != null);
    return k != null ? raw[k] : undefined;
  };
  return {
    yesTokenMint: get("yesTokenMint", "yes_token_mint") as PublicKey,
    noTokenMint: get("noTokenMint", "no_token_mint") as PublicKey,
    creator: get("creator") as PublicKey,
    marketName: get("marketName", "market_name") as string | undefined,
    question: get("question") as string | undefined,
    slug: get("slug") as string | undefined,
    imageUrl: (get("imageUrl", "image_url") as string | undefined) ?? undefined,
    source: get("source") as string | undefined,
    category: get("category") as string | undefined,
    createdAt: get("createdAt", "created_at") as BN | undefined,
    initialYesTokenReserves: get("initialYesTokenReserves", "initial_yes_token_reserves") as BN,
    realYesTokenReserves: get("realYesTokenReserves", "real_yes_token_reserves") as BN,
    realYesSolReserves: get("realYesSolReserves", "real_yes_sol_reserves") as BN,
    tokenYesTotalSupply: get("tokenYesTotalSupply", "token_yes_total_supply") as BN,
    initialNoTokenReserves: get("initialNoTokenReserves", "initial_no_token_reserves") as BN,
    realNoTokenReserves: get("realNoTokenReserves", "real_no_token_reserves") as BN,
    realNoSolReserves: get("realNoSolReserves", "real_no_sol_reserves") as BN,
    tokenNoTotalSupply: get("tokenNoTotalSupply", "token_no_total_supply") as BN,
    isCompleted: (get("isCompleted", "is_completed") as boolean) ?? false,
    winningOutcome: (get("winningOutcome", "winning_outcome") as number | null | undefined) ?? null,
    startSlot: (get("startSlot", "start_slot") as BN | null | undefined) ?? null,
    endingSlot: (get("endingSlot", "ending_slot") as BN | null | undefined) ?? null,
    startDate: (get("startDate", "start_date") as BN | null | undefined) ?? null,
    endDate: (get("endDate", "end_date") as BN | null | undefined) ?? null,
    lps: ((get("lps") as { lpAddress?: PublicKey; lp_address?: PublicKey; amount: BN }[]) ?? []).map(
      (lp) => ({
        lpAddress: (lp.lpAddress ?? lp.lp_address) as PublicKey,
        amount: lp.amount,
      })
    ),
    totalLpAmount: get("totalLpAmount", "total_lp_amount") as BN,
    oracleFeed: (get("oracleFeed", "oracle_feed") as PublicKey | null | undefined) ?? null,
    priceTarget: (get("priceTarget", "price_target") as BN | null | undefined) ?? null,
    comparisonType: (get("comparisonType", "comparison_type") as number | null | undefined) ?? null,
    metricType: (get("metricType", "metric_type") as number | null | undefined) ?? null,
    oracleResolutionFinished: (get("oracleResolutionFinished", "oracle_resolution_finished") as boolean | undefined) ?? false,
    resolvedAt: (get("resolvedAt", "resolved_at") as BN | null | undefined) ?? null,
    resolvedBy: (get("resolvedBy", "resolved_by") as number | null | undefined) ?? null,
  };
}

/**
 * Calculate the SOL value of tokens if sold through the AMM.
 * Uses the constant product formula: sol_out = sol_reserve - (sol_reserve * token_reserve / (token_reserve + tokens))
 */
export function calculateTokenValueInSol(
  tokenAmount: number,
  solReserves: number,
  tokenReserves: number
): number {
  if (tokenAmount <= 0 || tokenReserves <= 0 || solReserves <= 0) return 0;

  // Inverse AMM formula for sell: sol_out = sol_reserve * token_amount / (token_reserve + token_amount)
  const newTokenReserves = tokenReserves + tokenAmount;
  const newSolReserves = (solReserves * tokenReserves) / newTokenReserves;
  return solReserves - newSolReserves;
}

/**
 * Calculate payout if a given side wins, mirroring the on-chain claim_winnings formula.
 * Payout = (userTokens / circulatingTokens) * totalMarketSol
 * where circulatingTokens = totalSupply - tokensStillInPool
 */
export function calculatePayoutIfWin(
  userTokens: number,
  tokenTotalSupply: number,
  tokenReservesInPool: number,
  totalYesSolReserves: number,
  totalNoSolReserves: number,
): number {
  const circulatingTokens = tokenTotalSupply - tokenReservesInPool;
  if (circulatingTokens <= 0 || userTokens <= 0) return 0;
  const totalMarketSol = totalYesSolReserves + totalNoSolReserves;
  return (userTokens / circulatingTokens) * totalMarketSol;
}

/**
 * Check whether a market is v1 (conditional token) by probing for a MarketV1Config PDA.
 */
export async function isV1Market(
  connection: Connection,
  marketPubkey: PublicKey
): Promise<boolean> {
  const [v1ConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from(SEED_MARKET_V1_CONFIG), marketPubkey.toBuffer()],
    PROGRAM_ID
  );
  const accountInfo = await connection.getAccountInfo(v1ConfigPda);
  return accountInfo !== null;
}

/**
 * Calculate payout for v1 (conditional token) markets.
 * Each winning token redeems at a fixed face value:
 *   payout = (userTokens * collateralPerPair) / TOKEN_MULTIPLIER
 */
export function calculatePayoutIfWinV1(
  userTokens: number,
  collateralPerPair: number
): number {
  if (userTokens <= 0 || collateralPerPair <= 0) return 0;
  return (userTokens * collateralPerPair) / TOKEN_MULTIPLIER;
}

/**
 * Calculate market prices from reserves.
 */
export function calculateMarketPrices(market: MarketAccount): { yesPrice: number; noPrice: number } {
  const yesSol = market.realYesSolReserves instanceof BN
    ? market.realYesSolReserves.toNumber() / 1e9
    : 0;
  const yesTokens = market.realYesTokenReserves instanceof BN
    ? market.realYesTokenReserves.toNumber() / 1e6
    : 0;
  const noSol = market.realNoSolReserves instanceof BN
    ? market.realNoSolReserves.toNumber() / 1e9
    : 0;
  const noTokens = market.realNoTokenReserves instanceof BN
    ? market.realNoTokenReserves.toNumber() / 1e6
    : 0;

  // Price = sol_reserve / token_reserve (price per token in SOL terms)
  // But for probability, we want the proportion: yes_price / (yes_price + no_price)
  const yesPrice = yesTokens > 0 ? yesSol / yesTokens : 0;
  const noPrice = noTokens > 0 ? noSol / noTokens : 0;

  const totalPrice = yesPrice + noPrice;
  if (totalPrice === 0) return { yesPrice: 0.5, noPrice: 0.5 };

  return {
    yesPrice: yesPrice / totalPrice,
    noPrice: noPrice / totalPrice,
  };
}

/**
 * Fetch all user positions across all markets from on-chain data.
 */
export async function fetchUserPositionsFromChain(
  walletAddress: string
): Promise<UserPosition[]> {
  if (!walletAddress) return [];

  const connection = new Connection(RPC_URL, CLUSTER);
  const program = getReadOnlyProgram(connection);
  const wallet = new PublicKey(walletAddress);

  try {
    // First, get all markets
    const MARKET_DISCRIMINATOR = new Uint8Array([219, 190, 213, 55, 0, 227, 198, 154]);
    const discriminatorBase58 = bs58.encode(MARKET_DISCRIMINATOR);
    const marketAccounts = await connection.getProgramAccounts(PROGRAM_ID, {
      commitment: CLUSTER,
      filters: [{ memcmp: { offset: 0, bytes: discriminatorBase58 } }],
    });

    console.log(`[Portfolio] Found ${marketAccounts.length} markets on-chain`);

    // 1. Pre-calculate all UserInfo PDAs for the user across all markets
    const userInfoRequests = marketAccounts.map(({ pubkey: marketPda }) => {
      const [userInfoPda] = PublicKey.findProgramAddressSync(
        [Buffer.from(SEED_USERINFO), wallet.toBuffer(), marketPda.toBuffer()],
        PROGRAM_ID
      );
      return { marketPda, userInfoPda };
    });

    console.log(`[Portfolio] Fetching UserInfo for ${userInfoRequests.length} markets in bulk...`);

    // 2. Fetch UserInfo accounts in batches of 100
    const userInfoPDAs = userInfoRequests.map(r => r.userInfoPda);
    const userInfoAccountInfos: (any | null)[] = [];
    
    for (let i = 0; i < userInfoPDAs.length; i += 100) {
      const batch = userInfoPDAs.slice(i, i + 100);
      const infos = await connection.getMultipleAccountsInfo(batch);
      userInfoAccountInfos.push(...infos);
    }

    // 3. Process only the markets where user actually has an initialized UserInfo account
    const positions: UserPosition[] = [];

    for (let i = 0; i < userInfoRequests.length; i++) {
      const accountInfo = userInfoAccountInfos[i];
      if (!accountInfo) continue; // User has no position/account in this market

      const { marketPda } = userInfoRequests[i];
      const marketAccountData = marketAccounts[i].account;

      try {
        // Decode Market
        const marketRaw = program.coder.accounts.decode("market", marketAccountData.data) as Record<string, unknown>;
        const market = normalizeMarketAccount(marketRaw);

        // Decode UserInfo
        const userInfoRaw = program.coder.accounts.decode("userInfo", accountInfo.data) as unknown as UserInfoAccount;
        const userInfo = normalizeUserInfo(userInfoRaw);

        // Skip if user has no position (all zero)
        if (userInfo.yesTokenAmount === 0 && userInfo.noTokenAmount === 0 && userInfo.lpAmount === 0) {
          continue;
        }

        // Calculate values (copied from existing logic)
        const yesSol = market.realYesSolReserves instanceof BN ? market.realYesSolReserves.toNumber() / 1e9 : 0;
        const yesTokens = market.realYesTokenReserves instanceof BN ? market.realYesTokenReserves.toNumber() / 1e6 : 0;
        const noSol = market.realNoSolReserves instanceof BN ? market.realNoSolReserves.toNumber() / 1e9 : 0;
        const noTokens = market.realNoTokenReserves instanceof BN ? market.realNoTokenReserves.toNumber() / 1e6 : 0;

        const { yesPrice, noPrice } = calculateMarketPrices(market);

        let yesValueInSol: number;
        let noValueInSol: number;

        if (market.isCompleted) {
          if (market.winningOutcome === 0) {
            yesValueInSol = userInfo.yesTokenAmount;
            noValueInSol = 0;
          } else if (market.winningOutcome === 1) {
            yesValueInSol = 0;
            noValueInSol = userInfo.noTokenAmount;
          } else {
            yesValueInSol = calculateTokenValueInSol(userInfo.yesTokenAmount, yesSol, yesTokens);
            noValueInSol = calculateTokenValueInSol(userInfo.noTokenAmount, noSol, noTokens);
          }
        } else {
          yesValueInSol = calculateTokenValueInSol(userInfo.yesTokenAmount, yesSol, yesTokens);
          noValueInSol = calculateTokenValueInSol(userInfo.noTokenAmount, noSol, noTokens);
        }

        const tokenYesTotalSupply = market.tokenYesTotalSupply instanceof BN ? market.tokenYesTotalSupply.toNumber() / 1e6 : 0;
        const tokenNoTotalSupply = market.tokenNoTotalSupply instanceof BN ? market.tokenNoTotalSupply.toNumber() / 1e6 : 0;

        const endDateNum = market.endDate instanceof BN ? market.endDate.toNumber() : undefined;

        positions.push({
          marketPda: marketPda.toBase58(),
          ...userInfo,
          yesValueInSol,
          noValueInSol,
          totalValueInSol: yesValueInSol + noValueInSol,
          market: {
            marketName: market.marketName,
            question: market.question,
            slug: market.slug,
            imageUrl: market.imageUrl,
            category: market.category,
            yesTokenMint: market.yesTokenMint?.toBase58() || "",
            noTokenMint: market.noTokenMint?.toBase58() || "",
            isCompleted: market.isCompleted,
            winningOutcome: market.winningOutcome,
            yesPrice,
            noPrice,
            realYesSolReserves: yesSol,
            realNoSolReserves: noSol,
            realYesTokenReserves: yesTokens,
            realNoTokenReserves: noTokens,
            tokenYesTotalSupply,
            tokenNoTotalSupply,
            endDate: endDateNum,
          },
        });
      } catch (err) {
        console.warn(`[Portfolio] Failed to decode data for market ${marketPda.toBase58()}:`, err);
        continue;
      }
    }

    console.log(`[Portfolio] Found ${positions.length} positions for wallet ${walletAddress.slice(0, 8)}...`);
    return positions;
  } catch (error) {
    console.error("Failed to fetch user positions:", error);
    return [];
  }
}

/**
 * Calculate aggregated portfolio stats from positions and trade history.
 */
export function calculatePortfolioStats(
  positions: UserPosition[],
  tradeStats?: {
    totalTrades?: number;
    totalVolume?: number;
    successRate?: number;
  }
): PortfolioStats {
  let totalValueSol = 0;
  let yesValueSol = 0;
  let noValueSol = 0;
  let lpValueSol = 0;
  let activePositions = 0;
  let completedPositions = 0;

  for (const position of positions) {
    totalValueSol += position.totalValueInSol || 0;
    yesValueSol += position.yesValueInSol || 0;
    noValueSol += position.noValueInSol || 0;

    // LP value would need separate calculation based on share of pool
    // For now, we'll estimate it based on LP amount proportion

    if (position.market?.isCompleted) {
      completedPositions++;
    } else {
      activePositions++;
    }
  }

  return {
    totalValueSol,
    yesValueSol,
    noValueSol,
    lpValueSol,
    totalPositions: positions.length,
    activePositions,
    completedPositions,
    totalTrades: tradeStats?.totalTrades,
    totalVolume: tradeStats?.totalVolume,
    winRate: tradeStats?.successRate,
  };
}

/**
 * Format SOL value for display.
 */
export function formatSolValue(sol: number, decimals = 4): string {
  if (sol === 0) return "0 XLM";
  if (sol < 0.0001) return "<0.0001 XLM";
  return `${sol.toFixed(decimals)} XLM`;
}

/**
 * Format USD value for display (assuming SOL price).
 */
export function formatUsdValue(sol: number, solPrice: number): string {
  const usd = sol * solPrice;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(usd);
}
