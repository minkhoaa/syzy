"use client";

import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useZkNotes } from "@/features/privacy/hooks/use-zk-notes";
import { usePredictionMarket } from "@/features/trading/hooks/use-prediction-market";
import { TOKEN_MULTIPLIER } from "@/lib/constants/programs";
import { calculatePayoutIfWin } from "@/features/portfolio/utils/portfolio";
import type { Position } from "@/features/portfolio/hooks/use-portfolio";
import type { ShieldedNote } from "@/types/zk.types";

/**
 * Hook that converts ZK notes into Position[] format for the portfolio page.
 * Groups notes by market, fetches on-chain market data, and aggregates YES/NO amounts.
 */
export function useShieldedPositions() {
  const { tokenNotes } = useZkNotes(); // all unspent token notes across all markets
  const { getMarket } = usePredictionMarket();

  // Group notes by market address
  const notesByMarket = useMemo(() => {
    const map = new Map<string, ShieldedNote[]>();
    for (const note of tokenNotes) {
      if (!note.market) continue;
      const existing = map.get(note.market) || [];
      existing.push(note);
      map.set(note.market, existing);
    }
    return map;
  }, [tokenNotes]);

  const marketAddresses = useMemo(
    () => Array.from(notesByMarket.keys()),
    [notesByMarket]
  );

  // Fetch on-chain market data for each unique market
  const marketQueries = useQueries({
    queries: marketAddresses.map((marketPda) => ({
      queryKey: ["shielded-market", marketPda],
      queryFn: () => getMarket(new PublicKey(marketPda)),
      staleTime: 60_000,
      enabled: !!marketPda,
    })),
  });

  const isLoading = marketQueries.some((q) => q.isLoading);

  // Stable timestamp for position objects (avoids impure Date.now() in render)
  const [positionTimestamp] = useState(Date.now);

  // Build Position[] from grouped notes + market data
  const positions = useMemo<Position[]>(() => {
    const result: Position[] = [];

    marketAddresses.forEach((marketPda, idx) => {
      const notes = notesByMarket.get(marketPda);
      if (!notes || notes.length === 0) return;

      const marketQuery = marketQueries[idx];
      const marketData = marketQuery?.data;

      // Skip positions whose market doesn't exist on the current program
      if (!marketData && !marketQuery?.isLoading) return;

      // Aggregate raw amounts (before dividing by TOKEN_MULTIPLIER)
      const totalYesRaw = notes
        .filter((n) => n.type === "YES" && !n.isSpent && n.commitment)
        .reduce((acc, n) => acc + n.amount, 0);
      const totalNoRaw = notes
        .filter((n) => n.type === "NO" && !n.isSpent && n.commitment)
        .reduce((acc, n) => acc + n.amount, 0);

      if (totalYesRaw === 0 && totalNoRaw === 0) return;

      const totalYes = totalYesRaw / TOKEN_MULTIPLIER;
      const totalNo = totalNoRaw / TOKEN_MULTIPLIER;

      // Calculate SOL values using AMM formula
      let yesValueInSol = 0;
      let noValueInSol = 0;

      if (marketData) {
        if (marketData.isCompleted) {
          // Resolved market: winning tokens have face value, losing tokens are worthless
          if (marketData.winningOutcome === 0) {
            yesValueInSol = totalYes;
            noValueInSol = 0;
          } else if (marketData.winningOutcome === 1) {
            yesValueInSol = 0;
            noValueInSol = totalNo;
          }
        } else {
          // Active market: use AMM constant product formula
          if (totalYesRaw > 0) {
            const solRes = new BN(marketData.realYesSolReserves);
            const tokRes = new BN(marketData.realYesTokenReserves);
            const kVal = solRes.mul(tokRes);
            const newTR = tokRes.add(new BN(totalYesRaw));
            yesValueInSol = solRes.sub(kVal.div(newTR)).toNumber() / 1e9;
          }
          if (totalNoRaw > 0) {
            const solRes = new BN(marketData.realNoSolReserves);
            const tokRes = new BN(marketData.realNoTokenReserves);
            const kVal = solRes.mul(tokRes);
            const newTR = tokRes.add(new BN(totalNoRaw));
            noValueInSol = solRes.sub(kVal.div(newTR)).toNumber() / 1e9;
          }
        }
      }

      const totalValueInSol = yesValueInSol + noValueInSol;

      // Determine dominant position for the Position interface
      const position: "Yes" | "No" =
        totalYes >= totalNo ? "Yes" : "No";
      const contracts = position === "Yes" ? totalYes : totalNo;

      // Compute payout-if-win using on-chain reserve/supply data
      let yesPayoutIfWin: number | undefined;
      let noPayoutIfWin: number | undefined;
      let payoutIfWinSol: number | undefined;

      if (marketData && !marketData.isCompleted) {
        const yesSolRes = new BN(marketData.realYesSolReserves).toNumber() / 1e9;
        const noSolRes = new BN(marketData.realNoSolReserves).toNumber() / 1e9;
        const yesTokRes = new BN(marketData.realYesTokenReserves).toNumber() / 1e6;
        const noTokRes = new BN(marketData.realNoTokenReserves).toNumber() / 1e6;
        const yesTotalSupply = new BN(marketData.tokenYesTotalSupply).toNumber() / 1e6;
        const noTotalSupply = new BN(marketData.tokenNoTotalSupply).toNumber() / 1e6;

        if (totalYes > 0) {
          yesPayoutIfWin = calculatePayoutIfWin(totalYes, yesTotalSupply, yesTokRes, yesSolRes, noSolRes);
        }
        if (totalNo > 0) {
          noPayoutIfWin = calculatePayoutIfWin(totalNo, noTotalSupply, noTokRes, yesSolRes, noSolRes);
        }
        payoutIfWinSol = Math.max(yesPayoutIfWin ?? 0, noPayoutIfWin ?? 0);
      }

      result.push({
        id: `shielded-${marketPda}`,
        market: marketData?.marketName || "Unknown Market",
        position,
        contracts,
        avgPrice: "--",
        cost: "--",
        valueNow: `${totalValueInSol.toFixed(4)} SOL`,
        payoutIfWin: payoutIfWinSol !== undefined ? `${payoutIfWinSol.toFixed(4)} SOL` : "--",
        change: "--",
        isProfit: true,
        avatar: marketData?.imageUrl ?? "",
        timestamp: positionTimestamp,
        marketId: marketPda,
        eventId: marketPda,
        marketTitle:
          marketData?.question || marketData?.marketName || "Unknown Market",
        eventTitle: marketData?.marketName || "Unknown Market",
        imageUrl: marketData?.imageUrl ?? "",
        isShielded: true,
        isEnded: marketData?.isCompleted || (marketData?.endDate ? new BN(marketData.endDate).toNumber() < Math.floor(Date.now() / 1000) : false),
        volume: undefined,
        timeLeft: undefined,
        asset: marketData?.category || "PRED",
        assetColor: "bg-primary",
        yesTokens: totalYes,
        noTokens: totalNo,
        yesValueInSol,
        noValueInSol,
        // ROI and payout fields
        costBasisSol: undefined,
        currentRoiPercent: undefined,
        currentRoiSol: undefined,
        payoutIfWinSol,
        roiIfWinPercent: undefined,
        roiIfWinSol: undefined,
        hasCostBasis: false,
        yesPayoutIfWin,
        noPayoutIfWin,
      });
    });

    return result;
  }, [marketAddresses, notesByMarket, marketQueries]);

  return {
    positions,
    isLoading,
    noteCount: tokenNotes.length,
  };
}
