---
sidebar_position: 2
title: How Are Markets Resolved?
---

# How Are Markets Resolved?

Market resolution is the process of confirming the actual outcome of an event and distributing payouts to participants. Once a market resolves, trading stops and winning shares can be redeemed for $1.00 USDC each.

Oyrade uses decentralized oracles to determine outcomes, ensuring that no single party controls the result. The specific oracle used depends on the type of market.

Each market displays its resolution rules, including the start time, expiration, and the condition that determines the outcome.

<figure>
  <img src="/img/screenshots/market-resolution-rules.png" alt="Market Resolution Rules" />
  <figcaption>Each market displays its resolution rules, start time, and expiration details.</figcaption>
</figure>

## Switchboard V3 (Crypto and Price Markets)

For crypto price and market cap markets, resolution is fully automated through Switchboard V3. When a market reaches its expiry time, the oracle reports the final price based on aggregated data from more than 10 on-chain and off-chain sources. The median value is used to prevent manipulation from any single source.

To further protect against price manipulation near expiry, Oyrade uses a **Time-Weighted Average Price (TWAP)** over the final 5 minutes. This means the resolution price is the average over that window rather than a single data point, which prevents flash crashes or pumps from influencing the result.

Once the oracle provides the price, the smart contract automatically compares it against the market's threshold and settles the outcome. The entire process takes approximately 60 seconds after expiry.

## UMA Optimistic Oracle (Custom Events)

For markets that cannot be resolved by a price feed, such as elections, sports results, and real-world events, Oyrade uses the UMA Optimistic Oracle. This system works through a propose-and-challenge mechanism:

1. **Proposal** - After the market expires, anyone can propose the outcome by posting a bond (minimum approximately $100).
2. **Challenge Period** - The proposal remains open for 24 to 72 hours. During this window, anyone can review the proposed outcome.
3. **Dispute** - If someone believes the proposed outcome is wrong, they can post a counter-bond and dispute it.
4. **Voting** - If a dispute occurs, UMA token holders vote to determine the correct outcome.
5. **Settlement** - The winning side receives payouts. The incorrect proposer or disputer forfeits their bond to the other party.

In practice, the vast majority of proposals are correct and go unchallenged. The dispute mechanism exists as a safeguard that keeps proposers honest, since they risk losing their bond if they propose an incorrect outcome.

## Claiming Your Payout

After a market resolves, your payout depends on whether you used Shielded Mode:

**Public predictions** are settled automatically. The USDC payout is sent directly to your wallet without any action required.

**Shielded predictions** require you to manually claim your payout from the [Portfolio](https://oyrade.com/portfolio) page. This extra step ensures that the settlement process preserves your privacy.

## Edge Cases

In unusual situations, the following rules apply. If an oracle fails to report, the resolution falls back to a DAO multisig vote. If the outcome is ambiguous and cannot be clearly determined, the market is voided and all participants are refunded. If a token is delisted or rugged before resolution, the market resolves based on the last valid price before the event occurred. If the underlying event is cancelled entirely, the market is voided and refunds are issued.
