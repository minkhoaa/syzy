import { PublicKey, Connection } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { reconstructMerkleTree, computeBatchRootFromLeaves } from "./merkle-utils";
import { ShieldedNote } from "@/features/privacy/hooks/use-zk";
import { Buffer } from "buffer";
import { hash4 } from "./poseidon";
import { formatProofForSnark, SnarkJSProof } from "./proof-utils";
import { zkApi } from "@/lib/zk-api";
import { getCommitmentPosition } from "@/features/privacy/utils/zk-storage";

// Define the input structure for the circuit
interface PrivateClaimInput {
  token_amount_in: string;
  old_nullifier_in: string;
  token_type: string;
  market_id: string;
  new_nullifier: string;
  new_blinding: string;
  payout_amount_in: string;
  pathElements: string[];
  pathIndex: number[];
}

export const generatePrivateClaimProof = async (connection: Connection, shieldedPoolAddress: PublicKey, tokenNote: ShieldedNote, marketAddress: PublicKey, payoutAmount: number) => {
  console.log("Generating Private Claim Proof...");

  const padHex = (h: string) => h.padStart(64, "0");
  const poolAddressStr = shieldedPoolAddress.toBase58();

  // Compute commitment from secrets (stored values may be wrong)
  const tokenType = tokenNote.type === "YES" ? "1" : "2";
  const computedCommitment = hash4([
    BigInt(tokenNote.amount),
    BigInt("0x" + tokenNote.nullifier),
    BigInt(tokenType),
    BigInt("0x" + Buffer.from(marketAddress.toBuffer()).toString("hex")),
  ]);
  const myCommitment = computedCommitment.toString(16).padStart(64, "0");
  const storedCommitment = padHex(tokenNote.commitment);

  // Step 1: Always reconstruct on-chain MMR tree first
  const tree = await reconstructMerkleTree(connection, shieldedPoolAddress);

  // Step 2: Search current batch on-chain (primary path)
  let pathElements: string[];
  let pathIndices: number[];

  const leafIndex = tree.batchLeaves.findIndex(
    l => padHex(l.toString("hex")) === myCommitment || padHex(l.toString("hex")) === storedCommitment
  );

  if (leafIndex !== -1) {
    // Found in current batch — generate proof directly
    const proof = tree.getProof(leafIndex);
    pathElements = proof.pathElements;
    pathIndices = proof.pathIndices;

    // Index for future use
    try {
      await zkApi.storeCommitment({
        poolAddress: poolAddressStr,
        marketAddress: marketAddress.toBase58(),
        commitment: myCommitment,
        leafIndex,
        batchNumber: tree.batchNumber,
        transactionId: "",
      });
    } catch { /* ignore conflicts */ }
  } else {
    // Step 3: Not in current batch — DB lookup for past batch
    let commitmentPosition = await getCommitmentPosition(poolAddressStr, myCommitment);
    if (!commitmentPosition && myCommitment !== storedCommitment) {
      commitmentPosition = await getCommitmentPosition(poolAddressStr, tokenNote.commitment);
    }

    if (commitmentPosition && commitmentPosition.batchNumber < tree.batchNumber) {
      // Note is in a PAST batch — use getProofForPastBatch
      const snapshots = await zkApi.getBatchSnapshots(poolAddressStr);
      const storedBatchRoots: BN[] = [];
      let pastBatchLeaves: BN[] | null = null;

      for (let b = 0; b < tree.batchNumber; b++) {
        const snapshot = snapshots.find(s => s.batchNumber === b);
        if (snapshot) {
          const rootBN = new BN(snapshot.batchRoot, "hex");
          if (rootBN.isZero() && snapshot.leaves.some(l => l !== "0".repeat(64))) {
            const leaves = snapshot.leaves.map(l => new BN(l, "hex"));
            storedBatchRoots.push(computeBatchRootFromLeaves(leaves));
          } else {
            storedBatchRoots.push(rootBN);
          }
          if (b === commitmentPosition.batchNumber) {
            pastBatchLeaves = snapshot.leaves.map(l => new BN(l, "hex"));
          }
        } else {
          storedBatchRoots.push(new BN(0));
        }
      }

      if (!pastBatchLeaves) {
        throw new Error(`No snapshot found for batch ${commitmentPosition.batchNumber}. Cannot generate proof.`);
      }

      const proof = tree.getProofForPastBatch(
        pastBatchLeaves,
        commitmentPosition.leafIndex,
        commitmentPosition.batchNumber,
        storedBatchRoots,
      );
      pathElements = proof.pathElements;
      pathIndices = proof.pathIndices;
    } else {
      throw new Error(
        `Note commitment not found in Merkle Tree. ` +
        `Commitment not in current batch and not found in past batch DB. ` +
        `Wait a few seconds and try again.`,
      );
    }
  }

  // 3. Prepare Circuit Inputs (tokenType already computed above for commitment)

  // Output Secrets (SOL Note)
  const outNullifierBytes = new Uint8Array(31);
  const outBlindingBytes = new Uint8Array(31);
  crypto.getRandomValues(outNullifierBytes);
  crypto.getRandomValues(outBlindingBytes);
  const outNullifier = new BN(outNullifierBytes);
  const outBlinding = new BN(outBlindingBytes);

  // Safely convert amounts to BN string - handles number, string, or BN input
  const toBNString = (val: unknown): string => {
    if (val === null || val === undefined) return "0";
    if (typeof val === "string") return new BN(val).toString();
    if (typeof val === "number") {
      // For large numbers, convert via string to avoid precision loss
      return new BN(Math.floor(val).toString()).toString();
    }
    if (typeof val === "bigint") return val.toString();
    // Handle BN objects
    if (val && typeof val === "object" && "toString" in val) {
      return (val as { toString: () => string }).toString();
    }
    return "0";
  };

  const input: PrivateClaimInput = {
    token_amount_in: toBNString(tokenNote.amount),
    old_nullifier_in: new BN(Buffer.from(tokenNote.nullifier, "hex")).toString(),
    token_type: tokenType,
    market_id: new BN(marketAddress.toBuffer()).toString(),
    new_nullifier: outNullifier.toString(),
    new_blinding: outBlinding.toString(),
    payout_amount_in: toBNString(payoutAmount),
    pathElements: pathElements,
    pathIndex: pathIndices,
  };

  // Generate proof

  // 4. Generate Proof via SnarkJS
  const wasmPath = "/zk/private_claim.wasm";
  const zkeyPath = "/zk/private_claim.zkey";

  const snarkjs = (window as unknown as { snarkjs: { groth16: { fullProve: (input: PrivateClaimInput, wasm: string, zkey: string) => Promise<{ proof: SnarkJSProof; publicSignals: string[] }> } } }).snarkjs;
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);

  // Extract commitment from public signals (index 1 = new_commitment)
  const outCommitmentHex = BigInt(publicSignals[1]).toString(16).padStart(64, "0");

  return {
    proof: formatProofForSnark(proof), // Use the CORRECT formatter with pi_a.y negation
    publicInputs: convertClaimPublicInputs(publicSignals),
    outNullifier: outNullifier.toString("hex").padStart(64, "0"),
    outBlinding: outBlinding.toString("hex").padStart(64, "0"),
    outCommitment: outCommitmentHex,
    payoutAmount: new BN(payoutAmount).toString(),
  };
};

// Layout:
// old_nullifier: [u8; 32]
// new_commitment: [u8; 32]
// root: [u8; 32]
// winning_outcome: [u8; 1]
// token_amount: [u8; 8]
// payout_amount: [u8; 8]
// Total: 113 bytes
function convertClaimPublicInputs(publicSignals: string[]) {
  const old_nullifier = to32Bytes(publicSignals[0]);
  const new_commitment = to32Bytes(publicSignals[1]);
  const root = to32Bytes(publicSignals[2]);
  const winning_outcome = parseInt(publicSignals[3]);
  const token_amount = new BN(publicSignals[4]).toArrayLike(Buffer, "be", 8);
  const payout_amount = new BN(publicSignals[5]).toArrayLike(Buffer, "be", 8);

  const buffer = Buffer.concat([Buffer.from(old_nullifier), Buffer.from(new_commitment), Buffer.from(root), Buffer.from([winning_outcome]), token_amount, payout_amount]);

  return Array.from(buffer);
}

function to32Bytes(n: string): number[] {
  let hex = BigInt(n).toString(16);
  while (hex.length < 64) hex = "0" + hex;
  const bytes = [];
  for (let i = 0; i < 64; i += 2) bytes.push(parseInt(hex.slice(i, i + 2), 16));
  return bytes;
}
