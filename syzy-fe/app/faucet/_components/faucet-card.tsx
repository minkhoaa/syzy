"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTokenBalance } from "../_hooks/use-token-balance";
import {
  CLAIM_AMOUNT_DISPLAY,
  getExplorerTxUrl,
  getExplorerTokenUrl,
  TOKEN_MINT_ADDRESS,
} from "../_utils/constants";
import {
  Droplets,
  Loader2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Wallet,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";

type ClaimState = "idle" | "claiming" | "success" | "cooldown";

interface ClaimResult {
  signature: string;
  cooldownEndsAt: number;
}

export function FaucetCard() {
  const { address, isConnected } = useAppKitAccount();
  const { open } = useAppKit();
  const { data: balance, isLoading: balanceLoading } = useTokenBalance();
  const queryClient = useQueryClient();

  const [claimState, setClaimState] = useState<ClaimState>("idle");
  const [lastClaim, setLastClaim] = useState<ClaimResult | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!lastClaim?.cooldownEndsAt) return;

    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil((lastClaim.cooldownEndsAt - Date.now()) / 1000)
      );
      setCooldownRemaining(remaining);
      if (remaining <= 0) {
        setClaimState("idle");
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [lastClaim?.cooldownEndsAt]);

  const handleClaim = useCallback(async () => {
    if (!address) return;

    setClaimState("claiming");
    try {
      const res = await fetch("/api/faucet/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setLastClaim({
            signature: "",
            cooldownEndsAt: data.cooldownEndsAt || Date.now() + 3600_000,
          });
          setClaimState("cooldown");
          toast.error("Rate limited — please wait before claiming again.");
          return;
        }
        throw new Error(data.error || "Claim failed");
      }

      setLastClaim({
        signature: data.data.signature,
        cooldownEndsAt: data.data.cooldownEndsAt,
      });
      setClaimState("success");
      toast.success(
        `Claimed ${CLAIM_AMOUNT_DISPLAY.toLocaleString()} OYRADE!`
      );

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["faucet-token-balance"] });
      }, 2000);

      setTimeout(() => {
        setClaimState("cooldown");
      }, 5000);
    } catch (err) {
      setClaimState("idle");
      toast.error(
        err instanceof Error ? err.message : "Failed to claim tokens"
      );
    }
  }, [address, queryClient]);

  const formatCooldown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const copySignature = () => {
    if (!lastClaim?.signature) return;
    navigator.clipboard.writeText(lastClaim.signature);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="w-full max-w-md mx-auto border border-border py-4">
      <CardHeader className="pb-2 pt-0">
        <div className="flex items-center gap-3">
          <Image
            src="/logo/syzy.svg"
            alt="Syzy"
            width={90}
            height={90}
            className="h-8 w-auto"
          />
          <div>
            <CardTitle className="text-lg">Claim OYRADE Tokens</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {CLAIM_AMOUNT_DISPLAY.toLocaleString()} OYRADE per claim
              &middot; 1h cooldown &middot; Devnet only
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-0">
        {/* Balance & Token Mint */}
        {isConnected && address && (
          <div className="rounded-md border bg-muted/30 divide-y text-sm">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-muted-foreground">Balance</span>
              <span className="font-mono font-medium">
                {balanceLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  `${(balance ?? 0).toLocaleString()} OYRADE`
                )}
              </span>
            </div>
            {TOKEN_MINT_ADDRESS && (
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-muted-foreground">Mint</span>
                <a
                  href={getExplorerTokenUrl(TOKEN_MINT_ADDRESS)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                >
                  {TOKEN_MINT_ADDRESS.slice(0, 4)}...
                  {TOKEN_MINT_ADDRESS.slice(-4)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Claim Button */}
        {!isConnected ? (
          <Button className="w-full gap-2" onClick={() => open()}>
            <Wallet className="h-4 w-4" />
            Connect Wallet to Claim
          </Button>
        ) : claimState === "claiming" ? (
          <Button className="w-full gap-2" disabled>
            <Loader2 className="h-4 w-4 animate-spin" />
            Minting...
          </Button>
        ) : claimState === "success" ? (
          <Button
            className="w-full gap-2 bg-green-600 hover:bg-green-600"
            disabled
          >
            <CheckCircle2 className="h-4 w-4" />
            Claimed {CLAIM_AMOUNT_DISPLAY.toLocaleString()} OYRADE
          </Button>
        ) : claimState === "cooldown" && cooldownRemaining > 0 ? (
          <Button className="w-full gap-2" variant="outline" disabled>
            <Clock className="h-4 w-4" />
            Cooldown: {formatCooldown(cooldownRemaining)}
          </Button>
        ) : (
          <Button className="w-full gap-2" onClick={handleClaim}>
            <Droplets className="h-4 w-4" />
            Claim {CLAIM_AMOUNT_DISPLAY.toLocaleString()} OYRADE
          </Button>
        )}

        {/* Transaction link */}
        {lastClaim?.signature && (
          <div className="flex items-center justify-between rounded-md border px-3 py-2 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span className="font-mono">
                {lastClaim.signature.slice(0, 8)}...
                {lastClaim.signature.slice(-8)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={copySignature}
                className="p-1 hover:text-foreground text-muted-foreground transition-colors"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
              <a
                href={getExplorerTxUrl(lastClaim.signature)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 hover:text-foreground text-muted-foreground transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="border-t" />

        {/* SOL Devnet Faucet */}
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium">Need SOL for transaction fees?</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Get free devnet SOL from the official Solana faucet.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            asChild
          >
            <a
              href="https://faucet.solana.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Faucet SOL
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
