---
sidebar_position: 2
slug: /overview/architectural-overview
title: Architectural Overview
---

# Architectural Overview

Oyrade is structured as a modular, multi-layer protocol in which market logic, liquidity provisioning, privacy preservation, and settlement execution operate as interoperable yet logically separated components. This separation of concerns improves composability, auditability, and upgrade discipline while preserving confidentiality guarantees.

At a systems level, the protocol stack is decomposed into five coordinated layers.

## 1. Market Layer (Deterministic Prediction Engine)

The Market Layer defines the canonical state machine for market creation, trading, and settlement.

- Markets are instantiated with explicit parameters: outcome set, expiry timestamp, resolution criteria, and collateral specification.
- Exposure is represented as **Outcome Shares** that map to contingent payoff on discrete outcomes.
- Share price expresses **Implied Probability**, updated through trading flow rather than fixed odds.
- State transitions follow a deterministic lifecycle: Market Creation → Active Trading → Resolution Trigger → Settlement Finalization.

> You select a Bitcoin price market on Oyrade and buy **100 Outcome Shares** at a price of **$0.65** per share. The price reflects a 65% implied probability at that moment. Your total position size is **$65**.
>
> Once the order is confirmed, Oyrade records your 100 shares under the market's predefined rules.
>
> From that point forward, your payout conditions are fixed according to the protocol logic.

## 2. Liquidity Layer (AMM-Driven Liquidity Module)

The Liquidity Layer provides continuous pricing and execution through an Automated Market Maker.

- Orders route against pooled liquidity rather than relying on bilateral matching.
- Pricing adjusts algorithmically based on pool depth and inventory imbalance.
- Slippage is an explicit function of trade size relative to available liquidity.
- Liquidity remains continuously available across outcomes, supporting execution even in long-tail markets.

> *Example:* You submit an order to buy **100 Outcome Shares** at $0.65. The liquidity pool currently holds **50,000 total shares** across outcomes. Because your order represents a small percentage of the pool, the price impact is minimal. Oyrade executes your order instantly against pooled liquidity, without requiring another trader to take the opposite side.

## 3. Privacy Layer (Confidential Execution Framework)

The Privacy Layer reduces traceability between participant identity and market exposure while maintaining transaction correctness.

- **Shielded Trading** reduces public linkability of position intent.
- A **Zero-Knowledge Proof System** supports validity checks while limiting disclosed trade information.
- **Session-Based Wallet Abstraction** isolates trading activity from a primary wallet identity.

> You purchase 100 Outcome Shares on Oyrade and later sell 40 shares to reduce exposure. Instead of publicly linking both transactions directly to your primary wallet address, Oyrade processes each order through a session-based execution context.
>
> The zero-knowledge validation confirms transaction validity, while Shielded Trading limits visible trade metadata. Your activity is therefore not exposed as a fully traceable strategy tied to a single persistent address.

## 4. Resolution Layer (Oracle and Settlement Engine)

The Resolution Layer finalizes outcomes and enforces deterministic payout distribution.

- Each market references predefined resolution criteria and a resolution source.
- Upon resolution, winning Outcome Shares settle to the encoded payout value; losing shares expire.
- Settlement logic executes on-chain, ensuring irreversible and uniform state closure.

> You continue holding your remaining **60 Outcome Shares** until market expiry. If the outcome resolves in your favor, each share settles at **$1**.
>
> Your 60 shares convert into **$60**, regardless of how many other users participated. Oyrade processes settlement automatically according to fixed protocol rules, without discretionary adjustment.

## 5. Execution Layer (Solana Runtime Integration)

The Execution Layer leverages Solana's performance profile for cost-efficient and low-latency interactions.

- Fast confirmation supports responsive position entry and exit.
- Low transaction costs reduce economic friction for frequent updates.
- Parallelized execution supports concurrent market interactions.

> You initially buy 100 shares, later sell 40 shares, and finally adjust your position again before expiry. Each transaction on Solana carries a base fee of approximately **0.000005 SOL per signature**, which typically translates to roughly **$0.0005-$0.0015 per transaction** depending on SOL price conditions.
>
> Even after three separate position adjustments, your total network cost remains only a fraction of a cent relative to your $65 position size. Oyrade enables these repeated order updates without transaction fees becoming a limiting factor for active participation.

---

## System Flow Summary (Quick Reference)

For operational clarity, the end-to-end interaction flow can be summarized as follows:

1. **Market Initialization**: A market is deployed with predefined resolution parameters and collateral configuration.
2. **Position Entry**: A participant selects an outcome and acquires or disposes of Outcome Shares through the AMM.
3. **Confidential Validation**: Transaction integrity is verified via zero-knowledge mechanisms while minimizing public exposure.
4. **Active Market Phase**: Pricing dynamically adjusts based on liquidity shifts and participant activity.
5. **Resolution Trigger**: The oracle-confirmed outcome transitions the market into settlement state.
6. **On-Chain Settlement**: Winning shares are redeemable, and the market state is finalized.

