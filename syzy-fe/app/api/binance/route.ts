import { NextRequest, NextResponse } from "next/server";

// Binance geo-blocks certain regions (HTTP 451). Try multiple endpoints.
const BINANCE_ENDPOINTS = [
  "https://api.binance.com/api/v3/ticker/24hr",
  "https://api.binance.us/api/v3/ticker/24hr",
];

// CoinGecko fallback: free, no geo-restrictions, returns similar data
const COINGECKO_SEARCH = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=";

// Map common Binance symbols to CoinGecko IDs
const SYMBOL_TO_COINGECKO: Record<string, string> = {
  BTCUSDT: "bitcoin",
  ETHUSDT: "ethereum",
  SOLUSDT: "solana",
  BNBUSDT: "binancecoin",
  XRPUSDT: "ripple",
  DOGEUSDT: "dogecoin",
  ADAUSDT: "cardano",
  AVAXUSDT: "avalanche-2",
  DOTUSDT: "polkadot",
  MATICUSDT: "matic-network",
  LINKUSDT: "chainlink",
  UNIUSDT: "uniswap",
  LTCUSDT: "litecoin",
  ATOMUSDT: "cosmos",
  NEARUSDT: "near",
  APTUSDT: "aptos",
  SUIUSDT: "sui",
  ARBUSDT: "arbitrum",
  OPUSDT: "optimism",
  SHIBUSDT: "shiba-inu",
  PEPEUSDT: "pepe",
  WIFUSDT: "dogwifcoin",
  TONUSDT: "the-open-network",
  TRXUSDT: "tron",
  ICPUSDT: "internet-computer",
};

/**
 * Proxy endpoint for Binance API to avoid CORS issues.
 * Falls back to Binance US and CoinGecko if geo-blocked (451).
 * Usage: GET /api/binance?symbol=BTCUSDT
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json(
      { error: "Missing 'symbol' query parameter" },
      { status: 400 }
    );
  }

  // Try Binance endpoints first
  for (const endpoint of BINANCE_ENDPOINTS) {
    try {
      const url = `${endpoint}?symbol=${encodeURIComponent(symbol)}`;
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }

      // 451/403 = geo-blocked, try next endpoint
      if (response.status === 451 || response.status === 403) {
        continue;
      }

      // Other errors (e.g. 400 bad symbol) — return as-is
      return NextResponse.json(
        { error: `Binance API returned ${response.status}` },
        { status: response.status }
      );
    } catch {
      continue;
    }
  }

  // All Binance endpoints failed — try CoinGecko fallback
  const coingeckoId = SYMBOL_TO_COINGECKO[symbol.toUpperCase()];
  if (coingeckoId) {
    try {
      const cgUrl = `${COINGECKO_SEARCH}${coingeckoId}`;
      const cgRes = await fetch(cgUrl, {
        headers: { Accept: "application/json" },
      });

      if (cgRes.ok) {
        const [coin] = await cgRes.json();
        if (coin) {
          // Map CoinGecko response to Binance-compatible shape
          return NextResponse.json({
            symbol,
            lastPrice: String(coin.current_price),
            priceChangePercent: String(coin.price_change_percentage_24h ?? 0),
            highPrice: String(coin.high_24h ?? coin.current_price),
            lowPrice: String(coin.low_24h ?? coin.current_price),
            volume: String(coin.total_volume ?? 0),
            quoteVolume: String(coin.total_volume ?? 0),
            _source: "coingecko",
          });
        }
      }
    } catch (error: any) {
      console.error("[API /api/binance] CoinGecko fallback failed:", error?.message);
    }
  }

  return NextResponse.json(
    { error: `Binance API is unavailable in this region and no fallback found for ${symbol}` },
    { status: 502 }
  );
}
