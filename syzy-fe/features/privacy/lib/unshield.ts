import { PublicKey, Connection } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { reconstructMerkleTree } from "./merkle-utils";
import { ShieldedNote } from "@/features/privacy/hooks/use-zk";
import { Buffer } from "buffer";
import { hash3 } from "./poseidon";
import { formatProofForSnark, SnarkJSProof } from "./proof-utils";

interface UnshieldInput {
  amount: string;
  noteNullifier: string;
  blinding: string;
  recipientPk: string;
  pathElements: string[];
  pathIndex: number[];
}

export const generateUnshieldProof = async (
  connection: Connection,
  shieldedPoolAddress: PublicKey,
  note: ShieldedNote,
  recipientPubkey: PublicKey,
) => {
  console.log("Reconstructing Merkle Tree for Unshield...");

  const padHex = (h: string) => h.padStart(64, "0");

  // Compute the correct commitment from secrets rather than trusting stored value
  // SOL commitment = Poseidon3(amount, nullifier, blinding)
  const amountBN = BigInt(note.amount);
  const nullifierBN = BigInt("0x" + note.nullifier);
  const blindingBN = BigInt("0x" + note.blinding);

  const computedCommitment = hash3([amountBN, nullifierBN, blindingBN]);
  const computedCommitmentHex = computedCommitment.toString(16).padStart(64, "0");

  console.log("=== UNSHIELD COMMITMENT VERIFICATION ===");
  console.log("Amount (lamports):", note.amount);
  console.log("Computed Commitment:", computedCommitmentHex);
  console.log("Stored Commitment:", padHex(note.commitment));
  if (computedCommitmentHex !== padHex(note.commitment)) {
    console.warn("Stored commitment does not match computed commitment! Using computed value.");
  }

  // Search the tree using the COMPUTED commitment (not stored, which may be wrong)
  let tree = await reconstructMerkleTree(connection, shieldedPoolAddress);
  let leafIndex = tree.batchLeaves.findIndex(
    (l) => padHex(l.toString("hex")) === computedCommitmentHex,
  );

  if (leafIndex === -1) {
    console.log("Note not found in current batch, retrying with delay...");
    for (let attempt = 1; attempt <= 5; attempt++) {
      await new Promise((r) => setTimeout(r, 2000));
      tree = await reconstructMerkleTree(connection, shieldedPoolAddress);
      leafIndex = tree.batchLeaves.findIndex(
        (l) => padHex(l.toString("hex")) === computedCommitmentHex,
      );
      if (leafIndex !== -1) {
        console.log(`Found note on retry attempt ${attempt}`);
        break;
      }
      console.log(`Retry ${attempt}/5: note still not found in batch...`);
    }
  }

  if (leafIndex === -1) {
    throw new Error("SOL note commitment not found in on-chain Merkle Tree");
  }

  // Get Merkle path
  const { pathElements, pathIndices } = tree.getProof(leafIndex);

  // Convert recipient pubkey to decimal string for circuit
  const recipientHex = Buffer.from(recipientPubkey.toBuffer()).toString("hex");
  const recipientDecimal = BigInt("0x" + recipientHex).toString();

  const input: UnshieldInput = {
    amount: new BN(note.amount).toString(),
    noteNullifier: new BN(note.nullifier, 16).toString(),
    blinding: new BN(note.blinding, 16).toString(),
    recipientPk: recipientDecimal,
    pathElements: pathElements,
    pathIndex: pathIndices,
  };

  console.log("Generating Unshield Proof with input:", {
    ...input,
    noteNullifier: input.noteNullifier.slice(0, 16) + "...",
    blinding: input.blinding.slice(0, 16) + "...",
  });

  // Generate proof via SnarkJS
  const wasmPath = "/zk/unshield.wasm";
  const zkeyPath = "/zk/unshield.zkey";

  const snarkjs = (window as unknown as { snarkjs: { groth16: { fullProve: (input: UnshieldInput, wasm: string, zkey: string) => Promise<{ proof: SnarkJSProof; publicSignals: string[] }> } } }).snarkjs;
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);

  console.log("Unshield Proof Generated!");
  console.log("Public Signals:", publicSignals);

  // publicSignals order from circuit: [amount32, nullifier, root, recipient]
  return {
    proof: formatProofForSnark(proof),
    publicInputs: convertUnshieldPublicInputs(publicSignals),
  };
};

// Byte layout: amount(8 BE) || nullifier(32) || root(32) || recipient(32) = 104 bytes
function convertUnshieldPublicInputs(publicSignals: string[]): number[] {
  const amount = new BN(publicSignals[0]).toArrayLike(Buffer, "be", 8);
  const nullifier = to32Bytes(publicSignals[1]);
  const root = to32Bytes(publicSignals[2]);
  const recipient = to32Bytes(publicSignals[3]);

  const buffer = Buffer.concat([
    amount,
    Buffer.from(nullifier),
    Buffer.from(root),
    Buffer.from(recipient),
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
