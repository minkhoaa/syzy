import { solanaDevnet } from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";
import { SolanaAdapter } from "@reown/appkit-adapter-solana/react";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { RPC_URL } from "@/lib/constants/network";

// Reown project ID from https://dashboard.reown.com (separate from Alchemy RPC)
export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID!;

// Create custom devnet network with our RPC to avoid simulation failures from stale state
const customSolanaDevnet: AppKitNetwork = {
  ...solanaDevnet,
  rpcUrls: {
    default: {
      http: [RPC_URL],
    },
  },
};

export const networks = [customSolanaDevnet] as [AppKitNetwork, ...AppKitNetwork[]];

// Set up Solana Adapter with explicit wallet support
export const solanaWeb3JsAdapter = new SolanaAdapter({
  wallets: [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
});

// Metadata for the app — url must match the actual page origin or Phantom declines the connection
export const metadata = {
  name: "Syzy",
  description: "Decentralized Prediction Platform designed for discretion on Solana",
  url: typeof window !== "undefined" ? window.location.origin : "https://oyrade.com",
  icons: ["/logo/syzy.svg"],
};
