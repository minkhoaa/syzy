// Imports
// import * as snarkjs from "snarkjs"; // Removed to avoid bundling crash
import { BN } from "@coral-xyz/anchor";
import { formatProofForSnark, SnarkJSProof } from "./proof-utils";

/**
 * Generates a ZK Proof for Shielding (Depositing) funds.
 * Circuit: shield.circom
 * Inputs: amount, nullifier, blinding
 */
export async function createShieldProof(
  amount: number, // SOL amount (e.g. 1.5)
  nullifier: BN,
  blinding: BN,
): Promise<{ proof: number[]; publicInputs: number[] }> {
  // 1. Convert amount to lamports (use Math.round to avoid float precision issues)
  const amountLamports = new BN(Math.round(amount * 1_000_000_000));

  // 2. Prepare Inputs
  const input = {
    amount: amountLamports.toString(),
    nullifier: nullifier.toString(),
    blinding: blinding.toString(),
  };

  console.log("Generating Shield Proof with inputs:", input);

  // 3. Generate Proof
  // Path to WASM and ZKEY (must be in public/zk/)
  const wasmPath = "/zk/shield.wasm";
  const zkeyPath = "/zk/shield.zkey";

  /*
   * Use window.snarkjs (loaded via Script tag) to avoid Turbopack bundling crash.
   */
  const snarkjs = (window as unknown as { snarkjs: { groth16: { fullProve: (input: Record<string, string>, wasm: string, zkey: string) => Promise<{ proof: SnarkJSProof; publicSignals: string[] }> } } }).snarkjs;
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);

  console.log("Proof generated:", proof);
  console.log("Public Signals:", publicSignals);

  // 4. Format for Contract
  // Contract expects: proof (256 bytes), public_inputs (amount + leaf)
  // publicSignals order from circuit: [amount32, leaf]

  const formattedProof = formatProofForSnark(proof);

  // Format Public Inputs:
  // publicSignals are strings of BigInts.
  // Rust expects:
  // - amount (32 bytes? No, verify_single_deposit_proof takes [u8] and splits it).
  // verify_single_deposit_proof:
  //   Input len 72?
  //   sum_be8: 8 bytes.
  //   leaf: 32 bytes.
  //   Total 40 bytes?
  //   Wait, `verify_single_deposit_proof` says `if public_inputs.len() != 72`.
  //   It parses:
  //     amount (8 bytes) -> `public_inputs[0..8]`
  //     leaf (32 bytes) -> `public_inputs[8..40]`
  //     Total 40 bytes consumed.
  //     Where are the other 32 bytes?
  //     Ah, `inputs_arr` in `verify_single_deposit_proof`: `&[secret_be, leaf1]`.
  //     Wait, verify code:
  //     `let sum_be8: [u8; 8] = public_inputs[0..8]...`
  //     `let leaf1: [u8; 32] = public_inputs[8..40]...`
  //     That's 40 bytes.
  //     Why check length 72?
  //     Maybe padding? Or maybe I misread the Rust code.
  //     Let's re-read `zk_verify.rs`.

  // RE-READING `zk_verify.rs` (from memory/previous view):
  // "if public_inputs.len() != 72"
  // "inputs[0..8]" -> amount
  // "inputs[8..40]" -> leaf
  // That's 40 bytes.
  // What about 40..72?
  // Unused? Or maybe previously it took 2 leaves?
  //
  // Wait, `verify_deposit_proof` (double) takes leaf1, leaf2.
  // 0..8 amount
  // 8..40 leaf1
  // 40..72 leaf2
  // Total 72.
  //
  // `verify_single_deposit_proof` check:
  // `if public_inputs.len() != 72`.
  // It checks for 72 bytes!
  // But likely ignores the last 32 bytes?
  // "let inputs_arr: &[[u8; 32]; 2] = &[secret_be, leaf1];"
  // It only passes 2 inputs to the verifier.
  //
  // So I should send 72 bytes, padding the last 32 with zeros.

  const amountBN = new BN(publicSignals[0]);
  const leafBN = new BN(publicSignals[1]);

  const publicInputsBytes: number[] = [];

  // Amount: 8 bytes (Big Endian)
  // publicSignals[0] is the field element.
  publicInputsBytes.push(...toArray(amountBN, 8)); // 8 bytes

  // Leaf: 32 bytes
  publicInputsBytes.push(...toArray(leafBN, 32)); // 32 bytes

  // Padding: 32 bytes to reach 72 total. The contract's `private_shield`
  // instruction signature declares `public_inputs: [u8; 72]` (fixed at compile
  // time — cannot be changed without a program upgrade). Only the first 40
  // bytes (amount + leaf) are used for proof verification; bytes 40..72 are
  // ignored but must be present to satisfy the length check.
  publicInputsBytes.push(...new Array(32).fill(0));

  return {
    proof: formattedProof,
    publicInputs: publicInputsBytes,
  };
}

function toArray(bn: BN, size: number): number[] {
  return Array.from(bn.toArray("be", size));
}
