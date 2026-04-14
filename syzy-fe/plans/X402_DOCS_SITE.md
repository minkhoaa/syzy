# Oyrade X402 Docs Site — Implementation Plan

## Context

Oyrade has x402 APIs in the backend that let AI agents interact with prediction markets via HTTP 402 micropayments (create markets, place predictions, resolve, get privacy proofs). There's no public-facing documentation for these APIs. We need to create an investor/developer-facing docs site within `oyrade-fe/` that showcases the x402 capabilities — modeled after [x402.heyelsa.ai](https://x402.heyelsa.ai/) but with Oyrade branding.

**Scope**: Docs site only (no backend bug fixes). 4 pages: Landing, Docs, Examples, SDK.

---

## File Structure

All new files go under `oyrade-fe/`:

```
app/(x402)/
├── layout.tsx                    # Shared layout (X402Navbar + X402Footer)
├── x402/
│   ├── page.tsx                  # Landing page
│   ├── docs/
│   │   └── page.tsx              # API documentation
│   ├── examples/
│   │   └── page.tsx              # Code examples
│   └── sdk/
│       └── page.tsx              # SDK reference

components/x402/
├── x402-navbar.tsx               # X402-specific navbar (HOME, DOCS, EXAMPLES, SDK)
├── x402-footer.tsx               # Simplified footer for x402 pages
├── hero-section.tsx              # Landing hero with headline + code preview
├── use-case-card.tsx             # "How to Use" use case cards
├── step-card.tsx                 # Numbered getting-started steps
├── feature-metric.tsx            # Feature stat cards (4 metrics)
├── capability-group.tsx          # Capability group with endpoints table
├── pricing-table.tsx             # Full pricing table component
├── integration-tab.tsx           # HTTP API vs SDK integration tabs
├── endpoint-doc.tsx              # Single endpoint documentation block
├── code-block.tsx                # Syntax-highlighted code block with copy button
├── response-example.tsx          # Request/response JSON display
└── safety-card.tsx               # Safety feature card
```

**Total**: ~18 new files (4 pages + 1 layout + 13 components)

---

## Files to Modify

| File | Change |
|------|--------|
| `components/layout/landing-navbar.tsx` | Add "X402 API" link with `NEW` badge between "Blog" and "Docs" |
| `components/layout/landing-footer.tsx` | Add "X402 API" link under Platform section |

---

## Page-by-Page Breakdown

### Page 1: Landing (`/x402`) — ~350 lines

**Purpose**: Marketing page showing investors what the x402 APIs offer.

**Sections (top to bottom):**

1. **Hero Section**
   - Badge: "BUILT ON X402"
   - Headline: "Prediction Market APIs.\nPay per call."
   - Subtext: "On-chain prediction markets that charge per request in USDC. AI agents can create markets, trade, and resolve — no API keys, no accounts. Just pay and predict."
   - CTA buttons: "View Docs →" and "Try SDK →"
   - Code preview: curl example calling `/api/v1/markets/create` with `X-PAYMENT` header
   - Animated orbital graphic showing: CREATE, PREDICT, RESOLVE, PROOF (reuse Framer Motion patterns from landing page)

2. **How to Use (3 use cases)**
   - **AI Trading Agent**: "Let Claude or any AI agent predict on market outcomes autonomously." Cost: ~$0.15/trade
   - **Market Analytics Bot**: "Programmatically create and monitor prediction markets." Cost: ~$0.50/market
   - **Automated Resolution**: "Auto-resolve markets when oracle conditions are met." Cost: ~$0.05/resolution

3. **Getting Started (3 steps)**
   - Step 1: "Set up a wallet with USDC on Solana" (with wallet icon)
   - Step 2: "Install the SDK or use REST API directly" (with code icon)
   - Step 3: "Start calling endpoints — payment is built in" (with rocket icon)

4. **Feature Metrics (4 cards)**
   - "Privacy-First" — Ephemeral wallets, ZK proofs
   - "Sub-second" — Solana finality
   - "Pay per Call" — No subscriptions, no API keys
   - "6 Endpoints" — Full market lifecycle

5. **Core Capabilities (4 groups)**
   - **Market Creation**: `POST /markets/create` ($0.50) — Create on-chain prediction markets with oracle integration
   - **Trading**: `POST /markets/:id/predict` (dynamic) — Privacy-preserving predicting with commitment hashes
   - **Resolution**: `GET /markets/:id/resolve` ($0.05) — Oracle-based automatic resolution
   - **Privacy**: `GET /markets/:id/privacy-proof` ($0.10) — ZK Merkle inclusion proofs

6. **Integration Section (2 tabs)**
   - Tab 1: **REST API** — curl example, headers explanation, payment flow diagram
   - Tab 2: **TypeScript SDK** — `npm install @oyrade/sdk`, client setup, method call example

7. **Pricing Table**
   | Category | Endpoint | Method | Price |
   |----------|----------|--------|-------|
   | Market Creation | `/api/v1/markets/create` | POST | $0.50 |
   | Trading | `/api/v1/markets/:id/predict` | POST | ~$0.01 + SOL value |
   | Resolution | `/api/v1/markets/:id/resolve` | GET | $0.05 |
   | Privacy | `/api/v1/markets/:id/privacy-proof` | GET | $0.10 |
   | Info | `/api/health` | GET | Free |
   | Info | `/api/x402-info` | GET | Free |

8. **Safety Features (4 cards)**
   - Ephemeral keypairs (wallet never exposed)
   - Anti-timing analysis (random delays)
   - Amount bucketing (fixed SOL amounts for privacy)
   - Client-side commitment hashes

---

### Page 2: API Docs (`/x402/docs`) — ~500 lines

**Purpose**: Complete technical API documentation.

**Sections:**

1. **Quick Start**
   - Install SDK: `npm install @oyrade/sdk @x402/fetch @x402/svm`
   - Setup client code example (TypeScript)
   - First API call example (health check → create market)

2. **Payment Flow Explainer**
   - Step-by-step: Request → 402 Response → Pay USDC → Retry with payment header → Success
   - Diagram showing the x402 protocol flow
   - Headers: `PAYMENT-REQUIRED`, `PAYMENT-SIGNATURE`, `PAYMENT-RESPONSE`
   - Note about `@x402/fetch` handling this automatically

3. **Endpoint Documentation (6 endpoints, each with):**
   - Method badge + path
   - Description
   - Price badge
   - Request parameters (table with name, type, required, description)
   - Request body example (JSON)
   - Response example (JSON) — success case
   - Response example (JSON) — error/alternative case
   - Notes/warnings

   **Endpoints documented:**
   - `POST /api/v1/markets/create` — Full DTO fields, response with market_id + token mints
   - `POST /api/v1/markets/:id/predict` — Outcome, amount buckets, commitment hash, executed vs queued responses
   - `GET /api/v1/markets/:id/resolve` — Resolved vs not-ready responses, oracle info
   - `GET /api/v1/markets/:id/privacy-proof` — Query params, Merkle proof response
   - `GET /api/health` — Health response fields
   - `GET /api/x402-info` — Endpoint catalog

4. **Error Handling**
   - Standard error format: `{ success: false, error: "message" }`
   - HTTP status codes: 200 (success), 400 (bad request), 402 (payment required), 404 (not found), 409 (conflict), 429 (rate limited)
   - Rate limits: 100 req/min per IP

5. **Environment & Network**
   - Network: Solana Devnet
   - Base URL: configurable
   - Payment token: USDC (Solana)
   - Facilitator: Coinbase CDP

---

### Page 3: Examples (`/x402/examples`) — ~400 lines

**Purpose**: Copy-paste working code examples.

**4 Examples:**

1. **Create Market & Place Prediction** — Full flow: create market → place prediction with commitment hash → check response
2. **Resolve Market via Oracle** — Wait for deadline → call resolve → handle resolved/not-ready
3. **Privacy Proof Verification** — Get Merkle proof → verify inclusion → display privacy-bucketed amount
4. **Full Demo Agent** — End-to-end agent script (adapted from `scripts/x402-demo-agent.ts`): health → discover → create → predict → resolve → proof

Each example includes:
- Title + description
- Full TypeScript code with syntax highlighting
- Copy button
- Expected output annotation

**Bottom section**: Link to GitHub for SDK + demo agent

---

### Page 4: SDK Reference (`/x402/sdk`) — ~300 lines

**Purpose**: TypeScript SDK documentation.

**Sections:**

1. **Installation**
   ```bash
   npm install @oyrade/sdk @x402/fetch @x402/svm
   ```

2. **Client Setup**
   - Constructor: `new OyradeX402Client(baseUrl, { signer })`
   - Signer setup with `@x402/svm`

3. **Method Reference** (table + examples for each):
   - `createMarket(params)` → `CreateMarketResult`
   - `placePrediction(marketId, params)` → `PlacePredictionResult`
   - `resolveMarket(marketId)` → `ResolveMarketResult`
   - `getPrivacyProof(marketId, commitmentHash)` → `PrivacyProofResult`
   - `getHealth()` → `HealthResult`
   - `getEndpointInfo()` → `EndpointInfoResult`

4. **TypeScript Types** — All request/response type definitions

5. **Error Handling** — Try/catch patterns, x402 payment errors vs API errors

---

## Shared Components

### X402Navbar (`components/x402/x402-navbar.tsx`)
- Fixed top, scroll-aware (same pattern as `LandingNavbar`)
- Left: Oyrade logo + "X402 API" text
- Center: HOME, DOCS, EXAMPLES, SDK links
- Right: ThemeToggle + "Launch App" button
- Active link highlighting based on pathname
- Uses `framer-motion` for scroll animation (reuse `useScroll` + `useMotionValueEvent` pattern)

### X402Footer (`components/x402/x402-footer.tsx`)
- Simplified version of `LandingFooter`
- Links: Docs, Examples, SDK, Main Site, Discord, Twitter
- Copyright

### CodeBlock (`components/x402/code-block.tsx`)
- Syntax highlighting via simple CSS classes (no heavy library — use `<pre><code>` with Tailwind prose styles)
- Copy-to-clipboard button (top-right)
- Language label tab (bash, typescript, json)
- Dark background with monospace font

### EndpointDoc (`components/x402/endpoint-doc.tsx`)
- Props: `{ method, path, price, description, params, requestExample, responseExample, notes }`
- Method badge (POST=blue, GET=green)
- Price badge
- Collapsible request/response sections
- Uses shadcn `Badge`, `Card`, `Tabs`

### PricingTable (`components/x402/pricing-table.tsx`)
- Full-width responsive table
- Category grouping with row spans
- Price column with color coding (free=green, paid=amber)
- Uses shadcn `Table` component

---

## Layout (`app/(x402)/layout.tsx`)

```tsx
// Wraps all /x402/* pages with X402Navbar + X402Footer
import { X402Navbar } from "@/components/x402/x402-navbar"
import { X402Footer } from "@/components/x402/x402-footer"

export default function X402Layout({ children }) {
  return (
    <>
      <X402Navbar />
      <main className="min-h-screen pt-20">{children}</main>
      <X402Footer />
    </>
  )
}
```

---

## Existing Code to Reuse

| What | From | Purpose |
|------|------|---------|
| `cn()` utility | `lib/utils.ts` | Tailwind class merging |
| `Badge` component | `components/ui/badge.tsx` | Method/price badges |
| `Button` component | `components/ui/button.tsx` | CTAs |
| `Card` | `components/ui/card.tsx` | Feature/capability cards |
| `Tabs` | `components/ui/tabs.tsx` | Integration tabs, code tabs |
| `Table` | `components/ui/table.tsx` | Pricing table |
| `Separator` | `components/ui/separator.tsx` | Section dividers |
| `ThemeToggle` | `components/ui/theme-toggle.tsx` | Dark/light mode |
| `framer-motion` scroll pattern | `components/layout/landing-navbar.tsx` | Scroll-aware navbar |
| Dark theme CSS vars | `app/globals.css` | Consistent theming |
| Lucide icons | Already installed | All icons |

---

## Navigation Integration

### LandingNavbar Change (`components/layout/landing-navbar.tsx`)
Add between "Blog" and "Docs" links:
```tsx
<Link href="/x402" className={cn(navLinkClass, isX402 && "text-primary font-semibold")}>
  <span className="flex items-center gap-1.5">
    X402 API
    <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">NEW</span>
  </span>
</Link>
```
Add `const isX402 = pathname.startsWith("/x402")` to the component.

### LandingFooter Change (`components/layout/landing-footer.tsx`)
Add "X402 API" link in the Platform section (after "Blog", before "Documentation").

---

## Styling Approach

- **All Tailwind v4** — no inline styles, use `cn()` for merging
- **Dark-first design** — matches existing Oyrade dark theme
- **Color accents**: Use existing `primary` (orange) + add emerald/cyan for x402 code blocks and badges
- **Typography**: `@tailwindcss/typography` for prose content in docs
- **Code blocks**: `bg-neutral-900 dark:bg-black` with `text-emerald-400` for syntax
- **Cards**: `bg-card border border-border` (existing pattern)
- **Animations**: Framer Motion `initial/animate` for page entry (fade-up), consistent with landing page

---

## Implementation Order

1. **Phase 1: Infrastructure**
   - Create `app/(x402)/layout.tsx`
   - Create `components/x402/x402-navbar.tsx`
   - Create `components/x402/x402-footer.tsx`
   - Create `components/x402/code-block.tsx`

2. **Phase 2: Landing Page**
   - Create `components/x402/hero-section.tsx`
   - Create `components/x402/use-case-card.tsx`
   - Create `components/x402/step-card.tsx`
   - Create `components/x402/feature-metric.tsx`
   - Create `components/x402/capability-group.tsx`
   - Create `components/x402/pricing-table.tsx`
   - Create `components/x402/integration-tab.tsx`
   - Create `components/x402/safety-card.tsx`
   - Create `app/(x402)/x402/page.tsx` (assembles all sections)

3. **Phase 3: Docs Page**
   - Create `components/x402/endpoint-doc.tsx`
   - Create `components/x402/response-example.tsx`
   - Create `app/(x402)/x402/docs/page.tsx`

4. **Phase 4: Examples + SDK Pages**
   - Create `app/(x402)/x402/examples/page.tsx`
   - Create `app/(x402)/x402/sdk/page.tsx`

5. **Phase 5: Navigation Integration**
   - Modify `components/layout/landing-navbar.tsx`
   - Modify `components/layout/landing-footer.tsx`

---

## Verification

1. **Dev server**: `cd oyrade-fe && pnpm dev` — verify no build errors
2. **Navigate to `/x402`** — Landing page renders with all sections
3. **Navigate to `/x402/docs`** — All 6 endpoints documented with examples
4. **Navigate to `/x402/examples`** — 4 code examples render correctly
5. **Navigate to `/x402/sdk`** — SDK docs render correctly
6. **Test navbar** — "X402 API" link appears with NEW badge, navigates correctly
7. **Test footer** — X402 API link present
8. **Test responsive** — All pages work on mobile (hamburger menu, stacked layout)
9. **Test dark/light mode** — Theme toggle works, code blocks readable in both
10. **Test navigation** — All internal links between x402 pages work
11. **Copy buttons** — Code block copy-to-clipboard works

---

## Backend Audit Notes (Deferred)

The following issues were found during audit but are **out of scope** for this plan:

| # | Severity | Issue |
|---|----------|-------|
| 1 | **CRITICAL** | Mixer pool gate permanently stuck: queued predictions not stored, pool size never grows |
| 2 | Medium | `token_mint` in CreateMarketDto is accepted but never used |
| 3 | Medium | `oracle_price` documented but never populated |
| 4 | Medium | ReplayProtectionGuard removed from source but exists in dist |
| 5 | Low | In-memory idempotency caches lost on restart, unbounded growth |
| 6 | Low | Dynamic pricing has no timeout for Jupiter API |
| 7 | Info | Queued prediction responses don't match Swagger schema |
