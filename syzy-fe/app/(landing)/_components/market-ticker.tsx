"use client"

import { Marquee } from "@/components/ui/marquee"
import { ArrowUp, ArrowDown } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

interface TickerToken {
  id: string
  pair: string
  price: string
  change: string
  up: boolean
}

const TOKENS = [
  { id: "solana", pair: "SOL/USD" },
  { id: "bitcoin", pair: "BTC/USD" },
  { id: "ethereum", pair: "ETH/USD" },
  { id: "dogwifcoin", pair: "WIF/USD" },
  { id: "bonk", pair: "BONK/USD" },
  { id: "jupiter-exchange-solana", pair: "JUP/USD" },
]

const FALLBACK: TickerToken[] = TOKENS.map((t) => ({
  ...t,
  price: "—",
  change: "0.0%",
  up: true,
}))

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString("en-US", { maximumFractionDigits: 0 })
  if (price >= 1) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (price >= 0.01) return price.toFixed(4)
  return price.toFixed(6)
}

function useTickerPrices() {
  return useQuery<TickerToken[]>({
    queryKey: ["ticker-prices"],
    queryFn: async () => {
      const ids = TOKENS.map((t) => t.id).join(",")
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
      )
      if (!res.ok) throw new Error("Failed to fetch prices")
      const data = await res.json()

      return TOKENS.map((token) => {
        const info = data[token.id]
        if (!info) return { ...token, price: "—", change: "0.0%", up: true }

        const price = info.usd ?? 0
        const change24h = info.usd_24h_change ?? 0
        const up = change24h >= 0

        return {
          ...token,
          price: formatPrice(price),
          change: `${up ? "+" : ""}${change24h.toFixed(1)}%`,
          up,
        }
      })
    },
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 2,
    retry: 2,
    placeholderData: FALLBACK,
  })
}

export function MarketTicker() {
  const { data: markets = FALLBACK } = useTickerPrices()

  return (
    <div className="w-full bg-background border-y border-border/40 py-2">
      <Marquee pauseOnHover className="[--duration:30s] [--gap:3rem]">
        {markets.map((market, i) => (
          <div
            key={i}
            className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <span className="font-bold text-sm text-foreground">{market.pair}</span>
            <span className="text-sm font-mono text-muted-foreground">${market.price}</span>
            <span
              className={`flex items-center text-xs font-bold ${
                market.up ? "text-green-600" : "text-red-500"
              }`}
            >
              {market.up ? (
                <ArrowUp className="w-3 h-3 mr-1" />
              ) : (
                <ArrowDown className="w-3 h-3 mr-1" />
              )}
              {market.change}
            </span>
          </div>
        ))}
      </Marquee>
    </div>
  )
}
