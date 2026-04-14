import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface AuthUser {
  id: string
  walletAddress: string
  username: string | null
  avatar: string | null
}

interface AuthState {
  // Core state
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean

  // Actions
  setTokens: (accessToken: string, refreshToken: string) => void
  setUser: (user: AuthUser) => void
  setAuthState: (state: {
    accessToken: string
    refreshToken: string
    user: AuthUser
  }) => void
  setLoading: (isLoading: boolean) => void
  updateUser: (updates: Partial<AuthUser>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      setTokens: (accessToken, refreshToken) =>
        set({
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),

      setUser: (user) =>
        set({
          user,
          isAuthenticated: true,
        }),

      setAuthState: ({ accessToken, refreshToken, user }) => {
        set({
          accessToken,
          refreshToken,
          user,
          isAuthenticated: true,
          isLoading: false,
        })
      },

      setLoading: (isLoading) => set({ isLoading }),

      updateUser: (updates) => {
        const currentUser = get().user
        if (currentUser) {
          set({
            user: { ...currentUser, ...updates },
          })
        }
      },

      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }),
    }),
    {
      name: 'oyrade-auth-storage',
      storage: createJSONStorage(() => localStorage),
      // Skip hydration on server
      skipHydration: typeof window === 'undefined',
    },
  ),
)
