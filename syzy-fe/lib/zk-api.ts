/**
 * ZK Module API Client
 *
 * Provides typed functions for interacting with the ZK backend endpoints.
 * These endpoints handle commitment indexing, Merkle tree reconstruction,
 * and encrypted note storage.
 */

import { apiClient } from "@/lib/kubb";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface ZkCommitment {
  id: string;
  poolAddress: string;
  marketAddress: string;
  commitment: string;
  leafIndex: number;
  batchNumber: number;
  transactionId: string;
  createdAt: string;
}

export interface StoreCommitmentDto {
  poolAddress: string;
  marketAddress: string;
  commitment: string;
  leafIndex: number;
  batchNumber: number;
  transactionId: string;
}

export interface ZkEncryptedNote {
  id: string;
  userId: string;
  poolAddress: string;
  commitment: string;
  encryptedData: string;
  noteType?: string;
  spent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoreNoteDto {
  poolAddress: string;
  commitment: string;
  encryptedData: string;
  noteType?: string;
}

export interface UpdateNoteDto {
  encryptedData?: string;
  spent?: boolean;
}

export interface MerkleTreeData {
  poolAddress: string;
  totalCommitments: number;
  latestBatch: number;
  batches: Record<number, { commitment: string; leafIndex: number }[]>;
  leaves: string[];
}

export interface MerkleProofData {
  commitment: string;
  leafIndex: number;
  batchNumber: number;
  globalLeafIndex: number;
  leaves: string[];
}

export interface PoolStats {
  poolAddress: string;
  totalCommitments: number;
  totalNullifiers: number;
  latestBatch: number;
  lastActivity: string | null;
}

export interface BatchStatus {
  poolAddress: string;
  batches: Array<{
    batchNumber: number;
    hasSnapshot: boolean;
    isComplete: boolean;
    commitmentCount: number;
    missingIndices: number[];
  }>;
}

export interface NullifierStatus {
  used: boolean;
}

export interface ZkBatchSnapshot {
  id: string;
  poolAddress: string;
  batchNumber: number;
  batchRoot: string;
  leaves: string[];
  peaks: string[];
  peakDepths: number[];
  transactionId: string | null;
  createdAt: string;
}

export interface StoreBatchSnapshotDto {
  poolAddress: string;
  batchNumber: number;
  batchRoot: string;
  leaves: string[];
  peaks: string[];
  peakDepths: number[];
  transactionId?: string;
}

// ─────────────────────────────────────────────────────────────
// API Functions - Commitments (Public)
// ─────────────────────────────────────────────────────────────

// Helper type for backend wrapped responses
type WrappedResponse<T> = { success: boolean; data: T };

export async function storeCommitment(data: StoreCommitmentDto): Promise<ZkCommitment> {
  const response = await apiClient.post<WrappedResponse<ZkCommitment>>("/api/zk/commitments", data);
  return response.data.data;
}

export async function storeCommitments(data: StoreCommitmentDto[]): Promise<{ count: number }> {
  const response = await apiClient.post<WrappedResponse<{ count: number }>>("/api/zk/commitments/batch", data);
  return response.data.data;
}

export async function getCommitments(poolAddress: string): Promise<ZkCommitment[]> {
  const response = await apiClient.get<WrappedResponse<ZkCommitment[]>>(`/api/zk/commitments/${poolAddress}`);
  return response.data.data;
}

export async function getCommitmentsByBatch(
  poolAddress: string,
  batchNumber: number
): Promise<ZkCommitment[]> {
  const response = await apiClient.get<WrappedResponse<ZkCommitment[]>>(
    `/api/zk/commitments/${poolAddress}/batch/${batchNumber}`
  );
  return response.data.data;
}

// ─────────────────────────────────────────────────────────────
// API Functions - Merkle Tree (Public)
// ─────────────────────────────────────────────────────────────

export async function getMerkleTree(poolAddress: string): Promise<MerkleTreeData> {
  const response = await apiClient.get<WrappedResponse<MerkleTreeData>>(`/api/zk/merkle-tree/${poolAddress}`);
  return response.data.data;
}

export async function getMerkleProof(
  poolAddress: string,
  commitment: string
): Promise<MerkleProofData> {
  const response = await apiClient.get<WrappedResponse<MerkleProofData>>(
    `/api/zk/merkle-proof/${poolAddress}/${commitment}`
  );
  return response.data.data;
}

export async function getPoolStats(poolAddress: string): Promise<PoolStats> {
  const response = await apiClient.get<WrappedResponse<PoolStats>>(`/api/zk/stats/${poolAddress}`);
  return response.data.data;
}

export async function getBatchStatus(poolAddress: string): Promise<BatchStatus> {
  const response = await apiClient.get<WrappedResponse<BatchStatus>>(`/api/zk/pools/${poolAddress}/batch-status`);
  return response.data.data;
}

// ─────────────────────────────────────────────────────────────
// API Functions - Nullifiers (Public)
// ─────────────────────────────────────────────────────────────

export async function isNullifierUsed(
  poolAddress: string,
  nullifierHash: string
): Promise<NullifierStatus> {
  const response = await apiClient.get<WrappedResponse<NullifierStatus>>(
    `/api/zk/nullifiers/${poolAddress}/${nullifierHash}`
  );
  return response.data.data;
}

export async function markNullifierUsed(
  poolAddress: string,
  nullifierHash: string
): Promise<void> {
  await apiClient.post("/api/zk/nullifiers", { poolAddress, nullifierHash });
}

// ─────────────────────────────────────────────────────────────
// API Functions - Batch Snapshots (Public)
// ─────────────────────────────────────────────────────────────

export async function storeBatchSnapshot(data: StoreBatchSnapshotDto): Promise<ZkBatchSnapshot> {
  const response = await apiClient.post<WrappedResponse<ZkBatchSnapshot>>("/api/zk/batch-snapshots", data);
  return response.data.data;
}

export async function getBatchSnapshots(poolAddress: string): Promise<ZkBatchSnapshot[]> {
  const response = await apiClient.get<WrappedResponse<ZkBatchSnapshot[]>>(`/api/zk/batch-snapshots/${poolAddress}`);
  return response.data.data;
}

export async function getBatchSnapshot(poolAddress: string, batchNumber: number): Promise<ZkBatchSnapshot> {
  const response = await apiClient.get<WrappedResponse<ZkBatchSnapshot>>(`/api/zk/batch-snapshots/${poolAddress}/${batchNumber}`);
  return response.data.data;
}

export async function getLatestBatchSnapshot(poolAddress: string): Promise<ZkBatchSnapshot | null> {
  try {
    const response = await apiClient.get<WrappedResponse<ZkBatchSnapshot | null>>(`/api/zk/batch-snapshots/${poolAddress}/latest`);
    return response.data.data;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// API Functions - Encrypted Notes (Protected)
// ─────────────────────────────────────────────────────────────

export async function storeNote(data: StoreNoteDto): Promise<ZkEncryptedNote> {
  const response = await apiClient.post<WrappedResponse<ZkEncryptedNote>>("/api/zk/notes", data);
  return response.data.data;
}

export async function getNotes(params?: {
  poolAddress?: string;
  unspentOnly?: boolean;
}): Promise<ZkEncryptedNote[]> {
  const searchParams = new URLSearchParams();
  if (params?.poolAddress) {
    searchParams.set("poolAddress", params.poolAddress);
  }
  if (params?.unspentOnly) {
    searchParams.set("unspentOnly", "true");
  }
  const query = searchParams.toString();
  const url = query ? `/api/zk/notes?${query}` : "/api/zk/notes";
  const response = await apiClient.get<WrappedResponse<ZkEncryptedNote[]>>(url);
  return response.data.data;
}

export async function getNoteByCommitment(commitment: string): Promise<ZkEncryptedNote> {
  const response = await apiClient.get<WrappedResponse<ZkEncryptedNote>>(`/api/zk/notes/${commitment}`);
  return response.data.data;
}

export async function updateNote(
  commitment: string,
  data: UpdateNoteDto
): Promise<ZkEncryptedNote> {
  const response = await apiClient.patch<WrappedResponse<ZkEncryptedNote>>(`/api/zk/notes/${commitment}`, data);
  return response.data.data;
}

export async function markNoteSpent(commitment: string): Promise<ZkEncryptedNote> {
  const response = await apiClient.patch<WrappedResponse<ZkEncryptedNote>>(`/api/zk/notes/${commitment}/spent`);
  return response.data.data;
}

export async function deleteNote(commitment: string): Promise<void> {
  await apiClient.delete(`/api/zk/notes/${commitment}`);
}

// ─────────────────────────────────────────────────────────────
// Convenience Exports
// ─────────────────────────────────────────────────────────────

export const zkApi = {
  // Commitments
  storeCommitment,
  storeCommitments,
  getCommitments,
  getCommitmentsByBatch,

  // Merkle Tree
  getMerkleTree,
  getMerkleProof,
  getPoolStats,
  getBatchStatus,

  // Nullifiers
  isNullifierUsed,
  markNullifierUsed,

  // Batch Snapshots
  storeBatchSnapshot,
  getBatchSnapshots,
  getBatchSnapshot,
  getLatestBatchSnapshot,

  // Notes
  storeNote,
  getNotes,
  getNoteByCommitment,
  updateNote,
  markNoteSpent,
  deleteNote,
};
