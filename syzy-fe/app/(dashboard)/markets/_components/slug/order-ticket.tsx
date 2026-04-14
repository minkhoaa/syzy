"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Info, Shield, ShieldCheck, Sparkles, Loader2, TrendingUp, TrendingDown, Lock } from "lucide-react";
import { toast } from "sonner";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { Button } from "@/components/ui/button";
import {
  ShieldedTransactionModal,
  type ShieldedTransactionStep,
} from "@/features/privacy/components/shielded-transaction-modal";
import { cn } from "@/lib/utils";
import type { Event } from "@/app/(dashboard)/markets/_types";
import type { MarketAccount } from "@/types/prediction-market.types";
import type { ShieldedNote } from "@/types/zk.types";
import { Outcome, Side, TOKEN_MULTIPLIER } from "@/lib/constants/programs";
import { useZK } from "@/features/privacy/hooks/use-zk";
import { ZKStorage } from "@/features/privacy/utils/zk-storage";
import { calculateSwapFees } from "@/features/trading/utils/fee-calculator";
import { usePredictionMarket } from "@/features/trading/hooks/use-prediction-market";
import Image from "next/image";
import { SolIcon } from "@/components/ui/sol-icon";
import { Badge } from "@/components/ui/badge";
import { BinaryOutcomeButton } from "../binary-outcome-button";
import { useReownWallet } from "@/features/auth/hooks/use-reown-wallet";
import { useStaking } from "@/features/staking/hooks/use-staking";

export type SwapFn = (
  yesToken: PublicKey,
  noToken: PublicKey,
  amount: number | string,
  direction: Side,
  tokenType: Outcome,
  minReceive: number | string,
  isSolAmount: boolean
) => Promise<string | undefined>;

export type ClaimWinningsFn = (
  yesToken: PublicKey,
  noToken: PublicKey
) => Promise<string | undefined>;

export type ResolveViaOracleFn = (
  yesToken: PublicKey,
  noToken: PublicKey,
  oracleFeed: PublicKey
) => Promise<string | undefined>;

interface OrderTicketProps {
  event: Event;
  market: MarketAccount;
  stats: { yesChances: number; noChances: number; totalReserves: number };
  balances:
  | {
    yesBalance: number;
    noBalance: number;
    yesValueInSol: number;
    noValueInSol: number;
  }
  | undefined;
  swap: SwapFn;
  refresh: () => void;
  claimWinnings?: ClaimWinningsFn;
  resolveViaOracle?: ResolveViaOracleFn;
  /** Optional externally-controlled trade side (YES/NO) */
  initialSide?: "yes" | "no";
}

export function OrderTicket({
  event,
  market,
  stats,
  balances,
  swap,
  refresh,
  initialSide,
}: OrderTicketProps) {
  const selectedMarket = event.markets[0];
  const yesPrice = stats.yesChances / 100;
  const noPrice = stats.noChances / 100;

  const timeBadge = useMemo(() => {
    const endDate = event.end_date || selectedMarket?.end_time;
    if (!endDate) return null;
    const now = new Date();
    const end = new Date(endDate);
    if (isNaN(end.getTime())) return null;
    const diffMs = end.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffHours / 24;
    if (diffMs <= 0) return { label: "ENDED", urgent: false };
    if (diffHours <= 24) return { label: "ENDS SOON", urgent: true };
    if (diffDays <= 3) return { label: `${Math.ceil(diffDays)}D LEFT`, urgent: true };
    if (diffDays <= 7) return { label: `${Math.ceil(diffDays)}D LEFT`, urgent: false };
    const formatted = end.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return { label: `BY ${formatted.toUpperCase()}`, urgent: false };
  }, [event.end_date, selectedMarket?.end_time]);

  const [tradeMode, setTradeMode] = useState<"buy" | "sell">("buy");
  const [tradeSide, setTradeSide] = useState<"yes" | "no">(initialSide ?? "yes");

  // Sync tradeSide when parent changes initialSide (e.g. clicking Yes/No on outcome rows)
  useEffect(() => {
    if (initialSide) setTradeSide(initialSide);
  }, [initialSide]);

  const [amount, setAmount] = useState("");
  const [isShielded, setIsShielded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Shielded transaction modal state
  const [shieldedModalOpen, setShieldedModalOpen] = useState(false);
  const [shieldedSteps, setShieldedSteps] = useState<ShieldedTransactionStep[]>([]);
  const [currentShieldedStep, setCurrentShieldedStep] = useState(0);

  const updateStepStatus = useCallback(
    (stepId: string, status: ShieldedTransactionStep["status"]) => {
      setShieldedSteps((prev) =>
        prev.map((s) => (s.id === stepId ? { ...s, status } : s))
      );
    },
    []
  );

  const closeShieldedModal = useCallback(() => {
    setShieldedModalOpen(false);
    setShieldedSteps([]);
    setCurrentShieldedStep(0);
  }, []);

  // Wallet hook for SOL balance
  const { balance: walletBalance } = useReownWallet();
  const { userData } = useStaking();

  // On-chain config for fee preview
  const { getConfigTiers } = usePredictionMarket();
  const [feeConfig, setFeeConfig] = useState<{
    platformBuyFeeBps: number;
    platformSellFeeBps: number;
    lpBuyFeeBps: number;
    lpSellFeeBps: number;
    stakingFeeShareBps: number;
    bronzeMin: number; bronzeDiscount: number;
    silverMin: number; silverDiscount: number;
    goldMin: number; goldDiscount: number;
    diamondMin: number; diamondDiscount: number;
  } | null>(null);

  useEffect(() => {
    getConfigTiers().then((c: typeof feeConfig) => { if (c) setFeeConfig(c); });
  }, [getConfigTiers]);

  // ZK hooks
  const {
    autoShieldAndSwap,
    privateSell: zkPrivateSell,
    privateSellBatch,
    splitTokenNote,
    unshield,
    isGeneratingProof,
    teeAvailable,
  } = useZK();

  const [privateTokenNotes, setPrivateTokenNotes] = useState<ShieldedNote[]>(
    []
  );

  // Market date status
  const marketDateStatus = useMemo(() => {
    if (!market)
      return {
        isExpired: false,
        notStarted: false,
        endDateStr: null,
        startDateStr: null,
      };
    const now = Date.now() / 1000;
    const endDate = market.endDate ? Number(market.endDate) : null;
    const startDate = market.startDate ? Number(market.startDate) : null;
    return {
      isExpired: endDate ? now > endDate : false,
      notStarted: startDate ? now < startDate : false,
      endDateStr: endDate
        ? new Date(endDate * 1000).toLocaleString()
        : null,
      startDateStr: startDate
        ? new Date(startDate * 1000).toLocaleString()
        : null,
    };
  }, [market]);

  const tradingDisabled =
    marketDateStatus.isExpired ||
    marketDateStatus.notStarted ||
    market?.isCompleted;

  // Load private token notes when shielded mode or market changes
  useEffect(() => {
    if (isShielded || event.id) {
      const tokenNotes = ZKStorage.getTokenNotes(event.id);
      setPrivateTokenNotes(tokenNotes);
    }
  }, [isShielded, event.id, isGeneratingProof]);

  const outcomePrice = tradeSide === "yes" ? yesPrice : noPrice;
  const rawAmount = parseFloat(amount || "0");
  const shieldFeeRate = 0.01;
  const privacyFee = isShielded ? rawAmount * shieldFeeRate : 0;
  const investedAmount = rawAmount - privacyFee;
  const shares = investedAmount > 0 ? investedAmount / outcomePrice : 0;
  const maxPayout = shares * 1;
  const profit = maxPayout - rawAmount;
  const returnPercent =
    rawAmount > 0 ? ((profit / rawAmount) * 100).toFixed(0) : "0";
  const isYes = tradeSide === "yes";

  // Fee preview
  const feePreview = useMemo(() => {
    if (!feeConfig || rawAmount <= 0) return null;
    const isBuy = tradeMode === "buy";
    const platformBps = isBuy ? feeConfig.platformBuyFeeBps : feeConfig.platformSellFeeBps;
    const lpBps = isBuy ? feeConfig.lpBuyFeeBps : feeConfig.lpSellFeeBps;

    // Determine user's discount tier from staked OYRADE amount only
    const stakedHuman = (userData?.balanceStaked ?? 0) / TOKEN_MULTIPLIER;

    // Always use hardcoded defaults -- on-chain config does not have tiers configured yet.
    const tiers = [
      { min: 1_000, discount: 1000, label: "Bronze" },
      { min: 10_000, discount: 2000, label: "Silver" },
      { min: 50_000, discount: 3000, label: "Gold" },
      { min: 100_000, discount: 4000, label: "Diamond" },
    ];

    let discountBps = 0;
    let tierLabel = "None";

    // Check tiers from highest to lowest
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (tiers[i].min > 0 && stakedHuman >= tiers[i].min) {
        discountBps = tiers[i].discount;
        tierLabel = tiers[i].label;
        break;
      }
    }

    return {
      ...calculateSwapFees({
        amount: rawAmount * 1_000_000_000,
        platformFeeBps: platformBps,
        lpFeeBps: lpBps,
        discountBps,
        stakingFeeShareBps: feeConfig.stakingFeeShareBps,
      }),
      baseBps: platformBps + lpBps,
      tierLabel,
    };
  }, [feeConfig, rawAmount, tradeMode, userData]);

  // --- Private Sell Handler ---
  const handlePrivateSell = async () => {
    if (!market) return;

    const desiredSolHuman = parseFloat(amount);
    if (isNaN(desiredSolHuman) || desiredSolHuman <= 0) {
      toast.error("Please enter a valid SOL amount");
      return;
    }
    const desiredSolLamports = Math.round(desiredSolHuman * 1_000_000_000);
    const direction = isYes ? "YES" : "NO";
    const tokenType = isYes ? Outcome.Yes : Outcome.No;

    const solReserves = new BN(
      tokenType === Outcome.Yes
        ? market.realYesSolReserves
        : market.realNoSolReserves
    );
    const tokenReserves = new BN(
      tokenType === Outcome.Yes
        ? market.realYesTokenReserves
        : market.realNoTokenReserves
    );

    if (desiredSolLamports >= solReserves.toNumber()) {
      toast.error(
        `Exceeds pool liquidity. Max ~${((solReserves.toNumber() / 1_000_000_000) * 0.95).toFixed(4)} SOL available.`
      );
      return;
    }

    // Reverse AMM formula
    const k = solReserves.mul(tokenReserves);
    const newSolReserves = solReserves.sub(new BN(desiredSolLamports));
    const newTokenReserves = k.div(newSolReserves);
    const tokensNeeded = newTokenReserves.sub(tokenReserves).toNumber();

    const notes = privateTokenNotes
      .filter((n) => n.type === direction && !n.isSpent && n.commitment)
      .sort((a, b) => b.amount - a.amount);

    const totalAvailable = notes.reduce((acc, n) => acc + n.amount, 0);
    if (tokensNeeded > totalAvailable) {
      const maxSolReceivable = (() => {
        const kVal = solReserves.mul(tokenReserves);
        const newTR = tokenReserves.add(new BN(totalAvailable));
        const newSR = kVal.div(newTR);
        return solReserves.sub(newSR).toNumber() / 1_000_000_000;
      })();
      toast.error(
        `Need ${(tokensNeeded / TOKEN_MULTIPLIER).toLocaleString()} ${direction} tokens but only have ${(totalAvailable / TOKEN_MULTIPLIER).toLocaleString()}. Max ~${maxSolReceivable.toFixed(4)} SOL.`
      );
      return;
    }

    // Build sell plan: greedy walk
    const plan: { note: ShieldedNote; sellAmount: number }[] = [];
    let remaining = tokensNeeded;
    for (const note of notes) {
      if (remaining <= 0) break;
      if (note.amount <= remaining) {
        plan.push({ note, sellAmount: note.amount });
        remaining -= note.amount;
      } else {
        plan.push({ note, sellAmount: remaining });
        remaining = 0;
      }
    }

    const marketPubkey = new PublicKey(event.id);
    const needsSplits = plan.some((s) => s.sellAmount < s.note.amount);

    // Build steps for modal (TEE-aware)
    const steps: ShieldedTransactionStep[] = [];
    if (needsSplits) {
      plan.forEach((step, idx) => {
        if (step.sellAmount < step.note.amount) {
          steps.push({
            id: `split-${idx}`,
            label: `Split note #${idx + 1}`,
            status: "pending",
          });
        }
      });
    }
    if (teeAvailable) {
      steps.push({
        id: "batch-sell",
        label: `Batch sell ${plan.length} note${plan.length > 1 ? "s" : ""} via TEE`,
        status: "pending",
      });
    } else {
      plan.forEach((step, idx) => {
        steps.push({
          id: `sell-${idx}`,
          label: `Private sell #${idx + 1}`,
          status: "pending",
        });
        steps.push({
          id: `unshield-${idx}`,
          label: `Unshield SOL #${idx + 1}`,
          status: "pending",
        });
      });
    }

    setShieldedSteps(steps);
    setCurrentShieldedStep(1);
    setShieldedModalOpen(true);

    try {
      setIsSubmitting(true);
      let trackedSolReserves = solReserves;
      let trackedTokenReserves = tokenReserves;
      let stepIndex = 0;

      // Phase 1: Handle splits (browser ZK, 1 sig each)
      const notesToSell: ShieldedNote[] = [];
      const expectedSolAmounts: number[] = [];

      for (let planIdx = 0; planIdx < plan.length; planIdx++) {
        const step = plan[planIdx];
        let noteToSell = step.note;

        if (step.sellAmount < step.note.amount) {
          const splitStepId = `split-${planIdx}`;
          updateStepStatus(splitStepId, "processing");
          setCurrentShieldedStep(stepIndex + 1);

          const splitResult = await splitTokenNote(
            step.note,
            marketPubkey,
            step.sellAmount,
            step.note.amount - step.sellAmount
          );
          if (!splitResult) {
            updateStepStatus(splitStepId, "failed");
            toast.error("Failed to split note. Aborting remaining sells.");
            await new Promise((resolve) => setTimeout(resolve, 1500));
            closeShieldedModal();
            return;
          }
          updateStepStatus(splitStepId, "completed");
          stepIndex++;
          noteToSell = splitResult.noteA;
        }

        notesToSell.push(noteToSell);

        // Pre-compute expected SOL per note using tracked reserves (AMM walk)
        const kStep = trackedSolReserves.mul(trackedTokenReserves);
        const amountInBN = new BN(step.sellAmount);
        const stepNewTokenReserves = trackedTokenReserves.add(amountInBN);
        const stepNewSolReserves = kStep.div(stepNewTokenReserves);
        const solOutBN = trackedSolReserves.sub(stepNewSolReserves);
        expectedSolAmounts.push(solOutBN.toNumber());

        trackedSolReserves = stepNewSolReserves;
        trackedTokenReserves = stepNewTokenReserves;
      }

      const totalSolReceived = expectedSolAmounts.reduce((a, b) => a + b, 0);

      // Phase 2: Batch sell via TEE (or fallback)
      if (teeAvailable) {
        // TEE path: single batch (1 user signature)
        updateStepStatus("batch-sell", "processing");
        setCurrentShieldedStep(stepIndex + 1);

        const batchResult = await privateSellBatch(
          notesToSell,
          marketPubkey,
          expectedSolAmounts
        );

        if (batchResult && batchResult.txs.length > 0) {
          updateStepStatus("batch-sell", "completed");
        } else {
          updateStepStatus("batch-sell", "failed");
          toast.error("Batch sell failed.");
        }
      } else {
        // Fallback: sequential browser ZK sell + auto-unshield per note
        for (let i = 0; i < notesToSell.length; i++) {
          const sellStepId = `sell-${i}`;
          updateStepStatus(sellStepId, "processing");
          setCurrentShieldedStep(stepIndex + 1);

          const result = await zkPrivateSell(
            notesToSell[i],
            marketPubkey,
            expectedSolAmounts[i]
          );

          if (result && result.note) {
            updateStepStatus(sellStepId, "completed");
            stepIndex++;

            const unshieldStepId = `unshield-${i}`;
            updateStepStatus(unshieldStepId, "processing");
            setCurrentShieldedStep(stepIndex + 1);

            try {
              const unshieldTx = await unshield(result.note, marketPubkey);
              updateStepStatus(unshieldStepId, unshieldTx ? "completed" : "failed");
            } catch (unshieldErr) {
              console.warn("Auto-unshield failed, SOL note kept:", unshieldErr);
              updateStepStatus(unshieldStepId, "failed");
            }
            stepIndex++;
          } else {
            updateStepStatus(sellStepId, "failed");
            toast.error("Sell failed mid-execution. Some sells may have completed.");
            break;
          }
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
      closeShieldedModal();

      if (totalSolReceived > 0) {
        const solDisplay = (totalSolReceived / 1_000_000_000).toFixed(6);
        const tokensDisplay = (tokensNeeded / TOKEN_MULTIPLIER).toLocaleString();
        toast.success(
          `Sold ${tokensDisplay} ${direction} tokens privately! Received ~${solDisplay} SOL`
        );
        setAmount("");
        refresh();
      }
    } catch (e) {
      console.error("Private Sell Error:", e);
      closeShieldedModal();
      toast.error("Failed to sell tokens privately");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Main Trade Handler ---
  const handleTrade = async () => {
    if (!swap || rawAmount <= 0) return;
    const tokenType = tradeSide === "yes" ? Outcome.Yes : Outcome.No;
    setIsSubmitting(true);
    try {
      // --- Private Trade Flow ---
      if (isShielded) {
        const direction = isYes ? "YES" : "NO";

        if (tradeMode === "buy") {
          // Setup modal for shielded buy (works for both combined 1-sig and fallback 2-sig)
          const buySteps: ShieldedTransactionStep[] = [
            { id: "proof", label: "Generating ZK proofs", status: "pending" },
            { id: "sign", label: "Sign & submit transaction", status: "pending" },
          ];
          setShieldedSteps(buySteps);
          setCurrentShieldedStep(1);
          setShieldedModalOpen(true);

          try {
            // autoShieldAndSwap tries combined 1-sig first, falls back to 2-sig
            await autoShieldAndSwap(
              rawAmount,
              direction,
              new PublicKey(event.id),
              (step) => {
                // "proof"/"shield" → first step; "sign"/"swap" → second step
                if (step === "proof" || step === "shield") {
                  updateStepStatus("proof", "processing");
                  setCurrentShieldedStep(1);
                } else if (step === "sign" || step === "swap") {
                  updateStepStatus("proof", "completed");
                  updateStepStatus("sign", "processing");
                  setCurrentShieldedStep(2);
                }
              }
            );

            // Success — mark both steps completed
            updateStepStatus("proof", "completed");
            updateStepStatus("sign", "completed");

            // Small delay to show completion state
            await new Promise((resolve) => setTimeout(resolve, 1500));
            closeShieldedModal();

            toast.success(`Shielded ${direction} position opened successfully!`);
            setAmount("");
            refresh();
          } catch (e) {
            console.error("Shielded buy error:", e);
            // Mark current step as failed based on which step was last processing
            setShieldedSteps((prev) => {
              const processingStep = prev.find(s => s.status === "processing");
              if (processingStep) {
                return prev.map(s =>
                  s.id === processingStep.id ? { ...s, status: "failed" as const } : s
                );
              }
              return prev.map(s =>
                s.id === "proof" ? { ...s, status: "failed" as const } : s
              );
            });
            // Keep modal open briefly to show failure, then close
            await new Promise((resolve) => setTimeout(resolve, 2000));
            closeShieldedModal();
            toast.error("Shielded buy failed. Please try again.");
          }
        } else {
          await handlePrivateSell();
        }
        return;
      }

      // --- Public Trade Flow ---
      // Use actual on-chain fee BPS (from feePreview which accounts for tier discount)
      // Fallback to 200 BPS (2%) if config not loaded -- safer than underestimating fees
      const FEE_BPS = feePreview?.effectiveFeeBps ?? 200;
      const solRes = new BN(
        tokenType === Outcome.Yes
          ? market.realYesSolReserves
          : market.realNoSolReserves
      );
      const tokRes = new BN(
        tokenType === Outcome.Yes
          ? market.realYesTokenReserves
          : market.realNoTokenReserves
      );
      let minReceive = 0;
      const parsedAmount = rawAmount;

      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        if (tradeMode === "buy") {
          // Buy: contract deducts fees from SOL input, then runs AMM
          const dxLamports = new BN(Math.round(parsedAmount * 1_000_000_000));
          const netDxLamports = dxLamports
            .mul(new BN(10000 - FEE_BPS))
            .div(new BN(10000));
          const tokensOut = tokRes
            .mul(netDxLamports)
            .div(solRes.add(netDxLamports));
          minReceive = Math.floor(tokensOut.toNumber() * 0.99); // 1% safety
        } else {
          // Sell: contract deducts fees from gross SOL output
          const grossSolLamports = parsedAmount * 1_000_000_000;
          const netSolLamports =
            (grossSolLamports * (10000 - FEE_BPS)) / 10000;
          minReceive = Math.floor(netSolLamports * 0.99); // 1% safety
        }
      }

      if (tradeMode === "buy") {
        const sig = await swap(
          market.yesTokenMint,
          market.noTokenMint,
          rawAmount,
          Side.Buy,
          tokenType,
          minReceive,
          false
        );
        if (sig) {
          toast.success("Buy successful!");
          setAmount("");
          refresh();
        }
      } else {
        // Sell: pass isSolAmount: true (input is in SOL)
        const sig = await swap(
          market.yesTokenMint,
          market.noTokenMint,
          rawAmount,
          Side.Sell,
          tokenType,
          minReceive,
          true
        );
        if (sig) {
          toast.success("Sell successful!");
          setAmount("");
          refresh();
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Trade failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Private sell info for display
  const privateSellInfo = useMemo(() => {
    if (!isShielded || tradeMode !== "sell" || !market) return null;
    const direction = isYes ? "YES" : "NO";
    const tokenType = isYes ? Outcome.Yes : Outcome.No;
    const filteredNotes = privateTokenNotes.filter(
      (n) => n.type === direction && !n.isSpent && n.commitment
    );
    const totalRaw = filteredNotes.reduce((acc, n) => acc + n.amount, 0);
    const totalDisplay = totalRaw / TOKEN_MULTIPLIER;

    const solRes = new BN(
      tokenType === Outcome.Yes
        ? market.realYesSolReserves
        : market.realNoSolReserves
    );
    const tokRes = new BN(
      tokenType === Outcome.Yes
        ? market.realYesTokenReserves
        : market.realNoTokenReserves
    );
    const kVal = solRes.mul(tokRes);
    const newTR = tokRes.add(new BN(totalRaw));
    const maxSol =
      totalRaw > 0 ? solRes.sub(kVal.div(newTR)).toNumber() / 1_000_000_000 : 0;

    // Estimate tokens needed for current input
    const inputSol = parseFloat(amount);
    let estimatedTokens = 0;
    if (
      !isNaN(inputSol) &&
      inputSol > 0 &&
      inputSol < solRes.toNumber() / 1_000_000_000
    ) {
      const desiredLamports = Math.round(inputSol * 1_000_000_000);
      const newSR = solRes.sub(new BN(desiredLamports));
      const newTRCalc = kVal.div(newSR);
      estimatedTokens = newTRCalc.sub(tokRes).toNumber() / TOKEN_MULTIPLIER;
    }

    return {
      direction,
      totalDisplay,
      maxSol,
      estimatedTokens,
      noteCount: filteredNotes.length,
    };
  }, [isShielded, tradeMode, market, isYes, privateTokenNotes, amount]);

  const isBusy = isSubmitting || isGeneratingProof;

  return (
    <div className="rounded-3xl p-0.5 relative overflow-hidden border border-border/50 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-xl bg-white dark:bg-card">
      {/* Decorative background glow for dark mode */}
      <div className={cn(
        "absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 blur-[60px] opacity-20 pointer-events-none transition-colors duration-700 hidden dark:block",
        tradeMode === "buy" ? "bg-primary" : "bg-red-500"
      )} />

      {/* Main Content Container */}
      <div className="bg-white dark:bg-background/40 dark:backdrop-blur-xl rounded-[1.4rem] overflow-hidden relative">

        {/* HEADER: Event Info */}
        <div className="relative p-5 border-b border-border/40 dark:border-white/5 flex gap-4 items-center bg-white dark:bg-transparent">
          <div className="w-12 h-12 relative rounded-xl overflow-hidden shadow-md ring-1 ring-border/50 dark:ring-white/10 shrink-0 group">
            <Image
              src={event.icon_url}
              alt=""
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="bg-white/5 hover:bg-white/10 text-[10px] font-bold tracking-widest uppercase border-0 text-muted-foreground">
                {event.main_tag}
              </Badge>
              {timeBadge && (
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-widest",
                  timeBadge.urgent ? "text-primary animate-pulse" : "text-muted-foreground/60"
                )}>
                  {timeBadge.label}
                </span>
              )}
            </div>
            <h3 className="font-bold text-sm leading-tight text-foreground line-clamp-2 pr-2">
              {event.title}
            </h3>
          </div>
          <div className="shrink-0">
            <ShieldCheck className={cn("w-5 h-5 transition-colors", isShielded ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "text-emerald-500/0")} />
          </div>
        </div>

        {/* CONTROLS */}
        {tradingDisabled ? (
          <div className="p-5 space-y-4">
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center">
                <Lock className="w-7 h-7 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Market Ended</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Trading is closed. {market?.winningOutcome !== null ? "Check your position below to claim winnings." : "Awaiting resolution."}
                </p>
              </div>
            </div>
          </div>
        ) : (
        <div className="p-5 space-y-6">

          {/* Buy/Sell Tabs */}
          <div data-tour="trade-mode" className="grid grid-cols-2 gap-1 p-1 bg-muted/60 dark:bg-muted/40 rounded-xl">
            <button
              onClick={() => setTradeMode("buy")}
              className={cn(
                "relative py-3 text-sm font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2",
                tradeMode === "buy"
                  ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/60"
              )}
            >
              <span>Buy</span>
              <TrendingUp className={cn("w-4 h-4", tradeMode === "buy" ? "text-white" : "text-emerald-500/60")} />
            </button>
            <button
              onClick={() => setTradeMode("sell")}
              className={cn(
                "relative py-3 text-sm font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2",
                tradeMode === "sell"
                  ? "bg-rose-500 text-white shadow-sm shadow-rose-500/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/60"
              )}
            >
              <span>Sell</span>
              <TrendingDown className={cn("w-4 h-4", tradeMode === "sell" ? "text-white" : "text-rose-500/60")} />
            </button>
          </div>

          {/* Privacy Toggle */}
          <div
            data-tour="privacy-toggle"
            className={cn(
              "relative flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-500 overflow-hidden cursor-pointer group/privacy",
              isShielded
                ? "border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                : "border-border/40 bg-muted/30 dark:bg-white/5 hover:border-border/60"
            )}
            onClick={() => !isBusy && setIsShielded(!isShielded)}
          >
            {isShielded && (
              <>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.2),transparent_70%)] pointer-events-none" />
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent,rgba(16,185,129,0.05),transparent)] animate-shimmer pointer-events-none" />
              </>
            )}

            <div className="flex items-center gap-3 relative z-10">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-inner",
                  isShielded
                    ? "bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-emerald-500/30 ring-2 ring-emerald-500/20"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isShielded ? (
                  <ShieldCheck className="w-5 h-5 animate-pulse" />
                ) : (
                  <Shield className="w-5 h-5" />
                )}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "text-sm font-black tracking-wide transition-all",
                      isShielded ? "text-emerald-400" : "text-foreground"
                    )}
                  >
                    PRIVACY MODE
                  </span>
                  {isShielded && (
                    <Badge variant="outline" className="text-[9px] h-4 px-1 border-emerald-500/50 text-emerald-400 bg-emerald-500/10">
                      ENCRYPTED
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] font-medium text-muted-foreground/80">
                  {isShielded ? "Zero-Knowledge Proofs Active" : "Shield your trade history"}
                </span>
              </div>
            </div>

            <div
              className={cn(
                "w-12 h-6 rounded-full p-1 transition-all duration-300 ease-in-out relative z-10 shadow-inner border ml-auto",
                isShielded
                  ? "bg-emerald-500 border-transparent shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                  : "bg-muted/50 border-white/10",
                isBusy && "opacity-50 cursor-not-allowed"
              )}
            >
              <div
                className={cn(
                  "w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ease-spring",
                  isShielded ? "translate-x-6" : "translate-x-0"
                )}
              />
            </div>
          </div>

          {/* Outcome Selection */}
          <div data-tour="outcome-buttons" className={cn("grid grid-cols-2 gap-3", (isBusy || tradingDisabled) && "opacity-50 pointer-events-none")}>
            <BinaryOutcomeButton
              label="Yes"
              price={yesPrice}
              side="yes"
              compact
              onClick={() => setTradeSide("yes")}
              selected={tradeSide === "yes"}
              disabled={tradingDisabled}
            />
            <BinaryOutcomeButton
              label="No"
              price={noPrice}
              side="no"
              compact
              onClick={() => setTradeSide("no")}
              selected={tradeSide === "no"}
              disabled={tradingDisabled}
            />
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount</span>
              <div className="flex items-center gap-2">
                {tradeMode === "buy" && (
                  <span className="text-xs text-muted-foreground font-mono">
                    <span className="text-foreground font-bold">{walletBalance.toFixed(4)}</span> SOL
                  </span>
                )}
                {tradeMode === "sell" && !isShielded && balances && (
                  <span className="text-xs text-muted-foreground font-mono">
                    <span className="text-foreground font-bold">
                      {isYes ? balances.yesValueInSol.toFixed(4) : balances.noValueInSol.toFixed(4)}
                    </span> SOL Value
                  </span>
                )}
                {tradeMode === "sell" && isShielded && privateSellInfo && (
                  <span className="text-xs text-muted-foreground font-mono">
                    <span className="text-foreground font-bold">
                      {privateSellInfo.maxSol.toFixed(4)}
                    </span> SOL Value
                  </span>
                )}
                <button
                  onClick={() => {
                    if (tradeMode === "buy") {
                      setAmount(walletBalance.toString());
                    } else if (isShielded && privateSellInfo) {
                      setAmount(privateSellInfo.maxSol.toFixed(4));
                    } else if (balances) {
                      const maxSol = isYes ? balances.yesValueInSol : balances.noValueInSol;
                      setAmount(maxSol.toFixed(4));
                    }
                  }}
                  className="text-[10px] font-bold uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded hover:bg-primary/20 transition-colors"
                >
                  Max
                </button>
              </div>
            </div>

            <div className="relative group/input">
              <div className={cn(
                "absolute -inset-0.5 rounded-2xl opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-300 blur-sm",
                tradeSide === 'yes' ? "bg-emerald-500/30" : "bg-primary/30"
              )} />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isBusy}
                placeholder="0.00"
                className="relative w-full h-16 bg-slate-50 dark:bg-black/50 border border-black/5 dark:border-white/10 rounded-2xl px-5 pr-20 text-3xl font-black text-foreground placeholder:text-muted-foreground/20 focus:outline-none focus:border-black/10 dark:focus:border-white/20 focus:ring-0 focus:bg-white dark:focus:bg-black/60 transition-all tabular-nums backdrop-blur-sm shadow-inner no-spinner"
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground pointer-events-none">
                SOL
              </div>
            </div>
          </div>

          {/* Summary / Fee Preview */}
          {feePreview && (
            <div data-tour="fee-preview" className="bg-slate-50 dark:bg-black/50 rounded-xl p-4 space-y-2 text-xs border border-black/5 dark:border-white/5 backdrop-blur-sm">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Fee Tier ({feePreview.tierLabel})</span>
                <span className={cn(feePreview.tierLabel !== "None" && "text-primary font-bold")}>{feePreview.baseBps / 100}%</span>
              </div>
              {feePreview.discountBps > 0 && (
                <div className="flex justify-between items-center text-emerald-400">
                  <span>Discount</span>
                  <span>-{(feePreview.discountBps / 100).toFixed(2)}%</span>
                </div>
              )}
              <div className="h-px bg-white/5 my-1" />
              <div className="flex justify-between items-center text-foreground font-medium text-sm">
                <span>Amount After Fee</span>
                <span className="font-mono">{(feePreview.netAmount / 1_000_000_000).toFixed(4)} SOL</span>
              </div>
              {tradeMode === "buy" && (
                <div className="flex justify-between items-center text-foreground font-medium text-sm">
                  <span>Payout if Win</span>
                  <span className="font-mono text-emerald-500">{maxPayout.toFixed(4)} SOL</span>
                </div>
              )}
              <div className="flex justify-between items-center text-muted-foreground/60 text-[10px]">
                <span>Profit Potential</span>
                <span className="text-emerald-500 font-bold">+{returnPercent}%</span>
              </div>
            </div>
          )}

          {/* Private Sell Info */}
          {privateSellInfo && (
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 text-xs space-y-1">
              <div className="flex justify-between text-indigo-300 font-bold">
                <span>Private Position</span>
                <span>{privateSellInfo.maxSol.toFixed(4)} SOL</span>
              </div>
              <div className="text-[10px] text-indigo-400/80">
                Across {privateSellInfo.noteCount} shielded notes.
              </div>
            </div>
          )}

          {/* Action Button */}
          <Button
            data-tour="trade-button"
            size="lg"
            className={cn(
              "w-full h-14 text-lg font-bold shadow-lg transition-all duration-300 relative overflow-hidden group/btn",
              tradeMode === "buy"
                ? "bg-gradient-to-r from-primary to-teal-600 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(45,212,191,0.4)]"
                : "bg-gradient-to-r from-red-500 to-red-700 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]",
              isBusy && "opacity-70 cursor-not-allowed"
            )}
            onClick={handleTrade}
            disabled={isBusy || !amount || parseFloat(amount) <= 0 || tradingDisabled}
          >
            {isBusy ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : tradingDisabled ? (
              <span className="flex items-center gap-2">
                {marketDateStatus.isExpired || market?.isCompleted ? "Market Ended" : "Market Closed"}
                <span className="opacity-60 text-sm font-normal">
                  ({tradeSide.toUpperCase()})
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {tradeMode === "buy" ? "Confirm Buy" : "Confirm Sell"}
                <span className="opacity-60 text-sm font-normal">
                  ({tradeSide.toUpperCase()})
                </span>
              </span>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
          </Button>

          {/* Shielded Warning */}
          {isShielded && (
            <div className="flex items-start gap-3 text-xs text-muted-foreground bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
              <p className="leading-relaxed">
                <span className="text-emerald-400 font-bold block mb-0.5">Shielded Mode Active</span>
                Shielded transactions use ZK proofs to hide your trade size and direction on-chain. A small privacy fee applies.
              </p>
            </div>
          )}

        </div>
        )}
      </div>

      <ShieldedTransactionModal
        isOpen={shieldedModalOpen}
        onClose={closeShieldedModal}
        steps={shieldedSteps}
        currentStep={currentShieldedStep}
        totalSteps={shieldedSteps.length}
        transactionType={tradeMode}
      />
    </div>
  );
}
