# Oyrade Technical Implementation Specification

**Version**: 1.0  
**Last Updated**: 2026-02-07  
**Target Audience**: Backend & Smart Contract Engineers

---

## 1. Executive Summary

Oyrade is a **privacy-first prediction market protocol** on Solana. This document provides the technical specifications required to implement the core platform systems:

1. **Smart Contracts** - Anchor programs for trading, resolution, and privacy
2. **Privacy Layer** - Mixer pools, ephemeral wallets, Token-2022 confidential transfers
3. **Oracle Integration** - Switchboard V3 for prices, UMA Optimistic for custom events
4. **Token Mechanics** - $OYRADE staking, revenue share, tier system, veOYRADE governance
5. **API/SDK** - REST endpoints, WebSocket streams, TypeScript SDK

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              OYRADE PLATFORM                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   Frontend  │───▶│   API/SDK   │───▶│  Programs   │───▶│   Oracles   │  │
│  │   (React)   │    │  (REST/WS)  │    │  (Anchor)   │    │ (SB3/UMA)   │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
│                                              │                              │
│                                              ▼                              │
│                     ┌─────────────────────────────────────────┐            │
│                     │         PRIVACY LAYER                   │            │
│                     │  • Solnado Mixer Pools                  │            │
│                     │  • Token-2022 Confidential Transfers    │            │
│                     │  • Ephemeral Wallet Generation          │            │
│                     └─────────────────────────────────────────┘            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Smart Contracts (Anchor Programs)

### 3.1 Program Overview

| Program | Program ID | Purpose |
|---------|------------|---------|
| `oyrade_markets` | `OYRD...` (TBA) | Market creation, trading, share minting |
| `oyrade_resolver` | `RSLV...` (TBA) | Oracle bridging, market resolution |
| `oyrade_privacy` | `PRIV...` (TBA) | ZK proofs, shielded accounts, mixer interaction |

### 3.2 Core Accounts

#### 3.2.1 Market Account

```rust
#[account]
pub struct Market {
    pub authority: Pubkey,           // Creator (DAO or whitelisted)
    pub question: String,            // IPFS hash or text (max 256 chars)
    pub expiry: i64,                 // Unix timestamp
    pub resolved: bool,              // Has oracle resolved?
    pub outcome: Option<bool>,       // YES (true) or NO (false)
    pub collateral_vault: Pubkey,    // USDC vault address
    pub total_yes: u64,              // Total YES shares minted
    pub total_no: u64,               // Total NO shares minted
    pub liquidity_param: u64,        // LMSR 'b' parameter
    pub fee_bps: u16,                // Fee in basis points (default: 20 = 0.2%)
    pub oracle_type: OracleType,     // Switchboard or UMA
    pub oracle_feed: Pubkey,         // Oracle data feed address
}
```

**PDA Derivation**:
```rust
seeds = [b"market", authority.key().as_ref(), question_hash.as_ref()]
```

#### 3.2.2 Position Account

```rust
#[account]
pub struct Position {
    pub owner: Pubkey,               // User's wallet
    pub market: Pubkey,              // Associated market
    pub yes_shares: u64,             // YES outcome shares
    pub no_shares: u64,              // NO outcome shares
    pub is_shielded: bool,           // Privacy flag
    pub ephemeral_wallet: Option<Pubkey>, // For shielded positions
    pub claimed: bool,               // Settlement claimed?
}
```

**PDA Derivation**:
```rust
seeds = [b"position", market.key().as_ref(), owner.key().as_ref()]
```

### 3.3 Core Instructions

#### 3.3.1 `create_market`

Creates a new prediction market.

```rust
pub fn create_market(
    ctx: Context<CreateMarket>,
    question: String,
    expiry: i64,
    liquidity_param: u64,
    oracle_type: OracleType,
    oracle_feed: Pubkey,
) -> Result<()>
```

**Access Control**: DAO multisig or whitelisted creators only.

#### 3.3.2 `place_prediction`

Swaps USDC for outcome shares.

```rust
pub fn place_prediction(
    ctx: Context<PlacePrediction>,
    amount: u64,          // USDC amount (6 decimals)
    side: Side,           // Side::Yes or Side::No
    shielded: bool,       // Enable privacy?
) -> Result<()>
```

**Logic Flow**:
1. Transfer USDC from user to `collateral_vault`
2. Calculate shares using LMSR cost function
3. Mint YES or NO SPL tokens to user
4. If `shielded=true`, route through privacy layer

#### 3.3.3 `resolve_market`

Finalizes market outcome based on oracle data.

```rust
pub fn resolve_market(
    ctx: Context<ResolveMarket>,
    outcome: bool,
) -> Result<()>
```

**Access Control**: Only callable by `oyrade_resolver` program with valid oracle signature.

#### 3.3.4 `claim_winnings`

Redeems winning shares for USDC.

```rust
pub fn claim_winnings(
    ctx: Context<ClaimWinnings>,
) -> Result<()>
```

**Logic**:
- Winning shares → $1.00 USDC per share
- Losing shares → $0.00
- Burns position shares, transfers USDC from vault

### 3.4 Pricing Mechanism (LMSR)

**Logarithmic Market Scoring Rule** for automated market making.

**Cost Function**:
```
C(q_yes, q_no) = b * ln(e^(q_yes/b) + e^(q_no/b))
```

**Price Calculation**:
```
P(yes) = e^(q_yes/b) / (e^(q_yes/b) + e^(q_no/b))
P(no) = 1 - P(yes)
```

**Implementation**:
```rust
pub fn calculate_cost(
    current_yes: u64,
    current_no: u64,
    new_yes: u64,
    new_no: u64,
    b: u64,
) -> u64 {
    let cost_before = lmsr_cost(current_yes, current_no, b);
    let cost_after = lmsr_cost(new_yes, new_no, b);
    cost_after - cost_before
}
```

---

## 4. Privacy Layer

### 4.1 Architecture

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ User Wallet  │───▶│ Mixer Pool   │───▶│  Ephemeral   │
│   (Source)   │    │  (Solnado)   │    │   Wallet     │
└──────────────┘    └──────────────┘    └──────────────┘
                           │                    │
                           ▼                    ▼
                    Break Wallet Link    Place Prediction
                                               │
                                               ▼
                    ┌──────────────┐    ┌──────────────┐
                    │ Mixer Pool   │◀───│  Settlement  │
                    │  (Return)    │    │   (Claim)    │
                    └──────────────┘    └──────────────┘
```

### 4.2 Components

#### 4.2.1 Solnado Mixer Pools

- **Purpose**: Break on-chain wallet linkage
- **Mechanism**: Fixed denomination deposits into shared pool
- **Pool Sizes**: 100 USDC, 1,000 USDC, 10,000 USDC
- **Privacy Set**: Grows with more depositors

**Implementation Requirements**:
- Merkle tree for deposit tracking
- Nullifier set for double-spend prevention
- ZK proof verification for withdrawals

#### 4.2.2 Ephemeral Wallets

- **Purpose**: One-time addresses for predictions
- **Generation**: Derived from user's main wallet + nonce
- **Lifecycle**: Created per prediction, destroyed after claim

```rust
pub fn derive_ephemeral_wallet(
    user: Pubkey,
    nonce: u64,
) -> Pubkey {
    // PDA derivation
    find_program_address(
        &[b"ephemeral", user.as_ref(), &nonce.to_le_bytes()],
        &PRIVACY_PROGRAM_ID,
    )
}
```

#### 4.2.3 Token-2022 Confidential Transfers

- **Purpose**: Hide transfer amounts on-chain
- **Standard**: SPL Token-2022 Confidential Transfer extension
- **Encryption**: ElGamal encryption for balances

**Implementation**:
- Use `ConfigureAccount` for confidential balance
- Use `ApplyPendingBalance` after deposits
- Use `WithdrawWithheldTokensFromAccounts` for claims

### 4.3 Privacy Tiers

| Tier | Privacy Features |
|------|-----------------|
| **Basic** (Holder) | 1-hop mixing |
| **Advanced** (Staker) | 3-hop mixing + Token-2022 |
| **Maximum** (Locked) | 5-hop + MEV protection + dedicated pool |
| **Custom** (Whale) | Private mixer pool |

### 4.4 Privacy Guarantees

| Hidden | Public |
|--------|--------|
| Position size | Market existence |
| Entry price | Total volume |
| Wallet identity | Global settlement state |
| Win/loss outcome | — |

---

## 5. Oracle Integration

### 5.1 Switchboard V3 (Financial Markets)

**Use Cases**: Crypto prices, market caps, pump.fun data

**Integration**:
```rust
use switchboard_on_demand::prelude::*;

pub fn get_price(
    ctx: Context<GetPrice>,
) -> Result<f64> {
    let feed = ctx.accounts.oracle_feed.load()?;
    let result = feed.get_value(
        &ctx.accounts.switchboard_state,
        &Clock::get()?,
        10_000, // max staleness (ms)
    )?;
    Ok(result.mantissa as f64 / 10f64.powi(result.scale as i32))
}
```

**Configuration**:
- Data sources: 10+ aggregated (Raydium, Orca, Birdeye, Jupiter)
- Update frequency: ~60 seconds
- Max staleness: 10 seconds

### 5.2 UMA Optimistic Oracle (Custom Events)

**Use Cases**: Politics, sports, arbitrary events

**Flow**:
1. Market expires → Resolver proposes outcome
2. Challenge period: 24-72 hours
3. Disputes → UMA token holder vote
4. Resolution → Winner gets bond, market resolves

**Integration**:
```rust
pub fn propose_resolution(
    ctx: Context<ProposeResolution>,
    outcome: bool,
    bond_amount: u64,  // Min $100 equivalent
) -> Result<()>

pub fn dispute_resolution(
    ctx: Context<DisputeResolution>,
    counter_outcome: bool,
    bond_amount: u64,
) -> Result<()>

pub fn finalize_resolution(
    ctx: Context<FinalizeResolution>,
) -> Result<()>  // After challenge period
```

### 5.3 Oracle Selection Matrix

| Market Type | Oracle | Resolution Time |
|-------------|--------|-----------------|
| Crypto prices | Switchboard V3 | ~60 seconds |
| Pump.fun MC | Switchboard + Helius | ~60 seconds |
| Custom events | UMA Optimistic | 24-72 hours |
| Emergency | DAO multisig | Manual |

---

## 6. $OYRADE Token Mechanics

### 6.1 Token Specification

```
Name: OYRADE
Symbol: $OYRADE
Total Supply: 1,000,000,000
Decimals: 9
Chain: Solana (SPL Token)
```

### 6.2 Staking Program

#### 6.2.1 Staking Account

```rust
#[account]
pub struct StakeAccount {
    pub owner: Pubkey,
    pub amount: u64,              // Staked $OYRADE
    pub stake_time: i64,          // When staked
    pub rewards_claimed: u64,     // Total claimed
    pub last_claim: i64,          // Last claim timestamp
}
```

#### 6.2.2 Staking Instructions

```rust
pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()>
pub fn unstake(ctx: Context<Unstake>, amount: u64) -> Result<()>
pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()>
```

**Reward Calculation**:
```rust
fn calculate_rewards(stake: &StakeAccount, current_time: i64) -> u64 {
    let duration = current_time - stake.last_claim;
    let daily_rate = STAKING_APY / 365;
    (stake.amount * daily_rate * duration) / (86400 * 10000)
}
```

### 6.3 veOYRADE (Vote-Escrowed)

**Governance locking mechanism** (similar to veCRV).

```rust
#[account]
pub struct VeLock {
    pub owner: Pubkey,
    pub amount: u64,              // Locked $OYRADE
    pub unlock_time: i64,         // When unlockable
    pub voting_power: u64,        // Decays over time
}
```

**Voting Power Formula**:
```
voting_power = locked_amount * (time_remaining / max_lock_time)
```

**Max Lock**: 4 years = maximum voting power

### 6.4 Fee Distribution

**Protocol Revenue Split**:
- 30% → Stakers (USDC weekly)
- 20% → DAO Treasury
- 50% → Operations/Development

**Distribution Logic**:
```rust
pub fn distribute_fees(ctx: Context<DistributeFees>) -> Result<()> {
    let total_fees = ctx.accounts.fee_vault.amount;
    let staker_share = total_fees * 30 / 100;
    
    // Distribute pro-rata to stakers
    for staker in &ctx.accounts.stakers {
        let share = staker_share * staker.amount / total_staked;
        transfer_usdc(staker.owner, share)?;
    }
}
```

### 6.5 Tier System Implementation

```rust
pub fn get_user_tier(
    wallet: Pubkey,
    held: u64,
    staked: u64,
    ve_locked: u64,
) -> Tier {
    let total = held + staked + ve_locked;
    
    match total {
        t if t >= 10_000_000_000_000_000 => Tier::Whale,    // 10M+
        t if t >= 1_000_000_000_000_000 => Tier::Locked,   // 1M+
        t if t >= 100_000_000_000_000 => Tier::Staker,     // 100K+
        t if t >= 10_000_000_000_000 => Tier::Holder,      // 10K+
        _ => Tier::None,
    }
}
```

**Tier Benefits Matrix**:

| Tier | Fee Discount | Privacy Hops | Staking APY | Revenue Share |
|------|--------------|--------------|-------------|---------------|
| Holder | 20% | 1 | — | — |
| Staker | 40% | 3 | 15% | — |
| Locked | 60% | 5 | 25% (+ 2.5x) | — |
| Whale | 60% | Custom | 25% (+ 2.5x) | 30% |

---

## 7. API Specification

### 7.1 REST API

**Base URL**: `https://api.oyrade.com/v1`

#### 7.1.1 Markets

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/markets` | GET | List all markets |
| `/markets/:id` | GET | Single market details |
| `/markets/:id/orderbook` | GET | Current orderbook |
| `/markets/:id/history` | GET | Price history |

**Response Schema** (GET /markets):
```json
{
  "markets": [
    {
      "id": "CAM...xyz",
      "question": "Will SOL break $300?",
      "yesPrice": 0.32,
      "noPrice": 0.68,
      "volume24h": 450000,
      "expiry": 1709856000,
      "status": "active"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 50
  }
}
```

#### 7.1.2 Trading

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/quotes` | POST | No | Get execution quote |
| `/orders` | POST | Yes | Place order |
| `/positions` | GET | Yes | User's positions |

**Request Schema** (POST /orders):
```json
{
  "marketId": "CAM...xyz",
  "side": "yes",
  "amount": 100,
  "shielded": true
}
```

#### 7.1.3 Authentication

```bash
Authorization: Bearer <signed_message>
X-Wallet-Address: <solana_pubkey>
```

**Signed Message Format**:
```
Sign this message to authenticate with Oyrade API.
Timestamp: <unix_timestamp>
Nonce: <random_nonce>
```

### 7.2 WebSocket API

**Endpoint**: `wss://ws.oyrade.com`

#### 7.2.1 Subscribe

```json
{
  "type": "subscribe",
  "channel": "market_updates",
  "ids": ["CAM...xyz"]
}
```

#### 7.2.2 Events

**Price Update**:
```json
{
  "type": "price_update",
  "marketId": "CAM...xyz",
  "timestamp": 1709845200,
  "data": {
    "yes": 0.33,
    "no": 0.67,
    "volume": 125000
  }
}
```

**Trade**:
```json
{
  "type": "trade",
  "marketId": "CAM...xyz",
  "data": {
    "side": "yes",
    "size": 500,
    "price": 0.34
  }
}
```

### 7.3 Rate Limits

| Scope | Limit |
|-------|-------|
| Public IP | 100 req/min |
| Authenticated | 1,000 req/min |
| WebSocket | 50 msg/sec |

---

## 8. Development Environment

### 8.1 Prerequisites

```bash
# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.4/install)"

# Anchor
cargo install --git https://github.com/coral-xyz/anchor anchor-cli

# Node.js
nvm install 20
```

### 8.2 Project Setup

```bash
# Clone
git clone https://github.com/oyrade/oyrade-contracts
cd oyrade-contracts

# Install
yarn install

# Configure
solana config set --url devnet
solana-keygen new -o ~/.config/solana/devnet.json

# Build
anchor build

# Test
anchor test

# Deploy
anchor deploy --provider.cluster devnet
```

### 8.3 Local Testing

```bash
# Start local validator
solana-test-validator

# Run integration tests
yarn test:integration

# Run privacy tests
yarn test:privacy
```

---

## 9. Security Considerations

### 9.1 Smart Contract Security

- [ ] Formal verification of LMSR implementation
- [ ] Reentrancy guards on all state-changing instructions
- [ ] Access control via PDA authority
- [ ] Integer overflow protection (checked_math)
- [ ] Oracle staleness checks

### 9.2 Privacy Security

- [ ] Merkle tree depth ≥ 20 for mixer
- [ ] Nullifier uniqueness enforcement
- [ ] ZK circuit audit
- [ ] Front-running protection (Jito bundles)

### 9.3 Operational Security

- [ ] DAO multisig for admin functions
- [ ] Timelock on critical changes (48h)
- [ ] Emergency pause functionality
- [ ] Oracle fallback mechanisms

---

## 10. Deployment Checklist

### 10.1 Pre-Launch

- [ ] Smart contract audit (Trail of Bits or equivalent)
- [ ] Privacy layer audit (specialized ZK auditor)
- [ ] Oracle integration testing
- [ ] Load testing (1000+ TPS simulation)
- [ ] Bug bounty program launch

### 10.2 Mainnet Deployment

1. Deploy `oyrade_privacy` program
2. Deploy `oyrade_resolver` program
3. Deploy `oyrade_markets` program
4. Configure Switchboard feeds
5. Initialize DAO multisig
6. Create initial markets
7. Enable public trading

### 10.3 Monitoring

- Helius webhooks for transaction monitoring
- Grafana dashboards for protocol metrics
- PagerDuty for oracle failures
- Discord bot for large trades

---

## 11. References

- [Anchor Framework](https://www.anchor-lang.com/)
- [SPL Token-2022](https://spl.solana.com/token-2022)
- [Switchboard V3](https://docs.switchboard.xyz/)
- [UMA Optimistic Oracle](https://docs.umaproject.org/)
- [LMSR Paper](https://mason.gmu.edu/~rhanson/mktscore.pdf)
- [ve(3,3) Tokenomics](https://andrecronje.medium.com/)

---

**Document Owner**: Oyrade Core Team  
**Contact**: dev@oyrade.com
