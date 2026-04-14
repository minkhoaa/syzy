"use client"

import { useState } from "react"
import { AlertTriangle, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAgentSession } from "@/hooks/use-agent-session"

interface AgentFundingPromptProps {
  estimatedCost: number
  currentBalance: number  // initial value (may be stale — we refresh on mount)
  onFund: (amount: number, toolCallId: string, endpoint: string, method: string, args: Record<string, any>) => void
  onSkip: () => void
  toolCallId: string
  x402Endpoint: string
  method: string
  args: Record<string, any>
}

function getSuggestedAmounts(deficit: number): number[] {
  if (deficit <= 0) return [10, 25, 50]
  const amounts: number[] = []
  const tens = Math.ceil(deficit / 10) * 10
  if (tens > 0) amounts.push(tens)
  const fifties = Math.ceil(deficit / 50) * 50
  if (fifties > tens) amounts.push(fifties)
  const hundreds = Math.ceil(deficit / 100) * 100
  if (hundreds > fifties) amounts.push(hundreds)
  if (amounts.length < 2) amounts.push(tens + 50)
  return amounts.slice(0, 3)
}

export function AgentFundingPrompt({
  estimatedCost,
  currentBalance,
  onFund,
  onSkip,
  toolCallId,
  x402Endpoint,
  method,
  args,
}: AgentFundingPromptProps) {
  const [customAmount, setCustomAmount] = useState("")
  const [showCustom, setShowCustom] = useState(false)
  const [isFunding, setIsFunding] = useState(false)
  const [funded, setFunded] = useState(false)

  const session = useAgentSession()
  // Use live on-chain balance from hook; fall back to prop only if session isn't active yet
  const liveBalance = session.isActive ? session.balance : currentBalance
  const deficit = Math.max(0, estimatedCost - liveBalance)
  const suggestedAmounts = getSuggestedAmounts(deficit)

  const handleFund = async (amount: number) => {
    setIsFunding(true)
    try {
      await onFund(amount, toolCallId, x402Endpoint, method, args)
      setFunded(true)
    } catch (err) {
      console.error("Funding failed:", err)
    } finally {
      setIsFunding(false)
    }
  }

  if (funded) {
    return (
      <div className="mx-auto max-w-xl rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 my-4">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <Check className="h-4 w-4" />
          <span className="text-sm font-medium">Session funded — retrying action...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl rounded-lg border border-teal-500/30 bg-teal-500/5 p-4 my-4 space-y-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-teal-500 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-medium">Insufficient session balance</p>
          <p className="text-xs text-muted-foreground">
            This action requires ~${estimatedCost.toFixed(2)} USDC
          </p>
          <p className="text-xs text-muted-foreground">
            Session balance: ${liveBalance.toFixed(2)} USDC
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {suggestedAmounts.map((amt) => (
          <Button
            key={amt}
            size="sm"
            variant="outline"
            disabled={isFunding}
            onClick={() => handleFund(amt)}
            className="text-xs"
          >
            {isFunding ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              `Fund $${amt}`
            )}
          </Button>
        ))}

        {!showCustom ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={isFunding}
            onClick={() => setShowCustom(true)}
            className="text-xs"
          >
            Custom
          </Button>
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                $
              </span>
              <input
                type="number"
                min={1}
                step={1}
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-20 h-8 pl-5 pr-2 text-xs rounded-md border border-input bg-background"
                placeholder="0"
                autoFocus
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={isFunding || !customAmount || parseFloat(customAmount) <= 0}
              onClick={() => handleFund(parseFloat(customAmount))}
              className="text-xs h-8"
            >
              Fund
            </Button>
          </div>
        )}

        <Button
          size="sm"
          variant="ghost"
          disabled={isFunding}
          onClick={onSkip}
          className={cn("text-xs text-muted-foreground ml-auto")}
        >
          Skip
        </Button>
      </div>
    </div>
  )
}
