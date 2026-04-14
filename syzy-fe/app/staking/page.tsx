"use client"

import { useEffect, useState } from "react"
import { LandingNavbar } from "@/components/layout/landing-navbar"
import BalanceCard from "@/app/staking/_components/balance-card";
import VePowerCard from "@/app/staking/_components/ve-power-card";
import ActionHub from "@/app/staking/_components/action-hub";
import TierSection from "@/app/staking/_components/tier-section";
import type { TierConfig } from "@/app/staking/_components/tier-section";
import EcosystemSection from "@/app/staking/_components/ecosystem-section";
import FaqSection from "@/app/staking/_components/faq-section";
import { LandingFooter } from "@/components/layout/landing-footer"
import { useStaking } from "@/features/staking/hooks/use-staking";
import { usePredictionMarket } from "@/features/trading/hooks/use-prediction-market";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { OYRADE_DECIMALS } from "@/lib/constants/staking";
import { useTour } from "@/features/onboarding/hooks/use-tour";
import { steps as stakingSteps, TOUR_ID, TOUR_VERSION } from "@/features/onboarding/tours/staking-tour";

const TOKEN_MULTIPLIER = 10 ** OYRADE_DECIMALS;

const Index = () => {
  useTour({ tourId: TOUR_ID, steps: stakingSteps, version: TOUR_VERSION });
  const { poolData, poolLoading, vaultBalanceSol, userData, oyradeBalance } = useStaking();
  const { getConfigTiers } = usePredictionMarket();
  const [tierConfig, setTierConfig] = useState<TierConfig | undefined>();

  useEffect(() => {
    getConfigTiers().then((config: Awaited<ReturnType<typeof getConfigTiers>>) => {
      if (config) {
        setTierConfig({
          bronzeMin: config.bronzeMin,
          bronzeDiscount: config.bronzeDiscount,
          silverMin: config.silverMin,
          silverDiscount: config.silverDiscount,
          goldMin: config.goldMin,
          goldDiscount: config.goldDiscount,
          diamondMin: config.diamondMin,
          diamondDiscount: config.diamondDiscount,
        });
      }
    });
  }, [getConfigTiers]);

  const totalStakedFormatted = poolData
    ? (poolData.totalStaked / TOKEN_MULTIPLIER).toLocaleString(undefined, { maximumFractionDigits: 0 })
    : "—";

  const rewardRatePerDay = poolData
    ? ((poolData.rewardRate * 86400) / LAMPORTS_PER_SOL).toFixed(4)
    : "—";

  const rewardPeriodEnd = poolData && poolData.rewardDurationEnd > 0
    ? new Date(poolData.rewardDurationEnd * 1000).toLocaleDateString()
    : "—";

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-500">
      <LandingNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-[120px] pt-24 pb-12 md:py-[120px]">
        {/* Hero Title Section */}
        <div className="text-center py-8 md:py-12 mb-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Stake <span className="text-primary">XLM</span>{" "}
            for rewards & perks
          </h1>
          <p className="text-base sm:text-lg text-neutral-500 max-w-2xl mx-auto">
            Stake your XLM tokens to earn XLM rewards from platform trading fees.
          </p>
        </div>

        {/* Protocol Stats */}
        <div data-tour="protocol-stats" className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12 max-w-4xl mx-auto">
          <div className="bg-white dark:bg-black/40 dark:backdrop-blur-md border border-border rounded-xl p-4 md:p-6 text-center shadow-sm">
            <div className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 font-bold">Total Staked</div>
            <div className="text-lg sm:text-xl md:text-2xl font-mono font-bold text-slate-900 dark:text-slate-100">
              {poolLoading ? "..." : totalStakedFormatted} <span className="text-sm text-slate-400">XLM</span>
            </div>
          </div>
          <div className="bg-white dark:bg-black/40 dark:backdrop-blur-md border border-border rounded-xl p-4 md:p-6 text-center shadow-sm">
            <div className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 font-bold">Reward Rate</div>
            <div className="text-lg sm:text-xl md:text-2xl font-mono font-bold text-slate-900 dark:text-slate-100">
              {poolLoading ? "..." : rewardRatePerDay} <span className="text-sm text-slate-400">XLM/day</span>
            </div>
          </div>
          <div className="bg-white dark:bg-black/40 dark:backdrop-blur-md border border-border rounded-xl p-4 md:p-6 text-center shadow-sm">
            <div className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 font-bold">Period Ends</div>
            <div className="text-lg sm:text-xl md:text-2xl font-mono font-bold text-slate-900 dark:text-slate-100">
              {poolLoading ? "..." : rewardPeriodEnd}
            </div>
          </div>
          <div className="bg-white dark:bg-black/40 dark:backdrop-blur-md border border-border rounded-xl p-4 md:p-6 text-center shadow-sm">
            <div className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 font-bold">Reward Pool</div>
            <div className="text-lg sm:text-xl md:text-2xl font-mono font-bold text-primary">
              {poolLoading ? "..." : vaultBalanceSol.toFixed(4)} <span className="text-sm text-slate-400">XLM</span>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 mb-12 md:mb-16">
          {/* Left Column - Balance Cards */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <BalanceCard />
            <VePowerCard />
          </div>

          {/* Right Column - Action Hub */}
          <div className="lg:col-span-8" data-tour="action-hub">
            <ActionHub />
          </div>
        </div>

        {/* Tier Section */}
        <div data-tour="tier-section">
          <TierSection userHolding={oyradeBalance} userStaked={userData?.balanceStaked ?? 0} tierConfig={tierConfig} />
        </div>

        {/* Ecosystem Benefits */}
        <EcosystemSection />

        {/* FAQ Section */}
        <FaqSection />
      </main>

      <LandingFooter />
    </div>
  );
};
export default Index;
