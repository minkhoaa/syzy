"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import {
  PublicKey,
  Transaction,
  Connection,
  VersionedTransaction,
  SystemProgram,
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL,
  Keypair,
} from "@solana/web3.js";
import {
  Program,
  AnchorProvider,
  Idl,
  BN,
} from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiClient } from "@/lib/kubb";
import REWARD_POOL_IDL_JSON from "@/lib/constants/REWARD_POOL_IDL.json";
import {
  OYRADE_MINT,
  OYRADE_DECIMALS,
  PRECISION,
  getPoolPda,
  getRewardVaultPda,
  getUserPda,
} from "@/lib/constants/staking";
import { RPC_URL, CLUSTER } from "@/lib/constants/network";

const rewardPoolIdl =
  (REWARD_POOL_IDL_JSON as { default?: unknown }).default ?? REWARD_POOL_IDL_JSON;

const TOKEN_MULTIPLIER = 10 ** OYRADE_DECIMALS;

export function useStaking() {
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("solana");
  const queryClient = useQueryClient();

  const [estimatedRewards, setEstimatedRewards] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const connection = useMemo(() => new Connection(RPC_URL, CLUSTER), []);

  const [poolPda] = useMemo(() => getPoolPda(), []);

  // ── Provider & Program ───────────────────────────────────────────────

  const getProvider = useCallback(() => {
    if (!walletProvider || !address) return null;
    const anchorWallet = {
      publicKey: new PublicKey(address),
      signTransaction: async <T extends Transaction | VersionedTransaction>(
        tx: T
      ): Promise<T> => {
        return await (
          walletProvider as { signTransaction: (tx: T) => Promise<T> }
        ).signTransaction(tx);
      },
      signAllTransactions: async <
        T extends Transaction | VersionedTransaction,
      >(
        txs: T[]
      ): Promise<T[]> => {
        return await (
          walletProvider as { signAllTransactions: (txs: T[]) => Promise<T[]> }
        ).signAllTransactions(txs);
      },
    };
    return new AnchorProvider(connection, anchorWallet, {
      commitment: "confirmed",
    });
  }, [address, walletProvider, connection]);

  const getProgram = useCallback(() => {
    const provider = getProvider();
    if (!provider) return null;
    return new Program(rewardPoolIdl as Idl, provider);
  }, [getProvider]);

  const getReadOnlyProgram = useCallback(() => {
    const dummyWallet = {
      publicKey: PublicKey.default,
      signTransaction: async <T extends Transaction | VersionedTransaction>(
        tx: T
      ): Promise<T> => tx,
      signAllTransactions: async <
        T extends Transaction | VersionedTransaction,
      >(
        txs: T[]
      ): Promise<T[]> => txs,
    };
    const readOnlyProvider = new AnchorProvider(connection, dummyWallet, {
      commitment: "confirmed",
    });
    return new Program(rewardPoolIdl as Idl, readOnlyProvider);
  }, [connection]);

  // ── Read Queries ─────────────────────────────────────────────────────

  const poolQuery = useQuery({
    queryKey: ["staking", "pool"],
    queryFn: async () => {
      const program = getReadOnlyProgram();
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pool = await (program.account as any).rewardPool.fetch(poolPda);
        return {
          authority: pool.authority as PublicKey,
          stakingMint: pool.stakingMint as PublicKey,
          stakingVault: pool.stakingVault as PublicKey,
          totalStaked: (pool.totalStaked as BN).toNumber(),
          rewardPerTokenStored: (pool.rewardPerTokenStored as BN).toString(),
          rewardRate: (pool.rewardRate as BN).toNumber(),
          rewardDuration: (pool.rewardDuration as BN).toNumber(),
          rewardDurationEnd: (pool.rewardDurationEnd as BN).toNumber(),
          lastUpdateTime: (pool.lastUpdateTime as BN).toNumber(),
          bump: pool.bump as number,
          rewardVaultBump: pool.rewardVaultBump as number,
          paused: pool.paused as boolean,
        };
      } catch {
        // Pool doesn't exist yet
        return null;
      }
    },
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  const userQuery = useQuery({
    queryKey: ["staking", "user", address],
    queryFn: async () => {
      if (!address) return null;
      const program = getReadOnlyProgram();
      const owner = new PublicKey(address);
      const [userPda] = getUserPda(poolPda, owner);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = await (program.account as any).stakeUser.fetch(userPda);
        return {
          pool: user.pool as PublicKey,
          owner: user.owner as PublicKey,
          balanceStaked: (user.balanceStaked as BN).toNumber(),
          rewardPerTokenCompleted: (
            user.rewardPerTokenCompleted as BN
          ).toString(),
          rewardPending: (user.rewardPending as BN).toNumber(),
          stakeTimestamp: (user.stakeTimestamp as BN).toNumber(),
          bump: user.bump as number,
        };
      } catch {
        // Account doesn't exist yet
        return null;
      }
    },
    enabled: !!address,
    refetchInterval: 15_000,
    staleTime: 5_000,
  });

  const oyradeBalanceQuery = useQuery({
    queryKey: ["staking", "oyradeBalance", address],
    queryFn: async () => {
      if (!address) return 0;
      const owner = new PublicKey(address);
      const ata = await getAssociatedTokenAddress(OYRADE_MINT, owner);
      try {
        const balance = await connection.getTokenAccountBalance(ata);
        return Number(balance.value.amount);
      } catch {
        return 0;
      }
    },
    enabled: !!address,
    refetchInterval: 15_000,
    staleTime: 5_000,
  });

  const vaultBalanceQuery = useQuery({
    queryKey: ["staking", "vaultBalance"],
    queryFn: async () => {
      const [rewardVaultPda] = getRewardVaultPda(poolPda);
      const balance = await connection.getBalance(rewardVaultPda);
      return balance;
    },
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  // ── Derived Data ─────────────────────────────────────────────────────

  const poolData = poolQuery.data ?? null;
  const userData = userQuery.data ?? null;
  const oyradeBalance = oyradeBalanceQuery.data ?? 0;
  const vaultBalance = vaultBalanceQuery.data ?? 0;
  const hasUserAccount = userData !== null;

  const adminQuery = useQuery({
    queryKey: ["staking", "isAdmin", address],
    queryFn: async () => {
      if (!address) return false;
      // Check on-chain pool authority
      if (poolData && poolData.authority.toBase58() === address) return true;
      // Check backend admin list
      try {
        const res = await apiClient.get<{ success: boolean; data: { isAdmin: boolean } }>(
          `/api/admin/check/${address}`
        );
        return res.data.data.isAdmin;
      } catch {
        return false;
      }
    },
    enabled: !!address,
    staleTime: 60_000,
  });

  const isAuthority = adminQuery.data ?? false;

  // APY calculation: (reward_rate * 86400 * 365 / total_staked_in_lamports_equivalent) * 100
  const apy = useMemo(() => {
    if (!poolData || poolData.totalStaked === 0) return 0;
    const annualRewardsLamports = poolData.rewardRate * 86400 * 365;
    const annualRewardsSol = annualRewardsLamports / LAMPORTS_PER_SOL;
    // Assume rough SOL/OYRADE price ratio = 1 SOL per 1000 OYRADE for APY display
    // In production this would use a price oracle
    const totalStakedTokens = poolData.totalStaked / TOKEN_MULTIPLIER;
    if (totalStakedTokens === 0) return 0;
    // Return the raw SOL yield per OYRADE staked (annualized)
    // This is the SOL amount per 1 OYRADE staked per year
    return (annualRewardsSol / totalStakedTokens) * 100;
  }, [poolData]);

  // ── Live Reward Estimation (1s interval) ─────────────────────────────

  const rewardTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset estimated rewards when not actively staking (render-time adjustment)
  const activeStaking = !!(poolData && userData && userData.balanceStaked > 0);
  const [prevActiveStaking, setPrevActiveStaking] = useState(activeStaking);
  const baseReward = userData ? userData.rewardPending / LAMPORTS_PER_SOL : 0;
  const [prevBaseReward, setPrevBaseReward] = useState(baseReward);
  if (prevActiveStaking !== activeStaking || (!activeStaking && prevBaseReward !== baseReward)) {
    setPrevActiveStaking(activeStaking);
    setPrevBaseReward(baseReward);
    if (!activeStaking) {
      setEstimatedRewards(baseReward);
    }
  }

  useEffect(() => {
    if (rewardTimerRef.current) {
      clearInterval(rewardTimerRef.current);
      rewardTimerRef.current = null;
    }

    if (!poolData || !userData || userData.balanceStaked === 0) return;

    const calculate = () => {
      const now = Math.floor(Date.now() / 1000);
      const lastTimeApplicable = Math.min(now, poolData.rewardDurationEnd);
      const timeElapsed = Math.max(
        0,
        lastTimeApplicable - poolData.lastUpdateTime
      );

      let rewardPerToken = BigInt(poolData.rewardPerTokenStored);
      if (poolData.totalStaked > 0) {
        const additional =
          (BigInt(timeElapsed) * BigInt(poolData.rewardRate) * PRECISION) /
          BigInt(poolData.totalStaked);
        rewardPerToken += additional;
      }

      const userCompleted = BigInt(userData.rewardPerTokenCompleted);
      const earned =
        ((rewardPerToken - userCompleted) * BigInt(userData.balanceStaked)) /
          PRECISION +
        BigInt(userData.rewardPending);

      setEstimatedRewards(Number(earned) / LAMPORTS_PER_SOL);
    };

    calculate();
    rewardTimerRef.current = setInterval(calculate, 1000);

    return () => {
      if (rewardTimerRef.current) clearInterval(rewardTimerRef.current);
    };
  }, [poolData, userData]);

  // ── Helper: Send Transaction ─────────────────────────────────────────

  const sendTx = useCallback(
    async (tx: Transaction, label: string) => {
      if (!walletProvider || !address) throw new Error("Wallet not connected");

      const feePayer = new PublicKey(address);

      tx.add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1 })
      );

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      tx.recentBlockhash = blockhash;
      tx.feePayer = feePayer;

      let sig: string;
      if (
        (
          walletProvider as {
            signAndSendTransaction?: (
              tx: Transaction
            ) => Promise<{ signature?: string } | string>;
          }
        ).signAndSendTransaction
      ) {
        const result = await (
          walletProvider as {
            signAndSendTransaction: (
              tx: Transaction
            ) => Promise<{ signature?: string } | string>;
          }
        ).signAndSendTransaction(tx);
        sig = typeof result === "string" ? result : (result.signature ?? "");
      } else {
        const signed = await (
          walletProvider as {
            signTransaction: (tx: Transaction) => Promise<Transaction>;
          }
        ).signTransaction(tx);
        sig = await connection.sendRawTransaction(signed.serialize(), {
          skipPreflight: true,
        });
      }

      await connection.confirmTransaction(
        { signature: sig, blockhash, lastValidBlockHeight },
        "confirmed"
      );
      toast.success(`${label} confirmed!`);
      return sig;
    },
    [walletProvider, address, connection]
  );

  // ── Mutations ────────────────────────────────────────────────────────

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["staking"] });
  }, [queryClient]);

  const initializePoolMutation = useMutation({
    mutationFn: async (rewardDurationDays: number) => {
      const program = getProgram();
      if (!program || !address) throw new Error("Wallet not connected");
      setIsProcessing(true);

      const authority = new PublicKey(address);
      const [rewardVaultPda] = getRewardVaultPda(poolPda);
      const stakingVaultKeypair = Keypair.generate();
      const rewardDuration = new BN(Math.floor(rewardDurationDays * 86400));

      const tx = await program.methods
        .initializePool(rewardDuration)
        .accounts({
          authority,
          stakingMint: OYRADE_MINT,
          stakingVault: stakingVaultKeypair.publicKey,
          pool: poolPda,
          rewardVault: rewardVaultPda,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: new PublicKey("SysvarRent111111111111111111111111111111111"),
        })
        .transaction();

      // staking_vault is an `init` account — needs to sign
      if (!walletProvider || !address) throw new Error("Wallet not connected");
      const feePayer = new PublicKey(address);

      tx.add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1 })
      );

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      tx.recentBlockhash = blockhash;
      tx.feePayer = feePayer;

      // Partially sign with the staking vault keypair
      tx.partialSign(stakingVaultKeypair);

      // Then sign with wallet and send
      const signed = await (
        walletProvider as {
          signTransaction: (tx: Transaction) => Promise<Transaction>;
        }
      ).signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: true,
      });

      await connection.confirmTransaction(
        { signature: sig, blockhash, lastValidBlockHeight },
        "confirmed"
      );
      toast.success("Staking pool initialized!");
      return sig;
    },
    onSuccess: invalidateAll,
    onSettled: () => setIsProcessing(false),
    onError: (err) => {
      toast.error(`Initialize pool failed: ${(err as Error).message}`);
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async () => {
      const program = getProgram();
      if (!program || !address) throw new Error("Wallet not connected");
      const owner = new PublicKey(address);
      const [userPda] = getUserPda(poolPda, owner);

      const tx = await program.methods
        .createUser()
        .accounts({
          owner,
          pool: poolPda,
          stakeUser: userPda,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      return sendTx(tx, "Create staking account");
    },
    onSuccess: invalidateAll,
  });

  const stakeMutation = useMutation({
    mutationFn: async (amount: number) => {
      const program = getProgram();
      if (!program || !address) throw new Error("Wallet not connected");
      setIsProcessing(true);

      const owner = new PublicKey(address);
      const [userPda] = getUserPda(poolPda, owner);
      const userAta = await getAssociatedTokenAddress(OYRADE_MINT, owner);

      const pool = poolQuery.data;
      if (!pool) throw new Error("Pool data not loaded");

      const amountBN = new BN(Math.floor(amount * TOKEN_MULTIPLIER));

      // Check if user account exists, create if needed
      let needsCreateUser = false;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (program.account as any).stakeUser.fetch(userPda);
      } catch {
        needsCreateUser = true;
      }

      if (needsCreateUser) {
        const createTx = await program.methods
          .createUser()
          .accounts({
            owner,
            pool: poolPda,
            stakeUser: userPda,
            systemProgram: SystemProgram.programId,
          })
          .transaction();
        await sendTx(createTx, "Create staking account");
      }

      const stakeTx = await program.methods
        .stake(amountBN)
        .accounts({
          owner,
          pool: poolPda,
          stakingVault: pool.stakingVault,
          stakeUser: userPda,
          userStakingAta: userAta,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .transaction();

      return sendTx(stakeTx, "Stake SYZY");
    },
    onSuccess: invalidateAll,
    onSettled: () => setIsProcessing(false),
    onError: (err) => {
      toast.error(`Stake failed: ${(err as Error).message}`);
    },
  });

  const unstakeMutation = useMutation({
    mutationFn: async (amount: number) => {
      const program = getProgram();
      if (!program || !address) throw new Error("Wallet not connected");
      setIsProcessing(true);

      const owner = new PublicKey(address);
      const [userPda] = getUserPda(poolPda, owner);
      const [rewardVaultPda] = getRewardVaultPda(poolPda);
      const userAta = await getAssociatedTokenAddress(OYRADE_MINT, owner);

      const pool = poolQuery.data;
      if (!pool) throw new Error("Pool data not loaded");

      const amountBN = new BN(Math.floor(amount * TOKEN_MULTIPLIER));

      const tx = await program.methods
        .unstake(amountBN)
        .accounts({
          owner,
          pool: poolPda,
          stakingVault: pool.stakingVault,
          stakeUser: userPda,
          userStakingAta: userAta,
          rewardVault: rewardVaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      return sendTx(tx, "Unstake SYZY");
    },
    onSuccess: invalidateAll,
    onSettled: () => setIsProcessing(false),
    onError: (err) => {
      toast.error(`Unstake failed: ${(err as Error).message}`);
    },
  });

  const fundPoolMutation = useMutation({
    mutationFn: async (amount: number) => {
      const program = getProgram();
      if (!program || !address) throw new Error("Wallet not connected");
      setIsProcessing(true);

      const funder = new PublicKey(address);
      const [rewardVaultPda] = getRewardVaultPda(poolPda);
      const amountBN = new BN(Math.floor(amount * LAMPORTS_PER_SOL));

      const tx = await program.methods
        .fund(amountBN)
        .accounts({
          funder,
          pool: poolPda,
          rewardVault: rewardVaultPda,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      return sendTx(tx, "Fund reward pool");
    },
    onSuccess: invalidateAll,
    onSettled: () => setIsProcessing(false),
    onError: (err) => {
      toast.error(`Fund failed: ${(err as Error).message}`);
    },
  });

  const distributeFeeMutation = useMutation({
    mutationFn: async () => {
      const program = getProgram();
      if (!program || !address) throw new Error("Wallet not connected");
      setIsProcessing(true);

      const caller = new PublicKey(address);
      const [rewardVaultPda] = getRewardVaultPda(poolPda);

      const tx = await program.methods
        .distributeFees()
        .accounts({
          caller,
          pool: poolPda,
          rewardVault: rewardVaultPda,
        })
        .transaction();

      return sendTx(tx, "Activate trading fees");
    },
    onSuccess: invalidateAll,
    onSettled: () => setIsProcessing(false),
    onError: (err) => {
      toast.error(`Distribute fees failed: ${(err as Error).message}`);
    },
  });

  const claimMutation = useMutation({
    mutationFn: async () => {
      const program = getProgram();
      if (!program || !address) throw new Error("Wallet not connected");
      setIsProcessing(true);

      const owner = new PublicKey(address);
      const [userPda] = getUserPda(poolPda, owner);
      const [rewardVaultPda] = getRewardVaultPda(poolPda);

      const tx = await program.methods
        .claim()
        .accounts({
          owner,
          pool: poolPda,
          stakeUser: userPda,
          rewardVault: rewardVaultPda,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      return sendTx(tx, "Claim SOL rewards");
    },
    onSuccess: invalidateAll,
    onSettled: () => setIsProcessing(false),
    onError: (err) => {
      toast.error(`Claim failed: ${(err as Error).message}`);
    },
  });

  return {
    // Pool state
    poolData,
    poolLoading: poolQuery.isLoading,

    // User state
    userData,
    userLoading: userQuery.isLoading,
    hasUserAccount,

    // Balances
    oyradeBalance,
    oyradeBalanceFormatted: oyradeBalance / TOKEN_MULTIPLIER,
    vaultBalanceSol: vaultBalance / LAMPORTS_PER_SOL,

    // Computed
    estimatedRewards,
    apy,

    // Connection state
    isConnected,
    address,

    // Authority
    isAuthority,

    // Pool existence
    poolExists: poolData !== null,

    // Mutations
    initializePool: initializePoolMutation.mutateAsync,
    stake: stakeMutation.mutateAsync,
    unstake: unstakeMutation.mutateAsync,
    claim: claimMutation.mutateAsync,
    fundPool: fundPoolMutation.mutateAsync,
    distributeFees: distributeFeeMutation.mutateAsync,
    createUser: createUserMutation.mutateAsync,

    // Loading
    isProcessing:
      isProcessing ||
      initializePoolMutation.isPending ||
      stakeMutation.isPending ||
      unstakeMutation.isPending ||
      claimMutation.isPending ||
      fundPoolMutation.isPending ||
      distributeFeeMutation.isPending ||
      createUserMutation.isPending,
  };
}
