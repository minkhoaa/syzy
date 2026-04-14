---
sidebar_position: 1
title: Developer Overview
---

import ArchitectureDiagram from '@site/src/components/ArchitectureDiagram';

# Developer Overview

Oyrade is a prediction market protocol built on Solana. The system is composed of a single on-chain Anchor program that handles market creation, trading, liquidity provisioning, resolution, and payout claims. The frontend is a Next.js application that communicates with the program through Helius RPC and interacts with external oracle services for price data and resolution.

This section provides a technical reference for developers who want to understand how the protocol works under the hood, integrate with the smart contract, or build tooling on top of it.

## Architecture

<ArchitectureDiagram />

The diagram above illustrates the five layers of the Oyrade stack. The frontend application connects to the Solana blockchain through Helius RPC, which provides low-latency access to on-chain state and webhook notifications for real-time event streaming. The core prediction logic lives in a single Anchor program deployed on Solana, which manages market accounts, mints SPL outcome tokens, processes swaps through a constant product AMM, and handles resolution and payout distribution.

Oracle integrations feed external data into the resolution process. Switchboard V3 provides aggregated price feeds for crypto and market cap markets, while the UMA Optimistic Oracle handles resolution for custom events like elections, sports, and world events through its propose-and-challenge mechanism. The privacy layer uses Solnado-based mixing to break wallet-to-prediction linkage for users who enable Shielded Mode.

## Tech Stack

The on-chain program is written in Rust using the Anchor Framework and currently deployed on Solana Devnet. Each prediction market creates two SPL token mints - one for Yes outcome shares and one for No outcome shares - which are standard SPL tokens that can be held in any Solana wallet. Market state, user positions, and global configuration are stored in Program Derived Accounts (PDAs) using deterministic seeds.

The frontend is built with Next.js and TypeScript. Wallet connectivity is handled through Reown AppKit (WalletConnect v3), which supports Phantom, Solflare, and other Solana wallets through a unified interface. On-chain data is fetched directly from the Solana blockchain via Helius RPC, with additional indexing support from Helius webhooks for event-driven updates.

## Program Details

The prediction market program is a single Anchor program with 11 instructions covering the full market lifecycle. The program is currently deployed on Devnet at:

```
2iwZ1MZctVHXYXa5xN8QE2zZaah3hevS6JWT7TB81Ki9
```

The mainnet program address will be published once the audit process is complete. For more details, see the [Smart Contracts](/developers/smart-contracts) reference.

## Resources

The smart contract reference documents every instruction, account type, and PDA derivation path used by the protocol. The full IDL (Interface Definition Language) is available for client generation and is used by the frontend to construct and submit transactions.

- [Smart Contracts](/developers/smart-contracts) - Anchor program reference, account structures, and instruction details
- [API Reference](/developers/api-reference) - REST API status and availability
