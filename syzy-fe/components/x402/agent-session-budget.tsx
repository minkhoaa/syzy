"use client"

import { useState } from "react"
import { Plus, ArrowDownToLine, AlertTriangle, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useAgentSession } from "@/hooks/use-agent-session"

const QUICK_AMOUNTS = [1, 5, 10, 25]

export function AgentSessionBudget() {
  const session = useAgentSession()
  const [fundingOpen, setFundingOpen] = useState(false)
  const [isFunding, setIsFunding] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [isRecovering, setIsRecovering] = useState(false)
  const [recoverError, setRecoverError] = useState<string | null>(null)

  const handleRecover = async () => {
    setIsRecovering(true)
    setRecoverError(null)
    try {
      const found = await session.recoverSession()
      if (!found) {
        setRecoverError("No funds found. Fund a new session to start trading.")
      }
    } catch (err: any) {
      setRecoverError(err?.message || "Recovery failed")
    } finally {
      setIsRecovering(false)
    }
  }

  const percentage = session.totalFunded > 0
    ? Math.round((session.balance / session.totalFunded) * 100)
    : 0

  const progressColor = percentage > 50
    ? "bg-emerald-500"
    : percentage > 10
      ? "bg-teal-500"
      : "bg-red-500"

  const handleFund = async (amount: number) => {
    setIsFunding(true)
    try {
      if (session.isActive) {
        await session.fundSession(amount)
      } else {
        await session.createSession(amount)
      }
      setFundingOpen(false)
    } catch (err) {
      console.error("Funding failed:", err)
    } finally {
      setIsFunding(false)
    }
  }

  const handleWithdraw = async () => {
    setIsWithdrawing(true)
    try {
      await session.withdrawAll()
    } catch (err) {
      console.error("Withdraw failed:", err)
    } finally {
      setIsWithdrawing(false)
    }
  }

  if (!session.isActive) {
    // Known recoverable balance (stored pubkey had funds on-chain)
    const knownBalance = session.recoverableBalance

    return (
      <div className="mx-auto max-w-3xl px-4 pt-3 space-y-2">
        {/* Recoverable session banner */}
        {(knownBalance !== null || session.canRecover) && (
          <div className="flex items-center justify-between rounded-lg border border-teal-500/30 bg-teal-500/5 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-3.5 w-3.5 text-teal-500 shrink-0" />
              <span className="text-xs text-muted-foreground">
                {knownBalance !== null
                  ? `Existing session detected — $${knownBalance.toFixed(2)} USDC available`
                  : "Have an existing session? Recover it with your wallet"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {recoverError && (
                <span className="text-xs text-red-500">{recoverError}</span>
              )}
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1.5 border-teal-500/40 hover:bg-teal-500/10"
                disabled={isRecovering}
                onClick={handleRecover}
              >
                {isRecovering ? (
                  <>
                    <RotateCcw className="h-3 w-3 animate-spin" />
                    Recovering...
                  </>
                ) : (
                  "Recover session"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Fund new session */}
        <div className="flex items-center justify-between rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 px-4 py-3">
          <span className="text-sm text-muted-foreground">
            Fund your session to trade live
          </span>
          <Popover open={fundingOpen} onOpenChange={setFundingOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Fund
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-52 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Select USDC amount
              </p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_AMOUNTS.map((amt) => (
                  <Button
                    key={amt}
                    size="sm"
                    variant="outline"
                    disabled={isFunding}
                    onClick={() => handleFund(amt)}
                    className="text-xs"
                  >
                    ${amt}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pt-3">
      <div className="rounded-lg border border-border/50 bg-muted/20 px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              Session Budget:
            </span>
            <span className="text-sm">
              ${session.balance.toFixed(2)} / ${session.totalFunded.toFixed(2)}
            </span>
            {percentage <= 10 && session.balance > 0 && (
              <span className="flex items-center gap-1 text-xs text-red-500">
                <AlertTriangle className="h-3 w-3" />
                Low
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Popover open={fundingOpen} onOpenChange={setFundingOpen}>
              <PopoverTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs px-2">
                  <Plus className="h-3 w-3" />
                  Fund
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-52 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Add USDC
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_AMOUNTS.map((amt) => (
                    <Button
                      key={amt}
                      size="sm"
                      variant="outline"
                      disabled={isFunding}
                      onClick={() => handleFund(amt)}
                      className="text-xs"
                    >
                      ${amt}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1 text-xs px-2"
              onClick={handleWithdraw}
              disabled={isWithdrawing || session.balance <= 0}
            >
              <ArrowDownToLine className="h-3 w-3" />
              Withdraw
            </Button>
          </div>
        </div>
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={cn("h-full rounded-full transition-all", progressColor)}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
