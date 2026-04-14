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
  getAssociatedTokenAddress,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { toast } from "sonner";

import type { PredictionMarket } from "@/lib/types/prediction-market";
import IDLJson from "@/lib/constants/IDL.json";
import {
  PROGRAM_ID,
  SEED_CONFIG,
  SEED_GLOBAL,
  SEED_USERINFO,
  SEED_MARKET_V1_CONFIG,
  SEED_MARKET_GROUP_CONFIG,
  TOKEN_MULTIPLIER,
} from "@/lib/constants/programs";
import { RPC_URL, CLUSTER } from "@/lib/constants/network";

const predictionMarketIdl = (IDLJson as { default?: unknown }).default ?? IDLJson;

function addComputeBudget(tx: Transaction, units: number, microLamports: number) {
  tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units }));
  tx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports }));
}

interface MarketInfo {
  publicKey: PublicKey;
  yesTokenMint: PublicKey;
  noTokenMint: PublicKey;
}

export function useNegRisk() {
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
    return new AnchorProvider(connection, anchorWallet, { commitment: "confirmed" });
  }, [address, walletProvider, connection]);

  const getProgram = useCallback(() => {
    const provider = getProvider();
    if (!provider) return null;
    return new Program(predictionMarketIdl as Idl, provider) as unknown as Program<PredictionMarket>;
  }, [getProvider]);

  async function sendAndConfirm(tx: Transaction): Promise<string> {
    const user = new PublicKey(address!);
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
    tx.recentBlockhash = blockhash;
    tx.lastValidBlockHeight = lastValidBlockHeight;
    tx.feePayer = user;

    let signature: string;
    if ((walletProvider as { signAndSendTransaction?: unknown }).signAndSendTransaction) {
      const result = await (
        walletProvider as { signAndSendTransaction: (tx: Transaction) => Promise<{ signature?: string } | string> }
      ).signAndSendTransaction(tx);
      signature = typeof result === "string" ? result : (result.signature ?? "");
    } else {
      const signedTx = await (
        walletProvider as { signTransaction: (tx: Transaction) => Promise<Transaction> }
      ).signTransaction(tx);
      signature = await connection.sendRawTransaction(signedTx.serialize(), { skipPreflight: true });
    }

    await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
    return signature;
  }

  /**
   * Sync UserInfo PDA from ATA balances (fixes v1 claim bug).
   */
  const syncUserInfo = useCallback(
    async (marketPubkey: PublicKey): Promise<string | undefined> => {
      const program = getProgram();
      if (!program || !address) {
        toast.error("Please connect your wallet first");
        return undefined;
      }

      try {
        const user = new PublicKey(address);
        const market = await program.account.market.fetch(marketPubkey);
        const yesToken = (market as { yesTokenMint: PublicKey }).yesTokenMint;
        const noToken = (market as { noTokenMint: PublicKey }).noTokenMint;

        const [userInfoPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_USERINFO), user.toBuffer(), marketPubkey.toBuffer()],
          PROGRAM_ID
        );
        const userYesAta = await getAssociatedTokenAddress(yesToken, user, false, TOKEN_2022_PROGRAM_ID);
        const userNoAta = await getAssociatedTokenAddress(noToken, user, false, TOKEN_2022_PROGRAM_ID);

        const tx = new Transaction();
        addComputeBudget(tx, 200_000, 1);

        const ix = await (
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

        tx.add(ix);
        return await sendAndConfirm(tx);
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        toast.error(`Sync failed: ${msg.slice(0, 80)}`);
        throw error;
      }
    },
    [getProgram, address, connection, walletProvider]
  );

  /**
   * Deposit SOL → receive YES tokens on ALL N markets in the group.
   */
  const groupSplitCollateral = useCallback(
    async (
      marketGroupPubkey: PublicKey,
      markets: MarketInfo[],
      amountLamports: BN,
    ): Promise<string | undefined> => {
      const program = getProgram();
      if (!program || !address) {
        toast.error("Please connect your wallet first");
        return undefined;
      }

      try {
        const user = new PublicKey(address);
        const [configPda] = PublicKey.findProgramAddressSync([Buffer.from(SEED_CONFIG)], PROGRAM_ID);
        const [globalVaultPda] = PublicKey.findProgramAddressSync([Buffer.from(SEED_GLOBAL)], PROGRAM_ID);
        const [groupConfigPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_MARKET_GROUP_CONFIG), marketGroupPubkey.toBuffer()],
          PROGRAM_ID
        );

        // Build remaining accounts: 4 per market [market_pda, v1_config, yes_mint, user_yes_ata]
        const remainingAccounts: { pubkey: PublicKey; isSigner: boolean; isWritable: boolean }[] = [];
        for (const m of markets) {
          const [v1ConfigPda] = PublicKey.findProgramAddressSync(
            [Buffer.from(SEED_MARKET_V1_CONFIG), m.publicKey.toBuffer()],
            PROGRAM_ID
          );
          const userYesAta = await getAssociatedTokenAddress(m.yesTokenMint, user, false, TOKEN_2022_PROGRAM_ID);

          remainingAccounts.push(
            { pubkey: m.publicKey, isSigner: false, isWritable: true },
            { pubkey: v1ConfigPda, isSigner: false, isWritable: false },
            { pubkey: m.yesTokenMint, isSigner: false, isWritable: true },
            { pubkey: userYesAta, isSigner: false, isWritable: true },
          );
        }

        const tx = new Transaction();
        addComputeBudget(tx, 600_000, 1);

        const ix = await (
          program.methods as unknown as {
            groupSplitCollateral: (amount: BN) => {
              accountsPartial: (acc: unknown) => {
                remainingAccounts: (accs: typeof remainingAccounts) => {
                  instruction: () => Promise<TransactionInstruction>;
                };
              };
            };
          }
        )
          .groupSplitCollateral(amountLamports)
          .accountsPartial({
            globalConfig: configPda,
            marketGroup: marketGroupPubkey,
            groupConfig: groupConfigPda,
            globalVault: globalVaultPda,
            user,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          })
          .remainingAccounts(remainingAccounts)
          .instruction();

        tx.add(ix);
        const sig = await sendAndConfirm(tx);
        toast.success("Group split collateral deposited!");
        return sig;
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        toast.error(`Group split failed: ${msg.slice(0, 80)}`);
        throw error;
      }
    },
    [getProgram, address, connection, walletProvider]
  );

  /**
   * Burn YES from ALL N markets → receive SOL.
   */
  const groupMergeCollateral = useCallback(
    async (
      marketGroupPubkey: PublicKey,
      markets: MarketInfo[],
      pairs: BN,
    ): Promise<string | undefined> => {
      const program = getProgram();
      if (!program || !address) {
        toast.error("Please connect your wallet first");
        return undefined;
      }

      try {
        const user = new PublicKey(address);
        const [configPda] = PublicKey.findProgramAddressSync([Buffer.from(SEED_CONFIG)], PROGRAM_ID);
        const [globalVaultPda] = PublicKey.findProgramAddressSync([Buffer.from(SEED_GLOBAL)], PROGRAM_ID);
        const [groupConfigPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_MARKET_GROUP_CONFIG), marketGroupPubkey.toBuffer()],
          PROGRAM_ID
        );

        // Build remaining accounts: 4 per market [market_pda, v1_config, yes_mint, user_yes_ata]
        const remainingAccounts: { pubkey: PublicKey; isSigner: boolean; isWritable: boolean }[] = [];
        for (const m of markets) {
          const [v1ConfigPda] = PublicKey.findProgramAddressSync(
            [Buffer.from(SEED_MARKET_V1_CONFIG), m.publicKey.toBuffer()],
            PROGRAM_ID
          );
          const userYesAta = await getAssociatedTokenAddress(m.yesTokenMint, user, false, TOKEN_2022_PROGRAM_ID);

          remainingAccounts.push(
            { pubkey: m.publicKey, isSigner: false, isWritable: true },
            { pubkey: v1ConfigPda, isSigner: false, isWritable: false },
            { pubkey: m.yesTokenMint, isSigner: false, isWritable: true },
            { pubkey: userYesAta, isSigner: false, isWritable: true },
          );
        }

        const tx = new Transaction();
        addComputeBudget(tx, 600_000, 1);

        const ix = await (
          program.methods as unknown as {
            groupMergeCollateral: (pairs: BN) => {
              accountsPartial: (acc: unknown) => {
                remainingAccounts: (accs: typeof remainingAccounts) => {
                  instruction: () => Promise<TransactionInstruction>;
                };
              };
            };
          }
        )
          .groupMergeCollateral(pairs)
          .accountsPartial({
            globalConfig: configPda,
            marketGroup: marketGroupPubkey,
            groupConfig: groupConfigPda,
            globalVault: globalVaultPda,
            user,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .remainingAccounts(remainingAccounts)
          .instruction();

        tx.add(ix);
        const sig = await sendAndConfirm(tx);
        toast.success("Group merge completed — SOL returned!");
        return sig;
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        toast.error(`Group merge failed: ${msg.slice(0, 80)}`);
        throw error;
      }
    },
    [getProgram, address, connection, walletProvider]
  );

  /**
   * Convert NO on selected markets → SOL + YES on remaining markets.
   */
  const convertPositions = useCallback(
    async (
      marketGroupPubkey: PublicKey,
      markets: MarketInfo[],
      pairs: BN,
      selectedMarketIndices: number[],
    ): Promise<string | undefined> => {
      const program = getProgram();
      if (!program || !address) {
        toast.error("Please connect your wallet first");
        return undefined;
      }

      try {
        const user = new PublicKey(address);
        const [configPda] = PublicKey.findProgramAddressSync([Buffer.from(SEED_CONFIG)], PROGRAM_ID);
        const [globalVaultPda] = PublicKey.findProgramAddressSync([Buffer.from(SEED_GLOBAL)], PROGRAM_ID);
        const [groupConfigPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_MARKET_GROUP_CONFIG), marketGroupPubkey.toBuffer()],
          PROGRAM_ID
        );

        // Build remaining accounts: 6 per market (ALL markets, not just selected)
        // [market_pda, v1_config, yes_mint, no_mint, user_yes_ata, user_no_ata]
        const remainingAccounts: { pubkey: PublicKey; isSigner: boolean; isWritable: boolean }[] = [];
        for (const m of markets) {
          const [v1ConfigPda] = PublicKey.findProgramAddressSync(
            [Buffer.from(SEED_MARKET_V1_CONFIG), m.publicKey.toBuffer()],
            PROGRAM_ID
          );
          const userYesAta = await getAssociatedTokenAddress(m.yesTokenMint, user, false, TOKEN_2022_PROGRAM_ID);
          const userNoAta = await getAssociatedTokenAddress(m.noTokenMint, user, false, TOKEN_2022_PROGRAM_ID);

          remainingAccounts.push(
            { pubkey: m.publicKey, isSigner: false, isWritable: true },
            { pubkey: v1ConfigPda, isSigner: false, isWritable: false },
            { pubkey: m.yesTokenMint, isSigner: false, isWritable: true },
            { pubkey: m.noTokenMint, isSigner: false, isWritable: true },
            { pubkey: userYesAta, isSigner: false, isWritable: true },
            { pubkey: userNoAta, isSigner: false, isWritable: true },
          );
        }

        // Indices must be sorted and u8
        const sortedIndices = [...selectedMarketIndices].sort((a, b) => a - b);

        const tx = new Transaction();
        addComputeBudget(tx, 800_000, 1);

        const ix = await (
          program.methods as unknown as {
            convertPositions: (pairs: BN, indices: number[]) => {
              accountsPartial: (acc: unknown) => {
                remainingAccounts: (accs: typeof remainingAccounts) => {
                  instruction: () => Promise<TransactionInstruction>;
                };
              };
            };
          }
        )
          .convertPositions(pairs, Array.from(Buffer.from(sortedIndices)))
          .accountsPartial({
            globalConfig: configPda,
            marketGroup: marketGroupPubkey,
            groupConfig: groupConfigPda,
            globalVault: globalVaultPda,
            user,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          })
          .remainingAccounts(remainingAccounts)
          .instruction();

        tx.add(ix);
        const sig = await sendAndConfirm(tx);

        const k = sortedIndices.length;
        const solReleased = (k - 1) * pairs.toNumber();
        toast.success(
          k > 1
            ? `Positions converted! ${(solReleased / 1e9).toFixed(4)} SOL released`
            : "Positions converted!"
        );
        return sig;
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes("CannotSelectAllMarkets")) {
          toast.error("Cannot select all markets for conversion");
        } else if (msg.includes("InsufficientTokens") || msg.includes("insufficient")) {
          toast.error("Insufficient NO token balance");
        } else {
          toast.error(`Conversion failed: ${msg.slice(0, 80)}`);
        }
        throw error;
      }
    },
    [getProgram, address, connection, walletProvider]
  );

  return {
    syncUserInfo,
    groupSplitCollateral,
    groupMergeCollateral,
    convertPositions,
  };
}
