"use client";

import { useState, useMemo, useCallback } from "react";
import { Shield, Trophy, Loader2 } from "lucide-react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/ui/animated-number";
import {
  ShieldedTransactionModal,
  type ShieldedTransactionStep,
} from "@/features/privacy/components/shielded-transaction-modal";
import { cn } from "@/lib/utils";
import type { MarketAccount } from "@/types/prediction-market.types";
import { TOKEN_MULTIPLIER } from "@/lib/constants/programs";
import { useZK } from "@/features/privacy/hooks/use-zk";
import { useZkNotes } from "@/features/privacy/hooks/use-zk-notes";
import type { ClaimWinningsFn } from "./order-ticket";

interface MarketPositionCardProps {
  marketAddress: string;
  market: MarketAccount;
  balances:
  | {
    yesBalance: number;
    noBalance: number;
    yesValueInSol: number;
    noValueInSol: number;
  }
  | undefined;
  claimWinnings?: ClaimWinningsFn;
  refresh: () => void;
}

export function MarketPositionCard({
  marketAddress,
  market,
  balances,
  claimWinnings,
  refresh,
}: MarketPositionCardProps) {
  const { privateClaimBatch, isGeneratingProof, teeAvailable } = useZK();
  const { tokenNotes: privateTokenNotes } = useZkNotes(marketAddress);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimSteps, setClaimSteps] = useState<ShieldedTransactionStep[]>([]);
  const [claimCurrentStep, setClaimCurrentStep] = useState(0);

  // Calculate winning notes from the reactive token notes
  const privateWinningNotes = useMemo(() => {
    if (!market?.isCompleted) return [];
    return privateTokenNotes.filter((n) => {
      const isYes = n.type === "YES";
      return (
        (isYes && market.winningOutcome === 0) ||
        (!isYes && market.winningOutcome === 1)
      );
    });
  }, [market, privateTokenNotes]);

  const handleClaim = async () => {
    if (!market || !claimWinnings) return;
    try {
      setIsProcessing(true);
      await claimWinnings(market.yesTokenMint, market.noTokenMint);
      refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrivateClaim = useCallback(async () => {
    if (privateWinningNotes.length === 0) return;

    // Build TEE-aware modal steps
    const steps: ShieldedTransactionStep[] = [];
    if (teeAvailable) {
      steps.push({
        id: "batch-claim",
        label: `Batch claim ${privateWinningNotes.length} note${privateWinningNotes.length > 1 ? "s" : ""} via TEE`,
        status: "pending",
      });
    } else {
      privateWinningNotes.forEach((_note, idx) => {
        steps.push({
          id: `claim-${idx}`,
          label: `Private claim #${idx + 1}`,
          status: "pending",
        });
      });
    }

    setClaimSteps(steps);
    setClaimCurrentStep(0);
    setClaimModalOpen(true);
    setIsProcessing(true);

    try {
      // Mark first step as processing
      setClaimSteps((prev) =>
        prev.map((s, i) => (i === 0 ? { ...s, status: "processing" } : s))
      );
      setClaimCurrentStep(1);

      await privateClaimBatch(
        privateWinningNotes,
        new PublicKey(marketAddress),
        (step, total) => {
          if (teeAvailable) {
            // TEE mode: single batch step
            if (step >= total) {
              setClaimSteps((prev) =>
                prev.map((s) => ({ ...s, status: "completed" }))
              );
              setClaimCurrentStep(total);
            }
          } else {
            // Fallback: update individual steps
            setClaimSteps((prev) =>
              prev.map((s, i) => {
                if (i < step) return { ...s, status: "completed" };
                if (i === step) return { ...s, status: "processing" };
                return s;
              })
            );
            setClaimCurrentStep(step + 1);
          }
        }
      );

      // Mark all steps completed
      setClaimSteps((prev) =>
        prev.map((s) => ({ ...s, status: "completed" }))
      );
      setClaimCurrentStep(steps.length);

      // Auto-close modal after short delay
      setTimeout(() => setClaimModalOpen(false), 2000);
    } catch (e) {
      console.error(e);
      // Mark current step as failed
      setClaimSteps((prev) =>
        prev.map((s) =>
          s.status === "processing" ? { ...s, status: "failed" } : s
        )
      );
      setTimeout(() => setClaimModalOpen(false), 3000);
    } finally {
      setIsProcessing(false);
    }
  }, [privateWinningNotes, teeAvailable, privateClaimBatch, marketAddress]);

  // Private position aggregation
  const totalYesRaw = privateTokenNotes
    .filter((n) => n.type === "YES" && !n.isSpent && n.commitment)
    .reduce((acc, n) => acc + n.amount, 0);
  const totalNoRaw = privateTokenNotes
    .filter((n) => n.type === "NO" && !n.isSpent && n.commitment)
    .reduce((acc, n) => acc + n.amount, 0);
  const totalYes = totalYesRaw / TOKEN_MULTIPLIER;
  const totalNo = totalNoRaw / TOKEN_MULTIPLIER;

  // Calculate SOL value for private holdings using AMM formula
  // sol_out = sol_reserve - (sol_reserve * token_reserve) / (token_reserve + tokens_in)
  const privateYesSolValue = useMemo(() => {
    if (!market || totalYesRaw <= 0) return 0;
    const solRes = new BN(market.realYesSolReserves);
    const tokRes = new BN(market.realYesTokenReserves);
    const kVal = solRes.mul(tokRes);
    const newTR = tokRes.add(new BN(totalYesRaw));
    return solRes.sub(kVal.div(newTR)).toNumber() / 1_000_000_000;
  }, [market, totalYesRaw]);

  const privateNoSolValue = useMemo(() => {
    if (!market || totalNoRaw <= 0) return 0;
    const solRes = new BN(market.realNoSolReserves);
    const tokRes = new BN(market.realNoTokenReserves);
    const kVal = solRes.mul(tokRes);
    const newTR = tokRes.add(new BN(totalNoRaw));
    return solRes.sub(kVal.div(newTR)).toNumber() / 1_000_000_000;
  }, [market, totalNoRaw]);

  // For resolved markets, calculate effective values (losing tokens = 0)
  // winningOutcome: 0 = YES wins, 1 = NO wins
  const isYesWinner = market.isCompleted && market.winningOutcome === 0;
  const isNoWinner = market.isCompleted && market.winningOutcome === 1;

  // Effective values after resolution
  const effectiveYesValue = market.isCompleted
    ? (isYesWinner ? (balances?.yesBalance ?? 0) : 0)
    : (balances?.yesValueInSol ?? 0);
  const effectiveNoValue = market.isCompleted
    ? (isNoWinner ? (balances?.noBalance ?? 0) : 0)
    : (balances?.noValueInSol ?? 0);

  const effectivePrivateYesValue = market.isCompleted
    ? (isYesWinner ? totalYes : 0)
    : privateYesSolValue;
  const effectivePrivateNoValue = market.isCompleted
    ? (isNoWinner ? totalNo : 0)
    : privateNoSolValue;

  // Check if user has any position with value (exclude worthless losing tokens)
  const hasPublicPositionWithValue = market.isCompleted
    ? (isYesWinner && (balances?.yesBalance ?? 0) > 0) || (isNoWinner && (balances?.noBalance ?? 0) > 0)
    : balances && (balances.yesBalance > 0 || balances.noBalance > 0);
  const hasPublicPosition =
    balances && (balances.yesBalance > 0 || balances.noBalance > 0);
  const hasPrivatePosition = totalYesRaw > 0 || totalNoRaw > 0;

  // Hide card if user has no position (or only worthless losing tokens after resolution)
  if (!hasPublicPosition && !hasPrivatePosition && !market.isCompleted)
    return null;

  return (
    <div className="bg-white dark:bg-background/40 dark:backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-xl border border-border/50 p-4 space-y-3 relative overflow-hidden">
      {/* Decorative effects for dark mode */}
      <div className="absolute inset-0 bg-noise opacity-[0.015] pointer-events-none hidden dark:block" />
      <div className="absolute inset-0 rounded-3xl shadow-[inset_0_0_60px_rgba(255,255,255,0.05)] pointer-events-none hidden dark:block" />

      <div className="flex items-center justify-between relative z-10">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          Your Position
          {market.isCompleted && (isYesWinner || isNoWinner) && (
            <Trophy className="w-4 h-4 text-teal-400 animate-success-bounce" />
          )}
        </h3>
        <div className="flex items-center gap-1 bg-muted/30 dark:bg-muted/20 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => setIsPrivate(false)}
            className={cn(
              "text-[10px] font-bold px-2.5 py-1 rounded-md transition-all duration-300",
              !isPrivate
                ? "bg-foreground text-background shadow-md"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Public
          </button>
          <button
            type="button"
            onClick={() => setIsPrivate(true)}
            className={cn(
              "text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 transition-all duration-300",
              isPrivate
                ? "bg-gradient-to-r from-teal-600 via-teal-400 to-teal-600 text-white shadow-md shadow-teal-500/30"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Shield className="w-2.5 h-2.5" /> Private
          </button>
        </div>
      </div>

      {!isPrivate ? (
        <div className="space-y-2 relative z-10">
          <div
            className={cn(
              "flex justify-between items-center p-3 rounded-xl transition-all duration-300",
              market.isCompleted && !isYesWinner
                ? "bg-muted/30 border border-muted/50"
                : "bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:border-emerald-500/50"
            )}
          >
            <div>
              <div
                className={cn(
                  "text-xs font-bold",
                  market.isCompleted && !isYesWinner
                    ? "text-muted-foreground line-through"
                    : "text-emerald-600 dark:text-emerald-500"
                )}
              >
                YES Tokens {market.isCompleted && !isYesWinner && "(Lost)"}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                ~<AnimatedNumber value={effectiveYesValue} decimals={4} /> SOL
              </div>
            </div>
            <div
              className={cn(
                "text-lg font-black tabular-nums",
                market.isCompleted && !isYesWinner
                  ? "text-muted-foreground"
                  : "text-emerald-600 dark:text-emerald-500"
              )}
            >
              <AnimatedNumber value={balances?.yesBalance ?? 0} decimals={0} />
            </div>
          </div>
          <div
            className={cn(
              "flex justify-between items-center p-3 rounded-xl transition-all duration-300",
              market.isCompleted && !isNoWinner
                ? "bg-muted/30 border border-muted/50"
                : "bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/30 hover:shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:border-red-500/50"
            )}
          >
            <div>
              <div
                className={cn(
                  "text-xs font-bold",
                  market.isCompleted && !isNoWinner
                    ? "text-muted-foreground line-through"
                    : "text-red-600 dark:text-red-500"
                )}
              >
                NO Tokens {market.isCompleted && !isNoWinner && "(Lost)"}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                ~<AnimatedNumber value={effectiveNoValue} decimals={4} /> SOL
              </div>
            </div>
            <div
              className={cn(
                "text-lg font-black tabular-nums",
                market.isCompleted && !isNoWinner
                  ? "text-muted-foreground"
                  : "text-red-600 dark:text-red-500"
              )}
            >
              <AnimatedNumber value={balances?.noBalance ?? 0} decimals={0} />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2 relative z-10">
          <div
            className={cn(
              "flex justify-between items-center p-3 rounded-xl transition-all duration-300 relative overflow-hidden",
              market.isCompleted && !isYesWinner
                ? "bg-muted/30 border border-muted/50"
                : "bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:border-emerald-500/50"
            )}
          >
            {!market.isCompleted && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent animate-shimmer" />
            )}
            <div className="relative z-10">
              <div
                className={cn(
                  "text-xs font-bold flex items-center gap-1",
                  market.isCompleted && !isYesWinner
                    ? "text-muted-foreground line-through"
                    : "text-emerald-600 dark:text-emerald-500"
                )}
              >
                YES Tokens <Shield className="w-3 h-3" />{" "}
                {market.isCompleted && !isYesWinner && "(Lost)"}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                ~<AnimatedNumber value={effectivePrivateYesValue} decimals={4} />{" "}
                SOL
              </div>
            </div>
            <div
              className={cn(
                "text-lg font-black tabular-nums relative z-10",
                market.isCompleted && !isYesWinner
                  ? "text-muted-foreground"
                  : "text-emerald-600 dark:text-emerald-500"
              )}
            >
              <AnimatedNumber value={totalYes} decimals={0} />
            </div>
          </div>
          <div
            className={cn(
              "flex justify-between items-center p-3 rounded-xl transition-all duration-300 relative overflow-hidden",
              market.isCompleted && !isNoWinner
                ? "bg-muted/30 border border-muted/50"
                : "bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/30 hover:shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:border-red-500/50"
            )}
          >
            {!market.isCompleted && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/5 to-transparent animate-shimmer" />
            )}
            <div className="relative z-10">
              <div
                className={cn(
                  "text-xs font-bold flex items-center gap-1",
                  market.isCompleted && !isNoWinner
                    ? "text-muted-foreground line-through"
                    : "text-red-600 dark:text-red-500"
                )}
              >
                NO Tokens <Shield className="w-3 h-3" />{" "}
                {market.isCompleted && !isNoWinner && "(Lost)"}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                ~<AnimatedNumber value={effectivePrivateNoValue} decimals={4} />{" "}
                SOL
              </div>
            </div>
            <div
              className={cn(
                "text-lg font-black tabular-nums relative z-10",
                market.isCompleted && !isNoWinner
                  ? "text-muted-foreground"
                  : "text-red-600 dark:text-red-500"
              )}
            >
              <AnimatedNumber value={totalNo} decimals={0} />
            </div>
          </div>
          <div className="text-[10px] text-center italic text-muted-foreground px-2 py-1.5 bg-muted/20 rounded-lg backdrop-blur-sm border border-border/30">
            * Aggregated from{" "}
            {privateTokenNotes.filter((n) => n.commitment).length} valid notes.
          </div>
        </div>
      )}

      {market.isCompleted && (
        <div className="space-y-2 pt-1 relative z-10">
          {/* Only show claim button if user has winning public tokens */}
          {claimWinnings && hasPublicPositionWithValue && (
            <Button
              size="sm"
              variant="gradient-brand"
              className="w-full font-bold text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform"
              onClick={handleClaim}
              disabled={isProcessing || isGeneratingProof}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Trophy className="w-4 h-4 mr-1.5 animate-success-bounce" />
              )}
              Claim Public Winnings
            </Button>
          )}

          {privateWinningNotes.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="w-full border-teal-500/40 bg-gradient-to-r from-teal-50/50 to-teal-50/30 dark:from-teal-500/5 dark:to-teal-400/5 text-teal-600 dark:text-teal-400 hover:bg-teal-100/80 dark:hover:bg-teal-500/10 font-bold text-xs hover:shadow-md transition-all"
              onClick={handlePrivateClaim}
              disabled={isProcessing || isGeneratingProof}
            >
              <Shield className="w-4 h-4 mr-1.5" />
              Claim Private Winnings ({privateWinningNotes.length} notes)
            </Button>
          )}

          {/* Show message when user has no winning tokens */}
          {!hasPublicPositionWithValue &&
            privateWinningNotes.length === 0 &&
            (hasPublicPosition || hasPrivatePosition) && (
              <div className="text-xs text-center text-muted-foreground bg-muted/30 dark:bg-muted/20 rounded-xl p-3 border border-border/30 backdrop-blur-sm">
                No winnings to claim. Your {isYesWinner ? "NO" : "YES"} tokens
                have no value.
              </div>
            )}
        </div>
      )}

      <ShieldedTransactionModal
        isOpen={claimModalOpen}
        steps={claimSteps}
        currentStep={claimCurrentStep}
        totalSteps={claimSteps.length}
        transactionType="claim"
        onClose={() => setClaimModalOpen(false)}
      />
    </div>
  );
}
