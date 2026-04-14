"use client";

import { useState } from "react";
import { useReownWallet } from "@/features/auth/hooks/use-reown-wallet";
import { useWaitlistMemberAuthStore } from "@/features/waitlist/store/use-waitlist-member-auth-store";
import { WaitlistScreen1 } from "./waitlist-screen1";
import { WaitlistScreen2 } from "./waitlist-screen2";
import { WaitlistScreen3 } from "./waitlist-screen3";
import { WaitlistReferralPopup } from "./waitlist-referral-popup";

interface WaitlistPhaseBoardProps {
  referredByCode?: string | null;
}

export function WaitlistPhaseBoard({ referredByCode }: WaitlistPhaseBoardProps) {
  const { connected } = useReownWallet();
  const { member } = useWaitlistMemberAuthStore();
  const [showPopup, setShowPopup] = useState(false);
  const [skipped, setSkipped] = useState(false);

  const hasJoined = connected && !!member;
  const hasEmail = !!(member?.email);

  function handleEmailSubmitted() {
    setShowPopup(true);
  }

  function handleSkip() {
    setSkipped(true);
  }

  function handlePopupDismiss() {
    setShowPopup(false);
  }

  const showScreen: 1 | 2 | 3 = !hasJoined
    ? 1
    : !hasEmail && !skipped
    ? 2
    : 3;

  return (
    <div className="max-w-md mx-auto">
      {showPopup && member && (
        <WaitlistReferralPopup
          referralCode={member.referralCode}
          onDismiss={handlePopupDismiss}
        />
      )}

      <div className="rounded-2xl border border-border bg-card/50 p-6 sm:p-8 shadow-sm backdrop-blur-sm">
        {showScreen === 1 && (
          <WaitlistScreen1 referredByCode={referredByCode} />
        )}
        {showScreen === 2 && (
          <WaitlistScreen2
            onEmailSubmitted={handleEmailSubmitted}
            onSkip={handleSkip}
          />
        )}
        {showScreen === 3 && <WaitlistScreen3 />}
      </div>
    </div>
  );
}
