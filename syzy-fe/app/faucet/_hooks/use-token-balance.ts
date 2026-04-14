"use client";

import { useAppKitAccount } from "@reown/appkit/react";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { TOKEN_MINT_ADDRESS, TOKEN_DECIMALS } from "../_utils/constants";
import { RPC_URL, CLUSTER } from "@/lib/constants/network";

export function useTokenBalance() {
  const { address, isConnected } = useAppKitAccount();
  const connection = useMemo(() => new Connection(RPC_URL, CLUSTER), []);

  return useQuery({
    queryKey: ["faucet-token-balance", address],
    queryFn: async () => {
      if (!address || !TOKEN_MINT_ADDRESS) return null;

      try {
        const publicKey = new PublicKey(address);
        const tokenMint = new PublicKey(TOKEN_MINT_ADDRESS);
        const ata = getAssociatedTokenAddressSync(tokenMint, publicKey);
        const account = await connection.getTokenAccountBalance(ata);
        return Number(account.value.amount) / 10 ** TOKEN_DECIMALS;
      } catch {
        // ATA doesn't exist yet - balance is 0
        return 0;
      }
    },
    enabled: !!address && isConnected,
    refetchInterval: 15_000,
  });
}
