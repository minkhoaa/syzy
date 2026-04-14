"use client"

import { useAppKit } from "@reown/appkit/react"
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useStaking } from "@/features/staking/hooks/use-staking";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { OYRADE_DECIMALS } from "@/lib/constants/staking";

const TOKEN_MULTIPLIER = 10 ** OYRADE_DECIMALS;

const ClaimTab = () => {
  const { open } = useAppKit();
  const {
    poolData,
    userData,
    estimatedRewards,
    isConnected,
    claim,
    isProcessing,
  } = useStaking();

  const rewardRatePerDay = poolData
    ? ((poolData.rewardRate * 86400) / LAMPORTS_PER_SOL).toFixed(4)
    : "0";

  const userStaked = userData ? userData.balanceStaked / TOKEN_MULTIPLIER : 0;
  const totalStaked = poolData ? poolData.totalStaked / TOKEN_MULTIPLIER : 0;
  const poolShare = totalStaked > 0 ? ((userStaked / totalStaked) * 100).toFixed(2) : "0";

  const rewardPeriodEnd = poolData && poolData.rewardDurationEnd > 0
    ? new Date(poolData.rewardDurationEnd * 1000).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    : "—";

  const handleClaim = async () => {
    if (!isConnected) {
      open();
      return;
    }
    await claim();
  };

  return (
    <div className="flex flex-col h-full justify-between animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Claim Rewards</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
          Claim your accumulated XLM rewards from platform trading fees.
        </p>

        {/* XLM Reward Card */}
        <div className="p-5 bg-white dark:bg-black rounded-xl border border-border mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/[0.05] flex items-center justify-center">
                <Image src="/stellar/stellar.png" alt="XLM" width={22} height={22} className="rounded-full" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">Pending XLM Rewards</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {estimatedRewards.toFixed(6)} <span className="text-base text-slate-400">XLM</span>
                </div>
              </div>
            </div>
          </div>
          <div className="h-1 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-1 bg-primary rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(100, estimatedRewards * 10000)}%` }}
            />
          </div>
        </div>

        {/* Reward Info */}
        <div className="space-y-3 bg-slate-50 dark:bg-black border border-border rounded-xl p-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Reward rate</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{rewardRatePerDay} XLM/day</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Your pool share</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{poolShare}%</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Period ends</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{rewardPeriodEnd}</span>
          </div>
        </div>
      </div>

      <Button
        size="lg"
        disabled={isProcessing || (isConnected && estimatedRewards <= 0)}
        onClick={handleClaim}
        className="w-full py-5 text-base font-bold rounded-xl shadow-lg shadow-primary/20 transition-all transform active:scale-[0.98] mt-4"
      >
        {isProcessing ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Claiming...
          </span>
        ) : !isConnected ? (
          "Connect Wallet"
        ) : estimatedRewards <= 0 ? (
          "No Rewards to Claim"
        ) : (
          "Claim XLM Rewards"
        )}
      </Button>
    </div>
  );
};

export default ClaimTab;
