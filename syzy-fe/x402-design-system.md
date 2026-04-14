# Oyrade X402 Design System
**Version 1.0 | Inspired by Apple Human Interface Guidelines**

## Brand Attributes
*   **Product Name:** Oyrade X402 API
*   **Personality:** Professional, Minimalist, Cyber-Terminal, High-Precision
*   **Primary Emotion:** Trust, Efficiency, Clarity
*   **Target Audience:** Web3 Developers, System Architects, AI Agents

---

## 1. FOUNDATIONS

### Color System
*High-contrast, developer-first palettes heavily optimized for legibility.*

**Primary Palette (Dark Mode Default):**
*   **Background (Canvas):** `#000000` (RGB: 0, 0, 0 | HSL: 0, 0%, 0%) - AAA Accessibility
*   **Surface (Cards/Modals):** `#09090B` (RGB: 9, 9, 11 | HSL: 240, 10%, 4%)
*   **Primary Text:** `#FFFFFF` (RGB: 255, 255, 255 | HSL: 0, 0%, 100%)
*   **Secondary Text:** `#A1A1AA` (RGB: 161, 161, 170 | HSL: 240, 5%, 53%)
*   **Accent (Interactive/Brand):** `#10B981` (Emerald Green - Hex: #10B981)

**Semantic Colors:**
*   **Success:** `#10B981` (Emerald) - Confirmations, successful resolutions.
*   **Warning:** `#F59E0B` (Amber) - Rate limits, pending statuses.
*   **Error:** `#EF4444` (Red) - Destructive actions, failed requests.
*   **Info:** `#3B82F6` (Blue) - System feedback, documentation highlights.

**Light Mode Equivalents:**
*   **Background:** `#FAFAFA`
*   **Surface:** `#FFFFFF`
*   **Primary Text:** `#09090B`
*   **Secondary Text:** `#71717A`
*   **Borders:** `#E4E4E7`

### Typography
*Font Family: **Geist Sans** (Primary UI) and **Geist Mono** (Code & Metrics).*

**Type Scale (Desktop / Tablet / Mobile):**
*   **Display:** 72px / 56px / 48px | Line Height: 1.1 | Tracking: -0.02em | Weight: Bold (700)
*   **Title:** 48px / 40px / 32px | Line Height: 1.2 | Tracking: -0.01em | Weight: Bold (700)
*   **Headline:** 32px / 28px / 24px | Line Height: 1.3 | Tracking: 0 | Weight: SemiBold (600)
*   **Body:** 16px / 16px / 16px | Line Height: 1.5 | Tracking: 0 | Weight: Regular (400)
*   **Callout:** 14px / 14px / 14px | Line Height: 1.5 | Tracking: 0 | Weight: Medium (500)
*   **Caption (Mono):** 11px / 11px / 11px | Line Height: 1.2 | Tracking: 0.05em | Weight: Medium (500)

### Layout Grid
*   **Desktop (1440px+):** 12 Columns, 24px Gutter, 80px Margins
*   **Tablet (768px+):** 8 Columns, 16px Gutter, 40px Margins
*   **Mobile (375px+):** 4 Columns, 16px Gutter, 24px Margins

### Spacing System
*Base unit: 8px scale.*
*   `4px` (0.5x): Component internals (icon to text).
*   `8px` (1x): Tight list items.
*   `16px` (2x): Standard padding for buttons, small cards.
*   `24px` (3x): Standard padding for content blocks.
*   `32px` (4x): Section gaps.
*   `64px` (8x): Major section vertical rhythm.
*   `128px` (16x): Hero section padding.

---

## 2. COMPONENTS

### Input
**Buttons:**
*   **Primary:** Solid Emerald `#10B981`, White text. Hover: `#059669`. Used for primary call-to-action.
*   **Secondary:** Transparent with `border-white/10` and `text-white`. Hover: `bg-white/5`.
*   **Code-ready specifications:** Padding `px-4 py-2`, Border-radius `rounded-md` (or `rounded-none` for brutalist), font medium.

**Text Fields:**
*   *Anatomy:* Label (Mono) + Input Container + Optional Hint.
*   *States:* Default (`border-zinc-800`), Focus (`ring-2 ring-emerald-500`), Error (`border-red-500`).

### Data Display
**Terminal Cards (Core x402 Component):**
*   *Anatomy:* Outline border (`border-black/10 dark:border-white/10`), optional corner accents (`w-3 h-3` corner outlines), mono label (`[01]`), Title, Description.
*   *Padding:* `p-6` or `p-8`.
*   *Hover State:* Outline border intensifies, mono label text changes color.

**Tables / API Rows:**
*   *Anatomy:* Header row (Mono text) + Data rows. Bottom borders separating rows (`border-black/10 dark:border-white/10`).
*   *Hover:* Extremely subtle background highlight (`hover:bg-black/[0.02] dark:hover:bg-white/[0.02]`).

### Feedback
**Loaders / Skeletons:**
*   Monospace text pulse: `[LOADING...]` instead of circular spinners to match the terminal aesthetic.

---

## 3. PATTERNS

**Landing Page Template (x402):**
*   **Hero:** Massive Display font, short highly technical blurb, primary CTA (Documentation), secondary CTA (SDK).
*   **Features Grid:** 3 or 4-column balanced grid of Terminal Cards.
*   **Core Capabilities (Integration):** Split layout; text/explanation on the left, executable code block on the right.
*   **Pricing:** Dense, data-heavy tabular layout emphasizing pure transparency.

**Empty States:**
*   Use raw monospace text formatting: `> No active positions found.`

---

## 4. TOKENS (Sample JSON Structure)
\`\`\`json
{
  "colors": {
    "background": {
      "light": "#FAFAFA",
      "dark": "#000000",
      "surfaceDark": "#09090B"
    },
    "text": {
      "primary": "#FFFFFF",
      "secondary": "#A1A1AA",
      "mono": "#71717A"
    }
  },
  "spacing": {
    "1": "4px",
    "2": "8px",
    "3": "12px",
    "4": "16px",
    "8": "32px",
    "16": "64px"
  }
}
\`\`\`

---

## 5. DOCUMENTATION

### Design Principles (Apple HIG + x402)
1.  **Clarity First, Aesthetic Second:** Function dictates form. API documentation and code samples must be immediately legible. 
2.  **Rhythmic Consistency:** Use the 8px grid religiously. Margins between code blocks and text should be mathematically predictable.
3.  **Terminal Brutalism:** Avoid deep drop shadows. Rely on sharp borders, bright accents, and typographic hierarchy to delineate space.

### Do's and Don'ts
*   **DO:** Use `font-mono` exclusively for data, code, IDs, and numeric metrics.
*   **DON'T:** Use `font-mono` for long-form explanatory body text.
*   **DO:** Ensure a minimum 4.5:1 contrast ratio for all secondary text.
*   **DON'T:** Use colorful backgrounds for cards; stick to black/white/zinc and use colored borders or icons for emphasis.
*   **DO:** Attach a persistent "Copy" action to all code snippets.
*   **DON'T:** Hide essential API flow steps behind tooltips or modals. Allow users to scroll linearly through the setup.
