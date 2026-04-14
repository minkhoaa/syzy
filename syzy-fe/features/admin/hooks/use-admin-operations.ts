"use client";

import { useCallback, useMemo } from "react";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import {
  PublicKey,
  Transaction,
  Connection,
  VersionedTransaction,
  SystemProgram,
  ComputeBudgetProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  Program,
  AnchorProvider,
  Idl,
  BN,
} from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { toast } from "sonner";

import type { PredictionMarket } from "@/lib/types/prediction-market";
import IDLJson from "@/lib/constants/IDL.json";
import {
  PROGRAM_ID,
  SEED_CONFIG,
  SEED_GLOBAL,
  SEED_SHIELDED_POOL,
  SEED_SHARD,
  SEED_LEAVES,
  SEED_SUBTREE,
  SEED_TEE_REGISTRY,
} from "@/lib/constants/programs";
import { RPC_URL, CLUSTER } from "@/lib/constants/network";
import { OYRADE_MINT, REWARD_POOL_PROGRAM_ID } from "@/lib/constants/staking";

const predictionMarketIdl = (IDLJson as { default?: unknown }).default ?? IDLJson;

export interface ConfigStatus {
  initialized: boolean;
  authority: string;
  pendingAuthority: string | null;
  teamWallet: string;
  platformBuyFee: number;
  platformSellFee: number;
  lpBuyFee: number;
  lpSellFee: number;
  tokenSupplyConfig: string;
  tokenDecimalsConfig: number;
  initialRealTokenReservesConfig: string;
  minSolLiquidity: string;
}

export function useAdminOperations() {
  const { address } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("solana");

  const connection = useMemo(() => new Connection(RPC_URL, CLUSTER), []);

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

  /**
   * Fetch the current config status from on-chain
   */
  const getConfigStatus = useCallback(async (): Promise<ConfigStatus | null> => {
    const program = getReadOnlyProgram();
    try {
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from(SEED_CONFIG)],
        PROGRAM_ID
      );

      const config = await program.account.config.fetch(configPda);
      const configData = config as {
        authority: PublicKey;
        pendingAuthority: PublicKey;
        teamWallet: PublicKey;
        platformBuyFee: BN;
        platformSellFee: BN;
        lpBuyFee: BN;
        lpSellFee: BN;
        tokenSupplyConfig: BN;
        tokenDecimalsConfig: number;
        initialRealTokenReservesConfig: BN;
        minSolLiquidity: BN;
        initialized: boolean;
      };

      const pendingAuth = configData.pendingAuthority.toString();
      const isNoPending = pendingAuth === SystemProgram.programId.toString() || pendingAuth === PublicKey.default.toString();

      return {
        initialized: configData.initialized,
        authority: configData.authority.toString(),
        pendingAuthority: isNoPending ? null : pendingAuth,
        teamWallet: configData.teamWallet.toString(),
        platformBuyFee: configData.platformBuyFee.toNumber(),
        platformSellFee: configData.platformSellFee.toNumber(),
        lpBuyFee: configData.lpBuyFee.toNumber(),
        lpSellFee: configData.lpSellFee.toNumber(),
        tokenSupplyConfig: configData.tokenSupplyConfig.toString(),
        tokenDecimalsConfig: configData.tokenDecimalsConfig,
        initialRealTokenReservesConfig: configData.initialRealTokenReservesConfig.toString(),
        minSolLiquidity: configData.minSolLiquidity.toString(),
      };
    } catch (error) {
      console.error("Failed to fetch config:", error);
      return null;
    }
  }, [getReadOnlyProgram]);

  /**
   * Nominate a new authority (step 1 of authority transfer)
   */
  const nominateAuthority = useCallback(
    async (newAdmin: string): Promise<string | undefined> => {
      const program = getProgram();
      if (!program || !address) {
        toast.error("Please connect your wallet");
        return undefined;
      }

      try {
        const admin = new PublicKey(address);
        const newAdminPubkey = new PublicKey(newAdmin);

        const [configPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_CONFIG)],
          PROGRAM_ID
        );

        const tx = new Transaction();
        addComputeBudget(tx, 200_000, 1);

        const nominateIx = await (
          program.methods as {
            nominateAuthority: (newAdmin: PublicKey) => {
              accountsPartial: (acc: unknown) => { instruction: () => Promise<TransactionInstruction> };
            };
          }
        )
          .nominateAuthority(newAdminPubkey)
          .accountsPartial({
            admin,
            globalConfig: configPda,
          })
          .instruction();

        tx.add(nominateIx);

        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash("confirmed");
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;
        tx.feePayer = admin;

        let signature: string;
        if (
          (walletProvider as { signAndSendTransaction?: (t: Transaction) => Promise<{ signature?: string } | string> }).signAndSendTransaction
        ) {
          const result = await (
            walletProvider as { signAndSendTransaction: (t: Transaction) => Promise<{ signature?: string } | string> }
          ).signAndSendTransaction(tx);
          signature = typeof result === "string" ? result : (result.signature ?? "");
        } else {
          const signedTx = await (
            walletProvider as { signTransaction: (t: Transaction) => Promise<Transaction> }
          ).signTransaction(tx);
          signature = await connection.sendRawTransaction(signedTx.serialize(), {
            skipPreflight: true,
          });
        }

        await connection.confirmTransaction(
          { signature, blockhash, lastValidBlockHeight },
          "confirmed"
        );

        toast.success("Authority nomination submitted!");
        return signature;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        toast.error(`Failed to nominate authority: ${msg.slice(0, 80)}`);
        throw error;
      }
    },
    [getProgram, address, connection, walletProvider]
  );

  /**
   * Accept authority (step 2 of authority transfer)
   */
  const acceptAuthority = useCallback(async (): Promise<string | undefined> => {
    const program = getProgram();
    if (!program || !address) {
      toast.error("Please connect your wallet");
      return undefined;
    }

    try {
      const newAdmin = new PublicKey(address);

      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from(SEED_CONFIG)],
        PROGRAM_ID
      );

      const tx = new Transaction();
      addComputeBudget(tx, 200_000, 1);

      const acceptIx = await (
        program.methods as {
          acceptAuthority: () => {
            accountsPartial: (acc: unknown) => { instruction: () => Promise<TransactionInstruction> };
          };
        }
      )
        .acceptAuthority()
        .accountsPartial({
          newAdmin,
          globalConfig: configPda,
        })
        .instruction();

      tx.add(acceptIx);

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      tx.recentBlockhash = blockhash;
      tx.lastValidBlockHeight = lastValidBlockHeight;
      tx.feePayer = newAdmin;

      let signature: string;
      if (
        (walletProvider as { signAndSendTransaction?: (t: Transaction) => Promise<{ signature?: string } | string> }).signAndSendTransaction
      ) {
        const result = await (
          walletProvider as { signAndSendTransaction: (t: Transaction) => Promise<{ signature?: string } | string> }
        ).signAndSendTransaction(tx);
        signature = typeof result === "string" ? result : (result.signature ?? "");
      } else {
        const signedTx = await (
          walletProvider as { signTransaction: (t: Transaction) => Promise<Transaction> }
        ).signTransaction(tx);
        signature = await connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: true,
        });
      }

      await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        "confirmed"
      );

      toast.success("Authority accepted! You are now the admin.");
      return signature;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to accept authority: ${msg.slice(0, 80)}`);
      throw error;
    }
  }, [getProgram, address, connection, walletProvider]);

  /**
   * Initialize shielded pool for a market
   */
  const initializeShieldedPool = useCallback(
    async (marketPda: PublicKey): Promise<{ signature: string; identifier: Uint8Array } | undefined> => {
      const program = getProgram();
      if (!program || !address) {
        toast.error("Please connect your wallet");
        return undefined;
      }

      try {
        const authority = new PublicKey(address);
        const identifier = new Uint8Array(16);
        crypto.getRandomValues(identifier);

        const [shieldedPoolPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_SHIELDED_POOL), marketPda.toBuffer()],
          PROGRAM_ID
        );

        const [leavesIndexerPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_LEAVES), Buffer.from(identifier)],
          PROGRAM_ID
        );

        const [subtreeIndexerPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_SUBTREE), Buffer.from(identifier)],
          PROGRAM_ID
        );

        const tx = new Transaction();
        addComputeBudget(tx, 400_000, 1);

        const initPoolIx = await (
          program.methods as {
            initializeShieldedPool: (id: number[]) => {
              accountsPartial: (acc: unknown) => { instruction: () => Promise<TransactionInstruction> };
            };
          }
        )
          .initializeShieldedPool(Array.from(identifier))
          .accountsPartial({
            market: marketPda,
            shieldedPool: shieldedPoolPda,
            leavesIndexer: leavesIndexerPda,
            subtreeIndexer: subtreeIndexerPda,
            authority,
            systemProgram: SystemProgram.programId,
          })
          .instruction();

        tx.add(initPoolIx);

        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash("confirmed");
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;
        tx.feePayer = authority;

        let signature: string;
        if (
          (walletProvider as { signAndSendTransaction?: (t: Transaction) => Promise<{ signature?: string } | string> }).signAndSendTransaction
        ) {
          const result = await (
            walletProvider as { signAndSendTransaction: (t: Transaction) => Promise<{ signature?: string } | string> }
          ).signAndSendTransaction(tx);
          signature = typeof result === "string" ? result : (result.signature ?? "");
        } else {
          const signedTx = await (
            walletProvider as { signTransaction: (t: Transaction) => Promise<Transaction> }
          ).signTransaction(tx);
          signature = await connection.sendRawTransaction(signedTx.serialize(), {
            skipPreflight: true,
          });
        }

        await connection.confirmTransaction(
          { signature, blockhash, lastValidBlockHeight },
          "confirmed"
        );

        toast.success("Shielded pool initialized!");
        return { signature, identifier };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        toast.error(`Failed to initialize shielded pool: ${msg.slice(0, 80)}`);
        throw error;
      }
    },
    [getProgram, address, connection, walletProvider]
  );

  /**
   * Initialize nullifier shards for a shielded pool
   */
  const initializeNullifierShards = useCallback(
    async (marketPda: PublicKey, identifier: Uint8Array): Promise<string | undefined> => {
      const program = getProgram();
      if (!program || !address) {
        toast.error("Please connect your wallet");
        return undefined;
      }

      try {
        const authority = new PublicKey(address);

        const [shieldedPoolPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_SHIELDED_POOL), marketPda.toBuffer()],
          PROGRAM_ID
        );

        const [shard0Pda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from(SEED_SHARD),
            Buffer.from(identifier),
            Buffer.from([1]),
            Buffer.from([0]),
          ],
          PROGRAM_ID
        );

        const [shard1Pda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from(SEED_SHARD),
            Buffer.from(identifier),
            Buffer.from([1]),
            Buffer.from([1]),
          ],
          PROGRAM_ID
        );

        // Check which shards already exist to avoid re-init failures
        const [shard0Info, shard1Info] = await Promise.all([
          connection.getAccountInfo(shard0Pda),
          connection.getAccountInfo(shard1Pda),
        ]);

        const tx = new Transaction();
        addComputeBudget(tx, 400_000, 1);
        let needsInit = false;

        if (!shard0Info) {
          const initShard0Ix = await (
            program.methods as {
              initializeShard0: () => {
                accountsPartial: (acc: unknown) => { instruction: () => Promise<TransactionInstruction> };
              };
            }
          )
            .initializeShard0()
            .accountsPartial({
              shieldedPool: shieldedPoolPda,
              shard0: shard0Pda,
              authority,
              systemProgram: SystemProgram.programId,
            })
            .instruction();

          tx.add(initShard0Ix);
          needsInit = true;
        }

        if (!shard1Info) {
          const initShard1Ix = await (
            program.methods as {
              initializeShard1: () => {
                accountsPartial: (acc: unknown) => { instruction: () => Promise<TransactionInstruction> };
              };
            }
          )
            .initializeShard1()
            .accountsPartial({
              shieldedPool: shieldedPoolPda,
              shard1: shard1Pda,
              authority,
              systemProgram: SystemProgram.programId,
            })
            .instruction();

          tx.add(initShard1Ix);
          needsInit = true;
        }

        if (!needsInit) {
          toast.success("Nullifier shards already initialized!");
          return undefined;
        }

        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash("confirmed");
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;
        tx.feePayer = authority;

        let signature: string;
        if (
          (walletProvider as { signAndSendTransaction?: (t: Transaction) => Promise<{ signature?: string } | string> }).signAndSendTransaction
        ) {
          const result = await (
            walletProvider as { signAndSendTransaction: (t: Transaction) => Promise<{ signature?: string } | string> }
          ).signAndSendTransaction(tx);
          signature = typeof result === "string" ? result : (result.signature ?? "");
        } else {
          const signedTx = await (
            walletProvider as { signTransaction: (t: Transaction) => Promise<Transaction> }
          ).signTransaction(tx);
          signature = await connection.sendRawTransaction(signedTx.serialize(), {
            skipPreflight: true,
          });
        }

        await connection.confirmTransaction(
          { signature, blockhash, lastValidBlockHeight },
          "confirmed"
        );

        const parts = [];
        if (!shard0Info) parts.push("shard 0");
        if (!shard1Info) parts.push("shard 1");
        toast.success(`Initialized ${parts.join(" and ")}!`);
        return signature;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        toast.error(`Failed to initialize shards: ${msg.slice(0, 80)}`);
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

      // Reward pool vault PDA (receives staking fee share)
      const REWARD_POOL_VAULT = new PublicKey("9WbWh4FRqMzvPKio6rz9dptRNWKnfjmmCPjRwK2dpcD7");

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
        // Reward pool & tier discount fields
        rewardPoolVault: REWARD_POOL_VAULT,
        oyradeMint: OYRADE_MINT,
        stakingFeeShareBps: new BN(3000),
        tierBronzeMin: new BN(1_000_000_000),
        tierBronzeDiscountBps: new BN(2000),
        tierSilverMin: new BN(10_000_000_000),
        tierSilverDiscountBps: new BN(3000),
        tierGoldMin: new BN(50_000_000_000),
        tierGoldDiscountBps: new BN(4500),
        tierDiamondMin: new BN(100_000_000_000),
        tierDiamondDiscountBps: new BN(5000),
        rewardPoolProgram: REWARD_POOL_PROGRAM_ID,
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

  /**
   * Check if shielded pool exists for a market
   */
  const checkShieldedPoolExists = useCallback(
    async (marketPda: PublicKey): Promise<boolean> => {
      try {
        const [shieldedPoolPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_SHIELDED_POOL), marketPda.toBuffer()],
          PROGRAM_ID
        );

        const accountInfo = await connection.getAccountInfo(shieldedPoolPda);
        return accountInfo !== null;
      } catch {
        return false;
      }
    },
    [connection]
  );

  // ==========================================================================
  // TEE REGISTRY ADMIN OPERATIONS
  // ==========================================================================

  /**
   * Initialize the TEE registry (one-time admin operation)
   */
  const initializeTeeRegistry = useCallback(async (): Promise<string | undefined> => {
    const program = getProgram();
    if (!program || !address) {
      toast.error("Please connect your wallet");
      return undefined;
    }

    try {
      const admin = new PublicKey(address);
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from(SEED_CONFIG)],
        PROGRAM_ID
      );
      const [teeRegistryPda] = PublicKey.findProgramAddressSync(
        [Buffer.from(SEED_TEE_REGISTRY)],
        PROGRAM_ID
      );

      const tx = new Transaction();
      addComputeBudget(tx, 200_000, 1);

      const initIx = await (
        program.methods as {
          initializeTeeRegistry: () => {
            accountsPartial: (acc: unknown) => { instruction: () => Promise<TransactionInstruction> };
          };
        }
      )
        .initializeTeeRegistry()
        .accountsPartial({
          authority: admin,
          globalConfig: configPda,
          teeRegistry: teeRegistryPda,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      tx.add(initIx);

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      tx.recentBlockhash = blockhash;
      tx.lastValidBlockHeight = lastValidBlockHeight;
      tx.feePayer = admin;

      let signature: string;
      if (
        (walletProvider as { signAndSendTransaction?: (t: Transaction) => Promise<{ signature?: string } | string> }).signAndSendTransaction
      ) {
        const result = await (
          walletProvider as { signAndSendTransaction: (t: Transaction) => Promise<{ signature?: string } | string> }
        ).signAndSendTransaction(tx);
        signature = typeof result === "string" ? result : (result.signature ?? "");
      } else {
        const signedTx = await (
          walletProvider as { signTransaction: (t: Transaction) => Promise<Transaction> }
        ).signTransaction(tx);
        signature = await connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: true,
        });
      }

      await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        "confirmed"
      );

      toast.success("TEE Registry initialized!");
      return signature;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to initialize TEE registry: ${msg.slice(0, 80)}`);
      throw error;
    }
  }, [getProgram, address, connection, walletProvider]);

  /**
   * Register a TEE operator pubkey (admin only)
   */
  const registerTee = useCallback(
    async (operatorPubkey: PublicKey): Promise<string | undefined> => {
      const program = getProgram();
      if (!program || !address) {
        toast.error("Please connect your wallet");
        return undefined;
      }

      try {
        const admin = new PublicKey(address);
        const [configPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_CONFIG)],
          PROGRAM_ID
        );
        const [teeRegistryPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_TEE_REGISTRY)],
          PROGRAM_ID
        );

        const tx = new Transaction();
        addComputeBudget(tx, 200_000, 1);

        const registerIx = await (
          program.methods as {
            registerTee: (operator: PublicKey) => {
              accountsPartial: (acc: unknown) => { instruction: () => Promise<TransactionInstruction> };
            };
          }
        )
          .registerTee(operatorPubkey)
          .accountsPartial({
            authority: admin,
            globalConfig: configPda,
            teeRegistry: teeRegistryPda,
          })
          .instruction();

        tx.add(registerIx);

        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash("confirmed");
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;
        tx.feePayer = admin;

        let signature: string;
        if (
          (walletProvider as { signAndSendTransaction?: (t: Transaction) => Promise<{ signature?: string } | string> }).signAndSendTransaction
        ) {
          const result = await (
            walletProvider as { signAndSendTransaction: (t: Transaction) => Promise<{ signature?: string } | string> }
          ).signAndSendTransaction(tx);
          signature = typeof result === "string" ? result : (result.signature ?? "");
        } else {
          const signedTx = await (
            walletProvider as { signTransaction: (t: Transaction) => Promise<Transaction> }
          ).signTransaction(tx);
          signature = await connection.sendRawTransaction(signedTx.serialize(), {
            skipPreflight: true,
          });
        }

        await connection.confirmTransaction(
          { signature, blockhash, lastValidBlockHeight },
          "confirmed"
        );

        toast.success("TEE operator registered!");
        return signature;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        toast.error(`Failed to register TEE operator: ${msg.slice(0, 80)}`);
        throw error;
      }
    },
    [getProgram, address, connection, walletProvider]
  );

  /**
   * Deregister a TEE operator pubkey (admin only)
   */
  const deregisterTee = useCallback(
    async (operatorPubkey: PublicKey): Promise<string | undefined> => {
      const program = getProgram();
      if (!program || !address) {
        toast.error("Please connect your wallet");
        return undefined;
      }

      try {
        const admin = new PublicKey(address);
        const [configPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_CONFIG)],
          PROGRAM_ID
        );
        const [teeRegistryPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_TEE_REGISTRY)],
          PROGRAM_ID
        );

        const tx = new Transaction();
        addComputeBudget(tx, 200_000, 1);

        const deregisterIx = await (
          program.methods as {
            deregisterTee: (operator: PublicKey) => {
              accountsPartial: (acc: unknown) => { instruction: () => Promise<TransactionInstruction> };
            };
          }
        )
          .deregisterTee(operatorPubkey)
          .accountsPartial({
            authority: admin,
            globalConfig: configPda,
            teeRegistry: teeRegistryPda,
          })
          .instruction();

        tx.add(deregisterIx);

        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash("confirmed");
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;
        tx.feePayer = admin;

        let signature: string;
        if (
          (walletProvider as { signAndSendTransaction?: (t: Transaction) => Promise<{ signature?: string } | string> }).signAndSendTransaction
        ) {
          const result = await (
            walletProvider as { signAndSendTransaction: (t: Transaction) => Promise<{ signature?: string } | string> }
          ).signAndSendTransaction(tx);
          signature = typeof result === "string" ? result : (result.signature ?? "");
        } else {
          const signedTx = await (
            walletProvider as { signTransaction: (t: Transaction) => Promise<Transaction> }
          ).signTransaction(tx);
          signature = await connection.sendRawTransaction(signedTx.serialize(), {
            skipPreflight: true,
          });
        }

        await connection.confirmTransaction(
          { signature, blockhash, lastValidBlockHeight },
          "confirmed"
        );

        toast.success("TEE operator deregistered!");
        return signature;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        toast.error(`Failed to deregister TEE operator: ${msg.slice(0, 80)}`);
        throw error;
      }
    },
    [getProgram, address, connection, walletProvider]
  );

  const setSp1Vkey = useCallback(
    async (vkeyHash: number[]) => {
      try {
        const program = getProgram();
        if (!program) throw new Error("Program not ready");
        if (!address) throw new Error("Wallet not connected");
        const admin = new PublicKey(address);

        const [configPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_CONFIG)],
          PROGRAM_ID
        );

        const tx = new Transaction();
        addComputeBudget(tx, 200_000, 1);

        const setVkeyIx = await (
          program.methods as {
            setSp1Vkey: (vkeyHash: number[]) => {
              accountsPartial: (acc: unknown) => { instruction: () => Promise<TransactionInstruction> };
            };
          }
        )
          .setSp1Vkey(vkeyHash)
          .accountsPartial({
            admin: admin,
            globalConfig: configPda,
          })
          .instruction();

        tx.add(setVkeyIx);

        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash("confirmed");
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;
        tx.feePayer = admin;

        let signature: string;
        if (
          (walletProvider as { signAndSendTransaction?: (t: Transaction) => Promise<{ signature?: string } | string> }).signAndSendTransaction
        ) {
          const result = await (
            walletProvider as { signAndSendTransaction: (t: Transaction) => Promise<{ signature?: string } | string> }
          ).signAndSendTransaction(tx);
          signature = typeof result === "string" ? result : (result.signature ?? "");
        } else {
          const signedTx = await (
            walletProvider as { signTransaction: (t: Transaction) => Promise<Transaction> }
          ).signTransaction(tx);
          signature = await connection.sendRawTransaction(signedTx.serialize(), {
            skipPreflight: true,
          });
        }

        await connection.confirmTransaction(
          { signature, blockhash, lastValidBlockHeight },
          "confirmed"
        );

        toast.success("SP1 vkey hash updated!");
        return signature;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        toast.error(`Failed to set SP1 vkey: ${msg.slice(0, 80)}`);
        throw error;
      }
    },
    [getProgram, address, connection, walletProvider]
  );

  /**
   * Set the SP1 vkey hash from a hex string (e.g. "0x1234..." or "1234...").
   * Convenience wrapper around setSp1Vkey that handles hex-to-bytes conversion.
   */
  const setSp1VkeyFromHex = useCallback(
    async (hexStr: string) => {
      const cleaned = hexStr.startsWith("0x") ? hexStr.slice(2) : hexStr;
      if (cleaned.length !== 64) {
        throw new Error(`Invalid vkey hash length: expected 64 hex chars, got ${cleaned.length}`);
      }
      const bytes: number[] = [];
      for (let i = 0; i < 64; i += 2) {
        bytes.push(parseInt(cleaned.substring(i, i + 2), 16));
      }
      return setSp1Vkey(bytes);
    },
    [setSp1Vkey]
  );

  /**
   * Fetch the TEE registry status from on-chain
   */
  const getTeeRegistryStatus = useCallback(async () => {
    const program = getReadOnlyProgram();
    const [teeRegistryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(SEED_TEE_REGISTRY)],
      PROGRAM_ID
    );
    try {
      const registry = await program.account.teeRegistry.fetch(teeRegistryPda);
      const data = registry as unknown as { operators: PublicKey[] };
      const operators = data.operators.map((op) => op.toBase58());
      return {
        initialized: true,
        operators,
        operatorCount: operators.length,
      };
    } catch {
      return { initialized: false, operators: [] as string[], operatorCount: 0 };
    }
  }, [getReadOnlyProgram]);

  /**
   * Fetch the current SP1 vkey hash from the Config account
   */
  const getSp1VkeyHash = useCallback(async (): Promise<string> => {
    const program = getReadOnlyProgram();
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(SEED_CONFIG)],
      PROGRAM_ID
    );
    const config = await program.account.config.fetch(configPda);
    const hash = (config as { sp1VkeyHash: number[] }).sp1VkeyHash;
    return "0x" + hash.map((b: number) => b.toString(16).padStart(2, "0")).join("");
  }, [getReadOnlyProgram]);

  return {
    getConfigStatus,
    nominateAuthority,
    acceptAuthority,
    initializeShieldedPool,
    initializeNullifierShards,
    initializeMaster,
    checkShieldedPoolExists,
    initializeTeeRegistry,
    registerTee,
    deregisterTee,
    setSp1Vkey,
    setSp1VkeyFromHex,
    getTeeRegistryStatus,
    getSp1VkeyHash,
  };
}
