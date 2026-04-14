# Waitlist 3-Screen Sequential Flow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Split Hero layout in `WaitlistPhaseBoard` with a 3-screen wizard flow (Connect → Email → Done) plus a referral popup after email submit.

**Architecture:** `WaitlistPhaseBoard` becomes a pure controller that reads wallet/member state and renders one of three screens. Each screen is a focused single-column card. A modal popup overlays Screen 3 immediately after email submission. The controller tracks two local state flags: `showPopup` and `skipped`.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4 CSS-first, shadcn/ui (`Button`, `Input`), Zustand (`useWaitlistMemberAuthStore`), `useReownWallet`, `useWaitlistMemberSession`, `useAppKitProvider` (Reown), `useQuery` (TanStack Query), `waitlistApiClient` (axios from `@/lib/waitlist-kubb`).

---

## File Structure

```
# Create (new)
syzy-fe/features/waitlist/components/waitlist-step-indicator.tsx  — horizontal step indicator (wrapper around ProgressStepper)
syzy-fe/features/waitlist/components/waitlist-screen1.tsx          — Connect / Join screen
syzy-fe/features/waitlist/components/waitlist-screen2.tsx          — Email input screen
syzy-fe/features/waitlist/components/waitlist-referral-popup.tsx   — Modal overlay after email submit
syzy-fe/features/waitlist/components/waitlist-screen3.tsx          — Done screen with referral link + stats

# Modify (rebuild)
syzy-fe/features/waitlist/components/waitlist-phase-board.tsx      — Controller: routes to the right screen

# Unchanged (do not touch)
syzy-fe/features/waitlist/components/wallet-waitlist-panel.tsx
syzy-fe/features/waitlist/components/wallet-waitlist-status.tsx
syzy-fe/features/waitlist/components/waitlist-explainer.tsx
syzy-fe/features/waitlist/components/progress-stepper.tsx
syzy-fe/features/waitlist/components/referral-loop-card.tsx
```

---

## Key Interfaces

```ts
// waitlist-step-indicator.tsx
interface WaitlistStepIndicatorProps {
  currentStep: 1 | 2 | 3;
}

// waitlist-screen1.tsx
interface WaitlistScreen1Props {
  referredByCode?: string | null;
}

// waitlist-screen2.tsx
interface WaitlistScreen2Props {
  onEmailSubmitted: () => void;
  onSkip: () => void;
}

// waitlist-referral-popup.tsx
interface WaitlistReferralPopupProps {
  referralCode: string;
  onDismiss: () => void;
}

// waitlist-screen3.tsx — no props (reads from store)

// waitlist-phase-board.tsx
interface WaitlistPhaseBoardProps {
  referredByCode?: string | null;
}
```

---

## Testing Note

This codebase uses Vitest in **node environment** with no jsdom setup, so React component rendering is not possible in tests. All verification is:
1. TypeScript type check: `cd syzy-fe && npx tsc --noEmit` (expected: 0 errors)
2. Visual browser testing via dev server (`pnpm dev`)

---

## Tasks

### Task 1: WaitlistStepIndicator

**Base SHA:** `164aa8f`

**Files:**
- Create: `syzy-fe/features/waitlist/components/waitlist-step-indicator.tsx`

- [ ] **Step 1: Create `waitlist-step-indicator.tsx`**

```tsx
"use client";

import { ProgressStepper, type Step } from "./progress-stepper";

interface WaitlistStepIndicatorProps {
  currentStep: 1 | 2 | 3;
}

export function WaitlistStepIndicator({ currentStep }: WaitlistStepIndicatorProps) {
  const steps: Step[] = [
    {
      id: "connect",
      label: "Connect",
      state: currentStep > 1 ? "done" : currentStep === 1 ? "active" : "inactive",
    },
    {
      id: "register",
      label: "Register",
      state: currentStep > 2 ? "done" : currentStep === 2 ? "active" : "inactive",
    },
    {
      id: "share",
      label: "Share",
      state: currentStep === 3 ? "done" : "inactive",
    },
  ];

  return <ProgressStepper steps={steps} />;
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd syzy-fe && npx tsc --noEmit 2>&1 | head -20
```

Expected: 0 errors (or pre-existing errors unchanged).

- [ ] **Step 3: Commit**

```bash
git add syzy-fe/features/waitlist/components/waitlist-step-indicator.tsx
git commit -m "feat(waitlist): add WaitlistStepIndicator component"
```

---

### Task 2: WaitlistScreen1 (Connect / Join)

**Files:**
- Create: `syzy-fe/features/waitlist/components/waitlist-screen1.tsx`

This screen handles two sub-states:
- **Pre-connect** (not connected): hero card with "JOIN THE WAITLIST" + Connect Now button
- **Connected, not joined**: wallet address shown inline + Join Waitlist button

Join flow is identical to `WalletWaitlistPanel`: fetch challenge → sign → call `join()`. After `join()` resolves, the parent controller will detect `!!member` and automatically switch to Screen 2 — no navigation needed here.

- [ ] **Step 1: Create `waitlist-screen1.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Loader2, Wallet } from "lucide-react";
import { useReownWallet } from "@/features/auth/hooks/use-reown-wallet";
import { useWaitlistMemberSession } from "@/features/waitlist/hooks/use-waitlist-member-session";
import { useAppKitProvider } from "@reown/appkit/react";
import { Button } from "@/components/ui/button";
import { WaitlistStepIndicator } from "./waitlist-step-indicator";

const WAITLIST_ORIGIN = process.env.NEXT_PUBLIC_WAITLIST_API_URL ?? "/api";

interface WaitlistScreen1Props {
  referredByCode?: string | null;
}

export function WaitlistScreen1({ referredByCode }: WaitlistScreen1Props) {
  const { connected, address, connect } = useReownWallet();
  const { walletProvider } = useAppKitProvider<unknown>("solana");
  const { join } = useWaitlistMemberSession();
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    if (!address) return;
    setIsJoining(true);
    setError(null);
    try {
      const challengeRes = await fetch(`${WAITLIST_ORIGIN}/auth/challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address }),
      });
      if (!challengeRes.ok) {
        const err = await challengeRes.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? "Failed to get challenge");
      }
      const { challenge } = await challengeRes.json() as { challenge: string };

      let signature = challenge;
      if (
        typeof walletProvider === "object" &&
        walletProvider !== null &&
        "signMessage" in walletProvider
      ) {
        try {
          signature = await (
            walletProvider as { signMessage: (a: { message: string }) => Promise<string> }
          ).signMessage({ message: challenge });
        } catch { /* dev fallback */ }
      }

      await join(challenge, signature, referredByCode ?? undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsJoining(false);
    }
  }

  if (isJoining) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Signing &amp; registering&hellip;</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <WaitlistStepIndicator currentStep={1} />

      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
          JOIN THE WAITLIST
        </h1>
        <p className="text-sm text-muted-foreground">
          Be the first to experience the new prediction era.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive text-center">
          {error}
        </div>
      )}

      {connected && address ? (
        <>
          <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Wallet connected</p>
              <p className="text-xs text-muted-foreground font-mono">
                {address.slice(0, 6)}&hellip;{address.slice(-4)}
              </p>
            </div>
          </div>

          {referredByCode && (
            <div className="rounded-xl border border-border/50 bg-muted/20 px-4 py-2 text-center">
              <p className="text-xs text-muted-foreground">
                You&apos;ll be credited to your referrer after registration.
              </p>
            </div>
          )}

          <Button
            size="lg"
            onClick={handleJoin}
            className="w-full bg-primary hover:bg-teal-600 text-white font-semibold"
          >
            <Wallet className="mr-2 h-5 w-5" />
            Join waitlist with this wallet
          </Button>
        </>
      ) : (
        <>
          <Button
            size="lg"
            onClick={connect}
            className="w-full bg-primary hover:bg-teal-600 text-white font-semibold"
          >
            <Wallet className="mr-2 h-5 w-5" />
            Connect Now
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Freighter &middot; Albedo &middot; Any Stellar-compatible wallet
          </p>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd syzy-fe && npx tsc --noEmit 2>&1 | head -20
```

Expected: 0 new errors.

- [ ] **Step 3: Commit**

```bash
git add syzy-fe/features/waitlist/components/waitlist-screen1.tsx
git commit -m "feat(waitlist): add WaitlistScreen1 connect/join screen"
```

---

### Task 3: WaitlistScreen2 (Email)

**Files:**
- Create: `syzy-fe/features/waitlist/components/waitlist-screen2.tsx`

This screen shows the email input form. On submit success it calls `onEmailSubmitted()` (controller shows popup). On skip it calls `onSkip()` (controller goes to Screen 3 without popup).

Email validation: same pattern as `WalletWaitlistStatus` — `/@/.test(email) && /\./.test(email)`.

`attachEmail()` from `useWaitlistMemberSession` internally calls `PATCH /waitlist/contact`. The `address` is read from the hook itself, no need to pass it as prop.

- [ ] **Step 1: Create `waitlist-screen2.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Loader2, Check } from "lucide-react";
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
          {emailInput.length > 0 && emailValid && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              <Check className="h-4 w-4 text-green-500" />
            </span>
          )}
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
          {emailState === "submitting" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Submit"
          )}
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
```

- [ ] **Step 2: TypeScript check**

```bash
cd syzy-fe && npx tsc --noEmit 2>&1 | head -20
```

Expected: 0 new errors.

- [ ] **Step 3: Commit**

```bash
git add syzy-fe/features/waitlist/components/waitlist-screen2.tsx
git commit -m "feat(waitlist): add WaitlistScreen2 email input screen"
```

---

### Task 4: WaitlistReferralPopup (Modal)

**Files:**
- Create: `syzy-fe/features/waitlist/components/waitlist-referral-popup.tsx`

Modal overlay positioned `fixed inset-0` with backdrop-blur. Centered card inside. Renders on top of whatever else is in the DOM — no portal needed since it uses `fixed` positioning.

Referral link computed from `window.location.origin + "/waitlist?ref=" + referralCode`. Guarded with `typeof window !== "undefined"` for SSR safety.

Copy button: writes to clipboard, shows green check for 2 seconds.
Share on X: opens `https://twitter.com/intent/tweet?text=...` in new tab.
"Maybe later →": calls `onDismiss()`.

- [ ] **Step 1: Create `waitlist-referral-popup.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Copy, Check, TrendingUp } from "lucide-react";
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
        {/* Celebration icon */}
        <div className="text-center text-4xl">&#127881;</div>

        {/* Title + subtitle */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-green-500 mb-1">
            You&apos;re officially in!
          </h2>
          <p className="text-sm text-muted-foreground">
            Your referral link is ready. Share it now to climb the queue.
          </p>
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
          <Button size="sm" variant="outline" onClick={handleCopy} className="gap-2">
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button
            size="sm"
            onClick={handleShareX}
            className="bg-primary hover:bg-teal-600 text-white gap-2"
          >
            <TrendingUp className="h-4 w-4" />
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
```

- [ ] **Step 2: TypeScript check**

```bash
cd syzy-fe && npx tsc --noEmit 2>&1 | head -20
```

Expected: 0 new errors.

- [ ] **Step 3: Commit**

```bash
git add syzy-fe/features/waitlist/components/waitlist-referral-popup.tsx
git commit -m "feat(waitlist): add WaitlistReferralPopup celebration modal"
```

---

### Task 5: WaitlistScreen3 (Done)

**Files:**
- Create: `syzy-fe/features/waitlist/components/waitlist-screen3.tsx`

Shows all 3 steps done, referral link with Copy + Share on X, and live stats (queue rank + referral count). Stats are fetched from `/auth/me` using the stored access token — same pattern as `WalletWaitlistStatus`.

Define `WaitlistStatusData` interface locally (don't import from `WalletWaitlistStatus` since that file is unchanged).

- [ ] **Step 1: Create `waitlist-screen3.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Copy, Check, TrendingUp } from "lucide-react";
import { useReownWallet } from "@/features/auth/hooks/use-reown-wallet";
import { useWaitlistMemberAuthStore } from "@/features/waitlist/store/use-waitlist-member-auth-store";
import { waitlistApiClient } from "@/lib/waitlist-kubb";
import { Button } from "@/components/ui/button";
import { WaitlistStepIndicator } from "./waitlist-step-indicator";

interface WaitlistStatusData {
  id: string;
  walletAddress: string;
  referralCode: string;
  queueRank: number;
  totalEntries: number;
  successfulReferralCount: number;
  referredByCode: string | null;
  createdAt: string;
  hasEmail: boolean;
  emailDeliveryEligible: boolean;
}

export function WaitlistScreen3() {
  const { address } = useReownWallet();
  const store = useWaitlistMemberAuthStore();
  const [copied, setCopied] = useState(false);

  const { data: status, isLoading } = useQuery({
    queryKey: ["waitlist-member-status", address],
    queryFn: async () => {
      const res = await waitlistApiClient.get<WaitlistStatusData>("/auth/me", {
        headers: { Authorization: `Bearer ${store.accessToken ?? ""}` },
      });
      return res.data;
    },
    enabled: !!store.accessToken,
    staleTime: 15 * 1000,
    retry: 1,
  });

  const referralCode = status?.referralCode ?? store.member?.referralCode ?? "";
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
    <div className="flex flex-col gap-6">
      <WaitlistStepIndicator currentStep={3} />

      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
          YOU&apos;RE IN &#127881;
        </h1>
        <p className="text-sm text-muted-foreground">
          Your referral link is ready. Share it to climb the queue.
        </p>
      </div>

      {/* Referral link */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
          YOUR REFERRAL LINK
        </p>
        <div className="min-w-0 overflow-hidden text-ellipsis rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-muted-foreground mb-3 whitespace-nowrap">
          {referralLink}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button size="sm" variant="outline" onClick={handleCopy} className="gap-2">
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Copied!" : "Copy Link"}
          </Button>
          <Button
            size="sm"
            onClick={handleShareX}
            className="bg-primary hover:bg-teal-600 text-white gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Share on X
          </Button>
        </div>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : status ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-xs text-muted-foreground">Queue rank</p>
            <p className="text-3xl font-bold text-foreground leading-tight">
              {status.queueRank != null ? `#${status.queueRank.toLocaleString()}` : "\u2014"}
            </p>
            {status.totalEntries != null && status.totalEntries > 0 && (
              <p className="text-xs text-muted-foreground">of {status.totalEntries.toLocaleString()}</p>
            )}
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-xs text-muted-foreground">Referrals</p>
            <p className="text-3xl font-semibold text-primary leading-tight">
              {status.successfulReferralCount}
            </p>
            <p className="text-xs text-muted-foreground">successful</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd syzy-fe && npx tsc --noEmit 2>&1 | head -20
```

Expected: 0 new errors.

- [ ] **Step 3: Commit**

```bash
git add syzy-fe/features/waitlist/components/waitlist-screen3.tsx
git commit -m "feat(waitlist): add WaitlistScreen3 done screen with referral + stats"
```

---

### Task 6: Rebuild WaitlistPhaseBoard as 3-Screen Controller

**Files:**
- Modify: `syzy-fe/features/waitlist/components/waitlist-phase-board.tsx`

The controller:
- Reads `connected` + `member` to determine which screen to show
- Tracks `showPopup: boolean` — set `true` after email submit, `false` after popup dismiss
- Tracks `skipped: boolean` — set `true` if user clicks "Skip for now" in Screen 2
- Popup (when `showPopup === true`) is rendered as `fixed inset-0` overlay, so it covers everything
- Each screen is wrapped in a single-column centered card `max-w-md mx-auto`

**State machine:**
```
!connected || !member  →  Screen 1
connected && member && !member.email && !skipped  →  Screen 2
connected && member && (member.email || skipped)  →  Screen 3 (+ popup if showPopup)
```

Note: after email submit, `attachEmail()` in Screen 2 updates the store (`member.email` is set). So by the time `onEmailSubmitted()` fires, `member.email` will be set, and the controller's `showScreen` re-evaluates to 3 automatically. The `showPopup = true` flag then shows the popup overlay.

- [ ] **Step 1: Rewrite `waitlist-phase-board.tsx`**

Fully replace the existing file content:

```tsx
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
      {/* Popup overlays everything when showPopup is true */}
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
```

- [ ] **Step 2: TypeScript check**

```bash
cd syzy-fe && npx tsc --noEmit 2>&1 | head -30
```

Expected: 0 new errors.

- [ ] **Step 3: Verify in browser**

Dev server should already be running at http://localhost:3000. Visit http://localhost:3000/waitlist.

Expected (pre-connect state):
- Single centered card
- Step indicator: step 1 "Connect" active (teal), steps 2+3 inactive
- "JOIN THE WAITLIST" heading
- "Connect Now" button
- "Freighter · Albedo · Any Stellar-compatible wallet" note

If dev server is not running:
```bash
cd syzy-fe && pnpm dev
```

- [ ] **Step 4: Commit**

```bash
git add syzy-fe/features/waitlist/components/waitlist-phase-board.tsx
git commit -m "feat(waitlist): rebuild WaitlistPhaseBoard as 3-screen sequential flow"
```

---

## Self-Review

### Spec coverage check

| Spec requirement | Task |
|---|---|
| Screen 1: step indicator with Connect active | Task 1 + Task 2 |
| Screen 1: "JOIN THE WAITLIST" + "Connect Now" + wallet note | Task 2 |
| Screen 1: after connect → join button inline | Task 2 |
| Screen 1: after join (member in store) → jump to Screen 3 (if already has email) | Task 6 controller |
| Screen 2: trigger `connected && !!member && !hasEmail` | Task 6 controller |
| Screen 2: step 1 done (green), step 2 active | Task 1 + Task 3 |
| Screen 2: email input + Submit | Task 3 |
| Screen 2: No spam footer + Skip link | Task 3 |
| Screen 2: after submit → show Referral Popup (Variant A) | Task 3 `onEmailSubmitted` → Task 6 `setShowPopup(true)` |
| Screen 2: after skip → go to Screen 3 | Task 3 `onSkip` → Task 6 `setSkipped(true)` |
| Referral Popup: celebration icon + title + subtitle | Task 4 |
| Referral Popup: referral link display | Task 4 |
| Referral Popup: Copy + Share on X buttons | Task 4 |
| Referral Popup: "Maybe later →" dismiss | Task 4 |
| Referral Popup: after dismiss → show Screen 3 | Task 4 `onDismiss` → Task 6 `setShowPopup(false)` |
| Popup shown only once (not on refresh) | Handled naturally: after refresh, `member.email` is set → jumps to Screen 3 directly, `showPopup` starts `false` |
| Screen 3: trigger `connected && member && (hasEmail || skipped)` | Task 6 controller |
| Screen 3: all 3 steps done (green) | Task 1 + Task 5 |
| Screen 3: "YOU'RE IN 🎉" title + subtitle | Task 5 |
| Screen 3: referral link + Copy Link + Share on X | Task 5 |
| Screen 3: queue rank + referral count stats | Task 5 |
| Files unchanged: WalletWaitlistPanel, WalletWaitlistStatus, etc. | Verified: Tasks only create new files + modify WaitlistPhaseBoard |

### Placeholder scan

No TBD/TODO/placeholder patterns found — all code blocks are complete.

### Type consistency

- `WaitlistStepIndicator` prop `currentStep: 1 | 2 | 3` used consistently in Tasks 2, 3, 5, 6
- `WaitlistScreen2` props `onEmailSubmitted: () => void; onSkip: () => void` match Task 6 usage
- `WaitlistReferralPopup` props `referralCode: string; onDismiss: () => void` match Task 6 usage
- `member.referralCode` from `WaitlistMemberAuthStore.member` — `WaitlistMember` type has `referralCode: string` ✓
- `WaitlistStatusData` interface defined identically in Task 5 (local copy) — same shape as in `WalletWaitlistStatus` ✓
