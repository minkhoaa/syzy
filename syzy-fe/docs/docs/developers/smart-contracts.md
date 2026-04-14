---
sidebar_position: 2
title: Smart Contracts
---

# Smart Contracts

Oyrade's prediction market logic is built on Solana using the Anchor Framework. The smart contracts are currently closed-source as the protocol is in active development. We plan to open-source the contracts and publish the full technical reference after our security audit process is complete.

## Program Address (Devnet)

The program is currently deployed on Solana Devnet:

```
2iwZ1MZctVHXYXa5xN8QE2zZaah3hevS6JWT7TB81Ki9
```

You can view the program on [Solscan Devnet](https://solscan.io/account/2iwZ1MZctVHXYXa5xN8QE2zZaah3hevS6JWT7TB81Ki9?cluster=devnet) or [Solana Explorer Devnet](https://explorer.solana.com/address/2iwZ1MZctVHXYXa5xN8QE2zZaah3hevS6JWT7TB81Ki9?cluster=devnet). The mainnet deployment address will be announced once the audit is finalized.

## Overview

The program is a single Anchor program that handles the full prediction market lifecycle - market creation, outcome token minting, trading, liquidity provisioning, resolution, and payout claims. Markets use a constant product AMM for price discovery, and each market mints two SPL tokens representing the Yes and No outcomes.

For integration inquiries or partnership access to the technical documentation, reach out to the team on [Discord](https://discord.gg/fB6zG5Ck5q).

<!--
INTERNAL REFERENCE - DO NOT PUBLISH

## Account Types

The program uses three core account types, each derived as a Program Derived Account (PDA) from deterministic seeds.

### Config

The global configuration account stores protocol-level settings that apply to all markets. It is derived from the seed `"config"` and there is only one per program deployment. This account holds the protocol authority, the team wallet address for fee collection, platform and LP fee rates for both buy and sell directions, token supply and decimal configuration, initial token reserve settings, and the minimum SOL liquidity threshold required for market creation.

The config account also supports a two-step authority transfer process through `pendingAuthority`, where a new admin must be nominated and then explicitly accept the role before the transfer takes effect. This prevents accidental loss of admin access.

### Market

Each prediction market is stored as an independent PDA derived from the seed `"market"` combined with the Yes token mint and No token mint addresses. This ensures every market has a unique, deterministic address that can be computed from its outcome tokens.

A market account tracks the state of both sides of the prediction. For each outcome (Yes and No), the account stores the token mint address, the initial token reserves, the current real token reserves, the current real SOL reserves, and the total token supply. The market also records its creator, whether it has been completed, and the winning outcome once resolved.

Markets support configurable timing through optional `startSlot` and `endingSlot` fields. When a start slot is set, trading does not begin until that slot is reached. When an ending slot is set, the market automatically closes when that slot passes.

The market account also maintains a list of liquidity providers (LPs) with their addresses and share amounts, along with a total LP amount for proportional reward distribution.

### UserInfo

A UserInfo account tracks an individual user's position within a specific market. It is derived from the seed `"userinfo"` combined with the user's wallet address and the market PDA. Each user has one UserInfo account per market they participate in.

This account stores the user's Yes token amount, No token amount, LP share amount (if they provided liquidity), and flags for whether the account is initialized, whether the user is an LP, and whether they have already claimed their Yes or No winnings after resolution.

## Instructions

The program exposes 11 instructions that cover the full market lifecycle.

### configure

Initializes the global configuration account with protocol parameters. This is called once during initial deployment to set the authority, team wallet, fee rates, token supply config, decimals, initial reserves, and minimum liquidity. Only the deployer can call this instruction, and it cannot be called again once the config is initialized.

### createMarket

Creates a new prediction market by deploying two SPL token mints (Yes and No), initializing the market PDA, and setting up the initial liquidity pool. The creator provides symbol and metadata URI for the Yes token, and optional start and end slots for the market's trading window. The instruction mints the initial token supply into the program's global vault, creating the reserves that back all future trading.

### mintNoToken

A companion instruction to `createMarket` that creates the No token mint with its own symbol and metadata URI. This is called immediately after `createMarket` to complete the market setup. The No token's metadata is stored on-chain through the Metaplex Token Metadata program.

### swap

The primary trading instruction. Users call `swap` to buy or sell outcome shares in a market. The instruction takes four parameters: the SOL amount, the direction (buy or sell, represented as a `u8`), the token type (Yes or No, represented as a `u8`), and a minimum receive amount for slippage protection.

When buying, the user sends SOL to the market's global vault and receives outcome tokens based on the constant product pricing formula. When selling, the user returns outcome tokens and receives SOL. A platform fee is deducted on each trade and sent to the team wallet. The instruction also emits a `tradeEvent` with full details of the trade including reserves, amounts, fees, and timestamp.

### addLiquidity

Allows users to provide liquidity to a market's pool. The LP deposits SOL, which is distributed across both sides of the market to deepen the reserves. In return, the LP receives a proportional share of the pool tracked through the market's LP registry. Liquidity providers earn a portion of trading fees proportional to their share.

### withdrawLiquidity

Allows liquidity providers to withdraw their share of the pool. The instruction calculates the LP's proportional claim on the market's reserves and returns the corresponding SOL amount, minus any applicable fees.

### resolution

Resolves a market by determining the winning outcome. This instruction can only be called by the protocol authority. It takes the user's Yes and No token amounts, the winning token type, and a completion flag. Once a market is marked as completed with a winning outcome, trading stops and users can claim their payouts.

### claimWinnings

Allows users to claim their payout after a market has resolved. The instruction checks whether the user holds winning outcome tokens and transfers the corresponding SOL from the global vault to their wallet. Each side (Yes and No) can only be claimed once per user, tracked by the `hasClaimedYes` and `hasClaimedNo` flags in the UserInfo account.

### nominateAuthority

Initiates a transfer of the protocol authority by setting a `pendingAuthority` on the config account. Only the current authority can call this instruction. The nominated address must then call `acceptAuthority` to complete the transfer.

### acceptAuthority

Completes the authority transfer by accepting the pending nomination. The signer must match the `pendingAuthority` stored in the config account. Once accepted, the signer becomes the new protocol authority.

## Pricing Model

The program uses a Constant Product Automated Market Maker (AMM) for price discovery. Each market maintains separate reserve pools for the Yes and No outcomes. The pricing follows the standard constant product formula where the product of the two reserves remains constant through trades:

k = yesReserves * noReserves

When a user buys Yes tokens, they deposit SOL which increases the Yes reserve, and receive tokens calculated so that the product k is preserved. This means larger trades move the price more, creating natural price discovery based on demand. The same mechanism applies to No tokens and to sell orders in reverse.

Slippage protection is built into the swap instruction through the minimumReceiveAmount parameter. If the calculated output falls below this threshold, the transaction reverts.

## PDA Seeds

All program accounts are derived using the following seeds:

- Config: ["config"] - Global singleton
- Market: ["market", yesTokenMint, noTokenMint] - One per market
- Global Vault: ["global"] - Program's SOL vault
- UserInfo: ["userinfo", userWallet, marketPDA] - One per user per market

## Events

The program emits five event types that can be consumed by off-chain indexers and frontends:

- createEvent - Emitted when a new market is created, includes both token mints, initial reserves, and timing configuration.
- tradeEvent - Emitted on every swap, includes the user, token addresses, SOL and token amounts, fees, direction, and updated reserves.
- completeEvent - Emitted when a market reaches completion, includes final reserve state and timestamp.
- withdrawEvent - Emitted when fees or liquidity are withdrawn, includes the authority, mint, vault, amounts, and timestamp.
- globalUpdateEvent - Emitted when global configuration is updated, includes the authority, reserve settings, supply, and decimals.

END INTERNAL REFERENCE
-->
