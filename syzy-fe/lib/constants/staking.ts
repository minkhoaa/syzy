import { PublicKey } from "@solana/web3.js";

export const REWARD_POOL_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_REWARD_POOL_PROGRAM_ID || "CfskEzrb8yVhAtRJxvA7Z7mRPpPwMwjvfX8cWNwFRXWX"
);

export const OYRADE_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_TOKEN_MINT || "DfnxGQUsXdDH7DYdroeeSBG8etqTy1kufxBikHwTTGTa"
);

export const OYRADE_DECIMALS = 6;

// PDA seeds — must match oyrade-contract/programs/reward-pool/src/constants.rs
export const POOL_SEED = "reward_pool";
export const REWARD_VAULT_SEED = "reward_vault";
export const STAKE_USER_SEED = "stake_user";

// Precision constant for per-token accumulation (u64::MAX as bigint)
export const PRECISION = BigInt("18446744073709551615");

export function getPoolPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(POOL_SEED), OYRADE_MINT.toBuffer()],
    REWARD_POOL_PROGRAM_ID
  );
}

export function getRewardVaultPda(poolPda: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(REWARD_VAULT_SEED), poolPda.toBuffer()],
    REWARD_POOL_PROGRAM_ID
  );
}

export function getUserPda(poolPda: PublicKey, owner: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(STAKE_USER_SEED), poolPda.toBuffer(), owner.toBuffer()],
    REWARD_POOL_PROGRAM_ID
  );
}
