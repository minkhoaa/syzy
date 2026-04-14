import type { ShieldedNote } from "@/types/zk.types";
import { zkApi, type StoreNoteDto } from "@/lib/zk-api";
import { useAuthStore } from "@/features/auth/store/use-auth-store";

/**
 * Check if user is authenticated (has valid access token)
 */
function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return useAuthStore.getState().isAuthenticated;
}

// ─────────────────────────────────────────────────────────────
// Encryption Utilities (Client-Side)
// ─────────────────────────────────────────────────────────────

/**
 * Derives an encryption key from a wallet signature.
 * The signature acts as a password that only the wallet owner can produce.
 */
async function deriveKeyFromSignature(signature: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const signatureBytes = encoder.encode(signature);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    signatureBytes.buffer as ArrayBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  const saltBytes = encoder.encode("oyrade-zk-notes-v1");
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes.buffer as ArrayBuffer,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts data using AES-GCM with the derived key.
 */
async function encryptData(data: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const dataBytes = encoder.encode(data);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    dataBytes.buffer as ArrayBuffer
  );

  // Combine IV + encrypted data and encode as base64
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts data using AES-GCM with the derived key.
 */
async function decryptData(encryptedBase64: string, key: CryptoKey): Promise<string> {
  const combined = new Uint8Array(
    atob(encryptedBase64)
      .split("")
      .map((c) => c.charCodeAt(0))
  );

  const iv = combined.slice(0, 12);
  const data = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    data.buffer as ArrayBuffer
  );

  return new TextDecoder().decode(decrypted);
}

// Cache for the encryption key
let cachedKey: CryptoKey | null = null;

const SESSION_KEY = "oyrade-zk-sig";

/**
 * Sets the encryption key from a wallet signature.
 * Caches the signature in sessionStorage so page refreshes don't re-prompt.
 */
export async function setEncryptionKey(signature: string): Promise<void> {
  cachedKey = await deriveKeyFromSignature(signature);
  try {
    sessionStorage.setItem(SESSION_KEY, signature);
  } catch {
    // sessionStorage unavailable (e.g. SSR, private browsing quota)
  }
}

/**
 * Checks if the encryption key is available (in memory or sessionStorage).
 */
export function hasEncryptionKey(): boolean {
  if (cachedKey) return true;
  try {
    return !!sessionStorage.getItem(SESSION_KEY);
  } catch {
    return false;
  }
}

/**
 * Checks if the encryption key is loaded in memory (not just sessionStorage).
 * Use this to decide whether key derivation / restore is needed.
 */
export function isEncryptionKeyReady(): boolean {
  return cachedKey !== null;
}

/**
 * Restores the encryption key from sessionStorage if available.
 * Returns true if the key was restored.
 */
export async function restoreEncryptionKey(): Promise<boolean> {
  if (cachedKey) return true;
  try {
    const sig = sessionStorage.getItem(SESSION_KEY);
    if (sig) {
      cachedKey = await deriveKeyFromSignature(sig);
      return true;
    }
  } catch {
    // sessionStorage unavailable
  }
  return false;
}

/**
 * Clears the cached encryption key and in-memory note cache (on logout).
 */
export function clearEncryptionKey(): void {
  cachedKey = null;
  noteCache = [];
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // sessionStorage unavailable
  }
  notifyNotesChanged();
}

// ─────────────────────────────────────────────────────────────
// In-Memory Note Cache (replaces localStorage)
// Source of truth: backend database.
// Cache is populated from backend on login via fetchNotesFromBackend(),
// and updated optimistically during ZK operations.
// ─────────────────────────────────────────────────────────────

// Event name for note changes
export const ZK_NOTES_CHANGED_EVENT = "zk-notes-changed";

/**
 * Dispatch an event when notes change so components can react.
 */
function notifyNotesChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ZK_NOTES_CHANGED_EVENT));
}

// In-memory note cache — populated from backend, updated during operations
let noteCache: ShieldedNote[] = [];

export const getStoredNotes = (): ShieldedNote[] => {
  return noteCache;
};

export const saveNote = (note: ShieldedNote) => {
  // Avoid duplicates by commitment
  if (noteCache.find((n) => n.commitment === note.commitment)) return;
  noteCache = [...noteCache, note];
  notifyNotesChanged();
};

export const updateNote = (commitment: string, updates: Partial<ShieldedNote>) => {
  const index = noteCache.findIndex((n) => n.commitment === commitment);
  if (index === -1) return;
  noteCache = noteCache.map((n, i) =>
    i === index ? { ...n, ...updates } : n
  );
  notifyNotesChanged();
};

export const removeNote = (nullifier: string) => {
  noteCache = noteCache.filter((n) => n.nullifier !== nullifier);
  notifyNotesChanged();
};

// ─────────────────────────────────────────────────────────────
// Backend Sync Functions
// ─────────────────────────────────────────────────────────────

/**
 * Saves a note to the backend (encrypted) and updates in-memory cache.
 */
export async function syncNoteToBackend(
  note: ShieldedNote,
  poolAddress: string
): Promise<void> {
  // Update in-memory cache immediately
  saveNote(note);

  // If no encryption key, skip backend sync
  if (!cachedKey) {
    console.warn("No encryption key available, skipping backend sync");
    return;
  }

  try {
    const encryptedData = await encryptData(JSON.stringify(note), cachedKey);

    const dto: StoreNoteDto = {
      poolAddress,
      commitment: note.commitment,
      encryptedData,
      noteType: note.type === "SOL" ? "shield" : "swap",
    };

    await zkApi.storeNote(dto);
    console.log("Note synced to backend:", note.commitment.substring(0, 16) + "...");
  } catch (error) {
    console.error("Failed to sync note to backend:", error);
  }
}

/**
 * Pushes notes to the backend that only exist in memory (recovery path).
 */
async function pushNotesToBackend(notes: ShieldedNote[]): Promise<void> {
  if (!cachedKey) return;

  for (const note of notes) {
    try {
      const encryptedData = await encryptData(JSON.stringify(note), cachedKey);
      const poolAddress = note.poolAddress || note.market || "unknown";

      const dto: StoreNoteDto = {
        poolAddress,
        commitment: note.commitment,
        encryptedData,
        noteType: note.type === "SOL" ? "shield" : "swap",
      };

      await zkApi.storeNote(dto);
    } catch (error: unknown) {
      // Ignore conflict errors (note already exists)
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 409) continue;
      }
      console.error("[ZK Sync] Failed to push note:", note.commitment.substring(0, 16), error);
    }
  }
}

/**
 * Fetches notes from the backend and populates the in-memory cache.
 * Call this on app load/login to restore notes.
 */
export async function fetchNotesFromBackend(poolAddress?: string): Promise<ShieldedNote[]> {
  console.log("[ZK Sync] Starting fetchNotesFromBackend, hasKey:", !!cachedKey);

  if (!cachedKey) {
    console.warn("[ZK Sync] No encryption key available, cache stays as-is");
    return noteCache;
  }

  try {
    const backendNotes = await zkApi.getNotes({ poolAddress, unspentOnly: false });
    console.log("[ZK Sync] Fetched", backendNotes.length, "notes from backend");

    const decryptedNotes: ShieldedNote[] = [];
    let decryptFailCount = 0;

    for (const note of backendNotes) {
      try {
        const decrypted = await decryptData(note.encryptedData, cachedKey);
        const parsed = JSON.parse(decrypted) as ShieldedNote;
        // Sync spent status from backend (backend is authoritative)
        if (note.spent && !parsed.isSpent) {
          parsed.isSpent = true;
        }
        decryptedNotes.push(parsed);
      } catch (e) {
        decryptFailCount++;
        console.error("[ZK Sync] Failed to decrypt note:", note.commitment.substring(0, 16), e);
      }
    }

    console.log("[ZK Sync] Decrypted", decryptedNotes.length, "notes, failed:", decryptFailCount);

    // Replace in-memory cache with backend data
    noteCache = decryptedNotes;
    notifyNotesChanged();

    return noteCache;
  } catch (error) {
    console.error("[ZK Sync] Failed to fetch notes from backend:", error);
    return noteCache;
  }
}

/**
 * Marks a note as spent in both in-memory cache and backend.
 */
export async function markNoteAsSpent(commitment: string): Promise<void> {
  // Update in-memory cache
  updateNote(commitment, { isSpent: true });

  // Only sync to backend if authenticated (protected endpoint)
  if (!isAuthenticated()) {
    console.log("Not authenticated, skipping backend sync for spent status");
    return;
  }

  // Skip if no encryption key (can't sync notes without it)
  if (!cachedKey) {
    console.log("No encryption key, skipping backend sync for spent status");
    return;
  }

  // Sync to backend
  try {
    await zkApi.markNoteSpent(commitment);
    console.log("Note marked spent in backend:", commitment.substring(0, 16) + "...");
  } catch (error: unknown) {
    // Handle 404 - note doesn't exist in backend yet, try to push it first
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 404) {
        console.log("Note not found in backend, attempting to push first...");
        const note = noteCache.find((n) => n.commitment === commitment);
        if (note) {
          try {
            await pushNotesToBackend([note]);
            await zkApi.markNoteSpent(commitment);
            console.log("Note pushed and marked spent in backend:", commitment.substring(0, 16) + "...");
          } catch (syncError) {
            console.error("Failed to push and mark note spent:", syncError);
          }
        }
        return;
      }
    }
    console.error("Failed to mark note spent in backend:", error);
  }
}

/**
 * Removes a note from in-memory cache and backend.
 */
export async function removeNoteCompletely(
  nullifier: string,
  commitment: string
): Promise<void> {
  // Remove from in-memory cache
  removeNote(nullifier);

  // Remove from backend
  try {
    await zkApi.deleteNote(commitment);
    console.log("Note deleted from backend:", commitment.substring(0, 16) + "...");
  } catch (error) {
    console.error("Failed to delete note from backend:", error);
  }
}

// ─────────────────────────────────────────────────────────────
// Pool State Reading & Commitment Indexing
// ─────────────────────────────────────────────────────────────

import { Connection, PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

/**
 * Pool state read from on-chain account
 */
export interface OnChainPoolState {
  batchNumber: number;
  batchRoot: string; // On-chain batch root (Rust poseidon) - hex
  batchLeaves: string[]; // 16 leaves as hex strings
  peaks: string[]; // Peaks as hex strings
  peakDepths: number[];
  peaksCount: number;
  lastSmallTreeRoot: string; // Root of the last finalized batch (offset 608-640) - hex
}

/**
 * Reads the full pool state from on-chain account.
 * This is the AUTHORITATIVE source for pool state.
 */
export async function readPoolStateFromChain(
  connection: Connection,
  poolAddress: PublicKey
): Promise<OnChainPoolState> {
  const accountInfo = await connection.getAccountInfo(poolAddress);
  if (!accountInfo) {
    throw new Error(`Pool not found: ${poolAddress.toBase58()}`);
  }

  const data = accountInfo.data;

  // Parse batch leaves (offset 40, 16 x 32 bytes)
  const batchLeaves: string[] = [];
  for (let i = 0; i < 16; i++) {
    const start = 40 + i * 32;
    const bytes = data.slice(start, start + 32);
    batchLeaves.push(Buffer.from(bytes).toString("hex").padStart(64, "0"));
  }

  // Parse on-chain batch root (offset 8-40)
  const batchRoot = Buffer.from(data.slice(8, 40)).toString("hex").padStart(64, "0");

  // Parse last_small_tree_root (offset 608-640, 32 bytes)
  // This is the root of the most recently finalized batch, computed by on-chain Poseidon
  const lastSmallTreeRoot = Buffer.from(data.slice(608, 640)).toString("hex").padStart(64, "0");

  // Parse batch number (offset 640, 8 bytes LE)
  const batchNumber = new BN(data.slice(640, 648), "le").toNumber();

  // Parse peaks (offset 648, 26 x 32 bytes)
  const PEAKS_OFFSET = 648;
  const DEPTHS_OFFSET = 1480; // 648 + 26*32
  const COUNT_OFFSET = 1506; // 1480 + 26

  const peaksCount = data[COUNT_OFFSET];
  const peaks: string[] = [];
  const peakDepths: number[] = [];

  for (let i = 0; i < peaksCount; i++) {
    peaks.push(Buffer.from(data.slice(PEAKS_OFFSET + i * 32, PEAKS_OFFSET + i * 32 + 32)).toString("hex").padStart(64, "0"));
    peakDepths.push(data[DEPTHS_OFFSET + i]);
  }

  return {
    batchNumber,
    batchRoot,
    batchLeaves,
    peaks,
    peakDepths,
    peaksCount,
    lastSmallTreeRoot,
  };
}

/**
 * Finds the index of a commitment in the current batch leaves.
 * Returns -1 if not found.
 */
export function findCommitmentInBatch(batchLeaves: string[], commitment: string): number {
  const normalizedCommitment = commitment.toLowerCase().padStart(64, "0");
  return batchLeaves.findIndex(
    (leaf) => leaf.toLowerCase().padStart(64, "0") === normalizedCommitment
  );
}

// Track the last known batch number per pool for rollover detection
const lastKnownBatch: Map<string, number> = new Map();

/**
 * Saves the current pool state as a batch snapshot to the backend.
 * Call this AFTER each shielded operation to ensure we have the on-chain batch root.
 * Also detects batch rollovers and logs warnings.
 */
export async function saveCurrentPoolSnapshot(
  connection: Connection,
  poolAddress: PublicKey,
  marketAddress: string,
  transactionId?: string
): Promise<{ batchNumber: number; batchRoot: string } | null> {
  try {
    const poolAddressStr = poolAddress.toBase58();
    const state = await readPoolStateFromChain(connection, poolAddress);

    // Detect batch rollover and save finalized batch root
    const lastBatch = lastKnownBatch.get(poolAddressStr);
    if (lastBatch !== undefined && state.batchNumber > lastBatch) {
      console.log(`Batch rollover detected: ${lastBatch} -> ${state.batchNumber}`);

      // Save the FINALIZED previous batch with lastSmallTreeRoot (the correct on-chain root)
      // This is critical because after rollover, state.batchRoot is for the new (empty) batch
      const ZERO_ROOT = "0".repeat(64);
      if (state.lastSmallTreeRoot !== ZERO_ROOT) {
        const prevBatchNumber = state.batchNumber - 1;
        try {
          // Fetch existing snapshot to preserve its leaves, then update with correct root
          let prevLeaves: string[] = Array(16).fill(ZERO_ROOT);
          try {
            const existingSnapshot = await zkApi.getBatchSnapshot(poolAddressStr, prevBatchNumber);
            prevLeaves = existingSnapshot.leaves;
          } catch {
            // No existing snapshot — leaves will be zeros (better than nothing)
          }
          await zkApi.storeBatchSnapshot({
            poolAddress: poolAddressStr,
            batchNumber: prevBatchNumber,
            batchRoot: state.lastSmallTreeRoot, // Correct finalized root from on-chain
            leaves: prevLeaves,
            peaks: state.peaks,
            peakDepths: state.peakDepths,
            transactionId,
          });
          console.log(`Saved finalized batch ${prevBatchNumber} root: ${state.lastSmallTreeRoot.slice(0, 16)}...`);
        } catch {
          console.warn(`Failed to save finalized batch ${prevBatchNumber} snapshot`);
        }
      }
    }
    lastKnownBatch.set(poolAddressStr, state.batchNumber);

    // Save the current batch snapshot with ON-CHAIN batch root
    await zkApi.storeBatchSnapshot({
      poolAddress: poolAddressStr,
      batchNumber: state.batchNumber,
      batchRoot: state.batchRoot, // In-progress batch root
      leaves: state.batchLeaves,
      peaks: state.peaks,
      peakDepths: state.peakDepths,
      transactionId,
    });

    console.log(`Saved pool snapshot: batch ${state.batchNumber}, root ${state.batchRoot.slice(0, 16)}...`);
    return { batchNumber: state.batchNumber, batchRoot: state.batchRoot };
  } catch (error: unknown) {
    // Ignore conflict errors (snapshot already exists - backend upserts)
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 409) {
        return null;
      }
    }
    console.warn("Failed to save pool snapshot:", error);
    return null;
  }
}

/**
 * Pre-save pool state BEFORE an operation.
 * This ensures we capture the batch state before it potentially rolls over.
 * Returns the current batch number so we can detect rollovers later.
 */
export async function preSavePoolState(
  connection: Connection,
  poolAddress: PublicKey,
  marketAddress: string
): Promise<number> {
  try {
    const result = await saveCurrentPoolSnapshot(connection, poolAddress, marketAddress);
    return result?.batchNumber ?? 0;
  } catch (e) {
    console.warn("Failed to pre-save pool state:", e);
    return 0;
  }
}

/**
 * Indexes a commitment with CORRECT leaf index by finding it in on-chain batch leaves.
 * This is more reliable than trying to guess the index.
 *
 * Handles batch rollover by retrying and checking previous batch snapshots.
 */
export async function indexCommitmentFromChain(
  connection: Connection,
  poolAddress: PublicKey,
  marketAddress: string,
  commitment: string,
  transactionId: string,
  expectedBatchNumber?: number // Optional: batch number at time of transaction
): Promise<{ batchNumber: number; leafIndex: number } | null> {
  const poolAddressStr = poolAddress.toBase58();
  const normalizedCommitment = commitment.toLowerCase().padStart(64, "0");

  // Retry logic for RPC propagation delay
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      console.log(`Retry ${attempt}/3: waiting for RPC to propagate...`);
      await new Promise(r => setTimeout(r, 2000));
    }

    try {
      const state = await readPoolStateFromChain(connection, poolAddress);

      // Find the commitment in the current batch
      let leafIndex = findCommitmentInBatch(state.batchLeaves, normalizedCommitment);

      if (leafIndex !== -1) {
        // Found in current batch - index it
        try {
          await zkApi.storeCommitment({
            poolAddress: poolAddressStr,
            marketAddress,
            commitment: normalizedCommitment,
            leafIndex,
            batchNumber: state.batchNumber,
            transactionId,
          });
          console.log(`Indexed commitment at batch ${state.batchNumber}, leaf ${leafIndex}`);
        } catch (e: unknown) {
          // Ignore conflict errors
          if (e && typeof e === "object" && "response" in e) {
            const axiosError = e as { response?: { status?: number } };
            if (axiosError.response?.status !== 409) throw e;
          }
        }

        // Save the current pool snapshot with ON-CHAIN batch root
        await saveCurrentPoolSnapshot(connection, poolAddress, marketAddress, transactionId);

        return { batchNumber: state.batchNumber, leafIndex };
      }

      // Not found in current batch - check if batch rolled over
      if (expectedBatchNumber !== undefined && state.batchNumber > expectedBatchNumber) {
        console.log(`Batch rolled over: expected ${expectedBatchNumber}, now ${state.batchNumber}`);

        // Save the current (post-rollover) pool snapshot for the new batch
        await saveCurrentPoolSnapshot(connection, poolAddress, marketAddress, transactionId);

        const prevBatchNumber = state.batchNumber - 1;
        try {
          const prevSnapshot = await zkApi.getBatchSnapshot(poolAddressStr, prevBatchNumber);

          // First check if commitment is already in the snapshot
          leafIndex = findCommitmentInBatch(prevSnapshot.leaves, normalizedCommitment);

          if (leafIndex === -1) {
            // Commitment NOT in snapshot — it was the leaf that triggered the rollover.
            // The snapshot was saved before this operation, so it has N-1 leaves.
            // Find the first empty slot and place the commitment there.
            const ZERO_LEAF = "0".repeat(64);
            const emptyIndex = prevSnapshot.leaves.findIndex(
              (l) => l.padStart(64, "0") === ZERO_LEAF
            );

            if (emptyIndex !== -1) {
              leafIndex = emptyIndex;

              // Reconstruct the complete batch with the new commitment
              const completedLeaves = [...prevSnapshot.leaves];
              completedLeaves[emptyIndex] = normalizedCommitment;

              // Use on-chain lastSmallTreeRoot (computed by Rust Poseidon) instead of
              // JS computeBatchRootFromLeaves which may produce different hashes
              const correctedBatchRoot = state.lastSmallTreeRoot;

              // Save the corrected snapshot with complete data
              try {
                await zkApi.storeBatchSnapshot({
                  poolAddress: poolAddressStr,
                  batchNumber: prevBatchNumber,
                  batchRoot: correctedBatchRoot,
                  leaves: completedLeaves,
                  peaks: state.peaks,
                  peakDepths: state.peakDepths,
                  transactionId,
                });
                console.log(`Fixed rollover snapshot: batch ${prevBatchNumber} now has all 16 leaves, root ${correctedBatchRoot.slice(0, 16)}...`);
              } catch {
                console.warn("Failed to save corrected rollover snapshot");
              }
            }
          }

          if (leafIndex !== -1) {
            try {
              await zkApi.storeCommitment({
                poolAddress: poolAddressStr,
                marketAddress,
                commitment: normalizedCommitment,
                leafIndex,
                batchNumber: prevBatchNumber,
                transactionId,
              });
              console.log(`Indexed commitment in previous batch ${prevBatchNumber}, leaf ${leafIndex}`);
            } catch (e: unknown) {
              if (e && typeof e === "object" && "response" in e) {
                const axiosError = e as { response?: { status?: number } };
                if (axiosError.response?.status !== 409) throw e;
              }
            }
            return { batchNumber: prevBatchNumber, leafIndex };
          }
        } catch {
          // No previous snapshot exists — try to reconstruct from backend commitments
          console.warn(`No snapshot for batch ${prevBatchNumber}, attempting to reconstruct...`);
          try {
            const commitments = await zkApi.getCommitments(poolAddressStr);
            const batchCommitments = commitments
              .filter((c) => c.batchNumber === prevBatchNumber)
              .sort((a, b) => a.leafIndex - b.leafIndex);

            // Build leaves array from existing commitments + new commitment
            const reconstructedLeaves: string[] = Array(16).fill("0".repeat(64));
            for (const c of batchCommitments) {
              reconstructedLeaves[c.leafIndex] = c.commitment.padStart(64, "0");
            }

            // Find empty slot for the new commitment
            const emptyIndex = reconstructedLeaves.findIndex(
              (l) => l === "0".repeat(64)
            );
            if (emptyIndex !== -1) {
              leafIndex = emptyIndex;
              reconstructedLeaves[emptyIndex] = normalizedCommitment;

              // Use on-chain lastSmallTreeRoot instead of JS-computed batch root
              const batchRoot = state.lastSmallTreeRoot;
              try {
                await zkApi.storeBatchSnapshot({
                  poolAddress: poolAddressStr,
                  batchNumber: prevBatchNumber,
                  batchRoot,
                  leaves: reconstructedLeaves,
                  peaks: state.peaks,
                  peakDepths: state.peakDepths,
                  transactionId,
                });
                console.log(`Reconstructed snapshot for batch ${prevBatchNumber} from commitments`);
              } catch {
                console.warn("Failed to save reconstructed snapshot");
              }

              try {
                await zkApi.storeCommitment({
                  poolAddress: poolAddressStr,
                  marketAddress,
                  commitment: normalizedCommitment,
                  leafIndex,
                  batchNumber: prevBatchNumber,
                  transactionId,
                });
                console.log(`Indexed commitment in reconstructed batch ${prevBatchNumber}, leaf ${leafIndex}`);
              } catch (e: unknown) {
                if (e && typeof e === "object" && "response" in e) {
                  const axiosError = e as { response?: { status?: number } };
                  if (axiosError.response?.status !== 409) throw e;
                }
              }
              return { batchNumber: prevBatchNumber, leafIndex };
            }
          } catch (reconstructErr) {
            console.warn("Failed to reconstruct batch from commitments:", reconstructErr);
          }
        }
      }

      // Still not found - check database in case it was already indexed
      try {
        const existing = await zkApi.getMerkleProof(poolAddressStr, normalizedCommitment);
        console.log(`Found commitment in database: batch ${existing.batchNumber}, leaf ${existing.leafIndex}`);
        return { batchNumber: existing.batchNumber, leafIndex: existing.leafIndex };
      } catch {
        // Not in database either
      }

      console.warn(`Commitment not found in batch leaves: ${normalizedCommitment.slice(0, 16)}...`);
      console.warn("Current batch leaves:", state.batchLeaves.map(l => l.slice(0, 16)));

    } catch (error: unknown) {
      // Ignore conflict errors (commitment already indexed)
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 409) {
          console.log("Commitment already indexed");
          try {
            const existing = await zkApi.getMerkleProof(poolAddressStr, normalizedCommitment);
            return { batchNumber: existing.batchNumber, leafIndex: existing.leafIndex };
          } catch {
            return null;
          }
        }
      }
      console.error("Error indexing commitment:", error);
    }
  }

  console.error("Failed to index commitment after retries");
  return null;
}

/**
 * Gets the position of a commitment from the database.
 * Returns null if not found.
 */
export async function getCommitmentPosition(
  poolAddress: string,
  commitment: string
): Promise<{ batchNumber: number; leafIndex: number; globalLeafIndex: number } | null> {
  try {
    const proof = await zkApi.getMerkleProof(poolAddress, commitment.padStart(64, "0"));
    return {
      batchNumber: proof.batchNumber,
      leafIndex: proof.leafIndex,
      globalLeafIndex: proof.globalLeafIndex,
    };
  } catch {
    return null;
  }
}

/**
 * Indexes a commitment in the backend after a successful shield/swap transaction.
 * @deprecated Use indexCommitmentFromChain for more reliable indexing
 */
export async function indexCommitment(params: {
  poolAddress: string;
  marketAddress: string;
  commitment: string;
  leafIndex: number;
  batchNumber: number;
  transactionId: string;
}): Promise<void> {
  try {
    await zkApi.storeCommitment(params);
    console.log("Commitment indexed:", params.commitment.substring(0, 16) + "...");
  } catch (error: unknown) {
    // Ignore conflict errors (commitment already indexed)
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 409) {
        console.log("Commitment already indexed");
        return;
      }
    }
    console.error("Failed to index commitment:", error);
  }
}

// ─────────────────────────────────────────────────────────────
// Legacy Export (Backward Compatibility)
// ─────────────────────────────────────────────────────────────

export const ZKStorage = {
  // In-memory cache operations (populated from backend)
  getNotes: getStoredNotes,
  getSolNotes: () => getStoredNotes().filter((n) => n.type === "SOL" && !n.isSpent),
  getTokenNotes: (market: string) =>
    getStoredNotes().filter((n) => n.type !== "SOL" && !n.isSpent && n.market === market),
  addNote: saveNote,
  updateNote: updateNote,
  removeNote: removeNote,

  // Backend sync operations
  setEncryptionKey,
  hasEncryptionKey,
  restoreEncryptionKey,
  clearEncryptionKey,
  syncNoteToBackend,
  fetchNotesFromBackend,
  markNoteAsSpent,
  removeNoteCompletely,
  indexCommitment,

  // Pool state operations
  readPoolStateFromChain,
  findCommitmentInBatch,
  saveCurrentPoolSnapshot,
  preSavePoolState,
  indexCommitmentFromChain,
  getCommitmentPosition,
};
