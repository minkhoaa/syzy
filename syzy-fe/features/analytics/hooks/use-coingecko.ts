"use client";

import { useQuery } from "@tanstack/react-query";

interface CoinGeckoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
}

interface CoinGeckoResponse {
  [key: string]: CoinGeckoPrice;
}

const COINGECKO_API_BASE = "https://api.coingecko.com/api/v3";

export function useCoinGeckoPrice(coinId: string = "solana") {
  return useQuery({
    queryKey: ["coingecko-price", coinId],
    queryFn: async (): Promise<CoinGeckoPrice | null> => {
      try {
        const response = await fetch(
          `${COINGECKO_API_BASE}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true&include_high_low_24h=true`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data[coinId]) {
          return null;
        }
        
        return {
          id: coinId,
          symbol: coinId === "solana" ? "SOL" : coinId.toUpperCase(),
          name: coinId === "solana" ? "Solana" : coinId,
          current_price: data[coinId].usd || 0,
          price_change_24h: data[coinId].usd_24h_change || 0,
          price_change_percentage_24h: data[coinId].usd_24h_change || 0,
          market_cap: data[coinId].usd_market_cap || 0,
          total_volume: data[coinId].usd_24h_vol || 0,
          high_24h: data[coinId].usd_24h_high || 0,
          low_24h: data[coinId].usd_24h_low || 0,
        };
      } catch (error) {
        console.error("Error fetching CoinGecko data:", error);
        return null;
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

const TICKER_COINS = [
  { id: "solana", symbol: "SOL", pair: "SOL/USD" },
  { id: "bitcoin", symbol: "BTC", pair: "BTC/USD" },
  { id: "ethereum", symbol: "ETH", pair: "ETH/USD" },
  { id: "dogwifcoin", symbol: "WIF", pair: "WIF/USD" },
  { id: "bonk", symbol: "BONK", pair: "BONK/USD" },
  { id: "jupiter-exchange-solana", symbol: "JUP", pair: "JUP/USD" },
];

export interface TickerItem {
  pair: string;
  price: string;
  change: string;
  up: boolean;
}

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (price >= 1) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  // Show enough decimals for small prices (e.g. BONK)
  return price.toPrecision(3);
}

export function useTickerPrices() {
  return useQuery({
    queryKey: ["coingecko-ticker"],
    queryFn: async (): Promise<TickerItem[]> => {
      const ids = TICKER_COINS.map((c) => c.id).join(",");
      const response = await fetch(
        `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`
      );

      if (!response.ok) {
        throw new Error(`CoinGecko HTTP ${response.status}`);
      }

      const data: Array<{
        id: string;
        current_price: number;
        price_change_percentage_24h: number | null;
      }> = await response.json();

      const priceMap = new Map(data.map((d) => [d.id, d]));

      return TICKER_COINS.map((coin) => {
        const d = priceMap.get(coin.id);
        if (!d) return { pair: coin.pair, price: "—", change: "0.0%", up: true };
        const pct = d.price_change_percentage_24h ?? 0;
        return {
          pair: coin.pair,
          price: formatPrice(d.current_price),
          change: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`,
          up: pct >= 0,
        };
      });
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // keep in cache 10 minutes
    refetchInterval: 1000 * 60 * 5, // refetch every 5 minutes
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 15000),
  });
}

export function useTrendingCoins() {
  return useQuery({
    queryKey: ["coingecko-trending"],
    queryFn: async () => {
      try {
        const response = await fetch(`${COINGECKO_API_BASE}/search/trending`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.coins || [];
      } catch (error) {
        console.error("Error fetching trending coins:", error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchInterval: 1000 * 60 * 10, // Refetch every 10 minutes
  });
}