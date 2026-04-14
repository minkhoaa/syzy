"use client"

import { Wallet, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStaking } from "@/features/staking/hooks/use-staking";
import Link from "next/link";

const BalanceCard = () => {
  const { oyradeBalanceFormatted, isConnected } = useStaking();

  return (
    <div className="rounded-xl bg-white dark:bg-black/40 dark:backdrop-blur-md border border-border shadow-sm hover:shadow-md transition-all duration-300 group">
      <div className="p-5 sm:p-8 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            XLM Balance
          </h3>
          <div className="p-2 bg-slate-50 dark:bg-white/[0.05] rounded-lg text-slate-400 dark:text-slate-500">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div>
          <div className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-1">
            {isConnected ? oyradeBalanceFormatted.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400 font-mono">
            <span>XLM</span>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border flex justify-between items-center text-xs font-medium text-slate-400 dark:text-slate-500">
          <span>Available to Stake</span>
          {!isConnected ? (
            <span className="text-primary">Connect Wallet</span>
          ) : (
            <Button variant="default" size="sm" asChild>
              <Link href="/faucet" className="gap-1.5">
                <Droplets className="w-3 h-3" />
                Faucet
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
