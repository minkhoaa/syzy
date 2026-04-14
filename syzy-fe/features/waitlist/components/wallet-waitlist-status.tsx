"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Copy, Check, Mail, TrendingUp } from "lucide-react";
import { useReownWallet } from "@/features/auth/hooks/use-reown-wallet";
import { useWaitlistMemberAuthStore } from "@/features/waitlist/store/use-waitlist-member-auth-store";
import { useWaitlistMemberSession } from "@/features/waitlist/hooks/use-waitlist-member-session";
import { waitlistApiClient } from "@/lib/waitlist-kubb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProgressStepper } from "./progress-stepper";
import { cn } from "@/lib/utils";
import { fireConfettiBurst } from "@/features/waitlist/lib/confetti-burst";

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

interface WalletWaitlistStatusProps {
  showIdentity?: boolean;
}

function maskEmail(email: string): string {
  return email.replace(/(.{2}).*(@.*)/, "$1***$2");
}

export function WalletWaitlistStatus({ showIdentity = true }: WalletWaitlistStatusProps) {
  const { address } = useReownWallet();
  const store = useWaitlistMemberAuthStore();
  const queryClient = useQueryClient();
  const { attachEmail } = useWaitlistMemberSession();

  const [emailState, setEmailState] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [attachedEmail, setAttachedEmail] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState(store.member?.email ?? "");
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

  const confirmedEmail =
    (emailState === "done" && attachedEmail) ? attachedEmail : (store.member?.email ?? null);
  const hasEmailCompleted = !!(status?.hasEmail || confirmedEmail);

  const steps = [
    { id: "wallet", label: "Wallet", state: "done" as const },
    { id: "email", label: "Email", state: hasEmailCompleted ? "done" as const : "active" as const },
    { id: "done", label: "Done", state: hasEmailCompleted ? "done" as const : "inactive" as const },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!status) return null;

  const shortAddr = address ? `${address.slice(0, 8)}...${address.slice(-4)}` : "";
  const referralLink = typeof window !== "undefined"
    ? `${window.location.origin}/waitlist?ref=${status.referralCode}`
    : `/waitlist?ref=${status.referralCode}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleAttachEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setEmailState("submitting");
    setEmailError(null);

    try {
      // Use session hook's attachEmail which handles store update + redirect
      const result = await attachEmail(emailInput.trim().toLowerCase());
      setAttachedEmail(result.email);
      setEmailState("done");
      queryClient.invalidateQueries({ queryKey: ["waitlist-member-status", address] });

      // Fire confetti on the email step dot
      setTimeout(() => {
        const step2Dot = document.querySelector("[data-step='email']") as HTMLElement | null;
        if (step2Dot) {
          fireConfettiBurst(step2Dot);
        }
      }, 250);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Something went wrong");
      setEmailState("error");
    }
  }

  const emailValid = /@/.test(emailInput) && /\./.test(emailInput);

  return (
    <div className="space-y-4">
      {/* 1. Referral link u2014 growth-first */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
          Your referral link
        </p>
        <div className="min-w-0 overflow-hidden text-ellipsis rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-muted-foreground mb-3 whitespace-nowrap">
          {referralLink}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Button size="sm" variant="outline" onClick={handleCopy} className="col-span-1">
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={() => {
              const text = `Just secured my spot on the Syzy waitlist \ud83d\ude80\nPredict Invisible. Win Visible.\n\nUse my link to join:\n${referralLink}`;
              window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
            }}
            className="col-span-2 bg-primary hover:bg-teal-600 text-white"
          >
            <TrendingUp className="mr-1.5 h-4 w-4" />
            Share on X
          </Button>
        </div>
      </div>

      {/* 2. Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-xs text-muted-foreground">Queue rank</p>
          <p className="text-3xl font-bold text-foreground leading-tight">
            {status.queueRank != null ? `#${status.queueRank.toLocaleString()}` : "u2014"}
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

      {/* 3. Stepper */}
      <ProgressStepper steps={steps} />

      {/* 4. Email task or success */}
      {confirmedEmail ? (
        <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
            <Check className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-medium text-green-600 dark:text-green-400">
            Email confirmed: {maskEmail(confirmedEmail)}
          </span>
        </div>
      ) : (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Complete your setup</p>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Add your email to receive your access code when early access opens.
          </p>
          <form onSubmit={handleAttachEmail} className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type="email" placeholder="your@email.com"
                  value={emailInput} onChange={(e) => setEmailInput(e.target.value)}
                  disabled={emailState === "submitting"}
                  className={cn(
                    "h-11 rounded-xl border bg-background px-3 py-2 text-sm transition-colors",
                    emailInput.length > 0 && emailValid
                      ? "border-green-500 focus-visible:ring-green-500/30"
                      : "border-border",
                  )}
                />
                {emailInput.length > 0 && emailValid && (
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    <Check className="h-4 w-4 text-green-500" />
                  </span>
                )}
              </div>
              <Button
                type="submit"
                disabled={!emailValid || emailState === "submitting"}
                variant={emailValid && emailState !== "submitting" ? "default" : "outline"}
                size="lg" className="h-11 shrink-0 px-6"
              >
                {emailState === "submitting" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : "Attach"}
              </Button>
            </div>
            {emailState === "error" && emailError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2">
                <p className="text-sm text-destructive">{emailError}</p>
              </div>
            )}
          </form>
        </div>
      )}

      {/* 5. Identity block u2014 optional, hidden when showIdentity=false */}
      {showIdentity && (
        <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3">
          <p className="text-sm font-semibold text-foreground leading-tight">
            Registered as <span className="font-mono">{shortAddr}</span>
          </p>
          <p className="text-xs text-muted-foreground leading-tight">
            Wallet verified. Finish setup below.
          </p>
        </div>
      )}
    </div>
  );
}
