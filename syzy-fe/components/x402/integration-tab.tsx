"use client"

import { CodeBlock } from "@/components/x402/code-block"

const curlCode = `curl -X POST https://api.oyrade.com/api/v1/markets/create \\
  -H "Content-Type: application/json" \\
  -H "X-PAYMENT: <signed-usdc-payment>" \\
  -d '{
    "question": "Will BTC hit $200K?",
    "market_name": "BTC 200K",
    "slug": "btc-200k",
    "category": "crypto",
    "token_mint": "DfnxGQ...",
    "end_date": 1798761600
  }'`

const tsCode = `import { wrapFetch } from "@x402/fetch";
import { createSvmSigner } from "@x402/svm";
import { Keypair } from "@solana/web3.js";

const keypair = Keypair.fromSecretKey(/* ... */);
const signer = createSvmSigner(keypair);
const x402Fetch = wrapFetch(fetch, signer);

// Create a market ($0.50 USDC)
const res = await x402Fetch(
  "https://api.oyrade.com/api/v1/markets/create",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question: "Will ETH flip BTC by 2027?",
      market_name: "ETH Flip BTC",
      slug: "eth-flip-btc-2027",
      category: "crypto",
      token_mint: "DfnxGQ...",
      end_date: 1798761600,
    }),
  }
);`

export function IntegrationTab() {
  return (
    <div className="grid lg:grid-cols-2 gap-12 lg:gap-8">
      {/* Left Column: REST */}
      <div className="flex flex-col gap-6">
        <div className="inline-flex items-center px-2 py-1 border border-black/20 dark:border-white/20 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 w-max tracking-wide uppercase">
          X402 HTTP API
        </div>
        <h3 className="text-2xl md:text-3xl font-bold text-black dark:text-white tracking-tight">
          RESTful API with Micropayments
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed mb-4">
          Call our hosted APIs with X402 micropayment protocol. Pay with USDC on Solana for each request. Perfect for web applications, mobile apps, and backend integrations.
        </p>
        <div className="flex-1 min-h-[400px]">
          <CodeBlock code={curlCode} language="curl" title="create-market.sh" />
        </div>
        <ul className="space-y-3 mt-4 text-sm font-mono text-zinc-500 dark:text-zinc-400">
          <li>→ Pay-per-use with X402 protocol</li>
          <li>→ Client-side signing for security</li>
          <li>→ Dry-run mode enabled by default</li>
        </ul>
      </div>

      {/* Right Column: SDK */}
      <div className="flex flex-col gap-6">
        <div className="inline-flex items-center px-2 py-1 border border-black/20 dark:border-white/20 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 w-max tracking-wide uppercase">
          SDK / TYPESCRIPT
        </div>
        <h3 className="text-2xl md:text-3xl font-bold text-black dark:text-white tracking-tight">
          TypeScript SDK Integration
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed mb-4">
          Use @x402/fetch with a Solana signer for seamless micropayments. The SDK handles payment headers automatically so you can focus on building.
        </p>
        <div className="flex-1 min-h-[400px]">
          <CodeBlock code={tsCode} language="typescript" title="index.ts" />
        </div>
        <ul className="space-y-3 mt-4 text-sm font-mono text-zinc-500 dark:text-zinc-400">
          <li>→ Automatic X402 payment handling</li>
          <li>→ Solana wallet signing built-in</li>
          <li>→ Works with any AI agent framework</li>
        </ul>
      </div>
    </div>
  )
}
