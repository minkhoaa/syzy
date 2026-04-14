import { PublicKey, Connection } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { reconstructMerkleTree, computeBatchRootFromLeaves } from "./merkle-utils";
import { ShieldedNote } from "@/features/privacy/hooks/use-zk";
import { Buffer } from "buffer";
import { hash4 } from "./poseidon";
import { formatProofForSnark, SnarkJSProof } from "./proof-utils";
import { getCommitmentPosition } from "@/features/privacy/utils/zk-storage";
import { zkApi } from "@/lib/zk-api";

interface TokenSplitInput {
  old_amount_in: string;
  old_nullifier_in: string;
  token_type_in: string;
  market_id: string;
  amount_a_in: string;
  amount_b_in: string;
  new_nullifier_a: string;
  new_nullifier_b: string;
  pathElements: string[];
  pathIndex: number[];
}

function padHex64(hex: string): string {
  return hex.padStart(64, "0");
}

export const generateTokenSplitProof = async (
  connection: Connection,
  shieldedPoolAddress: PublicKey,
  tokenNote: ShieldedNote,
  amountA: number,
  amountB: number,
  marketAddress: PublicKey,
) => {
  console.log("Generating Token Split Proof...");

  const poolAddressStr = shieldedPoolAddress.toBase58();

  // 1. Compute commitment from secrets (stored values may be wrong per MEMORY.md)
  const tokenType = tokenNote.type === "YES" ? "1" : "2";
  const computedCommitment = hash4([
    BigInt(tokenNote.amount),
    BigInt("0x" + tokenNote.nullifier),
    BigInt(tokenType),
    BigInt("0x" + Buffer.from(marketAddress.toBuffer()).toString("hex")),
  ]);
  const myCommitment = padHex64(computedCommitment.toString(16));

  console.log("=== COMMITMENT VERIFICATION ===");
  console.log("Computed Commitment:", myCommitment);
  console.log("Stored Commitment:", padHex64(tokenNote.commitment));
  console.log("Match:", myCommitment === padHex64(tokenNote.commitment) ? "YES" : "NO (using computed)");

  // 2. Try database lookup for commitment position
  let commitmentPosition = await getCommitmentPosition(poolAddressStr, myCommitment);
  if (!commitmentPosition && myCommitment !== padHex64(tokenNote.commitment)) {
    commitmentPosition = await getCommitmentPosition(poolAddressStr, tokenNote.commitment);
  }

  // 3. Reconstruct on-chain MMR tree
  const tree = await reconstructMerkleTree(connection, shieldedPoolAddress);
  console.log(`Pool state: batch ${tree.batchNumber}, ${tree.peaks.length} peaks`);

  // 4. Get proof path
  let pathElements: string[];
  let pathIndices: number[];

  if (commitmentPosition) {
    console.log(`Found commitment in database: batch ${commitmentPosition.batchNumber}, leaf ${commitmentPosition.leafIndex}`);

    if (commitmentPosition.batchNumber === tree.batchNumber) {
      // Note is in CURRENT batch
      const proof = tree.getProof(commitmentPosition.leafIndex);
      pathElements = proof.pathElements;
      pathIndices = proof.pathIndices;
    } else {
      // Note is in a PAST batch - use on-chain peaks
      console.log(`Note is in PAST batch ${commitmentPosition.batchNumber}, using on-chain peaks...`);

      const snapshots = await zkApi.getBatchSnapshots(poolAddressStr);
      const storedBatchRoots: BN[] = [];
      let pastBatchLeaves: BN[] | null = null;

      for (let b = 0; b < tree.batchNumber; b++) {
        const snapshot = snapshots.find(s => s.batchNumber === b);
        if (snapshot) {
          const rootBN = new BN(snapshot.batchRoot, "hex");
          if (rootBN.isZero() && snapshot.leaves.some(l => l !== "0".repeat(64))) {
            const leaves = snapshot.leaves.map(l => new BN(l, "hex"));
            const computed = computeBatchRootFromLeaves(leaves);
            console.log(`Batch ${b}: computed root from leaves (stored was zero): ${computed.toString("hex").slice(0, 16)}...`);
            storedBatchRoots.push(computed);
          } else {
            storedBatchRoots.push(rootBN);
          }
          if (b === commitmentPosition.batchNumber) {
            pastBatchLeaves = snapshot.leaves.map(l => new BN(l, "hex"));
          }
        } else {
          console.warn(`Missing snapshot for batch ${b}`);
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
    }
  } else {
    // Commitment NOT in database - search on-chain current batch (fallback)
    console.warn("Commitment not in database, searching on-chain current batch...");

    let leafIndex = tree.batchLeaves.findIndex((l) => padHex64(l.toString("hex")) === myCommitment);

    // Retry with delays for RPC propagation
    if (leafIndex === -1) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        await new Promise((r) => setTimeout(r, 2000));
        const retryTree = await reconstructMerkleTree(connection, shieldedPoolAddress);
        leafIndex = retryTree.batchLeaves.findIndex((l) => padHex64(l.toString("hex")) === myCommitment);
        if (leafIndex !== -1) {
          console.log(`Found note on retry attempt ${attempt}`);
          break;
        }
      }
    }

    if (leafIndex === -1) {
      throw new Error("Note commitment not found in on-chain Merkle Tree");
    }

    console.log("Found note at leaf index:", leafIndex);

    // Index it for future use
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

    const proof = tree.getProof(leafIndex);
    pathElements = proof.pathElements;
    pathIndices = proof.pathIndices;
  }

  // 5. Generate fresh nullifiers for the two new notes
  const nullifierABytes = new Uint8Array(31);
  const nullifierBBytes = new Uint8Array(31);
  crypto.getRandomValues(nullifierABytes);
  crypto.getRandomValues(nullifierBBytes);
  const newNullifierA = new BN(nullifierABytes);
  const newNullifierB = new BN(nullifierBBytes);

  // 6. Build circuit inputs
  const input: TokenSplitInput = {
    old_amount_in: new BN(tokenNote.amount).toString(),
    old_nullifier_in: new BN(tokenNote.nullifier, 16).toString(),
    token_type_in: tokenType,
    market_id: new BN(marketAddress.toBuffer()).toString(),
    amount_a_in: new BN(amountA).toString(),
    amount_b_in: new BN(amountB).toString(),
    new_nullifier_a: newNullifierA.toString(),
    new_nullifier_b: newNullifierB.toString(),
    pathElements: pathElements,
    pathIndex: pathIndices,
  };

  console.log("Generating Token Split Proof with input:", input);

  // 7. Generate Proof via SnarkJS
  const wasmPath = "/zk/token_split.wasm";
  const zkeyPath = "/zk/token_split.zkey";

  const snarkjs = (window as unknown as { snarkjs: { groth16: { fullProve: (input: TokenSplitInput, wasm: string, zkey: string) => Promise<{ proof: SnarkJSProof; publicSignals: string[] }> } } }).snarkjs;
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);

  // 8. Extract commitments from public signals
  // Circuit output order: old_nullifier, new_commitment_a, new_commitment_b, root, token_type, old_amount, amount_a, amount_b
  const commitmentAHex = BigInt(publicSignals[1]).toString(16).padStart(64, "0");
  const commitmentBHex = BigInt(publicSignals[2]).toString(16).padStart(64, "0");

  return {
    proof: formatProofForSnark(proof),
    publicInputs: convertTokenSplitPublicInputs(publicSignals),
    nullifierA: newNullifierA.toString("hex").padStart(64, "0"),
    nullifierB: newNullifierB.toString("hex").padStart(64, "0"),
    commitmentA: commitmentAHex,
    commitmentB: commitmentBHex,
    amountA,
    amountB,
  };
};

// Layout:
// old_nullifier: [u8; 32]
// new_commitment_a: [u8; 32]
// new_commitment_b: [u8; 32]
// root: [u8; 32]
// token_type: [u8; 1]
// old_amount: [u8; 8]
// amount_a: [u8; 8]
// amount_b: [u8; 8]
// Total: 153 bytes
function convertTokenSplitPublicInputs(publicSignals: string[]) {
  const old_nullifier = to32Bytes(publicSignals[0]);
  const new_commitment_a = to32Bytes(publicSignals[1]);
  const new_commitment_b = to32Bytes(publicSignals[2]);
  const root = to32Bytes(publicSignals[3]);
  const token_type = parseInt(publicSignals[4]);
  const old_amount = new BN(publicSignals[5]).toArrayLike(Buffer, "be", 8);
  const amount_a = new BN(publicSignals[6]).toArrayLike(Buffer, "be", 8);
  const amount_b = new BN(publicSignals[7]).toArrayLike(Buffer, "be", 8);

  const buffer = Buffer.concat([
    Buffer.from(old_nullifier),
    Buffer.from(new_commitment_a),
    Buffer.from(new_commitment_b),
    Buffer.from(root),
    Buffer.from([token_type]),
    old_amount,
    amount_a,
    amount_b,
  ]);

  return Array.from(buffer);
}

function to32Bytes(n: string): number[] {
  let hex = BigInt(n).toString(16);
  while (hex.length < 64) hex = "0" + hex;
  const bytes = [];
  for (let i = 0; i < 64; i += 2) bytes.push(parseInt(hex.slice(i, i + 2), 16));
  return bytes;
}
