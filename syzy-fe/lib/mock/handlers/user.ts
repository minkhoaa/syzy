/**
 * Mock handlers for user endpoints
 *
 * GET /api/users/me
 * PUT /api/users/profile  (NOTE: some backends use PATCH)
 */

import { MOCK_USER_PROFILE } from '../data/user';
import { success } from '../utils';

// Mutable copy so profile updates persist within the session
let currentUser = { ...MOCK_USER_PROFILE };

export function handleGetCurrentUser() {
  return success(currentUser);
}

export function handleUpdateProfile(_params: unknown, data: unknown) {
  const body = data as Record<string, unknown> | undefined;
  if (body) {
    currentUser = { ...currentUser, ...body, updatedAt: new Date().toISOString() };
  }
  return success(currentUser);
}
