"use client"

import { Button } from "@/components/ui/button"
import { AnimatedButton } from "@/components/ui/animated-button"
import { cn } from "@/lib/utils"
import { ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useReownWallet } from "@/features/auth/hooks/use-reown-wallet"
import { AuroraBackground } from "@/components/ui/aurora-background"
import { LandingNavbar } from "@/components/layout/landing-navbar"
import { MarketTicker } from "@/app/(landing)/_components/market-ticker"
import { TimelineAnimation } from "@/components/ui/timeline-animation"
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid"
import { Blocks } from "@/components/ui/blocks"
import { LandingFooter } from "@/components/layout/landing-footer"
import { useRef } from "react"
import { StickyScroll } from "@/components/ui/sticky-scroll-reveal"
import { ShieldVisual, PumpVisual, InstantVisual, AIVisual } from "@/components/ui/bento-visuals"
import { ZkShieldIcon, StellarSpeedIcon, OpacityIcon, MemeRocketIcon } from "@/components/ui/isometric-icons"
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider"
import { Badge } from "@/components/ui/badge"
import { ScrollToTopButton } from "@/components/ui/scroll-to-top"

const BENTO_ITEMS = [
  {
    title: "Shielded Predictions",
    description: "Your positions are wrapped in ephemeral wallets. No public link to your main address.",
    header: <ShieldVisual />,
    className: "md:col-span-2",
  },
  {
    title: "Pump.fun Native",
    description: "Direct integration with bonding curve milestones.",
    header: <PumpVisual />,
    className: "md:col-span-1",
  },
  {
    title: "Instant Resolution",
    description: "Helius-powered oracles settle markets in milliseconds.",
    header: <InstantVisual />,
    className: "md:col-span-1",
  },
  {
    title: "AI Analysis",
    description: "Real-time sentiment analysis on target tokens.",
    header: <AIVisual />,
    className: "md:col-span-2",
  },
]

export default function LandingPage() {
  const router = useRouter()
  const { connected, connect } = useReownWallet()
  const heroRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)

  const privacyContent = [
    {
      title: "Zero Knowledge Proofs",
      description:
        "We use advanced ZK technology to ensure your transaction details remain completely hidden from the public ledger while verifying validity. Your financial data corresponds to you alone.",
      content: (
        <div className="h-full w-full flex items-center justify-center bg-transparent">
          <ZkShieldIcon className="w-full h-full max-w-[500px]" />
        </div>
      ),
    },
    {
      title: "Speed of Stellar",
      description:
        "Built on the fastest blockchain. Experience sub-second finality and negligible fees while enjoying institutional-grade privacy. No compromise on performance.",
      content: (
        <div className="h-full w-full flex items-center justify-center bg-transparent">
          <StellarSpeedIcon className="w-full h-full max-w-[400px]" />
        </div>
      ),
    },
    {
      title: "Total Opacity",
      description:
        "Zero tracking. Zero KYC for pure alpha. We don't just hide your data; we ensure it never exists on a public graph linkable to your identity.",
      content: (
        <div className="h-full w-full flex items-center justify-center bg-transparent">
          <OpacityIcon className="w-full h-full max-w-[500px] scale-110" />
        </div>
      ),
    },
    {
      title: "Meme Ecosystem Ready",
      description:
        "Optimized for the high-velocity trading of the meme ecosystem. Snipe, trade, and win without broadcasting your alpha to copy-traders.",
      content: (
        <div className="h-full w-full flex items-center justify-center bg-transparent">
          <MemeRocketIcon className="w-full h-full max-w-[500px]" />
        </div>
      ),
    },
  ];

  return (
    <SmoothScrollProvider>
      <div className="min-h-screen bg-white dark:bg-black text-foreground selection:bg-teal-500/20">
        <LandingNavbar />

        <section ref={heroRef} className="relative min-h-screen flex flex-col overflow-hidden">
          <AuroraBackground className="flex-1 w-full">
            <div className="relative z-10 container px-4 text-center mt-20">
              <div className="max-w-5xl mx-auto space-y-6 sm:space-y-10">
                <TimelineAnimation
                  animationNum={0}
                  timelineRef={heroRef}
                >
                  <Badge>
                    Devnet
                  </Badge>
                </TimelineAnimation>

                <TimelineAnimation
                  as="h1"
                  animationNum={1}
                  timelineRef={heroRef}
                  className="text-5xl sm:text-7xl md:text-9xl font-bold tracking-tight text-foreground leading-tight text-balance drop-shadow-sm py-2"
                >
                  Predict <span className="text-slate-300 dark:text-neutral-500">Invisible</span>
                  <br />
                  Win <span className="text-transparent bg-clip-text bg-linear-to-b from-primary to-primary/70 dark:from-primary dark:to-primary/80">Visible</span>
                </TimelineAnimation>

                <TimelineAnimation
                  as="p"
                  animationNum={2}
                  timelineRef={heroRef}
                  className="text-base sm:text-xl md:text-2xl text-neutral-400 dark:text-neutral-500 max-w-2xl mx-auto font-medium tracking-tight leading-relaxed px-2"
                >
                  The privacy of cash meets the speed of Solana.
                  <br className="hidden md:block" />
                  Zero tracking. Zero KYC. Pure alpha.
                </TimelineAnimation>

                {/* <TimelineAnimation
                  animationNum={3}
                  timelineRef={heroRef}
                  className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
                >
                  <AnimatedButton
                    onClick={() => window.open('https://pump.fun/coin/GGmZqC7nTcZH4npvRJz4cxmus4EAGXWdpk4wrc72pump', '_blank', 'noopener,noreferrer')}
                    className="bg-linear-to-br from-white via-teal-50 to-teal-200/60 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800 border-teal-200 dark:border-neutral-800 hover:border-teal-300 dark:hover:border-primary/50 hover:to-teal-200 transition-all shadow-lg shadow-teal-500/10"
                  >
                    PUMP.FUN
                    <ArrowRight className="ml-2 h-5 w-5 text-neutral-800 dark:text-primary" />
                  </AnimatedButton>

                  <AnimatedButton
                    onClick={connected ? () => router.push('/dashboard') : connect}
                    className="bg-linear-to-br from-white via-teal-50 to-teal-200/60 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800 border-teal-200 dark:border-neutral-800 hover:border-teal-300 dark:hover:border-primary/50 hover:to-teal-200 transition-all shadow-lg shadow-teal-500/10"
                  >
                    {connected ? "Launch App" : "Connect Wallet"}
                    <ArrowRight className="ml-2 h-5 w-5 text-neutral-800 dark:text-primary" />
                  </AnimatedButton>

                  <AnimatedButton
                    onClick={() => router.push('/staking')}
                    className="bg-linear-to-br from-white via-teal-50 to-teal-200/60 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800 border-teal-200 dark:border-neutral-800 hover:border-teal-300 dark:hover:border-primary/50 hover:to-teal-200 transition-all shadow-lg shadow-teal-500/10"
                  >
                    Staking
                    <ArrowRight className="ml-2 h-5 w-5 text-neutral-800 dark:text-primary" />
                  </AnimatedButton>

                </TimelineAnimation> */}
              </div>
            </div>
          </AuroraBackground>
        </section>

        <MarketTicker />

        {/* Features Bento Grid */}
        <section id="features" className="py-16 md:py-32 relative bg-white dark:bg-black" ref={featuresRef}>
          <div className="absolute inset-0 bg-neutral-50/30 dark:bg-transparent" />
          <Blocks
            activeDivsClass="bg-teal-500/5 dark:bg-primary/5"
            divClass="border-neutral-200/20 dark:border-neutral-800/20"
            containerRef={featuresRef}
          />
          <div className="container mx-auto px-4 relative z-20">
            <TimelineAnimation
              animationNum={0}
              className="mb-20 max-w-3xl"
            >
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tighter mb-6 relative">
                Institutional Grade.<br />
                <span className="text-neutral-400">Degen Speed.</span>
              </h2>
            </TimelineAnimation>

            <BentoGrid>
              {BENTO_ITEMS.map((item, i) => (
                <BentoGridItem
                  key={i}
                  title={item.title}
                  description={item.description}
                  header={item.header}
                  className={cn(item.className, "bg-white dark:bg-[#080808] shadow-sm border-neutral-200/80 dark:border-neutral-800/10 hover:shadow-xl dark:hover:shadow-primary/5 hover:border-teal-500/20 transition-all cursor-default")}
                />
              ))}
            </BentoGrid>
          </div>
        </section>

        {/* How it Works Section - Light Theme & Moved */}
        <section id="how-it-works" className="py-12 md:py-24 bg-white dark:bg-black text-neutral-900 dark:text-white relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter mb-4">
                How it <span className="text-primary">Works</span>
              </h2>
              <p className="text-neutral-500 text-base sm:text-xl max-w-2xl mx-auto">The simplest way to trade on your conviction.</p>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
              {[
                { step: "01", title: "Connect", desc: "Link your wallet. We generate a fresh ephemeral address for every session." },
                { step: "02", title: "Predict", desc: "Choose your market. Long or Short. Your move is mixed with valid proofs." },
                { step: "03", title: "Win", desc: "Profits settle instantly to your main wallet. No linkability. Pure alpha." }
              ].map((item, i) => (
                <div key={i} className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-6 md:p-10 rounded-3xl relative group hover:border-teal-200 dark:hover:border-primary/50 hover:bg-teal-50/30 dark:hover:bg-primary/5 transition-all duration-300 min-h-[240px] md:min-h-[320px] flex flex-col justify-center">
                  <div className="text-6xl md:text-8xl font-black text-neutral-100 dark:text-neutral-800/30 absolute -top-4 -right-4 md:-top-6 md:-right-6 select-none group-hover:text-teal-100/50 dark:group-hover:text-primary/20 transition-colors">
                    {item.step}
                  </div>
                  <div className="text-primary font-mono mb-4 md:mb-6 text-xl md:text-2xl font-bold tracking-wider">{item.step}</div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4 text-neutral-900 dark:text-white">{item.title}</h3>
                  <p className="text-base md:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sticky Scroll Section for Privacy/Features */}
        <section id="features-sticky" className="w-full bg-white dark:bg-black py-10 md:py-20">
          <StickyScroll content={privacyContent} />
        </section>

        <LandingFooter />
        <ScrollToTopButton />
      </div>
    </SmoothScrollProvider>
  )
}