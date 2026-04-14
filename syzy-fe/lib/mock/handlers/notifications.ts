/**
 * Mock handlers for notification endpoints
 *
 * GET  /api/notifications
 * GET  /api/notifications/history
 * GET  /api/notifications/unread-count
 * PUT  /api/notifications/:id/read
 * PUT  /api/notifications/read-all
 * GET  /api/notifications/preferences
 * PUT  /api/notifications/preferences
 * POST /api/notifications/email
 * POST /api/notifications/email/verify
 * DELETE /api/notifications/email
 */

import { MOCK_NOTIFICATIONS } from '../data/notifications';
import { success } from '../utils';

// Track read state in-memory during the session
const readIds = new Set<string>();

export function handleGetNotifications() {
  const withReadState = MOCK_NOTIFICATIONS.map((n) => ({
    ...n,
    read: readIds.has(n.id) ? true : n.read,
  }));
  return success(withReadState);
}

export function handleGetHistory() {
  const withReadState = MOCK_NOTIFICATIONS.map((n) => ({
    ...n,
    read: readIds.has(n.id) ? true : n.read,
  }));
  return success(withReadState);
}

export function handleGetUnreadCount() {
  const unread = MOCK_NOTIFICATIONS.filter((n) => !n.read && !readIds.has(n.id)).length;
  return success({ count: unread });
}

export function handleMarkAsRead(id: string) {
  readIds.add(id);
  return success({ success: true });
}

export function handleMarkAllAsRead() {
  MOCK_NOTIFICATIONS.forEach((n) => readIds.add(n.id));
  return success({ success: true });
}

export function handleGetPreferences() {
  return success({
    marketResolved: true,
    predictionWon: true,
    newComment: true,
    email: false,
  });
}

export function handleUpdatePreferences(_params: unknown, data: unknown) {
  const body = data as Record<string, unknown> | undefined;
  return success({
    marketResolved: true,
    predictionWon: true,
    newComment: true,
    email: false,
    ...body,
  });
}

export function handleSetEmail() {
  return success({ success: true });
}

export function handleVerifyEmail() {
  return success({ success: true });
}

export function handleRemoveEmail() {
  return success({ success: true });
}
