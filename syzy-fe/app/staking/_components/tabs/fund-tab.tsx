"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { useStaking } from "@/features/staking/hooks/use-staking"
import { LAMPORTS_PER_SOL } from "@solana/web3.js"

const DEFAULT_REWARD_DURATION_DAYS = 7;

const FundTab = () => {
  const [amount, setAmount] = useState("");
  const [durationDays, setDurationDays] = useState(String(DEFAULT_REWARD_DURATION_DAYS));
  const {
    poolData,
    poolExists,
    vaultBalanceSol,
    fundPool,
    distributeFees,
    initializePool,
    isProcessing,
    isAuthority,
  } = useStaking();

  const parsedAmount = parseFloat(amount || "0");
  const parsedDuration = parseFloat(durationDays || "0");

  // Stable timestamp for preview calculations (avoids impure Date.now() in useMemo)
  const [nowSeconds] = useState(() => Math.floor(Date.now() / 1000));

  const preview = useMemo(() => {
    if (!poolData) return null;

    const now = nowSeconds;
    const duration = poolData.rewardDuration;
    const currentEnd = poolData.rewardDurationEnd;
    const currentRate = poolData.rewardRate;

    // New period always resets to now + duration
    const newEnd = now + duration;

    // Calculate new reward rate based on contract logic
    let newRate: number;
    if (now >= currentEnd) {
      // Period expired: new rate = amount_lamports / duration
      newRate = parsedAmount > 0 ? Math.floor((parsedAmount * LAMPORTS_PER_SOL) / duration) : 0;
    } else {
      // Period active: leftover = remaining_time * current_rate
      const remainingTime = currentEnd - now;
      const leftover = remainingTime * currentRate;
      const totalFunding = leftover + parsedAmount * LAMPORTS_PER_SOL;
      newRate = Math.floor(totalFunding / duration);
    }

    return {
      currentEnd: currentEnd > 0 ? new Date(currentEnd * 1000) : null,
      newEnd: new Date(newEnd * 1000),
      currentRateSolPerDay: (currentRate * 86400) / LAMPORTS_PER_SOL,
      newRateSolPerDay: (newRate * 86400) / LAMPORTS_PER_SOL,
      durationDays: duration / 86400,
    };
  }, [poolData, parsedAmount, nowSeconds]);

  const handleFund = async () => {
    if (!parsedAmount || parsedAmount <= 0) return;
    await fundPool(parsedAmount);
    setAmount("");
  };

  const handleInitializePool = async () => {
    if (!parsedDuration || parsedDuration <= 0) return;
    await initializePool(parsedDuration);
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // Pool not initialized — show init UI for admin
  if (!poolExists && isAuthority) {
    return (
      <div className="flex flex-col h-full justify-between animate-fade-in max-w-xl mx-auto">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1 text-center">Initialize Staking Pool</h2>
          <p className="text-sm text-muted-foreground mb-5 text-center">
            The staking pool has not been created yet. Initialize it to enable staking.
          </p>

          <div className="mb-3 text-center">
            <span className="text-base font-medium text-foreground">Reward duration (days)</span>
          </div>

          <div className="flex items-center gap-4 rounded-xl p-4 mb-6 bg-muted/30 border-none shadow-none">
            <Input
              type="text"
              inputMode="decimal"
              placeholder={String(DEFAULT_REWARD_DURATION_DAYS)}
              value={durationDays}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, "");
                setDurationDays(val);
              }}
              className="flex-1 min-w-0 border-none bg-transparent shadow-none text-xl md:text-2xl font-bold text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 focus:ring-0 focus:outline-none p-0 h-auto [&]:ring-0 [&]:outline-none"
            />
            <span className="text-sm text-muted-foreground flex-shrink-0">days</span>
          </div>

          <div className="space-y-3 w-full">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Staking token</span>
              <span className="font-semibold text-foreground">XLM</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Reward duration</span>
              <span className="font-semibold text-foreground">{parsedDuration || 0} days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Min duration</span>
              <span className="font-medium text-muted-foreground">1 hour</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Max duration</span>
              <span className="font-medium text-muted-foreground">365 days</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-6">
          <Button
            size="lg"
            disabled={isProcessing || !parsedDuration || parsedDuration <= 0}
            onClick={handleInitializePool}
            className="w-full py-6 text-lg font-bold rounded-xl shadow-lg shadow-primary/20 transition-all transform active:scale-[0.98]"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Initializing Pool...
              </span>
            ) : (
              "Initialize Staking Pool"
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Pool not initialized and not admin
  if (!poolExists) {
    return (
      <div className="flex flex-col h-full items-center justify-center animate-fade-in max-w-xl mx-auto py-12">
        <h2 className="text-2xl font-bold text-foreground mb-2 text-center">Staking Pool Not Ready</h2>
        <p className="text-sm text-muted-foreground text-center">
          The staking pool has not been initialized yet. Please check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full justify-between animate-fade-in max-w-xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1 text-center">Fund Reward Pool</h2>
        <p className="text-sm text-muted-foreground mb-5 text-center">
          Deposit XLM to fund staking rewards for the next period.
        </p>

        {/* Header */}
        <div className="mb-3 text-center">
          <span className="text-base font-medium text-foreground">XLM amount</span>
        </div>

        {/* Input */}
        <div className="flex items-center gap-4 rounded-xl p-4 mb-6 bg-muted/30 border-none shadow-none">
          <Input
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9.]/g, "");
              setAmount(val);
            }}
            className="flex-1 min-w-0 border-none bg-transparent shadow-none text-xl md:text-2xl font-bold text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 focus:ring-0 focus:outline-none p-0 h-auto [&]:ring-0 [&]:outline-none"
          />
          <span className="text-sm text-muted-foreground flex-shrink-0">XLM</span>
        </div>

        {/* Info Rows */}
        {preview && (
          <div className="space-y-3 w-full">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Vault balance</span>
              <span className="font-semibold text-foreground">{vaultBalanceSol.toFixed(4)} XLM</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Current period ends</span>
              <span className="font-medium text-foreground">
                {preview.currentEnd ? formatDate(preview.currentEnd) : "Expired"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">New period ends</span>
              <span className="font-medium text-primary">
                {parsedAmount > 0 ? formatDate(preview.newEnd) : "--"}
              </span>
            </div>

            <div className="h-px bg-border" />

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Current reward rate</span>
              <span className="font-semibold text-foreground">
                {preview.currentRateSolPerDay.toFixed(4)} XLM/day
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">New reward rate</span>
              <span className="font-semibold text-primary">
                {parsedAmount > 0 ? `${preview.newRateSolPerDay.toFixed(4)} XLM/day` : "--"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-medium text-foreground">{preview.durationDays} days</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 mt-6">
        <Button
          size="lg"
          disabled={isProcessing || !parsedAmount || parsedAmount <= 0}
          onClick={handleFund}
          className="w-full py-6 text-lg font-bold rounded-xl shadow-lg shadow-primary/20 transition-all transform active:scale-[0.98]"
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Funding...
            </span>
          ) : (
            "Fund Pool"
          )}
        </Button>

        {isAuthority && (
          <Button
            size="lg"
            variant="outline"
            disabled={isProcessing}
            onClick={() => distributeFees()}
            className="w-full py-6 text-lg font-bold rounded-xl transition-all transform active:scale-[0.98]"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Activating...
              </span>
            ) : (
              "Activate Trading Fees"
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default FundTab;
