import type { Metadata } from "next";
import { WaitlistPhaseBoard } from "@/features/waitlist/components/waitlist-phase-board";
import { WaitlistExplainer } from "@/features/waitlist/components/waitlist-explainer";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Join the Syzy Waitlist | Priority Access",
  description:
    "Secure your spot in the Syzy prediction market. Connect your wallet, refer friends, and climb the queue for early access.",
};

interface WaitlistPageProps {
  searchParams: Promise<{ ref?: string }>;
}

export default async function WaitlistPage({ searchParams }: WaitlistPageProps) {
  const { ref } = await searchParams;
  const referredByCode = ref ?? null;

  return (
    <div className="min-h-screen bg-black text-foreground">
      <AuroraBackground className="flex-1 w-full">
        <div className="relative z-10 container mx-auto px-4 pt-32 pb-20">
          {/* Header */}
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <Badge variant="outline" className="mb-6 border-primary/40 text-primary text-xs tracking-widest uppercase">
              Early Access
            </Badge>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-6 text-white leading-tight">
              Predict{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-primary to-primary/60">
                Invisible.
              </span>
              <br />
              <span className="text-neutral-600">Win</span>{" "}
              <span className="text-neutral-400">Visible.</span>
            </h1>
            <p className="text-lg sm:text-xl text-neutral-400 max-w-xl mx-auto leading-relaxed">
              Join the Syzy waitlist to get priority access. Connect your wallet,
              earn referral points, and secure your spot at the top.
            </p>
          </div>

          {/* 2-col board: left=wallet flow, right=how it works */}
          <div className="max-w-5xl mx-auto">
            <WaitlistPhaseBoard referredByCode={referredByCode} />
          </div>

          {/* Explainer FAQ below */}
          <div className="max-w-5xl mx-auto mt-8">
            <WaitlistExplainer />
          </div>
        </div>
      </AuroraBackground>
    </div>
  );
}
