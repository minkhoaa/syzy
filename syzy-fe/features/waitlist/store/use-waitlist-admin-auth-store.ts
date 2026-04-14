"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface WaitlistAdmin {
  walletAddress: string;
  role: "owner" | "manager";
}

interface WaitlistAdminAuthState {
  accessToken: string | null;
  refreshToken: string | null;
  admin: WaitlistAdmin | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuthState: (state: {
    accessToken: string;
    refreshToken: string;
    admin: WaitlistAdmin;
  }) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
}

export const useWaitlistAdminAuthStore =
  create<WaitlistAdminAuthState>()(
    persist(
      (set) => ({
        accessToken: null,
        refreshToken: null,
        admin: null,
        isAuthenticated: false,
        isLoading: false,

        setAuthState: ({ accessToken, refreshToken, admin }) => {
          set({
            accessToken,
            refreshToken,
            admin,
            isAuthenticated: true,
            isLoading: false,
          });
        },

        setLoading: (isLoading) => set({ isLoading }),

        logout: () =>
          set({
            accessToken: null,
            refreshToken: null,
            admin: null,
            isAuthenticated: false,
            isLoading: false,
          }),
      }),
      {
        name: "syzy.waitlist.admin.auth",
        storage: createJSONStorage(() => localStorage),
        skipHydration: typeof window === "undefined",
      },
    ),
  );
