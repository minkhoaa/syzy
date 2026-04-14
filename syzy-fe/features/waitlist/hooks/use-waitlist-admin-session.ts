"use client";

import { useCallback } from "react";
import { useWaitlistAdminAuthStore } from "@/features/waitlist/store/use-waitlist-admin-auth-store";
import { useReownWallet } from "@/features/auth/hooks/use-reown-wallet";

/**
 * Hook for waitlist admin session:
 * - login() — verify wallet against admin allowlist via challenge/sign flow
 * - logout() — clear admin auth
 */
export function useWaitlistAdminSession() {
  const store = useWaitlistAdminAuthStore();
  const { address } = useReownWallet();

  const login = useCallback(
    async (signature: string, challenge: string) => {
      if (!address) throw new Error("Wallet not connected");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WAITLIST_API_URL ?? "http://localhost:7788"}/auth/admin/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress: address,
            signature,
            challenge,
          }),
        },
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message ?? "Admin login failed");
      }

      const data = await response.json();
      store.setAuthState({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        admin: data.admin,
      });

      return data.admin;
    },
    [address, store],
  );

  const logout = useCallback(() => {
    store.logout();
  }, [store]);

  return {
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    admin: store.admin,
    address,
    login,
    logout,
  };
}
