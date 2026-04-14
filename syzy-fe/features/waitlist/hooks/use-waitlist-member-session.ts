"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWaitlistMemberAuthStore } from "@/features/waitlist/store/use-waitlist-member-auth-store";
import { useReownWallet } from "@/features/auth/hooks/use-reown-wallet";

const WAITLIST_API = process.env.NEXT_PUBLIC_WAITLIST_API_URL ?? "/api";

interface RegisterResponse {
  accessToken: string;
  refreshToken: string;
  member: {
    walletAddress: string;
    referralCode: string;
    email: string | null;
    isContactable: boolean;
    joinedAt: string;
  };
}

/**
 * Manages the waitlist member session lifecycle:
 * - restore(): checks localStorage and verifies session with backend
 * - join(): fetches challenge, gets wallet signature, registers
 * - attachEmail(): attaches email to existing session
 * - logout(): clears local state
 *
 * Also handles post-setup redirect: when user completes email on /waitlist,
 * if there's a stored redirect path, sends them back there.
 */
export function useWaitlistMemberSession() {
  const router = useRouter();
  const store = useWaitlistMemberAuthStore();
  const { address } = useReownWallet();

  // Attempt to restore session from persisted store
  const restore = useCallback(async () => {
    if (!store.accessToken || !store.refreshToken) return null;

    try {
      const res = await fetch(`${WAITLIST_API}/auth/me`, {
        headers: { Authorization: `Bearer ${store.accessToken}` },
      });

      if (res.ok) {
        const member = await res.json();
        store.setAuthState({
          accessToken: store.accessToken,
          refreshToken: store.refreshToken,
          member,
        });
        return member;
      }

      // Token expired — try refresh
      if (res.status === 401 && store.refreshToken) {
        const refreshRes = await fetch(`${WAITLIST_API}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: store.refreshToken }),
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          store.setAuthState({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            member: store.member!,
          });
          return store.member;
        }
      }

      store.logout();
      return null;
    } catch {
      store.logout();
      return null;
    }
  }, [store]);

  // Register a new wallet with challenge+signature
  const join = useCallback(
    async (challenge: string, signature: string, referredByCode?: string) => {
      if (!address) throw new Error("Wallet not connected");

      const res = await fetch(`${WAITLIST_API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          signedChallenge: signature,
          challenge,
          referredByCode,
          walletProvider: "SOLANA",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Registration failed");
      }

      const data: RegisterResponse = await res.json();
      store.setAuthState({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        member: data.member,
      });

      return data.member;
    },
    [address, store],
  );

  // Attach/update email and trigger post-setup redirect
  const attachEmail = useCallback(
    async (email: string) => {
      const res = await fetch(`${WAITLIST_API}/waitlist/contact`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address, email }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Failed to attach email");
      }

      const data = await res.json();
      if (store.member) {
        store.setAuthState({
          accessToken: store.accessToken!,
          refreshToken: store.refreshToken!,
          member: { ...store.member, email: data.email, isContactable: data.isContactable },
        });
      }

      // After email attached, check if there's a redirect destination
      if (typeof window !== "undefined") {
        const redirectPath = sessionStorage.getItem("waitlist_redirect");
        sessionStorage.removeItem("waitlist_redirect");
        if (redirectPath) {
          router.push(redirectPath);
        }
      }

      return data;
    },
    [router, store],
  );

  const logout = useCallback(() => {
    store.logout();
  }, [store]);

  // Check if session is complete (connected + authenticated + email)
  const isComplete = !!(store.accessToken && store.member?.email);

  return {
    isAuthenticated: !!store.accessToken,
    isComplete,
    isLoading: store.isLoading,
    member: store.member,
    address,
    join,
    restore,
    attachEmail,
    logout,
  };
}
