"use client"

import { CodeBlock } from "@/components/x402/code-block"
import { TerminalCard } from "@/components/x402/terminal-card"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

const examples = [
  {
    title: "Create Market & Place Prediction",
    description:
      "Full flow: create a prediction market, then place a privacy-preserving prediction using a commitment hash.",
    code: `import { wrapFetch } from "@x402/fetch";
import { createSvmSigner } from "@x402/svm";
import { Keypair } from "@solana/web3.js";

const API = "https://api.oyrade.com";

async function createAndPredict() {
  // Setup x402-enabled fetch with a funded Solana wallet
  const keypair = Keypair.fromSecretKey(/* your secret key */);
  const signer = createSvmSigner(keypair);
  const x402Fetch = wrapFetch(fetch, signer);

  // Step 1: Create a prediction market ($0.50)
  const createRes = await x402Fetch(\`\${API}/api/v1/markets/create\`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token_mint: "DfnxGQUsXdDH7DYdroeeSBG8etqTy1kufxBikHwTTGTa",
      question: "Will ETH reach $10K by June 2026?",
      market_name: "ETH 10K Q2 2026",
      slug: "eth-10k-q2-2026",
      category: "crypto",
      end_date: Math.floor(new Date("2026-06-01").getTime() / 1000),
      oracle_feed: "ETH/USD",
      price_target: 10000,
      comparison_type: "above",
    }),
  });
  const { data: market } = await createRes.json();

  console.log("Market created:", market.market_id);
  console.log("YES token:", market.yes_token_mint);
  console.log("NO token:", market.no_token_mint);
  console.log("Tx:", market.tx_signature);

  // Step 2: Place a prediction on YES ($0.01 + 3% of amount)
  const predictRes = await x402Fetch(
    \`\${API}/api/v1/markets/\${market.market_id}/predict\`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outcome: "YES",
        amount: 0.5,
        commitment_hash:
          "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
      }),
    }
  );
  const { data: prediction } = await predictRes.json();

  console.log("Prediction ID:", prediction.prediction_id);
  console.log("Tokens received:", prediction.tokens_received);
  console.log("Effective price:", prediction.effective_price);
  console.log("YES price after:", prediction.yes_price_after);
  console.log("NO price after:", prediction.no_price_after);
}

createAndPredict().catch(console.error);`,
    output:
      "Market created: 7xKp...\nYES token: 4rQz...\nNO token: 8mNp...\nTx: 5vGh...\nPrediction ID: pred_01H...\nTokens received: 0.612\nEffective price: 0.817\nYES price after: 0.83\nNO price after: 0.17",
  },
  {
    title: "Sell Position & Claim Winnings",
    description:
      "Sell an existing position for SOL, or claim winnings from a resolved market using your commitment hash.",
    code: `import { wrapFetch } from "@x402/fetch";
import { createSvmSigner } from "@x402/svm";
import { Keypair } from "@solana/web3.js";

const API = "https://api.oyrade.com";

async function sellAndClaim() {
  const keypair = Keypair.fromSecretKey(/* your secret key */);
  const signer = createSvmSigner(keypair);
  const x402Fetch = wrapFetch(fetch, signer);

  const marketId = "7xKp...";
  const commitmentHash =
    "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2";
  const payoutAddress = "YourSo1anaWa11etAddress...";

  // Sell a position before market resolves ($0.01)
  console.log("=== Selling Position ===");
  const sellRes = await x402Fetch(
    \`\${API}/api/v1/markets/\${marketId}/sell\`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commitment_hash: commitmentHash,
        payout_address: payoutAddress,
        amount: 0.3, // optional: partial sell
      }),
    }
  );
  const { data: sell } = await sellRes.json();

  console.log("Tokens sold:", sell.tokens_sold);
  console.log("SOL received:", sell.sol_received);
  console.log("Payout address:", sell.payout_address);
  console.log("Tx:", sell.tx_signature);

  // Claim winnings after market resolves ($0.01)
  console.log("\\n=== Claiming Winnings ===");
  const claimRes = await x402Fetch(
    \`\${API}/api/v1/markets/\${marketId}/claim\`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commitment_hash: commitmentHash,
        payout_address: payoutAddress,
      }),
    }
  );
  const { data: claim } = await claimRes.json();

  if (claim.claimable) {
    console.log("Winnings claimed!");
    console.log("SOL received:", claim.sol_received);
    console.log("Winning outcome:", claim.winning_outcome);
    console.log("Tx:", claim.tx_signature);
  } else {
    console.log("Not claimable:", claim.reason);
  }
}

sellAndClaim().catch(console.error);`,
    output:
      "=== Selling Position ===\nTokens sold: 0.30\nSOL received: 0.245\nPayout address: YourSo1ana...\nTx: 3kFm...\n\n=== Claiming Winnings ===\nWinnings claimed!\nSOL received: 0.312\nWinning outcome: YES\nTx: 9pLx...",
  },
  {
    title: "Resolve Market & Check Positions",
    description:
      "Trigger oracle-based resolution for a market, then check your open positions across markets.",
    code: `import { wrapFetch } from "@x402/fetch";
import { createSvmSigner } from "@x402/svm";
import { Keypair } from "@solana/web3.js";

const API = "https://api.oyrade.com";

async function resolveAndCheckPositions() {
  const keypair = Keypair.fromSecretKey(/* your secret key */);
  const signer = createSvmSigner(keypair);
  const x402Fetch = wrapFetch(fetch, signer);

  const marketId = "7xKp...";

  // Resolve market via oracle ($0.05)
  console.log("=== Resolving Market ===");
  const resolveRes = await x402Fetch(
    \`\${API}/api/v1/markets/\${marketId}/resolve\`
  );
  const { data: resolution } = await resolveRes.json();

  if (resolution.resolved) {
    console.log("Market resolved!");
    console.log("Winning outcome:", resolution.winning_outcome);
    console.log("Oracle price:", resolution.oracle_price);
    console.log("Oracle source:", resolution.oracle_source);
    console.log("Tx:", resolution.tx_signature);
    console.log("Resolved at:", resolution.resolved_at);
  } else {
    console.log("Not ready:", resolution.reason);
    console.log("End date:", resolution.end_date);
  }

  // Check positions across markets (free)
  console.log("\\n=== Checking Positions ===");
  const hashes = [
    "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
    "f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5",
  ].join(",");

  const posRes = await fetch(
    \`\${API}/api/v1/positions?commitment_hash=\${hashes}\`
  );
  const { data: posData } = await posRes.json();

  for (const pos of posData.positions) {
    console.log(\`\\nPosition: \${pos.commitment_hash.slice(0, 8)}...\`);
    console.log("  Market:", pos.market_id);
    console.log("  Outcome:", pos.outcome);
    console.log("  Tokens remaining:", pos.tokens_remaining);
    console.log("  Current value:", pos.current_value_sol, "SOL");
    console.log("  Payout if win:", pos.payout_if_win, "SOL");
    console.log("  Status:", pos.status);
  }
}

resolveAndCheckPositions().catch(console.error);`,
    output:
      "=== Resolving Market ===\nMarket resolved!\nWinning outcome: YES\nOracle price: 10523.45\nOracle source: switchboard\nTx: 5vGh...\nResolved at: 2026-06-01T00:05:00Z\n\n=== Checking Positions ===\n\nPosition: a1b2c3d4...\n  Market: 7xKp...\n  Outcome: YES\n  Tokens remaining: 0.612\n  Current value: 0.612 SOL\n  Payout if win: 0.612 SOL\n  Status: claimable\n\nPosition: f6e5d4c3...\n  Market: 9mNq...\n  Outcome: NO\n  Tokens remaining: 1.05\n  Current value: 0.42 SOL\n  Payout if win: 1.05 SOL\n  Status: active",
  },
  {
    title: "Full Demo Agent",
    description:
      "End-to-end agent script: health check, list markets, create market, predict, check positions, resolve, and claim.",
    code: `import { wrapFetch } from "@x402/fetch";
import { createSvmSigner } from "@x402/svm";
import { Keypair } from "@solana/web3.js";

const API = "https://api.oyrade.com";

async function runDemoAgent() {
  const keypair = Keypair.fromSecretKey(/* your secret key */);
  const signer = createSvmSigner(keypair);
  const x402Fetch = wrapFetch(fetch, signer);

  // 1. Health check (free)
  console.log("=== Step 1: Health Check ===");
  const healthRes = await fetch(\`\${API}/health\`);
  const { data: health } = await healthRes.json();
  console.log("Status:", health.status);
  console.log("Network:", health.network);
  console.log("Version:", health.version);
  console.log("Markets:", health.market_count);

  // 2. List markets (free)
  console.log("\\n=== Step 2: List Markets ===");
  const listRes = await fetch(\`\${API}/api/v1/markets\`);
  const { data: listData } = await listRes.json();
  console.log(\`Found \${listData.markets.length} markets\`);
  for (const m of listData.markets.slice(0, 3)) {
    console.log(\`  \${m.question} — YES: \${m.yes_price} / NO: \${m.no_price}\`);
  }

  // 3. Create market ($0.50)
  console.log("\\n=== Step 3: Create Market ===");
  const createRes = await x402Fetch(\`\${API}/api/v1/markets/create\`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token_mint: "DfnxGQUsXdDH7DYdroeeSBG8etqTy1kufxBikHwTTGTa",
      question: "Will SOL reach $500 by Q2 2026?",
      market_name: "SOL 500 Q2 2026",
      slug: "sol-500-q2-2026",
      category: "crypto",
      end_date: Math.floor(new Date("2026-06-30").getTime() / 1000),
    }),
  });
  const { data: market } = await createRes.json();
  console.log("Market ID:", market.market_id);

  // 4. Place prediction ($0.01 + 3% of 0.5 SOL)
  console.log("\\n=== Step 4: Place Prediction ===");
  const commitmentHash =
    "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2";
  const predictRes = await x402Fetch(
    \`\${API}/api/v1/markets/\${market.market_id}/predict\`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outcome: "YES",
        amount: 0.5,
        commitment_hash: commitmentHash,
      }),
    }
  );
  const { data: prediction } = await predictRes.json();
  console.log("Prediction ID:", prediction.prediction_id);
  console.log("Tokens received:", prediction.tokens_received);
  console.log("Effective price:", prediction.effective_price);

  // 5. Check positions (free)
  console.log("\\n=== Step 5: Check Positions ===");
  const posRes = await fetch(
    \`\${API}/api/v1/positions?commitment_hash=\${commitmentHash}\`
  );
  const { data: posData } = await posRes.json();
  for (const pos of posData.positions) {
    console.log("Outcome:", pos.outcome);
    console.log("Tokens:", pos.tokens_remaining);
    console.log("Current value:", pos.current_value_sol, "SOL");
  }

  // 6. Resolve market ($0.05)
  console.log("\\n=== Step 6: Resolve Market ===");
  const resolveRes = await x402Fetch(
    \`\${API}/api/v1/markets/\${market.market_id}/resolve\`
  );
  const { data: resolution } = await resolveRes.json();
  console.log("Resolved:", resolution.resolved);
  if (resolution.resolved) {
    console.log("Winner:", resolution.winning_outcome);
  }

  // 7. Claim winnings ($0.01)
  console.log("\\n=== Step 7: Claim Winnings ===");
  const claimRes = await x402Fetch(
    \`\${API}/api/v1/markets/\${market.market_id}/claim\`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commitment_hash: commitmentHash,
        payout_address: keypair.publicKey.toBase58(),
      }),
    }
  );
  const { data: claim } = await claimRes.json();
  if (claim.claimable) {
    console.log("Claimed:", claim.sol_received, "SOL");
  } else {
    console.log("Not claimable:", claim.reason);
  }

  console.log("\\n=== Demo Complete ===");
  console.log("Total x402 cost: ~$0.57");
  console.log("(create $0.50 + predict ~$0.025 + resolve $0.05 + claim $0.01)");
}

runDemoAgent().catch(console.error);`,
    output:
      '=== Step 1: Health Check ===\nStatus: ok\nNetwork: devnet\nVersion: 0.1.0\nMarkets: 42\n\n=== Step 2: List Markets ===\nFound 42 markets\n  Will ETH reach $10K by June 2026? — YES: 0.62 / NO: 0.38\n  Will BTC hit $200K by 2027? — YES: 0.45 / NO: 0.55\n  Will SOL flip ETH market cap? — YES: 0.12 / NO: 0.88\n\n=== Step 3: Create Market ===\nMarket ID: 9pLx...\n\n=== Step 4: Place Prediction ===\nPrediction ID: pred_01H...\nTokens received: 0.612\nEffective price: 0.817\n\n=== Step 5: Check Positions ===\nOutcome: YES\nTokens: 0.612\nCurrent value: 0.5 SOL\n\n=== Step 6: Resolve Market ===\nResolved: false\n\n=== Step 7: Claim Winnings ===\nNot claimable: Market not yet resolved\n\n=== Demo Complete ===\nTotal x402 cost: ~$0.57\n(create $0.50 + predict ~$0.025 + resolve $0.05 + claim $0.01)',
  },
]

export default function ExamplesPage() {
  return (
    <div className="py-16 md:py-24 bg-white dark:bg-black text-black dark:text-white min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl relative z-10">
        {/* Header */}
        <div className="mb-16">
          <div className="inline-flex items-center px-2 py-1 border border-black/20 dark:border-white/20 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mb-6 tracking-wide">
            EXAMPLES
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-6 tracking-tight">
            Code Examples
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl font-medium">
            Copy-paste working examples for common x402 API workflows. Each
            example uses <code className="font-mono text-sm">@x402/fetch</code>{" "}
            for automatic payment negotiation and can run as a standalone script.
          </p>
        </div>

        {/* Examples */}
        <div className="space-y-12">
          {examples.map((example, index) => (
            <TerminalCard
              key={index}
              className="pb-6"
            >
              <div className="py-6 border-b border-black/10 dark:border-white/10 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-flex items-center px-2 py-1 border border-black/20 dark:border-white/20 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 tracking-wide uppercase">
                    Example [{index + 1}]
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-black dark:text-white mb-2">
                  {example.title}
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {example.description}
                </p>
              </div>
              <div className="space-y-6">
                <CodeBlock
                  code={example.code}
                  language="typescript"
                  title="TypeScript"
                />
                <div>
                  <p className="text-xs font-mono tracking-wide text-zinc-500 uppercase mb-3">
                    Expected Output
                  </p>
                  <pre className="border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-4 overflow-x-auto">
                    <code className="text-xs font-mono text-green-600 dark:text-green-500 leading-relaxed whitespace-pre">
                      {example.output}
                    </code>
                  </pre>
                </div>
              </div>
            </TerminalCard>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-4 border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] px-6 py-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Want to see the full API reference and types?
            </p>
            <Link
              href="/x402/sdk"
              className="text-sm font-mono text-green-600 dark:text-green-500 hover:text-green-500 dark:hover:text-green-400 transition-colors inline-flex items-center gap-2"
            >
              View API Reference <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
