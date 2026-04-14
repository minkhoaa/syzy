"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useReownWallet } from "@/features/auth/hooks/use-reown-wallet";
import { useWaitlistMemberAuthStore } from "@/features/waitlist/store/use-waitlist-member-auth-store";
import { waitlistApiClient } from "@/lib/waitlist-kubb";
import { Button } from "@/components/ui/button";
import { WaitlistStepIndicator } from "./waitlist-step-indicator";

interface WaitlistStatusData {
  id: string;
  walletAddress: string;
  referralCode: string;
  queueRank: number;
  totalEntries: number;
  successfulReferralCount: number;
  referredByCode: string | null;
  createdAt: string;
  hasEmail: boolean;
  emailDeliveryEligible: boolean;
}

export function WaitlistScreen3() {
  const { address } = useReownWallet();
  const store = useWaitlistMemberAuthStore();
  const [copied, setCopied] = useState(false);

  const { data: status, isLoading } = useQuery({
    queryKey: ["waitlist-member-status", address],
    queryFn: async () => {
      const res = await waitlistApiClient.get<WaitlistStatusData>("/auth/me", {
        headers: { Authorization: `Bearer ${store.accessToken ?? ""}` },
      });
      return res.data;
    },
    enabled: !!store.accessToken,
    staleTime: 15 * 1000,
    retry: 1,
  });

  const referralCode = status?.referralCode ?? store.member?.referralCode ?? "";
  const referralLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/waitlist?ref=${referralCode}`
      : `/waitlist?ref=${referralCode}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleShareX() {
    const text = `Just secured my spot on the Syzy waitlist \ud83d\ude80\nPredict Invisible. Win Visible.\n\nUse my link to join:\n${referralLink}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <WaitlistStepIndicator currentStep={3} />

      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
          YOU&apos;RE IN
        </h1>
      </div>

      {/* Referral link */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
          YOUR REFERRAL LINK
        </p>
        <div className="min-w-0 overflow-hidden text-ellipsis rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-muted-foreground mb-3 whitespace-nowrap">
          {referralLink}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button size="sm" variant="outline" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy Link"}
          </Button>
          <Button
            size="sm"
            onClick={handleShareX}
            className="bg-primary hover:bg-teal-600 text-white"
          >
            Share on X
          </Button>
        </div>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <p className="text-xs text-muted-foreground">Loading stats...</p>
        </div>
      ) : status ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-xs text-muted-foreground">Queue rank</p>
            <p className="text-3xl font-bold text-foreground leading-tight">
              {status.queueRank != null ? `#${status.queueRank.toLocaleString()}` : "\u2014"}
            </p>
            {status.totalEntries != null && status.totalEntries > 0 && (
              <p className="text-xs text-muted-foreground">of {status.totalEntries.toLocaleString()}</p>
            )}
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-xs text-muted-foreground">Referrals</p>
            <p className="text-3xl font-semibold text-primary leading-tight">
              {status.successfulReferralCount}
            </p>
            <p className="text-xs text-muted-foreground">successful</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
