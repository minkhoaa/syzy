---
sidebar_position: 1
title: Shielded Trading
---

# Shielded Trading

**Shielded Trading** is an optional privacy mode on Oyrade that uses Zero-Knowledge Proofs to hide your trade size and direction on-chain.

<figure>
  <img src="/privacy/shielded-predictions/shielded-trading-enabled.png" alt="Shielded Trading" />
  <figcaption>Privacy Mode enabled — ZK proofs hide your trade size and direction on-chain.</figcaption>
</figure>

## How to Enable Shielded Mode

On the Order Ticket, toggle the **Privacy Mode** switch to ON. When activated, you will see:

- The **SHIELDED** badge appears next to the toggle.
- The status changes to **"Zero Knowledge Proofs Active"**.
- The execution details show the **Shield Fee** applied to your trade.
- An info banner confirms **"Shielded Mode Active"** — ZK proofs hide your trade size and direction on-chain.
- The submit button changes to **"Shielded Buy"** or **"Shielded Sell"** to indicate your order will be processed privately.

## Shield Fee

When Privacy Mode is enabled, a small additional **Shield Fee** is applied on top of the standard trading fee. This fee supports the privacy infrastructure, including ZK proof generation and encrypted settlement processing.

The Shield Fee is displayed in the execution details before you confirm your order, so you always know the exact cost.

## What Changes in Shielded Mode

| | Public Mode | Shielded Mode |
|---|---|---|
| Trade size visible on-chain | Yes | No |
| Trade direction visible | Yes | No |
| ZK proof validation | No | Yes |
| Shield Fee | None | Applies |
| Submit button | Confirm Buy / Sell | Shielded Buy / Sell |

## Technology Stack

The privacy system is built on four layers that work together:

- **Solnado-based mixing pools** break the connection between your wallet and the funds used for your prediction. Your deposit enters a shared pool containing deposits from many users, making it impractical to trace which funds belong to whom.

- **SPL Token-2022 confidential transfers** hide transfer amounts on-chain, so even if someone is watching the blockchain, they cannot see how much was moved.

- **Jito bundles** prevent front-running by ensuring that your transaction is not visible to bots in the mempool before it is confirmed. This stops other participants from seeing and reacting to your prediction before it executes.

- **Ephemeral wallets** are one-time addresses generated specifically for placing and settling your shielded predictions. These wallets have no traceable connection to your main wallet.
