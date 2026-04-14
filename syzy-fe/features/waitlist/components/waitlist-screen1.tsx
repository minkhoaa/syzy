"use client";

import { useState } from "react";
import { Loader2, Wallet } from "lucide-react";
import { useReownWallet } from "@/features/auth/hooks/use-reown-wallet";
import { useWaitlistMemberSession } from "@/features/waitlist/hooks/use-waitlist-member-session";
import { useAppKitProvider } from "@reown/appkit/react";
import { Button } from "@/components/ui/button";
import { WaitlistStepIndicator } from "./waitlist-step-indicator";

const WAITLIST_ORIGIN = process.env.NEXT_PUBLIC_WAITLIST_API_URL ?? "/api";

interface WaitlistScreen1Props {
  referredByCode?: string | null;
}

export function WaitlistScreen1({ referredByCode }: WaitlistScreen1Props) {
  const { connected, address, connect } = useReownWallet();
  const { walletProvider } = useAppKitProvider<unknown>("solana");
  const { join } = useWaitlistMemberSession();
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    if (!address) return;
    setIsJoining(true);
    setError(null);
    try {
      const challengeRes = await fetch(`${WAITLIST_ORIGIN}/auth/challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address }),
      });
      if (!challengeRes.ok) {
        const err = await challengeRes.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? "Failed to get challenge");
      }
      const { challenge } = await challengeRes.json() as { challenge: string };

      let signature = challenge;
      if (
        typeof walletProvider === "object" &&
        walletProvider !== null &&
        "signMessage" in walletProvider
      ) {
        try {
          signature = await (
            walletProvider as { signMessage: (a: { message: string }) => Promise<string> }
          ).signMessage({ message: challenge });
        } catch { /* dev fallback */ }
      }

      await join(challenge, signature, referredByCode ?? undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsJoining(false);
    }
  }

  if (isJoining) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Signing &amp; registering&hellip;</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <WaitlistStepIndicator currentStep={1} />

      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
          JOIN THE WAITLIST
        </h1>
        <p className="text-sm text-muted-foreground">
          Be the first to experience the new prediction era.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive text-center">
          {error}
        </div>
      )}

      {connected && address ? (
        <>
          <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Wallet connected</p>
              <p className="text-xs text-muted-foreground font-mono">
                {address.slice(0, 6)}&hellip;{address.slice(-4)}
              </p>
            </div>
          </div>

          {referredByCode && (
            <div className="rounded-xl border border-border/50 bg-muted/20 px-4 py-2 text-center">
              <p className="text-xs text-muted-foreground">
                You&apos;ll be credited to your referrer after registration.
              </p>
            </div>
          )}

          <Button
            size="lg"
            onClick={handleJoin}
            className="w-full bg-primary hover:bg-teal-600 text-white font-semibold"
          >
            <Wallet className="mr-2 h-5 w-5" />
            Join waitlist with this wallet
          </Button>
        </>
      ) : (
        <>
          <Button
            size="lg"
            onClick={connect}
            className="w-full bg-primary hover:bg-teal-600 text-white font-semibold"
          >
            <Wallet className="mr-2 h-5 w-5" />
            Connect Now
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Freighter &middot; Albedo &middot; Any Stellar-compatible wallet
          </p>
        </>
      )}
    </div>
  );
}
