"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const pricingSections = [
  {
    category: "CORE TRADING APIs",
    items: [
      { id: "P1", name: "create_market", price: "$0.50", path: "POST /api/v1/markets/create" },
      { id: "P2", name: "predict", price: "$0.01+", path: "POST /api/v1/markets/:id/predict" },
      { id: "P3", name: "sell", price: "$0.01", path: "POST /api/v1/markets/:id/sell" },
      { id: "P4", name: "claim", price: "$0.01", path: "POST /api/v1/markets/:id/claim" },
      { id: "P5", name: "resolve", price: "$0.05", path: "GET /api/v1/markets/:id/resolve" },
      { id: "P6", name: "privacy_proof", price: "$0.10", path: "GET /api/v1/markets/:id/privacy-proof" },
      { id: "P7", name: "market_news", price: "$0.01", path: "GET /api/v1/markets/:id/news" },
    ]
  },
  {
    category: "FREE DATA APIs",
    items: [
      { id: "F1", name: "list_markets", price: "Free", path: "GET /api/v1/markets" },
      { id: "F2", name: "market_detail", price: "Free", path: "GET /api/v1/markets/:id" },
      { id: "F3", name: "price_history", price: "Free", path: "GET /api/v1/markets/:id/history" },
      { id: "F4", name: "comments", price: "Free", path: "GET /api/v1/markets/:id/comments" },
      { id: "F5", name: "positions", price: "Free", path: "GET /api/v1/positions" },
      { id: "F6", name: "trade_history", price: "Free", path: "GET /api/v1/history" },
      { id: "F7", name: "health", price: "Free", path: "GET /health" },
      { id: "F8", name: "x402_info", price: "Free", path: "GET /x402-info" },
    ]
  }
]

export function PricingTable() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-4xl mx-auto border border-black/10 dark:border-white/10"
    >
      <div className="text-[10px] text-zinc-500 dark:text-zinc-600 font-mono px-6 py-2 border-b border-black/10 dark:border-white/10 uppercase">
        SPEC-P
      </div>

      {pricingSections.map((section, idx) => (
        <div key={section.category}>
          <div className="bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10 px-6 py-3 font-mono text-[11px] font-bold text-black dark:text-white tracking-widest">
            {section.category}
          </div>
          <div className="flex flex-col">
            {section.items.map((item, i) => (
              <div
                key={item.id}
                className={cn(
                  "group flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-default",
                  i < section.items.length - 1 && "border-b border-black/10 dark:border-white/10"
                )}
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 w-8">[{item.id}]</span>
                    <span className="font-mono text-sm text-black dark:text-white font-bold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{item.name}</span>
                  </div>
                  <div className="pl-12 font-mono text-[11px] text-zinc-400 dark:text-zinc-600">
                    {item.path}
                  </div>
                </div>
                <div className="font-mono text-sm text-zinc-600 dark:text-zinc-300 mt-4 sm:mt-0 pl-12 sm:pl-0">
                  {item.price}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  )
}
