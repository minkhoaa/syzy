# ZK Merkle Tree Optimization Guide

## Problem Statement

When users perform ZK operations (shield, swap, split, sell, unshield), the frontend needs to reconstruct the Merkle tree to generate proofs. When a user's note is not in the current batch, the code falls back to fetching transaction history via Solana RPC, causing **429 rate limit errors**.

### Current Impact

```
User creates note → Immediately tries another operation
                            ↓
              Note NOT in current batch
                            ↓
         reconstructTreeFromHistory() called
                            ↓
         ~34 RPC calls per attempt × 5 retries
                            ↓
              170+ RPC calls = 429 errors
```

---

## Current Architecture

### File Locations

| File | Purpose |
|------|---------|
| `lib/zk/merkle-utils.ts` | Tree reconstruction (the bottleneck) |
| `lib/zk/token-split.ts` | Token split proof with 5 retries |
| `lib/zk/private-sell.ts` | Private sell proof with 5 retries |
| `lib/zk/private-swap.ts` | Private swap proof (no fallback) |
| `lib/zk/private-claim.ts` | Private claim proof (no fallback) |
| `lib/zk/unshield.ts` | Unshield proof with 5 retries |

### Current Flow

```
┌─ Fast Path: reconstructMerkleTree() ─────────────────┐
│  Location: merkle-utils.ts:289-356                   │
│  • getAccountInfo(): 1-4 calls                       │
│  • Returns current batch only (16 leaves)            │
│  • Cost: ~1-4 RPC calls                              │
└──────────────────────────────────────────────────────┘
                      ↓
              Note not found?
                      ↓
┌─ Slow Path: reconstructTreeFromHistory() ────────────┐
│  Location: merkle-utils.ts:359-407                   │
│  • getSignaturesForAddress(): 1 call (100 txs)       │
│  • getParsedTransactions(): ~33 calls (chunk size 3) │
│  • 1s delay between chunks                           │
│  • Cost: ~34 RPC calls per invocation                │
└──────────────────────────────────────────────────────┘
                      ↓
              Still not found?
                      ↓
┌─ Proof Function Retries ─────────────────────────────┐
│  Location: token-split.ts:51-63, etc.                │
│  • 5 retries with 2s delays                          │
│  • Each retry = full tree reconstruction             │
│  • Worst case: 5 × 34 = 170+ RPC calls               │
└──────────────────────────────────────────────────────┘
```

### Current Settings (Problematic)

| Setting | Current Value | Location | Issue |
|---------|---------------|----------|-------|
| Chunk size | 3 txs | merkle-utils.ts:388 | Too small, causes 33+ calls |
| Delay between chunks | 1000ms | merkle-utils.ts:389 | Too slow for UX |
| Rate limit backoff | 3000ms (fixed) | merkle-utils.ts:398 | Not exponential |
| Signature limit | 100 | merkle-utils.ts:364 | May be excessive |
| Proof retries | 5 | token-split.ts:51 | Multiplies RPC calls |
| Tree caching | None | - | Redundant fetches |

---

## Recommended Solutions

### Solution 1: Backend-Indexed Tree Service (Best for Scale)

**Approach**: Store all commitments in the backend database and provide an API endpoint.

#### Backend Changes (NestJS)

```typescript
// oyrade-be/src/modules/zk/zk.module.ts
@Module({
  imports: [PrismaModule],
  controllers: [ZkController],
  providers: [ZkService],
})
export class ZkModule {}

// oyrade-be/src/modules/zk/zk.controller.ts
@Controller('zk')
export class ZkController {
  @Get('merkle-tree/:poolAddress')
  async getMerkleTree(@Param('poolAddress') poolAddress: string) {
    return this.zkService.getMerkleTree(poolAddress);
  }
}

// oyrade-be/src/modules/zk/zk.service.ts
@Injectable()
export class ZkService {
  // Index commitments from on-chain events
  // Store in database with market association
  // Return pre-computed tree state
}
```

#### Database Schema

```prisma
model Commitment {
  id            String   @id @default(cuid())
  poolAddress   String
  commitment    String   @unique
  batchNumber   Int
  leafIndex     Int
  transactionId String
  createdAt     DateTime @default(now())

  @@index([poolAddress, batchNumber])
  @@index([commitment])
}
```

#### Frontend Changes

```typescript
// lib/zk/merkle-utils.ts
export const getMerkleTreeFromBackend = async (poolAddress: string) => {
  const response = await fetch(`${API_URL}/zk/merkle-tree/${poolAddress}`);
  const data = await response.json();
  return new MMRTree(data.leaves, data.peaks, data.peakDepths, data.batchNumber);
};

export const getMerkleTreeWithFallback = async (
  connection: Connection,
  poolAddress: PublicKey,
  noteCommitment?: string
) => {
  // 1. Try backend first (fast, no rate limits)
  try {
    return await getMerkleTreeFromBackend(poolAddress.toBase58());
  } catch (e) {
    console.warn('Backend tree fetch failed, falling back to RPC');
  }

  // 2. Fallback to RPC (existing logic)
  return await reconstructMerkleTree(connection, poolAddress);
};
```

**Pros**: Eliminates frontend RPC calls, scales to many users
**Cons**: Requires backend changes, needs indexer to stay in sync

---

### Solution 2: Local Commitment Cache (Frontend-Only)

**Approach**: Maintain a local Merkle tree state in localStorage/IndexedDB.

#### Implementation

```typescript
// lib/zk/tree-cache.ts
interface TreeCache {
  poolAddress: string;
  leaves: string[];
  peaks: string[];
  peakDepths: number[];
  batchNumber: number;
  lastUpdated: number;
}

const CACHE_KEY = 'oyrade_merkle_trees';
const CACHE_TTL = 60000; // 1 minute

export const getTreeFromCache = (poolAddress: string): TreeCache | null => {
  const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  const entry = cache[poolAddress];

  if (entry && Date.now() - entry.lastUpdated < CACHE_TTL) {
    return entry;
  }
  return null;
};

export const saveTreeToCache = (poolAddress: string, tree: MMRTree) => {
  const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  cache[poolAddress] = {
    poolAddress,
    leaves: tree.batchLeaves.map(l => l.toString('hex')),
    peaks: tree.peaks.map(p => p.toString('hex')),
    peakDepths: tree.peakDepths,
    batchNumber: tree.batchNumber,
    lastUpdated: Date.now(),
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
};

// After any note-creating transaction succeeds:
export const addCommitmentToCache = (poolAddress: string, commitment: string) => {
  const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  const entry = cache[poolAddress];

  if (entry && !entry.leaves.includes(commitment)) {
    entry.leaves.push(commitment);
    entry.lastUpdated = Date.now();
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  }
};
```

#### Usage in Proof Generation

```typescript
// lib/zk/merkle-utils.ts
export const getMerkleTreeWithFallback = async (
  connection: Connection,
  poolAddress: PublicKey,
  noteCommitment?: string
) => {
  // 1. Check local cache first
  const cached = getTreeFromCache(poolAddress.toBase58());
  if (cached && noteCommitment) {
    const found = cached.leaves.includes(noteCommitment);
    if (found) {
      console.log('Using cached tree');
      return MMRTree.fromCache(cached);
    }
  }

  // 2. Fetch from RPC
  const tree = await reconstructMerkleTree(connection, poolAddress);

  // 3. Save to cache
  saveTreeToCache(poolAddress.toBase58(), tree);

  return tree;
};
```

**Pros**: No backend changes, immediate improvement
**Cons**: Cache can get stale, doesn't help first-time users

---

### Solution 3: Quick Optimizations (Immediate Relief)

**Approach**: Tune existing parameters for better performance.

#### Changes to `lib/zk/merkle-utils.ts`

```typescript
// BEFORE
const CHUNK_SIZE = 3;
const DELAY_MS = 1000;

// AFTER
const CHUNK_SIZE = 10;      // Public RPCs typically handle 10 req/s
const DELAY_MS = 200;       // Faster processing
const MAX_SIGNATURES = 50;  // Reduce if recent txs are sufficient

async function fetchParsedTransactionsBatch(
  connection: Connection,
  signatures: string[]
) {
  const results: (ParsedTransactionWithMeta | null)[] = [];
  let backoff = 500;  // Start with 500ms

  for (let i = 0; i < signatures.length; i += CHUNK_SIZE) {
    const chunk = signatures.slice(i, i + CHUNK_SIZE);

    let attempts = 0;
    while (attempts < 3) {
      try {
        const txs = await connection.getParsedTransactions(chunk);
        results.push(...txs);
        backoff = 500;  // Reset on success
        break;
      } catch (e: any) {
        if (e.message?.includes('429') || e.status === 429) {
          console.warn(`Rate limited, waiting ${backoff}ms...`);
          await new Promise(r => setTimeout(r, backoff));
          backoff = Math.min(backoff * 2, 10000);  // Exponential, max 10s
          attempts++;
        } else {
          throw e;
        }
      }
    }

    await new Promise(r => setTimeout(r, DELAY_MS));
  }

  return results;
}
```

#### Changes to Proof Functions

```typescript
// Reduce retries from 5 to 2
// token-split.ts, private-sell.ts, unshield.ts

if (leafIndex === -1) {
  console.log("Note not found, retrying with delay...");
  for (let attempt = 1; attempt <= 2; attempt++) {  // Changed from 5
    await new Promise(r => setTimeout(r, 3000));    // Changed from 2000
    tree = await getMerkleTreeWithFallback(connection, shieldedPoolAddress, myCommitment);
    leafIndex = tree.batchLeaves.findIndex(l => padHex64(l.toString("hex")) === myCommitment);
    if (leafIndex !== -1) break;
  }
}
```

**Pros**: Minimal code changes, immediate effect
**Cons**: Still relies on RPC, doesn't solve scaling fundamentally

---

### Solution 4: Use Premium RPC

**Approach**: Switch to a paid RPC provider with higher rate limits.

#### Helius (Recommended)

```env
# .env
NEXT_PUBLIC_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_API_KEY
```

Helius offers:
- 50 req/s on free tier
- 500+ req/s on paid tiers
- DAS API for faster asset queries

#### QuickNode

```env
NEXT_PUBLIC_RPC_URL=https://your-endpoint.devnet.quiknode.pro/YOUR_API_KEY/
```

#### Triton

```env
NEXT_PUBLIC_RPC_URL=https://devnet.triton.one/?api-key=YOUR_API_KEY
```

**Pros**: Simple change, immediate improvement
**Cons**: Costs money, still has limits at scale

---

## Recommended Implementation Order

### Phase 1: Immediate (1-2 hours)
1. Apply quick optimizations (Solution 3)
2. Switch to Helius free tier (Solution 4)

### Phase 2: Short-term (1-2 days)
3. Implement local commitment cache (Solution 2)
4. Add optimistic tree updates after transactions

### Phase 3: Long-term (1 week)
5. Build backend-indexed tree service (Solution 1)
6. Add WebSocket subscription for real-time tree updates

---

## Testing

After implementing changes, test these scenarios:

1. **Rapid operations**: Shield → Swap → Sell in quick succession
2. **Multiple users**: Simulate concurrent users on same pool
3. **Stale cache**: Verify cache invalidation works correctly
4. **Network issues**: Test behavior when RPC is slow/unavailable

### Monitoring

Add logging to track RPC call frequency:

```typescript
let rpcCallCount = 0;

const trackRpcCall = (method: string) => {
  rpcCallCount++;
  console.log(`[RPC #${rpcCallCount}] ${method}`);
};

// Use before each RPC call
trackRpcCall('getAccountInfo');
await connection.getAccountInfo(address);
```

---

## Summary

| Solution | Effort | Impact | Scalability |
|----------|--------|--------|-------------|
| Quick optimizations | Low | Medium | Low |
| Premium RPC | Low | Medium | Medium |
| Local cache | Medium | High | Medium |
| Backend indexer | High | Very High | Very High |

For production at scale, **Solution 1 (Backend-Indexed Tree)** is the recommended long-term approach. It eliminates frontend RPC dependency entirely and provides consistent performance regardless of user count.
