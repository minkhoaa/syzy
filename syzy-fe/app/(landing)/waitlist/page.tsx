import type { Metadata } from "next";
import { WaitlistPhaseBoard } from "@/features/waitlist/components/waitlist-phase-board";
import { WaitlistExplainer } from "@/features/waitlist/components/waitlist-explainer";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { LandingNavbar } from "@/components/layout/landing-navbar";

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
    <div className="min-h-screen bg-white dark:bg-black text-foreground">
      <LandingNavbar />
      <section className="relative min-h-screen flex flex-col overflow-hidden">
        <AuroraBackground className="flex-1 w-full">
          <div className="relative z-10 container mx-auto px-4 pt-28 sm:pt-32 pb-20">
            <div className="max-w-5xl mx-auto">
              <WaitlistPhaseBoard referredByCode={referredByCode} />
            </div>
            <div className="max-w-5xl mx-auto mt-8">
              <WaitlistExplainer />
            </div>
          </div>
        </AuroraBackground>
      </section>
    </div>
  );
}
