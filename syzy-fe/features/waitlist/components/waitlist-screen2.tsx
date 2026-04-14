"use client";

import { useState } from "react";
import { useWaitlistMemberSession } from "@/features/waitlist/hooks/use-waitlist-member-session";
import { useWaitlistMemberAuthStore } from "@/features/waitlist/store/use-waitlist-member-auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WaitlistStepIndicator } from "./waitlist-step-indicator";
import { cn } from "@/lib/utils";

interface WaitlistScreen2Props {
  onEmailSubmitted: () => void;
  onSkip: () => void;
}

export function WaitlistScreen2({ onEmailSubmitted, onSkip }: WaitlistScreen2Props) {
  const { attachEmail } = useWaitlistMemberSession();
  const { member } = useWaitlistMemberAuthStore();
  const [emailInput, setEmailInput] = useState(member?.email ?? "");
  const [emailState, setEmailState] = useState<"idle" | "submitting" | "error">("idle");
  const [emailError, setEmailError] = useState<string | null>(null);

  const emailValid = /@/.test(emailInput) && /\./.test(emailInput);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailInput.trim() || !emailValid) return;
    setEmailState("submitting");
    setEmailError(null);
    try {
      await attachEmail(emailInput.trim().toLowerCase());
      onEmailSubmitted();
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Something went wrong");
      setEmailState("error");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <WaitlistStepIndicator currentStep={2} />

      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">
          ONE MORE STEP TO FINISH SETUP
        </h1>
        <p className="text-sm text-muted-foreground">
          We&apos;ll notify you once our early access is ready.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="relative">
          <Input
            type="email"
            placeholder="your@email.com"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            disabled={emailState === "submitting"}
            className={cn(
              "h-11 rounded-xl border bg-background px-3 py-2 text-sm transition-colors",
              emailInput.length > 0 && emailValid
                ? "border-green-500 focus-visible:ring-green-500/30"
                : "border-border",
            )}
          />
        </div>

        {emailState === "error" && emailError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2">
            <p className="text-sm text-destructive">{emailError}</p>
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={!emailValid || emailState === "submitting"}
          className="w-full bg-primary hover:bg-teal-600 text-white font-semibold"
        >
          {emailState === "submitting" ? "Submitting..." : "Submit"}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        &#128274; No spam. We&apos;ll email you once when we launch.
      </p>

      <button
        type="button"
        onClick={onSkip}
        className="text-center text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
      >
        Skip for now
      </button>
    </div>
  );
}
