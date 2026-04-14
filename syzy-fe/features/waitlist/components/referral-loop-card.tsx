"use client";

import { Users, TrendingUp } from "lucide-react";
import { Typography } from "@/components/ui/typography";

export function ReferralLoopCard() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
        <TrendingUp className="h-6 w-6 text-primary" />
      </div>
      <Typography variant="h4" className="mb-2 font-semibold tracking-tight text-white">
        Climb the queue with referrals
      </Typography>
      <Typography variant="p" className="mb-4 text-sm leading-6 text-neutral-400">
        Every friend who connects their wallet using your link moves you up. The more
        successful referrals, the higher you rank.
      </Typography>

      <div className="space-y-3">
        {[
          "Share your unique referral link",
          "Friend connects their Stellar wallet",
          "You move up the waitlist queue",
        ].map((text, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
              <span className="text-[10px] font-bold">{i + 1}</span>
            </div>
            <Typography variant="small" className="text-neutral-400">
              {text}
            </Typography>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/5 bg-white/5 px-3 py-2">
        <Users className="h-4 w-4 text-neutral-500" />
        <Typography variant="small" className="text-neutral-500">
          Top referrers get priority early access
        </Typography>
      </div>
    </div>
  );
}
