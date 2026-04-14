# Pump.fun Token Charts Integration

This document outlines how to integrate real-time charts for pump.fun tokens in the Oyrade prediction market, similar to the charts shown on pump.fun.

## Current Implementation

The current `market-forecast-chart.tsx` uses CoinGecko API to fetch OHLC data for major cryptocurrencies (BTC, ETH, SOL) based on keyword detection from the event title. This serves as a placeholder.

**Location:** `app/(dashboard)/markets/_components/slug/market-forecast-chart.tsx`

## Goal

Display real pump.fun token charts (price, volume, OHLCV) for markets that have Switchboard oracle feeds pointing to pump.fun tokens.

## Data Flow

```
Market (on-chain)
    │
    ▼
oracleFeed (PublicKey)
    │
    ▼
PullFeed.loadData() → feedHash
    │
    ▼
Crossbar.fetch(feedHash) → jobs[]
    │
    ▼
Parse httpTask.url → Token Address
    │
    ▼
GeckoTerminal API → Pool Address → OHLCV Data
    │
    ▼
lightweight-charts → Candlestick Chart
```

## Step 1: Extract Token Address from Switchboard Feed

When a market is created with an oracle feed for a pump.fun token, the feed's jobs contain the token address in the httpTask URL.

**Example job structure:**
```json
{
  "tasks": [
    {
      "httpTask": {
        "url": "https://frontend-api-v3.pump.fun/coins/GGmZqC7nTcZH4npvRJz4cxmus4EAGXWdpk4wrc72pump?sync=true"
      }
    },
    {
      "jsonParseTask": {
        "path": "$.usd_market_cap"
      }
    }
  ]
}
```

**Implementation:**
```typescript
import { Connection, PublicKey } from "@solana/web3.js";
import { PullFeed, AnchorUtils } from "@switchboard-xyz/on-demand";
import { LegacyCrossbarClient } from "@switchboard-xyz/common-legacy";

async function getTokenAddressFromFeed(
  connection: Connection,
  feedPubkey: PublicKey
): Promise<string | null> {
  // 1. Load the Switchboard program
  const program = await AnchorUtils.loadProgramFromConnection(connection);

  // 2. Load the feed account to get feedHash
  const feed = new PullFeed(program, feedPubkey);
  const feedData = await feed.loadData();
  const feedHash = "0x" + Buffer.from(feedData.feedHash).toString("hex");

  // 3. Fetch jobs from crossbar using feedHash
  const crossbar = new LegacyCrossbarClient("https://crossbar.switchboard.xyz");
  const response = await crossbar.fetch(feedHash);

  // 4. Extract token address from httpTask URL
  for (const job of response.jobs) {
    if (job.tasks) {
      for (const task of job.tasks) {
        if (task.httpTask?.url) {
          // URL patterns:
          // - https://frontend-api-v2.pump.fun/coins/{TOKEN_ADDRESS}
          // - https://frontend-api-v3.pump.fun/coins/{TOKEN_ADDRESS}?sync=true
          const match = task.httpTask.url.match(/\/coins\/([A-Za-z0-9]+)/);
          if (match) {
            return match[1];
          }
        }
      }
    }
  }

  return null;
}
```

## Step 2: Fetch Chart Data from GeckoTerminal

GeckoTerminal provides free OHLCV data for Solana tokens.

### Get Token Info and Pool Address

```typescript
// GET https://api.geckoterminal.com/api/v2/networks/solana/tokens/{tokenAddress}

const response = await fetch(
  `https://api.geckoterminal.com/api/v2/networks/solana/tokens/${tokenAddress}`
);
const data = await response.json();

// Extract pool address from relationships
const poolAddress = data.data.relationships.top_pools.data[0]?.id
  ?.replace("solana_", "");
```

**Example response:**
```json
{
  "data": {
    "id": "solana_GGmZqC7nTcZH4npvRJz4cxmus4EAGXWdpk4wrc72pump",
    "type": "token",
    "attributes": {
      "address": "GGmZqC7nTcZH4npvRJz4cxmus4EAGXWdpk4wrc72pump",
      "name": "Oyrade",
      "symbol": "OYRADE",
      "decimals": 6,
      "price_usd": "0.00001055905859",
      "fdv_usd": "10559.0585870716",
      "volume_usd": { "h24": "26054.6794362773" }
    },
    "relationships": {
      "top_pools": {
        "data": [
          { "id": "solana_V8tyDKJExLEzp9Q1MNzVh2N5uezcXfLzq545SF9gMUo", "type": "pool" }
        ]
      }
    }
  }
}
```

### Get OHLCV Data

```typescript
// GET https://api.geckoterminal.com/api/v2/networks/solana/pools/{poolAddress}/ohlcv/{timeframe}

const ohlcvResponse = await fetch(
  `https://api.geckoterminal.com/api/v2/networks/solana/pools/${poolAddress}/ohlcv/hour?aggregate=4&limit=100`
);
const ohlcvData = await ohlcvResponse.json();

// Data format: [timestamp, open, high, low, close, volume]
const candles = ohlcvData.data.attributes.ohlcv_list;
```

**Available timeframes:**

| Timeframe | Aggregate Options | Example |
|-----------|-------------------|---------|
| `minute`  | 1, 5, 15          | 15-minute candles |
| `hour`    | 1, 4, 12          | 4-hour candles |
| `day`     | 1                 | Daily candles |

**Example response:**
```json
{
  "data": {
    "attributes": {
      "ohlcv_list": [
        [1770811200, 0.000011703, 0.000011703, 0.000010559, 0.000010559, 271.847],
        [1770796800, 0.000019587, 0.000027329, 0.000010276, 0.000011703, 10416.759]
      ]
    }
  },
  "meta": {
    "base": { "name": "Oyrade", "symbol": "OYRADE" },
    "quote": { "name": "Wrapped SOL", "symbol": "SOL" }
  }
}
```

## Step 3: Display with lightweight-charts

The existing `market-forecast-chart.tsx` already uses `lightweight-charts`. The OHLCV data just needs to be transformed:

```typescript
import type { UTCTimestamp } from "lightweight-charts";

function transformGeckoTerminalData(ohlcvList: number[][]): OHLCPoint[] {
  return ohlcvList
    .map(([timestamp, open, high, low, close]) => ({
      time: timestamp as UTCTimestamp,
      open,
      high,
      low,
      close,
    }))
    .sort((a, b) => a.time - b.time);
}
```

## Alternative APIs

### Birdeye (Recommended for Production)

- **Endpoint:** `GET https://public-api.birdeye.so/defi/ohlcv`
- **Parameters:** `address`, `type` (1m, 5m, 15m, 1H, 4H, 1D), `time_from`, `time_to`
- **Pros:** More comprehensive, real-time WebSocket support
- **Cons:** Requires API key, paid for higher rate limits
- **Docs:** https://docs.birdeye.so/reference/get-defi-ohlcv

### DEXScreener

- **Endpoint:** `GET /token-pairs/v1/solana/{tokenAddress}`
- **Pros:** Free, real-time data
- **Cons:** No historical OHLCV data (only 24h stats)
- **Docs:** https://docs.dexscreener.com/api/reference

### Bitquery

- **Features:** OHLCV, ATH, market cap, liquidity, trader stats
- **Pros:** Comprehensive pump.fun-specific data
- **Cons:** Paid API
- **Docs:** https://docs.bitquery.io/docs/examples/Solana/Pump-Fun-API/

## Rate Limits and Caching

### GeckoTerminal Free Tier
- **Rate limit:** 10 requests/minute
- **Recommendation:** Cache data on backend or use stale-while-revalidate

### Suggested Caching Strategy
```typescript
// Use React Query with stale time
const { data } = useQuery({
  queryKey: ["token-ohlcv", tokenAddress, timeframe],
  queryFn: () => fetchOHLCV(tokenAddress, timeframe),
  staleTime: 60_000,        // 1 minute
  refetchInterval: 120_000, // Refetch every 2 minutes
});
```

## Implementation Checklist

- [ ] Create `hooks/use-pump-token-chart.ts`
  - [ ] Extract token address from Switchboard feed
  - [ ] Fetch pool address from GeckoTerminal
  - [ ] Fetch OHLCV data from GeckoTerminal
  - [ ] Transform data for lightweight-charts

- [ ] Update `market-forecast-chart.tsx`
  - [ ] Check if market has `oracleFeed`
  - [ ] If oracle feed exists, try to extract pump.fun token address
  - [ ] Use pump.fun token chart if available
  - [ ] Fall back to CoinGecko for non-pump.fun markets

- [ ] Add caching layer
  - [ ] Consider backend caching for rate limit compliance
  - [ ] Use React Query stale-while-revalidate

## Available Metrics (Comparison with pump.fun)

| Metric | GeckoTerminal | pump.fun |
|--------|---------------|----------|
| Price OHLCV | ✅ | ✅ |
| Volume | ✅ | ✅ |
| Market Cap | ✅ (calculated) | ✅ |
| 24h Change | ✅ | ✅ |
| Bonding Curve Progress | ❌ | ✅ |
| Top Holders | ❌ | ✅ |
| Trade Display (bubbles) | ❌ | ✅ |

## References

- [GeckoTerminal API Docs](https://apiguide.geckoterminal.com/)
- [Birdeye OHLCV API](https://docs.birdeye.so/reference/get-defi-ohlcv)
- [DEXScreener API Reference](https://docs.dexscreener.com/api/reference)
- [Switchboard On-Demand Docs](https://docs.switchboard.xyz/product-documentation/data-feeds/solana-svm)
- [lightweight-charts Documentation](https://tradingview.github.io/lightweight-charts/)
