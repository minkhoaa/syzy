/**
 * Mock handlers for ZK (zero-knowledge) endpoints
 *
 * POST /api/zk/commitments        (single)
 * POST /api/zk/commitments/batch  (batch)
 * POST /api/zk/notes
 * GET  /api/zk/notes
 * GET  /api/zk/notes/:commitment
 * PUT  /api/zk/notes/:commitment/spent
 * GET  /api/zk/commitments/:poolAddress
 * GET  /api/zk/commitments/:poolAddress/batch/:batchNumber
 * GET  /api/zk/merkle-proof/:poolAddress/:commitment
 * GET  /api/zk/merkle-tree/:poolAddress
 * GET  /api/zk/batch-snapshots/:poolAddress
 * GET  /api/zk/batch-snapshots/:poolAddress/:batchNumber
 * GET  /api/zk/batch-snapshots/:poolAddress/latest
 * GET  /api/zk/stats/:poolAddress
 * GET  /api/zk/pools/:poolAddress/batch-status
 * POST /api/zk/nullifiers/:poolAddress/:nullifierHash
 * POST /api/zk/generate-proof
 * DELETE /api/zk/notes/:commitment
 */

import { success, fakePublicKey } from '../utils';

const ZERO_HASH = '0x' + '0'.repeat(64);

export function handleStoreCommitment() {
  return success({ id: 'mock-commitment-' + Date.now() });
}

export function handleStoreCommitments() {
  return success({
    ids: ['mock-commitment-1-' + Date.now(), 'mock-commitment-2-' + Date.now()],
  });
}

export function handleStoreNote() {
  return success({ id: 'mock-note-' + Date.now() });
}

export function handleGetNotes() {
  return success([]);
}

export function handleGetNoteByCommitment(_commitment: string) {
  return success(null);
}

export function handleMarkNoteSpent(_commitment: string) {
  return success({ success: true });
}

export function handleDeleteNote(_commitment: string) {
  return success({ success: true });
}

export function handleGetCommitments(_poolAddress: string) {
  return success([]);
}

export function handleGetCommitmentsByBatch(_poolAddress: string, _batchNumber: string) {
  return success([]);
}

export function handleGetMerkleProof(_poolAddress: string, commitment: string) {
  return success({
    root: ZERO_HASH,
    proof: [ZERO_HASH, ZERO_HASH, ZERO_HASH],
    index: 0,
    commitment,
  });
}

export function handleGetMerkleTree(_poolAddress: string) {
  return success({
    root: ZERO_HASH,
    leaves: [],
    depth: 30,
  });
}

export function handleGetBatchSnapshots(_poolAddress: string) {
  return success([]);
}

export function handleGetBatchSnapshot(_poolAddress: string, batchNumber: string) {
  return success({
    batchNumber: Number(batchNumber),
    root: ZERO_HASH,
    leaves: [],
    peaks: [],
    createdAt: new Date().toISOString(),
  });
}

export function handleGetLatestBatchSnapshot(_poolAddress: string) {
  return success({
    batchNumber: 0,
    root: ZERO_HASH,
    leaves: [],
    peaks: [],
    createdAt: new Date().toISOString(),
  });
}

export function handleGetPoolStats(_poolAddress: string) {
  return success({
    totalDeposits: 5,
    totalCommitments: 12,
    currentBatch: 0,
    poolAddress: _poolAddress || fakePublicKey(),
  });
}

export function handleGetBatchStatus(_poolAddress: string) {
  return success({
    currentBatch: 0,
    batchSize: 16,
    slotsUsed: 3,
    slotsAvailable: 13,
  });
}

export function handleCheckNullifier(_poolAddress: string, _nullifierHash: string) {
  return success({ used: false });
}

export function handleGenerateProof() {
  return success({
    proof: {
      pi_a: [ZERO_HASH, ZERO_HASH, '1'],
      pi_b: [[ZERO_HASH, ZERO_HASH], [ZERO_HASH, ZERO_HASH], ['1', '0']],
      pi_c: [ZERO_HASH, ZERO_HASH, '1'],
      protocol: 'groth16',
      curve: 'bn128',
    },
    publicSignals: [ZERO_HASH],
  });
}
