export const TOKEN_MINT_ADDRESS =
  process.env.NEXT_PUBLIC_TOKEN_MINT || "";

export const TOKEN_DECIMALS = 6;

export const CLAIM_AMOUNT_DISPLAY = Number(
  process.env.NEXT_PUBLIC_CLAIM_AMOUNT || "1000"
);

export const EXPLORER_URL = "https://explorer.solana.com";

export function getExplorerTxUrl(signature: string): string {
  return `${EXPLORER_URL}/tx/${signature}?cluster=devnet`;
}

export function getExplorerTokenUrl(mint: string): string {
  return `${EXPLORER_URL}/address/${mint}?cluster=devnet`;
}
