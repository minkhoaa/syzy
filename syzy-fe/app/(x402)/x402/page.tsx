import { HeroSection } from "@/components/x402/hero-section"
import { UseCaseCard } from "@/components/x402/use-case-card"
import { StepCard } from "@/components/x402/step-card"
import { FeatureMetric } from "@/components/x402/feature-metric"
import { CapabilityGroup } from "@/components/x402/capability-group"
import { PricingTable } from "@/components/x402/pricing-table"
import { IntegrationTab } from "@/components/x402/integration-tab"
import { SafetyCard } from "@/components/x402/safety-card"
import {
  AgentNetworkIcon,
  PredictionChartIcon,
  LiquidityPoolIcon,
  OracleLightningIcon,
  PrivacyHexIcon,
  ZkEyeIcon,
  TargetCrosshairIcon,
  CheckCircleNeonIcon
} from "@/components/x402/icons"

export const metadata = {
  title: "X402 API — Syzy",
  description:
    "Prediction market APIs with pay-per-call micropayments. AI agents can create markets, trade, and resolve — no API keys, no accounts.",
}

export default function X402LandingPage() {
  return (
    <main className="bg-white dark:bg-black min-h-screen text-black dark:text-white font-sans selection:bg-emerald-500/30 relative">
      <div className="relative z-10 pb-32">
        {/* Hero */}
        <HeroSection />

        {/* How to Use / Use Cases */}
        <section className="py-24 md:py-40 relative">
          <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-7xl">
            <div className="text-center mb-16 md:mb-24">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-black dark:text-white mb-6">
                Built for the next era of agents.
              </h2>
              <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto font-medium">
                Equip your AI with deterministic precision. Create, trade, and resolve on-chain with single API calls.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              <UseCaseCard
                delay={0.1}
                label="01"
                icon={<AgentNetworkIcon className="h-6 w-6" />}
                title="AI Trading Agent"
                description="Let your agent predict on market outcomes autonomously."
                cost="~$0.15/trade"
              />
              <UseCaseCard
                delay={0.2}
                label="02"
                icon={<PredictionChartIcon className="h-6 w-6" />}
                title="Market Analytics Bot"
                description="Programmatically create and monitor prediction markets."
                cost="~$0.50/market"
              />
              <UseCaseCard
                delay={0.3}
                label="03"
                icon={<OracleLightningIcon className="h-6 w-6" />}
                title="Automated Resolution"
                description="Auto-resolve markets when oracle conditions are met."
                cost="~$0.05/resolution"
              />
            </div>
          </div>
        </section>

        {/* Getting Started */}
        <section className="py-24 md:py-40 relative">
          <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-6xl">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-black dark:text-white mb-20 text-center">
              Start Using X402 APIs in 3 Steps.
            </h2>
            <div className="grid md:grid-cols-3 gap-8 md:gap-16">
              <StepCard
                delay={0.1}
                step={1}
                icon={<LiquidityPoolIcon className="h-6 w-6" />}
                title="Set Up a Wallet"
                description="Create a Solana wallet with USDC. That's your payment method — no signups needed."
              />
              <StepCard
                delay={0.2}
                step={2}
                icon={<PrivacyHexIcon className="h-6 w-6" />}
                title="Install SDK or Use REST"
                description="Install the TypeScript SDK, or call the REST API directly with any HTTP client."
              />
              <StepCard
                delay={0.3}
                step={3}
                icon={<TargetCrosshairIcon className="h-6 w-6" />}
                title="Start Calling Endpoints"
                description="Payment is built into every request. No API keys, no subscriptions — just pay."
              />
            </div>
          </div>
        </section>

        {/* Feature Metrics */}
        <section className="border-t border-black/10 dark:border-white/10 relative">
          <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-7xl">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-black/10 dark:divide-white/10 border-b border-black/10 dark:border-white/10">
              <FeatureMetric
                delay={0.1}
                label="M1"
                title="Privacy"
                description="Ephemeral Wallets"
              />
              <FeatureMetric
                delay={0.2}
                label="M2"
                title="<1s"
                description="Solana Finality"
              />
              <FeatureMetric
                delay={0.3}
                label="M3"
                title="Pay/Call"
                description="No Subscriptions"
              />
              <FeatureMetric
                delay={0.4}
                label="M4"
                title="15"
                description="API Endpoints"
              />
            </div>
          </div>
        </section>

        {/* Core Capabilities */}
        <section className="py-24 md:py-40 relative">
          <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative z-10">
            <div className="mb-20">
              <h2 className="text-5xl md:text-6xl font-bold tracking-tighter text-black dark:text-white mb-6 text-left">
                Core Capabilities.
              </h2>
              <p className="text-xl md:text-2xl text-zinc-600 dark:text-zinc-400 font-medium max-w-2xl text-left">
                Production-ready tools for comprehensive crypto trading operations.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
              <CapabilityGroup
                delay={0.1}
                label="01"
                title="Market Creation"
                description="Create on-chain prediction markets with oracle integration."
                endpoints={[
                  { method: "POST", path: "/api/v1/markets/create", price: "$0.50", description: "" },
                ]}
              />
              <CapabilityGroup
                delay={0.2}
                label="02"
                title="Trading"
                description="Privacy-preserving predicting with commitment hashes."
                endpoints={[
                  { method: "POST", path: "/api/v1/markets/:id/predict", price: "~$0.01+", description: "" },
                ]}
              />
              <CapabilityGroup
                delay={0.3}
                label="03"
                title="Position Management"
                description="Sell positions and claim winnings from resolved markets."
                endpoints={[
                  { method: "POST", path: "/api/v1/markets/:id/sell", price: "$0.01", description: "" },
                  { method: "POST", path: "/api/v1/markets/:id/claim", price: "$0.01", description: "" },
                ]}
              />
              <CapabilityGroup
                delay={0.4}
                label="04"
                title="Resolution"
                description="Oracle-based automatic market resolution."
                endpoints={[
                  { method: "GET", path: "/api/v1/markets/:id/resolve", price: "$0.05", description: "" },
                ]}
              />
              <CapabilityGroup
                delay={0.5}
                label="05"
                title="Privacy"
                description="ZK Merkle inclusion proofs for shielded predictions."
                endpoints={[
                  { method: "GET", path: "/api/v1/markets/:id/privacy-proof", price: "$0.10", description: "" },
                ]}
              />
              <CapabilityGroup
                delay={0.6}
                label="06"
                title="Market Data"
                description="Free access to market listings, details, and price history."
                endpoints={[
                  { method: "GET", path: "/api/v1/markets", price: "Free", description: "" },
                  { method: "GET", path: "/api/v1/markets/:id", price: "Free", description: "" },
                  { method: "GET", path: "/api/v1/markets/:id/history", price: "Free", description: "" },
                ]}
              />
            </div>
          </div>
        </section>

        {/* Integration */}
        <section className="py-24 md:py-40 relative bg-white dark:bg-black overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent" />
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-black dark:text-white mb-16 text-center">
              Seamless Integration.
            </h2>
            <IntegrationTab />
          </div>
        </section>

        {/* Pricing */}
        <section className="py-24 md:py-40 relative">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl relative z-10">
            <div className="text-center mb-16 md:mb-24">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-black dark:text-white mb-6">
                Transparent Pricing.
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 font-medium">
                Pure pay-per-use with USDC on Solana. No subscriptions, no upfront costs.
              </p>
            </div>
            <PricingTable />
          </div>
        </section>

        {/* Safety Features */}
        <section className="py-24 md:py-40 relative">
          <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-black dark:text-white mb-20 text-center">
              Safety & Privacy First.
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <SafetyCard
                delay={0.1}
                label="S1"
                title="Ephemeral Keypairs"
                description="Your wallet is never exposed. Temporary keypairs sign each transaction."
              />
              <SafetyCard
                delay={0.2}
                label="S2"
                title="Anti-Timing Analysis"
                description="Random delays prevent transaction timing correlation attacks."
              />
              <SafetyCard
                delay={0.3}
                label="S3"
                title="Amount Bucketing"
                description="Fixed SOL amounts (0.1, 0.5, 1, 5, 10) for trade privacy."
              />
              <SafetyCard
                delay={0.4}
                label="S4"
                title="Client-Side Commitments"
                description="Commitment hashes are computed locally before hitting the network."
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
