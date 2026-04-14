"use client"

import { useState } from "react"
import Image from "next/image"
import { useAppKit } from "@reown/appkit/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { useStaking } from "@/features/staking/hooks/use-staking"
import { OYRADE_DECIMALS } from "@/lib/constants/staking"

const TOKEN_MULTIPLIER = 10 ** OYRADE_DECIMALS;

const UnstakeTab = () => {
  const [amount, setAmount] = useState("");
  const [selectedPercentage, setSelectedPercentage] = useState<number | null>(null);
  const { open } = useAppKit();
  const {
    userData,
    isConnected,
    unstake,
    isProcessing,
    estimatedRewards,
  } = useStaking();

  const stakedBalance = userData ? userData.balanceStaked / TOKEN_MULTIPLIER : 0;

  const percentages = [25, 50, 75, 100];

  const setPercentage = (pct: number) => {
    setSelectedPercentage(pct);
    setAmount(String(Math.floor(stakedBalance * pct / 100)));
  };

  const receiveAmount = parseFloat(amount || "0");

  const handleUnstake = async () => {
    if (!isConnected) {
      open();
      return;
    }
    const value = parseFloat(amount);
    if (!value || value <= 0) return;
    await unstake(value);
    setAmount("");
    setSelectedPercentage(null);
  };

  return (
    <div className="flex flex-col h-full justify-between animate-fade-in max-w-xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1 text-center">Unstake XLM</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 text-center">
          Withdraw your staked XLM tokens. Pending XLM rewards will also be claimed.
        </p>

        {/* Header */}
        <div className="mb-3 text-center">
          <span className="text-base font-medium text-slate-900 dark:text-slate-100">Unstake amount</span>
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 md:gap-4 rounded-xl p-4 mb-4 bg-slate-50 dark:bg-black border border-border shadow-none">
          <Input
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9.]/g, '');
              setAmount(val);
              setSelectedPercentage(null);
            }}
            className="flex-1 min-w-0 border-none bg-transparent dark:bg-transparent shadow-none text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus-visible:ring-0 focus:ring-0 focus:outline-none p-0 h-auto [&]:ring-0 [&]:outline-none"
          />
          <div className="flex items-center gap-1.5 text-sm text-slate-500 flex-shrink-0 font-medium">
            <Image src="/stellar/stellar.png" alt="XLM" width={16} height={16} className="rounded-full" />
            <span>XLM staked</span>
            <span className="text-primary font-bold">{stakedBalance.toLocaleString()}</span>
          </div>
        </div>

        {/* Percentage Bar Buttons */}
        <div className="flex gap-1 mb-2">
          {percentages.map((pct) => {
            const isActive = selectedPercentage !== null && selectedPercentage >= pct;
            return (
              <button
                key={pct}
                onClick={() => setPercentage(pct)}
                className={`flex-1 h-3 rounded-full transition-colors ${isActive ? "bg-primary" : "bg-slate-200 dark:bg-black border border-border"
                  }`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mb-6 font-bold">
          {percentages.map((pct) => (
            <span key={pct} className="flex-1 text-center">{pct}%</span>
          ))}
        </div>

        {/* Info Rows */}
        <div className="space-y-3 w-full">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Remaining staked</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              {(stakedBalance - receiveAmount).toLocaleString()}
              <Image src="/stellar/stellar.png" alt="XLM" width={20} height={20} className="rounded-full" />
              <span>XLM</span>
            </span>
          </div>

          {estimatedRewards > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Pending XLM rewards</span>
              <span className="font-bold text-primary">
                +{estimatedRewards.toFixed(6)} XLM (auto-claimed)
              </span>
            </div>
          )}

          <div className="border-t border-dashed border-border my-3" />

          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400 font-medium">You will receive</span>
            <span className="font-bold text-primary flex items-center gap-1.5">
              {receiveAmount.toLocaleString()}
              <Image src="/stellar/stellar.png" alt="XLM" width={20} height={20} className="rounded-full" />
              <span>XLM</span>
            </span>
          </div>
        </div>
      </div>

      <Button
        size="lg"
        disabled={isProcessing || (isConnected && (!amount || parseFloat(amount) <= 0))}
        onClick={handleUnstake}
        className="w-full py-6 text-lg font-bold rounded-xl shadow-lg shadow-primary/20 transition-all transform active:scale-[0.98] mt-6"
      >
        {isProcessing ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Unstaking...
          </span>
        ) : !isConnected ? (
          "Connect Wallet"
        ) : (
          "Unstake"
        )}
      </Button>
    </div>
  );
};

export default UnstakeTab;
