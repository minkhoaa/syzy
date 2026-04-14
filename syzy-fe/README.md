# Oyrade - Solana Prediction Market

A decentralized prediction market platform built on Solana blockchain using constant product AMM (Automated Market Maker) for price discovery.

## Overview

Oyrade enables users to create and trade on binary outcome markets (YES/NO predictions). Each market has two tokens representing each outcome, and prices are determined by a bonding curve mechanism.

---

## How It Works

### Market Lifecycle

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Create Market  │ ──▶ │  Trading Phase  │ ──▶ │   Resolution    │ ──▶ │  Claim Payout   │
│   (Admin/User)  │     │  (Buy/Sell)     │     │   (Admin Only)  │     │   (Winners)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## Phase 1: Market Creation

### What Happens

1. **Token Generation**: Two SPL tokens are created:
   - YES token (e.g., `YES-BTC100K`)
   - NO token (e.g., `NO-BTC100K`)

2. **Initial Liquidity**: The market creator deposits **20 SOL** as initial liquidity:
   - 10 SOL goes to the YES token pool
   - 10 SOL goes to the NO token pool

3. **Token Supply**: 1 billion tokens of each type are minted and held in the global vault

4. **Mint Authority Revoked**: After minting, the mint authority is permanently revoked (no more tokens can ever be created)

### Initial State

| Pool | SOL Reserves | Token Reserves |
|------|-------------|----------------|
| YES  | 10 SOL      | 793,000,000 tokens |
| NO   | 10 SOL      | 793,000,000 tokens |

---

## Phase 2: Trading (Buy/Sell)

### Bonding Curve Mechanism

The market uses a **Constant Product AMM** formula:

```
k = SOL_reserves × Token_reserves
```

This `k` value remains constant during trades, which automatically adjusts prices based on supply and demand.

### Buying Tokens

When a user buys YES tokens with SOL:

1. SOL reserves increase
2. Token reserves decrease
3. Price increases (more SOL needed for next token)

**Formula:**
```
new_token_reserves = k / new_sol_reserves
tokens_received = current_token_reserves - new_token_reserves
```

### Selling Tokens

When a user sells YES tokens for SOL:

1. Token reserves increase
2. SOL reserves decrease
3. Price decreases

**Formula:**
```
new_sol_reserves = k / new_token_reserves
sol_received = current_sol_reserves - new_sol_reserves
```

### Fees

| Fee Type | Buy | Sell | Recipient |
|----------|-----|------|-----------|
| Platform Fee | 1% | 1% | Team Wallet |
| LP Fee | 0.5% | 0.5% | Stays in Pool |

The LP fee accumulates in the pool, slightly increasing the `k` value over time, benefiting all participants at resolution.

### Price Discovery

Token prices are determined by the ratio of reserves:

```
YES Token Price = SOL_reserves / Token_reserves
```

- If many people buy YES tokens → YES price goes up, NO price stays relatively stable
- Prices naturally converge to probability estimates (e.g., 0.70 SOL per YES = 70% probability)

---

## Phase 3: Resolution

### Admin-Only Action

Only the contract authority (admin) can resolve a market. This happens when:
- The predicted event has occurred
- The outcome is definitively known

### What Happens

1. Admin calls `resolution` with the winning outcome:
   - `0` = YES won
   - `1` = NO won

2. Market is marked as `is_completed = true`

3. `winning_outcome` is set permanently

4. Trading is disabled (no more swaps allowed)

---

## Phase 4: Claiming Winnings

### Who Can Claim

Only holders of the **winning token** can claim their share of the prize pool.

### Payout Calculation

```
Total Prize Pool = YES_SOL_reserves + NO_SOL_reserves

Winning Tokens in Circulation = Total_Supply - Vault_Reserves

User Payout = (User_Winning_Tokens / Winning_Tokens_in_Circulation) × Total_Prize_Pool
```

### Example

| Market State After Resolution | Value |
|-------------------------------|-------|
| YES SOL Reserves | 25 SOL |
| NO SOL Reserves | 5 SOL |
| Total Prize Pool | 30 SOL |
| YES Tokens in Circulation | 500,000,000 |
| User's YES Tokens | 50,000,000 |

**User's Payout:**
```
(50,000,000 / 500,000,000) × 30 SOL = 3 SOL
```

### Claiming Process

1. User calls `claimWinnings`
2. Contract verifies:
   - Market is resolved
   - User holds winning tokens
   - User hasn't already claimed
3. SOL is transferred from global vault to user
4. User's token balance is set to 0
5. `has_claimed` flag is set to prevent double-claiming

---

## Liquidity Mechanics

### Initial Liquidity (20 SOL)

The 20 SOL deposited by the market creator is **protocol-owned liquidity**. This liquidity:

- ✅ Enables trading from the start
- ✅ Provides price stability
- ✅ Cannot be withdrawn during trading
- ✅ Becomes part of the prize pool at resolution

### Can Initial Liquidity Be Withdrawn?

**No.** The initial 20 SOL cannot be recovered by the market creator. It is permanently committed to the market and distributed to winning token holders at resolution.

This design:
- Prevents market manipulation
- Ensures winners always have funds to claim
- Aligns creator incentives with market success

### LP Functions (Disabled)

The `add_liquidity` and `withdraw_liquidity` functions are intentionally disabled because:
- Adding only SOL would break the constant product `k`
- Would require complex token reserve adjustments
- Initial liquidity is sufficient for normal operation

---

## Security Features

1. **Mint Authority Revoked**: No new tokens can ever be created after market creation

2. **PDA-Based Treasury**: Global vault is a Program Derived Address, funds can only be moved by the program

3. **Double-Claim Prevention**: Users can only claim once per outcome

4. **Authority Checks**: Only admin can resolve markets

5. **Slippage Protection**: All swaps support minimum receive amounts

6. **Reserve Minimums**: 1% of initial reserves must remain (prevents complete drain)

---

## Program Accounts

| Account | Purpose |
|---------|---------|
| Config | Global settings, fees, authority |
| GlobalVault | Holds all SOL and tokens |
| Market | Individual market state |
| UserInfo | User's position per market |

---

## Deployment

- **Network**: Solana Devnet
- **Program ID**: `3kvzPaxzSCqWRChccWRrxANNgDCDt2NCmoazpxE9TGmX`
- **Initial Liquidity**: 20 SOL per market (10 SOL per pool)

---

## Technology Stack

- **Blockchain**: Solana
- **Smart Contract**: Anchor Framework (Rust)
- **Frontend**: Next.js, TypeScript
- **Wallet**: Reown AppKit (WalletConnect)

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Rust & Cargo (for contract development)
- Solana CLI
- Anchor CLI

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd oyrade

# Install frontend dependencies
pnpm install
```

### Build Contracts (Required)

The frontend imports the IDL (Interface Definition Language) from the contracts build output. You must build the contracts before running the frontend.

```bash
# Navigate to contracts folder
cd ../oyrade-contract

# Install contract dependencies
yarn install

# Build the Anchor program
anchor build
```

This generates:
- `oyrade-contract/target/idl/prediction_market.json` - Required by the frontend hook
- `oyrade-contract/target/types/prediction_market.ts` - TypeScript types

### Run Development Server

```bash
# From root directory
pnpm dev

# Open http://localhost:3000
```

### Environment Variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_REOWN_PROJECT_ID=your_reown_project_id
```

### Contract Deployment (Optional)

If you need to deploy your own contract:

```bash
cd ../oyrade-contract

# Configure Solana CLI for devnet
solana config set --url devnet

# Deploy
anchor deploy --provider.cluster devnet
```

After deployment, update the `PROGRAM_ID` in `lib/constants/programs.ts` with your new program ID.

---

## Summary

| Phase | Action | Who | SOL Flow |
|-------|--------|-----|----------|
| Create | Initialize market + deposit 20 SOL | Creator | Creator → Vault |
| Trade | Buy/Sell tokens | Anyone | User ↔ Vault |
| Resolve | Declare winner | Admin | None |
| Claim | Withdraw winnings | Winners | Vault → User |

The initial 20 SOL liquidity is a **sunk cost** for market creation - it enables trading and becomes the base prize pool that grows with trading fees and is distributed to winners.
