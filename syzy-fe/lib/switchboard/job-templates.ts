import { OracleJob } from "@switchboard-xyz/common";

// --- API Endpoints ---
const PUMP_API_V3 = "https://frontend-api-v3.pump.fun/coins";
const DEXSCREENER_API = "https://api.dexscreener.com/tokens/v1/solana";
const BINANCE_API = "https://api.binance.com/api/v3/ticker/24hr";
const COINGECKO_GLOBAL_API = "https://api.coingecko.com/api/v3/global";

// --- Metric Definitions ---

export interface PumpMetric {
  key: string;
  label: string;
  /** Data source API */
  api: "v3" | "dexscreener" | "binance" | "coingecko" | "jupiter" | "helius";
  /** JSONPath to extract from the API response */
  path: string;
  /** Suggested metric_type value for on-chain market (informational) */
  metricType: number;
  /** Short description for the UI */
  description: string;
  /** If true, this metric doesn't require a token mint (e.g. BTC price, total market cap) */
  global?: boolean;
  /** For global metrics that need a fixed parameter (e.g. symbol=BTCUSDT for Binance) */
  apiParam?: string;
  /** If true, shows a searchable crypto token selector in the UI */
  needsCryptoSelector?: boolean;
}

export const PUMP_METRICS: Record<string, PumpMetric> = {
  // --- Pump.fun metrics ---
  usd_market_cap: {
    key: "usd_market_cap",
    label: "USD Market Cap",
    api: "v3",
    path: "$.usd_market_cap",
    metricType: 1,
    description: "Market capitalization in USD",
  },
  sol_market_cap: {
    key: "sol_market_cap",
    label: "SOL Market Cap",
    api: "v3",
    path: "$.market_cap",
    metricType: 7,
    description: "Market capitalization in SOL",
  },
  reply_count: {
    key: "reply_count",
    label: "Reply Count",
    api: "v3",
    path: "$.reply_count",
    metricType: 6,
    description: "Number of comments on the token page",
  },
  virtual_sol_reserves: {
    key: "virtual_sol_reserves",
    label: "Virtual SOL Reserves",
    api: "v3",
    path: "$.virtual_sol_reserves",
    metricType: 0,
    description: "Virtual SOL in bonding curve (lamports). Increases as people buy.",
  },
  real_sol_reserves: {
    key: "real_sol_reserves",
    label: "Real SOL Reserves",
    api: "v3",
    path: "$.real_sol_reserves",
    metricType: 0,
    description: "Actual SOL locked in bonding curve (lamports)",
  },

  // --- DexScreener metrics ---
  token_price_usd: {
    key: "token_price_usd",
    label: "Token Price (USD)",
    api: "dexscreener",
    path: "$[0].priceUsd",
    metricType: 0,
    description: "Token price in USD via DexScreener (works for any Solana DEX token)",
  },
  volume_24h: {
    key: "volume_24h",
    label: "24h Volume",
    api: "dexscreener",
    path: "$[0].volume.h24",
    metricType: 2,
    description: "24-hour trading volume in USD (DexScreener)",
  },
  liquidity_usd: {
    key: "liquidity_usd",
    label: "Liquidity (USD)",
    api: "dexscreener",
    path: "$[0].liquidity.usd",
    metricType: 3,
    description: "Total liquidity in USD across all pools (DexScreener)",
  },
  price_change_pct: {
    key: "price_change_pct",
    label: "Price Change % (24h)",
    api: "dexscreener",
    path: "$[0].priceChange.h24",
    metricType: 5,
    description: "24-hour price change percentage (DexScreener)",
  },
  fdv: {
    key: "fdv",
    label: "Fully Diluted Valuation",
    api: "dexscreener",
    path: "$[0].fdv",
    metricType: 1,
    description: "Fully diluted valuation in USD (DexScreener)",
  },
  txns_24h: {
    key: "txns_24h",
    label: "Transactions (24h)",
    api: "dexscreener",
    path: "$[0].txns.h24.buys",
    metricType: 2,
    description: "Number of buy transactions in 24h (DexScreener)",
  },

  // --- Binance metrics (global, user picks token) ---
  crypto_price: {
    key: "crypto_price",
    label: "Price",
    api: "binance",
    path: "$.lastPrice",
    metricType: 8,
    description: "Cryptocurrency price in USD from Binance — select a token below",
    global: true,
    needsCryptoSelector: true,
  },

  // --- CoinGecko global metrics ---
  total_market_cap: {
    key: "total_market_cap",
    label: "Total Crypto Market Cap",
    api: "coingecko",
    path: "$.data.total_market_cap.usd",
    metricType: 9,
    description: "Total cryptocurrency market capitalization in USD (CoinGecko)",
    global: true,
  },
  btc_dominance: {
    key: "btc_dominance",
    label: "BTC Dominance %",
    api: "coingecko",
    path: "$.data.market_cap_percentage.btc",
    metricType: 10,
    description: "Bitcoin market cap dominance percentage (CoinGecko)",
    global: true,
  },
} as const;

/** All metric keys as an array, for iteration */
export const PUMP_METRIC_KEYS = Object.keys(PUMP_METRICS) as (keyof typeof PUMP_METRICS)[];

/** Metric type labels for display (matches on-chain metric_type u8 values) */
export const METRIC_LABELS: Record<number, string> = {
  0: "Price",
  1: "USD Market Cap",
  2: "24h Volume",
  3: "Liquidity",
  5: "Price Change %",
  6: "Reply Count",
  7: "SOL Market Cap",
  8: "Crypto Price",
  9: "Total Crypto Market Cap",
  10: "BTC Dominance",
};

/** Binance USDT trading pair shape (fetched from backend) */
export interface BinanceToken {
  symbol: string;
  name: string;
  pair: string;
}

/** Metric categories for grouped UI display */
export const METRIC_CATEGORIES = {
  pumpfun: {
    label: "Pump.fun",
    metrics: ["usd_market_cap", "sol_market_cap", "reply_count", "virtual_sol_reserves", "real_sol_reserves"],
  },
  dex: {
    label: "DEX / Token",
    metrics: ["token_price_usd", "volume_24h", "liquidity_usd", "price_change_pct", "fdv", "txns_24h"],
  },
  crypto: {
    label: "Crypto Global",
    metrics: ["crypto_price", "total_market_cap", "btc_dominance"],
  },
} as const;

// --- Job Creation ---

function getApiUrl(metric: PumpMetric, tokenMint?: string, apiParam?: string): string {
  switch (metric.api) {
    case "dexscreener":
      return `${DEXSCREENER_API}/${tokenMint}`;
    case "v3":
      return `${PUMP_API_V3}/${tokenMint}?sync=true`;
    case "binance":
      return `${BINANCE_API}?symbol=${apiParam || metric.apiParam}`;
    case "coingecko":
      return COINGECKO_GLOBAL_API;
    default:
      throw new Error(`Unknown API source: ${metric.api}`);
  }
}

function getJsonPath(metric: PumpMetric): string {
  return metric.path;
}

/**
 * Create an OracleJob for a metric.
 * Each job is a 2-task pipeline: httpTask -> jsonParseTask.
 */
export function createPumpOracleJob(
  metricKey: string,
  tokenMint?: string,
  apiParam?: string,
): ReturnType<typeof OracleJob.fromObject> {
  const metric = PUMP_METRICS[metricKey];
  if (!metric) throw new Error(`Unknown metric: ${metricKey}`);
  if (!metric.global && !tokenMint) throw new Error("Token mint address is required for this metric");
  if (metric.needsCryptoSelector && !apiParam) throw new Error("Token selection is required for this metric");

  return OracleJob.fromObject({
    tasks: [
      {
        httpTask: {
          url: getApiUrl(metric, tokenMint, apiParam),
        },
      },
      {
        jsonParseTask: {
          path: getJsonPath(metric),
        },
      },
    ],
  });
}

/**
 * Generate a short on-chain feed name.
 * Format: "{source}-{metric}-{mint_prefix}" (max ~32 chars)
 */
export function generatePumpFeedName(metricKey: string, tokenMint?: string, apiParam?: string): string {
  const metric = PUMP_METRICS[metricKey];
  const prefixMap: Record<string, string> = {
    v3: "pf",
    dexscreener: "ds",
    binance: "bn",
    coingecko: "cg",
    jupiter: "jp",
    helius: "hl",
  };
  const prefix = prefixMap[metric?.api ?? ""] ?? "xx";
  if (metric?.needsCryptoSelector && apiParam) {
    // e.g. "bn-BTCUSDT" for a crypto price feed
    return `${prefix}-${apiParam}`;
  }
  const short = metricKey.slice(0, 12);
  if (metric?.global) {
    return `${prefix}-${short}`;
  }
  const mintPrefix = (tokenMint ?? "").slice(0, 6);
  return `${prefix}-${short}-${mintPrefix}`;
}

/**
 * Simulate the oracle job client-side by fetching the API and extracting the value.
 * Returns the numeric value if successful, throws with a descriptive error if not.
 * Call this BEFORE creating the on-chain feed to avoid wasting SOL on broken feeds.
 *
 * Uses server-side proxies (/api/*) to avoid CORS issues.
 */
export async function simulatePumpJob(metricKey: string, tokenMint?: string, apiParam?: string): Promise<number> {
  const metric = PUMP_METRICS[metricKey];
  if (!metric) throw new Error(`Unknown metric: ${metricKey}`);
  if (!metric.global && !tokenMint) throw new Error("Token mint address is required for this metric");
  if (metric.needsCryptoSelector && !apiParam) throw new Error("Token selection is required for this metric");

  switch (metric.api) {
    case "dexscreener":
      return simulateDexScreenerJob(metric, tokenMint!);
    case "v3":
      return simulatePumpFunJob(metric, tokenMint!);
    case "binance":
      return simulateBinanceJob(metric, apiParam);
    case "coingecko":
      return simulateCoinGeckoJob(metric);
    default:
      throw new Error(`Unsupported API: ${metric.api}`);
  }
}

/**
 * Simulate a Pump.fun oracle job via the /api/pump proxy.
 */
async function simulatePumpFunJob(metric: PumpMetric, tokenMint: string): Promise<number> {
  const proxyUrl = `/api/pump?mint=${encodeURIComponent(tokenMint)}`;
  const res = await fetch(proxyUrl);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Pump.fun API returned ${res.status}. Check that the token mint exists on pump.fun.`);
  }

  const data = await res.json();

  // Navigate the JSONPath (simple "$.<field>" format)
  const field = metric.path.replace(/^\$\./, "");
  const value = data?.[field];

  if (value == null) {
    throw new Error(`No "${metric.label}" data found for this token. The field "${field}" is missing from the API response.`);
  }

  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`"${metric.label}" value is not a number (got: "${String(value).slice(0, 50)}").`);
  }

  return num;
}

/**
 * Simulate a DexScreener oracle job via the /api/dexscreener proxy.
 * Supports nested paths like "$[0].volume.h24" or "$[0].liquidity.usd".
 */
async function simulateDexScreenerJob(metric: PumpMetric, tokenMint: string): Promise<number> {
  const proxyUrl = `/api/dexscreener?mint=${encodeURIComponent(tokenMint)}`;
  const res = await fetch(proxyUrl);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error || `DexScreener API returned ${res.status}. Check that the token exists on a Solana DEX.`
    );
  }

  const data = await res.json();

  // DexScreener /tokens/v1/solana/{address} returns an array of pairs
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(
      "No trading pairs found on DexScreener for this token. It may not be listed on any Solana DEX yet."
    );
  }

  // Navigate nested path: "$[0].priceUsd" -> data[0].priceUsd
  // "$[0].volume.h24" -> data[0].volume.h24
  const pathAfterIndex = metric.path.replace(/^\$\[0\]\./, "");
  const parts = pathAfterIndex.split(".");
  let current: any = data[0];
  for (const part of parts) {
    current = current?.[part];
  }

  if (current == null) {
    throw new Error(`No "${metric.label}" data available for this token on DexScreener.`);
  }

  const num = Number(current);
  if (isNaN(num)) {
    throw new Error(`"${metric.label}" value is not a number (got: "${String(current).slice(0, 50)}").`);
  }

  return num;
}

/**
 * Simulate a Binance oracle job via the /api/binance proxy.
 */
async function simulateBinanceJob(metric: PumpMetric, apiParam?: string): Promise<number> {
  const symbol = apiParam || metric.apiParam;
  if (!symbol) throw new Error("No Binance trading pair specified");
  const proxyUrl = `/api/binance?symbol=${encodeURIComponent(symbol)}`;
  const res = await fetch(proxyUrl);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Binance API returned ${res.status}`);
  }

  const data = await res.json();
  const value = Number(data?.lastPrice);
  if (isNaN(value)) throw new Error("Invalid price value from Binance");
  return value;
}

/**
 * Simulate a CoinGecko global oracle job via the /api/coingecko-global proxy.
 */
async function simulateCoinGeckoJob(metric: PumpMetric): Promise<number> {
  const proxyUrl = `/api/coingecko-global`;
  const res = await fetch(proxyUrl);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `CoinGecko API returned ${res.status}`);
  }

  const data = await res.json();

  // Navigate nested path: "$.data.total_market_cap.usd" -> data.data.total_market_cap.usd
  const pathParts = metric.path.replace(/^\$\./, "").split(".");
  let current: any = data;
  for (const part of pathParts) {
    current = current?.[part];
  }

  const value = Number(current);
  if (isNaN(value) || current == null) throw new Error(`No "${metric.label}" data found`);
  return value;
}
