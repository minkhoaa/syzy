"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ToolCall } from "./agent-chat-types"
import { TOOL_COSTS_USDC } from "./agent-chat-types"

function formatToolName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function AgentChatToolCall({
  toolCall,
  liveMode = false,
}: {
  toolCall: ToolCall
  liveMode?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const isDryRun = toolCall.dry_run
  const costUsdc = TOOL_COSTS_USDC[toolCall.name]
  const showCost = liveMode && !isDryRun && !toolCall.loading && costUsdc !== undefined && costUsdc !== 0

  const StatusIcon = toolCall.loading
    ? Loader2
    : isDryRun
      ? AlertCircle
      : CheckCircle2

  return (
    <div
      className={cn(
        "rounded-xl border text-xs mt-3 overflow-hidden",
        isDryRun
          ? "bg-teal-50 dark:bg-teal-500/5 border-teal-200 dark:border-teal-500/20"
          : "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20"
      )}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-3 py-2.5 text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
      >
        <StatusIcon
          className={cn(
            "h-3.5 w-3.5 shrink-0",
            toolCall.loading && "animate-spin text-zinc-400",
            !toolCall.loading && isDryRun && "text-teal-500",
            !toolCall.loading && !isDryRun && "text-emerald-500"
          )}
        />
        <span className="text-zinc-800 dark:text-zinc-200 truncate font-medium">
          {formatToolName(toolCall.name)}
        </span>
        {isDryRun && (
          <span className="text-[10px] uppercase tracking-wider text-teal-600 dark:text-teal-400 border border-teal-300 dark:border-teal-500/30 px-1.5 py-0.5 rounded-md bg-teal-100 dark:bg-teal-500/10">
            DRY RUN
          </span>
        )}
        {showCost && (
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 font-medium tabular-nums">
            {costUsdc === null ? "paid" : `$${costUsdc.toFixed(2)}`}
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-3 w-3 ml-auto shrink-0 text-zinc-400 transition-transform duration-200",
            expanded && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t border-zinc-200 dark:border-white/5 pt-2">
              {toolCall.arguments &&
                Object.keys(toolCall.arguments).length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                      Arguments
                    </span>
                    <pre className="mt-1 max-h-60 overflow-auto rounded-lg bg-zinc-100 dark:bg-zinc-900 p-2.5 text-zinc-700 dark:text-zinc-300 font-mono">
                      {JSON.stringify(toolCall.arguments, null, 2)}
                    </pre>
                  </div>
                )}
              {toolCall.result !== undefined && (
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                    Result
                  </span>
                  <pre className="mt-1 max-h-60 overflow-auto rounded-lg bg-zinc-100 dark:bg-zinc-900 p-2.5 text-zinc-700 dark:text-zinc-300 font-mono">
                    {JSON.stringify(toolCall.result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
