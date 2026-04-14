"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { toast } from "sonner";

import {
  useMockChainStore,
  useMockWalletStore,
} from "@/lib/mock/stores/mock-chain-store";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LAMPORTS_PER_SOL = 1_000_000_000;
const TOKEN_MULTIPLIER = 1_000_000; // OYRADE_DECIMALS = 6

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function fakeTxSig(): string {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let sig = "";
  for (let i = 0; i < 88; i++) sig += chars[Math.floor(Math.random() * chars.length)];
  return sig;
}

// ---------------------------------------------------------------------------
// Static mock pool config
// ---------------------------------------------------------------------------

const MOCK_POOL = {
  authority: new PublicKey("4RQ8yjeGKNTfUTBZt3vHUPFiqzSygq6rXFNkFoGmuDrQ"),
  stakingMint: new PublicKey("DfnxGQUsXdDH7DYdroeeSBG8etqTy1kufxBikHwTTGTa"),
  stakingVault: PublicKey.default,
  rewardPerTokenStored: "0",
  rewardRate: 50_000_000, // ~4.32 XLM/day (50_000_000 lamports/sec * 86400 / 1e9)
  rewardDuration: 86_400 * 30, // 30 days
  rewardDurationEnd: Math.floor(Date.now() / 1000) + 86_400 * 25,
  lastUpdateTime: Math.floor(Date.now() / 1000) - 3600,
  bump: 255,
  rewardVaultBump: 254,
  paused: false,
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useStaking() {
  const wallet = useMockWalletStore();
  const { stakedAmount, pendingRewards, setStaking, adjustWalletBalance, walletBalance } =
    useMockChainStore();

  const [estimatedRewards, setEstimatedRewards] = useState(pendingRewards / LAMPORTS_PER_SOL);
  const [isProcessing, setIsProcessing] = useState(false);
  const rewardTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Live Reward Estimation (1s interval) ─────────────────────────────

  useEffect(() => {
    if (rewardTimerRef.current) {
      clearInterval(rewardTimerRef.current);
      rewardTimerRef.current = null;
    }

    if (stakedAmount <= 0) {
      setEstimatedRewards(pendingRewards / LAMPORTS_PER_SOL);
      return;
    }

    const calculate = () => {
      // Accumulate a small reward tick per second
      const ratePerSecond = MOCK_POOL.rewardRate / LAMPORTS_PER_SOL;
      const share = stakedAmount / (stakedAmount + 1_000_000 * TOKEN_MULTIPLIER); // mock total pool
      setEstimatedRewards((prev: number) => prev + ratePerSecond * share);
    };

    calculate();
    rewardTimerRef.current = setInterval(calculate, 1000);

    return () => {
      if (rewardTimerRef.current) clearInterval(rewardTimerRef.current);
    };
  }, [stakedAmount, pendingRewards]);

  // ── Pool data (static) ──────────────────────────────────────────────

  const poolData = {
    ...MOCK_POOL,
    totalStaked: stakedAmount + 2_450_000 * TOKEN_MULTIPLIER, // 2.45M XLM staked by other users
  };

  // ── User data ───────────────────────────────────────────────────────

  const userData = stakedAmount > 0 || pendingRewards > 0
    ? {
        pool: PublicKey.default,
        owner: wallet.address ? new PublicKey(wallet.address) : PublicKey.default,
        balanceStaked: stakedAmount,
        rewardPerTokenCompleted: "0",
        rewardPending: pendingRewards,
        stakeTimestamp: Math.floor(Date.now() / 1000) - 86_400,
        bump: 255,
      }
    : null;

  // ── XLM balance (mock: 125,000 XLM in wallet) ─────────────────────

  const oyradeBalance = 125_000 * TOKEN_MULTIPLIER;

  // ── APY ────────────────────────────────────────────────────────────

  const apy = poolData.totalStaked > 0
    ? ((MOCK_POOL.rewardRate * 86_400 * 365) / LAMPORTS_PER_SOL / (poolData.totalStaked / TOKEN_MULTIPLIER)) * 100
    : 0;

  // ── Mutations ──────────────────────────────────────────────────────

  const stake = useCallback(
    async (amount: number): Promise<string | undefined> => {
      if (!wallet.isConnected) {
        toast.error("Please connect your wallet first");
        return undefined;
      }
      setIsProcessing(true);
      try {
        await delay(1000);
        const amountRaw = Math.floor(amount * TOKEN_MULTIPLIER);
        setStaking(stakedAmount + amountRaw, pendingRewards);
        toast.success("Stake XLM confirmed!");
        return fakeTxSig();
      } finally {
        setIsProcessing(false);
      }
    },
    [wallet.isConnected, stakedAmount, pendingRewards, setStaking]
  );

  const unstake = useCallback(
    async (amount: number): Promise<string | undefined> => {
      if (!wallet.isConnected) {
        toast.error("Please connect your wallet first");
        return undefined;
      }
      const amountRaw = Math.floor(amount * TOKEN_MULTIPLIER);
      if (amountRaw > stakedAmount) {
        toast.error("Insufficient staked balance");
        return undefined;
      }
      setIsProcessing(true);
      try {
        await delay(1000);
        setStaking(stakedAmount - amountRaw, pendingRewards);
        toast.success("Unstake XLM confirmed!");
        return fakeTxSig();
      } finally {
        setIsProcessing(false);
      }
    },
    [wallet.isConnected, stakedAmount, pendingRewards, setStaking]
  );

  const claim = useCallback(
    async (): Promise<string | undefined> => {
      if (!wallet.isConnected) {
        toast.error("Please connect your wallet first");
        return undefined;
      }
      if (estimatedRewards <= 0) {
        toast.error("No rewards to claim");
        return undefined;
      }
      setIsProcessing(true);
      try {
        await delay(1000);
        adjustWalletBalance(estimatedRewards);
        setStaking(stakedAmount, 0);
        setEstimatedRewards(0);
        toast.success(`Claimed ${estimatedRewards.toFixed(6)} XLM rewards!`);
        return fakeTxSig();
      } finally {
        setIsProcessing(false);
      }
    },
    [wallet.isConnected, estimatedRewards, stakedAmount, setStaking, adjustWalletBalance]
  );

  const initializePool = useCallback(
    async (_rewardDurationDays?: number): Promise<string | undefined> => {
      await delay(1000);
      toast.success("Staking pool initialized (mock)!");
      return fakeTxSig();
    },
    []
  );

  const fundPool = useCallback(
    async (amount: number): Promise<string | undefined> => {
      if (!wallet.isConnected) {
        toast.error("Please connect your wallet first");
        return undefined;
      }
      setIsProcessing(true);
      try {
        await delay(1000);
        adjustWalletBalance(-amount);
        toast.success(`Funded reward pool with ${amount} XLM!`);
        return fakeTxSig();
      } finally {
        setIsProcessing(false);
      }
    },
    [wallet.isConnected, adjustWalletBalance]
  );

  const distributeFees = useCallback(
    async (): Promise<string | undefined> => {
      await delay(1000);
      toast.success("Trading fees distributed to reward pool!");
      return fakeTxSig();
    },
    []
  );

  const createUser = useCallback(
    async (): Promise<string | undefined> => {
      await delay(500);
      toast.success("Staking account created!");
      return fakeTxSig();
    },
    []
  );

  return {
    // Pool state
    poolData,
    poolLoading: false,

    // User state
    userData,
    userLoading: false,
    hasUserAccount: userData !== null,

    // Balances
    oyradeBalance,
    oyradeBalanceFormatted: oyradeBalance / TOKEN_MULTIPLIER,
    vaultBalanceSol: 48_750.25, // mock vault balance in XLM

    // Computed
    estimatedRewards,
    apy,

    // Connection state
    isConnected: wallet.isConnected,
    address: wallet.address,

    // Authority
    isAuthority: true, // admin in mock mode

    // Pool existence
    poolExists: true,

    // Mutations
    initializePool,
    stake,
    unstake,
    claim,
    fundPool,
    distributeFees,
    createUser,

    // Loading
    isProcessing,
  };
}
