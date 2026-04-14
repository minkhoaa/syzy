"use client";

import { useState } from "react";
import { Loader2, Wallet } from "lucide-react";
import { useReownWallet } from "@/features/auth/hooks/use-reown-wallet";
import { useWaitlistMemberSession } from "@/features/waitlist/hooks/use-waitlist-member-session";
import { useWaitlistMemberAuthStore } from "@/features/waitlist/store/use-waitlist-member-auth-store";
import { useAppKitProvider } from "@reown/appkit/react";
import { WalletWaitlistStatus } from "./wallet-waitlist-status";

import { Button } from "@/components/ui/button";

const WAITLIST_ORIGIN = process.env.NEXT_PUBLIC_WAITLIST_API_URL ?? "/api";

interface WalletWaitlistPanelProps {
  referredByCode?: string | null;
}

export function WalletWaitlistPanel({ referredByCode }: WalletWaitlistPanelProps) {
  const { connected, address, connect } = useReownWallet();
  const { walletProvider } = useAppKitProvider<unknown>("solana");
  const { join } = useWaitlistMemberSession();
  const { member } = useWaitlistMemberAuthStore();
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If connected and already registered (has member in store), redirect to show status
  const hasJoined = connected && !!member;

  if (hasJoined && member) {
    // Show full status UI when already registered
    return <WalletWaitlistStatus />;
  }

  if (connected && address) {
    if (isJoining) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-neutral-400">Signing &amp; registering&hellip;</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Wallet connected</p>
            <p className="text-xs text-muted-foreground font-mono">
              {address.slice(0, 6)}...{address.slice(-4)}
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button
          size="lg"
          variant="default"
          onClick={async () => {
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
                throw new Error(err.message ?? "Failed to get challenge");
              }
              const { challenge } = await challengeRes.json();

              let signature = challenge;
              if (typeof walletProvider === "object" && walletProvider !== null && "signMessage" in walletProvider) {
                try {
                  signature = await (walletProvider as { signMessage: (a: { message: string }) => Promise<string> })
                    .signMessage({ message: challenge });
                } catch { /* dev fallback */ }
              }

              await join(challenge, signature, referredByCode ?? undefined);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Registration failed");
            } finally {
              setIsJoining(false);
            }
          }}
          className="w-full bg-primary hover:bg-teal-600 text-white font-semibold"
        >
          <Wallet className="mr-2 h-5 w-5" />
          Join waitlist with this wallet
        </Button>

        {referredByCode && (
          <div className="rounded-xl border border-border/50 bg-muted/20 px-4 py-2">
            <p className="text-xs text-muted-foreground">
              You&apos;ll be credited to your referrer after registration.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-card/50 p-6">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
          <Wallet className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">Connect your Stellar wallet</h3>
        <p className="text-sm text-muted-foreground leading-6">
          Syzy uses wallet-based verification. Connect a Stellar wallet to
          secure your spot and get a referral link immediately. We&apos;ll ask
          for your email after verification to deliver your access code.
        </p>
      </div>

      <Button
        size="lg"
        variant="default"
        onClick={connect}
        className="w-full bg-primary hover:bg-teal-600 text-white font-semibold"
      >
        <Wallet className="mr-2 h-5 w-5" />
        Connect Stellar wallet
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Powered by Freighter, Albedo, or any Stellar-compatible wallet.
      </p>
    </div>
  );
}
