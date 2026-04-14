"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import {
  PublicKey,
  Transaction,
  Connection,
  VersionedTransaction,
  TransactionMessage,
  SystemProgram,
  ComputeBudgetProgram,
  SYSVAR_CLOCK_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  Program,
  AnchorProvider,
  Idl,
  BN,
  web3,
} from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  MINT_SIZE,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  createSetAuthorityInstruction,
  AuthorityType,
} from "@solana/spl-token";
import { toast } from "sonner";
import bs58 from "bs58";

import { useMetrics } from "@/features/analytics/hooks/use-metrics";
import type { PredictionMarket } from "@/lib/types/prediction-market";
import type {
  UsePredictionMarketReturn,
  CreateMarketResult,
  CreateMarketOptions,
  MarketAccount,
} from "@/types/prediction-market.types";
import IDLJson from "@/lib/constants/IDL.json";
import { fetchFeedUpdateIx } from "@/lib/switchboard/feed";
import {
  PROGRAM_ID,
  SEED_CONFIG,
  SEED_GLOBAL,
  SEED_MARKET,
  SEED_USERINFO,
  SEED_SHIELDED_POOL,
  SEED_SHARD,
  SEED_LEAVES,
  SEED_SUBTREE,
  SEED_MARKET_V1_CONFIG,
  Outcome,
  Side,
} from "@/lib/constants/programs";
import { RPC_URL, CLUSTER } from "@/lib/constants/network";
import {
  REWARD_POOL_PROGRAM_ID,
  OYRADE_MINT,
  getPoolPda,
  getUserPda as getStakeUserPda,
} from "@/lib/constants/staking";

const predictionMarketIdl = (IDLJson as { default?: unknown }).default ?? IDLJson;

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
    initialYesTokenReserves: get(
      "initialYesTokenReserves",
      "initial_yes_token_reserves"
    ) as BN,
    realYesTokenReserves: get(
      "realYesTokenReserves",
      "real_yes_token_reserves"
    ) as BN,
    realYesSolReserves: get(
      "realYesSolReserves",
      "real_yes_sol_reserves"
    ) as BN,
    tokenYesTotalSupply: get(
      "tokenYesTotalSupply",
      "token_yes_total_supply"
    ) as BN,
    initialNoTokenReserves: get(
      "initialNoTokenReserves",
      "initial_no_token_reserves"
    ) as BN,
    realNoTokenReserves: get(
      "realNoTokenReserves",
      "real_no_token_reserves"
    ) as BN,
    realNoSolReserves: get(
      "realNoSolReserves",
      "real_no_sol_reserves"
    ) as BN,
    tokenNoTotalSupply: get(
      "tokenNoTotalSupply",
      "token_no_total_supply"
    ) as BN,
    isCompleted: (get("isCompleted", "is_completed") as boolean) ?? false,
    winningOutcome:
      (get("winningOutcome", "winning_outcome") as number | null | undefined) ??
      null,
    startSlot: (get("startSlot", "start_slot") as BN | null | undefined) ?? null,
    endingSlot:
      (get("endingSlot", "ending_slot") as BN | null | undefined) ?? null,
    startDate: (get("startDate", "start_date") as BN | null | undefined) ?? null,
    endDate: (get("endDate", "end_date") as BN | null | undefined) ?? null,
    lps: ((get("lps") as { lpAddress?: PublicKey; lp_address?: PublicKey; amount: BN }[]) ?? []).map(
      (lp) => ({
        lpAddress: (lp.lpAddress ?? lp.lp_address) as PublicKey,
        amount: lp.amount,
      })
    ),
    totalLpAmount: get("totalLpAmount", "total_lp_amount") as BN,

    // Oracle resolution fields
    oracleFeed: (get("oracleFeed", "oracle_feed") as PublicKey | null | undefined) ?? null,
    priceTarget: (get("priceTarget", "price_target") as BN | null | undefined) ?? null,
    comparisonType: (get("comparisonType", "comparison_type") as number | null | undefined) ?? null,
    metricType: (get("metricType", "metric_type") as number | null | undefined) ?? null,
    oracleResolutionFinished: (get("oracleResolutionFinished", "oracle_resolution_finished") as boolean | undefined) ?? false,
    resolvedAt: (get("resolvedAt", "resolved_at") as BN | null | undefined) ?? null,
    resolvedBy: (get("resolvedBy", "resolved_by") as number | null | undefined) ?? null,
  };
}

export function usePredictionMarket(): UsePredictionMarketReturn {
  const { address } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("solana");
  const { trackTradeInitiated, trackTradeConfirmed, trackTradeFailed } = useMetrics();

  const connection = useMemo(() => new Connection(RPC_URL, CLUSTER), []);
  const pendingTxs = useRef<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  const getProvider = useCallback(() => {
    if (!walletProvider || !address) return null;
    const anchorWallet = {
      publicKey: new PublicKey(address),
      signTransaction: async <T extends Transaction | VersionedTransaction>(
        tx: T
      ): Promise<T> => {
        return await (walletProvider as { signTransaction: (tx: T) => Promise<T> }).signTransaction(tx);
      },
      signAllTransactions: async <T extends Transaction | VersionedTransaction>(
        txs: T[]
      ): Promise<T[]> => {
        return await (walletProvider as { signAllTransactions: (txs: T[]) => Promise<T[]> }).signAllTransactions(txs);
      },
    };
    return new AnchorProvider(connection, anchorWallet, {
      commitment: "confirmed",
    });
  }, [address, walletProvider, connection]);

  const getProgram = useCallback(() => {
    const provider = getProvider();
    if (!provider) return null;
    return new Program(
      predictionMarketIdl as Idl,
      provider
    ) as unknown as Program<PredictionMarket>;
  }, [getProvider]);

  const getReadOnlyProgram = useCallback(() => {
    const dummyWallet = {
      publicKey: PublicKey.default,
      signTransaction: async <T extends Transaction | VersionedTransaction>(
        tx: T
      ): Promise<T> => tx,
      signAllTransactions: async <T extends Transaction | VersionedTransaction>(
        txs: T[]
      ): Promise<T[]> => txs,
    };
    const readOnlyProvider = new AnchorProvider(connection, dummyWallet, {
      commitment: "confirmed",
    });
    return new Program(
      predictionMarketIdl as Idl,
      readOnlyProvider
    ) as unknown as Program<PredictionMarket>;
  }, [connection]);

  const addComputeBudget = (
    tx: Transaction,
    computeUnits = 400_000,
    priorityFee = 1
  ) => {
    tx.add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: computeUnits })
    );
    tx.add(
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: priorityFee })
    );
    return tx;
  };

  const getUserTokenBalances = useCallback(
    async (
      yesToken: PublicKey,
      noToken: PublicKey
    ): Promise<
      | {
          yesBalance: number;
          noBalance: number;
          yesValueInSol: number;
          noValueInSol: number;
        }
      | undefined
    > => {
      const program = getProgram();
      if (!program || !address) return undefined;

      try {
        const user = new PublicKey(address);
        const [marketPda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from(SEED_MARKET),
            yesToken.toBuffer(),
            noToken.toBuffer(),
          ],
          PROGRAM_ID
        );

        const market = await program.account.market.fetch(marketPda);

        const userYesAta = await getAssociatedTokenAddress(
          yesToken,
          user,
          false,
          TOKEN_2022_PROGRAM_ID
        );
        const userNoAta = await getAssociatedTokenAddress(
          noToken,
          user,
          false,
          TOKEN_2022_PROGRAM_ID
        );

        let yesBalance = 0;
        let noBalance = 0;

        try {
          const yesTokenAccount = await connection.getTokenAccountBalance(
            userYesAta
          );
          yesBalance =
            parseFloat(yesTokenAccount.value.amount) /
            Math.pow(10, yesTokenAccount.value.decimals);
        } catch {
          /* ATA doesn't exist */
        }

        try {
          const noTokenAccount = await connection.getTokenAccountBalance(
            userNoAta
          );
          noBalance =
            parseFloat(noTokenAccount.value.amount) /
            Math.pow(10, noTokenAccount.value.decimals);
        } catch {
          /* ATA doesn't exist */
        }

        const yesSolReserves =
          parseFloat((market as { realYesSolReserves?: { toString: () => string } }).realYesSolReserves?.toString() ?? "0") / 1e9;
        const yesTokenReserves =
          parseFloat((market as { realYesTokenReserves?: { toString: () => string } }).realYesTokenReserves?.toString() ?? "0") / 1e6;
        const noSolReserves =
          parseFloat((market as { realNoSolReserves?: { toString: () => string } }).realNoSolReserves?.toString() ?? "0") / 1e9;
        const noTokenReserves =
          parseFloat((market as { realNoTokenReserves?: { toString: () => string } }).realNoTokenReserves?.toString() ?? "0") / 1e6;

        const yesK = yesSolReserves * yesTokenReserves;
        const noK = noSolReserves * noTokenReserves;

        let yesValueInSol = 0;
        if (yesBalance > 0) {
          const newYesTokenReserves = yesTokenReserves + yesBalance;
          const newYesSolReserves = yesK / newYesTokenReserves;
          yesValueInSol = yesSolReserves - newYesSolReserves;
        }

        let noValueInSol = 0;
        if (noBalance > 0) {
          const newNoTokenReserves = noTokenReserves + noBalance;
          const newNoSolReserves = noK / newNoTokenReserves;
          noValueInSol = noSolReserves - newNoSolReserves;
        }

        return {
          yesBalance,
          noBalance,
          yesValueInSol,
          noValueInSol,
        };
      } catch (error) {
        console.error("Failed to fetch token balances:", error);
        return undefined;
      }
    },
    [getProgram, address, connection]
  );

  /**
   * Calculate how many tokens are needed to receive a desired SOL amount when selling.
   * Uses the inverse constant-product AMM formula:
   *   tokens_in = token_reserve * sol_out / (sol_reserve - sol_out)
   */
  const calculateTokensForSolAmount = useCallback(
    async (
      yesToken: PublicKey,
      noToken: PublicKey,
      solAmount: number,
      tokenType: Outcome
    ): Promise<number | undefined> => {
      const program = getProgram();
      if (!program) return undefined;

      try {
        const [marketPda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from(SEED_MARKET),
            yesToken.toBuffer(),
            noToken.toBuffer(),
          ],
          PROGRAM_ID
        );
        const market = await program.account.market.fetch(marketPda);

        const solReserveBN =
          tokenType === Outcome.Yes
            ? (market as { realYesSolReserves: BN }).realYesSolReserves
            : (market as { realNoSolReserves: BN }).realNoSolReserves;
        const tokenReserveBN =
          tokenType === Outcome.Yes
            ? (market as { realYesTokenReserves: BN }).realYesTokenReserves
            : (market as { realNoTokenReserves: BN }).realNoTokenReserves;
        let solAmountBN = new BN(Math.round(solAmount * 1_000_000_000));

        // Check if requested SOL exceeds pool liquidity
        if (solAmountBN.gte(solReserveBN)) {
          if (solReserveBN.isZero()) {
            console.error("Pool has no SOL reserves");
            return undefined;
          }
          // Clamp to 1 lamport below reserve — handles floating-point rounding
          // when user clicks MAX. The 1-lamport difference is negligible.
          solAmountBN = solReserveBN.subn(1);
        }

        // Inverse AMM formula for sell: tokens_in = token_reserve * sol_out / (sol_reserve - sol_out)
        const numerator = tokenReserveBN.mul(solAmountBN);
        const denominator = solReserveBN.sub(solAmountBN);
        const tokensNeededBN = numerator.div(denominator);
        return tokensNeededBN.toNumber();
      } catch (error) {
        console.error("Failed to calculate tokens for SOL amount:", error);
        return undefined;
      }
    },
    [getProgram]
  );

  /**
   * Buy formula: "how many tokens do I get for X SOL input?"
   * Used by the private swap path (SOL -> tokens).
   * Matches contract's process_amm_update: dy = y * dx / (x + dx)
   */
  const calculateBuyOutput = useCallback(
    async (
      yesToken: PublicKey,
      noToken: PublicKey,
      solAmount: number,
      tokenType: Outcome
    ): Promise<number | undefined> => {
      const program = getProgram();
      if (!program) return undefined;

      try {
        const [marketPda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from(SEED_MARKET),
            yesToken.toBuffer(),
            noToken.toBuffer(),
          ],
          PROGRAM_ID
        );
        const market = await program.account.market.fetch(marketPda);

        const solReserveBN =
          tokenType === Outcome.Yes
            ? (market as { realYesSolReserves: BN }).realYesSolReserves
            : (market as { realNoSolReserves: BN }).realNoSolReserves;
        const tokenReserveBN =
          tokenType === Outcome.Yes
            ? (market as { realYesTokenReserves: BN }).realYesTokenReserves
            : (market as { realNoTokenReserves: BN }).realNoTokenReserves;
        const solAmountBN = new BN(Math.round(solAmount * 1_000_000_000));

        // Buy formula (constant product AMM):
        // dy = tokenReserve * solAmount / (solReserve + solAmount)
        const numerator = tokenReserveBN.mul(solAmountBN);
        const denominator = solReserveBN.add(solAmountBN);
        const tokensOut = numerator.div(denominator);

        return tokensOut.toNumber();
      } catch (error) {
        console.error("Failed to calculate buy output:", error);
        return undefined;
      }
    },
    [getProgram]
  );

  const createMarket = useCallback(
    async (
      marketName: string,
      question?: string,
      startSlot?: number,
      endingSlot?: number,
      startDate?: number,
      endDate?: number,
      slug?: string,
      imageUrl?: string,
      source?: string,
      category?: string
    ): Promise<CreateMarketResult | undefined> => {
      return createMarketInternal({
        marketName,
        question: question ?? "",
        startSlot,
        endingSlot,
        startDate,
        endDate,
        slug: slug ?? "",
        imageUrl: imageUrl ?? "",
        source: source ?? "Syzy",
        category: category ?? "Crypto",
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [address, walletProvider, connection]
  );

  const createMarketWithOptions = useCallback(
    async (options: CreateMarketOptions): Promise<CreateMarketResult | undefined> => {
      return createMarketInternal({
        marketName: options.marketName,
        question: options.question ?? "",
        startSlot: options.startSlot,
        endingSlot: options.endingSlot,
        startDate: options.startDate,
        endDate: options.endDate,
        slug: options.slug ?? "",
        imageUrl: options.imageUrl ?? "",
        source: options.source ?? "Syzy",
        category: options.category ?? "Crypto",
        oracleFeed: options.oracleFeed ?? null,
        priceTarget: options.priceTarget ?? null,
        comparisonType: options.comparisonType ?? null,
        metricType: options.metricType ?? null,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [address, walletProvider, connection]
  );

  const createMarketInternal = useCallback(
    async (params: {
      marketName: string;
      question: string;
      startSlot?: number;
      endingSlot?: number;
      startDate?: number | null;
      endDate?: number | null;
      slug: string;
      imageUrl: string;
      source: string;
      category: string;
      oracleFeed?: PublicKey | null;
      priceTarget?: BN | null;
      comparisonType?: number | null;
      metricType?: number | null;
    }): Promise<CreateMarketResult | undefined> => {
      const program = getProgram();
      if (!program || !address) {
        toast.error("Please connect your wallet");
        return undefined;
      }

      try {
        const creator = new PublicKey(address);
        const [configPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_CONFIG)],
          PROGRAM_ID
        );

        try {
          await program.account.config.fetch(configPda);
        } catch {
          toast.error(
            "Contract not initialized! Please contact the admin."
          );
          return undefined;
        }

        const ticker = params.marketName
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
          .slice(0, 6);
        const yesSymbol = `YES-${ticker}`;
        const yesUri = `https://placeholder.com/${ticker}/yes`;

        const yesTokenKp = web3.Keypair.generate();
        const noTokenKp = web3.Keypair.generate();

        const [globalVaultPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_GLOBAL)],
          PROGRAM_ID
        );

        const [marketPda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from(SEED_MARKET),
            yesTokenKp.publicKey.toBuffer(),
            noTokenKp.publicKey.toBuffer(),
          ],
          PROGRAM_ID
        );

        const configAccount = await program.account.config.fetch(configPda);
        const globalNoTokenAccount = await getAssociatedTokenAddress(
          noTokenKp.publicKey,
          globalVaultPda,
          true,
          TOKEN_2022_PROGRAM_ID
        );
        const globalYesTokenAccount = await getAssociatedTokenAddress(
          yesTokenKp.publicKey,
          globalVaultPda,
          true,
          TOKEN_2022_PROGRAM_ID
        );

        const lamports = await connection.getMinimumBalanceForRentExemption(
          MINT_SIZE
        );
        const createNoMintAccountIx = SystemProgram.createAccount({
          fromPubkey: creator,
          newAccountPubkey: noTokenKp.publicKey,
          space: MINT_SIZE,
          lamports,
          programId: TOKEN_2022_PROGRAM_ID,
        });

        const initNoMintIx = createInitializeMintInstruction(
          noTokenKp.publicKey,
          (configAccount as { tokenDecimalsConfig: number }).tokenDecimalsConfig,
          creator,
          null,
          TOKEN_2022_PROGRAM_ID
        );

        const createGlobalNoAtaIx = createAssociatedTokenAccountInstruction(
          creator,
          globalNoTokenAccount,
          globalVaultPda,
          noTokenKp.publicKey,
          TOKEN_2022_PROGRAM_ID
        );

        const mintNoIx = createMintToInstruction(
          noTokenKp.publicKey,
          globalNoTokenAccount,
          creator,
          BigInt(
            (configAccount as { tokenSupplyConfig: BN }).tokenSupplyConfig.toString()
          ),
          [],
          TOKEN_2022_PROGRAM_ID
        );

        const revokeNoMintAuthIx = createSetAuthorityInstruction(
          noTokenKp.publicKey,
          creator,
          AuthorityType.MintTokens,
          null,
          [],
          TOKEN_2022_PROGRAM_ID
        );

        const createMarketIx = await (
          program.methods as {
            createMarket: (params: unknown) => {
              accountsPartial: (acc: unknown) => { instruction: () => Promise<TransactionInstruction> };
            };
          }
        )
          .createMarket({
            yesSymbol,
            yesUri,
            marketName: params.marketName.slice(0, 32),
            question: params.question.slice(0, 100),
            slug: params.slug.slice(0, 128),
            imageUrl: params.imageUrl.slice(0, 256),
            source: params.source.slice(0, 32),
            category: params.category.slice(0, 32),
            startSlot: params.startSlot ? new BN(params.startSlot) : null,
            endingSlot: params.endingSlot ? new BN(params.endingSlot) : null,
            startDate: params.startDate != null ? new BN(params.startDate) : null,
            endDate: params.endDate != null ? new BN(params.endDate) : null,
            oracleFeed: params.oracleFeed ?? null,
            priceTarget: params.priceTarget ?? null,
            comparisonType: params.comparisonType ?? null,
            metricType: params.metricType ?? null,
          })
          .accountsPartial({
            globalConfig: configPda,
            globalVault: globalVaultPda,
            creator,
            yesToken: yesTokenKp.publicKey,
            noToken: noTokenKp.publicKey,
            market: marketPda,
            globalYesTokenAccount,
            globalNoAta: globalNoTokenAccount,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            teamWallet: (configAccount as { teamWallet: PublicKey }).teamWallet,
            clock: SYSVAR_CLOCK_PUBKEY,
          })
          .instruction();
        const createMarketIxTyped = createMarketIx as unknown as TransactionInstruction;

        const tx = new Transaction();
        addComputeBudget(tx, 500_000, 1);
        tx.add(
          createNoMintAccountIx,
          initNoMintIx,
          createGlobalNoAtaIx,
          mintNoIx,
          revokeNoMintAuthIx,
          createMarketIxTyped
        );

        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash("confirmed");
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;
        tx.feePayer = creator;

        tx.partialSign(yesTokenKp, noTokenKp);

        const signedTx = await (
          walletProvider as { signTransaction: (tx: Transaction) => Promise<Transaction> }
        ).signTransaction(tx);
        const signature = await connection.sendRawTransaction(
          signedTx.serialize(),
          { skipPreflight: true, maxRetries: 3 }
        );

        await connection.confirmTransaction(
          {
            signature,
            blockhash: tx.recentBlockhash!,
            lastValidBlockHeight: tx.lastValidBlockHeight!,
          },
          "confirmed"
        );

        toast.success("Market created!");

        // ZK init (optional - may fail if contract is wiped/closed or ZK instructions unavailable)
        try {
          const zkTx = new Transaction();
          addComputeBudget(zkTx, 600_000, 1);
          const identifier = new Uint8Array(16);
          crypto.getRandomValues(identifier);

          const [shieldedPoolPda] = PublicKey.findProgramAddressSync(
            [Buffer.from(SEED_SHIELDED_POOL), marketPda.toBuffer()],
            PROGRAM_ID
          );
          const [leavesIndexerPdaDerived] = PublicKey.findProgramAddressSync(
            [Buffer.from(SEED_LEAVES), Buffer.from(identifier)],
            PROGRAM_ID
          );
          const [subtreeIndexerPdaDerived] = PublicKey.findProgramAddressSync(
            [Buffer.from(SEED_SUBTREE), Buffer.from(identifier)],
            PROGRAM_ID
          );

          const initPoolIx = await (
            program.methods as { initializeShieldedPool: (id: number[]) => { accountsPartial: (acc: unknown) => { instruction: () => Promise<{ data: Buffer }> } } }
          )
            .initializeShieldedPool(Array.from(identifier))
            .accountsPartial({
              market: marketPda,
              shieldedPool: shieldedPoolPda,
              leavesIndexer: leavesIndexerPdaDerived,
              subtreeIndexer: subtreeIndexerPdaDerived,
              authority: creator,
              systemProgram: SystemProgram.programId,
            })
            .instruction();
          zkTx.add(initPoolIx as TransactionInstruction);

          const [shard0Pda] = PublicKey.findProgramAddressSync(
            [
              Buffer.from(SEED_SHARD),
              Buffer.from(identifier),
              Buffer.from([1]),
              Buffer.from([0]),
            ],
            PROGRAM_ID
          );
          const initShard0Ix = await (
            program.methods as { initializeShard0: () => { accountsPartial: (acc: unknown) => { instruction: () => Promise<{ data: Buffer }> } } }
          )
            .initializeShard0()
            .accountsPartial({
              shieldedPool: shieldedPoolPda,
              shard0: shard0Pda,
              authority: creator,
              systemProgram: SystemProgram.programId,
            })
            .instruction();
          zkTx.add(initShard0Ix as TransactionInstruction);

          const [shard1Pda] = PublicKey.findProgramAddressSync(
            [
              Buffer.from(SEED_SHARD),
              Buffer.from(identifier),
              Buffer.from([1]),
              Buffer.from([1]),
            ],
            PROGRAM_ID
          );
          const initShard1Ix = await (
            program.methods as { initializeShard1: () => { accountsPartial: (acc: unknown) => { instruction: () => Promise<{ data: Buffer }> } } }
          )
            .initializeShard1()
            .accountsPartial({
              shieldedPool: shieldedPoolPda,
              shard1: shard1Pda,
              authority: creator,
              systemProgram: SystemProgram.programId,
            })
            .instruction();
          zkTx.add(initShard1Ix as TransactionInstruction);

          const { blockhash: zkBh, lastValidBlockHeight: zkLvh } =
            await connection.getLatestBlockhash("confirmed");
          zkTx.recentBlockhash = zkBh;
          zkTx.lastValidBlockHeight = zkLvh;
          zkTx.feePayer = creator;

          if ((walletProvider as { signAndSendTransaction?: (tx: Transaction) => Promise<{ signature?: string }> }).signAndSendTransaction) {
            await (
              walletProvider as { signAndSendTransaction: (tx: Transaction) => Promise<{ signature?: string }> }
            ).signAndSendTransaction(zkTx);
            toast.success("ZK Privacy Layer initialized!");
          } else {
            const signedZkTx = await (
              walletProvider as { signTransaction: (tx: Transaction) => Promise<Transaction> }
            ).signTransaction(zkTx);
            await connection.sendRawTransaction(signedZkTx.serialize(), {
              skipPreflight: true,
            });
            toast.success("ZK Privacy Layer initialized!");
          }
        } catch (zkError) {
          console.error("ZK Init:", zkError);
          const msg = zkError instanceof Error ? zkError.message : String(zkError);
          const isWiped =
            /could not find program|account does not exist|program account not found|invalid program id/i.test(msg);
          if (isWiped) {
            toast.error("Market created. Contract not deployed or closed (wiped). ZK layer skipped.");
          } else {
            toast.error("Market created, but Privacy Layer initialization failed. You may need to initialize it manually.");
          }
        }

        return {
          signature,
          marketPda,
          yesToken: yesTokenKp.publicKey,
          noToken: noTokenKp.publicKey,
        };
      } catch (error) {
        console.error("Failed to create market:", error);
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        toast.error(`Failed to create market: ${errorMsg}`);
        throw error;
      }
    },
    [getProgram, address, connection, walletProvider]
  );

  /**
   * Initialize the global contract configuration (Admin only).
   * Sets up fees, token supply, and other global parameters.
   */
  const initializeMaster = useCallback(async (): Promise<string | undefined> => {
    const program = getProgram();
    if (!program || !address) return undefined;

    try {
      const payer = new PublicKey(address);
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from(SEED_CONFIG)],
        PROGRAM_ID
      );
      const [globalVaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from(SEED_GLOBAL)],
        PROGRAM_ID
      );

      try {
        const existingConfig = await program.account.config.fetch(configPda);
        if (existingConfig) {
          toast.error("Contract is already initialized!");
          return undefined;
        }
      } catch {
        // Config doesn't exist, proceed
      }

      const newConfig = {
        authority: payer,
        pendingAuthority: SystemProgram.programId,
        teamWallet: payer,
        platformBuyFee: new BN(100),
        platformSellFee: new BN(100),
        lpBuyFee: new BN(50),
        lpSellFee: new BN(50),
        tokenSupplyConfig: new BN(1_000_000_000_000_000),
        tokenDecimalsConfig: 6,
        initialRealTokenReservesConfig: new BN(793_000_000_000_000),
        minSolLiquidity: new BN(100_000_000),
        initialized: true,
      };

      const initTx = new Transaction();
      addComputeBudget(initTx, 200_000, 1);

      const initIx = await (
        program.methods as {
          configure: (c: unknown) => {
            accountsPartial: (acc: unknown) => { instruction: () => Promise<TransactionInstruction> };
          };
        }
      )
        .configure(newConfig)
        .accountsPartial({
          payer,
          config: configPda,
          globalVault: globalVaultPda,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .instruction();

      initTx.add(initIx);

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      initTx.recentBlockhash = blockhash;
      initTx.lastValidBlockHeight = lastValidBlockHeight;
      initTx.feePayer = payer;

      let tx: string;
      if (
        (walletProvider as { signAndSendTransaction?: (t: Transaction) => Promise<{ signature?: string } | string> }).signAndSendTransaction
      ) {
        const result = await (
          walletProvider as { signAndSendTransaction: (t: Transaction) => Promise<{ signature?: string } | string> }
        ).signAndSendTransaction(initTx);
        tx = typeof result === "string" ? result : (result.signature ?? "");
      } else {
        const signedTx = await (
          walletProvider as { signTransaction: (t: Transaction) => Promise<Transaction> }
        ).signTransaction(initTx);
        tx = await connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: true,
        });
      }

      await connection.confirmTransaction(
        { signature: tx, blockhash, lastValidBlockHeight },
        "confirmed"
      );

      toast.success("Global Config Initialized!");
      return tx;
    } catch (error) {
      console.error("Initialization failed:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to initialize contract: ${errorMsg}`);
      throw error;
    }
  }, [getProgram, address, connection, walletProvider]);

  const swap = useCallback(
    async (
      yesToken: PublicKey,
      noToken: PublicKey,
      amount: number | string,
      direction: Side,
      tokenType: Outcome,
      minReceive: number | string = 0,
      isSolAmount = false
    ): Promise<string | undefined> => {
      const program = getProgram();
      if (!program || !address) {
        toast.error("Please connect your wallet first");
        return undefined;
      }

      if (isProcessing) {
        toast.warning("Transaction in progress...");
        return undefined;
      }

      setIsProcessing(true);
      let amountNum = 0;
      let amountToSend = 0;

      try {
        const user = new PublicKey(address);
        const minReceiveNum =
          typeof minReceive === "string" ? parseFloat(minReceive) : minReceive;
        amountNum = typeof amount === "string" ? parseFloat(amount) : amount;
        amountToSend = amountNum;

        if (direction === Side.Sell && isSolAmount) {
          const tokensNeeded = await calculateTokensForSolAmount(
            yesToken,
            noToken,
            amountNum,
            tokenType
          );
          if (!tokensNeeded) {
            toast.error("Amount exceeds pool liquidity. Try a smaller amount.");
            setIsProcessing(false);
            return undefined;
          }
          amountToSend = tokensNeeded;
        } else if (direction === Side.Buy) {
          amountToSend = amountNum * 1e9;
        } else if (direction === Side.Sell && !isSolAmount) {
          amountToSend = amountNum * 1e6;
        }

        const [configPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_CONFIG)],
          PROGRAM_ID
        );
        const [globalVaultPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_GLOBAL)],
          PROGRAM_ID
        );
        const [marketPda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from(SEED_MARKET),
            yesToken.toBuffer(),
            noToken.toBuffer(),
          ],
          PROGRAM_ID
        );
        const [userInfoPda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from(SEED_USERINFO),
            user.toBuffer(),
            marketPda.toBuffer(),
          ],
          PROGRAM_ID
        );

        const configAccount = await program.account.config.fetch(configPda);
        const globalYesAta = await getAssociatedTokenAddress(
          yesToken,
          globalVaultPda,
          true,
          TOKEN_2022_PROGRAM_ID
        );
        const globalNoAta = await getAssociatedTokenAddress(
          noToken,
          globalVaultPda,
          true,
          TOKEN_2022_PROGRAM_ID
        );
        const userYesAta = await getAssociatedTokenAddress(
          yesToken,
          user,
          false,
          TOKEN_2022_PROGRAM_ID
        );
        const userNoAta = await getAssociatedTokenAddress(
          noToken,
          user,
          false,
          TOKEN_2022_PROGRAM_ID
        );

        const globalYesInfo = await connection.getAccountInfo(globalYesAta);
        const globalNoInfo = await connection.getAccountInfo(globalNoAta);
        if (!globalYesInfo || !globalNoInfo) {
          toast.error("Market invalid: Global Token Accounts not initialized.");
          setIsProcessing(false);
          return undefined;
        }

        const tx = new Transaction();
        addComputeBudget(tx, 500_000, 1);

        if (direction === Side.Buy) {
          const userYesAtaInfo = await connection.getAccountInfo(userYesAta);
          if (!userYesAtaInfo) {
            tx.add(
              createAssociatedTokenAccountInstruction(
                user,
                userYesAta,
                user,
                yesToken,
                TOKEN_2022_PROGRAM_ID
              )
            );
          }
          const userNoAtaInfo = await connection.getAccountInfo(userNoAta);
          if (!userNoAtaInfo) {
            tx.add(
              createAssociatedTokenAccountInstruction(
                user,
                userNoAta,
                user,
                noToken,
                TOKEN_2022_PROGRAM_ID
              )
            );
          }
        }

        const txKey = `${marketPda.toString()}-${direction}-${amountToSend}-${Date.now()}`;
        if (pendingTxs.current.has(txKey)) {
          toast.warning("This transaction is already being processed");
          setIsProcessing(false);
          return undefined;
        }
        pendingTxs.current.add(txKey);

        // Track trade initiated
        const tradeMetadata = {
          amount: amountNum,
          solAmount: direction === Side.Buy ? amountNum : undefined,
          direction: direction === Side.Buy ? "BUY" as const : "SELL" as const,
          tokenType: tokenType === Outcome.Yes ? "YES" as const : "NO" as const,
          isSolAmount: direction === Side.Sell ? isSolAmount : undefined,
        };
        trackTradeInitiated(address, marketPda.toString(), tradeMetadata);

        try {
          // Derive reward pool vault and user's StakeUser PDA for fee split + discount
          const rewardPoolVault = (configAccount as { rewardPoolVault?: PublicKey }).rewardPoolVault ?? PublicKey.default;
          const [poolPda] = getPoolPda();
          const [stakeUserPda] = getStakeUserPda(poolPda, user);

          // Build remaining accounts: [0] StakeUser PDA, [1] OYRADE token account
          const remainingAccounts: { pubkey: PublicKey; isSigner: boolean; isWritable: boolean }[] = [];
          // Only pass remaining accounts if reward pool is configured
          if (!rewardPoolVault.equals(PublicKey.default)) {
            remainingAccounts.push({
              pubkey: stakeUserPda,
              isSigner: false,
              isWritable: false,
            });
            // User's OYRADE token account for holding balance check (Bronze tier)
            const oyradeAta = await getAssociatedTokenAddress(OYRADE_MINT, user, false, TOKEN_PROGRAM_ID);
            remainingAccounts.push({
              pubkey: oyradeAta,
              isSigner: false,
              isWritable: false,
            });
          }

          const swapIx = await (program.methods as {
            swap: (amt: BN, dir: number, tok: number, min: BN) => { accountsPartial: (acc: unknown) => { remainingAccounts: (acc: unknown[]) => { instruction: () => Promise<{ data: Buffer }> } } };
          })
            .swap(
              new BN(Math.floor(amountToSend)),
              Number(direction),
              Number(tokenType),
              new BN(Math.floor(minReceiveNum))
            )
            .accountsPartial({
              globalConfig: configPda,
              teamWallet: (configAccount as { teamWallet: PublicKey }).teamWallet,
              market: marketPda,
              globalVault: globalVaultPda,
              yesToken,
              noToken,
              globalYesAta,
              globalNoAta,
              userYesAta,
              userNoAta,
              userInfo: userInfoPda,
              user,
              rewardPoolVault,
              systemProgram: SystemProgram.programId,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            })
            .remainingAccounts(remainingAccounts)
            .instruction();

          tx.add(swapIx as TransactionInstruction);

          const { blockhash, lastValidBlockHeight } =
            await connection.getLatestBlockhash("confirmed");
          tx.recentBlockhash = blockhash;
          tx.lastValidBlockHeight = lastValidBlockHeight;
          tx.feePayer = user;

          let signature: string;
          if (
            (walletProvider as { signAndSendTransaction?: (tx: Transaction) => Promise<{ signature?: string } | string> }).signAndSendTransaction
          ) {
            const result = await (
              walletProvider as { signAndSendTransaction: (tx: Transaction) => Promise<{ signature?: string } | string> }
            ).signAndSendTransaction(tx);
            signature =
              typeof result === "string" ? result : (result.signature ?? "");
          } else {
            const signedTx = await (
              walletProvider as { signTransaction: (tx: Transaction) => Promise<Transaction> }
            ).signTransaction(tx);
            signature = await connection.sendRawTransaction(signedTx.serialize(), {
              skipPreflight: true,
              preflightCommitment: "confirmed",
            });
          }

          await connection.confirmTransaction(
            { signature, blockhash, lastValidBlockHeight },
            "confirmed"
          );

          // Track trade confirmed
          trackTradeConfirmed(address, marketPda.toString(), signature, tradeMetadata);

          toast.success(direction === Side.Buy ? "Buy successful!" : "Sell successful!");
          return signature;
        } finally {
          setTimeout(() => pendingTxs.current.delete(txKey), 1000);
        }
      } catch (error: unknown) {
        const msg =
          error instanceof Error ? error.message : String(error);

        // Track trade failed (including user cancellations)
        const [failedMarketPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_MARKET), yesToken.toBuffer(), noToken.toBuffer()],
          PROGRAM_ID
        );
        trackTradeFailed(address, failedMarketPda.toString(), msg.slice(0, 200), {
          amount: amountNum,
          direction: direction === Side.Buy ? "BUY" as const : "SELL" as const,
          tokenType: tokenType === Outcome.Yes ? "YES" as const : "NO" as const,
        });

        const isUserRejection = msg.includes("User rejected") || msg.includes("cancelled");
        if (msg.includes("already been processed") || msg.includes("already processed")) {
          toast.info("Transaction already processed. Refresh to see updated balance.");
          return undefined;
        }
        if (isUserRejection) {
          toast.error("Transaction cancelled");
        } else if (msg.includes("insufficient") || msg.includes("Insufficient")) {
          toast.error("Insufficient balance");
        } else if (msg.includes("SlippageExceeded") || msg.includes("0x1779")) {
          toast.error("Slippage exceeded. Try increasing slippage or reducing amount.");
        } else if (msg.includes("InsufficientLiquidity") || msg.includes("0x1778")) {
          toast.error("Insufficient liquidity. Try a smaller amount.");
        } else if (msg.includes("InvalidCalculation") || msg.includes("minimum required")) {
          toast.error("Amount too large for pool liquidity. Try a smaller amount.");
        } else if (msg.includes("Blockhash not found") || msg.includes("block height exceeded")) {
          toast.error("Transaction expired. Please try again.");
        } else if (msg.includes("Simulation failed") || msg.includes("simulation") || msg.includes("Unexpected error")) {
          toast.error("Transaction failed. Try a smaller amount.");
        } else {
          toast.error(`Swap failed: ${String(msg).slice(0, 80)}`);
        }
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [
      getProgram,
      address,
      connection,
      walletProvider,
      isProcessing,
      calculateTokensForSolAmount,
      trackTradeInitiated,
      trackTradeConfirmed,
      trackTradeFailed,
    ]
  );

  /**
   * Claim winnings from a resolved market.
   */
  const claimWinnings = useCallback(
    async (yesToken: PublicKey, noToken: PublicKey): Promise<string | undefined> => {
      const program = getProgram();
      if (!program || !address) {
        toast.error("Please connect your wallet first");
        return undefined;
      }

      try {
        const user = new PublicKey(address);
        const [configPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_CONFIG)],
          PROGRAM_ID
        );
        const [globalVaultPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_GLOBAL)],
          PROGRAM_ID
        );
        const [marketPda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from(SEED_MARKET),
            yesToken.toBuffer(),
            noToken.toBuffer(),
          ],
          PROGRAM_ID
        );
        const [userInfoPda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from(SEED_USERINFO),
            user.toBuffer(),
            marketPda.toBuffer(),
          ],
          PROGRAM_ID
        );

        const market = await program.account.market.fetch(marketPda);
        const marketData = market as { isCompleted?: boolean; winningOutcome?: number | null; winning_outcome?: number | null };
        if (!marketData.isCompleted) {
          toast.error("Market is not resolved yet");
          return undefined;
        }

        try {
          const userInfo = await program.account.userInfo.fetch(userInfoPda);
          const winningOutcome = marketData.winningOutcome ?? marketData.winning_outcome;
          if (winningOutcome === null || winningOutcome === undefined) {
            toast.error("Market outcome not declared");
            return undefined;
          }
          const userInfoData = userInfo as { yesTokenAmount?: BN; yes_token_amount?: BN; noTokenAmount?: BN; no_token_amount?: BN };
          const yesTokens = userInfoData.yesTokenAmount ?? userInfoData.yes_token_amount ?? 0;
          const noTokens = userInfoData.noTokenAmount ?? userInfoData.no_token_amount ?? 0;
          const yesNum = typeof yesTokens === "object" && "toNumber" in yesTokens ? (yesTokens as BN).toNumber() : Number(yesTokens);
          const noNum = typeof noTokens === "object" && "toNumber" in noTokens ? (noTokens as BN).toNumber() : Number(noTokens);
          const hasWinningTokens = winningOutcome === 0 ? yesNum > 0 : noNum > 0;
          if (!hasWinningTokens) {
            toast.error("You don't have any winning tokens");
            return undefined;
          }
        } catch (err) {
          console.error("Error fetching userInfo:", err);
          toast.error("You haven't participated in this market");
          return undefined;
        }

        const claimTx = new Transaction();
        addComputeBudget(claimTx, 200_000, 1);

        const claimIx = await (
          program.methods as { claimWinnings: () => { accountsPartial: (acc: unknown) => { instruction: () => Promise<TransactionInstruction> } } }
        )
          .claimWinnings()
          .accountsPartial({
            globalConfig: configPda,
            market: marketPda,
            globalVault: globalVaultPda,
            yesToken,
            noToken,
            userInfo: userInfoPda,
            user,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          })
          .instruction();

        claimTx.add(claimIx);

        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash("confirmed");
        claimTx.recentBlockhash = blockhash;
        claimTx.lastValidBlockHeight = lastValidBlockHeight;
        claimTx.feePayer = user;

        let tx: string;
        if (
          (walletProvider as { signAndSendTransaction?: (t: Transaction) => Promise<{ signature?: string } | string> }).signAndSendTransaction
        ) {
          const result = await (
            walletProvider as { signAndSendTransaction: (t: Transaction) => Promise<{ signature?: string } | string> }
          ).signAndSendTransaction(claimTx);
          tx = typeof result === "string" ? result : (result.signature ?? "");
        } else {
          const signedTx = await (
            walletProvider as { signTransaction: (t: Transaction) => Promise<Transaction> }
          ).signTransaction(claimTx);
          tx = await connection.sendRawTransaction(signedTx.serialize(), {
            skipPreflight: true,
          });
        }

        await connection.confirmTransaction(
          { signature: tx, blockhash, lastValidBlockHeight },
          "confirmed"
        );

        toast.success("Winnings claimed successfully!");
        return tx;
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes("MarketNotCompleted")) {
          toast.error("Market is not resolved yet");
        } else if (msg.includes("AlreadyClaimed")) {
          toast.error("Already claimed your winnings");
        } else if (msg.includes("NoWinningTokens") || msg.includes("InvalidTokenType")) {
          toast.error("No winning tokens to claim");
        } else if (msg.includes("InsufficientLiquidity")) {
          toast.error("Insufficient funds in the pool");
        } else {
          toast.error(`Claim failed: ${msg.slice(0, 80)}`);
        }
        throw error;
      }
    },
    [getProgram, address, connection, walletProvider]
  );

  /**
   * Resolve a market by declaring the winning outcome (Admin only).
   */
  const resolution = useCallback(
    async (
      yesToken: PublicKey,
      noToken: PublicKey,
      winningOutcome: Outcome
    ): Promise<string | undefined> => {
      const program = getProgram();
      if (!program || !address) {
        toast.error("Please connect your wallet first");
        return undefined;
      }

      try {
        const authority = new PublicKey(address);
        if (winningOutcome !== Outcome.Yes && winningOutcome !== Outcome.No) {
          toast.error("Invalid outcome. Must be YES (0) or NO (1)");
          return undefined;
        }

        const [configPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_CONFIG)],
          PROGRAM_ID
        );
        const [globalVaultPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_GLOBAL)],
          PROGRAM_ID
        );
        const [marketPda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from(SEED_MARKET),
            yesToken.toBuffer(),
            noToken.toBuffer(),
          ],
          PROGRAM_ID
        );
        const [userInfoPda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from(SEED_USERINFO),
            authority.toBuffer(),
            marketPda.toBuffer(),
          ],
          PROGRAM_ID
        );

        const config = await program.account.config.fetch(configPda);
        const configAuthority = (config as { authority: PublicKey }).authority;
        if (configAuthority.toString() !== authority.toString()) {
          toast.error("Only the contract authority can resolve markets");
          return undefined;
        }

        const resolutionTx = new Transaction();
        addComputeBudget(resolutionTx, 200_000, 1);

        const resolutionIx = await (
          program.methods as {
            resolution: (a: BN, b: BN, out: number, completed: boolean) => {
              accountsPartial: (acc: unknown) => { instruction: () => Promise<TransactionInstruction> };
            };
          }
        )
          .resolution(
            new BN(0),
            new BN(0),
            winningOutcome,
            true
          )
          .accountsPartial({
            globalConfig: configPda,
            market: marketPda,
            globalVault: globalVaultPda,
            yesToken,
            noToken,
            userInfo: userInfoPda,
            user: authority,
            authority,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          })
          .instruction();

        resolutionTx.add(resolutionIx);

        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash("confirmed");
        resolutionTx.recentBlockhash = blockhash;
        resolutionTx.lastValidBlockHeight = lastValidBlockHeight;
        resolutionTx.feePayer = authority;

        let tx: string;
        if (
          (walletProvider as { signAndSendTransaction?: (t: Transaction) => Promise<{ signature?: string } | string> }).signAndSendTransaction
        ) {
          const result = await (
            walletProvider as { signAndSendTransaction: (t: Transaction) => Promise<{ signature?: string } | string> }
          ).signAndSendTransaction(resolutionTx);
          tx = typeof result === "string" ? result : (result.signature ?? "");
        } else {
          const signedTx = await (
            walletProvider as { signTransaction: (t: Transaction) => Promise<Transaction> }
          ).signTransaction(resolutionTx);
          tx = await connection.sendRawTransaction(signedTx.serialize(), {
            skipPreflight: true,
          });
        }

        await connection.confirmTransaction(
          { signature: tx, blockhash, lastValidBlockHeight },
          "confirmed"
        );

        toast.success(`Market resolved! Winner: ${winningOutcome === Outcome.Yes ? "YES" : "NO"}`);
        return tx;
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes("InvalidMigrationAuthority") || msg.includes("IncorrectAuthority")) {
          toast.error("Only the admin can resolve markets");
        } else if (msg.includes("MarketAlreadyCompleted")) {
          toast.error("Market is already resolved");
        } else {
          toast.error(`Resolution failed: ${msg.slice(0, 80)}`);
        }
        throw error;
      }
    },
    [getProgram, address, connection, walletProvider]
  );

  /**
   * Resolve a market via Switchboard oracle feed (permissionless — anyone can call).
   *
   * Strategy:
   *  1. Try bundled approach: feed update + resolve in one VersionedTransaction
   *  2. If the bundled Switchboard update fails (Secp256k1 SDK incompatibility),
   *     fall back to resolve-only (requires feed to have been cranked externally
   *     within the last 150 slots / ~60 seconds)
   */
  const resolveViaOracle = useCallback(
    async (
      yesToken: PublicKey,
      noToken: PublicKey,
      oracleFeed: PublicKey
    ): Promise<string | undefined> => {
      const program = getProgram();
      if (!program || !address) {
        toast.error("Please connect your wallet first");
        return undefined;
      }

      try {
        const payer = new PublicKey(address);

        // Build resolveViaOracle instruction (shared between both strategies)
        const [marketPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_MARKET), yesToken.toBuffer(), noToken.toBuffer()],
          PROGRAM_ID
        );

        const resolveIx = await (
          program.methods as unknown as {
            resolveViaOracle: () => {
              accountsPartial: (acc: unknown) => {
                instruction: () => Promise<TransactionInstruction>;
              };
            };
          }
        )
          .resolveViaOracle()
          .accountsPartial({
            market: marketPda,
            yesToken,
            noToken,
            oracleFeed,
            payer,
          })
          .instruction();

        // Strategy 1: Try bundled feed update + resolve
        toast.info("Fetching oracle data...");
        let bundledSuccess = false;
        try {
          const walletForSb = {
            publicKey: payer,
            signTransaction: async <T extends Transaction | VersionedTransaction>(
              tx: T
            ): Promise<T> => {
              return await (walletProvider as any).signTransaction(tx);
            },
            signAllTransactions: async <T extends Transaction | VersionedTransaction>(
              txs: T[]
            ): Promise<T[]> => {
              return await (walletProvider as any).signAllTransactions(txs);
            },
          };

          const feedUpdate = await fetchFeedUpdateIx(connection, oracleFeed, walletForSb);
          console.log("[Resolve] Feed update result:", {
            numSuccesses: feedUpdate.numSuccesses,
            numInstructions: feedUpdate.instructions.length,
            numLuts: feedUpdate.lookupTables.length,
          });

          if (feedUpdate.numSuccesses > 0 && feedUpdate.instructions.length > 0) {
            const computeBudgetIxs = [
              ComputeBudgetProgram.setComputeUnitLimit({ units: 600_000 }),
              ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1 }),
            ];

            // IMPORTANT: Switchboard feed update instructions MUST be at the front of the transaction.
            // The Secp256k1 precompile instruction uses instructionIndex=0 (hardcoded in SDK)
            // to self-reference its data, so it must be the first instruction.
            // Compute budget instructions work regardless of position.
            const allIxs = [
              ...feedUpdate.instructions,
              ...computeBudgetIxs,
              resolveIx,
            ];

            const { blockhash, lastValidBlockHeight } =
              await connection.getLatestBlockhash("confirmed");

            const messageV0 = new TransactionMessage({
              payerKey: payer,
              recentBlockhash: blockhash,
              instructions: allIxs,
            }).compileToV0Message(feedUpdate.lookupTables);

            const vtx = new VersionedTransaction(messageV0);

            // Use signTransaction + skipPreflight (Secp256k1 precompile can cause simulation issues)
            const signedTx = await (walletProvider as any).signTransaction(vtx);
            const tx = await connection.sendRawTransaction(signedTx.serialize(), {
              skipPreflight: true,
            });

            await connection.confirmTransaction(
              { signature: tx, blockhash, lastValidBlockHeight },
              "confirmed"
            );

            // Verify it actually succeeded (skipPreflight means we need to check)
            const txResult = await connection.getTransaction(tx, { maxSupportedTransactionVersion: 0 });
            if (txResult?.meta?.err) {
              console.warn("Bundled oracle resolution failed on-chain:", JSON.stringify(txResult.meta.err));
              throw new Error("Bundled transaction failed on-chain");
            }

            toast.success("Market resolved via oracle!");
            bundledSuccess = true;
            return tx;
          }
        } catch (bundledError: any) {
          console.warn("Bundled oracle resolution failed, trying resolve-only:", bundledError?.message?.slice(0, 100));
        }

        // Strategy 2: Resolve-only (feed must have been cranked externally within 150 slots)
        if (!bundledSuccess) {
          toast.info("Trying direct resolution (feed must be recently cranked)...");

          const computeBudgetIxs = [
            ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1 }),
          ];

          const { blockhash, lastValidBlockHeight } =
            await connection.getLatestBlockhash("confirmed");

          const messageV0 = new TransactionMessage({
            payerKey: payer,
            recentBlockhash: blockhash,
            instructions: [...computeBudgetIxs, resolveIx],
          }).compileToV0Message();

          const vtx = new VersionedTransaction(messageV0);
          const signedTx = await (walletProvider as any).signTransaction(vtx);
          const tx = await connection.sendRawTransaction(signedTx.serialize(), {
            skipPreflight: true,
          });

          await connection.confirmTransaction(
            { signature: tx, blockhash, lastValidBlockHeight },
            "confirmed"
          );

          // Verify on-chain result (skipPreflight means we need to check)
          const txResult = await connection.getTransaction(tx, { maxSupportedTransactionVersion: 0 });
          if (txResult?.meta?.err) {
            const errStr = JSON.stringify(txResult.meta.err);
            console.warn("Resolve-only failed on-chain:", errStr);
            throw new Error(`On-chain error: ${errStr}`);
          }

          toast.success("Market resolved via oracle!");
          return tx;
        }
      } catch (error: any) {
        const msg = error?.message || "";
        if (msg.includes("MarketAlreadyCompleted")) {
          toast.error("Market is already resolved");
        } else if (msg.includes("OracleOwnerMismatch")) {
          toast.error("Oracle feed is not owned by Switchboard");
        } else if (msg.includes("StaleOracleData") || msg.includes("Custom\":6009") || msg.includes("Custom\":6010")) {
          toast.error("Oracle feed has no data or is stale. The feed may need to be recreated with the Create Feed button.");
        } else if (msg.includes("MarketNotExpired") || msg.includes("Custom\":6001")) {
          toast.error("Market has not reached its ending slot yet");
        } else if (msg.includes("OracleNotConfigured")) {
          toast.error("No oracle configured for this market");
        } else if (msg.includes("InstructionError")) {
          toast.error("Oracle resolution failed on-chain. The feed may have no data — try recreating it with Create Feed.");
        } else {
          toast.error(`Oracle resolution failed: ${msg.slice(0, 80)}`);
        }
        throw error;
      }
    },
    [getProgram, address, connection, walletProvider]
  );

  /** Fetches all markets. Returns [] if program is unavailable (e.g. wiped/closed contract). */
  const getAllMarkets = useCallback(async () => {
    const program = getReadOnlyProgram();
    try {
      const MARKET_DISCRIMINATOR = new Uint8Array([
        219, 190, 213, 55, 0, 227, 198, 154,
      ]);
      const discriminatorBase58 = bs58.encode(MARKET_DISCRIMINATOR);

      const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
        commitment: CLUSTER,
        filters: [{ memcmp: { offset: 0, bytes: discriminatorBase58 } }],
      });

      const results: { publicKey: PublicKey; account: MarketAccount }[] = [];
      for (const { pubkey, account } of accounts) {
        try {
          const decoded = (program.coder.accounts.decode(
            "market",
            account.data
          ) as Record<string, unknown>);
          results.push({ publicKey: pubkey, account: normalizeMarketAccount(decoded) });
        } catch {
          /* skip invalid accounts */
        }
      }
      return results;
    } catch (error) {
      console.error("Failed to fetch markets (program may be wiped/unavailable):", error);
      return [];
    }
  }, [getReadOnlyProgram, connection]);

  /** Fetches a single market. Returns undefined if not found or program unavailable (e.g. wiped). */
  const getMarket = useCallback(
    async (marketAddress: PublicKey): Promise<MarketAccount | undefined> => {
      const program = getReadOnlyProgram();
      try {
        const raw = (await program.account.market.fetch(
          marketAddress
        )) as unknown as Record<string, unknown>;
        return normalizeMarketAccount(raw);
      } catch (error) {
        console.error("Failed to fetch market (account may not exist or program wiped):", error);
        return undefined;
      }
    },
    [getReadOnlyProgram]
  );

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
      const program = getProgram();
      if (!program || !address) {
        toast.error("Please connect your wallet first");
        return undefined;
      }

      try {
        const authority = new PublicKey(address);

        const [configPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_CONFIG)],
          PROGRAM_ID
        );

        // Verify caller is authority
        const config = await program.account.config.fetch(configPda);
        const configAuthority = (config as { authority: PublicKey }).authority;
        if (configAuthority.toString() !== authority.toString()) {
          toast.error("Only the contract authority can update markets");
          return undefined;
        }

        // Fetch market to get yes/no token mints for PDA derivation
        const marketData = await program.account.market.fetch(marketAddress);
        const yesToken = (marketData as { yesTokenMint: PublicKey }).yesTokenMint;
        const noToken = (marketData as { noTokenMint: PublicKey }).noTokenMint;

        const [marketPda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from(SEED_MARKET),
            yesToken.toBuffer(),
            noToken.toBuffer(),
          ],
          PROGRAM_ID
        );

        const updateMarketIx = await (
          program.methods as unknown as {
            updateMarket: (params: {
              marketName: string | null;
              question: string | null;
              slug: string | null;
              imageUrl: string | null;
              source: string | null;
              category: string | null;
            }) => {
              accountsPartial: (acc: unknown) => {
                instruction: () => Promise<TransactionInstruction>;
              };
            };
          }
        )
          .updateMarket({
            marketName: params.marketName ?? null,
            question: params.question ?? null,
            slug: params.slug ?? null,
            imageUrl: params.imageUrl ?? null,
            source: params.source ?? null,
            category: params.category ?? null,
          })
          .accountsPartial({
            globalConfig: configPda,
            market: marketPda,
            yesToken,
            noToken,
            authority,
          })
          .instruction();

        const tx = new Transaction();
        addComputeBudget(tx, 200_000, 1);
        tx.add(updateMarketIx);

        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash("confirmed");
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;
        tx.feePayer = authority;

        let sig: string;
        if (
          (walletProvider as { signAndSendTransaction?: (t: Transaction) => Promise<{ signature?: string } | string> }).signAndSendTransaction
        ) {
          const result = await (
            walletProvider as { signAndSendTransaction: (t: Transaction) => Promise<{ signature?: string } | string> }
          ).signAndSendTransaction(tx);
          sig = typeof result === "string" ? result : (result.signature ?? "");
        } else {
          const signedTx = await (
            walletProvider as { signTransaction: (t: Transaction) => Promise<Transaction> }
          ).signTransaction(tx);
          sig = await connection.sendRawTransaction(signedTx.serialize(), {
            skipPreflight: true,
          });
        }

        await connection.confirmTransaction(
          { signature: sig, blockhash, lastValidBlockHeight },
          "confirmed"
        );

        toast.success("Market updated successfully!");
        return sig;
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes("IncorrectAuthority") || msg.includes("InvalidMigrationAuthority")) {
          toast.error("Only the admin can update markets");
        } else if (msg.includes("StringTooLong")) {
          toast.error("One or more fields exceed the maximum length");
        } else {
          toast.error(`Update failed: ${msg.slice(0, 80)}`);
        }
        throw error;
      }
    },
    [getProgram, address, connection, walletProvider]
  );

  const getConfigTiers = useCallback(async () => {
    const program = getProgram();
    if (!program) return null;
    try {
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from(SEED_CONFIG)],
        PROGRAM_ID
      );
      const config = await program.account.config.fetch(configPda);
      const c = config as Record<string, unknown>;
      const bn = (key: string) => {
        const v = c[key];
        if (v && typeof (v as BN).toNumber === "function") return (v as BN).toNumber();
        return typeof v === "number" ? v : 0;
      };
      return {
        platformBuyFeeBps: bn("platformBuyFee") || bn("platform_buy_fee"),
        platformSellFeeBps: bn("platformSellFee") || bn("platform_sell_fee"),
        lpBuyFeeBps: bn("lpBuyFee") || bn("lp_buy_fee"),
        lpSellFeeBps: bn("lpSellFee") || bn("lp_sell_fee"),
        stakingFeeShareBps: bn("stakingFeeShareBps") || bn("staking_fee_share_bps"),
        bronzeMin: bn("tierBronzeMin") || bn("tier_bronze_min"),
        bronzeDiscount: bn("tierBronzeDiscountBps") || bn("tier_bronze_discount_bps"),
        silverMin: bn("tierSilverMin") || bn("tier_silver_min"),
        silverDiscount: bn("tierSilverDiscountBps") || bn("tier_silver_discount_bps"),
        goldMin: bn("tierGoldMin") || bn("tier_gold_min"),
        goldDiscount: bn("tierGoldDiscountBps") || bn("tier_gold_discount_bps"),
        diamondMin: bn("tierDiamondMin") || bn("tier_diamond_min"),
        diamondDiscount: bn("tierDiamondDiscountBps") || bn("tier_diamond_discount_bps"),
      };
    } catch {
      return null;
    }
  }, [getProgram]);

  // ──────────────────────────────────────────────────────────────
  // v1 Conditional Token instructions
  // ──────────────────────────────────────────────────────────────

  /**
   * Deposit SOL collateral into a v1 market and receive YES + NO token pairs.
   */
  const depositCollateral = useCallback(
    async (
      marketPubkey: PublicKey,
      amount: number
    ): Promise<string | undefined> => {
      const program = getProgram();
      if (!program || !address) {
        toast.error("Please connect your wallet first");
        return undefined;
      }

      try {
        const user = new PublicKey(address);

        const [configPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_CONFIG)],
          PROGRAM_ID
        );
        const [globalVaultPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_GLOBAL)],
          PROGRAM_ID
        );
        const [v1ConfigPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_MARKET_V1_CONFIG), marketPubkey.toBuffer()],
          PROGRAM_ID
        );
        const [userInfoPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_USERINFO), user.toBuffer(), marketPubkey.toBuffer()],
          PROGRAM_ID
        );

        const market = await program.account.market.fetch(marketPubkey);
        const yesToken = (market as { yesTokenMint: PublicKey }).yesTokenMint;
        const noToken = (market as { noTokenMint: PublicKey }).noTokenMint;

        const globalYesAta = await getAssociatedTokenAddress(
          yesToken, globalVaultPda, true, TOKEN_2022_PROGRAM_ID
        );
        const globalNoAta = await getAssociatedTokenAddress(
          noToken, globalVaultPda, true, TOKEN_2022_PROGRAM_ID
        );
        const userYesAta = await getAssociatedTokenAddress(
          yesToken, user, false, TOKEN_2022_PROGRAM_ID
        );
        const userNoAta = await getAssociatedTokenAddress(
          noToken, user, false, TOKEN_2022_PROGRAM_ID
        );

        const tx = new Transaction();
        addComputeBudget(tx, 400_000, 1);

        // Ensure user ATAs exist
        const userYesAtaInfo = await connection.getAccountInfo(userYesAta);
        if (!userYesAtaInfo) {
          tx.add(createAssociatedTokenAccountInstruction(
            user, userYesAta, user, yesToken, TOKEN_2022_PROGRAM_ID
          ));
        }
        const userNoAtaInfo = await connection.getAccountInfo(userNoAta);
        if (!userNoAtaInfo) {
          tx.add(createAssociatedTokenAccountInstruction(
            user, userNoAta, user, noToken, TOKEN_2022_PROGRAM_ID
          ));
        }

        const amountLamports = new BN(Math.floor(amount * 1e9));

        const depositIx = await (
          program.methods as unknown as {
            depositCollateral: (amount: BN) => {
              accountsPartial: (acc: unknown) => {
                instruction: () => Promise<TransactionInstruction>;
              };
            };
          }
        )
          .depositCollateral(amountLamports)
          .accountsPartial({
            globalConfig: configPda,
            market: marketPubkey,
            marketV1Config: v1ConfigPda,
            globalVault: globalVaultPda,
            yesToken,
            noToken,
            globalYesAta,
            globalNoAta,
            userYesAta,
            userNoAta,
            userInfo: userInfoPda,
            user,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          })
          .instruction();

        tx.add(depositIx);

        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash("confirmed");
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;
        tx.feePayer = user;

        let signature: string;
        if (
          (walletProvider as { signAndSendTransaction?: (tx: Transaction) => Promise<{ signature?: string } | string> }).signAndSendTransaction
        ) {
          const result = await (
            walletProvider as { signAndSendTransaction: (tx: Transaction) => Promise<{ signature?: string } | string> }
          ).signAndSendTransaction(tx);
          signature = typeof result === "string" ? result : (result.signature ?? "");
        } else {
          const signedTx = await (
            walletProvider as { signTransaction: (tx: Transaction) => Promise<Transaction> }
          ).signTransaction(tx);
          signature = await connection.sendRawTransaction(signedTx.serialize(), {
            skipPreflight: true,
          });
        }

        await connection.confirmTransaction(
          { signature, blockhash, lastValidBlockHeight },
          "confirmed"
        );

        toast.success("Collateral deposited successfully!");
        return signature;
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        toast.error(`Deposit collateral failed: ${msg.slice(0, 80)}`);
        throw error;
      }
    },
    [getProgram, address, connection, walletProvider]
  );

  /**
   * Withdraw collateral from a v1 market by burning equal YES + NO token pairs.
   */
  const withdrawCollateral = useCallback(
    async (
      marketPubkey: PublicKey,
      pairs: number
    ): Promise<string | undefined> => {
      const program = getProgram();
      if (!program || !address) {
        toast.error("Please connect your wallet first");
        return undefined;
      }

      try {
        const user = new PublicKey(address);

        const [configPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_CONFIG)],
          PROGRAM_ID
        );
        const [globalVaultPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_GLOBAL)],
          PROGRAM_ID
        );
        const [v1ConfigPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_MARKET_V1_CONFIG), marketPubkey.toBuffer()],
          PROGRAM_ID
        );
        const [userInfoPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_USERINFO), user.toBuffer(), marketPubkey.toBuffer()],
          PROGRAM_ID
        );

        const market = await program.account.market.fetch(marketPubkey);
        const yesToken = (market as { yesTokenMint: PublicKey }).yesTokenMint;
        const noToken = (market as { noTokenMint: PublicKey }).noTokenMint;

        const globalYesAta = await getAssociatedTokenAddress(
          yesToken, globalVaultPda, true, TOKEN_2022_PROGRAM_ID
        );
        const globalNoAta = await getAssociatedTokenAddress(
          noToken, globalVaultPda, true, TOKEN_2022_PROGRAM_ID
        );
        const userYesAta = await getAssociatedTokenAddress(
          yesToken, user, false, TOKEN_2022_PROGRAM_ID
        );
        const userNoAta = await getAssociatedTokenAddress(
          noToken, user, false, TOKEN_2022_PROGRAM_ID
        );

        const pairsBN = new BN(Math.floor(pairs * 1e6));

        const tx = new Transaction();
        addComputeBudget(tx, 400_000, 1);

        const withdrawIx = await (
          program.methods as unknown as {
            withdrawCollateral: (pairs: BN) => {
              accountsPartial: (acc: unknown) => {
                instruction: () => Promise<TransactionInstruction>;
              };
            };
          }
        )
          .withdrawCollateral(pairsBN)
          .accountsPartial({
            globalConfig: configPda,
            market: marketPubkey,
            marketV1Config: v1ConfigPda,
            globalVault: globalVaultPda,
            yesToken,
            noToken,
            globalYesAta,
            globalNoAta,
            userYesAta,
            userNoAta,
            userInfo: userInfoPda,
            user,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          })
          .instruction();

        tx.add(withdrawIx);

        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash("confirmed");
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;
        tx.feePayer = user;

        let signature: string;
        if (
          (walletProvider as { signAndSendTransaction?: (tx: Transaction) => Promise<{ signature?: string } | string> }).signAndSendTransaction
        ) {
          const result = await (
            walletProvider as { signAndSendTransaction: (tx: Transaction) => Promise<{ signature?: string } | string> }
          ).signAndSendTransaction(tx);
          signature = typeof result === "string" ? result : (result.signature ?? "");
        } else {
          const signedTx = await (
            walletProvider as { signTransaction: (tx: Transaction) => Promise<Transaction> }
          ).signTransaction(tx);
          signature = await connection.sendRawTransaction(signedTx.serialize(), {
            skipPreflight: true,
          });
        }

        await connection.confirmTransaction(
          { signature, blockhash, lastValidBlockHeight },
          "confirmed"
        );

        toast.success("Collateral withdrawn successfully!");
        return signature;
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        toast.error(`Withdraw collateral failed: ${msg.slice(0, 80)}`);
        throw error;
      }
    },
    [getProgram, address, connection, walletProvider]
  );

  /**
   * Swap tokens on a v1 conditional-token market through the single AMM pool.
   */
  const swapV2 = useCallback(
    async (
      marketPubkey: PublicKey,
      amountIn: number,
      minAmountOut: number,
      buyYes: boolean
    ): Promise<string | undefined> => {
      const program = getProgram();
      if (!program || !address) {
        toast.error("Please connect your wallet first");
        return undefined;
      }

      try {
        const user = new PublicKey(address);

        const [configPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_CONFIG)],
          PROGRAM_ID
        );
        const [globalVaultPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_GLOBAL)],
          PROGRAM_ID
        );
        const [v1ConfigPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_MARKET_V1_CONFIG), marketPubkey.toBuffer()],
          PROGRAM_ID
        );
        const [userInfoPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_USERINFO), user.toBuffer(), marketPubkey.toBuffer()],
          PROGRAM_ID
        );

        const market = await program.account.market.fetch(marketPubkey);
        const configAccount = await program.account.config.fetch(configPda);
        const yesToken = (market as { yesTokenMint: PublicKey }).yesTokenMint;
        const noToken = (market as { noTokenMint: PublicKey }).noTokenMint;

        const globalYesAta = await getAssociatedTokenAddress(
          yesToken, globalVaultPda, true, TOKEN_2022_PROGRAM_ID
        );
        const globalNoAta = await getAssociatedTokenAddress(
          noToken, globalVaultPda, true, TOKEN_2022_PROGRAM_ID
        );
        const userYesAta = await getAssociatedTokenAddress(
          yesToken, user, false, TOKEN_2022_PROGRAM_ID
        );
        const userNoAta = await getAssociatedTokenAddress(
          noToken, user, false, TOKEN_2022_PROGRAM_ID
        );

        const tx = new Transaction();
        addComputeBudget(tx, 500_000, 1);

        // Ensure user ATAs exist
        const userYesAtaInfo = await connection.getAccountInfo(userYesAta);
        if (!userYesAtaInfo) {
          tx.add(createAssociatedTokenAccountInstruction(
            user, userYesAta, user, yesToken, TOKEN_2022_PROGRAM_ID
          ));
        }
        const userNoAtaInfo = await connection.getAccountInfo(userNoAta);
        if (!userNoAtaInfo) {
          tx.add(createAssociatedTokenAccountInstruction(
            user, userNoAta, user, noToken, TOKEN_2022_PROGRAM_ID
          ));
        }

        // amountIn is in token units (1e6 decimals)
        const amountInBN = new BN(Math.floor(amountIn * 1e6));
        const minAmountOutBN = new BN(Math.floor(minAmountOut * 1e6));

        const swapIx = await (
          program.methods as unknown as {
            swapV2: (amountIn: BN, minAmountOut: BN, buyYes: boolean) => {
              accountsPartial: (acc: unknown) => {
                instruction: () => Promise<TransactionInstruction>;
              };
            };
          }
        )
          .swapV2(amountInBN, minAmountOutBN, buyYes)
          .accountsPartial({
            globalConfig: configPda,
            teamWallet: (configAccount as { teamWallet: PublicKey }).teamWallet,
            market: marketPubkey,
            marketV1Config: v1ConfigPda,
            globalVault: globalVaultPda,
            yesToken,
            noToken,
            globalYesAta,
            globalNoAta,
            userYesAta,
            userNoAta,
            userInfo: userInfoPda,
            user,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          })
          .instruction();

        tx.add(swapIx);

        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash("confirmed");
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;
        tx.feePayer = user;

        let signature: string;
        if (
          (walletProvider as { signAndSendTransaction?: (tx: Transaction) => Promise<{ signature?: string } | string> }).signAndSendTransaction
        ) {
          const result = await (
            walletProvider as { signAndSendTransaction: (tx: Transaction) => Promise<{ signature?: string } | string> }
          ).signAndSendTransaction(tx);
          signature = typeof result === "string" ? result : (result.signature ?? "");
        } else {
          const signedTx = await (
            walletProvider as { signTransaction: (tx: Transaction) => Promise<Transaction> }
          ).signTransaction(tx);
          signature = await connection.sendRawTransaction(signedTx.serialize(), {
            skipPreflight: true,
          });
        }

        await connection.confirmTransaction(
          { signature, blockhash, lastValidBlockHeight },
          "confirmed"
        );

        toast.success(buyYes ? "Swapped to YES tokens!" : "Swapped to NO tokens!");
        return signature;
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes("SlippageExceeded") || msg.includes("0x1779")) {
          toast.error("Slippage exceeded. Try increasing slippage or reducing amount.");
        } else {
          toast.error(`Swap v2 failed: ${msg.slice(0, 80)}`);
        }
        throw error;
      }
    },
    [getProgram, address, connection, walletProvider]
  );

  /**
   * Claim winnings from a resolved v1 market.
   * Winning tokens redeem at a fixed face value (collateralPerPair).
   */
  const claimWinningsV2 = useCallback(
    async (marketPubkey: PublicKey): Promise<string | undefined> => {
      const program = getProgram();
      if (!program || !address) {
        toast.error("Please connect your wallet first");
        return undefined;
      }

      try {
        const user = new PublicKey(address);

        const [configPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_CONFIG)],
          PROGRAM_ID
        );
        const [globalVaultPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_GLOBAL)],
          PROGRAM_ID
        );
        const [v1ConfigPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_MARKET_V1_CONFIG), marketPubkey.toBuffer()],
          PROGRAM_ID
        );
        const [userInfoPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_USERINFO), user.toBuffer(), marketPubkey.toBuffer()],
          PROGRAM_ID
        );

        const market = await program.account.market.fetch(marketPubkey);
        const yesToken = (market as { yesTokenMint: PublicKey }).yesTokenMint;
        const noToken = (market as { noTokenMint: PublicKey }).noTokenMint;

        const marketData = market as { isCompleted?: boolean };
        if (!marketData.isCompleted) {
          toast.error("Market is not resolved yet");
          return undefined;
        }

        const claimTx = new Transaction();
        addComputeBudget(claimTx, 300_000, 1);

        // Check if UserInfo PDA exists — if not, prepend syncUserInfo instruction
        const userInfoAccount = await connection.getAccountInfo(userInfoPda);
        if (!userInfoAccount) {
          const userYesAta = await getAssociatedTokenAddress(yesToken, user, false, TOKEN_2022_PROGRAM_ID);
          const userNoAta = await getAssociatedTokenAddress(noToken, user, false, TOKEN_2022_PROGRAM_ID);

          const syncIx = await (
            program.methods as unknown as {
              syncUserInfo: () => {
                accountsPartial: (acc: unknown) => {
                  instruction: () => Promise<TransactionInstruction>;
                };
              };
            }
          )
            .syncUserInfo()
            .accountsPartial({
              market: marketPubkey,
              userInfo: userInfoPda,
              user,
              payer: user,
              yesMint: yesToken,
              noMint: noToken,
              userYesAta,
              userNoAta,
              systemProgram: SystemProgram.programId,
            })
            .instruction();

          claimTx.add(syncIx);
        }

        const claimIx = await (
          program.methods as unknown as {
            claimWinningsV2: () => {
              accountsPartial: (acc: unknown) => {
                instruction: () => Promise<TransactionInstruction>;
              };
            };
          }
        )
          .claimWinningsV2()
          .accountsPartial({
            globalConfig: configPda,
            market: marketPubkey,
            marketV1Config: v1ConfigPda,
            globalVault: globalVaultPda,
            yesToken,
            noToken,
            userInfo: userInfoPda,
            user,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          })
          .instruction();

        claimTx.add(claimIx);

        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash("confirmed");
        claimTx.recentBlockhash = blockhash;
        claimTx.lastValidBlockHeight = lastValidBlockHeight;
        claimTx.feePayer = user;

        let signature: string;
        if (
          (walletProvider as { signAndSendTransaction?: (tx: Transaction) => Promise<{ signature?: string } | string> }).signAndSendTransaction
        ) {
          const result = await (
            walletProvider as { signAndSendTransaction: (tx: Transaction) => Promise<{ signature?: string } | string> }
          ).signAndSendTransaction(claimTx);
          signature = typeof result === "string" ? result : (result.signature ?? "");
        } else {
          const signedTx = await (
            walletProvider as { signTransaction: (tx: Transaction) => Promise<Transaction> }
          ).signTransaction(claimTx);
          signature = await connection.sendRawTransaction(signedTx.serialize(), {
            skipPreflight: true,
          });
        }

        await connection.confirmTransaction(
          { signature, blockhash, lastValidBlockHeight },
          "confirmed"
        );

        toast.success("Winnings claimed successfully!");
        return signature;
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes("AlreadyClaimed")) {
          toast.error("Already claimed your winnings");
        } else if (msg.includes("NoWinningTokens")) {
          toast.error("No winning tokens to claim");
        } else {
          toast.error(`Claim v2 failed: ${msg.slice(0, 80)}`);
        }
        throw error;
      }
    },
    [getProgram, address, connection, walletProvider]
  );

  return {
    createMarket,
    createMarketWithOptions,
    swap,
    resolution,
    resolveViaOracle,
    claimWinnings,
    initializeMaster,
    getUserTokenBalances,
    calculateTokensForSolAmount,
    calculateBuyOutput,
    getMarket,
    getAllMarkets,
    updateMarket,
    getConfigTiers,
    // v1 conditional token
    depositCollateral,
    withdrawCollateral,
    swapV2,
    claimWinningsV2,
    program: getProgram() as Program<PredictionMarket> | null,
  };
}
