"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface WaitlistMember {
  walletAddress: string;
  referralCode: string;
  email: string | null;
  isContactable: boolean;
  joinedAt: string;
}

interface WaitlistMemberAuthState {
  accessToken: string | null;
  refreshToken: string | null;
  member: WaitlistMember | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuthState: (state: {
    accessToken: string;
    refreshToken: string;
    member: WaitlistMember;
  }) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
}

export const useWaitlistMemberAuthStore =
  create<WaitlistMemberAuthState>()(
    persist(
      (set) => ({
        accessToken: null,
        refreshToken: null,
        member: null,
        isAuthenticated: false,
        isLoading: false,

        setAuthState: ({ accessToken, refreshToken, member }) => {
          set({
            accessToken,
            refreshToken,
            member,
            isAuthenticated: true,
            isLoading: false,
          });
        },

        setLoading: (isLoading) => set({ isLoading }),

        logout: () =>
          set({
            accessToken: null,
            refreshToken: null,
            member: null,
            isAuthenticated: false,
            isLoading: false,
          }),
      }),
      {
        name: "syzy.waitlist.member.auth",
        storage: createJSONStorage(() => localStorage),
        skipHydration: typeof window === "undefined",
      },
    ),
  );
