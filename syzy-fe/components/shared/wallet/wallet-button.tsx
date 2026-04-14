"use client"

import { Button } from "@/components/ui/button"
import { Wallet, ChevronDown } from "lucide-react"
import { useReownWallet } from "@/features/auth/hooks/use-reown-wallet"
import { SolIcon } from "@/components/ui/sol-icon"
import { cn } from "@/lib/utils"

interface WalletButtonProps {
  className?: string
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive" | "link"
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg" | "xs"
}

export function WalletButton({ 
  className, 
  variant = "outline",
  size = "sm"
}: WalletButtonProps) {
  const { connected, connecting, openModal, shortAddress } = useReownWallet()

  if (connected) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => openModal({ view: 'Account' })}
        className={cn(
          "gap-2 px-3 py-1.5 h-8 border rounded-full",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <SolIcon size={12} />
          <span className="text-sm font-medium">{shortAddress}</span>
          <ChevronDown className="w-3 h-3" />
        </div>
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => openModal()}
      disabled={connecting}
      className="rounded-full"
    >
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
          <Wallet className="w-3 h-3" />
        </div>
        <span className="text-sm font-medium">
          {connecting ? "Connecting..." : "Connect"}
        </span>
      </div>
    </Button>
  )
}