"use client";

import { useCallback, useState } from "react";
import {
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  ComputeBudgetProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { usePredictionMarket } from "@/features/trading/hooks/use-prediction-market";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { PROGRAM_ID, SEED_SHIELDED_POOL, SEED_SHARD, SEED_GLOBAL, SEED_MARKET_V1_CONFIG, SEED_TEE_REGISTRY } from "@/lib/constants/programs";
import { toast } from "sonner";
import {
  saveNote,
  getStoredNotes,
  updateNote,
  syncNoteToBackend,
  markNoteAsSpent,
  indexCommitmentFromChain,
  preSavePoolState,
  saveCurrentPoolSnapshot,
} from "@/features/privacy/utils/zk-storage";
import { acquireTxLock, releaseTxLock } from "@/features/trading/utils/tx-lock";
import type { ShieldedNote } from "@/types/zk.types";
import { teeClient } from "@/lib/tee-client";
import { RPC_URL } from "@/lib/constants/network";
import bs58 from "bs58";
import { Buffer } from "buffer";

export type { ShieldedNote };

const ZK_COMPUTE_BUDGET_IXS = [
  ComputeBudgetProgram.setComputeUnitLimit({ units: 600_000 }),
  ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1 }),
];

export function useZK() {
  const { program, getMarket, calculateBuyOutput } = usePredictionMarket();
  const { address } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("solana");
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [shieldedBalance, setShieldedBalance] = useState(0);
  const [teeAvailable, setTeeAvailable] = useState(false);

  // Check TEE availability on mount (lazy — non-blocking)
  // Verifies both the TEE HTTP service AND the on-chain tee_registry PDA
  useState(() => {
    (async () => {
      try {
        const h = await teeClient.health();
        if (h.status !== "ok") return;
        // Also check that the tee_registry account is initialized on-chain
        const conn = new Connection(RPC_URL);
        const [registryPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_TEE_REGISTRY)],
          PROGRAM_ID
        );
        const info = await conn.getAccountInfo(registryPda);
        if (info && info.data.length > 0) {
          setTeeAvailable(true);
        }
      } catch {
        // TEE not available — silent
      }
    })();
  });

  const fetchShieldedBalance = useCallback(() => {
    const notes = getStoredNotes();
    const balance = notes
      .filter((n) => n.type === "SOL" && !n.isSpent)
      .reduce((acc, curr) => acc + curr.amount, 0);
    setShieldedBalance(balance);
  }, []);

  const getShieldedPoolAddress = useCallback((marketAddress: PublicKey) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(SEED_SHIELDED_POOL), marketAddress.toBuffer()],
      PROGRAM_ID
    )[0];
  }, []);

  const getNullifierShardAddress = useCallback(
    (poolIdentifier: number[], nullifier: Buffer, prefixLen: number = 1) => {
      const prefix: number[] = [];
      for (let i = 0; i < prefixLen; i++) {
        const byteIndex = nullifier.length === 32 ? i : i === 0 ? -1 : i - 1;
        const byte = byteIndex < 0 ? 0 : nullifier[byteIndex];
        prefix.push(byte > 127 ? 1 : 0);
      }
      return PublicKey.findProgramAddressSync(
        [
          Buffer.from(SEED_SHARD),
          Buffer.from(poolIdentifier),
          Buffer.from([prefixLen]),
          Buffer.from(prefix),
        ],
        PROGRAM_ID
      )[0];
    },
    []
  );

  const findActiveShardAddress = useCallback(
    async (
      poolIdentifier: number[],
      nullifier: Buffer,
      connection: { getAccountInfo: (key: PublicKey) => Promise<{ data: Buffer } | null> }
    ): Promise<{ address: PublicKey; prefixLen: number; prefix: number[] }> => {
      const maxDepth = 8;
      const buildPrefix = (depth: number): number[] => {
        const prefix: number[] = [];
        for (let i = 0; i < depth; i++) {
          const byteIndex = nullifier.length === 32 ? i : i === 0 ? -1 : i - 1;
          const byte = byteIndex < 0 ? 0 : nullifier[byteIndex];
          prefix.push(byte > 127 ? 1 : 0);
        }
        return prefix;
      };
      for (let prefixLen = 1; prefixLen <= maxDepth; prefixLen++) {
        const shardAddress = getNullifierShardAddress(poolIdentifier, nullifier, prefixLen);
        const accountInfo = await connection.getAccountInfo(shardAddress);
        if (accountInfo) {
          return { address: shardAddress, prefixLen, prefix: buildPrefix(prefixLen) };
        }
      }
      return {
        address: getNullifierShardAddress(poolIdentifier, nullifier, 1),
        prefixLen: 1,
        prefix: buildPrefix(1),
      };
    },
    [getNullifierShardAddress]
  );

  const splitShardIfNeeded = useCallback(
    async (
      poolIdentifier: number[],
      prefixLen: number,
      prefix: number[],
      _marketAddress: PublicKey
    ): Promise<boolean> => {
      if (!program || !address) return false;
      try {
        const toastId = toast.loading("Shard is full, splitting...");
        // Build prefix bytes (0/1 values) padded to 8 bytes
        const prefixBytes = new Uint8Array(8);
        for (let i = 0; i < prefix.length && i < 8; i++) prefixBytes[i] = prefix[i];

        // Compute PDA addresses directly using raw prefix bits (not via getNullifierShardAddress
        // which incorrectly re-derives bits from byte values using > 127 threshold)
        const parentShardAddress = PublicKey.findProgramAddressSync(
          [
            Buffer.from(SEED_SHARD),
            Buffer.from(poolIdentifier),
            Buffer.from([prefixLen]),
            Buffer.from(prefix.slice(0, prefixLen)),
          ],
          PROGRAM_ID
        )[0];
        const leftChildAddress = PublicKey.findProgramAddressSync(
          [
            Buffer.from(SEED_SHARD),
            Buffer.from(poolIdentifier),
            Buffer.from([prefixLen + 1]),
            Buffer.from([...prefix.slice(0, prefixLen), 0]),
          ],
          PROGRAM_ID
        )[0];
        const rightChildAddress = PublicKey.findProgramAddressSync(
          [
            Buffer.from(SEED_SHARD),
            Buffer.from(poolIdentifier),
            Buffer.from([prefixLen + 1]),
            Buffer.from([...prefix.slice(0, prefixLen), 1]),
          ],
          PROGRAM_ID
        )[0];

        const userPubkey = new PublicKey(address);
        const identifierBytes = new Uint8Array(16);
        for (let i = 0; i < poolIdentifier.length && i < 16; i++)
          identifierBytes[i] = poolIdentifier[i];
        await (
          program.methods as {
            splitShard: (id: number[], len: number, prefix: number[]) => {
              accounts: (acc: unknown) => { preInstructions: (ixs: unknown[]) => { rpc: () => Promise<string> } };
            };
          }
        )
          .splitShard(Array.from(identifierBytes), prefixLen, Array.from(prefixBytes))
          .accounts({
            parentShard: parentShardAddress,
            leftChild: leftChildAddress,
            rightChild: rightChildAddress,
            payer: userPubkey,
            systemProgram: SystemProgram.programId,
          })
          .preInstructions(ZK_COMPUTE_BUDGET_IXS)
          .rpc();
        toast.dismiss(toastId);
        toast.success("Shard split successfully!");
        return true;
      } catch (error) {
        console.error("Failed to split shard:", error);
        toast.error("Failed to split shard: " + (error as Error).message);
        return false;
      }
    },
    [program, address]
  );

  // Pre-check shard capacity and auto-split if needed, then return the correct shard address.
  // This prevents ShardNeedsSplit errors by splitting proactively before the main tx.
  const ensureShardReady = useCallback(
    async (
      poolIdentifier: number[],
      nullifierHex: string,
      marketAddress: PublicKey,
      connection: { getAccountInfo: (key: PublicKey) => Promise<{ data: Buffer } | null> }
    ): Promise<PublicKey> => {
      const nullifierBuf = Buffer.from(nullifierHex, "hex");
      let shardInfo = await findActiveShardAddress(poolIdentifier, nullifierBuf, connection);

      // Read account to check if shard is full
      // BitShard layout: discriminator(8) + prefix_len(1) + prefix(8) + count(4)
      const accountInfo = await connection.getAccountInfo(shardInfo.address);
      if (accountInfo) {
        const count = Buffer.from(accountInfo.data).readUInt32LE(17);
        if (count >= 100) { // SHARD_SPLITTING_THRESHOLD
          console.warn(
            `[ensureShardReady] Shard at depth ${shardInfo.prefixLen} has ${count} nullifiers, auto-splitting...`
          );
          const success = await splitShardIfNeeded(
            poolIdentifier,
            shardInfo.prefixLen,
            shardInfo.prefix,
            marketAddress
          );
          if (success) {
            // Wait for RPC propagation after split tx
            await new Promise((resolve) => setTimeout(resolve, 2000));
            // Re-find active shard (should now route to a child shard)
            shardInfo = await findActiveShardAddress(poolIdentifier, nullifierBuf, connection);
          }
        }
      }

      return shardInfo.address;
    },
    [findActiveShardAddress, splitShardIfNeeded]
  );

  // Auto-initialize missing root nullifier shards (prefix_len=1).
  // Any user can pay to initialize — no admin required.
  const ensureRootShardsExist = useCallback(
    async (marketAddress: PublicKey, poolIdentifier: number[]) => {
      if (!program || !address) return;
      const conn = program.provider.connection;
      const shieldedPoolPda = getShieldedPoolAddress(marketAddress);
      const userPubkey = new PublicKey(address);

      const [shard0Pda] = PublicKey.findProgramAddressSync(
        [Buffer.from(SEED_SHARD), Buffer.from(poolIdentifier), Buffer.from([1]), Buffer.from([0])],
        PROGRAM_ID
      );
      const [shard1Pda] = PublicKey.findProgramAddressSync(
        [Buffer.from(SEED_SHARD), Buffer.from(poolIdentifier), Buffer.from([1]), Buffer.from([1])],
        PROGRAM_ID
      );

      const [shard0Info, shard1Info] = await Promise.all([
        conn.getAccountInfo(shard0Pda),
        conn.getAccountInfo(shard1Pda),
      ]);

      if (shard0Info && shard1Info) return; // Both exist

      const tx = new Transaction();
      tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }));
      tx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1 }));

      if (!shard0Info) {
        const ix = await (
          program.methods as {
            initializeShard0: () => { accountsPartial: (acc: unknown) => { instruction: () => Promise<TransactionInstruction> } };
          }
        ).initializeShard0().accountsPartial({
          shieldedPool: shieldedPoolPda,
          shard0: shard0Pda,
          authority: userPubkey,
          systemProgram: SystemProgram.programId,
        }).instruction();
        tx.add(ix);
      }

      if (!shard1Info) {
        const ix = await (
          program.methods as {
            initializeShard1: () => { accountsPartial: (acc: unknown) => { instruction: () => Promise<TransactionInstruction> } };
          }
        ).initializeShard1().accountsPartial({
          shieldedPool: shieldedPoolPda,
          shard1: shard1Pda,
          authority: userPubkey,
          systemProgram: SystemProgram.programId,
        }).instruction();
        tx.add(ix);
      }

      const parts = [];
      if (!shard0Info) parts.push("0");
      if (!shard1Info) parts.push("1");
      console.log(`[ensureRootShardsExist] Initializing missing shard(s): ${parts.join(", ")}`);
      const initToast = toast.loading(`Initializing nullifier shard ${parts.join(" & ")}...`);

      try {
        const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash("confirmed");
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;
        tx.feePayer = userPubkey;

        if ((walletProvider as { signAndSendTransaction?: unknown }).signAndSendTransaction) {
          const result = await (
            walletProvider as { signAndSendTransaction: (t: Transaction) => Promise<{ signature?: string } | string> }
          ).signAndSendTransaction(tx);
          const sig = typeof result === "string" ? result : (result.signature ?? "");
          await conn.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
        } else {
          const signedTx = await (
            walletProvider as { signTransaction: (t: Transaction) => Promise<Transaction> }
          ).signTransaction(tx);
          const sig = await conn.sendRawTransaction(signedTx.serialize(), { skipPreflight: true });
          await conn.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
        }
        toast.dismiss(initToast);
        toast.success(`Nullifier shard ${parts.join(" & ")} initialized!`);
      } catch (e) {
        toast.dismiss(initToast);
        console.error("Failed to auto-initialize shard:", e);
        throw new Error(
          `Missing nullifier shard ${parts.join(" & ")} and auto-initialization failed: ${(e as Error).message}`
        );
      }
    },
    [program, address, walletProvider, getShieldedPoolAddress]
  );

  const getPoolIdentifier = useCallback(
    async (poolPda: PublicKey): Promise<number[] | null> => {
      if (!program) return null;
      try {
        const acc = program.account as {
          shieldedMarketPool?: { fetch: (pda: PublicKey) => Promise<unknown> };
        };
        const pool = await acc.shieldedMarketPool?.fetch?.(poolPda);
        const data = pool as { mmr?: { identifier?: number[] } } | undefined;
        return data?.mmr?.identifier ?? null;
      } catch (e) {
        console.error("Failed to fetch pool identifier", e);
        return null;
      }
    },
    [program]
  );

  const shield = useCallback(
    async (amount: number, marketAddress: PublicKey) => {
      if (!program || !address) return;
      try {
        setIsGeneratingProof(true);
        acquireTxLock();
        const toastId = toast.loading("Generating ZK Proof... (This may take a moment)");
        const poolPda = getShieldedPoolAddress(marketAddress);
        const identifier = await getPoolIdentifier(poolPda);
        if (!identifier) {
          toast.dismiss(toastId);
          toast.error("Shielded pool not found/initialized");
          return;
        }

        // Pre-save pool state to capture batch number before potential rollover
        const expectedBatch = await preSavePoolState(
          program.provider.connection,
          poolPda,
          marketAddress.toBase58()
        );

        const nullifierBytes = new Uint8Array(31);
        const blindingBytes = new Uint8Array(31);
        crypto.getRandomValues(nullifierBytes);
        crypto.getRandomValues(blindingBytes);
        const nullifier = new BN(nullifierBytes);
        const blinding = new BN(blindingBytes);
        const { createShieldProof } = await import("@/features/privacy/lib/shield");
        const { proof, publicInputs } = await createShieldProof(amount, nullifier, blinding);
        const tx = await (
          program.methods as {
            privateShield: (proof: unknown, inputs: unknown) => {
              accounts: (acc: unknown) => { preInstructions: (ixs: unknown[]) => { rpc: (opts?: { commitment?: string }) => Promise<string> } };
            };
          }
        )
          .privateShield(proof, publicInputs)
          .accounts({
            shieldedPool: poolPda,
            depositor: new PublicKey(address),
            instructionAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
            systemProgram: SystemProgram.programId,
          })
          .preInstructions(ZK_COMPUTE_BUDGET_IXS)
          .rpc({ commitment: "confirmed" });
        // Wait for confirmed commitment to ensure the deposit is finalized
        // before any subsequent swap can reference the pool state
        await program.provider.connection.confirmTransaction(tx, "confirmed");
        toast.dismiss(toastId);
        toast.success("Shielded deposit successful!", { description: `Tx: ${tx.slice(0, 8)}...` });
        const commitment = new BN(publicInputs.slice(8, 40));
        const commitmentHex = commitment.toString("hex").padStart(64, "0");
        const poolAddress = poolPda.toBase58();
        const note: ShieldedNote = {
          amount,
          nullifier: nullifier.toString("hex").padStart(64, "0"),
          blinding: blinding.toString("hex").padStart(64, "0"),
          commitment: commitmentHex,
          type: "SOL",
          market: marketAddress.toBase58(),
          poolAddress,
          timestamp: Date.now(),
        };
        // Sync note to backend
        await syncNoteToBackend(note, poolAddress);

        // Save pool snapshot AFTER tx to capture latest on-chain state (including new leaves)
        try {
          await saveCurrentPoolSnapshot(program.provider.connection, poolPda, marketAddress.toBase58(), tx);
        } catch (e) {
          console.warn("Failed to save post-tx pool snapshot:", e);
        }

        // Index commitment with expected batch number for rollover detection
        try {
          const indexResult = await indexCommitmentFromChain(
            program.provider.connection,
            poolPda,
            marketAddress.toBase58(),
            commitmentHex,
            tx,
            expectedBatch // Pass expected batch for rollover detection
          );
          if (indexResult) {
            note.index = indexResult.batchNumber * 16 + indexResult.leafIndex;
            await syncNoteToBackend(note, poolAddress);
          }
        } catch (e) {
          console.warn("Failed to index commitment:", e);
        }

        fetchShieldedBalance();
        return { tx, note };
      } catch (error) {
        console.error("Shield Error:", error);
        toast.dismiss();
        toast.error("Failed to shield funds: " + (error as Error).message);
      } finally {
        setIsGeneratingProof(false);
        releaseTxLock();
      }
    },
    [program, address, getShieldedPoolAddress, getPoolIdentifier, fetchShieldedBalance]
  );

  const unshield = useCallback(
    async (note: ShieldedNote, marketAddress: PublicKey, _recipient?: PublicKey) => {
      if (!program || !address) return;
      try {
        setIsGeneratingProof(true);
        acquireTxLock();
        const toastId = toast.loading("Generating Unshield Proof...");
        const poolPda = getShieldedPoolAddress(marketAddress);
        const identifier = await getPoolIdentifier(poolPda);
        if (!identifier) throw new Error("Pool not found");

        const userPubkey = new PublicKey(address);
        const connection = program.provider.connection;

        // Generate real unshield proof
        const { generateUnshieldProof } = await import("@/features/privacy/lib/unshield");
        const { proof, publicInputs } = await generateUnshieldProof(
          connection,
          poolPda,
          note,
          userPubkey,
        );

        const nullifierShard = await ensureShardReady(
          identifier,
          note.nullifier,
          marketAddress,
          connection
        );

        const tx = await (
          program.methods as {
            privateUnshield: (proof: unknown, inputs: unknown) => {
              accounts: (acc: unknown) => { preInstructions: (ixs: unknown[]) => { rpc: () => Promise<string> } };
            };
          }
        )
          .privateUnshield(proof, publicInputs)
          .accounts({
            shieldedPool: poolPda,
            nullifierShard,
            user: userPubkey,
            instructionAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
            systemProgram: SystemProgram.programId,
            dummy0Account: poolPda,
            dummy1Account: poolPda,
          })
          .preInstructions(ZK_COMPUTE_BUDGET_IXS)
          .rpc();

        // Mark SOL note as spent after successful withdrawal
        await markNoteAsSpent(note.commitment);

        toast.dismiss(toastId);
        toast.success("Unshield successful!", { description: `Tx: ${tx.slice(0, 8)}...` });
        fetchShieldedBalance();
        return tx;
      } catch (error) {
        console.error("Unshield error:", error);
        toast.dismiss();
        toast.error("Failed to withdraw: " + (error as Error).message);
      } finally {
        setIsGeneratingProof(false);
        releaseTxLock();
      }
    },
    [program, address, getShieldedPoolAddress, getPoolIdentifier, ensureShardReady, fetchShieldedBalance]
  );

  const privateSwap = useCallback(
    async (solNote: ShieldedNote, marketAddress: PublicKey, direction: "YES" | "NO") => {
      if (!program || !address) return;
      let toastId: string | number | undefined;
      try {
        setIsGeneratingProof(true);
        acquireTxLock();
        toastId = toast.loading("Generating Private Swap Proof...");
        const noteMarket = solNote.market;
        const currentMarket = marketAddress.toBase58();
        if (noteMarket && noteMarket !== currentMarket) {
          throw new Error(
            `Market mismatch! This note was shielded on market ${noteMarket?.slice(0, 8)}... but you're trying to swap on market ${currentMarket.slice(0, 8)}...`
          );
        }
        const poolPda = getShieldedPoolAddress(marketAddress);
        const identifier = await getPoolIdentifier(poolPda);
        if (!identifier) throw new Error("Pool not found");

        // Pre-save pool state to capture batch number before potential rollover
        const expectedBatch = await preSavePoolState(
          program.provider.connection,
          poolPda,
          marketAddress.toBase58()
        );

        const market = await getMarket(marketAddress);
        if (!market) throw new Error("Market not found");
        // Private swap is a BUY (SOL -> tokens), apply shielded fee first
        const SHIELDED_FEE_BPS = 20;
        const netSolAmount = solNote.amount * (10000 - SHIELDED_FEE_BPS) / 10000;
        const tokenType = direction === "YES" ? 0 : 1;
        const estimatedTokens = await calculateBuyOutput(
          market.yesTokenMint,
          market.noTokenMint,
          netSolAmount,
          tokenType
        );
        if (!estimatedTokens) throw new Error("Failed to calculate swap output");
        const amountOut = estimatedTokens;
        const { generatePrivateSwapProof } = await import("@/features/privacy/lib/private-swap");
        const connection = program.provider.connection;
        const {
          proof,
          publicInputs,
          outNullifier,
          outBlinding,
          outCommitment,
          amountOut: amountOutStr,
        } = await generatePrivateSwapProof(
          connection,
          poolPda,
          solNote,
          amountOut,
          direction,
          marketAddress
        );
        const nullifierShard = await ensureShardReady(
          identifier,
          solNote.nullifier,
          marketAddress,
          connection
        );
        const userPubkey = new PublicKey(address);
        const [globalVaultPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_GLOBAL)],
          PROGRAM_ID
        );

        // Re-fetch market state RIGHT BEFORE submitting to minimize state drift
        // The proof was generated with a specific token amount - verify it's still valid
        const freshMarket = await getMarket(marketAddress);
        if (!freshMarket) throw new Error("Market not found on re-fetch");

        const freshEstimate = await calculateBuyOutput(
          freshMarket.yesTokenMint,
          freshMarket.noTokenMint,
          netSolAmount,
          tokenType
        );

        if (!freshEstimate) throw new Error("Failed to re-calculate swap output");

        // Check if the market has drifted too much (allow 5% slippage from proof amount)
        const proofTokenAmount = amountOut;
        const slippageTolerance = 0.05; // 5%
        const minAcceptable = proofTokenAmount * (1 - slippageTolerance);
        const maxAcceptable = proofTokenAmount * (1 + slippageTolerance);

        if (freshEstimate < minAcceptable || freshEstimate > maxAcceptable) {
          console.error("Market state drift detected:", {
            proofTokenAmount,
            freshEstimate,
            difference: Math.abs(freshEstimate - proofTokenAmount),
            percentDrift: ((freshEstimate - proofTokenAmount) / proofTokenAmount * 100).toFixed(2) + "%"
          });
          throw new Error(
            `Market moved too much while generating proof. ` +
            `Expected ~${proofTokenAmount.toLocaleString()} tokens but current estimate is ${freshEstimate.toLocaleString()}. ` +
            `Please try again.`
          );
        }

        console.log("Market state verified:", {
          proofTokenAmount,
          freshEstimate,
          drift: ((freshEstimate - proofTokenAmount) / proofTokenAmount * 100).toFixed(2) + "%"
        });

        // Use the proof amount as min_token_output for slippage protection
        // Apply 2% slippage tolerance on the minimum
        const minTokenOutput = new BN(Math.floor(proofTokenAmount * 0.98));

        // dummy0/dummy1 are unused placeholders in private_swap — any writable account works
        await (
          program.methods as unknown as {
            privateSwap: (proof: unknown, inputs: unknown, minTokenOutput: BN) => {
              accounts: (acc: unknown) => { preInstructions: (ixs: unknown[]) => { rpc: () => Promise<string> } };
            };
          }
        )
          .privateSwap(proof, publicInputs, minTokenOutput)
          .accounts({
            shieldedPool: poolPda,
            market: marketAddress,
            nullifierShard,
            globalVault: globalVaultPda,
            user: userPubkey,
            instructionAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
            dummy0Account: marketAddress,
            dummy1Account: marketAddress,
          })
          .preInstructions(ZK_COMPUTE_BUDGET_IXS)
          .rpc();
        toast.dismiss(toastId);
        toast.success("Private swap successful!");
        const outputNote: ShieldedNote = {
          amount: parseInt(String(amountOutStr), 10),
          nullifier: outNullifier,
          blinding: outBlinding,
          commitment: outCommitment,
          type: direction,
          market: marketAddress.toBase58(),
          poolAddress: poolPda.toBase58(),
          timestamp: Date.now(),
        };
        // Mark input note as spent and save output note
        await markNoteAsSpent(solNote.commitment);
        await syncNoteToBackend(outputNote, outputNote.poolAddress!);

        // Save pool snapshot AFTER tx to capture latest on-chain state
        try {
          await saveCurrentPoolSnapshot(connection, poolPda, marketAddress.toBase58());
        } catch (e) {
          console.warn("Failed to save post-tx pool snapshot:", e);
        }

        // Index the new commitment using reliable method
        try {
          const indexResult = await indexCommitmentFromChain(
            connection,
            poolPda,
            marketAddress.toBase58(),
            outCommitment,
            "", // We don't have tx signature in this flow
            expectedBatch // Pass expected batch for rollover detection
          );
          if (indexResult) {
            outputNote.index = indexResult.batchNumber * 16 + indexResult.leafIndex;
            await syncNoteToBackend(outputNote, outputNote.poolAddress!);
          }
        } catch (e) {
          console.warn("Failed to index commitment:", e);
        }
      } catch (error) {
        console.error("Private swap error:", error);
        toast.dismiss(toastId);
        toast.error("Failed to swap privately: " + (error as Error).message);
      } finally {
        setIsGeneratingProof(false);
        releaseTxLock();
      }
    },
    [
      program,
      address,
      getShieldedPoolAddress,
      getPoolIdentifier,
      ensureShardReady,
      getMarket,
      calculateBuyOutput,
    ]
  );

  const privateSell = useCallback(
    async (
      tokenNote: ShieldedNote,
      marketAddress: PublicKey,
      expectedSolAmount: number
    ) => {
      if (!program || !address) return;
      try {
        setIsGeneratingProof(true);
        acquireTxLock();
        const toastId = toast.loading("Generating Private Sell Proof...");
        if (tokenNote.type === "SOL") {
          toast.error("Cannot sell a SOL note. Use unshield instead.");
          return;
        }
        const poolPda = getShieldedPoolAddress(marketAddress);
        const identifier = await getPoolIdentifier(poolPda);
        if (!identifier) {
          toast.dismiss(toastId);
          toast.error("Shielded pool not found");
          return;
        }

        // Pre-save pool state to capture batch number before potential rollover
        const expectedBatch = await preSavePoolState(
          program.provider.connection,
          poolPda,
          marketAddress.toBase58()
        );

        const { generatePrivateSellProof } = await import("@/features/privacy/lib/private-sell");
        const { proof, publicInputs, outNullifier, outBlinding, outCommitment, solAmount } =
          await generatePrivateSellProof(
            program.provider.connection,
            poolPda,
            tokenNote,
            marketAddress,
            expectedSolAmount
          );
        const shardPda = await ensureShardReady(
          identifier,
          tokenNote.nullifier,
          marketAddress,
          program.provider.connection
        );
        const userPubkey = new PublicKey(address);
        const [globalVaultPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_GLOBAL)],
          PROGRAM_ID
        );
        const tx = await (
          program.methods as unknown as {
            privateSell: (proof: unknown, inputs: unknown, minSolOutput: BN) => {
              accounts: (acc: unknown) => { preInstructions: (ixs: unknown[]) => { rpc: () => Promise<string> } };
            };
          }
        )
          .privateSell(proof, publicInputs, new BN(expectedSolAmount))
          .accounts({
            shieldedPool: poolPda,
            market: marketAddress,
            nullifierShard: shardPda,
            globalVault: globalVaultPda,
            user: userPubkey,
            instructionAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
            systemProgram: SystemProgram.programId,
            dummy0Account: marketAddress,
            dummy1Account: marketAddress,
          })
          .preInstructions(ZK_COMPUTE_BUDGET_IXS)
          .rpc();
        toast.dismiss(toastId);
        toast.success("Private Sell Successful!", { description: `Tx: ${tx.slice(0, 8)}...` });
        const commitmentHex = outCommitment;
        const poolAddress = poolPda.toBase58();
        const newNote: ShieldedNote = {
          amount: parseInt(solAmount, 10),
          nullifier: outNullifier,
          blinding: outBlinding,
          commitment: commitmentHex,
          type: "SOL",
          market: marketAddress.toBase58(),
          poolAddress,
          timestamp: Date.now(),
        };
        // Mark input note as spent and save output note
        await markNoteAsSpent(tokenNote.commitment);
        await syncNoteToBackend(newNote, poolAddress);

        // Save pool snapshot AFTER tx to capture latest on-chain state
        try {
          await saveCurrentPoolSnapshot(program.provider.connection, poolPda, marketAddress.toBase58(), tx);
        } catch (e) {
          console.warn("Failed to save post-tx pool snapshot:", e);
        }

        // Index the new commitment using reliable method
        try {
          const indexResult = await indexCommitmentFromChain(
            program.provider.connection,
            poolPda,
            marketAddress.toBase58(),
            commitmentHex,
            tx,
            expectedBatch // Pass expected batch for rollover detection
          );
          if (indexResult) {
            newNote.index = indexResult.batchNumber * 16 + indexResult.leafIndex;
            await syncNoteToBackend(newNote, poolAddress);
          }
        } catch (e) {
          console.warn("Failed to index commitment:", e);
        }

        fetchShieldedBalance();
        return { tx, note: newNote };
      } catch (error) {
        console.error("Private Sell Error:", error);
        toast.dismiss();
        toast.error("Failed to sell privately: " + (error as Error).message);
      } finally {
        setIsGeneratingProof(false);
        releaseTxLock();
      }
    },
    [
      program,
      address,
      getShieldedPoolAddress,
      getPoolIdentifier,
      ensureShardReady,
      fetchShieldedBalance,
    ]
  );

  const privateClaim = useCallback(
    async (tokenNote: ShieldedNote, marketAddress: PublicKey) => {
      if (!program || !address) return;
      let toastId: string | number | undefined;
      try {
        setIsGeneratingProof(true);
        acquireTxLock();
        toastId = toast.loading("Generating Private Claim Proof...");
        const poolPda = getShieldedPoolAddress(marketAddress);
        const identifier = await getPoolIdentifier(poolPda);
        if (!identifier) throw new Error("Pool not found");

        // Pre-save pool state to capture batch number before potential rollover
        const expectedBatch = await preSavePoolState(
          program.provider.connection,
          poolPda,
          marketAddress.toBase58()
        );

        const market = await getMarket(marketAddress);
        if (!market?.isCompleted) throw new Error("Market not resolved");
        const isYes = tokenNote.type === "YES";
        const winningOutcome = market.winningOutcome;
        if ((isYes && winningOutcome !== 0) || (!isYes && winningOutcome !== 1)) {
          throw new Error("This note did not win");
        }

        // Detect v1 market for conditional token payout
        const [v1ConfigPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_MARKET_V1_CONFIG), marketAddress.toBuffer()],
          PROGRAM_ID
        );
        const v1ConfigAccount = await program.provider.connection.getAccountInfo(v1ConfigPda);
        const isV1 = v1ConfigAccount !== null;

        // Calculate payout the same way the contract does:
        // payout = (token_amount * total_sol) / total_winning_in_circulation
        // Market values from Anchor may be BN objects, so convert properly
        const toBigInt = (val: unknown): bigint => {
          if (val === null || val === undefined) return BigInt(0);
          if (typeof val === "bigint") return val;
          if (typeof val === "number") return BigInt(Math.floor(val));
          if (typeof val === "string") return BigInt(val);
          // Handle BN objects
          if (val && typeof val === "object" && "toString" in val) {
            return BigInt((val as { toString: () => string }).toString());
          }
          return BigInt(0);
        };

        const realYesSol = toBigInt(market.realYesSolReserves);
        const realNoSol = toBigInt(market.realNoSolReserves);
        const totalSol = realYesSol + realNoSol;

        const tokenAmount = toBigInt(tokenNote.amount);
        const totalWinningInCirculation = isYes
          ? toBigInt(market.tokenYesTotalSupply) - toBigInt(market.realYesTokenReserves)
          : toBigInt(market.tokenNoTotalSupply) - toBigInt(market.realNoTokenReserves);

        console.log("Private Claim Calculation:", {
          tokenAmount: tokenAmount.toString(),
          totalSol: totalSol.toString(),
          totalWinningInCirculation: totalWinningInCirculation.toString(),
          isYes,
          realYesSol: realYesSol.toString(),
          realNoSol: realNoSol.toString(),
        });

        if (totalWinningInCirculation <= BigInt(0)) {
          throw new Error(`No winning tokens in circulation (got ${totalWinningInCirculation})`);
        }

        if (totalSol <= BigInt(0)) {
          throw new Error(`No SOL in pool (got ${totalSol})`);
        }

        // Calculate payout using BigInt for precision
        const payoutAmount = (tokenAmount * totalSol) / totalWinningInCirculation;

        if (payoutAmount <= BigInt(0)) {
          throw new Error(`Invalid payout calculation: ${payoutAmount}`);
        }

        console.log("Calculated payout:", payoutAmount.toString());

        const { generatePrivateClaimProof } = await import("@/features/privacy/lib/private-claim");
        const connection = program.provider.connection;
        // Convert BigInt to number for the proof function (BN doesn't accept BigInt directly)
        const payoutAmountNum = Number(payoutAmount);
        const { proof, publicInputs, outNullifier, outBlinding, outCommitment, payoutAmount: payoutAmountStr } =
          await generatePrivateClaimProof(
            connection,
            poolPda,
            tokenNote,
            marketAddress,
            payoutAmountNum
          );
        const nullifierShard = await ensureShardReady(
          identifier,
          tokenNote.nullifier,
          marketAddress,
          connection
        );
        const userPubkey = new PublicKey(address);
        const [globalVaultPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_GLOBAL)],
          PROGRAM_ID
        );
        // Use private_claim_v2 for v1 markets (same ZK proof, different on-chain payout formula)
        const claimMethodName = isV1 ? "privateClaimV2" : "privateClaim";
        const claimAccounts: Record<string, unknown> = {
          shieldedPool: poolPda,
          market: marketAddress,
          nullifierShard,
          globalVault: globalVaultPda,
          user: userPubkey,
          instructionAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
          systemProgram: SystemProgram.programId,
          dummy0Account: marketAddress,
          dummy1Account: marketAddress,
        };
        if (isV1) {
          claimAccounts.marketV1Config = v1ConfigPda;
        }

        const claimTx = await (
          program.methods as unknown as Record<
            string,
            (proof: unknown, inputs: unknown) => {
              accounts: (acc: unknown) => { preInstructions: (ixs: unknown[]) => { rpc: (opts?: { commitment?: string }) => Promise<string> } };
            }
          >
        )[claimMethodName](proof, publicInputs)
          .accounts(claimAccounts)
          .preInstructions(ZK_COMPUTE_BUDGET_IXS)
          .rpc({ commitment: "confirmed" });

        // Wait for confirmed commitment
        await program.provider.connection.confirmTransaction(claimTx, "confirmed");

        // Mark old token note as spent
        await markNoteAsSpent(tokenNote.commitment);

        const poolAddress = poolPda.toBase58();
        const outputNote: ShieldedNote = {
          amount: parseInt(payoutAmountStr, 10),
          nullifier: outNullifier,
          blinding: outBlinding,
          commitment: outCommitment,
          type: "SOL",
          market: marketAddress.toBase58(),
          poolAddress,
          timestamp: Date.now(),
        };
        await syncNoteToBackend(outputNote, poolAddress);

        // Save pool snapshot AFTER tx to capture latest on-chain state
        try {
          await saveCurrentPoolSnapshot(connection, poolPda, marketAddress.toBase58(), claimTx);
        } catch (e) {
          console.warn("Failed to save post-tx pool snapshot:", e);
        }

        // Index the new commitment using reliable method
        try {
          const indexResult = await indexCommitmentFromChain(
            connection,
            poolPda,
            marketAddress.toBase58(),
            outCommitment,
            claimTx,
            expectedBatch // Pass expected batch for rollover detection
          );
          if (indexResult) {
            outputNote.index = indexResult.batchNumber * 16 + indexResult.leafIndex;
            await syncNoteToBackend(outputNote, poolAddress);
          }
        } catch (e) {
          console.warn("Failed to index commitment:", e);
        }

        toast.dismiss(toastId);
        toast.success("Private claim successful! Now unshielding to your wallet...");

        // Small delay to allow RPC state propagation
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Auto-unshield the SOL note to user's wallet
        const unshieldToastId = toast.loading("Generating Unshield Proof...");
        try {
          const { generateUnshieldProof } = await import("@/features/privacy/lib/unshield");
          const { proof: unshieldProof, publicInputs: unshieldPublicInputs } =
            await generateUnshieldProof(connection, poolPda, outputNote, userPubkey);

          const unshieldNullifierShard = await ensureShardReady(
            identifier,
            outputNote.nullifier,
            marketAddress,
            connection
          );

          const unshieldTx = await (
            program.methods as {
              privateUnshield: (proof: unknown, inputs: unknown) => {
                accounts: (acc: unknown) => { preInstructions: (ixs: unknown[]) => { rpc: () => Promise<string> } };
              };
            }
          )
            .privateUnshield(unshieldProof, unshieldPublicInputs)
            .accounts({
              shieldedPool: poolPda,
              nullifierShard: unshieldNullifierShard,
              user: userPubkey,
              instructionAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
              systemProgram: SystemProgram.programId,
              dummy0Account: poolPda,
              dummy1Account: poolPda,
            })
            .preInstructions(ZK_COMPUTE_BUDGET_IXS)
            .rpc();

          // Mark SOL note as spent after successful unshield
          await markNoteAsSpent(outputNote.commitment);

          toast.dismiss(unshieldToastId);
          toast.success("Claim & Unshield complete! SOL sent to your wallet.", {
            description: `Tx: ${unshieldTx.slice(0, 8)}...`,
          });
          fetchShieldedBalance();
          return { claimTx, unshieldTx, note: outputNote };
        } catch (unshieldErr) {
          console.error("Auto-unshield failed:", unshieldErr);
          toast.dismiss(unshieldToastId);
          toast.warning("Claim succeeded but auto-unshield failed. You can manually unshield your SOL note.", {
            description: (unshieldErr as Error).message,
          });
          fetchShieldedBalance();
          return { claimTx, note: outputNote };
        }
      } catch (err) {
        console.error("Private claim error:", err);
        toast.dismiss(toastId);
        toast.error("Failed to claim privately: " + (err as Error).message);
      } finally {
        setIsGeneratingProof(false);
        releaseTxLock();
      }
    },
    [
      program,
      address,
      getShieldedPoolAddress,
      getPoolIdentifier,
      ensureShardReady,
      getMarket,
      fetchShieldedBalance,
    ]
  );

  /**
   * TEE-powered claim: TEE generates proof and partially signs tx,
   * user co-signs as fee payer (1 wallet signature for all notes).
   */
  const privateClaimViaTee = useCallback(
    async (
      tokenNotes: ShieldedNote[],
      marketAddress: PublicKey,
      onProgress?: (step: number, total: number, status: string) => void
    ): Promise<{ txs: string[]; notes: ShieldedNote[] }> => {
      if (!program || !address || !walletProvider) {
        throw new Error("Wallet not connected");
      }

      setIsGeneratingProof(true);
      acquireTxLock();
      const toastId = toast.loading(`TEE preparing batch claim: ${tokenNotes.length} notes...`);
      onProgress?.(0, tokenNotes.length, "Sending to TEE...");

      try {
        const newNullifierBytes = new Uint8Array(32);
        const newBlindingBytes = new Uint8Array(32);
        crypto.getRandomValues(newNullifierBytes);
        crypto.getRandomValues(newBlindingBytes);

        const tokenType = tokenNotes[0].type === "YES" ? 1 : 2;

        // Validate all notes have a leaf index before sending to TEE
        for (const n of tokenNotes) {
          if (n.index === undefined || n.index === null) {
            throw new Error(
              `Token note is missing leaf_index (commitment ${n.commitment?.slice(0, 16)}...). ` +
              `The note may not have been indexed on-chain after the swap.`
            );
          }
        }

        // Ensure nullifier shards exist (auto-initialize if missing)
        const poolPda = getShieldedPoolAddress(marketAddress);
        const poolId = await getPoolIdentifier(poolPda);
        if (poolId) {
          await ensureRootShardsExist(marketAddress, poolId);
        }

        // TEE generates proof + builds partially-signed transaction
        const result = await teeClient.preparePrivateClaim({
          notes: tokenNotes.map((n) => ({
            amount: n.amount,
            nullifier: bs58.encode(Buffer.from(n.nullifier, "hex")),
            leaf_index: n.index!,
          })),
          market_address: marketAddress.toBase58(),
          token_type: tokenType,
          new_nullifier: bs58.encode(newNullifierBytes),
          new_blinding: bs58.encode(newBlindingBytes),
          recipient: address,
          fee_payer: address,
        });

        if (!result.success || !result.transaction) {
          throw new Error(result.error || "TEE prepare claim failed");
        }

        toast.dismiss(toastId);
        onProgress?.(0, tokenNotes.length, "Sign transaction in wallet...");
        const signToastId = toast.loading("Sign transaction in wallet...");

        // Deserialize the partially-signed transaction from TEE
        const txBytes = Uint8Array.from(atob(result.transaction), (c) => c.charCodeAt(0));
        const tx = Transaction.from(txBytes);

        // User co-signs as fee payer (1 signature)
        const signedTx = await (walletProvider as { signTransaction: (tx: Transaction) => Promise<Transaction> }).signTransaction(tx);

        toast.dismiss(signToastId);
        const submitToastId = toast.loading("Submitting transaction...");

        // Submit the fully-signed transaction
        const connection = program.provider.connection;
        const txSig = await connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: false,
          preflightCommitment: "confirmed",
        });
        await connection.confirmTransaction(txSig, "confirmed");

        // Mark all input notes as spent
        for (const note of tokenNotes) {
          await markNoteAsSpent(note.commitment);
        }

        // Save pool snapshot
        try {
          const poolPda = getShieldedPoolAddress(marketAddress);
          await saveCurrentPoolSnapshot(
            connection,
            poolPda,
            marketAddress.toBase58(),
            txSig
          );
        } catch (e) {
          console.warn("Failed to save post-TEE pool snapshot:", e);
        }

        toast.dismiss(submitToastId);
        toast.success(`Batch claim complete! ${tokenNotes.length} notes → SOL in wallet`);
        onProgress?.(tokenNotes.length, tokenNotes.length, "Done!");
        fetchShieldedBalance();
        return { txs: [txSig], notes: [] };
      } finally {
        setIsGeneratingProof(false);
        releaseTxLock();
      }
    },
    [program, address, walletProvider, getShieldedPoolAddress, getPoolIdentifier, ensureRootShardsExist, fetchShieldedBalance]
  );

  /**
   * Batch claim multiple winning token notes.
   * If TEE is available, uses partial signing (1 user signature for all notes).
   * Otherwise falls back to sequential single-note privateClaim calls with auto-unshield.
   */
  const privateClaimBatch = useCallback(
    async (
      tokenNotes: ShieldedNote[],
      marketAddress: PublicKey,
      onProgress?: (step: number, total: number, status: string) => void
    ): Promise<{ txs: string[]; notes: ShieldedNote[] } | undefined> => {
      if (!program || !address) return;
      if (tokenNotes.length === 0) return { txs: [], notes: [] };

      // TEE path: partial signing (1 user signature for all notes)
      if (tokenNotes.length >= 1 && teeAvailable) {
        try {
          return await privateClaimViaTee(tokenNotes, marketAddress, onProgress);
        } catch (error) {
          console.error("TEE batch claim failed, falling back to browser ZK:", error);
          toast.error("TEE batch failed, falling back to individual claims...");
          // Fall through to sequential flow below
        }
      }

      // Sequential fallback: claim notes one by one using browser ZK proofs
      // privateClaim already includes auto-unshield, so SOL goes to wallet
      const txSignatures: string[] = [];
      const outputNotes: ShieldedNote[] = [];
      for (let i = 0; i < tokenNotes.length; i++) {
        onProgress?.(i, tokenNotes.length, `Claiming note ${i + 1}/${tokenNotes.length}...`);
        try {
          const result = await privateClaim(tokenNotes[i], marketAddress);
          if (result?.claimTx) txSignatures.push(result.claimTx);
          if (result?.note) outputNotes.push(result.note);
        } catch (err) {
          console.error(`Failed to claim note ${i + 1}:`, err);
          toast.error(`Failed to claim note ${i + 1}: ${(err as Error).message}`);
          // Continue with remaining notes
        }
      }
      onProgress?.(tokenNotes.length, tokenNotes.length, "Done!");
      return { txs: txSignatures, notes: outputNotes };
    },
    [program, address, teeAvailable, privateClaimViaTee, privateClaim, fetchShieldedBalance]
  );

  /**
   * Split Token Note: Split one token note into two smaller notes (for partial selling)
   */
  const splitTokenNote = useCallback(
    async (
      tokenNote: ShieldedNote,
      marketAddress: PublicKey,
      amountA: number,
      amountB: number
    ) => {
      if (!program || !address) return;

      try {
        setIsGeneratingProof(true);
        acquireTxLock();
        const toastId = toast.loading("Generating Token Split Proof...");

        if (tokenNote.type === "SOL") {
          toast.dismiss(toastId);
          toast.error("Cannot split a SOL note. Only YES/NO token notes can be split.");
          return;
        }

        if (amountA + amountB !== tokenNote.amount) {
          toast.dismiss(toastId);
          toast.error(
            `Amounts must sum to ${tokenNote.amount}. Got ${amountA} + ${amountB} = ${amountA + amountB}`
          );
          return;
        }

        if (amountA <= 0 || amountB <= 0) {
          toast.dismiss(toastId);
          toast.error("Both split amounts must be greater than 0");
          return;
        }

        const poolPda = getShieldedPoolAddress(marketAddress);
        const identifier = await getPoolIdentifier(poolPda);
        if (!identifier) {
          toast.dismiss(toastId);
          toast.error("Shielded pool not found");
          return;
        }

        const { generateTokenSplitProof } = await import("@/features/privacy/lib/token-split");
        const connection = program.provider.connection;

        // Pre-save pool state to detect batch rollover
        const expectedBatch = await preSavePoolState(connection, poolPda, marketAddress.toBase58());
        console.log(`[splitTokenNote] Pre-saved pool state, expectedBatch=${expectedBatch}`);

        const { proof, publicInputs, nullifierA, nullifierB, commitmentA, commitmentB } =
          await generateTokenSplitProof(
            connection,
            poolPda,
            tokenNote,
            amountA,
            amountB,
            marketAddress
          );

        const shardPda = await ensureShardReady(
          identifier,
          tokenNote.nullifier,
          marketAddress,
          connection
        );
        const userPubkey = new PublicKey(address);

        const tx = await (
          program.methods as unknown as {
            splitTokenNote: (proof: unknown, inputs: unknown) => {
              accounts: (acc: unknown) => { preInstructions: (ixs: unknown[]) => { rpc: (opts?: { commitment?: string }) => Promise<string> } };
            };
          }
        )
          .splitTokenNote(proof, publicInputs)
          .accounts({
            shieldedPool: poolPda,
            nullifierShard: shardPda,
            user: userPubkey,
            instructionAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
            dummy0Account: poolPda,
            dummy1Account: poolPda,
          })
          .preInstructions(ZK_COMPUTE_BUDGET_IXS)
          .rpc({ commitment: "confirmed" });

        // Wait for confirmed commitment to ensure the split is finalized
        await program.provider.connection.confirmTransaction(tx, "confirmed");

        // Small delay to allow RPC state propagation
        await new Promise((resolve) => setTimeout(resolve, 2000));

        toast.dismiss(toastId);
        toast.success("Token split successful!", { description: `Tx: ${tx.slice(0, 8)}...` });

        // Mark old note as spent
        await markNoteAsSpent(tokenNote.commitment);

        // Save two new notes
        const poolAddress = poolPda.toBase58();
        const noteA: ShieldedNote = {
          amount: amountA,
          nullifier: nullifierA,
          blinding: "0",
          commitment: commitmentA,
          type: tokenNote.type,
          market: marketAddress.toBase58(),
          poolAddress,
          timestamp: Date.now(),
        };
        const noteB: ShieldedNote = {
          amount: amountB,
          nullifier: nullifierB,
          blinding: "0",
          commitment: commitmentB,
          type: tokenNote.type,
          market: marketAddress.toBase58(),
          poolAddress,
          timestamp: Date.now(),
        };

        await syncNoteToBackend(noteA, poolAddress);
        await syncNoteToBackend(noteB, poolAddress);

        // Save pool snapshot AFTER tx to capture latest on-chain state
        try {
          await saveCurrentPoolSnapshot(connection, poolPda, marketAddress.toBase58(), tx);
        } catch (e) {
          console.warn("Failed to save post-tx pool snapshot:", e);
        }

        // Index both new commitments using reliable method (pass expectedBatch for rollover detection)
        try {
          const indexResultA = await indexCommitmentFromChain(
            connection,
            poolPda,
            marketAddress.toBase58(),
            commitmentA,
            tx,
            expectedBatch
          );
          if (indexResultA) {
            noteA.index = indexResultA.batchNumber * 16 + indexResultA.leafIndex;
            await syncNoteToBackend(noteA, poolAddress);
          }
          const indexResultB = await indexCommitmentFromChain(
            connection,
            poolPda,
            marketAddress.toBase58(),
            commitmentB,
            tx,
            expectedBatch
          );
          if (indexResultB) {
            noteB.index = indexResultB.batchNumber * 16 + indexResultB.leafIndex;
            await syncNoteToBackend(noteB, poolAddress);
          }
        } catch (e) {
          console.warn("Failed to index split commitments:", e);
        }

        return { tx, noteA, noteB };
      } catch (error) {
        console.error("Token Split Error:", error);
        toast.dismiss();
        toast.error("Failed to split token note: " + (error as Error).message);
      } finally {
        setIsGeneratingProof(false);
        releaseTxLock();
      }
    },
    [program, address, getShieldedPoolAddress, getPoolIdentifier, ensureShardReady]
  );

  /**
   * TEE-powered sell: TEE generates proof and partially signs tx,
   * user co-signs as fee payer (1 wallet signature for all notes).
   */
  const privateSellViaTee = useCallback(
    async (
      tokenNotes: ShieldedNote[],
      marketAddress: PublicKey,
      expectedSolAmounts: number[],
      onProgress?: (step: number, total: number, status: string) => void
    ): Promise<{ txs: string[]; notes: ShieldedNote[] }> => {
      if (!program || !address || !walletProvider) {
        throw new Error("Wallet not connected");
      }

      setIsGeneratingProof(true);
      acquireTxLock();
      const toastId = toast.loading(`TEE preparing batch sell: ${tokenNotes.length} notes...`);
      onProgress?.(0, tokenNotes.length, "Sending to TEE...");

      try {
        const newNullifierBytes = new Uint8Array(32);
        const newBlindingBytes = new Uint8Array(32);
        crypto.getRandomValues(newNullifierBytes);
        crypto.getRandomValues(newBlindingBytes);

        const tokenType = tokenNotes[0].type === "YES" ? 1 : 2;
        // Apply 5% slippage tolerance — AMM price may have moved since the estimate
        const expectedTotal = expectedSolAmounts.reduce((a, b) => a + b, 0);
        const minSolOutput = Math.floor(expectedTotal * 0.95);

        // Validate all notes have a leaf index before sending to TEE
        for (const n of tokenNotes) {
          if (n.index === undefined || n.index === null) {
            throw new Error(
              `Token note is missing leaf_index (commitment ${n.commitment?.slice(0, 16)}...). ` +
              `The note may not have been indexed on-chain after the swap.`
            );
          }
        }

        // Ensure nullifier shards exist (auto-initialize if missing)
        const poolPda = getShieldedPoolAddress(marketAddress);
        const poolId = await getPoolIdentifier(poolPda);
        if (poolId) {
          await ensureRootShardsExist(marketAddress, poolId);
        }

        // TEE generates proof + builds partially-signed transaction
        const result = await teeClient.preparePrivateSell({
          notes: tokenNotes.map((n) => ({
            amount: n.amount,
            nullifier: bs58.encode(Buffer.from(n.nullifier, "hex")),
            leaf_index: n.index!,
          })),
          market_address: marketAddress.toBase58(),
          token_type: tokenType,
          new_nullifier: bs58.encode(newNullifierBytes),
          new_blinding: bs58.encode(newBlindingBytes),
          min_sol_output: minSolOutput,
          recipient: address,
          fee_payer: address,
        });

        if (!result.success || !result.transaction) {
          throw new Error(result.error || "TEE prepare sell failed");
        }

        toast.dismiss(toastId);
        onProgress?.(0, tokenNotes.length, "Sign transaction in wallet...");
        const signToastId = toast.loading("Sign transaction in wallet...");

        // Deserialize the partially-signed transaction from TEE
        const txBytes = Uint8Array.from(atob(result.transaction), (c) => c.charCodeAt(0));
        const tx = Transaction.from(txBytes);

        // User co-signs as fee payer (1 signature)
        const signedTx = await (walletProvider as { signTransaction: (tx: Transaction) => Promise<Transaction> }).signTransaction(tx);

        toast.dismiss(signToastId);
        const submitToastId = toast.loading("Submitting transaction...");

        // Submit the fully-signed transaction
        const connection = program.provider.connection;
        const txSig = await connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: false,
          preflightCommitment: "confirmed",
        });
        await connection.confirmTransaction(txSig, "confirmed");

        // Mark all input notes as spent
        for (const note of tokenNotes) {
          await markNoteAsSpent(note.commitment);
        }

        // Save pool snapshot
        try {
          const poolPda = getShieldedPoolAddress(marketAddress);
          await saveCurrentPoolSnapshot(
            connection,
            poolPda,
            marketAddress.toBase58(),
            txSig
          );
        } catch (e) {
          console.warn("Failed to save post-TEE pool snapshot:", e);
        }

        toast.dismiss(submitToastId);
        toast.success(`Batch sell complete! ${tokenNotes.length} notes → SOL in wallet`);
        onProgress?.(tokenNotes.length, tokenNotes.length, "Done!");
        fetchShieldedBalance();
        return { txs: [txSig], notes: [] };
      } finally {
        setIsGeneratingProof(false);
        releaseTxLock();
      }
    },
    [program, address, walletProvider, getShieldedPoolAddress, getPoolIdentifier, ensureRootShardsExist, fetchShieldedBalance]
  );

  /**
   * Batch sell multiple token notes.
   * If TEE is available, uses partial signing (1 user signature for all notes).
   * Otherwise falls back to browser ZK proofs (sell + auto-unshield per note).
   */
  const privateSellBatch = useCallback(
    async (
      tokenNotes: ShieldedNote[],
      marketAddress: PublicKey,
      expectedSolAmounts: number[],
      onProgress?: (step: number, total: number, status: string) => void
    ): Promise<{ txs: string[]; notes: ShieldedNote[] } | undefined> => {
      if (!program || !address) return;
      if (tokenNotes.length === 0) return { txs: [], notes: [] };
      if (tokenNotes.length !== expectedSolAmounts.length) {
        throw new Error("tokenNotes and expectedSolAmounts must have same length");
      }

      // TEE path: partial signing (1 user signature for all notes)
      if (tokenNotes.length >= 1 && teeAvailable) {
        try {
          return await privateSellViaTee(tokenNotes, marketAddress, expectedSolAmounts, onProgress);
        } catch (error) {
          console.error("TEE batch sell failed, falling back to browser ZK:", error);
          toast.error("TEE batch failed, falling back to browser proofs...");
          // Fall through to browser ZK flow below
        }
      }

      // Browser ZK fallback: sequential proof + sell + auto-unshield per note
      try {
        setIsGeneratingProof(true);
        acquireTxLock();
        const toastId = toast.loading(`Selling ${tokenNotes.length} notes sequentially...`);

        const poolPda = getShieldedPoolAddress(marketAddress);
        const identifier = await getPoolIdentifier(poolPda);
        if (!identifier) {
          toast.dismiss(toastId);
          toast.error("Shielded pool not found");
          return;
        }

        for (const note of tokenNotes) {
          if (note.type === "SOL") {
            toast.dismiss(toastId);
            toast.error("Cannot sell SOL notes. Use unshield instead.");
            return;
          }
        }

        const connection = program.provider.connection;
        const { generatePrivateSellProof } = await import("@/features/privacy/lib/private-sell");
        const userPubkey = new PublicKey(address);
        const [globalVaultPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(SEED_GLOBAL)],
          PROGRAM_ID
        );

        const txSignatures: string[] = [];
        const outputNotes: ShieldedNote[] = [];

        for (let i = 0; i < tokenNotes.length; i++) {
          const note = tokenNotes[i];
          const txToastId = toast.loading(`Note ${i + 1}/${tokenNotes.length}: generating proof...`);
          let signToastId: string | number | undefined;
          onProgress?.(i, tokenNotes.length, `Processing note ${i + 1}/${tokenNotes.length}...`);

          try {
            const expectedBatch = await preSavePoolState(connection, poolPda, marketAddress.toBase58());

            const result = await generatePrivateSellProof(
              connection,
              poolPda,
              note,
              marketAddress,
              expectedSolAmounts[i]
            );

            toast.dismiss(txToastId);
            signToastId = toast.loading(`Note ${i + 1}/${tokenNotes.length}: signing transaction...`);

            const shardPda = await ensureShardReady(
              identifier,
              note.nullifier,
              marketAddress,
              connection
            );

            const tx = await (
              program.methods as unknown as {
                privateSell: (proof: unknown, inputs: unknown, minSolOutput: BN) => {
                  accounts: (acc: unknown) => { preInstructions: (ixs: unknown[]) => { rpc: () => Promise<string> } };
                };
              }
            )
              .privateSell(result.proof, result.publicInputs, new BN(expectedSolAmounts[i]))
              .accounts({
                shieldedPool: poolPda,
                market: marketAddress,
                nullifierShard: shardPda,
                globalVault: globalVaultPda,
                user: userPubkey,
                instructionAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
                systemProgram: SystemProgram.programId,
                dummy0Account: marketAddress,
                dummy1Account: marketAddress,
              })
              .preInstructions(ZK_COMPUTE_BUDGET_IXS)
              .rpc();

            txSignatures.push(tx);

            const newNote: ShieldedNote = {
              amount: parseInt(result.solAmount, 10),
              nullifier: result.outNullifier,
              blinding: result.outBlinding,
              commitment: result.outCommitment,
              type: "SOL",
              market: marketAddress.toBase58(),
              poolAddress: poolPda.toBase58(),
              timestamp: Date.now(),
            };
            outputNotes.push(newNote);

            await markNoteAsSpent(note.commitment);
            await syncNoteToBackend(newNote, poolPda.toBase58());

            try {
              await saveCurrentPoolSnapshot(connection, poolPda, marketAddress.toBase58(), tx);
            } catch (e) {
              console.warn("Failed to save post-tx pool snapshot:", e);
            }

            try {
              const indexResult = await indexCommitmentFromChain(
                connection,
                poolPda,
                marketAddress.toBase58(),
                result.outCommitment,
                tx,
                expectedBatch
              );
              if (indexResult) {
                newNote.index = indexResult.batchNumber * 16 + indexResult.leafIndex;
                await syncNoteToBackend(newNote, poolPda.toBase58());
              }
            } catch (e) {
              console.warn("Failed to index commitment:", e);
            }

            // Auto-unshield: withdraw SOL from private pool to wallet
            try {
              await unshield(newNote, marketAddress);
            } catch (e) {
              console.warn("Auto-unshield failed, SOL note kept:", e);
            }

            toast.dismiss(signToastId);
            toast.success(`Note ${i + 1}/${tokenNotes.length} sold + unshielded!`);
          } catch (txError) {
            toast.dismiss(txToastId);
            toast.dismiss(signToastId);
            toast.error(`Note ${i + 1} failed: ${(txError as Error).message}`);
            console.error(`Batch sell note ${i + 1} failed:`, txError);
          }
        }

        toast.dismiss(toastId);
        fetchShieldedBalance();
        return { txs: txSignatures, notes: outputNotes };
      } catch (error) {
        console.error("Private Sell Batch Error:", error);
        toast.dismiss();
        toast.error("Failed to batch sell: " + (error as Error).message);
      } finally {
        setIsGeneratingProof(false);
        releaseTxLock();
      }
    },
    [
      program,
      address,
      walletProvider,
      getShieldedPoolAddress,
      getPoolIdentifier,
      ensureShardReady,
      fetchShieldedBalance,
      teeAvailable,
      privateSellViaTee,
      unshield,
    ]
  );

  /**
   * Combined shield+swap in a single Solana transaction (1 wallet signature).
   * Returns true on success, false if the combined approach is not possible
   * (e.g., batch rollover edge case), in which case caller should fall back to 2-tx.
   */
  const shieldAndSwapCombined = useCallback(
    async (
      amount: number,
      direction: "YES" | "NO",
      marketAddress: PublicKey,
      onProgress?: (step: "proof" | "sign" | "shield" | "swap") => void
    ): Promise<boolean> => {
      if (!program || !address || !walletProvider) {
        console.warn("[combined] Skipped: program=%s address=%s walletProvider=%s",
          !!program, !!address, !!walletProvider);
        return false;
      }

      const connection = program.provider.connection;
      const userPubkey = new PublicKey(address);
      const poolPda = getShieldedPoolAddress(marketAddress);
      const identifier = await getPoolIdentifier(poolPda);
      if (!identifier) {
        console.warn("[combined] Pool identifier not found for", poolPda.toBase58());
        return false;
      }

      // 1. Read current tree state
      const combinedStartTime = Date.now();
      const { reconstructMerkleTree, MMRTree } = await import("@/features/privacy/lib/merkle-utils");
      const currentTree = await reconstructMerkleTree(connection, poolPda);

      // 2. Find insertion slot in current batch
      const insertIndex = currentTree.batchLeaves.findIndex(l => l.isZero());
      if (insertIndex === -1 || insertIndex >= 15) {
        console.warn("[combined] insertIndex =", insertIndex, "— falling back to 2-tx");
        return false;
      }

      console.warn("[combined] Will insert shield commitment at batch leaf index", insertIndex);
      onProgress?.("proof");

      // Pre-save pool state for commitment indexing
      const expectedBatch = await preSavePoolState(connection, poolPda, marketAddress.toBase58());

      // 3. Generate shield proof
      const shieldNullifierBytes = new Uint8Array(31);
      const shieldBlindingBytes = new Uint8Array(31);
      crypto.getRandomValues(shieldNullifierBytes);
      crypto.getRandomValues(shieldBlindingBytes);
      const shieldNullifier = new BN(shieldNullifierBytes);
      const shieldBlinding = new BN(shieldBlindingBytes);

      const { createShieldProof } = await import("@/features/privacy/lib/shield");
      const { proof: shieldProofBytes, publicInputs: shieldPublicInputs } =
        await createShieldProof(amount, shieldNullifier, shieldBlinding);
      console.warn("[combined] Shield proof generated");

      // 4. Extract commitment from shield proof public inputs (bytes 8-40)
      const shieldCommitmentBN = new BN(Buffer.from(shieldPublicInputs.slice(8, 40)));
      const shieldCommitmentHex = shieldCommitmentBN.toString("hex").padStart(64, "0");

      // 5. Build predicted tree with new commitment inserted at the empty slot
      const predictedLeaves = [...currentTree.batchLeaves];
      predictedLeaves[insertIndex] = shieldCommitmentBN;
      const predictedTree = new MMRTree(
        predictedLeaves,
        currentTree.peaks,
        currentTree.peakDepths,
        currentTree.batchNumber,
      );

      // 6. Calculate swap output (same AMM math as existing privateSwap)
      const market = await getMarket(marketAddress);
      if (!market) throw new Error("Market not found");
      const SHIELDED_FEE_BPS = 20;
      const netSolAmount = amount * (10000 - SHIELDED_FEE_BPS) / 10000;
      const tokenType = direction === "YES" ? 0 : 1;
      const estimatedTokens = await calculateBuyOutput(
        market.yesTokenMint,
        market.noTokenMint,
        netSolAmount,
        tokenType
      );
      if (!estimatedTokens) throw new Error("Failed to calculate swap output");

      // 7. Create solNote representing the shield commitment (for swap proof generation)
      const solNote: ShieldedNote = {
        amount,
        nullifier: shieldNullifier.toString("hex").padStart(64, "0"),
        blinding: shieldBlinding.toString("hex").padStart(64, "0"),
        commitment: shieldCommitmentHex,
        type: "SOL",
        market: marketAddress.toBase58(),
        poolAddress: poolPda.toBase58(),
        timestamp: Date.now(),
      };

      // 8. Generate swap proof using predicted post-shield tree
      const { generatePrivateSwapProof } = await import("@/features/privacy/lib/private-swap");
      const swapResult = await generatePrivateSwapProof(
        connection,
        poolPda,
        solNote,
        estimatedTokens,
        direction,
        marketAddress,
        predictedTree,
        insertIndex,
      );
      console.warn("[combined] Swap proof generated");

      // 8.5. Freshness check: re-read pool state to detect changes during proof generation
      // ZK proof generation takes 10-30s, during which the pool state may have changed
      const proofElapsedMs = Date.now() - combinedStartTime;
      console.warn(`[combined] Proof generation took ${(proofElapsedMs / 1000).toFixed(1)}s — checking pool state freshness...`);
      const freshTree = await reconstructMerkleTree(connection, poolPda);
      const freshInsertIndex = freshTree.batchLeaves.findIndex((l: BN) => l.isZero());

      if (freshInsertIndex !== insertIndex) {
        console.warn(
          `[combined] Pool state changed during proof generation! ` +
          `Expected empty slot at index ${insertIndex}, now at ${freshInsertIndex}. ` +
          `Falling back to 2-tx.`
        );
        return false;
      }

      // Verify non-predicted leaves haven't changed (another tx may have inserted at a different slot)
      const leavesChanged = currentTree.batchLeaves.some(
        (leaf: BN, i: number) => i !== insertIndex && !leaf.eq(freshTree.batchLeaves[i])
      );
      if (leavesChanged) {
        console.warn("[combined] Batch leaves changed during proof generation. Falling back to 2-tx.");
        return false;
      }

      // Verify peaks haven't changed (batch rollover from another tx)
      const peaksChanged = currentTree.peaks.length !== freshTree.peaks.length ||
        currentTree.peaks.some((p: BN, i: number) => !p.eq(freshTree.peaks[i]));
      if (peaksChanged) {
        console.warn("[combined] Peaks changed during proof generation (batch rollover?). Falling back to 2-tx.");
        return false;
      }

      console.warn("[combined] Pool state freshness verified — no changes during proof generation");

      // Diagnostic: log roots for debugging Merkle root mismatches
      const predictedBatchRoot = predictedTree.getBatchRoot();
      const initialBatchRoot = currentTree.onChainBatchRoot;
      const freshBatchRoot = freshTree.onChainBatchRoot;
      console.warn(
        "[combined] Batch roots — initial:", initialBatchRoot.toString("hex").padStart(64, "0").slice(0, 16) + "...",
        "fresh:", freshBatchRoot.toString("hex").padStart(64, "0").slice(0, 16) + "...",
        "predicted (post-shield):", predictedBatchRoot.toString("hex").padStart(64, "0").slice(0, 16) + "...",
      );
      console.warn("[combined] Peaks:", freshTree.peaks.length, "Batch#:", freshTree.batchNumber, "InsertIdx:", insertIndex);

      // 9. Build shield instruction via .instruction() API
      const shieldIx = await (
        program.methods as unknown as {
          privateShield: (proof: number[], inputs: number[]) => {
            accountsPartial: (acc: Record<string, unknown>) => {
              instruction: () => Promise<TransactionInstruction>;
            };
          };
        }
      )
        .privateShield(shieldProofBytes, shieldPublicInputs)
        .accountsPartial({
          shieldedPool: poolPda,
          depositor: userPubkey,
          instructionAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      console.warn("[combined] Shield instruction built");

      // 10. Build swap instruction via .instruction() API
      const nullifierShard = await ensureShardReady(
        identifier,
        solNote.nullifier,
        marketAddress,
        connection
      );
      const [globalVaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from(SEED_GLOBAL)],
        PROGRAM_ID
      );
      const minTokenOutput = new BN(Math.floor(estimatedTokens * 0.98));

      const swapIx = await (
        program.methods as unknown as {
          privateSwap: (proof: number[], inputs: number[], minTokenOutput: BN) => {
            accountsPartial: (acc: Record<string, unknown>) => {
              instruction: () => Promise<TransactionInstruction>;
            };
          };
        }
      )
        .privateSwap(swapResult.proof, swapResult.publicInputs, minTokenOutput)
        .accountsPartial({
          shieldedPool: poolPda,
          market: marketAddress,
          nullifierShard,
          globalVault: globalVaultPda,
          user: userPubkey,
          instructionAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
          systemProgram: SystemProgram.programId,
          dummy0Account: marketAddress,
          dummy1Account: marketAddress,
        })
        .instruction();
      console.warn("[combined] Swap instruction built");

      // 11. Combine into single Transaction with elevated compute budget
      onProgress?.("sign");
      const tx = new Transaction();
      tx.add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: 1_200_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1 }),
      );
      tx.add(shieldIx as unknown as TransactionInstruction);
      tx.add(swapIx as unknown as TransactionInstruction);

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      tx.recentBlockhash = blockhash;
      tx.lastValidBlockHeight = lastValidBlockHeight;
      tx.feePayer = userPubkey;

      console.warn("[combined] Transaction built, requesting signature...");

      // 12. Sign once and submit (same cast pattern as use-prediction-market.ts)
      const signedTx = await (
        walletProvider as { signTransaction: (tx: Transaction) => Promise<Transaction> }
      ).signTransaction(tx);
      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      });
      console.warn("[combined] Tx sent:", signature);

      const confirmation = await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        "confirmed"
      );

      // Check for on-chain error (confirmTransaction resolves even for failed txs)
      if (confirmation.value.err) {
        console.error("[combined] Transaction failed on-chain:", confirmation.value.err);
        throw new Error(
          `Combined shield+swap transaction failed on-chain: ${JSON.stringify(confirmation.value.err)}`
        );
      }

      console.warn("[combined] Transaction confirmed successfully:", signature);
      toast.success("Shielded swap completed in a single transaction!", {
        description: `Tx: ${signature.slice(0, 8)}...`,
      });

      // 13. Post-tx: save notes and index commitments
      const poolAddress = poolPda.toBase58();

      // Save shield note (immediately mark as spent since swap consumed it)
      await syncNoteToBackend(solNote, poolAddress);
      await markNoteAsSpent(solNote.commitment);

      // Save swap output token note
      const tokenNote: ShieldedNote = {
        amount: parseInt(swapResult.amountOut, 10),
        nullifier: swapResult.outNullifier,
        blinding: swapResult.outBlinding,
        commitment: swapResult.outCommitment,
        type: direction,
        market: marketAddress.toBase58(),
        poolAddress,
        timestamp: Date.now(),
      };
      await syncNoteToBackend(tokenNote, poolAddress);

      // Save pool snapshot
      try {
        await saveCurrentPoolSnapshot(connection, poolPda, marketAddress.toBase58(), signature);
      } catch (e) {
        console.warn("Failed to save post-tx pool snapshot:", e);
      }

      // Index shield commitment
      try {
        const shieldIndexResult = await indexCommitmentFromChain(
          connection, poolPda, marketAddress.toBase58(),
          shieldCommitmentHex, signature, expectedBatch
        );
        if (shieldIndexResult) {
          solNote.index = shieldIndexResult.batchNumber * 16 + shieldIndexResult.leafIndex;
          await syncNoteToBackend(solNote, poolAddress);
        }
      } catch (e) {
        console.warn("Failed to index shield commitment:", e);
      }

      // Index swap commitment
      try {
        const swapIndexResult = await indexCommitmentFromChain(
          connection, poolPda, marketAddress.toBase58(),
          swapResult.outCommitment, signature, expectedBatch
        );
        if (swapIndexResult) {
          tokenNote.index = swapIndexResult.batchNumber * 16 + swapIndexResult.leafIndex;
          await syncNoteToBackend(tokenNote, poolAddress);
        }
      } catch (e) {
        console.warn("Failed to index swap commitment:", e);
      }

      fetchShieldedBalance();
      return true;
    },
    [
      program,
      address,
      walletProvider,
      getShieldedPoolAddress,
      getPoolIdentifier,
      getMarket,
      calculateBuyOutput,
      ensureShardReady,
      fetchShieldedBalance,
    ]
  );

  const autoShieldAndSwap = useCallback(
    async (
      amount: number,
      direction: "YES" | "NO",
      marketAddress: PublicKey,
      onProgress?: (step: "proof" | "sign" | "shield" | "swap") => void
    ) => {
      if (!program || !address) return;
      let solNote: ShieldedNote | undefined;
      try {
        setIsGeneratingProof(true);
        acquireTxLock();

        // Try combined single-transaction approach (1 wallet signature)
        try {
          const combined = await shieldAndSwapCombined(amount, direction, marketAddress, onProgress);
          if (combined) return; // Success with single signature
        } catch (combinedErr) {
          console.warn("[autoShieldAndSwap] Combined approach failed, falling back to 2-tx:", combinedErr);
        }

        // Fallback: sequential 2-transaction approach (batch rollover or combined failed)
        onProgress?.("shield");
        const shieldResult = await shield(amount, marketAddress);
        if (!shieldResult) throw new Error("Shielding failed");
        solNote = shieldResult.note;
        toast.info(
          "Shielding confirmed. Starting private swap...",
          { duration: 3000 }
        );
        // Small delay to allow RPC state propagation after confirmed commitment
        await new Promise((resolve) => setTimeout(resolve, 2000));
        onProgress?.("swap");
        await privateSwap(solNote, marketAddress, direction);
      } catch (err) {
        console.error("Auto-Shield-Swap Error:", err);
        // If shield succeeded but swap failed, inform user their SOL note is safe
        if (solNote) {
          toast.error(
            "Swap failed, but your shielded SOL is safe. You can retry the swap from your Shielded Wallet or unshield to recover your funds.",
            { duration: 10000 }
          );
        } else {
          toast.error("Auto-Swap Failed: " + (err as Error).message);
        }
        throw err; // Re-throw to let caller handle it
      } finally {
        setIsGeneratingProof(false);
        releaseTxLock();
        fetchShieldedBalance();
      }
    },
    [program, address, shield, privateSwap, shieldAndSwapCombined, fetchShieldedBalance]
  );

  return {
    shield,
    unshield,
    privateSwap,
    privateSell,
    privateSellBatch,
    privateSellViaTee,
    privateClaim,
    privateClaimViaTee,
    privateClaimBatch,
    splitTokenNote,
    autoShieldAndSwap,
    isGeneratingProof,
    shieldedBalance,
    setShieldedBalance,
    fetchShieldedBalance,
    findActiveShardAddress,
    splitShardIfNeeded,
    ensureShardReady,
    getShieldedPoolAddress,
    getPoolIdentifier,
    getNullifierShardAddress,
    getMarket,
    calculateBuyOutput,
    teeAvailable,
  };
}
