# Waitlist Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `/waitlist` tu1eeb 2-col symmetric sang Split Hero layout, enrich nu1ed9i dung, reorder status panel theo thu1ee9 tu1ef1 referral-first.

**Architecture:** `WaitlistPhaseBoard` tru1edf thu00e0nh layout controller duy nhu1ea5t u2014 render 2 layout khu00e1c nhau du1ef1a tru00ean `hasJoined = connected && !!member`. Header block chuyu1ec3n tu1eeb `page.tsx` vu00e0o left column cu1ee7a `WaitlistPhaseBoard`. `WalletWaitlistStatus` u0111u01b0u1ee3c reorder vu00e0 nhu1eadn prop `showIdentity` u0111u1ec3 identity block cu00f3 thu1ec3 hiu1ec3n thu1ecb u1edf left column thay vu00ec right. `WalletWaitlistPanel` khu00f4ng cu00f2n delegate sang `WalletWaitlistStatus` nu1eefa u2014 viu1ec7c u0111u00f3 do `WaitlistPhaseBoard` u0111u1ea3m nhiu1ec7m.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4, shadcn/ui components, Zustand (`useWaitlistMemberAuthStore`), `useReownWallet`

---

## File Map

| File | Thay u0111u1ed5i |
|---|---|
| `syzy-fe/app/(landing)/waitlist/page.tsx` | Remove header block, remove `Badge` import |
| `syzy-fe/features/waitlist/components/wallet-waitlist-panel.tsx` | Remove WalletWaitlistStatus delegation; add trust signals + referral notice |
| `syzy-fe/features/waitlist/components/wallet-waitlist-status.tsx` | Reorder JSX; add `showIdentity` prop; remove standalone Share CTA + referredByCode block |
| `syzy-fe/features/waitlist/components/waitlist-phase-board.tsx` | Major rebuild: pre-join layout + post-join layout; import Badge, member store |

Files khu00f4ng u0111u1ed5i: `waitlist-explainer.tsx`, `referral-loop-card.tsx`, `progress-stepper.tsx`

---

### Task 1: Update `page.tsx` u2014 remove header block

**Files:**
- Modify: `syzy-fe/app/(landing)/waitlist/page.tsx`

- [ ] **Step 1: Replace tou00e0n bu1ed9 nu1ed9i dung file**

Remove header div (badge + H1 + subtitle), remove `Badge` import, giu1eef nguyu00ean phu1ea7n cu00f2n lu1ea1i:

```tsx
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
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd syzy-fe && pnpm tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add syzy-fe/app/(landing)/waitlist/page.tsx
git commit -m "refactor(waitlist): remove header block from page.tsx, move into WaitlistPhaseBoard"
```

---

### Task 2: Refactor `WalletWaitlistPanel` u2014 trust signals + remove status delegation

**Files:**
- Modify: `syzy-fe/features/waitlist/components/wallet-waitlist-panel.tsx`

- [ ] **Step 1: Remove `WalletWaitlistStatus` import vu00e0 early-return delegation**

Hiu1ec7n tu1ea1i du00f2ng 9 import `WalletWaitlistStatus` vu00e0 du00f2ng 30u201333 tru1ea3 vu1ec1 `<WalletWaitlistStatus />` khi `hasJoined`. Xu00f3a cu1ea3 hai. `WaitlistPhaseBoard` su1ebd xu1eed lu00fd viu1ec7c u0111u00f3.

```tsx
"use client";

import { useState } from "react";
import { Loader2, Wallet } from "lucide-react";
import { useReownWallet } from "@/features/auth/hooks/use-reown-wallet";
import { useWaitlistMemberSession } from "@/features/waitlist/hooks/use-waitlist-member-session";
import { useWaitlistMemberAuthStore } from "@/features/waitlist/store/use-waitlist-member-auth-store";
import { useAppKitProvider } from "@reown/appkit/react";
import { Button } from "@/components/ui/button";
```

(Xu00f3a `import { WalletWaitlistStatus }` vu00e0 xu00f3a `const hasJoined = connected && !!member;` + early return block)

- [ ] **Step 2: Enrich connect-wallet card vu1edbi trust signals**

Tu00ecm block hiu1ec3n thu1ecb khi chu01b0a ku1ebft nu1ed1i (default return, du00f2ng 115u2013143) vu00e0 thay bu1eb1ng version sau:

```tsx
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-card/50 p-6">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
          <Wallet className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">Connect your Stellar wallet</h3>
        <p className="text-sm text-muted-foreground leading-6 mb-4">
          Syzy uses wallet-based verification. Connect a Stellar wallet to
          secure your spot and get a referral link immediately.
        </p>
        {/* Trust signals */}
        <div className="flex flex-col gap-2 mb-4">
          {[
            "No email required to join",
            "Referral link generated instantly",
            "Freighter, Albedo, or any Stellar wallet",
          ].map((text) => (
            <div key={text} className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-green-500 font-bold text-xs">u2713</span>
              {text}
            </div>
          ))}
        </div>
      </div>

      <Button
        size="lg"
        variant="default"
        onClick={connect}
        className="w-full bg-primary hover:bg-teal-600 text-white font-semibold"
      >
        <Wallet className="mr-2 h-5 w-5" />
        Connect Stellar wallet
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Powered by Freighter, Albedo, or any Stellar-compatible wallet.
      </p>

      {referredByCode && (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-3">
          <p className="text-xs text-muted-foreground">
            ud83cudf81 You were referred u2014 joining gives your referrer a point.
          </p>
        </div>
      )}
    </div>
  );
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd syzy-fe && pnpm tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add syzy-fe/features/waitlist/components/wallet-waitlist-panel.tsx
git commit -m "refactor(waitlist): remove status delegation from WalletWaitlistPanel, add trust signals"
```

---

### Task 3: Refactor `WalletWaitlistStatus` u2014 reorder + `showIdentity` prop

**Files:**
- Modify: `syzy-fe/features/waitlist/components/wallet-waitlist-status.tsx`

- [ ] **Step 1: Cu1eadp nhu1eadt imports u2014 xu00f3a `ExternalLink`, `UserPlus`**

Tu00ecm du00f2ng import lucide-react vu00e0 thay bu1eb1ng:

```tsx
import { Loader2, Copy, Check, Mail, TrendingUp } from "lucide-react";
```

- [ ] **Step 2: Thu00eam `showIdentity` prop vu00e0o interface vu00e0 function signature**

Thu00eam interface mu1edbi phu00eda tru01b0u1edbc `function maskEmail`:

```tsx
interface WalletWaitlistStatusProps {
  showIdentity?: boolean;
}
```

Cu1eadp nhu1eadt function signature:

```tsx
export function WalletWaitlistStatus({ showIdentity = true }: WalletWaitlistStatusProps) {
```

- [ ] **Step 3: Xu00f3a `handleShareX` function (share su1ebd inline trong referral section)**

Xu00f3a tou00e0n bu1ed9 function `handleShareX` (hiu1ec7n du00f2ng 89u201392). Giu1eef lu1ea1i nu1ed9i dung cu1ee7a nu00f3 nhu01b0ng inline vu00e0o button onClick u1edf Step 4.

- [ ] **Step 4: Thay tou00e0n bu1ed9 return JSX**

Tu00ecm `return (` bu1eaft u0111u1ea7u bu1eb1ng `<div className="space-y-4">` vu00e0 thay bu1eb1ng nu1ed9i dung sau (thu1ee9 tu1ef1 mu1edbi: referral u2192 stats u2192 stepper u2192 email u2192 identity):

```tsx
  return (
    <div className="space-y-4">
      {/* 1. Referral link u2014 growth-first */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
          Your referral link
        </p>
        <div className="min-w-0 overflow-hidden text-ellipsis rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-muted-foreground mb-3 whitespace-nowrap">
          {referralLink}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Button size="sm" variant="outline" onClick={handleCopy} className="col-span-1">
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={() => {
              const text = `Just secured my spot on the Syzy waitlist \ud83d\ude80\nPredict Invisible. Win Visible.\n\nUse my link to join:\n${referralLink}`;
              window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
            }}
            className="col-span-2 bg-primary hover:bg-teal-600 text-white"
          >
            <TrendingUp className="mr-1.5 h-4 w-4" />
            Share on X
          </Button>
        </div>
      </div>

      {/* 2. Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-xs text-muted-foreground">Queue rank</p>
          <p className="text-3xl font-bold text-foreground leading-tight">
            {status.queueRank != null ? `#${status.queueRank.toLocaleString()}` : "u2014"}
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

      {/* 3. Stepper */}
      <ProgressStepper steps={steps} />

      {/* 4. Email task or success */}
      {confirmedEmail ? (
        <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
            <Check className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-medium text-green-600 dark:text-green-400">
            Email confirmed: {maskEmail(confirmedEmail)}
          </span>
        </div>
      ) : (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Complete your setup</p>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Add your email to receive your access code when early access opens.
          </p>
          <form onSubmit={handleAttachEmail} className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type="email" placeholder="your@email.com"
                  value={emailInput} onChange={(e) => setEmailInput(e.target.value)}
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
              <Button
                type="submit"
                disabled={!emailValid || emailState === "submitting"}
                variant={emailValid && emailState !== "submitting" ? "default" : "outline"}
                size="lg" className="h-11 shrink-0 px-6"
              >
                {emailState === "submitting" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : "Attach"}
              </Button>
            </div>
            {emailState === "error" && emailError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2">
                <p className="text-sm text-destructive">{emailError}</p>
              </div>
            )}
          </form>
        </div>
      )}

      {/* 5. Identity block u2014 optional, hidden when rendered inside left column */}
      {showIdentity && (
        <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3">
          <p className="text-sm font-semibold text-foreground leading-tight">
            Registered as <span className="font-mono">{shortAddr}</span>
          </p>
          <p className="text-xs text-muted-foreground leading-tight">
            Wallet verified. Finish setup below.
          </p>
        </div>
      )}
    </div>
  );
```

- [ ] **Step 5: Verify TypeScript**

```bash
cd syzy-fe && pnpm tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

- [ ] **Step 6: Commit**

```bash
git add syzy-fe/features/waitlist/components/wallet-waitlist-status.tsx
git commit -m "refactor(waitlist): reorder WalletWaitlistStatus (referral-first), add showIdentity prop"
```

---

### Task 4: Rebuild `WaitlistPhaseBoard` u2014 Split Hero layout

**Files:**
- Modify: `syzy-fe/features/waitlist/components/waitlist-phase-board.tsx`

- [ ] **Step 1: Thay tou00e0n bu1ed9 file**

File mu1edbi render 2 layout khu00e1c nhau du1ef1a tru00ean `hasJoined`. Pre-join: left = header + ReferralLoopCard + stats teaser, right = WalletWaitlistPanel. Post-join: left = personalized + ReferralLoopCard + identity block, right = WalletWaitlistStatus (showIdentity=false).

```tsx
"use client";

import { useReownWallet } from "@/features/auth/hooks/use-reown-wallet";
import { useWaitlistMemberAuthStore } from "@/features/waitlist/store/use-waitlist-member-auth-store";
import { WalletWaitlistPanel } from "./wallet-waitlist-panel";
import { WalletWaitlistStatus } from "./wallet-waitlist-status";
import { ReferralLoopCard } from "./referral-loop-card";
import { Badge } from "@/components/ui/badge";

interface WaitlistPhaseBoardProps {
  referredByCode?: string | null;
}

export function WaitlistPhaseBoard({ referredByCode }: WaitlistPhaseBoardProps) {
  const { connected, address } = useReownWallet();
  const { member } = useWaitlistMemberAuthStore();
  const hasJoined = connected && !!member;

  if (hasJoined && address) {
    // ---- POST-JOIN LAYOUT ----
    const shortAddr = `${address.slice(0, 8)}...${address.slice(-4)}`;

    return (
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] items-start">
        {/* Left: personalized copy + ReferralLoopCard + identity */}
        <div className="flex flex-col gap-6">
          {/* Personalized greeting */}
          <div className="flex flex-col gap-3">
            <Badge variant="outline" className="w-fit border-green-500/40 text-green-600 dark:text-green-400 text-xs tracking-widest uppercase">
              You&apos;re in
            </Badge>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-tight">
              Climb{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-primary to-primary/60">
                Higher.
              </span>
              <br />
              <span className="text-foreground/40">Share.</span>{" "}
              <span className="text-muted-foreground">Win.</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              You&apos;re on the waitlist. Every referral pushes you up the queue u2014
              share your link and climb to the top.
            </p>
          </div>

          {/* ReferralLoopCard */}
          <div className="rounded-2xl border border-border bg-card/50 p-5 shadow-sm backdrop-blur-sm">
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              How it works
            </p>
            <ReferralLoopCard />
          </div>

          {/* Identity block */}
          <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground leading-tight">
                Registered as <span className="font-mono">{shortAddr}</span>
              </p>
              <p className="text-xs text-muted-foreground leading-tight">
                Wallet verified.
              </p>
            </div>
            <span className="text-xs font-medium text-green-600 dark:text-green-400">u2713 Verified</span>
          </div>
        </div>

        {/* Right: compact status panel */}
        <div className="rounded-2xl border border-border bg-card/50 p-5 shadow-sm backdrop-blur-sm">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Your status
          </p>
          <WalletWaitlistStatus showIdentity={false} />
        </div>
      </div>
    );
  }

  // ---- PRE-JOIN LAYOUT ----
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] items-start">
      {/* Left: header + ReferralLoopCard + stats teaser */}
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <Badge variant="outline" className="w-fit border-primary/40 text-primary text-xs tracking-widest uppercase">
            Early Access
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-tight">
            Predict{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-primary to-primary/60">
              Invisible.
            </span>
            <br />
            <span className="text-foreground/40">Win</span>{" "}
            <span className="text-muted-foreground">Visible.</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Join the Syzy waitlist to get priority access. Connect your wallet,
            earn referral points, and secure your spot at the top.
          </p>
        </div>

        {/* ReferralLoopCard */}
        <div className="rounded-2xl border border-border bg-card/50 p-5 shadow-sm backdrop-blur-sm">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            How it works
          </p>
          <ReferralLoopCard />
        </div>

        {/* Stats teaser */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-card/50 p-4 text-center backdrop-blur-sm">
            <p className="text-2xl font-bold text-primary">1,200+</p>
            <p className="text-xs text-muted-foreground">on the waitlist</p>
          </div>
          <div className="rounded-xl border border-border bg-card/50 p-4 text-center backdrop-blur-sm">
            <p className="text-2xl font-bold text-foreground">Early</p>
            <p className="text-xs text-muted-foreground">access opening soon</p>
          </div>
        </div>
      </div>

      {/* Right: wallet connect + join flow */}
      <div className="rounded-2xl border border-border bg-card/50 p-5 shadow-sm backdrop-blur-sm">
        <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Join the waitlist
        </p>
        <WalletWaitlistPanel referredByCode={referredByCode} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd syzy-fe && pnpm tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

- [ ] **Step 3: Start dev server vu00e0 kiu1ec3m tra visual**

```bash
cd syzy-fe && pnpm dev
```

Mu1edf `http://localhost:3000/waitlist` vu00e0 kiu1ec3m tra:
- [ ] Pre-join: Left hiu1ec3n thu1ecb hu00e9ader + ReferralLoopCard + stats teaser, Right hiu1ec3n thu1ecb wallet connect
- [ ] Pre-join: Card bu00ean right cu00f3 trust signals (u2713 No email required, u2713 Referral link instantly, u2713 Any wallet)
- [ ] Pre-join: URL cu00f3 `?ref=xxx` u2192 referral notice xuu1ea5t hiu1ec7n
- [ ] Ku1ebft nu1ed1i vu00ed u2192 join button hiu1ec3n thu1ecb bu00ean right, left khu00f4ng u0111u1ed5i
- [ ] Sau khi join: Left u0111u1ed5i thu00e0nh "You're in! Climb Higher." + ReferralLoopCard + identity block
- [ ] Sau khi join: Right hiu1ec3n thu1ecb referral link u2192 stats 2-col u2192 stepper u2192 email form
- [ ] Mobile (< 1024px): 2 col stack thu00e0nh 1 col
- [ ] FAQ (WaitlistExplainer) vu1eabn hiu1ec3n thu1ecb phu00eda du01b0u1edbi

- [ ] **Step 4: Commit**

```bash
git add syzy-fe/features/waitlist/components/waitlist-phase-board.tsx
git commit -m "feat(waitlist): rebuild WaitlistPhaseBoard as Split Hero layout with pre/post-join states"
```

---

## Self-Review

**Spec coverage:**
- u2705 Header block moved into left column u2014 Task 4
- u2705 Split Hero layout (1.2fr / 1fr) u2014 Task 4
- u2705 Pre-join left: Badge + H1 + subtitle + ReferralLoopCard + stats teaser u2014 Task 4
- u2705 Pre-join right: WalletWaitlistPanel enriched with trust signals + referral notice u2014 Task 2
- u2705 Post-join left: Personalized greeting + ReferralLoopCard + identity block u2014 Task 4
- u2705 Post-join right: Status panel reordered (referral u2192 stats u2192 stepper u2192 email) u2014 Task 3
- u2705 FAQ (WaitlistExplainer) giu1eef nguyu00ean u2014 khu00f4ng u0111u1ee5ng u0111u1ebfn
- u2705 `ReferralLoopCard`, `ProgressStepper`, `WaitlistExplainer` khu00f4ng u0111u1ed5i

**Placeholder scan:** Khu00f4ng cu00f3 TBD/TODO. Stats teaser du00f9ng static "1,200+" u2014 u0111u00e3 nu00eau ru00f5 trong spec lu00e0 chu1ea5p nhu1eadn.

**Type consistency:**
- `showIdentity?: boolean` u0111u01b0u1ee3c u0111u1ecbnh nghu0129a Task 3 vu00e0 du00f9ng `showIdentity={false}` trong Task 4 u2014 khu1edbp
- `referredByCode?: string | null` prop cu1ee7a `WaitlistPhaseBoard` giu1eef nguyu00ean u2014 khu1edbp
- `address` tu1eeb `useReownWallet` trong `WaitlistPhaseBoard` u2014 cu00f9ng hook u0111u00e3 cu00f3 `connected` tru01b0u1edbc u0111u00f3
