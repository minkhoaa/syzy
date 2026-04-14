# Waitlist 3-Screen Sequential Flow

**Date:** 2026-04-14  
**Scope:** `syzy-fe/features/waitlist/components/` u2014 thu00eam 3-screen flow thay thu1ebf layout hiu1ec7n tu1ea1i

---

## Goal

Thay thu1ebf Split Hero layout bu1eb1ng 3-screen sequential wizard flow tu1eadp trung vu00e0o mu1ed9t hu00e0nh u0111u1ed9ng tu1ea1i mu1ed7i bu01b0u1edbc. Sau khi submit email, popup celebration xuu1ea5t hiu1ec7n vu1edbi referral link.

---

## Screens

### Screen 1 u2014 JOIN THE WAITLIST

**Trigger:** User chu01b0a ku1ebft nu1ed1i vu00ed (not connected)

**Layout:** Card cu0103n giu1eefa, single column

**Nu1ed9i dung:**
- Step indicator: `Connect u2192 Register u2192 Share` (step 1 active/primary, 2+3 inactive)
- H1: "JOIN THE WAITLIST"
- Subtitle: "Be the first to experience the new prediction era."
- Button primary: "Connect Now" (u2192 triggers wallet connect)
- Footer note: "Freighter u00b7 Albedo u00b7 Any Stellar-compatible wallet"

**After connect:** Nu1ebfu u0111u00e3 join (member trong store) u2192 nhu1ea3y thu1eas3ng Screen 3. Nu1ebfu chu01b0a join u2192 hiu1ec3n thu1ecb Join button inline (wallet address + "Join waitlist").

---

### Screen 2 u2014 ONE MORE STEP

**Trigger:** `connected && !!member && !hasEmail`

**Layout:** Card cu0103n giu1eefa, single column

**Nu1ed9i dung:**
- Step indicator: step 1 done (u2713 green), step 2 active, step 3 inactive
- H1: "ONE MORE STEP TO FINISH SETUP"
- Subtitle: "Weu2019ll notify you once our early access is ready."
- Email input + Submit button
- Footer note: "ud83dudd12 No spam. Weu2019ll email you once when we launch."
- Skip link: "Skip for now"

**After submit:** Gu1ecdi `attachEmail()` u2192 khi thu00e0nh cu00f4ng u2192 show Referral Popup (Variant A).

**After skip:** u0110i thu1eb3ng u0111u1ebfn Screen 3 (khu00f4ng show popup).

---

### Referral Popup (Variant A)

**Trigger:** Sau khi `attachEmail()` thu00e0nh cu00f4ng

**Layout:** Modal overlay (backdrop-blur + dark bg), card cu0103n giu1eefa

**Nu1ed9i dung:**
- Icon celebration ud83cudf89
- Title: "Youu2019re officially in!"
- Subtitle: "Your referral link is ready. Share it now to climb the queue."
- Referral link display (monospace, truncated)
- 2 buttons: `[Copy]` + `[Share on X u2197]`
- Dismiss link: "Maybe later u2192"

**After dismiss / copy / share:** u0110u00f3ng popup u2192 hiu1ec3n thu1ecb Screen 3.

---

### Screen 3 u2014 YOUu2019RE IN

**Trigger:** `connected && !!member && (hasEmail || skipped)`

**Layout:** Card cu0103n giu1eefa, single column

**Nu1ed9i dung:**
- Step indicator: cu1ea3 3 step u0111u1ec1u done (u2713 green)
- Badge/title: "YOUu2019RE IN ud83cudf89"
- Subtitle: "Your referral link is ready. Share it to climb the queue."
- Referral link display
- Button: "Copy Link"
- Stats: queue rank + referral count (compact, 2-col)
- Share on X button

---

## Step Indicator Component

Du00f9ng lu1ea1i `ProgressStepper` hiu1ec7n tu1ea1i vu1edbi layout ngang:
- Step 1: "Connect"
- Step 2: "Register"
- Step 3: "Share"

---

## State Machine

```
not connected
  u2192 [Screen 1]
  u2192 user clicks Connect Now u2192 wallet connect flow

connected, not joined
  u2192 [Screen 1 variant: join button visible]
  u2192 user clicks Join u2192 join flow (sign + register)

connected, joined, no email
  u2192 [Screen 2]
  u2192 user submits email u2192 [Popup] u2192 [Screen 3]
  u2192 user clicks Skip u2192 [Screen 3]

connected, joined, has email (or skipped)
  u2192 [Screen 3]
  u2192 popup has been shown u2192 khu00f4ng hiu1ec3n thu1ecb lu1ea1i
```

---

## Component Architecture

```
WaitlistPhaseBoard (controller)
  u251cu2500u2500 WaitlistStepIndicator  (new u2014 horizontal steps)
  u251cu2500u2500 WaitlistScreen1        (new u2014 connect/join)
  u251cu2500u2500 WaitlistScreen2        (new u2014 email)
  u251cu2500u2500 WaitlistReferralPopup  (new u2014 celebration modal)
  u2514u2500u2500 WaitlistScreen3        (new u2014 done + referral link)
```

Files cu0169 khu00f4ng su1eeda: `WalletWaitlistPanel`, `WalletWaitlistStatus`, `WaitlistExplainer`, `ProgressStepper`, `ReferralLoopCard`

**WaitlistPhaseBoard** giu1eef vai tru00f2 controller, chu1ec9 quyu1ebft u0111u1ecbnh render screen nu00e0o.

---

## Files cu1ea7n su1eeda / tu1ea1o

```
# Su1eeda
syzy-fe/features/waitlist/components/waitlist-phase-board.tsx

# Tu1ea1o mu1edbi
syzy-fe/features/waitlist/components/waitlist-screen1.tsx
syzy-fe/features/waitlist/components/waitlist-screen2.tsx
syzy-fe/features/waitlist/components/waitlist-screen3.tsx
syzy-fe/features/waitlist/components/waitlist-referral-popup.tsx
syzy-fe/features/waitlist/components/waitlist-step-indicator.tsx
```

---

## Non-goals

- Khu00f4ng thay u0111u1ed5i logic auth/join/email (du00f9ng lu1ea1i hooks hiu1ec7n tu1ea1i)
- Khu00f4ng thay u0111u1ed5i backend API
- Khu00f4ng thay u0111u1ed5i `WaitlistExplainer` (FAQ)
- Popup chu1ec9 hiu1ec3n thu1ecb 1 lu1ea7n sau email submit (khu00f4ng hiu1ec3n lu1ea1i khi refresh)
- FAQ vu1eabn nu1eb1m bu00ean du01b0u1edbi tou00e0n bu1ed9 flow
