"use client";

import { useReownWallet } from "@/features/auth/hooks/use-reown-wallet";
import { useWaitlistMemberAuthStore } from "@/features/waitlist/store/use-waitlist-member-auth-store";
import { WalletWaitlistPanel } from "./wallet-waitlist-panel";
import { WalletWaitlistStatus } from "./wallet-waitlist-status";
import { ReferralLoopCard } from "./referral-loop-card";
import { Badge } from "@/components/ui/badge";

interface WaitlistPhaseBoardProps {
  referredByCode?: string | null;
}

export function WaitlistPhaseBoard({ referredByCode }: WaitlistPhaseBoardProps) {
  const { connected, address } = useReownWallet();
  const { member } = useWaitlistMemberAuthStore();
  const hasJoined = connected && !!member;

  if (hasJoined && address) {
    // ---- POST-JOIN LAYOUT ----
    const shortAddr = `${address.slice(0, 8)}...${address.slice(-4)}`;

    return (
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] items-start">
        {/* Left: personalized copy + ReferralLoopCard + identity */}
        <div className="flex flex-col gap-6">
          {/* Personalized greeting */}
          <div className="flex flex-col gap-3">
            <Badge variant="outline" className="w-fit border-green-500/40 text-green-600 dark:text-green-400 text-xs tracking-widest uppercase">
              You&apos;re in
            </Badge>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-tight">
              Climb{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-primary to-primary/60">
                Higher.
              </span>
              <br />
              <span className="text-foreground/40">Share.</span>{" "}
              <span className="text-muted-foreground">Win.</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              You&apos;re on the waitlist. Every referral pushes you up the queue &mdash;
              share your link and climb to the top.
            </p>
          </div>

          {/* ReferralLoopCard */}
          <div className="rounded-2xl border border-border bg-card/50 p-5 shadow-sm backdrop-blur-sm">
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              How it works
            </p>
            <ReferralLoopCard />
          </div>

          {/* Identity block */}
          <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground leading-tight">
                Registered as <span className="font-mono">{shortAddr}</span>
              </p>
              <p className="text-xs text-muted-foreground leading-tight">
                Wallet verified.
              </p>
            </div>
            <span className="text-xs font-medium text-green-600 dark:text-green-400">&#10003; Verified</span>
          </div>
        </div>

        {/* Right: compact status panel */}
        <div className="rounded-2xl border border-border bg-card/50 p-5 shadow-sm backdrop-blur-sm">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Your status
          </p>
          <WalletWaitlistStatus showIdentity={false} />
        </div>
      </div>
    );
  }

  // ---- PRE-JOIN LAYOUT ----
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] items-start">
      {/* Left: header + ReferralLoopCard + stats teaser */}
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <Badge variant="outline" className="w-fit border-primary/40 text-primary text-xs tracking-widest uppercase">
            Early Access
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-tight">
            Predict{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-primary to-primary/60">
              Invisible.
            </span>
            <br />
            <span className="text-foreground/40">Win</span>{" "}
            <span className="text-muted-foreground">Visible.</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Join the Syzy waitlist to get priority access. Connect your wallet,
            earn referral points, and secure your spot at the top.
          </p>
        </div>

        {/* ReferralLoopCard */}
        <div className="rounded-2xl border border-border bg-card/50 p-5 shadow-sm backdrop-blur-sm">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            How it works
          </p>
          <ReferralLoopCard />
        </div>

        {/* Stats teaser */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-card/50 p-4 text-center backdrop-blur-sm">
            <p className="text-2xl font-bold text-primary">1,200+</p>
            <p className="text-xs text-muted-foreground">on the waitlist</p>
          </div>
          <div className="rounded-xl border border-border bg-card/50 p-4 text-center backdrop-blur-sm">
            <p className="text-2xl font-bold text-foreground">Early</p>
            <p className="text-xs text-muted-foreground">access opening soon</p>
          </div>
        </div>
      </div>

      {/* Right: wallet connect + join flow */}
      <div className="rounded-2xl border border-border bg-card/50 p-5 shadow-sm backdrop-blur-sm">
        <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Join the waitlist
        </p>
        <WalletWaitlistPanel referredByCode={referredByCode} />
      </div>
    </div>
  );
}
