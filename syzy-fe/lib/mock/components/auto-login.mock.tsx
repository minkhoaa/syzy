"use client"

import { useEffect } from 'react'
import { useAuthStore } from '@/features/auth/store/use-auth-store'
import { MOCK_USER } from '../data/user'

/**
 * Mock AutoLogin — immediately sets auth state with mock tokens and user data.
 * Replaces the real AutoLogin which performs wallet signature verification.
 */
export function AutoLogin() {
  const { setAuthState, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      setAuthState({
        accessToken: 'mock-jwt-access-token',
        refreshToken: 'mock-jwt-refresh-token',
        user: MOCK_USER,
      })
    }
  }, [isAuthenticated, setAuthState])

  return null
}
