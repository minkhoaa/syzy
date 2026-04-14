"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { CodeBlock } from "@/components/x402/code-block"

const sdkExample = `// Create a prediction market via x402
const response = await fetch("https://api.oyrade.com/api/v1/markets/create", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    question: "Will ETH reach $4000 by EOY 2026?",
    market_name: "ETH $4K EOY 2026",
    slug: "eth-4k-eoy-2026",
    category: "crypto",
    token_mint: "DfnxGQ...",
    end_date: 1798761600,
  }),
});

console.log(response.data.market_id);
// Cost: ~$0.50 USDC`

export function HeroSection() {
  return (
    <section className="relative py-24 md:py-32 xl:py-40 flex flex-col items-center justify-center min-h-[80vh]">
      <div className="container mx-auto px-4 sm:px-6 relative z-10 flex flex-col lg:flex-row items-center gap-16 lg:gap-8">
        {/* Left Column - Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 w-full max-w-2xl lg:max-w-xl text-left"
        >
          <div className="inline-flex items-center px-2 py-1 border border-black/20 dark:border-white/20 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mb-8 tracking-wide">
            BUILT ON X402
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[80px] font-bold tracking-tighter text-black dark:text-white mb-8 leading-none">
            Prediction APIs.
            <br />
            Pay per call.
          </h1>

          <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-12 leading-relaxed max-w-xl font-medium">
            On-chain prediction markets that charge per request in USDC. AI agents
            can create markets, trade, and resolve — no API keys, no subscriptions.
            Just pay and predict.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Link href="/x402/docs" className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-4 transition-colors w-full sm:w-auto">
              Read Documentation <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/x402/examples" className="inline-flex items-center justify-center gap-2 border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-black dark:text-white font-semibold px-8 py-4 transition-colors w-full sm:w-auto">
              View Examples
            </Link>
          </div>
        </motion.div>

        {/* Right Column - Code */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex-1 w-full max-w-2xl relative min-h-[300px]"
        >
          <CodeBlock code={sdkExample} language="typescript" title="index.ts" />
        </motion.div>

      </div>
    </section>
  )
}
