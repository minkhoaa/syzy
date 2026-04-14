import { LandingFooter } from "@/components/layout/landing-footer";
import { FaucetCard } from "./_components/faucet-card";
import { FaucetNavbar } from "./_components/faucet-header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Syzy Devnet Faucet — Claim OYRADE Tokens",
  description:
    "Claim free devnet OYRADE tokens to test the Syzy prediction market on Solana devnet.",
};

export default function FaucetPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <FaucetNavbar />

      <main className="flex min-h-[80vh] flex-col items-center justify-center px-4 pt-28 pb-12">
        <FaucetCard />
      </main>

      <LandingFooter />
    </div>
  );
}
