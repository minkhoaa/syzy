/**
 * Mock handlers for admin and metrics endpoints
 *
 * GET  /api/admin/check/:address
 * GET  /api/admin/list
 * POST /api/admin/add/:walletAddress
 * DELETE /api/admin/remove/:walletAddress
 * GET  /api/metrics/summary
 * GET  /api/metrics/daily
 */

import { success } from '../utils';

const MOCK_ADMIN_WALLET = '4RQ8yjeGKNTfUTBZt3vHUPFiqzSygq6rXFNkFoGmuDrQ';

export function handleCheckAdmin(_address: string) {
  // In mock mode, everyone is admin
  return success({ isAdmin: true });
}

export function handleListAdmins() {
  return success({ admins: [MOCK_ADMIN_WALLET] });
}

export function handleAddAdmin(walletAddress: string) {
  return success({ walletAddress, addedAt: new Date().toISOString() });
}

export function handleRemoveAdmin(_walletAddress: string) {
  return success({ success: true });
}

export function handleGetMetricsSummary() {
  return success({
    totalMarkets: 12,
    totalTrades: 1547,
    totalVolume: 4500,
    activeUsers: 234,
    resolvedMarkets: 5,
    activeMarkets: 7,
    totalLiquidity: 1250,
    avgTradeSize: 2.91,
  });
}

export function handleGetDailyMetrics() {
  const now = Date.now();
  const days = 30;
  const metrics = Array.from({ length: days }, (_, i) => {
    const date = new Date(now - (days - 1 - i) * 86400_000);
    return {
      date: date.toISOString().split('T')[0],
      trades: Math.floor(Math.random() * 80 + 20),
      volume: parseFloat((Math.random() * 200 + 50).toFixed(2)),
      activeUsers: Math.floor(Math.random() * 40 + 10),
      newMarkets: Math.floor(Math.random() * 3),
      fees: parseFloat((Math.random() * 5 + 0.5).toFixed(4)),
    };
  });
  return success(metrics);
}
