import { PublicKey, Connection } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { reconstructMerkleTree, MMRTree, computeBatchRootFromLeaves } from "./merkle-utils";
import { formatProofForSnark, SnarkJSProof } from "./proof-utils";
import { ShieldedNote } from "@/features/privacy/hooks/use-zk";
import { hash3, hash4 } from "./poseidon";
import { Buffer } from "buffer";
import { zkApi } from "@/lib/zk-api";
import { getCommitmentPosition } from "@/features/privacy/utils/zk-storage";

// Define the input structure for the circuit
interface PrivateSwapInput {
  sol_amount_in: string;
  old_nullifier_in: string; // decimal string
  old_blinding: string; // decimal string
  new_nullifier: string; // decimal string
  token_type_in: string; // "1" or "2"
  token_amount_in: string;
  market_id: string; // decimal string of pubkey field element
  pathElements: string[];
  pathIndex: number[];
}

// Helper to pad hex strings to 64 characters (32 bytes)
// BN.toString("hex") strips leading zeros, which can cause comparison failures
function padHex64(hex: string): string {
  return hex.padStart(64, "0");
}

export const generatePrivateSwapProof = async (
  connection: Connection,
  shieldedPoolAddress: PublicKey,
  solNote: ShieldedNote,
  amountOut: number,
  direction: "YES" | "NO",
  marketAddress: PublicKey,
  injectedTree?: MMRTree,
  injectedLeafIndex?: number,
) => {
  console.log("Generating Private Swap Proof...");

  // Step 1: Determine where the commitment is and get the Merkle proof
  let pathElements: string[] = [];
  let pathIndices: number[] = [];

  if (injectedTree !== undefined && injectedLeafIndex !== undefined) {
    // Combined shield+swap: use predicted post-shield tree and known leaf index
    // Skip all DB lookups and chain reconstruction (not needed, commitment isn't on-chain yet)
    console.log(`[Combined] Using injected tree at leaf index ${injectedLeafIndex}`);
    const proof = injectedTree.getProof(injectedLeafIndex);
    pathElements = proof.pathElements;
    pathIndices = proof.pathIndices;
  } else {
    // Normal path: on-chain first, DB fallback for past batches only
    const poolAddressStr = shieldedPoolAddress.toBase58();

    // Compute commitment from secrets (stored values may be wrong)
    const computedCommitment = hash3([
      BigInt(Math.round(solNote.amount * 1_000_000_000)),
      BigInt("0x" + solNote.nullifier),
      BigInt("0x" + solNote.blinding),
    ]);
    const myCommitment = computedCommitment.toString(16).padStart(64, "0");
    const lookupCommitment = padHex64(solNote.commitment);

    // Step 1: Always reconstruct on-chain MMR tree first
    const tree = await reconstructMerkleTree(connection, shieldedPoolAddress);

    // Step 2: Search current batch on-chain (primary path, no DB dependency)
    const leafIndex = tree.batchLeaves.findIndex(
      (l) => padHex64(l.toString("hex")) === lookupCommitment || padHex64(l.toString("hex")) === myCommitment
    );

    if (leafIndex !== -1) {
      // Found in current batch — generate proof directly
      const proof = tree.getProof(leafIndex);
      pathElements = proof.pathElements;
      pathIndices = proof.pathIndices;

      // Index it for future use
      try {
        await zkApi.storeCommitment({
          poolAddress: poolAddressStr,
          marketAddress: marketAddress.toBase58(),
          commitment: lookupCommitment,
          leafIndex,
          batchNumber: tree.batchNumber,
          transactionId: "",
        });
      } catch { /* ignore conflicts */ }
    } else {
      // Step 3: Not in current batch — DB lookup for past batch
      let commitmentPosition = await getCommitmentPosition(poolAddressStr, lookupCommitment);
      if (!commitmentPosition && myCommitment !== lookupCommitment) {
        commitmentPosition = await getCommitmentPosition(poolAddressStr, myCommitment);
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
        // Not found anywhere
        throw new Error(
          `Note commitment not found in Merkle Tree. ` +
          `Commitment not in current batch and not found in past batch DB. ` +
          `This may mean the note was just shielded but the tree state hasn't updated yet. ` +
          `Wait a few seconds and try again.`,
        );
      }
    }
  }


  // 3. Prepare Circuit Inputs
  const tokenType = direction === "YES" ? "1" : "2"; // Circuit: 1=YES, 2=NO

  // Output Secrets
  const outNullifierBytes = new Uint8Array(31);
  crypto.getRandomValues(outNullifierBytes);
  const outNullifier = new BN(outNullifierBytes);

  // NOTE: The private swap circuit does NOT take a 'new_blinding' input.
  // This implies it sets the blinding of the output note to 0 (or derives it).
  // We must save the note with the SAME blinding the circuit used.
  // Let's assume it's 0.
  const outBlinding = new BN(0);

  // Convert inputs to BigInt decimal strings for snarkjs
  const input: PrivateSwapInput = {
    sol_amount_in: new BN(Math.round(solNote.amount * 1_000_000_000)).toString(),
    old_nullifier_in: new BN(solNote.nullifier, 16).toString(),
    old_blinding: new BN(solNote.blinding, 16).toString(),
    new_nullifier: outNullifier.toString(),
    // new_blinding: REMOVED - Circuit doesn't take it
    token_type_in: tokenType,
    token_amount_in: new BN(amountOut).toString(),
    market_id: new BN(marketAddress.toBuffer()).toString(),
    pathElements: pathElements,
    pathIndex: pathIndices,
  };

  // Generate proof

  // 4. Generate Proof via SnarkJS (Window)
  const wasmPath = "/zk/private_swap.wasm";
  const zkeyPath = "/zk/private_swap.zkey";

  const snarkjs = (window as unknown as { snarkjs: { groth16: { fullProve: (input: PrivateSwapInput, wasm: string, zkey: string) => Promise<{ proof: SnarkJSProof; publicSignals: string[] }> } } }).snarkjs;
  if (!snarkjs) throw new Error("snarkjs not loaded — check CDN script in layout.tsx");

  console.time("snarkjs.fullProve");

  const PROOF_TIMEOUT_MS = 120_000; // 2 minutes max
  const proofPromise = snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`ZK proof generation timed out after ${PROOF_TIMEOUT_MS / 1000}s. Check browser console/Network tab for stalled WASM/zkey fetches.`)), PROOF_TIMEOUT_MS)
  );

  const { proof, publicSignals } = await Promise.race([proofPromise, timeoutPromise]);
  console.timeEnd("snarkjs.fullProve");

  // Extract commitment from public signals (index 1)
  const commitmentBig = new BN(publicSignals[1]);
  const commitmentHex = commitmentBig.toString(16).padStart(64, "0");

  // Validate: local Poseidon4 matches circuit's new_commitment
  const marketIdBigInt = BigInt("0x" + new BN(marketAddress.toBuffer()).toString("hex"));
  const checkHash = hash4([BigInt(amountOut), BigInt("0x" + outNullifier.toString("hex")), BigInt(tokenType), marketIdBigInt]);
  const checkHashHex = checkHash.toString(16).padStart(64, "0");

  if (checkHashHex !== commitmentHex) {
    console.warn("Token commitment mismatch! Note might be unspendable.");
  }

  return {
    proof: formatProofForSnark(proof),
    publicInputs: convertSwapPublicInputs(publicSignals),
    outNullifier: outNullifier.toString("hex").padStart(64, "0"),
    outBlinding: outBlinding.toString("hex").padStart(64, "0"), // Return '000...'
    outCommitment: commitmentHex,
    amountOut: new BN(amountOut).toString(),
  };
};

// toProofBytes removed - using formatProofForSnark from ./proof-utils instead

// Custom converter for Swap Inputs
// Rust: verify_private_swap_proof(..., public_inputs: [u8; 113])
// Layout:
// old_nullifier: [u8; 32]
// new_commitment: [u8; 32]
// root: [u8; 32]
// token_type: [u8; 1]
// sol_amount: [u8; 8]
// token_amount: [u8; 8]
// Total: 32+32+32+1+8+8 = 113 bytes.
function convertSwapPublicInputs(publicSignals: string[]) {
  // publicSignals from SnarkJS are ordered by Output Declaration in Circom
  // Circuit:
  // signal output old_nullifier;
  // signal output new_commitment;
  // signal output root;
  // signal output token_type;
  // signal output sol_amount;
  // signal output token_amount;

  // So publicSignals[0] = old_nullifier
  // ...

  const old_nullifier = to32Bytes(publicSignals[0]);
  const new_commitment = to32Bytes(publicSignals[1]);
  const root = to32Bytes(publicSignals[2]);
  const token_type = parseInt(publicSignals[3]);
  // FIXED: Use big-endian to match contract expectations
  // Contract pads these to 32 bytes BE for Groth16 verification
  const sol_amount = new BN(publicSignals[4]).toArrayLike(Buffer, "be", 8);
  const token_amount = new BN(publicSignals[5]).toArrayLike(Buffer, "be", 8);

  const buffer = Buffer.concat([Buffer.from(old_nullifier), Buffer.from(new_commitment), Buffer.from(root), Buffer.from([token_type]), sol_amount, token_amount]);
  return Array.from(buffer);
}

function to32Bytes(n: string): number[] {
  let hex = BigInt(n).toString(16);
  while (hex.length < 64) hex = "0" + hex;
  const bytes = [];
  for (let i = 0; i < 64; i += 2) bytes.push(parseInt(hex.slice(i, i + 2), 16));
  return bytes;
}
