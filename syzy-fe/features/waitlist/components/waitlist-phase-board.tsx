"use client";

import { useReownWallet } from "@/features/auth/hooks/use-reown-wallet";
import { WalletWaitlistPanel } from "./wallet-waitlist-panel";
import { WalletWaitlistStatus } from "./wallet-waitlist-status";
import { ReferralLoopCard } from "./referral-loop-card";

interface WaitlistPhaseBoardProps {
  referredByCode?: string | null;
}

export function WaitlistPhaseBoard({ referredByCode }: WaitlistPhaseBoardProps) {
  const { connected } = useReownWallet();

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Left card: wallet entry gate */}
      <div className="rounded-2xl border border-border bg-card/50 p-5 shadow-sm backdrop-blur-sm">
        <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          {connected ? "Your status" : "Join the waitlist"}
        </p>

        <WalletWaitlistPanel referredByCode={referredByCode} />
      </div>

      {/* Right card: referral loop explanation */}
      <div className="rounded-2xl border border-border bg-card/50 p-5 shadow-sm backdrop-blur-sm">
        <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          How it works
        </p>
        <ReferralLoopCard />
      </div>
    </div>
  );
}
