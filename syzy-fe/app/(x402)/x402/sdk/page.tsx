"use client"

import { CodeBlock } from "@/components/x402/code-block"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const installCode = `npm install @x402/fetch @x402/svm @solana/web3.js`

const setupCode = `import { wrapFetch } from "@x402/fetch";
import { createSvmSigner } from "@x402/svm";
import { Keypair } from "@solana/web3.js";

// Create a signer from your funded Solana keypair
const keypair = Keypair.fromSecretKey(/* your secret key */);
const signer = createSvmSigner(keypair);

// Wrap the global fetch with x402 payment negotiation
const x402Fetch = wrapFetch(fetch, signer);

// Use x402Fetch like normal fetch — it handles 402 payment automatically
const API = "https://api.oyrade.com";`

const methods = [
  {
    name: "createMarket",
    endpoint: "POST /api/v1/markets/create",
    returns: "CreateMarketResult",
    price: "$0.50",
    code: `const res = await x402Fetch(\`\${API}/api/v1/markets/create\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    token_mint: "DfnxGQUsXdDH7DYdroeeSBG8etqTy1kufxBikHwTTGTa",
    question: "Will BTC reach $200K by 2027?",
    market_name: "BTC 200K 2027",
    slug: "btc-200k-2027",
    category: "crypto",
    end_date: Math.floor(new Date("2027-01-01").getTime() / 1000),
    image_url: "https://example.com/btc.png",  // optional
    oracle_feed: "BTC/USD",                     // optional
    price_target: 200000,                       // optional
    comparison_type: "above",                   // optional
  }),
});
const { data } = await res.json();
// data: { market_id, yes_token_mint, no_token_mint, tx_signature, question, end_date }`,
  },
  {
    name: "placePrediction",
    endpoint: "POST /api/v1/markets/:id/predict",
    returns: "PlacePredictionResult",
    price: "$0.01+",
    code: `const res = await x402Fetch(\`\${API}/api/v1/markets/\${marketId}/predict\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    outcome: "YES",       // "YES" or "NO"
    amount: 0.5,          // SOL amount (0.01-100), buckets: 0.1, 0.5, 1, 5, 10
    commitment_hash: "a1b2...f6a1",  // 64 hex chars, required for privacy
  }),
});
const { data } = await res.json();
// data: { prediction_id, commitment, outcome, amount, tokens_received, effective_price,
//         yes_price_after, no_price_after }`,
  },
  {
    name: "sellPosition",
    endpoint: "POST /api/v1/markets/:id/sell",
    returns: "SellResult",
    price: "$0.01",
    code: `const res = await x402Fetch(\`\${API}/api/v1/markets/\${marketId}/sell\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    commitment_hash: "a1b2...f6a1",
    payout_address: "YourSo1anaWa11etAddress...",
    amount: 0.3,  // optional: partial sell
  }),
});
const { data } = await res.json();
// data: { tx_signature, tokens_sold, sol_received, payout_address }`,
  },
  {
    name: "claimWinnings",
    endpoint: "POST /api/v1/markets/:id/claim",
    returns: "ClaimResult",
    price: "$0.01",
    code: `const res = await x402Fetch(\`\${API}/api/v1/markets/\${marketId}/claim\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    commitment_hash: "a1b2...f6a1",
    payout_address: "YourSo1anaWa11etAddress...",
  }),
});
const { data } = await res.json();
// Win:  { claimable: true, tx_signature, sol_received, winning_outcome, payout_address }
// Loss: { claimable: false, reason: "Position lost..." }`,
  },
  {
    name: "resolveMarket",
    endpoint: "GET /api/v1/markets/:id/resolve",
    returns: "ResolveMarketResult",
    price: "$0.05",
    code: `const res = await x402Fetch(\`\${API}/api/v1/markets/\${marketId}/resolve\`);
const { data } = await res.json();
// Resolved:  { resolved: true, winning_outcome, oracle_price, oracle_source, tx_signature, resolved_at }
// Not ready: { resolved: false, reason, end_date }`,
  },
  {
    name: "getPrivacyProof",
    endpoint: "GET /api/v1/markets/:id/privacy-proof",
    returns: "PrivacyProofResult",
    price: "$0.10",
    code: `const hash = "a1b2...f6a1";
const res = await x402Fetch(
  \`\${API}/api/v1/markets/\${marketId}/privacy-proof?commitment_hash=\${hash}\`
);
const { data } = await res.json();
// data: { position_exists, outcome?, amount_range?, merkle_root?, proof_path? }`,
  },
  {
    name: "getMarketNews",
    endpoint: "GET /api/v1/markets/:id/news",
    returns: "NewsResult",
    price: "$0.01",
    code: `const res = await x402Fetch(\`\${API}/api/v1/markets/\${marketId}/news\`);
const { data } = await res.json();
// data: { news: [{ id, title, description, image_url, url, published_at }] }`,
  },
  {
    name: "listMarkets",
    endpoint: "GET /api/v1/markets",
    returns: "ListMarketsResult",
    price: "Free",
    code: `const res = await fetch(\`\${API}/api/v1/markets\`);
const { data } = await res.json();
// data: { markets: [{ market_id, question, market_name, category, yes_price, no_price,
//   total_volume_sol, end_date, is_completed, winning_outcome, oracle_feed, created_at,
//   market_version }] }`,
  },
  {
    name: "getMarketDetail",
    endpoint: "GET /api/v1/markets/:id",
    returns: "MarketDetail",
    price: "Free",
    code: `const res = await fetch(\`\${API}/api/v1/markets/\${marketId}\`);
const { data } = await res.json();
// data: { market_id, question, market_name, slug, category, yes_price, no_price,
//   yes_sol_reserves, no_sol_reserves, yes_token_supply, no_token_supply,
//   total_volume_sol, end_date, is_completed, winning_outcome, source, image_url, ... }`,
  },
  {
    name: "getPositions",
    endpoint: "GET /api/v1/positions",
    returns: "PositionsResult",
    price: "Free",
    code: `const hashes = "abc123,def456";
const res = await fetch(\`\${API}/api/v1/positions?commitment_hash=\${hashes}\`);
const { data } = await res.json();
// data: { positions: [{ commitment_hash, market_id, outcome, tokens_remaining,
//   sol_spent, current_value_sol, payout_if_win, status, created_at }] }`,
  },
  {
    name: "getTradeHistory",
    endpoint: "GET /api/v1/history",
    returns: "TradeHistoryResult",
    price: "Free",
    code: `const hashes = "abc123,def456";
const res = await fetch(\`\${API}/api/v1/history?commitment_hash=\${hashes}\`);
const { data } = await res.json();
// data: { trades: [{ type, commitment_hash, market_id, outcome, amount_sol,
//   tokens, tx_signature, created_at }] }`,
  },
  {
    name: "getHealth",
    endpoint: "GET /health",
    returns: "HealthResult",
    price: "Free",
    code: `const res = await fetch(\`\${API}/health\`);
const { data } = await res.json();
// data: { status: "ok", version: "0.1.0", network: "devnet", uptime: 84321000, market_count: 42 }`,
  },
  {
    name: "getEndpointInfo",
    endpoint: "GET /x402-info",
    returns: "EndpointInfoResult",
    price: "Free",
    code: `const res = await fetch(\`\${API}/x402-info\`);
const { data } = await res.json();
// data: { name, description, endpoints: [...], network: "solana-devnet", payment_token: "USDC" }`,
  },
]

const typesCode = `// Request types

interface CreateMarketParams {
  token_mint: string;
  question: string;
  market_name: string;
  slug: string;
  category: string;
  end_date: number;              // Unix timestamp
  image_url?: string;
  source?: string;
  oracle_feed?: string;
  price_target?: number;
  comparison_type?: string;
  market_version?: number;
  collateral_per_pair?: number;
}

interface PlacePredictionParams {
  outcome: "YES" | "NO";
  amount: number;                // SOL (0.01-100), buckets: 0.1, 0.5, 1, 5, 10
  commitment_hash: string;       // 64 hex chars, required
}

interface SellParams {
  commitment_hash: string;
  payout_address: string;
  amount?: number;               // Optional: partial sell
}

interface ClaimParams {
  commitment_hash: string;
  payout_address: string;
}

// Response types

interface CreateMarketResult {
  market_id: string;
  yes_token_mint: string;
  no_token_mint: string;
  tx_signature: string;
  question: string;
  end_date: number;
}

interface PlacePredictionResult {
  prediction_id: string;
  commitment: string;
  outcome: "YES" | "NO";
  amount: number;
  tokens_received: number;
  effective_price: number;
  yes_price_after: number;
  no_price_after: number;
}

interface SellResult {
  tx_signature: string;
  tokens_sold: number;
  sol_received: number;
  payout_address: string;
}

interface ClaimResult {
  claimable: boolean;
  tx_signature?: string;
  sol_received?: number;
  winning_outcome?: "YES" | "NO";
  payout_address?: string;
  reason?: string;
}

interface ResolveMarketResult {
  resolved: boolean;
  winning_outcome?: "YES" | "NO";
  oracle_price?: number;
  oracle_source?: string;
  tx_signature?: string;
  resolved_at?: string;
  reason?: string;
  end_date?: number;
}

interface PrivacyProofResult {
  position_exists: boolean;
  outcome?: "YES" | "NO";
  amount_range?: string;
  merkle_root?: string;
  proof_path?: string[];
}

interface NewsItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  url: string;
  published_at: string;
}

interface MarketSummary {
  market_id: string;
  question: string;
  market_name: string;
  category: string;
  yes_price: number;
  no_price: number;
  total_volume_sol: number;
  end_date: number;
  is_completed: boolean;
  winning_outcome: "YES" | "NO" | null;
  oracle_feed: string | null;
  created_at: string;
  market_version: number;
}

interface MarketDetail extends MarketSummary {
  slug: string;
  source: string | null;
  image_url: string | null;
  yes_sol_reserves: number;
  no_sol_reserves: number;
  yes_token_supply: number;
  no_token_supply: number;
}

interface PositionResult {
  commitment_hash: string;
  market_id: string;
  outcome: "YES" | "NO";
  tokens_remaining: number;
  sol_spent: number;
  current_value_sol: number;
  payout_if_win: number;
  status: string;
  created_at: string;
}

interface TradeResult {
  type: string;
  commitment_hash: string;
  market_id: string;
  outcome: "YES" | "NO";
  amount_sol: number;
  tokens: number;
  tx_signature: string;
  created_at: string;
}

interface HealthResult {
  status: "ok";
  version: string;
  network: string;
  uptime: number;
  market_count: number;
}

interface EndpointInfoResult {
  name: string;
  description: string;
  endpoints: {
    path: string;
    method: string;
    price_usd: string;
    description: string;
  }[];
  network: string;
  payment_token: string;
}`

const errorHandlingCode = `try {
  const res = await x402Fetch(\`\${API}/api/v1/markets/create\`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token_mint: "DfnxGQUsXdDH7DYdroeeSBG8etqTy1kufxBikHwTTGTa",
      question: "Will SOL reach $1000?",
      market_name: "SOL 1000",
      slug: "sol-1000",
      category: "crypto",
      end_date: Math.floor(new Date("2027-01-01").getTime() / 1000),
    }),
  });

  if (!res.ok) {
    // API returned an error (400, 404, 409, 429, etc.)
    const error = await res.json();
    console.error("API error:", res.status, error);
    return;
  }

  const { data } = await res.json();
  console.log("Market created:", data.market_id);
} catch (error) {
  // Network error or x402 payment failure (insufficient USDC, etc.)
  console.error("Request failed:", error);
}`

export default function SdkPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        {/* Header */}
        <div className="mb-16">
          <Badge variant="outline" className="mb-4">
            API Reference
          </Badge>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            REST API & SDK Reference
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Use <code className="font-mono text-sm">@x402/fetch</code> to
            interact with the Syzy x402 prediction market API. Payment
            negotiation, signing, and retries are handled automatically.
          </p>
        </div>

        {/* Installation */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Installation
          </h2>
          <CodeBlock code={installCode} language="bash" title="Terminal" />
        </section>

        {/* Client Setup */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Client Setup
          </h2>
          <CodeBlock code={setupCode} language="typescript" title="TypeScript" />
        </section>

        {/* Method Reference */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            API Reference
          </h2>

          {/* Summary table */}
          <div className="rounded-lg border border-border overflow-hidden mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-4 py-3 font-semibold text-foreground">
                    Endpoint
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">
                    Returns
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-foreground">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {methods.map((m) => (
                  <tr key={m.name}>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">
                      {m.endpoint}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {m.returns}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right text-xs font-semibold",
                        m.price === "Free"
                          ? "text-emerald-500"
                          : "text-teal-500"
                      )}
                    >
                      {m.price}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Individual method docs */}
          <div className="space-y-8">
            {methods.map((m) => (
              <div key={m.name}>
                <div className="flex items-center gap-3 mb-3">
                  <code className="font-mono text-sm font-semibold text-foreground">
                    {m.endpoint}
                  </code>
                  <span className="text-xs text-muted-foreground">
                    &rarr; <code className="font-mono">{m.returns}</code>
                  </span>
                </div>
                <CodeBlock
                  code={m.code}
                  language="typescript"
                  title="TypeScript"
                />
              </div>
            ))}
          </div>
        </section>

        {/* TypeScript Types */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            TypeScript Types
          </h2>
          <p className="text-muted-foreground mb-4">
            All request and response types for the API:
          </p>
          <CodeBlock
            code={typesCode}
            language="typescript"
            title="types.ts"
          />
        </section>

        {/* Error Handling */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Error Handling
          </h2>
          <p className="text-muted-foreground mb-4">
            Use standard <code className="font-mono text-sm">fetch</code> error
            handling. The <code className="font-mono text-sm">@x402/fetch</code>{" "}
            wrapper throws on network errors and payment failures:
          </p>
          <CodeBlock
            code={errorHandlingCode}
            language="typescript"
            title="Error handling"
          />
        </section>
      </div>
    </div>
  )
}
