"use client"

import { CodeBlock } from "@/components/x402/code-block"
import { EndpointDoc } from "@/components/x402/endpoint-doc"
import {
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  Globe,
} from "lucide-react"

const quickStartInstall = `npm install @x402/fetch @x402/svm @solana/web3.js`

const quickStartSetup = `import { wrapFetch } from "@x402/fetch";
import { createSvmSigner } from "@x402/svm";
import { Keypair } from "@solana/web3.js";

const keypair = Keypair.fromSecretKey(/* your secret key */);
const signer = createSvmSigner(keypair);

const fetchWith402 = wrapFetch(fetch, signer);
const BASE_URL = "https://api.oyrade.com";`

const quickStartFirst = `// Health check (free)
const health = await fetchWith402(\`\${BASE_URL}/health\`);
const { data } = await health.json();
console.log(data.status); // "ok"

// Create your first market ($0.50)
const res = await fetchWith402(\`\${BASE_URL}/api/v1/markets/create\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    token_mint: "DfnxGQUsXdDH7DYdroeeSBG8etqTy1kufxBikHwTTGTa",
    question: "Will BTC reach $150K by March 2026?",
    market_name: "BTC 150K",
    slug: "btc-150k-march-2026",
    category: "crypto",
    end_date: 1740787200,
  }),
});
const market = await res.json();
console.log("Market ID:", market.data.market_id);`

export default function DocsPage() {
  return (
    <div className="py-16 md:py-24 bg-white dark:bg-black text-black dark:text-white min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl relative z-10">
        {/* Header */}
        <div className="mb-16">
          <div className="inline-flex items-center px-2 py-1 border border-black/20 dark:border-white/20 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mb-6 tracking-wide">
            API REFERENCE
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-6 tracking-tight">
            API Documentation
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl font-medium">
            Complete technical reference for the Syzy x402 prediction market
            APIs. All paid endpoints use the x402 micropayment protocol for
            pay-per-call access.
          </p>
        </div>

        {/* Quick Start */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-black dark:text-white mb-8">
            Quick Start
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-mono tracking-wide text-zinc-500 dark:text-zinc-400 uppercase mb-3">
                [1] Install dependencies
              </h3>
              <CodeBlock
                code={quickStartInstall}
                language="bash"
                title="Terminal"
              />
            </div>

            <div>
              <h3 className="text-sm font-mono tracking-wide text-zinc-500 dark:text-zinc-400 uppercase mb-3">
                [2] Set up the client
              </h3>
              <CodeBlock
                code={quickStartSetup}
                language="typescript"
                title="TypeScript"
              />
            </div>

            <div>
              <h3 className="text-sm font-mono tracking-wide text-zinc-500 dark:text-zinc-400 uppercase mb-3">
                [3] Make your first call
              </h3>
              <CodeBlock
                code={quickStartFirst}
                language="typescript"
                title="TypeScript"
              />
            </div>
          </div>
        </section>

        {/* Payment Flow */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-black dark:text-white mb-8">
            Payment Flow
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-8 font-medium">
            The x402 protocol adds payment negotiation to standard HTTP. Here is
            what happens when you call a paid endpoint:
          </p>

          <div className="space-y-4">
            {[
              {
                step: 1,
                text: "Client sends a request to a protected endpoint",
              },
              {
                step: 2,
                text: "Server returns 402 Payment Required with payment details (amount, recipient, token)",
              },
              {
                step: 3,
                text: "Client signs a USDC payment transaction on Solana",
              },
              {
                step: 4,
                text: "Client retries the request with X-PAYMENT header containing the signed payment",
              },
              {
                step: 5,
                text: "Server verifies the payment on-chain and processes the request",
              },
              { step: 6, text: "Server returns success response" },
            ].map((item, i) => (
              <div key={item.step} className="flex items-start gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-black/20 dark:border-white/20 bg-black/[0.02] dark:bg-white/[0.02] text-black dark:text-white text-xs font-mono">
                  {item.step}
                </span>
                <div className="flex-1 pt-1">
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 font-mono">{item.text}</p>
                  {i < 5 && (
                    <ArrowDown className="h-4 w-4 text-zinc-400 dark:text-zinc-600 mt-2 ml-4" />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 border border-green-500/20 bg-green-500/[0.02] p-4 text-green-500">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500 mt-0.5" />
              <p className="text-sm">
                <code className="font-mono text-green-400">@x402/fetch</code>{" "}
                handles steps 2-4 automatically. Wrap the native{" "}
                <code className="font-mono text-green-400">fetch</code> with{" "}
                <code className="font-mono text-green-400">wrapFetch(fetch, signer)</code>{" "}
                and the library negotiates payment for you.
              </p>
            </div>
          </div>
        </section>

        {/* Paid Endpoints */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-black dark:text-white mb-8">
            Paid Endpoints
          </h2>

          <div className="space-y-8">
            {/* POST /api/v1/markets/create */}
            <EndpointDoc
              method="POST"
              path="/api/v1/markets/create"
              price="$0.50"
              description="Create a new on-chain prediction market with optional oracle integration. Returns the market ID and token mint addresses."
              params={[
                {
                  name: "token_mint",
                  type: "string",
                  required: true,
                  description: "SPL token mint address (base58)",
                },
                {
                  name: "question",
                  type: "string",
                  required: true,
                  description: "The prediction question (1-100 chars)",
                },
                {
                  name: "market_name",
                  type: "string",
                  required: true,
                  description: "Short market name (1-32 chars)",
                },
                {
                  name: "slug",
                  type: "string",
                  required: true,
                  description: "URL slug for the market (1-128 chars)",
                },
                {
                  name: "category",
                  type: "string",
                  required: true,
                  description: "Market category (1-32 chars)",
                },
                {
                  name: "end_date",
                  type: "number",
                  required: true,
                  description: "Unix timestamp for market deadline (must be in the future)",
                },
                {
                  name: "image_url",
                  type: "string",
                  required: false,
                  description: "Market image URL (max 256 chars)",
                },
                {
                  name: "source",
                  type: "string",
                  required: false,
                  description: "Source identifier (max 32 chars, default: 'x402')",
                },
                {
                  name: "oracle_feed",
                  type: "string",
                  required: false,
                  description: "Switchboard oracle feed pubkey for auto-resolution",
                },
                {
                  name: "price_target",
                  type: "number",
                  required: false,
                  description: "Target price for oracle-based resolution",
                },
                {
                  name: "comparison_type",
                  type: "number",
                  required: false,
                  description: "Oracle comparison: 0 = Greater Than, 1 = Less Than, 2 = Equal",
                },
                {
                  name: "market_version",
                  type: "number",
                  required: false,
                  description: "0 = Dynamic Parimutuel (default), 1 = Conditional Token Framework",
                },
                {
                  name: "collateral_per_pair",
                  type: "number",
                  required: false,
                  description: "SOL per token pair (min 0.001, required if market_version is 1)",
                },
              ]}
              requestExample={`{
  "token_mint": "DfnxGQUsXdDH7DYdroeeSBG8etqTy1kufxBikHwTTGTa",
  "question": "Will BTC reach $150K by March 2026?",
  "market_name": "BTC 150K",
  "slug": "btc-150k-march-2026",
  "category": "crypto",
  "end_date": 1740787200,
  "oracle_feed": "HNStfhaLnqwF2ZtJUizaA9uHDAVB976r2AgTUx9LrdEo",
  "price_target": 150000,
  "comparison_type": 0,
  "market_version": 1,
  "collateral_per_pair": 0.01
}`}
              responseExample={`{
  "success": true,
  "data": {
    "market_id": "7xKp...",
    "yes_token_mint": "4rQz...",
    "no_token_mint": "8mNp...",
    "tx_signature": "5UBq...",
    "question": "Will BTC reach $150K by March 2026?",
    "end_date": 1740787200
  }
}`}
            />

            {/* POST /api/v1/markets/:id/predict */}
            <EndpointDoc
              method="POST"
              path="/api/v1/markets/:id/predict"
              price="$0.01 + amount * 3%"
              description="Place a prediction on a market outcome. Requires a commitment hash for privacy-preserving predictions. Price is dynamic: base fee plus 3% of prediction amount."
              params={[
                {
                  name: "outcome",
                  type: "string",
                  required: true,
                  description: '"YES" or "NO"',
                },
                {
                  name: "amount",
                  type: "number",
                  required: true,
                  description: "SOL amount from fixed buckets: 0.1, 0.5, 1, 5, 10",
                },
                {
                  name: "commitment_hash",
                  type: "string",
                  required: true,
                  description: "Poseidon hash for privacy (exactly 64 hex chars)",
                },
              ]}
              requestExample={`{
  "outcome": "YES",
  "amount": 0.5,
  "commitment_hash": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2"
}`}
              responseExample={`{
  "success": true,
  "data": {
    "prediction_id": "uuid",
    "commitment": "abc123...",
    "outcome": "YES",
    "amount": 0.5,
    "tokens_received": 0.312,
    "effective_price": 0.62,
    "yes_price_after": 0.65,
    "no_price_after": 0.35
  }
}`}
              notes={[
                "commitment_hash is REQUIRED and must be exactly 64 hex characters",
                "Amount must be one of the fixed buckets: 0.1, 0.5, 1, 5, or 10 SOL",
                "Returns 409 Conflict if a duplicate commitment_hash is submitted",
              ]}
            />

            {/* POST /api/v1/markets/:id/sell */}
            <EndpointDoc
              method="POST"
              path="/api/v1/markets/:id/sell"
              price="$0.01"
              description="Sell prediction tokens back to the market. Specify the commitment hash of the position to sell. Omit amount to sell all tokens."
              params={[
                {
                  name: "commitment_hash",
                  type: "string",
                  required: true,
                  description: "Commitment hash from the original prediction",
                },
                {
                  name: "payout_address",
                  type: "string",
                  required: true,
                  description: "Solana wallet address for SOL payout",
                },
                {
                  name: "amount",
                  type: "number",
                  required: false,
                  description: "Number of tokens to sell (omit to sell all)",
                },
              ]}
              requestExample={`{
  "commitment_hash": "a1b2c3d4e5f6...",
  "payout_address": "8mNp...",
  "amount": 0.312
}`}
              responseExample={`{
  "success": true,
  "data": {
    "tx_signature": "3nKm...",
    "tokens_sold": 0.312,
    "sol_received": 0.28,
    "payout_address": "8mNp..."
  }
}`}
            />

            {/* POST /api/v1/markets/:id/claim */}
            <EndpointDoc
              method="POST"
              path="/api/v1/markets/:id/claim"
              price="$0.01"
              description="Claim winnings from a resolved market. Returns the payout if your position won, or a reason if it lost."
              params={[
                {
                  name: "commitment_hash",
                  type: "string",
                  required: true,
                  description: "Commitment hash from the original prediction",
                },
                {
                  name: "payout_address",
                  type: "string",
                  required: true,
                  description: "Solana wallet address for SOL payout",
                },
              ]}
              requestExample={`{
  "commitment_hash": "a1b2c3d4e5f6...",
  "payout_address": "8mNp..."
}`}
              responseExample={`{
  "success": true,
  "data": {
    "claimable": true,
    "tx_signature": "9pLq...",
    "sol_received": 0.5,
    "winning_outcome": "YES",
    "payout_address": "8mNp..."
  }
}`}
              errorExample={`{
  "success": true,
  "data": {
    "claimable": false,
    "reason": "Position lost — outcome was NO, market resolved YES"
  }
}`}
              notes={[
                "Market must be resolved before claiming",
                "Loss response returns claimable: false with a reason string",
              ]}
            />

            {/* GET /api/v1/markets/:id/resolve */}
            <EndpointDoc
              method="GET"
              path="/api/v1/markets/:id/resolve"
              price="$0.05"
              description="Trigger oracle-based resolution for a market. Returns the outcome if the market deadline has passed and oracle data is available."
              responseExample={`{
  "success": true,
  "data": {
    "resolved": true,
    "winning_outcome": "YES",
    "oracle_price": "151234.50",
    "oracle_source": "switchboard",
    "tx_signature": "9pLq...",
    "resolved_at": 1740787500
  }
}`}
              errorExample={`{
  "success": true,
  "data": {
    "resolved": false,
    "reason": "Market deadline has not passed yet",
    "end_date": 1740787200
  }
}`}
              notes={[
                "Returns resolved: false if the market deadline has not passed",
                "Oracle resolution may take a few seconds after deadline",
              ]}
            />

            {/* GET /api/v1/markets/:id/privacy-proof */}
            <EndpointDoc
              method="GET"
              path="/api/v1/markets/:id/privacy-proof?commitment_hash=abc..."
              price="$0.10"
              description="Get a ZK Merkle inclusion proof for a shielded prediction. Proves prediction existence without revealing identity or exact amount."
              params={[
                {
                  name: "commitment_hash",
                  type: "string",
                  required: true,
                  description: "Commitment hash from the original prediction (query parameter)",
                },
              ]}
              responseExample={`{
  "success": true,
  "data": {
    "position_exists": true,
    "outcome": "YES",
    "amount_range": "0.5-1",
    "merkle_root": "9f8e...",
    "proof_path": ["ab12...", "cd34...", "ef56..."]
  }
}`}
            />

            {/* GET /api/v1/markets/:id/news */}
            <EndpointDoc
              method="GET"
              path="/api/v1/markets/:id/news"
              price="$0.01"
              description="Get curated news articles related to a specific market."
              responseExample={`{
  "success": true,
  "data": {
    "news": [
      {
        "id": "uuid",
        "title": "BTC breaks $100K resistance",
        "description": "Bitcoin surpassed...",
        "image_url": "https://...",
        "url": "https://x.com/...",
        "published_at": "2026-02-20T10:00:00Z"
      }
    ]
  }
}`}
            />
          </div>
        </section>

        {/* Free Endpoints */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-black dark:text-white mb-8">
            Free Endpoints
          </h2>

          <div className="space-y-8">
            {/* GET /api/v1/markets */}
            <EndpointDoc
              method="GET"
              path="/api/v1/markets"
              price="Free"
              description="List all available prediction markets with current prices, volume, and status."
              responseExample={`{
  "success": true,
  "data": {
    "markets": [
      {
        "market_id": "7xKp...",
        "question": "Will BTC reach $150K?",
        "market_name": "BTC 150K",
        "category": "crypto",
        "yes_price": 0.62,
        "no_price": 0.38,
        "total_volume_sol": 45.5,
        "end_date": 1740787200,
        "is_completed": false,
        "winning_outcome": null,
        "oracle_feed": "HNSt...",
        "created_at": 1735689600,
        "market_version": 1
      }
    ]
  }
}`}
            />

            {/* GET /api/v1/markets/:id */}
            <EndpointDoc
              method="GET"
              path="/api/v1/markets/:id"
              price="Free"
              description="Get full details for a single market including reserves, token supply, and oracle configuration."
              responseExample={`{
  "success": true,
  "data": {
    "market_id": "7xKp...",
    "question": "Will BTC reach $150K?",
    "market_name": "BTC 150K",
    "slug": "btc-150k",
    "category": "crypto",
    "source": "x402",
    "image_url": "https://...",
    "yes_price": 0.62,
    "no_price": 0.38,
    "yes_sol_reserves": 22.5,
    "no_sol_reserves": 23.0,
    "yes_token_supply": 36.3,
    "no_token_supply": 60.5,
    "total_volume_sol": 45.5,
    "end_date": 1740787200,
    "start_date": 1735689600,
    "is_completed": false,
    "winning_outcome": null,
    "resolved_at": null,
    "oracle_feed": "HNSt...",
    "price_target": 150000,
    "comparison_type": 0,
    "metric_type": "price",
    "market_version": 1,
    "collateral_per_pair": 0.01,
    "created_at": 1735689600
  }
}`}
            />

            {/* GET /api/v1/markets/:id/history */}
            <EndpointDoc
              method="GET"
              path="/api/v1/markets/:id/history?range=1d|1w|all"
              price="Free"
              description="Get historical price snapshots for charting. Supports 1-day, 1-week, or all-time ranges."
              params={[
                {
                  name: "range",
                  type: "string",
                  required: false,
                  description: '"1d", "1w", or "all" (query parameter)',
                },
              ]}
              responseExample={`{
  "success": true,
  "data": {
    "snapshots": [
      {
        "timestamp": "2026-02-20T10:00:00Z",
        "yes_price": 0.62,
        "no_price": 0.38
      }
    ]
  }
}`}
            />

            {/* GET /api/v1/markets/:id/comments */}
            <EndpointDoc
              method="GET"
              path="/api/v1/markets/:id/comments"
              price="Free"
              description="Get comment threads for a market, including nested replies."
              responseExample={`{
  "success": true,
  "data": {
    "comments": [
      {
        "id": "uuid",
        "content": "Looking bullish!",
        "author": "alice",
        "avatar": null,
        "reply_count": 2,
        "replies": [
          {
            "id": "uuid",
            "content": "Agree!",
            "author": "bob",
            "avatar": null,
            "created_at": "2026-02-20T10:05:00Z"
          }
        ],
        "created_at": "2026-02-20T10:00:00Z"
      }
    ]
  }
}`}
            />

            {/* GET /api/v1/positions */}
            <EndpointDoc
              method="GET"
              path="/api/v1/positions?commitment_hash=abc...,def..."
              price="Free"
              description="Look up open positions by commitment hashes. Pass multiple hashes as a comma-separated list."
              params={[
                {
                  name: "commitment_hash",
                  type: "string",
                  required: true,
                  description: "Comma-separated commitment hashes (query parameter)",
                },
              ]}
              responseExample={`{
  "success": true,
  "data": {
    "positions": [
      {
        "commitment_hash": "abc123...",
        "market_id": "7xKp...",
        "outcome": "YES",
        "tokens_remaining": "500000000",
        "sol_spent": 0.5,
        "current_value_sol": 0.62,
        "payout_if_win": 0.5,
        "status": "open",
        "created_at": "2026-02-20T10:00:00Z"
      }
    ]
  }
}`}
            />

            {/* GET /api/v1/history */}
            <EndpointDoc
              method="GET"
              path="/api/v1/history?commitment_hash=abc...,def..."
              price="Free"
              description="Get trade history for given commitment hashes. Returns all buy, sell, and claim events."
              params={[
                {
                  name: "commitment_hash",
                  type: "string",
                  required: true,
                  description: "Comma-separated commitment hashes (query parameter)",
                },
              ]}
              responseExample={`{
  "success": true,
  "data": {
    "trades": [
      {
        "type": "buy",
        "commitment_hash": "abc123...",
        "market_id": "7xKp...",
        "outcome": "YES",
        "amount_sol": "500000000",
        "tokens": "312000000",
        "tx_signature": "5UBq...",
        "created_at": "2026-02-20T10:00:00Z"
      }
    ]
  }
}`}
            />

            {/* GET /health */}
            <EndpointDoc
              method="GET"
              path="/health"
              price="Free"
              description="Health check endpoint. Returns service status, version, and network information."
              responseExample={`{
  "success": true,
  "data": {
    "status": "ok",
    "version": "0.1.0",
    "network": "devnet",
    "uptime": 84321000,
    "market_count": 42
  }
}`}
            />

            {/* GET /x402-info */}
            <EndpointDoc
              method="GET"
              path="/x402-info"
              price="Free"
              description="Discover all available x402 endpoints with their methods, prices, and descriptions."
              responseExample={`{
  "success": true,
  "data": {
    "name": "Syzy Prediction Market API",
    "description": "...",
    "endpoints": [
      {
        "path": "/api/v1/markets/create",
        "method": "POST",
        "price": "$0.50",
        "price_usdc": 0.50,
        "description": "Create prediction market"
      }
    ],
    "network": "solana-devnet",
    "payment_token": "USDC"
  }
}`}
            />
          </div>
        </section>

        {/* Error Handling */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-black dark:text-white mb-8">
            Error Handling
          </h2>

          <p className="text-zinc-600 dark:text-zinc-400 mb-6 font-medium">
            All errors follow a standard format:
          </p>
          <CodeBlock
            code={`{
  "success": false,
  "error": {
    "code": "INVALID_COMMITMENT",
    "message": "commitment_hash must be exactly 64 hex characters"
  }
}`}
            language="json"
            title="Error format"
          />

          <h3 className="text-sm font-mono tracking-wide text-zinc-500 uppercase mt-12 mb-4">
            Status Codes
          </h3>
          <div className="border border-black/10 dark:border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/10 dark:border-white/10">
                  <th className="text-left px-4 py-3 font-mono text-xs text-zinc-500 font-normal">
                    Code
                  </th>
                  <th className="text-left px-4 py-3 font-mono text-xs text-zinc-500 font-normal">
                    Meaning
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                <tr className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-mono text-green-600 dark:text-green-500">200</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">Success</td>
                </tr>
                <tr className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-mono text-teal-600 dark:text-teal-500">400</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">Bad Request -- invalid parameters</td>
                </tr>
                <tr className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-mono text-blue-600 dark:text-blue-500">402</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">Payment Required -- pay and retry with X-PAYMENT header</td>
                </tr>
                <tr className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-mono text-red-600 dark:text-red-500">404</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">Not Found -- market does not exist</td>
                </tr>
                <tr className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-mono text-teal-600 dark:text-teal-500">409</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">Conflict -- duplicate commitment or market already resolved</td>
                </tr>
                <tr className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-mono text-red-500 dark:text-red-400">429</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">Rate Limited -- 100 requests/min per IP</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Environment */}
        <section>
          <h2 className="text-3xl font-bold text-black dark:text-white mb-8">
            Environment & Network
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-4 p-4 bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10">
              <div className="p-2 border border-black/10 dark:border-white/10 text-black dark:text-white">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-mono tracking-wide text-zinc-500 uppercase">Network</p>
                <p className="text-sm font-medium text-black dark:text-white">Solana Devnet</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10">
              <div className="p-2 border border-black/10 dark:border-white/10 text-black dark:text-white">
                <ArrowRight className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-mono tracking-wide text-zinc-500 uppercase">Base URL</p>
                <p className="text-sm font-medium text-black dark:text-white">Configurable (your backend)</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10">
              <div className="p-2 border border-black/10 dark:border-white/10 text-black dark:text-white">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-mono tracking-wide text-zinc-500 uppercase">Payment Token</p>
                <p className="text-sm font-medium text-black dark:text-white">USDC (Solana)</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10">
              <div className="p-2 border border-black/10 dark:border-white/10 text-black dark:text-white">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-mono tracking-wide text-zinc-500 uppercase">Protocol</p>
                <p className="text-sm font-medium text-black dark:text-white">x402 Micropayments</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
