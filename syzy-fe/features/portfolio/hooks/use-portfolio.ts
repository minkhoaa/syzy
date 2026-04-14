"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useReownWallet } from "@/features/auth/hooks/use-reown-wallet";
import { useAuthStore } from "@/features/auth/store/use-auth-store";
import { apiClient } from "@/lib/kubb";
import {
  fetchUserPositionsFromChain,
  calculatePortfolioStats,
  calculatePayoutIfWin,
  type UserPosition,
  type PortfolioStats,
} from "@/features/portfolio/utils/portfolio";

// Re-export types for backward compatibility
export type { UserPosition, PortfolioStats };

// Legacy Position type for backward compatibility with existing components
export interface Position {
  id: string;
  market: string;
  position: "Yes" | "No";
  contracts: number;
  avgPrice: string;
  cost: string;
  valueNow: string;
  payoutIfWin: string;
  change: string;
  isProfit: boolean;
  avatar: string;
  timestamp: number;
  marketId: string;
  eventId: string;
  marketTitle: string;
  eventTitle: string;
  imageUrl: string;
  isShielded: boolean;
  volume?: string;
  timeLeft?: string;
  asset?: string;
  assetColor?: string;
  // Both YES and NO data for combined display
  yesTokens?: number;
  noTokens?: number;
  yesValueInSol?: number;
  noValueInSol?: number;
  // ROI and payout fields
  costBasisSol?: number;
  currentRoiPercent?: number;
  currentRoiSol?: number;
  payoutIfWinSol?: number;
  roiIfWinPercent?: number;
  roiIfWinSol?: number;
  hasCostBasis: boolean;
  yesPayoutIfWin?: number;
  noPayoutIfWin?: number;
  isEnded?: boolean;
}

// Trade history item from backend
export interface TradeHistoryItem {
  id: string;
  eventType: "TRADE_CONFIRMED" | "TRADE_INITIATED" | "TRADE_FAILED";
  marketId: string | null;
  metadata: {
    amount?: number;
    direction?: "yes" | "no";
    tokenType?: "yes" | "no";
    txSignature?: string;
    side?: "buy" | "sell";
    errorMessage?: string;
  } | null;
  createdAt: string;
}

interface TradeHistoryResponse {
  success: boolean;
  data: {
    items: TradeHistoryItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

interface CostBasisResponse {
  success: boolean;
  data: Record<string, { yesCostBasis: number; noCostBasis: number }>;
}

interface TradeStatsResponse {
  success: boolean;
  data: {
    totalTrades: number;
    totalAttempts: number;
    successRate: number;
    totalVolume: number;
    yesVolume: number;
    noVolume: number;
    uniqueMarketsTraded: number;
  };
}

/**
 * Convert on-chain UserPosition to legacy Position format for backward compatibility.
 */
function convertToLegacyPosition(
  userPosition: UserPosition,
  index: number,
  costBasisData?: Record<string, { yesCostBasis: number; noCostBasis: number }>,
): Position | null {
  // Skip positions with no tokens
  if (userPosition.yesTokenAmount === 0 && userPosition.noTokenAmount === 0) {
    return null;
  }

  const hasYes = userPosition.yesTokenAmount > 0;
  const hasNo = userPosition.noTokenAmount > 0;

  // Determine dominant position for backward compatibility fields
  const position: "Yes" | "No" = hasYes && (!hasNo || userPosition.yesTokenAmount >= userPosition.noTokenAmount)
    ? "Yes"
    : "No";

  const contracts = position === "Yes" ? userPosition.yesTokenAmount : userPosition.noTokenAmount;

  const currentPrice = position === "Yes"
    ? (userPosition.market?.yesPrice || 0.5)
    : (userPosition.market?.noPrice || 0.5);

  // Calculate total value for combined display
  const totalValueInSol = (userPosition.yesValueInSol || 0) + (userPosition.noValueInSol || 0);

  // Cost basis from backend
  const marketCostBasis = costBasisData?.[userPosition.marketPda];
  const yesCostBasis = marketCostBasis?.yesCostBasis ?? 0;
  const noCostBasis = marketCostBasis?.noCostBasis ?? 0;
  const totalCostBasis = yesCostBasis + noCostBasis;
  const hasCostBasis = totalCostBasis > 0;

  // Current ROI
  let currentRoiPercent: number | undefined;
  let currentRoiSol: number | undefined;
  if (hasCostBasis) {
    currentRoiSol = totalValueInSol - totalCostBasis;
    currentRoiPercent = (currentRoiSol / totalCostBasis) * 100;
  }

  // Payout if win (using on-chain resolution formula)
  let yesPayoutIfWin: number | undefined;
  let noPayoutIfWin: number | undefined;
  let payoutIfWinSol: number | undefined;

  const m = userPosition.market;
  if (m && !m.isCompleted) {
    if (hasYes) {
      yesPayoutIfWin = calculatePayoutIfWin(
        userPosition.yesTokenAmount,
        m.tokenYesTotalSupply,
        m.realYesTokenReserves,
        m.realYesSolReserves,
        m.realNoSolReserves,
      );
    }
    if (hasNo) {
      noPayoutIfWin = calculatePayoutIfWin(
        userPosition.noTokenAmount,
        m.tokenNoTotalSupply,
        m.realNoTokenReserves,
        m.realYesSolReserves,
        m.realNoSolReserves,
      );
    }
    // Best-case payout: max of both sides (if holding both, each side wins independently)
    payoutIfWinSol = Math.max(yesPayoutIfWin ?? 0, noPayoutIfWin ?? 0);
  }

  // ROI if win
  let roiIfWinPercent: number | undefined;
  let roiIfWinSol: number | undefined;
  if (hasCostBasis && payoutIfWinSol !== undefined) {
    roiIfWinSol = payoutIfWinSol - totalCostBasis;
    roiIfWinPercent = (roiIfWinSol / totalCostBasis) * 100;
  }

  // Check if market has ended (past end date or resolved)
  const isEnded = m?.isCompleted || (m?.endDate ? m.endDate < Math.floor(Date.now() / 1000) : false);

  return {
    id: `${userPosition.marketPda}-${position.toLowerCase()}-${index}`,
    market: userPosition.market?.marketName || "Unknown Market",
    position,
    contracts,
    avgPrice: hasCostBasis ? `${totalCostBasis.toFixed(4)} XLM` : "--",
    cost: hasCostBasis ? `${totalCostBasis.toFixed(4)} XLM` : "--",
    valueNow: `${totalValueInSol.toFixed(4)} XLM`,
    payoutIfWin: payoutIfWinSol !== undefined ? `${payoutIfWinSol.toFixed(4)} XLM` : "--",
    change: currentRoiPercent !== undefined ? `${currentRoiPercent >= 0 ? "+" : ""}${currentRoiPercent.toFixed(1)}%` : "--",
    isProfit: currentRoiSol !== undefined ? currentRoiSol >= 0 : true,
    avatar: userPosition.market?.imageUrl || "",
    timestamp: Date.now(),
    marketId: userPosition.marketPda,
    eventId: userPosition.marketPda,
    marketTitle: userPosition.market?.question || userPosition.market?.marketName || "Unknown",
    eventTitle: userPosition.market?.marketName || "Unknown Event",
    imageUrl: userPosition.market?.imageUrl || "",
    isShielded: false,
    isEnded,
    volume: undefined,
    timeLeft: undefined,
    asset: userPosition.market?.category || "PRED",
    assetColor: "bg-primary",
    // Include both YES and NO data
    yesTokens: userPosition.yesTokenAmount,
    noTokens: userPosition.noTokenAmount,
    yesValueInSol: userPosition.yesValueInSol || 0,
    noValueInSol: userPosition.noValueInSol || 0,
    // ROI and payout fields
    costBasisSol: hasCostBasis ? totalCostBasis : undefined,
    currentRoiPercent,
    currentRoiSol,
    payoutIfWinSol,
    roiIfWinPercent,
    roiIfWinSol,
    hasCostBasis,
    yesPayoutIfWin,
    noPayoutIfWin,
  };
}

/**
 * Main portfolio hook - fetches on-chain positions, backend history, and calculates stats.
 */
export function usePortfolio() {
  const { address, connected } = useReownWallet();
  const { accessToken, isAuthenticated } = useAuthStore();

  // Fetch on-chain positions
  const {
    data: onChainPositions,
    isLoading: isLoadingPositions,
    error: positionsError,
    refetch: refetchPositions,
  } = useQuery({
    queryKey: ["portfolio", "positions", address],
    queryFn: () => fetchUserPositionsFromChain(address!),
    enabled: !!address && connected,
    staleTime: 30_000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  // Fetch trade history from backend
  const {
    data: historyData,
    isLoading: isLoadingHistory,
  } = useQuery({
    queryKey: ["portfolio", "history", address],
    queryFn: async (): Promise<TradeHistoryItem[]> => {
      if (!address) return [];
      const response = await apiClient.get<TradeHistoryResponse>(
        `/api/portfolio/${address}/history`,
        { params: { limit: 50, eventType: "TRADE_CONFIRMED" } }
      );
      return response.data.data.items;
    },
    enabled: !!address && isAuthenticated,
    staleTime: 60_000, // 1 minute
  });

  // Fetch cost basis from backend
  const {
    data: costBasisData,
    isLoading: isLoadingCostBasis,
  } = useQuery({
    queryKey: ["portfolio", "cost-basis", address],
    queryFn: async () => {
      if (!address) return {};
      const response = await apiClient.get<CostBasisResponse>(
        `/api/portfolio/${address}/cost-basis`
      );
      return response.data.data;
    },
    enabled: !!address && isAuthenticated,
    staleTime: 60_000,
  });

  // Fetch trade stats from backend
  const {
    data: tradeStats,
    isLoading: isLoadingStats,
  } = useQuery({
    queryKey: ["portfolio", "stats", address],
    queryFn: async () => {
      if (!address) return null;
      const response = await apiClient.get<TradeStatsResponse>(
        `/api/portfolio/${address}/stats`
      );
      return response.data.data;
    },
    enabled: !!address && isAuthenticated,
    staleTime: 60_000,
  });

  // Convert to legacy positions for backward compatibility
  // Filter out resolved/completed markets - they should not appear in "Active Positions"
  const positions = useMemo<Position[]>(() => {
    if (!onChainPositions) return [];
    return onChainPositions
      .filter((pos) => !pos.market?.isCompleted) // Only show active market positions
      .map((pos, idx) => convertToLegacyPosition(pos, idx, costBasisData))
      .filter((p): p is Position => p !== null);
  }, [onChainPositions, costBasisData]);

  // Calculate portfolio stats
  const stats = useMemo<PortfolioStats>(() => {
    const calculated = calculatePortfolioStats(onChainPositions || [], {
      totalTrades: tradeStats?.totalTrades,
      totalVolume: tradeStats?.totalVolume,
      successRate: tradeStats?.successRate,
    });
    return calculated;
  }, [onChainPositions, tradeStats]);

  // Combined loading state
  const isLoading = isLoadingPositions || isLoadingHistory || isLoadingStats || isLoadingCostBasis;

  // Refresh all data
  const refreshPortfolio = async () => {
    await refetchPositions();
  };

  return {
    // On-chain positions (new format)
    onChainPositions: onChainPositions || [],
    // Legacy positions (for backward compatibility)
    positions,
    // Trade history
    history: historyData || [],
    // Calculated stats
    stats,
    // Trade stats from backend
    tradeStats,
    // Loading states
    isLoading,
    isLoadingPositions,
    isLoadingHistory,
    isLoadingStats,
    // Errors
    error: positionsError,
    // Actions
    refreshPortfolio,
    // Wallet state
    connected,
    address,
    isAuthenticated,
  };
}

/**
 * Hook specifically for fetching paginated trade history.
 */
export function useTradeHistory(page = 1, limit = 20) {
  const { address } = useReownWallet();
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ["portfolio", "history", address, page, limit],
    queryFn: async () => {
      if (!address) return { items: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } };
      const response = await apiClient.get<TradeHistoryResponse>(
        `/api/portfolio/${address}/history`,
        { params: { page, limit, eventType: "TRADE_CONFIRMED" } }
      );
      return response.data.data;
    },
    enabled: !!address && isAuthenticated,
    staleTime: 30_000,
  });
}
