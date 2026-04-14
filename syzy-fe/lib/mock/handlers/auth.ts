/**
 * Mock handlers for auth endpoints
 *
 * POST /api/auth/nonce
 * POST /api/auth/verify
 * POST /api/auth/dev-login
 * POST /api/auth/refresh
 * POST /api/auth/logout
 */

import { MOCK_USER } from '../data/user';
import { success } from '../utils';

export function handleGetNonce(_params: unknown, data: unknown) {
  const body = data as { walletAddress?: string } | undefined;
  const address = body?.walletAddress ?? '4RQ8yjeGKNTfUTBZt3vHUPFiqzSygq6rXFNkFoGmuDrQ';
  return success({
    message: `Sign this message to verify your wallet ownership.\n\nWallet: ${address}\nNonce: mock-nonce-${Date.now()}`,
    nonce: `mock-nonce-${Date.now()}`,
  });
}

export function handleVerify() {
  return success({
    access_token: 'mock-jwt-access-' + Date.now(),
    refresh_token: 'mock-jwt-refresh-' + Date.now(),
    user: MOCK_USER,
  });
}

export function handleDevLogin() {
  return success({
    access_token: 'mock-jwt-access-dev-' + Date.now(),
    refresh_token: 'mock-jwt-refresh-dev-' + Date.now(),
    user: MOCK_USER,
  });
}

export function handleRefresh() {
  return success({
    access_token: 'mock-jwt-refreshed-' + Date.now(),
    refresh_token: 'mock-jwt-refresh2-' + Date.now(),
  });
}

export function handleLogout() {
  return success({ success: true });
}
