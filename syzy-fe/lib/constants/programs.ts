import { PublicKey } from "@solana/web3.js";

// Program ID from IDL - use env or fallback to deployed devnet contract
export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || "HEmsoVhRJT4DRmGqZPk136eSLFPNRi6RmMqFNk4eJsVN"
);

// PDA Seeds - Must match oyrade-contract/programs/prediction-market/src/constants.rs
export const SEED_CONFIG = "config";
export const SEED_MARKET = "market";
export const SEED_GLOBAL = "global";
export const SEED_USERINFO = "userinfo";

// v1 Conditional Token PDA seed
export const SEED_MARKET_V1_CONFIG = "market_v1_config";

// ZK Seeds
export const SEED_SHIELDED_POOL = "shielded_pool";
export const SEED_SHARD = "nullifier_shard";
export const SEED_LEAVES = "leaves_indexer";
export const SEED_SUBTREE = "subtree_indexer";

// TEE Registry
export const SEED_TEE_REGISTRY = "tee_registry";

// Team Wallet: Use environment variable or default to the deployer address for devnet
export const TEAM_WALLET = new PublicKey(
  process.env.NEXT_PUBLIC_TEAM_WALLET || "4RQ8yjeGKNTfUTBZt3vHUPFiqzSygq6rXFNkFoGmuDrQ"
);

// Market Groups (multi-outcome events)
export const MARKET_GROUP_SEED = "market_group";

// NegRisk conversion config
export const SEED_MARKET_GROUP_CONFIG = "market_group_config";
export const MAX_NEGRISK_MARKETS = 10;

export const TOKEN_DECIMALS = 6;
export const TOKEN_MULTIPLIER = 10 ** TOKEN_DECIMALS;

/**
 * Market outcome - YES (0) or NO (1)
 */
export enum Outcome {
  Yes = 0,
  No = 1,
}

/**
 * Trade direction - Buy (0) or Sell (1)
 */
export enum Side {
  Buy = 0,
  Sell = 1,
}
