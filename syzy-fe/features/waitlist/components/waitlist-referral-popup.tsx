"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface WaitlistReferralPopupProps {
  referralCode: string;
  onDismiss: () => void;
}

export function WaitlistReferralPopup({ referralCode, onDismiss }: WaitlistReferralPopupProps) {
  const [copied, setCopied] = useState(false);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onDismiss}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-primary/30 bg-card p-6 shadow-2xl flex flex-col gap-5">
        {/* Title */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-green-500">
            You&apos;re officially in!
          </h2>
        </div>

        {/* Referral link display */}
        <div className="rounded-xl border border-border bg-background p-3">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1">
            YOUR REFERRAL LINK
          </p>
          <p className="font-mono text-xs text-primary truncate">{referralLink}</p>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button size="sm" variant="outline" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button
            size="sm"
            onClick={handleShareX}
            className="bg-primary hover:bg-teal-600 text-white"
          >
            Share on X
          </Button>
        </div>

        {/* Dismiss */}
        <button
          type="button"
          onClick={onDismiss}
          className="text-center text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
        >
          Maybe later &rarr;
        </button>
      </div>
    </div>
  );
}
