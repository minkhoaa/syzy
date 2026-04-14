import { Connection, PublicKey, ParsedTransactionWithMeta } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { hash2 } from "./poseidon";
import { Buffer } from "buffer";
import { zkApi } from "@/lib/zk-api";

// --- CONSTANTS ---
const LEAVES_COUNT = 16;
const BATCH_HEIGHT = 4; // 2^4 = 16
const TARGET_DEPTH_LARGE = 30; // Contract Depth

// Pre-computed default roots for each depth (zeros)
const DEFAULT_ROOTS: BN[] = [];

function computeDefaultRoots() {
  if (DEFAULT_ROOTS.length > 0) return;
  let current = new BN(0);
  DEFAULT_ROOTS.push(current);
  for (let i = 1; i <= TARGET_DEPTH_LARGE; i++) {
    const hashBigInt = hash2([BigInt(current.toString()), BigInt(current.toString())]);
    current = new BN(hashBigInt.toString());
    DEFAULT_ROOTS.push(current);
  }
}

function getDefaultRoot(depth: number): BN {
  computeDefaultRoots();
  return DEFAULT_ROOTS[depth] || new BN(0);
}

/**
 * Compute the depth-4 Merkle root from 16 leaves using Poseidon hashing.
 * Standalone version of MMRTree.getBatchRoot() for use outside the class.
 * Used to recover batch roots when stored snapshots have zero roots.
 */
export function computeBatchRootFromLeaves(leaves: BN[]): BN {
  let level = [...leaves];
  while (level.length < LEAVES_COUNT) level.push(new BN(0));
  for (let h = 0; h < BATCH_HEIGHT; h++) {
    const nextLevel: BN[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const hash = hash2([BigInt(level[i].toString()), BigInt(level[i + 1].toString())]);
      nextLevel.push(new BN(hash.toString()));
    }
    level = nextLevel;
  }
  return level[0];
}

// --- MMR Tree (State Based) ---
// Used when note is in the current batch (fast)
export class MMRTree {
  batchLeaves: BN[];
  peaks: BN[];
  peakDepths: number[];
  batchNumber: number;
  onChainBatchRoot: BN; // On-chain batch root (Rust poseidon) - use this instead of recomputing!

  constructor(batchLeaves: BN[], peaks: BN[], peakDepths: number[], batchNumber: number, onChainBatchRoot?: BN) {
    this.batchLeaves = batchLeaves;
    // Pad to full batch size if needed
    while (this.batchLeaves.length < LEAVES_COUNT) {
      this.batchLeaves.push(new BN(0));
    }
    this.peaks = peaks;
    this.peakDepths = peakDepths;
    this.batchNumber = batchNumber;
    // Store on-chain batch root to avoid JS/Rust poseidon mismatch
    this.onChainBatchRoot = onChainBatchRoot || new BN(0);
    computeDefaultRoots();
  }

  // Calculate the root of the current batch (Validation)
  getBatchRoot(): BN {
    let level = [...this.batchLeaves];
    for (let h = 0; h < BATCH_HEIGHT; h++) {
      const nextLevel: BN[] = [];
      for (let i = 0; i < level.length; i += 2) {
        const l = level[i];
        const r = level[i + 1];
        const hash = hash2([BigInt(l.toString()), BigInt(r.toString())]);
        nextLevel.push(new BN(hash.toString()));
      }
      level = nextLevel;
    }
    return level[0];
  }

  // Get proof for a leaf in a PAST (finalized) batch.
  // Uses on-chain peaks directly instead of replaying all batch merges (FullMMR approach).
  // This is more robust because it doesn't depend on stored batch roots matching on-chain peaks.
  getProofForPastBatch(
    pastBatchLeaves: BN[],
    localLeafIndex: number,
    pastBatchNumber: number,
    storedBatchRoots: BN[], // batch roots for all finalized batches (0..batchNumber-1)
  ): { root: BN; pathElements: string[]; pathIndices: number[] } {
    const pathElements: BN[] = [];
    const pathIndices: number[] = [];

    // --- Step 1: Intra-batch path (4 levels) ---
    let currentLevel = [...pastBatchLeaves];
    while (currentLevel.length < LEAVES_COUNT) currentLevel.push(new BN(0));
    let idx = localLeafIndex;

    for (let h = 0; h < BATCH_HEIGHT; h++) {
      const isRight = idx % 2 === 1;
      const siblingIdx = isRight ? idx - 1 : idx + 1;
      pathElements.push(currentLevel[siblingIdx]);
      pathIndices.push(isRight ? 1 : 0);

      const nextLevel: BN[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const hashVal = hash2([BigInt(currentLevel[i].toString()), BigInt(currentLevel[i + 1].toString())]);
        nextLevel.push(new BN(hashVal.toString()));
      }
      currentLevel = nextLevel;
      idx = Math.floor(idx / 2);
    }

    const computedBatchRoot = currentLevel[0];

    // --- Step 2: Determine which on-chain peak contains our batch ---
    let groupStart = 0;
    let ourPeakIndex = -1;
    let ourGroupSize = 0;
    let ourBatchInGroup = 0;

    for (let peakIdx = 0; peakIdx < this.peaks.length; peakIdx++) {
      const depth = this.peakDepths[peakIdx];
      const groupSize = 1 << (depth - BATCH_HEIGHT); // 2^(depth - 4)
      if (pastBatchNumber >= groupStart && pastBatchNumber < groupStart + groupSize) {
        ourPeakIndex = peakIdx;
        ourGroupSize = groupSize;
        ourBatchInGroup = pastBatchNumber - groupStart;
        break;
      }
      groupStart += groupSize;
    }

    if (ourPeakIndex === -1) {
      throw new Error(
        `Batch ${pastBatchNumber} not found in any peak group ` +
        `(${this.peaks.length} peaks, batchNumber=${this.batchNumber})`
      );
    }

    // --- Step 3: Intra-peak path (batch root → on-chain peak) ---
    if (ourGroupSize > 1) {
      // Collect batch roots for all batches in this peak's group
      const groupBatchRoots: BN[] = [];
      for (let i = 0; i < ourGroupSize; i++) {
        const globalIdx = groupStart + i;
        if (globalIdx === pastBatchNumber) {
          groupBatchRoots.push(computedBatchRoot); // Use freshly computed value
        } else if (globalIdx < storedBatchRoots.length && !storedBatchRoots[globalIdx].isZero()) {
          groupBatchRoots.push(storedBatchRoots[globalIdx]);
        } else {
          throw new Error(
            `Missing batch root for batch ${globalIdx}. Cannot generate past-batch proof. ` +
            `Ensure batch snapshots are stored for all finalized batches.`
          );
        }
      }

      // Standard binary Merkle tree proof within the group
      let level = [...groupBatchRoots];
      let levelIdx = ourBatchInGroup;

      while (level.length > 1) {
        const isRight = levelIdx % 2 === 1;
        const siblingIdx = isRight ? levelIdx - 1 : levelIdx + 1;
        pathElements.push(level[siblingIdx]);
        pathIndices.push(isRight ? 1 : 0);

        const nextLevel: BN[] = [];
        for (let i = 0; i < level.length; i += 2) {
          const l = level[i];
          const r = level[i + 1];
          nextLevel.push(new BN(hash2([BigInt(l.toString()), BigInt(r.toString())]).toString()));
        }
        level = nextLevel;
        levelIdx = Math.floor(levelIdx / 2);
      }

      // Verify computed peak matches on-chain peak
      const computedPeak = level[0];
      if (!computedPeak.eq(this.peaks[ourPeakIndex])) {
        throw new Error(
          `Peak mismatch in past-batch proof: computed peak ≠ on-chain peak. ` +
          `Computed: ${computedPeak.toString("hex").padStart(64, "0").slice(0, 16)}..., ` +
          `On-chain: ${this.peaks[ourPeakIndex].toString("hex").padStart(64, "0").slice(0, 16)}... ` +
          `A sibling batch root may be incorrect.`
        );
      }
    }

    // --- Step 4: update_peaks_temp simulation ---
    // Same as getProof() Step 2, but "us" starts at ourPeakIndex (an existing peak)
    const tempPeaks = [...this.peaks];
    const tempDepths = [...this.peakDepths];

    // Add current batch root as new peak (same as contract's update_peaks_temp)
    // Use the on-chain batch root to match what the contract uses
    const currentBatchRoot = this.onChainBatchRoot.isZero()
      ? this.getBatchRoot()
      : this.onChainBatchRoot;
    tempPeaks.push(currentBatchRoot);
    tempDepths.push(BATCH_HEIGHT);

    let activePeakIndex = ourPeakIndex;

    // Merge equal-depth peaks from the right
    while (tempPeaks.length >= 2 && tempDepths[tempPeaks.length - 1] === tempDepths[tempPeaks.length - 2]) {
      const rightIdx = tempPeaks.length - 1;
      const leftIdx = tempPeaks.length - 2;
      const left = tempPeaks[leftIdx];
      const right = tempPeaks[rightIdx];

      const mergedHash = new BN(hash2([BigInt(left.toString()), BigInt(right.toString())]).toString());
      const mergedDepth = tempDepths[rightIdx] + 1;

      if (activePeakIndex === rightIdx) {
        pathElements.push(left);
        pathIndices.push(1); // We're on the right
        activePeakIndex = leftIdx;
      } else if (activePeakIndex === leftIdx) {
        pathElements.push(right);
        pathIndices.push(0); // We're on the left
      }

      tempPeaks.pop();
      tempDepths.pop();
      tempPeaks[leftIdx] = mergedHash;
      tempDepths[leftIdx] = mergedDepth;
    }

    // --- Step 5: compute_root_from_peaks_temp simulation ---
    let nodes: { node: BN; depth: number; isUs: boolean }[] = tempPeaks.map((p, i) => ({
      node: p,
      depth: tempDepths[i],
      isUs: i === activePeakIndex,
    }));

    while (nodes.length > 1) {
      const nextLevelNodes: { node: BN; depth: number; isUs: boolean }[] = [];
      let ni = 0;
      while (ni < nodes.length) {
        if (ni + 1 < nodes.length) {
          const a = { ...nodes[ni] };
          const b = { ...nodes[ni + 1] };

          // Lift shallower node to match depth
          while (a.depth < b.depth) {
            const def = getDefaultRoot(a.depth);
            if (a.isUs) { pathElements.push(def); pathIndices.push(0); }
            const h = hash2([BigInt(a.node.toString()), BigInt(def.toString())]);
            a.node = new BN(h.toString());
            a.depth++;
          }
          while (b.depth < a.depth) {
            const def = getDefaultRoot(b.depth);
            if (b.isUs) { pathElements.push(def); pathIndices.push(0); }
            const h = hash2([BigInt(b.node.toString()), BigInt(def.toString())]);
            b.node = new BN(h.toString());
            b.depth++;
          }

          if (a.isUs) { pathElements.push(b.node); pathIndices.push(0); }
          else if (b.isUs) { pathElements.push(a.node); pathIndices.push(1); }

          const h = hash2([BigInt(a.node.toString()), BigInt(b.node.toString())]);
          nextLevelNodes.push({ node: new BN(h.toString()), depth: a.depth + 1, isUs: a.isUs || b.isUs });
        } else {
          const n = { ...nodes[ni] };
          const def = getDefaultRoot(n.depth);
          if (n.isUs) { pathElements.push(def); pathIndices.push(0); }
          const h = hash2([BigInt(n.node.toString()), BigInt(def.toString())]);
          nextLevelNodes.push({ node: new BN(h.toString()), depth: n.depth + 1, isUs: n.isUs });
        }
        ni += 2;
      }
      nodes = nextLevelNodes;
    }

    // --- Step 6: Deepen to TARGET_DEPTH_LARGE ---
    let current = nodes[0] || { node: new BN(0), depth: 0, isUs: true };
    for (let d = current.depth; d < TARGET_DEPTH_LARGE; d++) {
      const def = getDefaultRoot(d);
      if (current.isUs) { pathElements.push(def); pathIndices.push(0); }
      const h = hash2([BigInt(current.node.toString()), BigInt(def.toString())]);
      current = { node: new BN(h.toString()), depth: d + 1, isUs: current.isUs };
    }

    if (pathElements.length !== TARGET_DEPTH_LARGE) {
      throw new Error(
        `Past-batch proof path length ${pathElements.length} != expected ${TARGET_DEPTH_LARGE}. ` +
        `This indicates a bug in the proof generation logic.`
      );
    }

    return {
      root: current.node,
      pathElements: pathElements.map((e) => e.toString()),
      pathIndices: pathIndices,
    };
  }

  /**
   * Independently compute the root the way the contract does, using the on-chain
   * batch root directly (not JS-recomputed). Used for diagnostics.
   */
  computeExpectedOnChainRoot(): { root: BN; depth: number } {
    const batchRoot = !this.onChainBatchRoot.isZero()
      ? this.onChainBatchRoot
      : this.getBatchRoot();

    // Step 1: update_peaks_temp
    const tPeaks = [...this.peaks.map(p => new BN(p))];
    const tDepths = [...this.peakDepths];
    tPeaks.push(new BN(batchRoot));
    tDepths.push(BATCH_HEIGHT);
    let count = tPeaks.length;

    while (count >= 2 && tDepths[count - 1] === tDepths[count - 2]) {
      const left = tPeaks[count - 2];
      const right = tPeaks[count - 1];
      const merged = new BN(hash2([BigInt(left.toString()), BigInt(right.toString())]).toString());
      const mergedDepth = tDepths[count - 1] + 1;
      tPeaks[count - 2] = merged;
      tDepths[count - 2] = mergedDepth;
      count--;
    }
    const activePeaks = tPeaks.slice(0, count);
    const activeDepths = tDepths.slice(0, count);

    // Step 2: compute_root_from_peaks_temp
    let nodes: { node: BN; depth: number }[] = activePeaks.map((p, i) => ({
      node: p, depth: activeDepths[i],
    }));

    while (nodes.length > 1) {
      const next: { node: BN; depth: number }[] = [];
      let ni = 0;
      while (ni < nodes.length) {
        if (ni + 1 < nodes.length) {
          const a = { ...nodes[ni] };
          const b = { ...nodes[ni + 1] };
          while (a.depth < b.depth) {
            const def = getDefaultRoot(a.depth);
            a.node = new BN(hash2([BigInt(a.node.toString()), BigInt(def.toString())]).toString());
            a.depth++;
          }
          while (b.depth < a.depth) {
            const def = getDefaultRoot(b.depth);
            b.node = new BN(hash2([BigInt(b.node.toString()), BigInt(def.toString())]).toString());
            b.depth++;
          }
          const h = hash2([BigInt(a.node.toString()), BigInt(b.node.toString())]);
          next.push({ node: new BN(h.toString()), depth: a.depth + 1 });
        } else {
          const n = { ...nodes[ni] };
          const def = getDefaultRoot(n.depth);
          const h = hash2([BigInt(n.node.toString()), BigInt(def.toString())]);
          next.push({ node: new BN(h.toString()), depth: n.depth + 1 });
        }
        ni += 2;
      }
      nodes = next;
    }

    // Step 3: deepen_temp
    let cur = nodes[0];
    for (let d = cur.depth; d < TARGET_DEPTH_LARGE; d++) {
      const def = getDefaultRoot(d);
      const h = hash2([BigInt(cur.node.toString()), BigInt(def.toString())]);
      cur = { node: new BN(h.toString()), depth: d + 1 };
    }

    return { root: cur.node, depth: cur.depth };
  }

  // Get full proof for a leaf index in the CURRENT batch
  getProof(localLeafIndex: number) {
    const pathElements: BN[] = [];
    const pathIndices: number[] = [];

    // 1. Path within the Batch (Height 0..3)
    let currentLevel = [...this.batchLeaves];
    let idx = localLeafIndex;

    for (let h = 0; h < BATCH_HEIGHT; h++) {
      const isRight = idx % 2 === 1;
      const siblingIdx = isRight ? idx - 1 : idx + 1;
      const sibling = currentLevel[siblingIdx];
      pathElements.push(sibling);
      pathIndices.push(isRight ? 1 : 0);

      const nextLevel: BN[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const l = currentLevel[i];
        const r = currentLevel[i + 1];
        const hash = hash2([BigInt(l.toString()), BigInt(r.toString())]);
        nextLevel.push(new BN(hash.toString()));
      }
      currentLevel = nextLevel;
      idx = Math.floor(idx / 2);
    }

    const activeNode = currentLevel[0];
    const activeDepth = BATCH_HEIGHT;

    // VALIDATION: Compare JS batch root with on-chain batch root — throw on mismatch
    if (!this.onChainBatchRoot.isZero()) {
      const jsBatchRootHex = activeNode.toString("hex").padStart(64, "0");
      const onChainHex = this.onChainBatchRoot.toString("hex").padStart(64, "0");
      if (jsBatchRootHex !== onChainHex) {
        throw new Error(
          `FATAL: JS batch root ≠ on-chain batch root. ` +
          `JS: ${jsBatchRootHex.slice(0, 16)}..., On-chain: ${onChainHex.slice(0, 16)}... ` +
          `Leaf index: ${localLeafIndex}, Non-zero leaves: ${this.batchLeaves.filter(l => !l.isZero()).length}`
        );
      }
    }

    // 2. Simulate `update_peaks_temp`
    // Copy peaks state
    const tempPeaks = [...this.peaks];
    const tempDepths = [...this.peakDepths];

    // Add current batch as new peak
    tempPeaks.push(activeNode);
    tempDepths.push(activeDepth);

    let activePeakIndex = tempPeaks.length - 1;

    while (tempPeaks.length >= 2 && tempDepths[tempPeaks.length - 1] === tempDepths[tempPeaks.length - 2]) {
      const rightIdx = tempPeaks.length - 1;
      const leftIdx = tempPeaks.length - 2;
      const left = tempPeaks[leftIdx];
      const right = tempPeaks[rightIdx];

      const mergedHash = new BN(hash2([BigInt(left.toString()), BigInt(right.toString())]).toString());
      const mergedDepth = tempDepths[rightIdx] + 1;

      if (activePeakIndex === rightIdx) {
        pathElements.push(left);
        pathIndices.push(1); // Right
        activePeakIndex = leftIdx;
      } else if (activePeakIndex === leftIdx) {
        pathElements.push(right);
        pathIndices.push(0); // Left
      }

      tempPeaks.pop();
      tempDepths.pop();
      tempPeaks[leftIdx] = mergedHash;
      tempDepths[leftIdx] = mergedDepth;
    }

    // 3. Simulate `compute_root_from_peaks_temp`
    let nodes: { node: BN; depth: number; isUs: boolean }[] = tempPeaks.map((p, i) => ({
      node: p,
      depth: tempDepths[i],
      isUs: i === activePeakIndex,
    }));

    while (nodes.length > 1) {
      const nextLevelNodes: { node: BN; depth: number; isUs: boolean }[] = [];
      let i = 0;
      while (i < nodes.length) {
        if (i + 1 < nodes.length) {
          const a = nodes[i];
          const b = nodes[i + 1];
          while (a.depth < b.depth) {
            const def = getDefaultRoot(a.depth);
            if (a.isUs) {
              pathElements.push(def);
              pathIndices.push(0);
            }
            const h = hash2([BigInt(a.node.toString()), BigInt(def.toString())]);
            a.node = new BN(h.toString());
            a.depth++;
          }
          while (b.depth < a.depth) {
            const def = getDefaultRoot(b.depth);
            if (b.isUs) {
              pathElements.push(def);
              pathIndices.push(0);
            }
            const h = hash2([BigInt(b.node.toString()), BigInt(def.toString())]);
            b.node = new BN(h.toString());
            b.depth++;
          }
          if (a.isUs) {
            pathElements.push(b.node);
            pathIndices.push(0);
          } else if (b.isUs) {
            pathElements.push(a.node);
            pathIndices.push(1);
          }

          const h = hash2([BigInt(a.node.toString()), BigInt(b.node.toString())]);
          nextLevelNodes.push({ node: new BN(h.toString()), depth: a.depth + 1, isUs: a.isUs || b.isUs });
        } else {
          const n = nodes[i];
          const def = getDefaultRoot(n.depth);
          if (n.isUs) {
            pathElements.push(def);
            pathIndices.push(0);
          }
          const h = hash2([BigInt(n.node.toString()), BigInt(def.toString())]);
          nextLevelNodes.push({ node: new BN(h.toString()), depth: n.depth + 1, isUs: n.isUs });
        }
        i += 2;
      }
      nodes = nextLevelNodes;
    }

    // 4. `deepen_temp`
    const current = nodes[0];
    for (let d = current.depth; d < TARGET_DEPTH_LARGE; d++) {
      const def = getDefaultRoot(d);
      if (current.isUs) {
        pathElements.push(def);
        pathIndices.push(0);
      }
      const h = hash2([BigInt(current.node.toString()), BigInt(def.toString())]);
      current.node = new BN(h.toString());
    }

    // Validate proof root matches expected on-chain root
    const expectedOnChainRoot = this.computeExpectedOnChainRoot();
    const proofRootHex = current.node.toString("hex").padStart(64, "0");
    const expectedRootHex = expectedOnChainRoot.root.toString("hex").padStart(64, "0");

    if (proofRootHex !== expectedRootHex) {
      throw new Error(
        `FATAL: Proof root ≠ expected on-chain root. ` +
        `Proof: ${proofRootHex.slice(0, 16)}..., Expected: ${expectedRootHex.slice(0, 16)}... ` +
        `Peaks: ${this.peaks.length}, Batch#: ${this.batchNumber}, Leaf: ${localLeafIndex}`
      );
    }

    return {
      root: current.node,
      pathElements: pathElements.map((e) => e.toString()),
      pathIndices: pathIndices,
    };
  }
}

// --- Full MMR (All Batches) ---
// Used when note is in a past batch - generates proofs compatible with current on-chain root
export class FullMMR {
  allBatchLeaves: BN[][]; // All finalized batches' leaves
  currentBatchLeaves: BN[]; // Current (non-finalized) batch leaves
  peaks: BN[];
  peakDepths: number[];
  currentBatchNumber: number;
  storedBatchRoots: BN[]; // Stored batch roots from backend (on-chain values)
  onChainCurrentBatchRoot: BN; // On-chain current batch root (Rust poseidon) - CRITICAL!

  // For compatibility with code that expects batchLeaves
  batchLeaves: BN[];

  constructor(
    allBatchLeaves: BN[][],
    currentBatchLeaves: BN[],
    peaks: BN[],
    peakDepths: number[],
    currentBatchNumber: number,
    storedBatchRoots: BN[] = [], // Optional: stored batch roots from snapshots
    onChainCurrentBatchRoot?: BN, // CRITICAL: On-chain batch root to avoid JS/Rust mismatch
  ) {
    this.allBatchLeaves = allBatchLeaves;
    this.currentBatchLeaves = currentBatchLeaves;
    while (this.currentBatchLeaves.length < LEAVES_COUNT) {
      this.currentBatchLeaves.push(new BN(0));
    }
    this.peaks = peaks;
    this.peakDepths = peakDepths;
    this.currentBatchNumber = currentBatchNumber;
    this.storedBatchRoots = storedBatchRoots;
    // Store on-chain current batch root to avoid poseidon mismatch
    this.onChainCurrentBatchRoot = onChainCurrentBatchRoot || new BN(0);

    // For compatibility - flatten all leaves
    this.batchLeaves = [];
    for (const batch of allBatchLeaves) {
      this.batchLeaves.push(...batch);
    }
    this.batchLeaves.push(...currentBatchLeaves);

    computeDefaultRoots();
  }

  // Compute batch root from 16 leaves
  private computeBatchRoot(leaves: BN[]): BN {
    let level = [...leaves];
    while (level.length < LEAVES_COUNT) level.push(new BN(0));
    for (let h = 0; h < BATCH_HEIGHT; h++) {
      const nextLevel: BN[] = [];
      for (let i = 0; i < level.length; i += 2) {
        const hashVal = hash2([BigInt(level[i].toString()), BigInt(level[i + 1].toString())]);
        nextLevel.push(new BN(hashVal.toString()));
      }
      level = nextLevel;
    }
    return level[0];
  }

  // Generate proof for ANY leaf (past or current batch)
  getProof(globalLeafIndex: number): { root: BN; pathElements: string[]; pathIndices: number[] } {
    const batchIndex = Math.floor(globalLeafIndex / LEAVES_COUNT);
    const localIndex = globalLeafIndex % LEAVES_COUNT;

    const isCurrentBatch = batchIndex === this.currentBatchNumber;
    const batchLeaves = isCurrentBatch ? this.currentBatchLeaves : this.allBatchLeaves[batchIndex];

    if (!batchLeaves) {
      throw new Error(`Batch ${batchIndex} not found`);
    }

    const pathElements: BN[] = [];
    const pathIndices: number[] = [];

    // Step 1: Intra-batch path (4 levels)
    let currentLevel = [...batchLeaves];
    while (currentLevel.length < LEAVES_COUNT) currentLevel.push(new BN(0));
    let idx = localIndex;

    for (let h = 0; h < BATCH_HEIGHT; h++) {
      const isRight = idx % 2 === 1;
      const siblingIdx = isRight ? idx - 1 : idx + 1;
      pathElements.push(currentLevel[siblingIdx]);
      pathIndices.push(isRight ? 1 : 0);

      const nextLevel: BN[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const hashVal = hash2([BigInt(currentLevel[i].toString()), BigInt(currentLevel[i + 1].toString())]);
        nextLevel.push(new BN(hashVal.toString()));
      }
      currentLevel = nextLevel;
      idx = Math.floor(idx / 2);
    }

    const thisBatchRoot = currentLevel[0];

    // Step 2: Navigate through the MMR structure
    // Use STORED batch roots if available (from on-chain), otherwise compute
    // CRITICAL: Using stored roots avoids hash mismatch between JS poseidon-lite and Rust solana_poseidon

    // Collect all batch roots - prefer stored (on-chain) values over computed
    const allBatchRoots: BN[] = [];
    for (let i = 0; i < this.allBatchLeaves.length; i++) {
      if (this.storedBatchRoots.length > i && !this.storedBatchRoots[i].isZero()) {
        // Use stored on-chain batch root
        allBatchRoots.push(this.storedBatchRoots[i]);
      } else {
        // Fall back to computing (may cause mismatch for non-trivial batches)
        allBatchRoots.push(this.computeBatchRoot(this.allBatchLeaves[i]));
      }
    }

    // Simulate building MMR from batch 0 to current, tracking our path
    const tempPeaks: BN[] = [];
    const tempDepths: number[] = [];
    // CRITICAL: For past batches, use stored batch root (Rust-computed) for ourNode tracking
    // This ensures eq() comparisons work correctly when matching against tempPeaks
    let ourNode = (batchIndex < allBatchRoots.length) ? allBatchRoots[batchIndex] : thisBatchRoot;
    let ourDepth = BATCH_HEIGHT;
    let foundOurBatch = false;

    for (let b = 0; b <= this.currentBatchNumber; b++) {
      let newPeak: BN;
      let newDepth: number;

      if (b < allBatchRoots.length) {
        newPeak = allBatchRoots[b];
        newDepth = BATCH_HEIGHT;
      } else if (b === this.currentBatchNumber) {
        // Current batch - CRITICAL: Use on-chain batch root to avoid JS/Rust poseidon mismatch!
        // If we have the on-chain root, use it; otherwise fall back to computing (may cause mismatch)
        if (!this.onChainCurrentBatchRoot.isZero()) {
          newPeak = this.onChainCurrentBatchRoot;
          console.log("Using on-chain current batch root:", newPeak.toString("hex").slice(0, 16) + "...");
        } else {
          console.warn("WARNING: No on-chain current batch root provided, computing with JS (may cause mismatch)");
          newPeak = this.computeBatchRoot(this.currentBatchLeaves);
        }
        newDepth = BATCH_HEIGHT;
      } else {
        continue;
      }

      if (b === batchIndex) {
        foundOurBatch = true;
      }

      tempPeaks.push(newPeak);
      tempDepths.push(newDepth);

      // Merge while we have two peaks of equal depth
      while (tempPeaks.length >= 2 && tempDepths[tempPeaks.length - 1] === tempDepths[tempPeaks.length - 2]) {
        const rightPeak = tempPeaks.pop()!;
        const rightDepth = tempDepths.pop()!;
        const leftPeak = tempPeaks.pop()!;
        const leftDepth = tempDepths.pop()!;

        // Check if our node is involved in this merge
        if (foundOurBatch && (ourNode.eq(leftPeak) || ourNode.eq(rightPeak))) {
          if (ourNode.eq(rightPeak)) {
            pathElements.push(leftPeak);
            pathIndices.push(1); // We're on the right
          } else {
            pathElements.push(rightPeak);
            pathIndices.push(0); // We're on the left
          }
          ourDepth = rightDepth + 1;
        }

        const merged = new BN(hash2([BigInt(leftPeak.toString()), BigInt(rightPeak.toString())]).toString());
        tempPeaks.push(merged);
        tempDepths.push(rightDepth + 1);

        if (foundOurBatch && (ourNode.eq(leftPeak) || ourNode.eq(rightPeak))) {
          ourNode = merged;
        }
      }
    }

    // Step 3: Compute root from remaining peaks
    let nodes: { node: BN; depth: number; isUs: boolean }[] = tempPeaks.map((p, i) => ({
      node: p,
      depth: tempDepths[i],
      isUs: p.eq(ourNode),
    }));

    while (nodes.length > 1) {
      const nextLevelNodes: { node: BN; depth: number; isUs: boolean }[] = [];
      let i = 0;
      while (i < nodes.length) {
        if (i + 1 < nodes.length) {
          let a = nodes[i];
          let b = nodes[i + 1];

          // Bring both to same depth
          while (a.depth < b.depth) {
            const def = getDefaultRoot(a.depth);
            if (a.isUs) {
              pathElements.push(def);
              pathIndices.push(0);
            }
            const h = hash2([BigInt(a.node.toString()), BigInt(def.toString())]);
            a = { node: new BN(h.toString()), depth: a.depth + 1, isUs: a.isUs };
          }
          while (b.depth < a.depth) {
            const def = getDefaultRoot(b.depth);
            if (b.isUs) {
              pathElements.push(def);
              pathIndices.push(0);
            }
            const h = hash2([BigInt(b.node.toString()), BigInt(def.toString())]);
            b = { node: new BN(h.toString()), depth: b.depth + 1, isUs: b.isUs };
          }

          if (a.isUs) {
            pathElements.push(b.node);
            pathIndices.push(0);
          } else if (b.isUs) {
            pathElements.push(a.node);
            pathIndices.push(1);
          }

          const h = hash2([BigInt(a.node.toString()), BigInt(b.node.toString())]);
          nextLevelNodes.push({ node: new BN(h.toString()), depth: a.depth + 1, isUs: a.isUs || b.isUs });
          i += 2;
        } else {
          const n = nodes[i];
          const def = getDefaultRoot(n.depth);
          if (n.isUs) {
            pathElements.push(def);
            pathIndices.push(0);
          }
          const h = hash2([BigInt(n.node.toString()), BigInt(def.toString())]);
          nextLevelNodes.push({ node: new BN(h.toString()), depth: n.depth + 1, isUs: n.isUs });
          i += 1;
        }
      }
      nodes = nextLevelNodes;
    }

    // Step 4: Deepen to TARGET_DEPTH_LARGE
    let current = nodes[0] || { node: ourNode, depth: ourDepth, isUs: true };
    for (let d = current.depth; d < TARGET_DEPTH_LARGE; d++) {
      const def = getDefaultRoot(d);
      if (current.isUs) {
        pathElements.push(def);
        pathIndices.push(0);
      }
      const h = hash2([BigInt(current.node.toString()), BigInt(def.toString())]);
      current = { node: new BN(h.toString()), depth: d + 1, isUs: current.isUs };
    }

    console.log("---------------------------------------------------");
    console.log("🔍 FULL MMR PROOF GENERATION DEBUG");
    console.log("Batch Index:", batchIndex, isCurrentBatch ? "(current)" : "(finalized)");
    console.log("Local Leaf Index:", localIndex);
    console.log("Simulated Root:", current.node.toString("hex"));
    console.log("Path Length:", pathElements.length);
    console.log("---------------------------------------------------");

    return {
      root: current.node,
      pathElements: pathElements.map((e) => e.toString()),
      pathIndices: pathIndices,
    };
  }
}

// --- Standard Merkle Tree (History Based) ---
// Used when note is in a past batch (slow, full history)
export class FullMerkleTree {
  leaves: BN[];
  levels: BN[][];
  root: BN;
  zeros: BN[];
  // Compatibility field for private-swap.ts
  batchLeaves: BN[];

  constructor(leaves: BN[], depth: number = 30) {
    this.leaves = leaves;
    // For compatibility with code that checks batchLeaves (like current private-swap.ts)
    // we expose ALL leaves as batchLeaves so findIndex works.
    this.batchLeaves = leaves;

    this.levels = [leaves];
    this.zeros = [];

    // Compute zeros
    let current = new BN(0);
    this.zeros.push(current);
    for (let i = 1; i < depth; i++) {
      const hashBigInt = hash2([BigInt(current.toString()), BigInt(current.toString())]);
      current = new BN(hashBigInt.toString());
      this.zeros.push(current);
    }

    this.root = this.build(depth);
  }

  build(depth: number): BN {
    let currentLevel = this.levels[0];
    for (let level = 0; level < depth; level++) {
      const nextLevel: BN[] = [];
      const zeroHash = this.zeros[level];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : zeroHash;
        const hashBigInt = hash2([BigInt(left.toString()), BigInt(right.toString())]);
        nextLevel.push(new BN(hashBigInt.toString()));
      }
      this.levels.push(nextLevel);
      currentLevel = nextLevel;
    }
    return this.levels[this.levels.length - 1][0];
  }

  getProof(index: number, depth: number = 30) {
    const pathElements: BN[] = [];
    const pathIndices: number[] = [];
    for (let level = 0; level < depth; level++) {
      const levelNodes = level < this.levels.length ? this.levels[level] : [];

      const isRightNode = index % 2 === 1;
      const siblingIndex = isRightNode ? index - 1 : index + 1;
      const sibling = level < this.levels.length && siblingIndex < levelNodes.length ? levelNodes[siblingIndex] : this.zeros[level];

      pathElements.push(sibling);
      pathIndices.push(isRightNode ? 1 : 0);
      index = Math.floor(index / 2);
    }
    return {
      root: this.root,
      pathElements: pathElements.map((e) => e.toString()),
      pathIndices: pathIndices,
    };
  }
}

// --- API ---

// 1. STATE BASED RECONSTRUCTION (FAST, RECENT TIPS)
export const reconstructMerkleTree = async (connection: Connection, shieldedPoolAddress: PublicKey) => {
  // Use explicit "confirmed" commitment to get the most recent confirmed state
  let accountInfo = await connection.getAccountInfo(shieldedPoolAddress, { commitment: "confirmed" });

  // Retry logic for fetching account info (sometimes RPC returns null for fresh accounts)
  if (!accountInfo) {
    for (let i = 0; i < 3; i++) {
      await new Promise((r) => setTimeout(r, 500));
      accountInfo = await connection.getAccountInfo(shieldedPoolAddress, { commitment: "confirmed" });
      if (accountInfo) break;
    }
  }

  if (!accountInfo) throw new Error(`Pool not found: ${shieldedPoolAddress.toBase58()} after 3 retries.`);
  const data = accountInfo.data;

  // Parse Batch Leaves
  const leaves: BN[] = [];
  const DEFAULT_LEAF = Buffer.alloc(32, 0);
  for (let i = 0; i < LEAVES_COUNT; i++) {
    const start = 40 + i * 32;
    const bytes = data.slice(start, start + 32);
    leaves.push(bytes.equals(DEFAULT_LEAF) ? new BN(0) : new BN(bytes));
  }

  // Parse MMR Data
  // Discriminator (8) + Root (32) + Leaves (512) + ID (16) + Min (8) + Whole (32) + Small (32) = 640
  const BATCH_NUMBER_OFFSET = 640;
  const PEAKS_OFFSET = 648;
  const DEPTHS_OFFSET = 1480;
  const COUNT_OFFSET = 1506;

  const batchNumber = new BN(data.slice(BATCH_NUMBER_OFFSET, BATCH_NUMBER_OFFSET + 8), "le").toNumber();

  const peaksCount = data[COUNT_OFFSET];
  const peaks: BN[] = [];
  const peakDepths: number[] = [];

  console.log(`Pool State: Batch #${batchNumber}, Peaks: ${peaksCount}`);

  for (let i = 0; i < peaksCount; i++) {
    peaks.push(new BN(data.slice(PEAKS_OFFSET + i * 32, PEAKS_OFFSET + i * 32 + 32)));
    peakDepths.push(data[DEPTHS_OFFSET + i]);
  }

  // --- DEBUG: Verify Batch Root ---
  // Read on-chain batch root (Offset 8) - CRITICAL: Use this value, don't recompute!
  const onChainBatchRoot = new BN(data.slice(8, 40));

  // Pass on-chain batch root to MMRTree to avoid JS/Rust poseidon mismatch
  const mmr = new MMRTree(leaves, peaks, peakDepths, batchNumber, onChainBatchRoot);
  const localBatchRoot = mmr.getBatchRoot();

  if (!onChainBatchRoot.eq(localBatchRoot) && !onChainBatchRoot.isZero()) {
    console.warn("MMR batch root mismatch: JS ≠ on-chain. Proofs will use on-chain root.");
  }

  return mmr;
};

// 2. HISTORY BASED RECONSTRUCTION (SLOW, DEEP HISTORY)
export const reconstructTreeFromHistory = async (connection: Connection, shieldedPoolAddress: PublicKey) => {
  console.log("📜 Fetching transaction history to reconstruct tree...");
  // Fetch signatures - limit to recent 100 to avoid rate limiting
  // Most notes should be in recent history
  const signatures = await connection.getSignaturesForAddress(shieldedPoolAddress, { limit: 100 });
  console.log(`Found ${signatures.length} transactions for pool`);
  const txs = await fetchParsedTransactionsBatch(
    connection,
    signatures.map((s) => s.signature),
  );

  const leaves: BN[] = [];

  // Sort txs to ensure order
  txs.sort((a, b) => (a?.slot || 0) - (b?.slot || 0));

  for (const tx of txs) {
    if (!tx) continue;
    const leaf = extractLeafFromTx(tx);
    if (leaf) {
      leaves.push(leaf);
    }
  }

  console.log(`✅ Reconstructed tree from history with ${leaves.length} leaves`);
  return new FullMerkleTree(leaves);
};

async function fetchParsedTransactionsBatch(connection: Connection, signatures: string[]) {
  const results: (ParsedTransactionWithMeta | null)[] = [];
  // Smaller chunks and longer delays to avoid rate limiting on public RPC
  const CHUNK_SIZE = 3;
  const DELAY_MS = 1000;
  for (let i = 0; i < signatures.length; i += CHUNK_SIZE) {
    const chunk = signatures.slice(i, i + CHUNK_SIZE);
    try {
      const txs = await connection.getParsedTransactions(chunk, { maxSupportedTransactionVersion: 0 });
      results.push(...txs);
    } catch (e) {
      console.warn(`Rate limited, waiting longer... (chunk ${i / CHUNK_SIZE})`);
      await new Promise((r) => setTimeout(r, 3000));
      // Retry once
      const txs = await connection.getParsedTransactions(chunk, { maxSupportedTransactionVersion: 0 });
      results.push(...txs);
    }
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }
  return results;
}

function extractLeafFromTx(tx: ParsedTransactionWithMeta): BN | null {
  if (!tx || !tx.meta || tx.meta.err) return null;
  for (const ix of tx.transaction.message.instructions) {
    if ("data" in ix) {
      const data = Buffer.from(ix.data as string, "base64");
      if (data.length >= 272) {
        const offsets = [264, 268, 272, 276, 280];
        for (const off of offsets) {
          if (off + 40 <= data.length) {
            // Check amounts (BE and LE)
            const amt = new BN(data.slice(off, off + 8), "be");
            if (amt.gtn(1000) && amt.ltn(1_000_000_000_000)) {
              return new BN(data.slice(off + 8, off + 40));
            }
            const amtLE = new BN(data.slice(off, off + 8), "le"); // u64 in Solana is usually LE
            if (amtLE.gtn(1000) && amtLE.ltn(1_000_000_000_000)) {
              return new BN(data.slice(off + 8, off + 40));
            }
          }
        }
      }
    }
  }
  return null;
}

// --- BACKEND-BASED RECONSTRUCTION (FASTEST, NO RPC) ---
export const reconstructTreeFromBackend = async (poolAddress: PublicKey): Promise<FullMerkleTree | null> => {
  try {
    console.log("🌐 Fetching Merkle tree from backend...");
    const data = await zkApi.getMerkleTree(poolAddress.toBase58());

    if (data.totalCommitments === 0) {
      console.log("⚠️ No commitments found in backend for this pool");
      return null;
    }

    // Convert commitment strings to BN
    const leaves = data.leaves.map((c) => new BN(c, "hex"));

    console.log(`✅ Reconstructed tree from backend with ${leaves.length} leaves`);
    return new FullMerkleTree(leaves);
  } catch (error) {
    console.warn("Backend tree fetch failed:", error);
    return null;
  }
};

// --- BATCH SNAPSHOT STORAGE ---
// Save MMR state when a batch is finalized (batch number increases)
const lastKnownBatchNumber: Map<string, number> = new Map();

export const saveBatchSnapshotIfNeeded = async (
  connection: Connection,
  poolAddress: PublicKey,
): Promise<void> => {
  try {
    const poolKey = poolAddress.toBase58();

    // Read pool account data directly to get on-chain values
    const accountInfo = await connection.getAccountInfo(poolAddress);
    if (!accountInfo) {
      console.warn("Pool account not found for snapshot save");
      return;
    }

    const data = accountInfo.data;

    // Parse on-chain batch root (offset 8-40) - this is the AUTHORITATIVE value
    const onChainBatchRoot = new BN(data.slice(8, 40));

    // Parse batch number
    const BATCH_NUMBER_OFFSET = 640;
    const batchNumber = new BN(data.slice(BATCH_NUMBER_OFFSET, BATCH_NUMBER_OFFSET + 8), "le").toNumber();

    // Parse batch leaves
    const leaves: BN[] = [];
    for (let i = 0; i < LEAVES_COUNT; i++) {
      const start = 40 + i * 32;
      const bytes = data.slice(start, start + 32);
      leaves.push(new BN(bytes));
    }

    // Parse peaks
    const PEAKS_OFFSET = 648;
    const DEPTHS_OFFSET = 1480;
    const COUNT_OFFSET = 1506;
    const peaksCount = data[COUNT_OFFSET];
    const peaks: BN[] = [];
    const peakDepths: number[] = [];

    for (let i = 0; i < peaksCount; i++) {
      peaks.push(new BN(data.slice(PEAKS_OFFSET + i * 32, PEAKS_OFFSET + i * 32 + 32)));
      peakDepths.push(data[DEPTHS_OFFSET + i]);
    }

    const lastBatch = lastKnownBatchNumber.get(poolKey) ?? -1;

    // If batch number increased, the previous batch was finalized
    if (batchNumber > lastBatch && lastBatch >= 0) {
      console.log(`📸 Batch ${lastBatch} was finalized, current batch is ${batchNumber}`);
    }

    // Save current batch snapshot with ON-CHAIN batch root
    const nonZeroLeaves = leaves.filter((l) => !l.isZero());
    if (nonZeroLeaves.length > 0) {
      // CRITICAL: Use on-chain batch root, NOT computed value
      // This avoids hash mismatch between poseidon-lite (JS) and solana_poseidon (Rust)
      const batchRootHex = onChainBatchRoot.toString("hex").padStart(64, "0");
      const leavesHex = leaves.map((l) => l.toString("hex").padStart(64, "0"));
      const peaksHex = peaks.map((p) => p.toString("hex").padStart(64, "0"));

      try {
        await zkApi.storeBatchSnapshot({
          poolAddress: poolKey,
          batchNumber,
          batchRoot: batchRootHex,  // ON-CHAIN value (not computed!)
          leaves: leavesHex,
          peaks: peaksHex,
          peakDepths,
        });
        console.log(`✅ Saved batch ${batchNumber} snapshot with on-chain root ${batchRootHex.slice(0, 16)}...`);
      } catch (e) {
        // Likely already exists, which is fine
        console.log(`Batch ${batchNumber} snapshot already exists or save failed`);
      }
    }

    lastKnownBatchNumber.set(poolKey, batchNumber);
  } catch (error) {
    console.warn("Failed to save batch snapshot:", error);
  }
};

// Backfill missing batch snapshots using commitment data from backend
export const backfillMissingSnapshots = async (
  poolAddress: PublicKey,
  maxBatch: number,
): Promise<void> => {
  const poolKey = poolAddress.toBase58();

  try {
    const existingSnapshots = await zkApi.getBatchSnapshots(poolKey);
    const existingBatchNumbers = new Set(existingSnapshots.map((s) => s.batchNumber));

    // Find missing batches (0 to maxBatch-1)
    const missingBatches: number[] = [];
    for (let b = 0; b < maxBatch; b++) {
      if (!existingBatchNumbers.has(b)) {
        missingBatches.push(b);
      }
    }

    if (missingBatches.length === 0) return;

    console.log(`🔄 Backfilling ${missingBatches.length} missing batch snapshots: [${missingBatches.join(", ")}]`);

    // Get all commitments from backend
    const commitments = await zkApi.getCommitments(poolKey);

    // Group by batch
    const batchCommitments = new Map<number, { commitment: string; leafIndex: number }[]>();
    for (const c of commitments) {
      if (!batchCommitments.has(c.batchNumber)) {
        batchCommitments.set(c.batchNumber, []);
      }
      batchCommitments.get(c.batchNumber)!.push({
        commitment: c.commitment,
        leafIndex: c.leafIndex,
      });
    }

    // Create snapshots for missing batches
    for (const batchNum of missingBatches) {
      const batchData = batchCommitments.get(batchNum);
      if (!batchData || batchData.length === 0) {
        console.warn(`⚠️ No commitment data for batch ${batchNum}, cannot backfill`);
        continue;
      }

      // Sort by leafIndex
      batchData.sort((a, b) => a.leafIndex - b.leafIndex);

      // Build leaves array (pad with zeros)
      const leaves: BN[] = [];
      for (let i = 0; i < LEAVES_COUNT; i++) {
        const found = batchData.find((c) => c.leafIndex === i);
        leaves.push(found ? new BN(found.commitment, "hex") : new BN(0));
      }

      // Compute batch root using JS poseidon
      // WARNING: This computed root may NOT match the on-chain (Rust) root!
      // Backfilled snapshots should only be used as a fallback - proofs may fail.
      let level = [...leaves];
      for (let h = 0; h < BATCH_HEIGHT; h++) {
        const nextLevel: BN[] = [];
        for (let i = 0; i < level.length; i += 2) {
          const hashVal = hash2([BigInt(level[i].toString()), BigInt(level[i + 1].toString())]);
          nextLevel.push(new BN(hashVal.toString()));
        }
        level = nextLevel;
      }
      const batchRoot = level[0];

      // Save backfilled snapshot (peaks will be computed during reconstruction)
      // NOTE: This batchRoot is JS-computed and may differ from on-chain value!
      // Proofs for notes in backfilled batches may still fail with InvalidMerkleRoot.
      try {
        await zkApi.storeBatchSnapshot({
          poolAddress: poolKey,
          batchNumber: batchNum,
          batchRoot: batchRoot.toString("hex"),
          leaves: leaves.map((l) => l.toString("hex").padStart(64, "0")),
          peaks: [],
          peakDepths: [],
        });
        console.warn(`⚠️ Backfilled snapshot for batch ${batchNum} with JS-computed root (may not match on-chain)`);
      } catch (e) {
        console.log(`Batch ${batchNum} snapshot already exists or save failed`);
      }
    }
  } catch (error) {
    console.warn("Failed to backfill snapshots:", error);
  }
};

// Reconstruct MMR for a note in a past batch using backend snapshots
// IMPORTANT: For past batch notes, we need to include ALL batches to match current on-chain root
export const reconstructMMRForPastBatch = async (
  connection: Connection,
  poolAddress: PublicKey,
  targetBatchNumber: number,
): Promise<FullMMR | null> => {
  try {
    console.log(`🔍 Reconstructing FullMMR for past batch ${targetBatchNumber}...`);

    // Get current on-chain state to know the current batch number and peaks
    const currentMMR = await reconstructMerkleTree(connection, poolAddress);
    const currentBatchNumber = currentMMR.batchNumber;

    // First, try to backfill any missing snapshots
    await backfillMissingSnapshots(poolAddress, currentBatchNumber);

    // Get all batch snapshots
    const allSnapshots = await zkApi.getBatchSnapshots(poolAddress.toBase58());
    allSnapshots.sort((a, b) => a.batchNumber - b.batchNumber);

    // Check if we have all finalized batches (0 to currentBatchNumber - 1)
    const missingBatches: number[] = [];
    for (let b = 0; b < currentBatchNumber; b++) {
      if (!allSnapshots.some((s) => s.batchNumber === b)) {
        missingBatches.push(b);
      }
    }

    if (missingBatches.length > 0) {
      console.error(`❌ Missing snapshots for batches: [${missingBatches.join(", ")}]. Cannot generate valid proof.`);
      console.log("Hint: These batches need commitment data indexed in the backend.");
      return null;
    }

    // Build all finalized batch leaves AND collect stored batch roots
    const allBatchLeaves: BN[][] = [];
    const storedBatchRoots: BN[] = [];

    for (let b = 0; b < currentBatchNumber; b++) {
      const snap = allSnapshots.find((s) => s.batchNumber === b);
      if (snap) {
        const leaves = snap.leaves.map((l) => new BN(l, "hex"));
        while (leaves.length < LEAVES_COUNT) leaves.push(new BN(0));
        allBatchLeaves.push(leaves);

        // CRITICAL: Use stored batch root from snapshot (should be on-chain value)
        // This avoids hash mismatch between poseidon-lite (JS) and solana_poseidon (Rust)
        if (snap.batchRoot) {
          storedBatchRoots.push(new BN(snap.batchRoot, "hex"));
        } else {
          storedBatchRoots.push(new BN(0)); // Will fall back to computing
        }
      }
    }

    console.log(`✅ Loaded ${allBatchLeaves.length} finalized batches with ${storedBatchRoots.filter(r => !r.isZero()).length} stored roots`);

    // USE ON-CHAIN PEAKS DIRECTLY - don't recompute!
    // Recomputing causes hash mismatch for non-trivial batches
    const peaks = currentMMR.peaks;
    const peakDepths = currentMMR.peakDepths;

    console.log(`✅ Using on-chain peaks: ${peaks.length} peaks`);

    // CRITICAL: Get on-chain current batch root from MMRTree to avoid poseidon mismatch
    const onChainCurrentBatchRoot = currentMMR.onChainBatchRoot;
    console.log(`✅ Using on-chain current batch root: ${onChainCurrentBatchRoot.toString("hex").slice(0, 16)}...`);

    // Create FullMMR with all batch data, STORED batch roots, and ON-CHAIN current batch root
    const fullMMR = new FullMMR(
      allBatchLeaves,
      currentMMR.batchLeaves,
      peaks,           // ON-CHAIN peaks (not recomputed)
      peakDepths,      // ON-CHAIN depths
      currentBatchNumber,
      storedBatchRoots, // STORED batch roots from snapshots
      onChainCurrentBatchRoot, // ON-CHAIN current batch root (CRITICAL for avoiding mismatch!)
    );

    console.log(`✅ Created FullMMR with ${allBatchLeaves.length} finalized batches + current batch`);
    console.log(`   Using ${storedBatchRoots.filter(r => !r.isZero()).length} stored batch roots (on-chain values)`);

    return fullMMR;
  } catch (error) {
    console.warn(`Failed to reconstruct FullMMR for batch ${targetBatchNumber}:`, error);
    return null;
  }
};

// Find which batch a commitment belongs to
export const findCommitmentBatch = async (
  poolAddress: PublicKey,
  commitment: string,
): Promise<{ batchNumber: number; leafIndex: number } | null> => {
  const normalizedCommitment = commitment.padStart(64, "0");
  const poolKey = poolAddress.toBase58();

  // First try: search batch snapshots (fast if they exist)
  try {
    const snapshots = await zkApi.getBatchSnapshots(poolKey);

    for (const snapshot of snapshots) {
      const leafIndex = snapshot.leaves.findIndex(
        (l) => l.padStart(64, "0") === normalizedCommitment
      );
      if (leafIndex >= 0) {
        console.log(`Found commitment in snapshot for batch ${snapshot.batchNumber}`);
        return { batchNumber: snapshot.batchNumber, leafIndex };
      }
    }
  } catch (error) {
    console.warn("Failed to search batch snapshots:", error);
  }

  // Second try: search backend commitment index directly
  // This works even if snapshots don't exist yet
  try {
    console.log("Commitment not in snapshots, searching backend commitment index...");
    const commitments = await zkApi.getCommitments(poolKey);

    for (const c of commitments) {
      if (c.commitment.padStart(64, "0") === normalizedCommitment) {
        console.log(`Found commitment in backend index: batch ${c.batchNumber}, leaf ${c.leafIndex}`);
        return { batchNumber: c.batchNumber, leafIndex: c.leafIndex };
      }
    }
  } catch (error) {
    console.warn("Failed to search backend commitments:", error);
  }

  console.warn("Commitment not found in any backend data source");
  return null;
};

// Export a robust function that tries on-chain MMR first (correct root structure)
// Uses batch snapshots for past batch notes instead of slow transaction history
export const getMerkleTreeWithFallback = async (connection: Connection, poolAddress: PublicKey, noteCommitment?: string) => {
  // 1. Try on-chain MMR state FIRST (correct root structure for on-chain verification)
  try {
    const mmr = await reconstructMerkleTree(connection, poolAddress);

    // Also save current batch snapshot for future use
    saveBatchSnapshotIfNeeded(connection, poolAddress).catch(() => {});

    if (noteCommitment) {
      const normalizedCommitment = noteCommitment.padStart(64, "0");
      const found = mmr.batchLeaves.some((l) => l.toString("hex").padStart(64, "0") === normalizedCommitment);
      if (found) {
        console.log("✅ Note found in current batch (MMR)");
        return mmr;
      }
      console.log("⚠️ Note not found in current batch, checking batch snapshots...");
    } else {
      return mmr;
    }
  } catch (e) {
    console.warn("MMR construction failed:", e);
  }

  // 2. Check batch snapshots for past batch notes
  if (noteCommitment) {
    try {
      const batchInfo = await findCommitmentBatch(poolAddress, noteCommitment);
      if (batchInfo) {
        console.log(`✅ Note found in batch ${batchInfo.batchNumber}, reconstructing MMR...`);
        const pastMMR = await reconstructMMRForPastBatch(connection, poolAddress, batchInfo.batchNumber);
        if (pastMMR) {
          return pastMMR;
        }
        console.warn("Failed to reconstruct past batch MMR, trying backend tree...");
      }
    } catch (e) {
      console.warn("Batch snapshot lookup failed:", e);
    }

    // 3. Try backend tree as fallback (may have different root structure)
    try {
      const backendTree = await reconstructTreeFromBackend(poolAddress);
      if (backendTree) {
        const normalizedCommitment = noteCommitment.padStart(64, "0");
        const found = backendTree.batchLeaves.some((l) => l.toString("hex").padStart(64, "0") === normalizedCommitment);
        if (found) {
          console.log("✅ Note found in backend tree (fallback)");
          return backendTree;
        }
      }
    } catch (e) {
      console.warn("Backend tree fetch failed:", e);
    }
  }

  // 4. Last resort: transaction history (slow, may hit rate limits)
  console.log("⚠️ Falling back to transaction history reconstruction...");
  return await reconstructTreeFromHistory(connection, poolAddress);
};

export const fetchAllShieldTransactions = async () => [];
// Stub MerkleTree if anyone imports it directly, but prefer MMRTree
export class MerkleTree extends FullMerkleTree {}
