"use client";

import { useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { toast } from "sonner";

import type {
  UsePredictionMarketReturn,
  CreateMarketResult,
  CreateMarketOptions,
  MarketAccount,
} from "@/types/prediction-market.types";
import { Outcome, Side } from "@/lib/constants/programs";
import { MOCK_MARKETS, type MockMarket } from "@/lib/mock/data/markets";
import {
  useMockChainStore,
  useMockWalletStore,
} from "@/lib/mock/stores/mock-chain-store";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LAMPORTS_PER_SOL = 1_000_000_000;

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function fakeTxSig(): string {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let sig = "";
  for (let i = 0; i < 88; i++) sig += chars[Math.floor(Math.random() * chars.length)];
  return sig;
}

/** Find mock market by YES or NO token mint string */
function findMarketByMint(
  yesToken: PublicKey | string,
  noToken: PublicKey | string
): MockMarket | undefined {
  const yes = typeof yesToken === "string" ? yesToken : yesToken.toBase58();
  const no = typeof noToken === "string" ? noToken : noToken.toBase58();
  return MOCK_MARKETS.find(
    (m) => m.yesTokenMint === yes || m.noTokenMint === no
  );
}

function findMarketByKey(address: PublicKey | string): MockMarket | undefined {
  const key = typeof address === "string" ? address : address.toBase58();
  return MOCK_MARKETS.find((m) => m.publicKey === key);
}

/** Get effective reserves: chain store override or the static mock data */
function getReserves(market: MockMarket, chainReserves: Record<string, { yesTokenReserves: number; yesSolReserves: number; noTokenReserves: number; noSolReserves: number }>) {
  const stored = chainReserves[market.publicKey];
  return {
    yesTokenReserves: stored?.yesTokenReserves ?? market.realYesTokenReserves,
    yesSolReserves: stored?.yesSolReserves ?? market.realYesSolReserves,
    noTokenReserves: stored?.noTokenReserves ?? market.realNoTokenReserves,
    noSolReserves: stored?.noSolReserves ?? market.realNoSolReserves,
  };
}

/** Convert a MockMarket into MarketAccount shape with BN values */
function toMarketAccount(m: MockMarket): MarketAccount {
  return {
    yesTokenMint: new PublicKey(m.yesTokenMint),
    noTokenMint: new PublicKey(m.noTokenMint),
    creator: new PublicKey(m.creator),
    marketName: m.marketName,
    question: m.question,
    slug: m.slug,
    imageUrl: m.imageUrl,
    source: m.source,
    category: m.category,
    createdAt: new BN(m.startDate),
    initialYesTokenReserves: new BN(m.initialYesTokenReserves),
    realYesTokenReserves: new BN(m.realYesTokenReserves),
    realYesSolReserves: new BN(m.realYesSolReserves),
    tokenYesTotalSupply: new BN(m.tokenYesTotalSupply),
    initialNoTokenReserves: new BN(m.initialNoTokenReserves),
    realNoTokenReserves: new BN(m.realNoTokenReserves),
    realNoSolReserves: new BN(m.realNoSolReserves),
    tokenNoTotalSupply: new BN(m.tokenNoTotalSupply),
    isCompleted: m.isCompleted,
    winningOutcome: m.winningOutcome,
    startSlot: m.startSlot != null ? new BN(m.startSlot) : null,
    endingSlot: m.endingSlot != null ? new BN(m.endingSlot) : null,
    startDate: new BN(m.startDate),
    endDate: new BN(m.endDate),
    lps: m.lps.map((lp) => ({
      lpAddress: new PublicKey(lp.lpAddress),
      amount: new BN(lp.amount),
    })),
    totalLpAmount: new BN(m.totalLpAmount),
    oracleFeed: m.oracleFeed ? new PublicKey(m.oracleFeed) : null,
    priceTarget: m.priceTarget != null ? new BN(m.priceTarget) : null,
    comparisonType: m.comparisonType,
    metricType: m.metricType,
    oracleResolutionFinished: m.oracleResolutionFinished,
    resolvedAt: m.resolvedAt != null ? new BN(m.resolvedAt) : null,
    resolvedBy: m.resolvedBy,
  };
}

/**
 * Constant product buy output:
 *   tokensOut = tokenReserves - (tokenReserves * solReserves) / (solReserves + solIn)
 *            = tokenReserves * solIn / (solReserves + solIn)
 */
function constantProductBuyOutput(
  solIn: number,
  solReserves: number,
  tokenReserves: number
): number {
  if (solReserves <= 0 || tokenReserves <= 0) return 0;
  return (tokenReserves * solIn) / (solReserves + solIn);
}

/**
 * Constant product sell output (tokens -> SOL):
 *   solOut = solReserves - (solReserves * tokenReserves) / (tokenReserves + tokensIn)
 *          = solReserves * tokensIn / (tokenReserves + tokensIn)
 */
function constantProductSellOutput(
  tokensIn: number,
  solReserves: number,
  tokenReserves: number
): number {
  if (solReserves <= 0 || tokenReserves <= 0) return 0;
  return (solReserves * tokensIn) / (tokenReserves + tokensIn);
}

// ---------------------------------------------------------------------------
// In-memory created markets list (appended at runtime)
// ---------------------------------------------------------------------------

let dynamicMarkets: MockMarket[] = [];

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePredictionMarket(): UsePredictionMarketReturn {
  const { updateReserves, updateUserBalance, adjustWalletBalance, marketReserves, userBalances } =
    useMockChainStore();
  const wallet = useMockWalletStore();

  // ── createMarket ────────────────────────────────────────────────────

  const createMarket = useCallback(
    async (
      marketName: string,
      question?: string,
      startSlot?: number,
      endingSlot?: number,
      startDate?: number,
      endDate?: number
    ): Promise<CreateMarketResult | undefined> => {
      if (!wallet.isConnected) {
        toast.error("Please connect your wallet first");
        return undefined;
      }
      await delay(1500);

      const marketPda = PublicKey.unique();
      const yesToken = PublicKey.unique();
      const noToken = PublicKey.unique();
      const signature = fakeTxSig();

      const now = Math.floor(Date.now() / 1000);
      const newMarket: MockMarket = {
        publicKey: marketPda.toBase58(),
        marketName,
        question: question ?? marketName,
        slug: marketName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60),
        imageUrl: "",
        source: "user",
        category: "Other",
        creator: wallet.address ?? "",
        yesTokenMint: yesToken.toBase58(),
        noTokenMint: noToken.toBase58(),
        realYesTokenReserves: 100_000_000,
        realYesSolReserves: LAMPORTS_PER_SOL * 5,
        realNoTokenReserves: 100_000_000,
        realNoSolReserves: LAMPORTS_PER_SOL * 5,
        initialYesTokenReserves: 100_000_000,
        initialNoTokenReserves: 100_000_000,
        tokenYesTotalSupply: 150_000_000,
        tokenNoTotalSupply: 150_000_000,
        totalLpAmount: LAMPORTS_PER_SOL * 3,
        isCompleted: false,
        winningOutcome: null,
        startDate: startDate ?? now,
        endDate: endDate ?? now + 86_400 * 30,
        startSlot: startSlot ?? null,
        endingSlot: endingSlot ?? null,
        oracleFeed: null,
        priceTarget: null,
        comparisonType: null,
        metricType: null,
        oracleResolutionFinished: false,
        resolvedAt: null,
        resolvedBy: null,
        lps: [],
      };

      dynamicMarkets.push(newMarket);
      adjustWalletBalance(-5); // Deduct 5 SOL initial liquidity
      toast.success("Market created successfully!");

      return { signature, marketPda, yesToken, noToken };
    },
    [wallet.isConnected, wallet.address, adjustWalletBalance]
  );

  // ── createMarketWithOptions ─────────────────────────────────────────

  const createMarketWithOptions = useCallback(
    async (options: CreateMarketOptions): Promise<CreateMarketResult | undefined> => {
      return createMarket(
        options.marketName,
        options.question,
        options.startSlot,
        options.endingSlot,
        options.startDate,
        options.endDate
      );
    },
    [createMarket]
  );

  // ── initializeMaster ────────────────────────────────────────────────

  const initializeMaster = useCallback(async (): Promise<string | undefined> => {
    await delay(1000);
    toast.success("Master config initialized (mock)");
    return fakeTxSig();
  }, []);

  // ── swap (v0 constant product) ─────────────────────────────────────

  const swap = useCallback(
    async (
      yesToken: PublicKey,
      noToken: PublicKey,
      amount: number | string,
      direction: Side,
      tokenType: Outcome,
      _minReceive?: number | string,
      isSolAmount?: boolean
    ): Promise<string | undefined> => {
      if (!wallet.isConnected) {
        toast.error("Please connect your wallet first");
        return undefined;
      }

      const market = findMarketByMint(yesToken, noToken);
      if (!market) {
        toast.error("Market not found");
        return undefined;
      }
      if (market.isCompleted) {
        toast.error("Market is resolved");
        return undefined;
      }

      const amountNum = typeof amount === "string" ? parseFloat(amount) : amount;
      const reserves = getReserves(market, marketReserves);

      await delay(1500);

      if (direction === Side.Buy) {
        // Buy: SOL -> tokens
        const solIn = isSolAmount ? amountNum : amountNum; // treat amount as SOL lamports
        const isYes = tokenType === Outcome.Yes;
        const solR = isYes ? reserves.yesSolReserves : reserves.noSolReserves;
        const tokR = isYes ? reserves.yesTokenReserves : reserves.noTokenReserves;
        const tokensOut = constantProductBuyOutput(solIn, solR, tokR);

        if (isYes) {
          updateReserves(market.publicKey, {
            yesSolReserves: reserves.yesSolReserves + solIn,
            yesTokenReserves: reserves.yesTokenReserves - tokensOut,
          });
          updateUserBalance(market.publicKey, {
            yes: (userBalances[market.publicKey]?.yes ?? 0) + tokensOut,
          });
        } else {
          updateReserves(market.publicKey, {
            noSolReserves: reserves.noSolReserves + solIn,
            noTokenReserves: reserves.noTokenReserves - tokensOut,
          });
          updateUserBalance(market.publicKey, {
            no: (userBalances[market.publicKey]?.no ?? 0) + tokensOut,
          });
        }
        adjustWalletBalance(-solIn / LAMPORTS_PER_SOL);
      } else {
        // Sell: tokens -> SOL
        const tokensIn = amountNum;
        const isYes = tokenType === Outcome.Yes;
        const solR = isYes ? reserves.yesSolReserves : reserves.noSolReserves;
        const tokR = isYes ? reserves.yesTokenReserves : reserves.noTokenReserves;
        const solOut = constantProductSellOutput(tokensIn, solR, tokR);

        if (isYes) {
          updateReserves(market.publicKey, {
            yesSolReserves: reserves.yesSolReserves - solOut,
            yesTokenReserves: reserves.yesTokenReserves + tokensIn,
          });
          updateUserBalance(market.publicKey, {
            yes: Math.max(0, (userBalances[market.publicKey]?.yes ?? 0) - tokensIn),
          });
        } else {
          updateReserves(market.publicKey, {
            noSolReserves: reserves.noSolReserves - solOut,
            noTokenReserves: reserves.noTokenReserves + tokensIn,
          });
          updateUserBalance(market.publicKey, {
            no: Math.max(0, (userBalances[market.publicKey]?.no ?? 0) - tokensIn),
          });
        }
        adjustWalletBalance(solOut / LAMPORTS_PER_SOL);
      }

      toast.success("Swap confirmed!");
      return fakeTxSig();
    },
    [wallet.isConnected, marketReserves, userBalances, updateReserves, updateUserBalance, adjustWalletBalance]
  );

  // ── resolution ─────────────────────────────────────────────────────

  const resolution = useCallback(
    async (
      yesToken: PublicKey,
      noToken: PublicKey,
      winningOutcome: Outcome
    ): Promise<string | undefined> => {
      const market = findMarketByMint(yesToken, noToken);
      if (!market) {
        toast.error("Market not found");
        return undefined;
      }
      await delay(1500);
      market.isCompleted = true;
      market.winningOutcome = winningOutcome;
      market.resolvedAt = Math.floor(Date.now() / 1000);
      market.resolvedBy = 0; // admin
      toast.success(`Market resolved: ${winningOutcome === Outcome.Yes ? "YES" : "NO"} wins!`);
      return fakeTxSig();
    },
    []
  );

  // ── resolveViaOracle ───────────────────────────────────────────────

  const resolveViaOracle = useCallback(
    async (
      yesToken: PublicKey,
      noToken: PublicKey,
      _oracleFeed: PublicKey
    ): Promise<string | undefined> => {
      const market = findMarketByMint(yesToken, noToken);
      if (!market) {
        toast.error("Market not found");
        return undefined;
      }
      await delay(2000);
      // Randomly resolve YES or NO to simulate oracle
      const outcome = Math.random() > 0.5 ? Outcome.Yes : Outcome.No;
      market.isCompleted = true;
      market.winningOutcome = outcome;
      market.oracleResolutionFinished = true;
      market.resolvedAt = Math.floor(Date.now() / 1000);
      market.resolvedBy = 1; // oracle
      toast.success(`Oracle resolved: ${outcome === Outcome.Yes ? "YES" : "NO"} wins!`);
      return fakeTxSig();
    },
    []
  );

  // ── claimWinnings ──────────────────────────────────────────────────

  const claimWinnings = useCallback(
    async (yesToken: PublicKey, noToken: PublicKey): Promise<string | undefined> => {
      if (!wallet.isConnected) {
        toast.error("Please connect your wallet first");
        return undefined;
      }
      const market = findMarketByMint(yesToken, noToken);
      if (!market) {
        toast.error("Market not found");
        return undefined;
      }
      if (!market.isCompleted) {
        toast.error("Market not resolved yet");
        return undefined;
      }

      const balances = userBalances[market.publicKey] ?? { yes: 0, no: 0 };
      const isYesWin = market.winningOutcome === 0;
      const winningTokens = isYesWin ? balances.yes : balances.no;

      if (winningTokens <= 0) {
        toast.error("No winning tokens to claim");
        return undefined;
      }

      await delay(1500);

      // Proportional payout (v0 parimutuel) - simplified
      const reserves = getReserves(market, marketReserves);
      const totalSol = reserves.yesSolReserves + reserves.noSolReserves;
      const totalWinningTokens = isYesWin
        ? market.tokenYesTotalSupply - reserves.yesTokenReserves
        : market.tokenNoTotalSupply - reserves.noTokenReserves;
      const payout =
        totalWinningTokens > 0
          ? (winningTokens / totalWinningTokens) * totalSol
          : 0;

      adjustWalletBalance(payout / LAMPORTS_PER_SOL);
      updateUserBalance(market.publicKey, { yes: 0, no: 0 });

      toast.success(`Claimed ${(payout / LAMPORTS_PER_SOL).toFixed(4)} SOL!`);
      return fakeTxSig();
    },
    [wallet.isConnected, userBalances, marketReserves, adjustWalletBalance, updateUserBalance]
  );

  // ── getUserTokenBalances ───────────────────────────────────────────

  const getUserTokenBalances = useCallback(
    async (
      yesToken: PublicKey,
      noToken: PublicKey
    ): Promise<
      { yesBalance: number; noBalance: number; yesValueInSol: number; noValueInSol: number } | undefined
    > => {
      const market = findMarketByMint(yesToken, noToken);
      if (!market) return undefined;

      const balances = userBalances[market.publicKey] ?? { yes: 0, no: 0 };
      const reserves = getReserves(market, marketReserves);

      // Value in SOL = what you'd get if you sold now (constant product)
      const yesValueInSol =
        balances.yes > 0
          ? constantProductSellOutput(balances.yes, reserves.yesSolReserves, reserves.yesTokenReserves)
          : 0;
      const noValueInSol =
        balances.no > 0
          ? constantProductSellOutput(balances.no, reserves.noSolReserves, reserves.noTokenReserves)
          : 0;

      return {
        yesBalance: balances.yes,
        noBalance: balances.no,
        yesValueInSol,
        noValueInSol,
      };
    },
    [userBalances, marketReserves]
  );

  // ── calculateTokensForSolAmount ────────────────────────────────────

  const calculateTokensForSolAmount = useCallback(
    async (
      yesToken: PublicKey,
      noToken: PublicKey,
      solAmount: number,
      tokenType: Outcome
    ): Promise<number | undefined> => {
      const market = findMarketByMint(yesToken, noToken);
      if (!market) return undefined;
      const reserves = getReserves(market, marketReserves);
      const isYes = tokenType === Outcome.Yes;
      const solR = isYes ? reserves.yesSolReserves : reserves.noSolReserves;
      const tokR = isYes ? reserves.yesTokenReserves : reserves.noTokenReserves;
      return constantProductBuyOutput(solAmount, solR, tokR);
    },
    [marketReserves]
  );

  // ── calculateBuyOutput ─────────────────────────────────────────────

  const calculateBuyOutput = useCallback(
    async (
      yesToken: PublicKey,
      noToken: PublicKey,
      solAmount: number,
      tokenType: Outcome
    ): Promise<number | undefined> => {
      const market = findMarketByMint(yesToken, noToken);
      if (!market) return undefined;
      const reserves = getReserves(market, marketReserves);
      const isYes = tokenType === Outcome.Yes;
      const solR = isYes ? reserves.yesSolReserves : reserves.noSolReserves;
      const tokR = isYes ? reserves.yesTokenReserves : reserves.noTokenReserves;
      return constantProductBuyOutput(solAmount, solR, tokR);
    },
    [marketReserves]
  );

  // ── getMarket ──────────────────────────────────────────────────────

  const getMarket = useCallback(
    async (marketAddress: PublicKey): Promise<MarketAccount | undefined> => {
      const m =
        findMarketByKey(marketAddress) ??
        dynamicMarkets.find((dm) => dm.publicKey === marketAddress.toBase58());
      if (!m) return undefined;
      return toMarketAccount(m);
    },
    []
  );

  // ── getAllMarkets ──────────────────────────────────────────────────

  const getAllMarkets = useCallback(
    async (): Promise<{ publicKey: PublicKey; account: MarketAccount }[]> => {
      const all = [...MOCK_MARKETS, ...dynamicMarkets];
      return all.map((m) => ({
        publicKey: new PublicKey(m.publicKey),
        account: toMarketAccount(m),
      }));
    },
    []
  );

  // ── updateMarket ──────────────────────────────────────────────────

  const updateMarket = useCallback(
    async (
      marketAddress: PublicKey,
      params: {
        marketName?: string;
        question?: string;
        slug?: string;
        imageUrl?: string;
        source?: string;
        category?: string;
      }
    ): Promise<string | undefined> => {
      const key = marketAddress.toBase58();
      const market =
        MOCK_MARKETS.find((m) => m.publicKey === key) ??
        dynamicMarkets.find((m) => m.publicKey === key);
      if (!market) {
        toast.error("Market not found");
        return undefined;
      }
      await delay(1000);
      if (params.marketName != null) market.marketName = params.marketName;
      if (params.question != null) market.question = params.question;
      if (params.slug != null) market.slug = params.slug;
      if (params.imageUrl != null) market.imageUrl = params.imageUrl;
      if (params.source != null) market.source = params.source;
      if (params.category != null) market.category = params.category;
      toast.success("Market updated!");
      return fakeTxSig();
    },
    []
  );

  // ── getConfigTiers ────────────────────────────────────────────────

  const getConfigTiers = useCallback(
    async () => ({
      platformBuyFeeBps: 100,
      platformSellFeeBps: 100,
      lpBuyFeeBps: 50,
      lpSellFeeBps: 50,
      stakingFeeShareBps: 2000,
      bronzeMin: 1000,
      bronzeDiscount: 500,
      silverMin: 5000,
      silverDiscount: 1000,
      goldMin: 20000,
      goldDiscount: 1500,
      diamondMin: 100000,
      diamondDiscount: 2000,
    }),
    []
  );

  // ── depositCollateral (v1) ────────────────────────────────────────

  const depositCollateral = useCallback(
    async (marketPubkey: PublicKey, amount: number): Promise<string | undefined> => {
      if (!wallet.isConnected) {
        toast.error("Please connect your wallet first");
        return undefined;
      }
      const market = findMarketByKey(marketPubkey);
      if (!market) {
        toast.error("Market not found");
        return undefined;
      }
      await delay(1500);

      // 1 deposit = mint TOKEN_MULTIPLIER YES + TOKEN_MULTIPLIER NO tokens
      const TOKEN_MULTIPLIER = 1_000_000;
      const pairs = amount; // amount in lamports
      const tokensPerPair = TOKEN_MULTIPLIER;

      updateUserBalance(market.publicKey, {
        yes: (userBalances[market.publicKey]?.yes ?? 0) + pairs * tokensPerPair / LAMPORTS_PER_SOL,
        no: (userBalances[market.publicKey]?.no ?? 0) + pairs * tokensPerPair / LAMPORTS_PER_SOL,
      });
      adjustWalletBalance(-amount / LAMPORTS_PER_SOL);
      toast.success("Collateral deposited — YES + NO tokens minted!");
      return fakeTxSig();
    },
    [wallet.isConnected, userBalances, updateUserBalance, adjustWalletBalance]
  );

  // ── withdrawCollateral (v1) ───────────────────────────────────────

  const withdrawCollateral = useCallback(
    async (marketPubkey: PublicKey, pairs: number): Promise<string | undefined> => {
      if (!wallet.isConnected) {
        toast.error("Please connect your wallet first");
        return undefined;
      }
      const market = findMarketByKey(marketPubkey);
      if (!market) {
        toast.error("Market not found");
        return undefined;
      }

      const balances = userBalances[market.publicKey] ?? { yes: 0, no: 0 };
      if (balances.yes < pairs || balances.no < pairs) {
        toast.error("Insufficient YES/NO token pairs to burn");
        return undefined;
      }

      await delay(1500);
      updateUserBalance(market.publicKey, {
        yes: balances.yes - pairs,
        no: balances.no - pairs,
      });
      adjustWalletBalance(pairs / LAMPORTS_PER_SOL);
      toast.success("Collateral withdrawn — token pairs burned!");
      return fakeTxSig();
    },
    [wallet.isConnected, userBalances, updateUserBalance, adjustWalletBalance]
  );

  // ── swapV2 (v1 conditional token swap YES <-> NO) ─────────────────

  const swapV2 = useCallback(
    async (
      marketPubkey: PublicKey,
      amountIn: number,
      _minAmountOut: number,
      buyYes: boolean
    ): Promise<string | undefined> => {
      if (!wallet.isConnected) {
        toast.error("Please connect your wallet first");
        return undefined;
      }
      const market = findMarketByKey(marketPubkey);
      if (!market) {
        toast.error("Market not found");
        return undefined;
      }
      if (market.isCompleted) {
        toast.error("Market is resolved");
        return undefined;
      }

      const reserves = getReserves(market, marketReserves);

      await delay(1500);

      if (buyYes) {
        // Sell NO -> buy YES via AMM
        const balances = userBalances[market.publicKey] ?? { yes: 0, no: 0 };
        if (balances.no < amountIn) {
          toast.error("Insufficient NO tokens");
          return undefined;
        }
        // Constant product: amountIn NO tokens -> YES tokens out
        const yesOut = constantProductBuyOutput(
          amountIn,
          reserves.noTokenReserves,
          reserves.yesTokenReserves
        );
        updateReserves(market.publicKey, {
          noTokenReserves: reserves.noTokenReserves + amountIn,
          yesTokenReserves: reserves.yesTokenReserves - yesOut,
        });
        updateUserBalance(market.publicKey, {
          no: balances.no - amountIn,
          yes: balances.yes + yesOut,
        });
      } else {
        // Sell YES -> buy NO via AMM
        const balances = userBalances[market.publicKey] ?? { yes: 0, no: 0 };
        if (balances.yes < amountIn) {
          toast.error("Insufficient YES tokens");
          return undefined;
        }
        const noOut = constantProductBuyOutput(
          amountIn,
          reserves.yesTokenReserves,
          reserves.noTokenReserves
        );
        updateReserves(market.publicKey, {
          yesTokenReserves: reserves.yesTokenReserves + amountIn,
          noTokenReserves: reserves.noTokenReserves - noOut,
        });
        updateUserBalance(market.publicKey, {
          yes: balances.yes - amountIn,
          no: balances.no + noOut,
        });
      }

      toast.success("Swap confirmed!");
      return fakeTxSig();
    },
    [wallet.isConnected, marketReserves, userBalances, updateReserves, updateUserBalance]
  );

  // ── claimWinningsV2 (v1 conditional token) ────────────────────────

  const claimWinningsV2 = useCallback(
    async (marketPubkey: PublicKey): Promise<string | undefined> => {
      if (!wallet.isConnected) {
        toast.error("Please connect your wallet first");
        return undefined;
      }
      const market = findMarketByKey(marketPubkey);
      if (!market) {
        toast.error("Market not found");
        return undefined;
      }
      if (!market.isCompleted) {
        toast.error("Market not resolved yet");
        return undefined;
      }

      const balances = userBalances[market.publicKey] ?? { yes: 0, no: 0 };
      const isYesWin = market.winningOutcome === 0;
      const winningTokens = isYesWin ? balances.yes : balances.no;

      if (winningTokens <= 0) {
        toast.error("No winning tokens to claim");
        return undefined;
      }

      await delay(1500);

      // v1: 1 winning token = 1 SOL face value (per TOKEN_MULTIPLIER)
      const TOKEN_MULTIPLIER = 1_000_000;
      const payout = (winningTokens / TOKEN_MULTIPLIER) * LAMPORTS_PER_SOL;
      adjustWalletBalance(payout / LAMPORTS_PER_SOL);
      updateUserBalance(market.publicKey, { yes: 0, no: 0 });

      toast.success(`Claimed ${(payout / LAMPORTS_PER_SOL).toFixed(4)} SOL!`);
      return fakeTxSig();
    },
    [wallet.isConnected, userBalances, adjustWalletBalance, updateUserBalance]
  );

  return {
    createMarket,
    createMarketWithOptions,
    initializeMaster,
    swap,
    resolution,
    resolveViaOracle,
    claimWinnings,
    getUserTokenBalances,
    calculateTokensForSolAmount,
    calculateBuyOutput,
    getMarket,
    getAllMarkets,
    updateMarket,
    getConfigTiers,
    depositCollateral,
    withdrawCollateral,
    swapV2,
    claimWinningsV2,
    program: null,
  };
}
