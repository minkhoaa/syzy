import { BN } from "@coral-xyz/anchor";

/**
 * Formats SnarkJS proof (BigInts) into the 256-byte array expected by the Rust contract.
 * Rust Groth16Verifier expects:
 * - Proof A (64 bytes): [x, y] (G1 Point) - Compressed/Serialized in specific way?
 *   Actually the contract `zk_verify.rs` splits it:
 *   proof[0..64] -> proof_a
 *   proof[64..192] -> proof_b (G2 Point is 128 bytes)
 *   proof[192..256] -> proof_c (G1 Point is 64 bytes)
 *
 * Each coordinate is 32 bytes (256 bits).
 * G1: (x, y) -> 32 + 32 = 64 bytes.
 * G2: (x, y) where x,y are complex (c0, c1). 4 coordinates total?
 *     G2 point on BN254 is 2 coordinates, but each is in Fp2.
 *     So x = (x0, x1), y = (y0, y1).
 *     Total 4 * 32 = 128 bytes.
 *
 * NOTE: SnarkJS output format:
 * pi_a: [x, y, 1]
 * pi_b: [[x0, x1], [y0, y1], [1, 0]]
 * pi_c: [x, y, 1]
 */
export interface SnarkJSProof {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
}

export function formatProofForSnark(proof: SnarkJSProof): number[] {
  const flatProof: number[] = [];

  // BN254 Base Field Modulus (for G1 point negation)
  const BASE_FIELD_MODULUS = new BN("21888242871839275222246405745257275088696311157297823662689037894645226208583");

  // =====================================================================
  // pi_a (G1) - 64 bytes
  // =====================================================================
  // Standard Groth16: Negated A
  // Endianness: Big Endian (Matching Solana Syscalls)
  const pA_x = new BN(proof.pi_a[0]);
  const pA_y = new BN(proof.pi_a[1]);
  const pA_y_neg = BASE_FIELD_MODULUS.sub(pA_y);

  flatProof.push(...toArray(pA_x, 32)); // BE
  flatProof.push(...toArray(pA_y_neg, 32)); // BE (Negated)

  // =====================================================================
  // pi_b (G2) - 128 bytes
  // =====================================================================
  // G2 Elements: x = c0 + c1*i
  // Order: [x, y]
  // Byte Order: Big Endian
  // Coordinate Order: [c1, c0] (Imaginary first - Standard for Ethereum/Solana)

  const pB_x0 = new BN(proof.pi_b[0][0]); // x.c0
  const pB_x1 = new BN(proof.pi_b[0][1]); // x.c1
  const pB_y0 = new BN(proof.pi_b[1][0]); // y.c0
  const pB_y1 = new BN(proof.pi_b[1][1]); // y.c1

  // x encoded as [x.c1, x.c0]
  flatProof.push(...toArray(pB_x1, 32)); // BE
  flatProof.push(...toArray(pB_x0, 32)); // BE

  // y encoded as [y.c1, y.c0]
  flatProof.push(...toArray(pB_y1, 32)); // BE
  flatProof.push(...toArray(pB_y0, 32)); // BE

  // =====================================================================
  // pi_c (G1) - 64 bytes
  // =====================================================================
  // Standard G1
  // Endianness: Big Endian
  const pC_x = new BN(proof.pi_c[0]);
  const pC_y = new BN(proof.pi_c[1]);
  flatProof.push(...toArray(pC_x, 32)); // BE
  flatProof.push(...toArray(pC_y, 32)); // BE

  return flatProof;
}

function toArray(bn: BN, size: number): number[] {
  // toBuffer('be', size) returns Big Endian buffer
  return Array.from(bn.toArray("be", size));
}
