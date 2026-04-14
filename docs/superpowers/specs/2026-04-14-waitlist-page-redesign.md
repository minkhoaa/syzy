# Waitlist Page Redesign

**Date:** 2026-04-14  
**Scope:** `syzy-fe/app/(landing)/waitlist/page.tsx` và các component trong `syzy-fe/features/waitlist/components/`

---

## Goal

Redesign trang `/waitlist` từ layout 2-col symmetric hiện tại sang Split Hero layout, enrich nội dung, và reorder các component trong status panel để tăng tính rõ ràng và conversion.

---

## Layout tổng thể

```
LandingNavbar
└── AuroraBackground
    └── Container (max-w-5xl)
        ├── WaitlistPhaseBoard  ← 2-col split, state-aware
        └── WaitlistExplainer  ← FAQ full-width, giữ nguyên
```

Header block (Badge + H1 + subtitle) **chuyển vào bên trong Left column** của `WaitlistPhaseBoard` thay vì nằm riêng phía trên trang. Điều này giúp CTA xuất hiện sớm hơn và trang compact hơn.

`page.tsx` không còn render header block riêng — toàn bộ nội dung nằm trong `WaitlistPhaseBoard`.

---

## Pre-join State (chưa join waitlist)

### Left column (1.2fr)

1. **Badge + H1 + Subtitle** (từ `page.tsx`, chuyển vào đây)
   - Badge: "Early Access"
   - H1: "Predict Invisible. Win Visible."
   - Subtitle: text hiện tại

2. **ReferralLoopCard** (giữ nguyên component, enriched display)
   - Giữ icon, title, 3 steps, social proof footer
   - Không thay đổi logic, chỉ đảm bảo visual nhất quán với layout mới

3. **Stats teaser** (component mới, 2-col grid)
   - Hiển thị tổng số người trên waitlist
   - "Early access opening soon"
   - Dữ liệu có thể static hoặc fetch từ backend tùy sau

### Right column (1fr)

**`WalletWaitlistPanel`** — enriched với:
- Wallet card hiện tại giữ nguyên structure
- Thêm trust signals bên trong card:
  - ✓ No email required to join
  - ✓ Referral link generated instantly  
  - ✓ Freighter, Albedo, or any Stellar wallet
- Khi có `referredByCode`: hiển thị referral notice (dashed border, "You were referred — joining gives your referrer a point")
- Connect button giữ nguyên

---

## Post-join State (đã join waitlist)

Khi `connected && !!member`, `WaitlistPhaseBoard` render layout khác.

### Left column (1.2fr) — Personalized

1. **Personalized greeting block**
   - Badge: "YOU'RE IN" (green)
   - H1: "Climb Higher. Share. Win."
   - Subtitle: "You're on the waitlist. Every referral pushes you up the queue."

2. **ReferralLoopCard** (component cũ, giữ nguyên)

3. **Identity block** (từ `WalletWaitlistStatus`, chuyển sang left)
   - Wallet address + "Verified" badge
   - Background: `bg-primary/10`, border: `border-primary/20`

### Right column (1fr) — Compact Status Panel

`WalletWaitlistStatus` được reorder theo thứ tự:

1. **Referral link** (ưu tiên growth)
   - Label "YOUR REFERRAL LINK"
   - Link display (monospace, truncated)
   - 3-col button row: `[Copy] [Share on X ↗]` (Copy 1fr, Share 2fr)

2. **Stats** (2-col grid)
   - Left: Queue rank `#N of total`
   - Right: Referrals count

3. **ProgressStepper** (component hiện tại, giữ nguyên)
   - Steps: Wallet → Email → Done

4. **Email attach / confirmed** (secondary action)
   - Khi chưa có email: form inline (input + Attach button)
   - Khi đã có email: green confirmation badge

**Bỏ khỏi right column:**
- Identity block (chuyển sang left)
- Share CTA button standalone ở cuối (share đã inline trong referral link section)
- `referredByCode` info block (chuyển vào left column, hiển thị nhỏ bên dưới identity block nếu có)

---

## Component Changes Summary

| Component | Thay đổi |
|---|---|
| `page.tsx` | Bỏ header block riêng; `WaitlistPhaseBoard` chiếm toàn bộ |
| `WaitlistPhaseBoard` | Thêm `hasJoined` state switching; 2 layout riêng biệt |
| `WalletWaitlistPanel` | Thêm trust signals; enrich referral notice |
| `WalletWaitlistStatus` | Reorder: referral → stats → stepper → email; move identity block ra left |
| `ReferralLoopCard` | Giữ nguyên, dùng ở cả 2 states trong left column |
| `WaitlistExplainer` | Giữ nguyên hoàn toàn |
| `ProgressStepper` | Giữ nguyên |
| Stats teaser | Component mới nhỏ trong pre-join left column |

---

## Files cần sửa

```
syzy-fe/app/(landing)/waitlist/page.tsx
syzy-fe/features/waitlist/components/waitlist-phase-board.tsx
syzy-fe/features/waitlist/components/wallet-waitlist-panel.tsx
syzy-fe/features/waitlist/components/wallet-waitlist-status.tsx
```

Files giữ nguyên:
```
syzy-fe/features/waitlist/components/waitlist-explainer.tsx
syzy-fe/features/waitlist/components/referral-loop-card.tsx
syzy-fe/features/waitlist/components/progress-stepper.tsx
```

---

## Non-goals

- Không thay đổi logic auth/join/email flow
- Không thay đổi backend API
- Không thay đổi WaitlistExplainer
- Không thêm animation mới (giữ các animation hiện tại)
- Stats teaser có thể dùng placeholder static nếu không có API sẵn
