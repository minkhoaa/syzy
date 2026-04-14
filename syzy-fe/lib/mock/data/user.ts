/**
 * Mock user profile for the Syzy mock frontend.
 */

import type { AuthUser } from '@/features/auth/store/use-auth-store';
import { MOCK_WALLET_ADDRESS } from './markets';

// Re-export for backward compatibility (stores/mock-chain-store.ts imports this)
export const MOCK_ADDRESS = MOCK_WALLET_ADDRESS;

// ---------------------------------------------------------------------------
// Extended user profile (superset of AuthUser used by backend responses)
// ---------------------------------------------------------------------------

export interface MockUserProfile extends AuthUser {
  email: string | null;
  emailVerified: boolean;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * The auth system only uses the AuthUser subset (id, walletAddress, username,
 * avatar). The full profile is returned by GET /api/users/me and includes
 * additional fields.
 */
export const MOCK_USER_PROFILE: MockUserProfile = {
  id: 'mock-user-1',
  walletAddress: MOCK_WALLET_ADDRESS,
  username: 'demo_trader',
  avatar: null,
  email: null,
  emailVerified: false,
  isAdmin: true,
  createdAt: '2026-01-15T00:00:00Z',
  updatedAt: '2026-04-06T00:00:00Z',
};

/**
 * AuthUser subset — used by auth handlers and the auto-login component.
 */
export const MOCK_USER: AuthUser = {
  id: MOCK_USER_PROFILE.id,
  walletAddress: MOCK_USER_PROFILE.walletAddress,
  username: MOCK_USER_PROFILE.username,
  avatar: MOCK_USER_PROFILE.avatar,
};
