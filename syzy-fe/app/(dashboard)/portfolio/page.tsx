"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Calendar, Rocket, Clock, ArrowUpRight, ArrowDownRight, CheckCircle, XCircle, Loader2, Shield, ShieldCheck, ShieldOff } from "lucide-react";
import { usePortfolio, useTradeHistory, type TradeHistoryItem } from "@/features/portfolio/hooks/use-portfolio";
import { useShieldedPositions } from "@/features/privacy/hooks/use-shielded-positions";
import { useZkNotes } from "@/features/privacy/hooks/use-zk-notes";
import { useWatchlist } from "@/features/portfolio/hooks/use-watchlist";
import { useReownWallet } from "@/features/auth/hooks/use-reown-wallet";
import { useMarketList } from "@/features/markets/hooks/use-market-list";
import { marketItemToEvent } from "@/app/(dashboard)/markets/_utils/market-list-adapter";
import { MarketCard } from "@/app/(dashboard)/markets/_components/market-card";
import { Button } from "@/components/ui/button";
import { NotificationModal } from "@/components/shared/notification-modal";
import { AccountSidebar } from "@/components/portfolio/account-sidebar";
import { PortfolioHeader } from "@/components/portfolio/portfolio-header";
import { PositionRow } from "@/components/portfolio/position-row";
import { cn } from "@/lib/utils";
import { formatSolValue } from "@/features/portfolio/utils/portfolio";
import { useTour } from "@/features/onboarding/hooks/use-tour";
import { steps as portfolioSteps, TOUR_ID, TOUR_VERSION } from "@/features/onboarding/tours/portfolio-tour";
import { TOKEN_MULTIPLIER } from "@/lib/constants/programs";
import type { ShieldedNote } from "@/types/zk.types";

function HistoryItem({ item }: { item: TradeHistoryItem }) {
  // direction is "BUY" or "SELL", tokenType is "YES" or "NO" (uppercase)
  const direction = item.metadata?.direction?.toString().toUpperCase();
  const tokenType = item.metadata?.tokenType?.toString().toUpperCase();
  const isBuy = direction === "BUY";
  const isSell = direction === "SELL";
  const isYes = tokenType === "YES";
  const amount = item.metadata?.amount || 0;
  const eventType = item.eventType;
  const txSignature = item.metadata?.txSignature;

  const getStatusIcon = () => {
    if (eventType === "TRADE_CONFIRMED") {
      return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    } else if (eventType === "TRADE_FAILED") {
      return <XCircle className="w-4 h-4 text-rose-500" />;
    }
    return <Clock className="w-4 h-4 text-teal-500" />;
  };

  const getTradeIcon = () => {
    if (isBuy) {
      return <ArrowUpRight className="w-4 h-4 text-emerald-500" />;
    } else if (isSell) {
      return <ArrowDownRight className="w-4 h-4 text-rose-500" />;
    }
    // Default for unknown direction
    return <ArrowUpRight className="w-4 h-4 text-slate-400" />;
  };

  const solscanUrl = txSignature
    ? `https://solscan.io/tx/${txSignature}?cluster=devnet`
    : null;

  const content = (
    <div className={cn(
      "flex items-center gap-4 p-4 bg-white dark:bg-black/40 dark:backdrop-blur-md border border-slate-100 dark:border-white/[0.05] rounded-xl transition-colors",
      solscanUrl && "hover:border-primary/30 dark:hover:border-primary/50 hover:shadow-sm cursor-pointer"
    )}>
      <div className="flex items-center justify-center w-10 h-10 bg-slate-50 dark:bg-white/[0.04] rounded-xl">
        {getTradeIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn(
            "text-xs font-bold px-2 py-0.5 rounded-full",
            isYes ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" : "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300"
          )}>
            {isYes ? "YES" : "NO"}
          </span>
          <span className={cn(
            "text-xs font-medium",
            isBuy ? "text-emerald-600 dark:text-emerald-400" : isSell ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400"
          )}>
            {isBuy ? "Buy" : isSell ? "Sell" : "Trade"}
          </span>
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
          {item.marketId ? `Market: ${item.marketId.slice(0, 8)}...` : "Unknown Market"}
        </p>
        {txSignature ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-mono">
            Tx: {txSignature.slice(0, 8)}...{txSignature.slice(-8)}
          </p>
        ) : eventType === "TRADE_FAILED" ? (
          <p className="text-xs text-rose-400 dark:text-rose-500 mt-0.5">
            Transaction failed or rejected
          </p>
        ) : eventType === "TRADE_INITIATED" ? (
          <p className="text-xs text-teal-400 dark:text-teal-500 mt-0.5">
            Pending confirmation...
          </p>
        ) : null}
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatSolValue(amount)}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {new Date(item.createdAt).toLocaleDateString()}
        </p>
      </div>
      <div className="flex items-center">
        {getStatusIcon()}
      </div>
    </div>
  );

  if (solscanUrl) {
    return (
      <a href={solscanUrl} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return content;
}


function ShieldedHistoryItem({ note }: { note: ShieldedNote }) {
  const isSol = note.type === "SOL";
  const isYes = note.type === "YES";
  const amount = note.amount / TOKEN_MULTIPLIER;
  const isSpent = note.isSpent;

  const getActionLabel = () => {
    if (isSol) return "Shield";
    return "Private Swap";
  };

  const getActionIcon = () => {
    if (isSol) {
      return <Shield className="w-4 h-4 text-primary" />;
    }
    return <ArrowUpRight className="w-4 h-4 text-emerald-500" />;
  };

  const getStatusIcon = () => {
    if (isSpent) {
      return <ShieldOff className="w-4 h-4 text-slate-400" />;
    }
    return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
  };

  return (
    <div className={cn(
      "flex items-center gap-4 p-4 bg-white dark:bg-black/40 dark:backdrop-blur-md border border-slate-100 dark:border-white/[0.05] rounded-xl transition-colors",
      isSpent && "opacity-60"
    )}>
      <div className="flex items-center justify-center w-10 h-10 bg-primary/10 dark:bg-primary/5 rounded-xl">
        {getActionIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {!isSol && (
            <span className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-full",
              isYes ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" : "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300"
            )}>
              {isYes ? "YES" : "NO"}
            </span>
          )}
          {isSol && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 dark:bg-primary/20 text-primary">
              XLM
            </span>
          )}
          <span className="text-xs font-medium text-primary">
            {getActionLabel()}
          </span>
          {isSpent && (
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
              Spent
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
          {note.market ? `Market: ${note.market.slice(0, 8)}...` : "Shielded Pool"}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-mono">
          {note.commitment.slice(0, 12)}...{note.commitment.slice(-8)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {isSol ? formatSolValue(amount) : `${amount.toLocaleString()} tokens`}
        </p>
        {note.timestamp && (
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {new Date(note.timestamp).toLocaleDateString()}
          </p>
        )}
      </div>
      <div className="flex items-center">
        {getStatusIcon()}
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  useTour({ tourId: TOUR_ID, steps: portfolioSteps, version: TOUR_VERSION });
  const [activeTab, setActiveTab] = useState<"active" | "past" | "watchlist">("active");
  const [positionSubTab, setPositionSubTab] = useState<"public" | "shielded">("public");
  const [historySubTab, setHistorySubTab] = useState<"public" | "shielded">("public");
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);

  const {
    positions,
    stats,
    history,
    tradeStats,
    isLoading,
    isLoadingPositions,
    connected,
  } = usePortfolio();

  const { positions: shieldedPositions, isLoading: isLoadingShielded, noteCount: shieldedNoteCount } = useShieldedPositions();
  const { notes: allZkNotes } = useZkNotes();
  const { address, shortAddress } = useReownWallet();
  const { watchlist, isLoading: isLoadingWatchlist } = useWatchlist();
  const { data: historyData, isLoading: isLoadingHistory } = useTradeHistory(historyPage, 20);
  const { markets: allMarkets, isLoading: isLoadingMarkets } = useMarketList();

  // Reset history pagination when wallet changes (render-time adjustment)
  const [prevAddress, setPrevAddress] = useState(address);
  if (prevAddress !== address) {
    setPrevAddress(address);
    setHistoryPage(1);
  }

  // Filter markets that are in the watchlist and convert to Event format
  const watchlistEvents = useMemo(() => {
    if (!watchlist.length || !allMarkets.length) return [];
    const watchlistIds = new Set(watchlist.map((w) => w.marketId));
    return allMarkets
      .filter((market) => watchlistIds.has(market.publicKey.toString()))
      .map((market) => marketItemToEvent(market));
  }, [watchlist, allMarkets]);

  // Sort all ZK notes by timestamp (newest first) for shielded history
  const sortedShieldedHistory = useMemo(() => {
    return [...allZkNotes].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [allZkNotes]);

  // Prepare stats for AccountSidebar (show SOL values directly)
  const sidebarStats = {
    total: `${stats.totalValueSol.toFixed(4)}`,
    totalInvested: `${(tradeStats?.totalVolume || 0).toFixed(4)} SOL`,
    winRate: `${(tradeStats?.successRate || 0).toFixed(0)}%`,
    todayPnl: "+0.00",
    todayPnlPercent: "0%",
    yesValue: `${stats.yesValueSol.toFixed(4)}`,
    noValue: `${stats.noValueSol.toFixed(4)}`,
    liquidityValue: `${stats.lpValueSol.toFixed(4)}`,
  };

  if (isLoadingPositions && positions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background relative overflow-hidden">
        {/* Same background elements as main page for consistency */}
        <div className="fixed inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/5 pointer-events-none z-0" />
        <div className="fixed inset-0 bg-noise opacity-[0.02] pointer-events-none z-0" />

        <div className="flex flex-col items-center gap-4 relative z-10 transition-all duration-1000 animate-in fade-in zoom-in-95">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin shadow-[0_0_20px_rgba(255,120,24,0.15)]" />
          <p className="text-muted-foreground font-medium animate-pulse tracking-wide">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row h-full relative overflow-hidden">
      {/* Hero background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/5 pointer-events-none z-0" />

      {/* Subtle noise texture */}
      <div className="fixed inset-0 bg-noise opacity-[0.02] pointer-events-none z-0" />

      {/* Mobile Tab Navigation - shown at top on small screens */}
      <div className="lg:hidden sticky top-0 z-50">
        <PortfolioHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          layoutId="mobile"
        />
      </div>

      {/* 1. Left Sidebar - Account Panel */}
      <AccountSidebar
        stats={sidebarStats}
        connected={connected}
        address={address}
        shortAddress={shortAddress}
        balanceHidden={balanceHidden}
        onToggleBalance={() => setBalanceHidden(!balanceHidden)}
        activeCount={stats.activePositions}
        className="z-40"
      />

      {/* 2. Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Sticky Header - hidden on mobile since it's shown above */}
        <PortfolioHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          className="hidden lg:block"
          layoutId="desktop"
        />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin">
          <div className="max-w-5xl mx-auto space-y-4">

            {/* Active Content */}
            {activeTab === "active" && (
              <>
                {/* Sub-tab toggle: Public / Shielded */}
                <div data-tour="public-shielded-toggle" className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-muted/50 rounded-lg w-fit mb-4 border border-transparent dark:border-border/50">
                  <button
                    type="button"
                    onClick={() => setPositionSubTab("public")}
                    className={cn(
                      "text-sm font-semibold px-4 py-1.5 rounded-md transition-all",
                      positionSubTab === "public"
                        ? "bg-white dark:bg-background text-slate-900 dark:text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                        : "text-slate-500 dark:text-muted-foreground hover:text-slate-700 dark:hover:text-foreground"
                    )}
                  >
                    Public
                  </button>
                  <button
                    type="button"
                    onClick={() => setPositionSubTab("shielded")}
                    className={cn(
                      "text-sm font-semibold px-4 py-1.5 rounded-md transition-all flex items-center gap-1.5",
                      positionSubTab === "shielded"
                        ? "bg-primary text-white shadow-sm"
                        : "text-slate-500 dark:text-muted-foreground hover:text-slate-700 dark:hover:text-foreground"
                    )}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Shielded{shieldedNoteCount > 0 && ` (${shieldedPositions.length})`}
                  </button>
                </div>

                {/* Public positions */}
                {positionSubTab === "public" && (
                  <>
                    {isLoadingPositions ? (
                      <div className="flex flex-col items-center justify-center py-12 sm:py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                        <p className="text-slate-500">Loading positions from blockchain...</p>
                      </div>
                    ) : positions.length > 0 ? (
                      <div data-tour="position-rows" className="space-y-3 pb-20">
                        {positions.map((position, index) => (
                          <PositionRow
                            key={position.id}
                            position={position}
                            index={index}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center px-4">
                        <div className="w-16 h-16 sm:w-24 sm:h-24 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                          <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">No Active Positions</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6 sm:mb-8 text-sm sm:text-base">
                          {connected
                            ? "You don't have any active predictions yet. Explore markets to start building your portfolio."
                            : "Connect your wallet to view your portfolio positions."}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                          <Link href="/markets">
                            <Button size="lg" className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                              Explore Markets
                            </Button>
                          </Link>
                          <Link href="/markets/create">
                            <Button size="lg" variant="outline" className="rounded-full">
                              <Rocket className="w-4 h-4 mr-2" />
                              Create Market
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Shielded positions */}
                {positionSubTab === "shielded" && (
                  <>
                    {isLoadingShielded ? (
                      <div className="flex flex-col items-center justify-center py-12 sm:py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                        <p className="text-slate-500">Loading shielded positions...</p>
                      </div>
                    ) : shieldedPositions.length > 0 ? (
                      <div className="space-y-3 pb-20">
                        {shieldedPositions.map((position, index) => (
                          <PositionRow
                            key={position.id}
                            position={position}
                            index={index}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center px-4">
                        <div className="w-16 h-16 sm:w-24 sm:h-24 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                          <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">No Shielded Positions</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6 sm:mb-8 text-sm sm:text-base">
                          {connected
                            ? "No shielded positions yet. Use the Shield feature on any market to create private positions."
                            : "Connect your wallet to view your shielded positions."}
                        </p>
                        <Link href="/markets">
                          <Button size="lg" className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                            Explore Markets
                          </Button>
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* History Content */}
            {activeTab === "past" && (
              <>
                {/* Sub-tab toggle: Public / Shielded */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-muted/50 rounded-lg w-fit mb-4 border border-transparent dark:border-border/50">
                  <button
                    type="button"
                    onClick={() => setHistorySubTab("public")}
                    className={cn(
                      "text-sm font-semibold px-4 py-1.5 rounded-md transition-all",
                      historySubTab === "public"
                        ? "bg-white dark:bg-background text-slate-900 dark:text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                        : "text-slate-500 dark:text-muted-foreground hover:text-slate-700 dark:hover:text-foreground"
                    )}
                  >
                    Public
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistorySubTab("shielded")}
                    className={cn(
                      "text-sm font-semibold px-4 py-1.5 rounded-md transition-all flex items-center gap-1.5",
                      historySubTab === "shielded"
                        ? "bg-primary text-white shadow-sm"
                        : "text-slate-500 dark:text-muted-foreground hover:text-slate-700 dark:hover:text-foreground"
                    )}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Shielded{sortedShieldedHistory.length > 0 && ` (${sortedShieldedHistory.length})`}
                  </button>
                </div>

                {/* Public History */}
                {historySubTab === "public" && (
                  <>
                    {isLoadingHistory ? (
                      <div className="flex flex-col items-center justify-center py-12 sm:py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                        <p className="text-slate-500">Loading trade history...</p>
                      </div>
                    ) : historyData && historyData.items.length > 0 ? (
                      <div className="space-y-3 pb-20">
                        {/* Stats summary */}
                        {tradeStats && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                            <div className="bg-white dark:bg-black/40 dark:backdrop-blur-md border border-slate-100 dark:border-white/[0.05] rounded-xl p-4">
                              <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold mb-1">Total Trades</p>
                              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{tradeStats.totalTrades}</p>
                            </div>
                            <div className="bg-white dark:bg-black/40 dark:backdrop-blur-md border border-slate-100 dark:border-white/[0.05] rounded-xl p-4">
                              <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold mb-1">Success Rate</p>
                              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{tradeStats.successRate.toFixed(0)}%</p>
                            </div>
                            <div className="bg-white dark:bg-black/40 dark:backdrop-blur-md border border-slate-100 dark:border-white/[0.05] rounded-xl p-4">
                              <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold mb-1">Volume</p>
                              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{formatSolValue(tradeStats.totalVolume)}</p>
                            </div>
                            <div className="bg-white dark:bg-black/40 dark:backdrop-blur-md border border-slate-100 dark:border-white/[0.05] rounded-xl p-4">
                              <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold mb-1">Markets</p>
                              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{tradeStats.uniqueMarketsTraded}</p>
                            </div>
                          </div>
                        )}

                        {/* Trade list */}
                        {historyData.items.map((item) => (
                          <HistoryItem key={item.id} item={item} />
                        ))}

                        {/* Pagination */}
                        {historyData.pagination.totalPages > 1 && (
                          <div className="flex justify-center gap-2 pt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={historyPage === 1}
                              onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                            >
                              Previous
                            </Button>
                            <span className="flex items-center px-4 text-sm text-slate-500">
                              Page {historyPage} of {historyData.pagination.totalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={historyPage >= historyData.pagination.totalPages}
                              onClick={() => setHistoryPage((p) => p + 1)}
                            >
                              Next
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center animate-in fade-in zoom-in duration-300 px-4">
                        <div className="w-16 h-16 sm:w-24 sm:h-24 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 sm:mb-6 opacity-80">
                          <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">No Public History</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                          {connected
                            ? "Your completed predictions and trade history will appear here."
                            : "Connect your wallet to view your trade history."}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Shielded History */}
                {historySubTab === "shielded" && (
                  <>
                    {sortedShieldedHistory.length > 0 ? (
                      <div className="space-y-3 pb-20">
                        {/* Shielded stats summary */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                          <div className="bg-white dark:bg-black/40 dark:backdrop-blur-md border border-slate-100 dark:border-white/[0.05] rounded-xl p-4">
                            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold mb-1">Total Notes</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{sortedShieldedHistory.length}</p>
                          </div>
                          <div className="bg-white dark:bg-black/40 dark:backdrop-blur-md border border-slate-100 dark:border-white/[0.05] rounded-xl p-4">
                            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold mb-1">Active</p>
                            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{sortedShieldedHistory.filter(n => !n.isSpent).length}</p>
                          </div>
                          <div className="bg-white dark:bg-black/40 dark:backdrop-blur-md border border-slate-100 dark:border-white/[0.05] rounded-xl p-4">
                            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold mb-1">Spent</p>
                            <p className="text-xl font-bold text-slate-500 dark:text-slate-400">{sortedShieldedHistory.filter(n => n.isSpent).length}</p>
                          </div>
                        </div>

                        {/* Shielded note list */}
                        {sortedShieldedHistory.map((note) => (
                          <ShieldedHistoryItem key={note.commitment} note={note} />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center animate-in fade-in zoom-in duration-300 px-4">
                        <div className="w-16 h-16 sm:w-24 sm:h-24 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 sm:mb-6 opacity-80">
                          <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">No Shielded History</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                          {connected
                            ? "Your shielded transaction history will appear here. Use the Shield feature on any market to create private positions."
                            : "Connect your wallet to view your shielded history."}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* Watchlist Content */}
            {activeTab === "watchlist" && (
              <>
                {isLoadingWatchlist || isLoadingMarkets ? (
                  <div className="flex flex-col items-center justify-center py-12 sm:py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                    <p className="text-slate-500">Loading watchlist...</p>
                  </div>
                ) : watchlistEvents.length > 0 ? (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-20 animate-in fade-in duration-500">
                    {watchlistEvents.map((event) => (
                      <div key={event.id} className="min-w-[300px]">
                        <MarketCard event={event} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center animate-in fade-in zoom-in duration-300 px-4">
                    <div className="w-16 h-16 sm:w-24 sm:h-24 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                      <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-slate-300 dark:text-slate-600" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Watchlist Empty</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6 sm:mb-8 text-sm sm:text-base">
                      {connected
                        ? "Star markets to keep track of them here. Click the + icon on any market card to add it."
                        : "Connect your wallet to manage your watchlist."}
                    </p>
                    <Link href="/markets">
                      <Button size="lg" variant="outline" className="rounded-full">
                        <Rocket className="w-4 h-4 mr-2" />
                        Browse Markets
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </main>

      <NotificationModal
        open={notificationModalOpen}
        onOpenChange={setNotificationModalOpen}
      />
    </div>
  );
}
