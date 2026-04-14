"use client";

import { Typography } from "@/components/ui/typography";

export function ReferralLoopCard() {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-6">
      <Typography variant="h4" className="mb-2 font-semibold tracking-tight text-foreground">
        Climb the queue with referrals
      </Typography>
      <Typography variant="p" className="mb-4 text-sm leading-6 text-muted-foreground">
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
            <Typography variant="small" className="text-muted-foreground">
              {text}
            </Typography>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
        <Typography variant="small" className="text-muted-foreground">
          Top referrers get priority early access
        </Typography>
      </div>
    </div>
  );
}
