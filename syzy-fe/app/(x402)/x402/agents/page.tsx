"use client"

import { TerminalCard } from "@/components/x402/terminal-card"
import { CodeBlock } from "@/components/x402/code-block"
import {
  AgentNetworkIcon,
  PredictionChartIcon,
  OracleLightningIcon,
  PrivacyHexIcon,
  TargetCrosshairIcon,
  CheckCircleNeonIcon,
} from "@/components/x402/icons"
import { ArrowRight, MessageSquare, Wallet, Zap, Search, TrendingUp, Shield } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

const examplePrompts = [
  {
    category: "Explore Markets",
    icon: <Search className="h-4 w-4" />,
    prompts: [
      "Show me all active crypto prediction markets",
      "What are the current odds on BTC reaching $200K?",
      "Find markets with the highest trading volume",
    ],
  },
  {
    category: "Trade & Predict",
    icon: <TrendingUp className="h-4 w-4" />,
    prompts: [
      "Place a 0.5 SOL bet on YES for the ETH market",
      "Create a market: Will SOL reach $500 by June?",
      "Sell my position on market 7xKp...",
    ],
  },
  {
    category: "Analyze & Monitor",
    icon: <PredictionChartIcon className="h-4 w-4" />,
    prompts: [
      "Show my portfolio — what positions do I have?",
      "What's the oracle price feed for ETH/USD?",
      "Check if market 9pLx... is ready to resolve",
    ],
  },
  {
    category: "Privacy & ZK",
    icon: <Shield className="h-4 w-4" />,
    prompts: [
      "Generate a ZK proof for my shielded position",
      "Claim my winnings from the resolved BTC market",
      "Check platform health and status",
    ],
  },
]

const readTools = [
  {
    name: "get_markets",
    description: "List active prediction markets with odds, volume, and categories",
  },
  {
    name: "get_market_details",
    description: "Get full details for a specific market by ID — odds, reserves, oracle config",
  },
  {
    name: "get_portfolio",
    description: "View your current positions, P&L, and payout estimates",
  },
  {
    name: "get_price_feed",
    description: "Get real-time oracle price feed for a token (Switchboard)",
  },
  {
    name: "system_health",
    description: "Check platform health, version, network, and market count",
  },
]

const writeTools = [
  {
    name: "create_market",
    cost: "$0.50",
    description: "Create a new on-chain prediction market with oracle integration",
  },
  {
    name: "place_prediction",
    cost: "dynamic",
    description: "Buy YES or NO tokens on a market with privacy commitment",
  },
  {
    name: "resolve_market",
    cost: "$0.05",
    description: "Trigger oracle-based resolution for an expired market",
  },
  {
    name: "get_merkle_proof",
    cost: "$0.10",
    description: "Generate ZK Merkle inclusion proof for shielded positions",
  },
]

const agentSetupCode = `// The Agent Chat handles everything for you:
// 1. Connect your Solana wallet
// 2. Switch to "Live" mode in the chat
// 3. Fund your session with USDC
// 4. Start chatting — the agent executes on-chain

// Example conversation:
You: "Show me active crypto markets"
Agent: Found 42 markets. Top by volume:
  1. Will BTC reach $200K by 2027? — YES: 0.45 / NO: 0.55
  2. Will ETH reach $10K by Q2?   — YES: 0.62 / NO: 0.38
  3. Will SOL flip ETH mcap?      — YES: 0.12 / NO: 0.88

You: "Place 0.5 SOL on YES for the BTC market"
Agent: Placing prediction... ✓
  Tokens received: 1.11 YES
  Effective price: 0.45 SOL/token
  x402 cost: $0.025
  Tx: 5vGh...`

const apiAgentCode = `import { wrapFetch } from "@x402/fetch";
import { createSvmSigner } from "@x402/svm";
import { Keypair } from "@solana/web3.js";

const API = "https://api.oyrade.com";
const keypair = Keypair.fromSecretKey(/* funded wallet */);
const x402Fetch = wrapFetch(fetch, createSvmSigner(keypair));

// Your agent can call any x402 endpoint programmatically
// List markets (free)
const markets = await fetch(\`\${API}/api/v1/markets\`);
const { data } = await markets.json();

// Place a prediction ($0.01 + 3% of amount)
const res = await x402Fetch(\`\${API}/api/v1/markets/\${id}/predict\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    outcome: "YES",
    amount: 0.5,
    commitment_hash: "a1b2c3d4...f6a1b2",
  }),
});`

export default function AgentDocsPage() {
  return (
    <div className="py-16 md:py-24 bg-white dark:bg-black text-black dark:text-white min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl relative z-10">
        {/* Header */}
        <div className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center px-2 py-1 border border-black/20 dark:border-white/20 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mb-6 tracking-wide">
              AGENT GUIDE
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-6 tracking-tight">
              AI Agent Guide
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl font-medium">
              Syzy&apos;s AI agent can explore markets, analyze data, and execute
              on-chain trades via natural language. Use the dashboard chat or build
              your own agent with the x402 API.
            </p>
          </motion.div>
        </div>

        {/* Open Agent Chat CTA */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-20"
        >
          <TerminalCard label=">>">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-2.5 border border-emerald-500/20 bg-emerald-500/5">
                  <MessageSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-black dark:text-white">
                    Try the Agent Chat
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Connect your wallet and start chatting — no setup required
                  </p>
                </div>
              </div>
              <Link
                href="/agent"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-mono text-emerald-600 dark:text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/10 transition-colors"
              >
                Open Agent Chat <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </TerminalCard>
        </motion.div>

        {/* Getting Started */}
        <section className="mb-20 border-t border-black/10 dark:border-white/10 pt-20">
          <h2 className="text-3xl font-bold tracking-tight text-black dark:text-white mb-4">
            Getting Started
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-12 font-medium">
            Two ways to use the Syzy agent — the dashboard chat or the REST API.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <TerminalCard delay={0.1} label="1" className="flex flex-col">
              <div className="font-mono text-zinc-500 dark:text-zinc-600 border-b border-black/10 dark:border-white/10 pb-4 mb-4">
                <span className="text-emerald-600 dark:text-emerald-500">#</span> Connect
              </div>
              <div className="flex items-start gap-3 mb-3">
                <Wallet className="h-5 w-5 text-zinc-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-bold text-black dark:text-white tracking-tight">
                    Connect Wallet
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-500 mt-1 leading-relaxed">
                    Open the Agent Chat and connect your Solana wallet (Phantom or Solflare).
                  </p>
                </div>
              </div>
            </TerminalCard>

            <TerminalCard delay={0.2} label="2" className="flex flex-col">
              <div className="font-mono text-zinc-500 dark:text-zinc-600 border-b border-black/10 dark:border-white/10 pb-4 mb-4">
                <span className="text-emerald-600 dark:text-emerald-500">#</span> Fund
              </div>
              <div className="flex items-start gap-3 mb-3">
                <Zap className="h-5 w-5 text-zinc-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-bold text-black dark:text-white tracking-tight">
                    Switch to Live Mode
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-500 mt-1 leading-relaxed">
                    Toggle <strong>Live</strong> mode in the chat input and fund your session wallet with USDC.
                  </p>
                </div>
              </div>
            </TerminalCard>

            <TerminalCard delay={0.3} label="3" className="flex flex-col">
              <div className="font-mono text-zinc-500 dark:text-zinc-600 border-b border-black/10 dark:border-white/10 pb-4 mb-4">
                <span className="text-emerald-600 dark:text-emerald-500">#</span> Chat
              </div>
              <div className="flex items-start gap-3 mb-3">
                <MessageSquare className="h-5 w-5 text-zinc-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-bold text-black dark:text-white tracking-tight">
                    Start Chatting
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-500 mt-1 leading-relaxed">
                    Ask anything in natural language. The agent handles tool selection and on-chain execution.
                  </p>
                </div>
              </div>
            </TerminalCard>
          </div>
        </section>

        {/* What You Can Ask */}
        <section className="mb-20 border-t border-black/10 dark:border-white/10 pt-20">
          <h2 className="text-3xl font-bold tracking-tight text-black dark:text-white mb-4">
            What You Can Ask
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-12 font-medium">
            The agent understands natural language commands across these categories.
          </p>

          <div className="grid sm:grid-cols-2 gap-6">
            {examplePrompts.map((category, index) => (
              <TerminalCard
                key={category.category}
                delay={0.1 + index * 0.1}
                label={`0${index + 1}`}
              >
                <div className="flex items-center gap-2.5 mb-5">
                  <span className="text-emerald-600 dark:text-emerald-500">
                    {category.icon}
                  </span>
                  <h3 className="text-base font-bold text-black dark:text-white tracking-tight">
                    {category.category}
                  </h3>
                </div>
                <div className="space-y-3">
                  {category.prompts.map((prompt) => (
                    <div
                      key={prompt}
                      className="flex items-start gap-2.5 text-sm text-zinc-600 dark:text-zinc-400"
                    >
                      <span className="text-zinc-400 dark:text-zinc-600 font-mono shrink-0 mt-px">
                        &gt;
                      </span>
                      <span className="font-mono text-[13px] leading-relaxed">
                        &quot;{prompt}&quot;
                      </span>
                    </div>
                  ))}
                </div>
              </TerminalCard>
            ))}
          </div>
        </section>

        {/* Example Conversation */}
        <section className="mb-20 border-t border-black/10 dark:border-white/10 pt-20">
          <h2 className="text-3xl font-bold tracking-tight text-black dark:text-white mb-4">
            Example Conversation
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-8 font-medium">
            A sample interaction showing market exploration and trading via the Agent Chat.
          </p>

          <CodeBlock code={agentSetupCode} language="bash" title="Agent Chat" />
        </section>

        {/* Available Tools */}
        <section className="mb-20 border-t border-black/10 dark:border-white/10 pt-20">
          <h2 className="text-3xl font-bold tracking-tight text-black dark:text-white mb-4">
            Available Tools
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-12 font-medium">
            The agent automatically selects the right tool based on your request.
          </p>

          {/* Read Tools */}
          <div className="mb-10">
            <h3 className="text-sm font-mono tracking-wide text-zinc-500 dark:text-zinc-400 uppercase mb-4">
              Read Tools — Free
            </h3>
            <TerminalCard delay={0.1} label="R">
              <div className="divide-y divide-black/5 dark:divide-white/5 -mx-6 sm:-mx-8">
                {readTools.map((tool) => (
                  <div
                    key={tool.name}
                    className="flex items-start justify-between px-6 sm:px-8 py-4"
                  >
                    <div>
                      <code className="text-sm font-mono font-semibold text-black dark:text-white">
                        {tool.name}
                      </code>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1 leading-relaxed">
                        {tool.description}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-500 tracking-widest uppercase shrink-0 ml-4 mt-1">
                      FREE
                    </span>
                  </div>
                ))}
              </div>
            </TerminalCard>
          </div>

          {/* Write Tools */}
          <div>
            <h3 className="text-sm font-mono tracking-wide text-zinc-500 dark:text-zinc-400 uppercase mb-4">
              Write Tools — x402 Payment
            </h3>
            <TerminalCard delay={0.2} label="W">
              <div className="divide-y divide-black/5 dark:divide-white/5 -mx-6 sm:-mx-8">
                {writeTools.map((tool) => (
                  <div
                    key={tool.name}
                    className="flex items-start justify-between px-6 sm:px-8 py-4"
                  >
                    <div>
                      <code className="text-sm font-mono font-semibold text-black dark:text-white">
                        {tool.name}
                      </code>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1 leading-relaxed">
                        {tool.description}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-teal-600 dark:text-teal-500 tracking-widest uppercase shrink-0 ml-4 mt-1">
                      {tool.cost}
                    </span>
                  </div>
                ))}
              </div>
            </TerminalCard>
          </div>
        </section>

        {/* How Payments Work */}
        <section className="mb-20 border-t border-black/10 dark:border-white/10 pt-20">
          <h2 className="text-3xl font-bold tracking-tight text-black dark:text-white mb-4">
            How x402 Payments Work
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-12 font-medium">
            The agent handles payments automatically via the x402 protocol. Here&apos;s the flow:
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Live Mode",
                description:
                  "Switch the agent to Live mode using the toggle in the chat input bar.",
              },
              {
                step: "02",
                title: "Fund Session",
                description:
                  "Deposit USDC to your session wallet using the budget panel in the sidebar.",
              },
              {
                step: "03",
                title: "Chat Naturally",
                description:
                  "Ask the agent to trade, create markets, or resolve — it picks the right tool.",
              },
              {
                step: "04",
                title: "Auto-Pay",
                description:
                  "When a paid tool is needed, the agent deducts USDC from your session balance automatically.",
              },
              {
                step: "05",
                title: "Confirmation",
                description:
                  "You see the cost and transaction result inline in the chat. No hidden fees.",
              },
              {
                step: "06",
                title: "Withdraw",
                description:
                  "Remaining funds can be withdrawn back to your wallet at any time.",
              },
            ].map((item, index) => (
              <TerminalCard key={item.step} delay={0.1 + index * 0.05} label={item.step}>
                <h4 className="text-base font-bold text-black dark:text-white mb-2 tracking-tight">
                  {item.title}
                </h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-500 leading-relaxed">
                  {item.description}
                </p>
              </TerminalCard>
            ))}
          </div>
        </section>

        {/* Build Your Own Agent */}
        <section className="mb-20 border-t border-black/10 dark:border-white/10 pt-20">
          <h2 className="text-3xl font-bold tracking-tight text-black dark:text-white mb-4">
            Build Your Own Agent
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-8 font-medium">
            Use the x402 REST API to build custom agents that trade on Syzy programmatically.
          </p>

          <CodeBlock code={apiAgentCode} language="typescript" title="TypeScript" />

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              href="/x402/examples"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-mono border border-black/20 dark:border-white/20 text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              View Full Examples <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/x402/sdk"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-mono border border-black/20 dark:border-white/20 text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              SDK Reference <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        {/* Tips */}
        <section className="border-t border-black/10 dark:border-white/10 pt-20">
          <h2 className="text-3xl font-bold tracking-tight text-black dark:text-white mb-12">
            Tips & Best Practices
          </h2>

          <div className="grid sm:grid-cols-2 gap-6">
            <TerminalCard delay={0.1} label="T1">
              <div className="flex items-start gap-3">
                <CheckCircleNeonIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-base font-bold text-black dark:text-white mb-1.5 tracking-tight">
                    Be Specific
                  </h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-500 leading-relaxed">
                    Include market IDs, token symbols, and amounts. &quot;Place 0.5 SOL on YES for market
                    7xKp&quot; works better than &quot;bet on crypto.&quot;
                  </p>
                </div>
              </div>
            </TerminalCard>

            <TerminalCard delay={0.2} label="T2">
              <div className="flex items-start gap-3">
                <TargetCrosshairIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-base font-bold text-black dark:text-white mb-1.5 tracking-tight">
                    Explore First
                  </h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-500 leading-relaxed">
                    Read tools are free. Ask to list markets, check odds, and view your portfolio
                    before making paid trades.
                  </p>
                </div>
              </div>
            </TerminalCard>

            <TerminalCard delay={0.3} label="T3">
              <div className="flex items-start gap-3">
                <PrivacyHexIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-base font-bold text-black dark:text-white mb-1.5 tracking-tight">
                    Privacy by Default
                  </h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-500 leading-relaxed">
                    The agent uses commitment hashes and ephemeral keypairs automatically. Your wallet is
                    never exposed in transactions.
                  </p>
                </div>
              </div>
            </TerminalCard>

            <TerminalCard delay={0.4} label="T4">
              <div className="flex items-start gap-3">
                <OracleLightningIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-base font-bold text-black dark:text-white mb-1.5 tracking-tight">
                    Check Before Resolving
                  </h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-500 leading-relaxed">
                    Resolution costs $0.05. Ask the agent to check if a market has expired and the oracle
                    price is available first.
                  </p>
                </div>
              </div>
            </TerminalCard>
          </div>
        </section>
      </div>
    </div>
  )
}
