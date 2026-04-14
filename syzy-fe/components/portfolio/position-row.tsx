"use client";

import Image from "next/image";
import Link from "next/link";
import { type Position } from "@/features/portfolio/hooks/use-portfolio";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ShieldCheck, ChevronRight, Calendar } from "lucide-react";
import { motion } from "framer-motion";

function AssetIcon({ position }: { position: Position }) {
  const assetColors: Record<string, string> = {
    SOL: "bg-gradient-to-br from-blue-500 to-indigo-600",
    Crypto: "bg-gradient-to-br from-teal-500 to-teal-600",
    BTC: "bg-gradient-to-br from-teal-400 to-teal-600",
    ETH: "bg-gradient-to-br from-slate-700 to-slate-900",
    default: "bg-gradient-to-br from-primary to-primary/80",
  };

  const bg = position.assetColor || assetColors[position.asset || ""] || assetColors.default;

  return (
    <div className="relative shrink-0">
      <div
        className={cn(
          "w-12 h-12 rounded-2xl overflow-hidden shadow-sm relative flex items-center justify-center text-white font-bold text-xs",
          bg,
          position.isShielded && "ring-2 ring-primary ring-offset-2",
        )}
      >
        {position.imageUrl ? (
          <Image src={position.imageUrl} alt={position.asset || ""} width={48} height={48} className="w-full h-full object-cover" />
        ) : (
          <div className="text-sm font-bold tracking-tight">{position.asset?.slice(0, 4) || <Calendar className="w-5 h-5 opacity-80" />}</div>
        )}
      </div>
      {position.isShielded && (
        <div className="absolute -top-1.5 -right-1.5 bg-primary text-white rounded-full p-0.5 shadow-sm border border-white z-10">
          <ShieldCheck className="w-3 h-3" />
        </div>
      )}
    </div>
  );
}

interface PositionRowProps {
  position: Position;
  index: number;
}

export function PositionRow({ position, index }: PositionRowProps) {
  // Parse XLM value from valueNow (format: "0.0008 XLM")
  const solValue = parseFloat(position.valueNow?.replace(" XLM", "") || "0");

  // Check if we have both YES and NO tokens
  const hasYes = (position.yesTokens || 0) > 0;
  const hasNo = (position.noTokens || 0) > 0;
  const hasBoth = hasYes && hasNo;

  return (
    <Link href={`/markets/${position.marketId}`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="group relative bg-white dark:bg-black/40 dark:backdrop-blur-md border border-slate-100 dark:border-white/[0.05] rounded-xl p-4 hover:shadow-lg hover:border-primary/30 dark:hover:border-primary/50 hover:-translate-y-[2px] transition-all duration-300 cursor-pointer"
      >
        {/* Hover Highlight Line */}
        <div className="absolute left-0 top-4 bottom-4 w-1 bg-primary rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="flex items-center gap-4">
          {/* Asset Icon */}
          <AssetIcon position={position} />

          {/* Main Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {hasBoth ? (
                <>
                  <Badge className="text-[10px] px-2 py-0.5 h-5 uppercase tracking-wider font-bold bg-emerald-500 hover:bg-emerald-600 border-0 text-white">YES</Badge>
                  <Badge className="text-[10px] px-2 py-0.5 h-5 uppercase tracking-wider font-bold bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/50 border-rose-200 dark:border-rose-900/50">NO</Badge>
                </>
              ) : (
                <Badge
                  variant={position.position === "Yes" ? "default" : "secondary"}
                  className={cn(
                    "text-[10px] px-2 py-0.5 h-5 uppercase tracking-wider font-bold",
                    position.position === "Yes" && "bg-emerald-500 hover:bg-emerald-600 border-0 text-white",
                    position.position === "No" && "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/50 border-rose-200 dark:border-rose-900/50",
                  )}
                >
                  {position.position}
                </Badge>
              )}
              {position.isShielded && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 px-2 py-0.5 rounded-full border border-teal-100 dark:border-teal-900/30">
                  <ShieldCheck className="w-3 h-3" /> Shielded
                </span>
              )}
              {position.isEnded && (
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700/50">
                  Ended
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-primary transition-colors">{position.marketTitle || position.eventTitle || "Unknown Market"}</h3>
          </div>

          {/* Data Columns */}
          <div className="shrink-0 flex items-center gap-4 lg:gap-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6">
              {/* Header row */}
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider col-span-1 text-right">Value</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider col-span-1 text-right hidden md:block">ROI</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider col-span-1 text-right hidden lg:block">Payout if win</p>

              {/* Value */}
              <div className="text-right w-[105px]">
                {hasBoth ? (
                  <div className="space-y-0.5 mt-1">
                    <p className="text-[13px] font-semibold text-emerald-600">
                      <span className="text-[10px] text-slate-400 mr-1">Y</span>
                      {(position.yesValueInSol || 0).toFixed(4)}
                    </p>
                    <p className="text-[13px] font-semibold text-rose-600">
                      <span className="text-[10px] text-slate-400 mr-1">N</span>
                      {(position.noValueInSol || 0).toFixed(4)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {solValue.toFixed(4)} <span className="text-xs text-slate-400">XLM</span>
                  </p>
                )}
              </div>

              {/* ROI */}
              <div className="text-right hidden md:block w-[105px]">
                {position.hasCostBasis && position.currentRoiPercent !== undefined ? (
                  <div className="mt-1">
                    <p className={cn("text-sm font-bold", position.currentRoiPercent >= 0 ? "text-emerald-600" : "text-rose-600")}>
                      {position.currentRoiPercent >= 0 ? "+" : ""}
                      {position.currentRoiPercent.toFixed(1)}%
                    </p>
                    <p className={cn("text-xs", (position.currentRoiSol ?? 0) >= 0 ? "text-emerald-500/80" : "text-rose-500/80")}>
                      {(position.currentRoiSol ?? 0) >= 0 ? "+" : ""}
                      {(position.currentRoiSol ?? 0).toFixed(4)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-300 font-medium mt-1">--</p>
                )}
              </div>

              {/* Payout */}
              <div className="text-right hidden lg:block w-[105px]">
                {position.payoutIfWinSol !== undefined ? (
                  <div className="mt-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {position.payoutIfWinSol.toFixed(4)} <span className="text-xs text-slate-400">XLM</span>
                    </p>
                    {position.hasCostBasis && position.roiIfWinPercent !== undefined ? (
                      <p className={cn("text-xs", position.roiIfWinPercent >= 0 ? "text-emerald-500/80" : "text-rose-500/80")}>
                        {position.roiIfWinPercent >= 0 ? "+" : ""}
                        {position.roiIfWinPercent.toFixed(1)}%
                      </p>
                    ) : hasBoth ? (
                      <div className="space-y-0.5">
                        {position.yesPayoutIfWin !== undefined && (
                          <p className="text-[13px] font-semibold text-emerald-600">
                            <span className="text-[10px] text-slate-400 mr-1">Y</span>
                            {position.yesPayoutIfWin.toFixed(4)}
                          </p>
                        )}
                        {position.noPayoutIfWin !== undefined && (
                          <p className="text-[13px] font-semibold text-rose-600">
                            <span className="text-[10px] text-slate-400 mr-1">N</span>
                            {position.noPayoutIfWin.toFixed(4)}
                          </p>
                        )}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-slate-300 font-medium mt-1">--</p>
                )}
              </div>
            </div>

            {/* Chevron */}
            <div className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all ml-2">
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
