---
sidebar_position: 2
title: How Privacy Works
---

# How Privacy Works

Oyrade's privacy layer combines several cryptographic techniques to break the on-chain link between your public wallet and your prediction activity. This page explains the technology behind Shielded Mode and the guarantees it provides.

## Technology Stack

The privacy system is built on four layers that work together:

- **Solnado-based mixing pools** break the connection between your wallet and the funds used for your prediction. Your deposit enters a shared pool containing deposits from many users, making it impractical to trace which funds belong to whom.

- **SPL Token-2022 confidential transfers** hide transfer amounts on-chain, so even if someone is watching the blockchain, they cannot see how much was moved.

- **Jito bundles** prevent front-running by ensuring that your transaction is not visible to bots in the mempool before it is confirmed. This stops other participants from seeing and reacting to your prediction before it executes.

- **Ephemeral wallets** are one-time addresses generated specifically for placing and settling your shielded predictions. These wallets have no traceable connection to your main wallet.

## The Privacy Flow

When you place a shielded prediction, your transaction passes through three stages.

First, your funds are sent from your wallet into a shared mixing pool. This pool contains deposits from many users, which breaks the on-chain link between your wallet and the funds that will be used for the prediction.

Second, an ephemeral (one-time) wallet is generated to place the prediction on your behalf. This wallet has no connection to your main wallet. Your position is stored in an encrypted state that only you can decrypt using your private key.

Third, when you claim your winnings after the market resolves, the payout flows back through the mixing pool before reaching your wallet. The timing of the withdrawal is randomized to further reduce the ability to correlate deposits and withdrawals.

## What Is Public vs. Private

Even with Shielded Mode enabled, certain aggregate data remains visible on-chain. The existence of the market, the total trading volume across all participants, and the global settlement state after resolution are all public. What is hidden is your individual position size, entry price, wallet identity, and win/loss outcome.

## Security Considerations

The strength of Oyrade's privacy depends on several factors. The **privacy set size** is the number of users actively using Shielded Mode. More users means a larger pool of activity to blend into, which makes it harder to isolate any individual. The **mixing pool depth** also matters, as deeper pools with more funds make tracing more difficult. Finally, **randomized time delays** on withdrawals reduce the ability to correlate the timing of deposits and payouts.

:::warning Early Stage Notice
Privacy improves as adoption grows. During early stages, the privacy set is smaller, which provides a lower degree of protection compared to a mature network with many active shielded users.
:::
