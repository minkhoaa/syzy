/**
 * Mock system utility helpers
 *
 * Provides delay simulation, fake Solana-style identifiers,
 * and standard response wrappers matching the backend format.
 */

import type { ResponseConfig } from '@/lib/kubb';

// ── Delay helpers ─────────────────────────────────────────────

/** Simulate network latency with a fixed delay. */
export function delay(ms: number = 200): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Simulate variable network latency between `min` and `max` ms. */
export function randomDelay(min: number = 100, max: number = 400): Promise<void> {
  const ms = min + Math.random() * (max - min);
  return delay(ms);
}

// ── Fake Solana identifiers ───────────────────────────────────

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function randomBase58(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += BASE58_ALPHABET[Math.floor(Math.random() * BASE58_ALPHABET.length)];
  }
  return result;
}

/** Generate a realistic-looking base58-encoded transaction signature (≈88 chars, 64 bytes). */
export function fakeTxSignature(): string {
  return randomBase58(88);
}

/** Generate a realistic-looking base58-encoded public key (≈44 chars, 32 bytes). */
export function fakePublicKey(): string {
  return randomBase58(44);
}

// ── Response wrappers ─────────────────────────────────────────

/** Wrap data in the backend's standard `{ success: true, data }` envelope. */
export function success<T>(data: T): { success: true; data: T } {
  return { success: true, data };
}

/** Wrap a list in a paginated response matching the backend shape. */
export function paginated<T>(
  items: T[],
  page: number = 1,
  limit: number = 20,
): { success: true; data: T[]; meta: { page: number; limit: number; total: number; totalPages: number } } {
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const paginatedItems = items.slice(start, start + limit);

  return {
    success: true,
    data: paginatedItems,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

/** Wrap any payload in the Axios-style `ResponseConfig` shape. */
export function mockResponse<T>(data: T): ResponseConfig<T> {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
  };
}
