/**
 * Mock API client — drop-in replacement for the `client` default export in `lib/kubb.ts`.
 *
 * Routes incoming requests by URL pattern to the appropriate handler, simulates
 * a small network delay, and returns an Axios-style `ResponseConfig`.
 *
 * Usage:
 *   In `lib/kubb.ts`, swap the default export:
 *     import { mockClient } from '@/lib/mock/mock-client';
 *     export default mockClient;
 */

import type { RequestConfig, ResponseConfig } from '@/lib/kubb';
import { mockResponse, delay } from './utils';

// ── Handler imports ───────────────────────────────────────────

import {
  handleGetNonce,
  handleVerify,
  handleDevLogin,
  handleRefresh,
  handleLogout,
} from './handlers/auth';

import {
  handleFindAll as handleMarketsFindAll,
  handleFindBySlug,
  handleFindByMarketId,
  handleFindOne as handleMarketFindOne,
  handleCreate as handleMarketCreate,
  handleUpdate as handleMarketUpdate,
  handleGetRecentTrades,
} from './handlers/markets';

import {
  handleGetStats,
  handleGetHistory,
  handleGetCostBasis,
  handleGetWatchlist,
  handleAddToWatchlist,
  handleRemoveFromWatchlist,
  handleCheckWatchlist,
} from './handlers/portfolio';

import {
  handleStoreCommitment,
  handleStoreCommitments,
  handleStoreNote,
  handleGetNotes,
  handleGetNoteByCommitment,
  handleMarkNoteSpent,
  handleDeleteNote,
  handleGetCommitments,
  handleGetCommitmentsByBatch,
  handleGetMerkleProof,
  handleGetMerkleTree,
  handleGetBatchSnapshots,
  handleGetBatchSnapshot,
  handleGetLatestBatchSnapshot,
  handleGetPoolStats,
  handleGetBatchStatus,
  handleCheckNullifier,
  handleGenerateProof,
} from './handlers/zk';

import {
  handleGetNotifications,
  handleGetHistory as handleNotificationHistory,
  handleGetUnreadCount,
  handleMarkAsRead,
  handleMarkAllAsRead,
  handleGetPreferences,
  handleUpdatePreferences,
  handleSetEmail,
  handleVerifyEmail,
  handleRemoveEmail,
} from './handlers/notifications';

import {
  handleGetArticles,
  handleGetFeaturedArticle,
  handleGetArticleBySlug,
  handleCreateArticle,
  handleUpdateArticle,
  handleDeleteArticle,
  handleGetBlogs,
  handleGetFeaturedBlog,
  handleGetBlogBySlug,
  handleCreateBlog,
  handleUpdateBlog,
  handleDeleteBlog,
  handleGetCommentsByMarket,
  handleGetCommentsByUser,
  handleGetCommentReplies,
  handleGetComment,
  handleCreateComment,
  handleUpdateComment,
  handleDeleteComment,
} from './handlers/content';

import {
  handleCheckAdmin,
  handleListAdmins,
  handleAddAdmin,
  handleRemoveAdmin,
  handleGetMetricsSummary,
  handleGetDailyMetrics,
} from './handlers/admin';

import {
  handleTrackEvent,
  handleGetTokenOverview,
  handleGetGlobalStats,
  handleGetOhlcv,
  handleGetBinanceTokens,
  handleGetHolders,
} from './handlers/analytics';

import {
  handleGetNews,
  handleGetTwitterNews,
  handleGetKalshiEvents,
  handleGetKalshiEventByTicker,
  handleGetPolymarketEvents,
  handleGetPolymarketEventBySlug,
  handleGetGraduationMarkets,
  handleGetTrending,
  handleGetTokenDetail,
} from './handlers/news';

import {
  handleGetConversations,
  handleGetHistory as handleChatHistory,
  handleSendMessage,
  handleSubmitToolResult,
} from './handlers/chat';

import { handleR2Upload, handleCloudinaryUpload } from './handlers/upload';

import { handleGetCurrentUser, handleUpdateProfile } from './handlers/user';

import {
  handleGetSnapshots,
  handleCreateSnapshot,
} from './handlers/snapshots';

/**
 * Parse query string from a URL into a Record.
 */
function parseQueryString(url: string): Record<string, string> {
  const qIdx = url.indexOf('?');
  if (qIdx === -1) return {};
  const qs = url.slice(qIdx + 1);
  const result: Record<string, string> = {};
  for (const pair of qs.split('&')) {
    const [key, value] = pair.split('=');
    if (key) result[decodeURIComponent(key)] = decodeURIComponent(value ?? '');
  }
  return result;
}

import { success } from './utils';

// ── Route definition ──────────────────────────────────────────

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

interface Route {
  method: Method | Method[];
  pattern: RegExp;
  handler: (
    match: RegExpExecArray,
    params: Record<string, unknown> | undefined,
    data: unknown,
  ) => unknown;
}

/**
 * Routes are matched in order — put more specific patterns before generic ones.
 *
 * Capture groups in the regex correspond to path parameters. The `match` array
 * passed to each handler has `match[1]`, `match[2]`, etc.
 */
const routes: Route[] = [
  // ── Auth ──────────────────────────────────────────────────
  { method: 'POST', pattern: /^\/api\/auth\/nonce$/, handler: (_m, p, d) => handleGetNonce(p, d) },
  { method: 'POST', pattern: /^\/api\/auth\/verify$/, handler: () => handleVerify() },
  { method: 'POST', pattern: /^\/api\/auth\/dev-login$/, handler: () => handleDevLogin() },
  { method: 'POST', pattern: /^\/api\/auth\/refresh$/, handler: () => handleRefresh() },
  { method: 'POST', pattern: /^\/api\/auth\/logout$/, handler: () => handleLogout() },

  // ── Users ─────────────────────────────────────────────────
  { method: 'GET', pattern: /^\/api\/users\/me$/, handler: () => handleGetCurrentUser() },
  { method: ['PUT', 'PATCH'], pattern: /^\/api\/users\/profile$/, handler: (_m, p, d) => handleUpdateProfile(p, d) },

  // ── Markets (specific paths first) ────────────────────────
  { method: 'GET', pattern: /^\/api\/markets\/recent-trades$/, handler: (_m, p) => handleGetRecentTrades(p as Record<string, unknown>) },
  { method: 'GET', pattern: /^\/api\/markets\/by-slug\/([^/]+)$/, handler: (m) => handleFindBySlug(m[1]) },
  { method: 'GET', pattern: /^\/api\/markets\/by-market-id\/([^/]+)$/, handler: (m) => handleFindByMarketId(m[1]) },
  { method: 'POST', pattern: /^\/api\/markets$/, handler: (_m, p, d) => handleMarketCreate(p, d) },
  { method: 'PUT', pattern: /^\/api\/markets\/([^/]+)$/, handler: (m, p, d) => handleMarketUpdate(m[1], p, d) },
  { method: 'GET', pattern: /^\/api\/markets\/([^/]+)$/, handler: (m) => handleMarketFindOne(m[1]) },
  { method: 'GET', pattern: /^\/api\/markets$/, handler: (_m, p) => handleMarketsFindAll(p as Record<string, unknown>) },

  // ── Portfolio ─────────────────────────────────────────────
  { method: 'GET', pattern: /^\/api\/portfolio\/watchlist\/([^/]+)\/check$/, handler: (m) => handleCheckWatchlist(m[1]) },
  { method: 'DELETE', pattern: /^\/api\/portfolio\/watchlist\/([^/]+)$/, handler: (m) => handleRemoveFromWatchlist(m[1]) },
  { method: 'GET', pattern: /^\/api\/portfolio\/watchlist$/, handler: () => handleGetWatchlist() },
  { method: 'POST', pattern: /^\/api\/portfolio\/watchlist$/, handler: (_m, p, d) => handleAddToWatchlist(p, d) },
  { method: 'GET', pattern: /^\/api\/portfolio\/([^/]+)\/cost-basis$/, handler: () => handleGetCostBasis() },
  { method: 'GET', pattern: /^\/api\/portfolio\/([^/]+)\/history$/, handler: (_m, p) => handleGetHistory(p as Record<string, unknown>) },
  { method: 'GET', pattern: /^\/api\/portfolio\/([^/]+)\/stats$/, handler: () => handleGetStats() },

  // ── Snapshots ─────────────────────────────────────────────
  { method: 'POST', pattern: /^\/api\/snapshots$/, handler: (_m, p, d) => handleCreateSnapshot(p, d) },
  { method: 'GET', pattern: /^\/api\/snapshots\/([^/]+)$/, handler: (m, p) => handleGetSnapshots(m[1], p as Record<string, unknown> | undefined) },

  // ── ZK (specific paths first) ─────────────────────────────
  { method: 'POST', pattern: /^\/api\/zk\/generate-proof$/, handler: () => handleGenerateProof() },
  { method: 'POST', pattern: /^\/api\/zk\/commitments\/batch$/, handler: () => handleStoreCommitments() },
  { method: 'POST', pattern: /^\/api\/zk\/commitments$/, handler: () => handleStoreCommitment() },
  { method: 'POST', pattern: /^\/api\/zk\/notes$/, handler: () => handleStoreNote() },
  { method: 'GET', pattern: /^\/api\/zk\/notes\/([^/]+)\/spent$/, handler: (m) => handleMarkNoteSpent(m[1]) },
  { method: 'PUT', pattern: /^\/api\/zk\/notes\/([^/]+)\/spent$/, handler: (m) => handleMarkNoteSpent(m[1]) },
  { method: 'DELETE', pattern: /^\/api\/zk\/notes\/([^/]+)$/, handler: (m) => handleDeleteNote(m[1]) },
  { method: 'GET', pattern: /^\/api\/zk\/notes\/([^/]+)$/, handler: (m) => handleGetNoteByCommitment(m[1]) },
  { method: 'GET', pattern: /^\/api\/zk\/notes$/, handler: () => handleGetNotes() },
  { method: 'GET', pattern: /^\/api\/zk\/commitments\/([^/]+)\/batch\/([^/]+)$/, handler: (m) => handleGetCommitmentsByBatch(m[1], m[2]) },
  { method: 'GET', pattern: /^\/api\/zk\/commitments\/([^/]+)$/, handler: (m) => handleGetCommitments(m[1]) },
  { method: 'GET', pattern: /^\/api\/zk\/merkle-proof\/([^/]+)\/([^/]+)$/, handler: (m) => handleGetMerkleProof(m[1], m[2]) },
  { method: 'GET', pattern: /^\/api\/zk\/merkle-tree\/([^/]+)$/, handler: (m) => handleGetMerkleTree(m[1]) },
  { method: 'GET', pattern: /^\/api\/zk\/batch-snapshots\/([^/]+)\/latest$/, handler: (m) => handleGetLatestBatchSnapshot(m[1]) },
  { method: 'GET', pattern: /^\/api\/zk\/batch-snapshots\/([^/]+)\/([^/]+)$/, handler: (m) => handleGetBatchSnapshot(m[1], m[2]) },
  { method: 'GET', pattern: /^\/api\/zk\/batch-snapshots\/([^/]+)$/, handler: (m) => handleGetBatchSnapshots(m[1]) },
  { method: 'POST', pattern: /^\/api\/zk\/batch-snapshots\/([^/]+)$/, handler: () => handleStoreCommitment() },
  { method: 'GET', pattern: /^\/api\/zk\/stats\/([^/]+)$/, handler: (m) => handleGetPoolStats(m[1]) },
  { method: 'GET', pattern: /^\/api\/zk\/pools\/([^/]+)\/batch-status$/, handler: (m) => handleGetBatchStatus(m[1]) },
  { method: 'POST', pattern: /^\/api\/zk\/nullifiers\/([^/]+)\/([^/]+)$/, handler: (m) => handleCheckNullifier(m[1], m[2]) },
  { method: 'GET', pattern: /^\/api\/zk\/nullifiers\/([^/]+)\/([^/]+)$/, handler: (m) => handleCheckNullifier(m[1], m[2]) },

  // ── Notifications ─────────────────────────────────────────
  { method: 'GET', pattern: /^\/api\/notifications\/unread-count$/, handler: () => handleGetUnreadCount() },
  { method: 'GET', pattern: /^\/api\/notifications\/history$/, handler: () => handleNotificationHistory() },
  { method: 'GET', pattern: /^\/api\/notifications\/preferences$/, handler: () => handleGetPreferences() },
  { method: ['PUT', 'PATCH'], pattern: /^\/api\/notifications\/preferences$/, handler: (_m, p, d) => handleUpdatePreferences(p, d) },
  { method: 'PUT', pattern: /^\/api\/notifications\/read-all$/, handler: () => handleMarkAllAsRead() },
  { method: 'PUT', pattern: /^\/api\/notifications\/([^/]+)\/read$/, handler: (m) => handleMarkAsRead(m[1]) },
  { method: 'POST', pattern: /^\/api\/notifications\/email\/verify$/, handler: () => handleVerifyEmail() },
  { method: 'POST', pattern: /^\/api\/notifications\/email$/, handler: () => handleSetEmail() },
  { method: 'DELETE', pattern: /^\/api\/notifications\/email$/, handler: () => handleRemoveEmail() },
  { method: 'GET', pattern: /^\/api\/notifications$/, handler: () => handleGetNotifications() },

  // ── Articles ──────────────────────────────────────────────
  { method: 'GET', pattern: /^\/api\/articles\/featured$/, handler: () => handleGetFeaturedArticle() },
  { method: 'GET', pattern: /^\/api\/articles\/([^/]+)$/, handler: (m) => handleGetArticleBySlug(m[1]) },
  { method: 'POST', pattern: /^\/api\/articles$/, handler: (_m, p, d) => handleCreateArticle(p, d) },
  { method: 'PUT', pattern: /^\/api\/articles\/([^/]+)$/, handler: (m, p, d) => handleUpdateArticle(m[1], p, d) },
  { method: 'DELETE', pattern: /^\/api\/articles\/([^/]+)$/, handler: (m) => handleDeleteArticle(m[1]) },
  { method: 'GET', pattern: /^\/api\/articles$/, handler: (_m, p) => handleGetArticles(p as Record<string, unknown>) },

  // ── Blogs ─────────────────────────────────────────────────
  { method: 'GET', pattern: /^\/api\/blogs\/featured$/, handler: () => handleGetFeaturedBlog() },
  { method: 'GET', pattern: /^\/api\/blogs\/([^/]+)$/, handler: (m) => handleGetBlogBySlug(m[1]) },
  { method: 'POST', pattern: /^\/api\/blogs$/, handler: (_m, p, d) => handleCreateBlog(p, d) },
  { method: 'PUT', pattern: /^\/api\/blogs\/([^/]+)$/, handler: (m, p, d) => handleUpdateBlog(m[1], p, d) },
  { method: 'DELETE', pattern: /^\/api\/blogs\/([^/]+)$/, handler: (m) => handleDeleteBlog(m[1]) },
  { method: 'GET', pattern: /^\/api\/blogs$/, handler: (_m, p) => handleGetBlogs(p as Record<string, unknown>) },

  // ── Comments ──────────────────────────────────────────────
  { method: 'GET', pattern: /^\/api\/comments\/market\/([^/]+)$/, handler: (m) => handleGetCommentsByMarket(m[1]) },
  { method: 'GET', pattern: /^\/api\/comments\/user\/([^/]+)$/, handler: (m) => handleGetCommentsByUser(m[1]) },
  { method: 'GET', pattern: /^\/api\/comments\/replies\/([^/]+)$/, handler: (m) => handleGetCommentReplies(m[1]) },
  { method: 'POST', pattern: /^\/api\/comments$/, handler: (_m, p, d) => handleCreateComment(p, d) },
  { method: 'PUT', pattern: /^\/api\/comments\/([^/]+)$/, handler: (m, p, d) => handleUpdateComment(m[1], p, d) },
  { method: 'DELETE', pattern: /^\/api\/comments\/([^/]+)$/, handler: (m) => handleDeleteComment(m[1]) },
  { method: 'GET', pattern: /^\/api\/comments\/([^/]+)$/, handler: (m) => handleGetComment(m[1]) },

  // ── Admin ─────────────────────────────────────────────────
  { method: 'GET', pattern: /^\/api\/admin\/check\/([^/]+)$/, handler: (m) => handleCheckAdmin(m[1]) },
  { method: 'GET', pattern: /^\/api\/admin\/list$/, handler: () => handleListAdmins() },
  { method: 'POST', pattern: /^\/api\/admin\/add\/([^/]+)$/, handler: (m) => handleAddAdmin(m[1]) },
  { method: 'DELETE', pattern: /^\/api\/admin\/remove\/([^/]+)$/, handler: (m) => handleRemoveAdmin(m[1]) },

  // ── Metrics ───────────────────────────────────────────────
  { method: 'GET', pattern: /^\/api\/metrics\/summary$/, handler: () => handleGetMetricsSummary() },
  { method: 'GET', pattern: /^\/api\/metrics\/daily$/, handler: () => handleGetDailyMetrics() },
  { method: 'POST', pattern: /^\/api\/metrics\/track$/, handler: () => handleTrackEvent() },

  // ── Token Data ────────────────────────────────────────────
  { method: 'GET', pattern: /^\/api\/token-data\/binance\/tokens$/, handler: () => handleGetBinanceTokens() },
  { method: 'GET', pattern: /^\/api\/token-data\/global\/stats$/, handler: () => handleGetGlobalStats() },
  { method: 'GET', pattern: /^\/api\/token-data\/([^/]+)\/overview$/, handler: (m) => handleGetTokenOverview(m[1]) },
  { method: 'GET', pattern: /^\/api\/token-data\/([^/]+)\/ohlcv$/, handler: (m) => handleGetOhlcv(m[1]) },
  { method: 'GET', pattern: /^\/api\/token-data\/([^/]+)\/holders$/, handler: (m) => handleGetHolders(m[1]) },

  // ── News ──────────────────────────────────────────────────
  { method: 'GET', pattern: /^\/api\/news\/twitter\/([^/]+)$/, handler: (m) => handleGetTwitterNews(m[1]) },
  { method: 'GET', pattern: /^\/api\/news\/([^/]+)$/, handler: (m) => handleGetNews(m[1]) },

  // ── Kalshi ────────────────────────────────────────────────
  { method: 'GET', pattern: /^\/api\/kalshi\/events\/([^/]+)$/, handler: (m) => handleGetKalshiEventByTicker(m[1]) },
  { method: 'GET', pattern: /^\/api\/kalshi\/events$/, handler: () => handleGetKalshiEvents() },

  // ── Polymarket ────────────────────────────────────────────
  { method: 'GET', pattern: /^\/api\/polymarket\/events\/([^/]+)$/, handler: (m) => handleGetPolymarketEventBySlug(m[1]) },
  { method: 'GET', pattern: /^\/api\/polymarket\/events$/, handler: () => handleGetPolymarketEvents() },
  { method: 'POST', pattern: /^\/api\/polymarket\/force-resolve\/([^/]+)$/, handler: () => success({ success: true }) },
  { method: 'POST', pattern: /^\/api\/polymarket\/resolution-check$/, handler: () => success({ success: true }) },

  // ── Graduation ────────────────────────────────────────────
  { method: 'GET', pattern: /^\/api\/graduation\/trending$/, handler: () => handleGetTrending() },
  { method: 'GET', pattern: /^\/api\/graduation\/markets$/, handler: () => handleGetGraduationMarkets() },
  { method: 'GET', pattern: /^\/api\/graduation\/token\/([^/]+)$/, handler: (m) => handleGetTokenDetail(m[1]) },

  // ── Chat ──────────────────────────────────────────────────
  { method: 'GET', pattern: /^\/api\/chat\/conversations$/, handler: () => handleGetConversations() },
  { method: 'GET', pattern: /^\/api\/chat\/history\/([^/]+)$/, handler: (m) => handleChatHistory(m[1]) },
  { method: 'POST', pattern: /^\/api\/chat\/message$/, handler: (_m, p, d) => handleSendMessage(p, d) },
  { method: 'POST', pattern: /^\/api\/chat\/tool-result$/, handler: () => handleSubmitToolResult() },

  // ── Upload ────────────────────────────────────────────────
  { method: 'POST', pattern: /^\/api\/r2\/upload$/, handler: () => handleR2Upload() },
  { method: 'POST', pattern: /^\/api\/cloudinary\/upload$/, handler: () => handleCloudinaryUpload() },

  // ── x402 (return minimal mock data) ───────────────────────
  { method: 'GET', pattern: /^\/api\/x402-info$/, handler: () => success({ version: '1.0', network: 'devnet' }) },
  { method: 'GET', pattern: /^\/api\/v1\/markets\/([^/]+)$/, handler: (m) => handleMarketFindOne(m[1]) },
  { method: 'GET', pattern: /^\/api\/v1\/markets$/, handler: (_m, p) => handleMarketsFindAll(p as Record<string, unknown>) },
  { method: 'POST', pattern: /^\/api\/v1\/markets\/create$/, handler: (_m, p, d) => handleMarketCreate(p, d) },
  { method: 'POST', pattern: /^\/api\/v1\/markets\/([^/]+)\/predict$/, handler: () => success({ success: true }) },
  { method: 'POST', pattern: /^\/api\/v1\/markets\/([^/]+)\/sell$/, handler: () => success({ success: true }) },
  { method: 'POST', pattern: /^\/api\/v1\/markets\/([^/]+)\/claim$/, handler: () => success({ success: true }) },
  { method: 'POST', pattern: /^\/api\/v1\/markets\/([^/]+)\/resolve$/, handler: () => success({ success: true }) },
  { method: 'GET', pattern: /^\/api\/v1\/markets\/([^/]+)\/comments$/, handler: (m) => handleGetCommentsByMarket(m[1]) },
  { method: 'GET', pattern: /^\/api\/v1\/markets\/([^/]+)\/news$/, handler: (m) => handleGetNews(m[1]) },
  { method: 'GET', pattern: /^\/api\/v1\/markets\/([^/]+)\/history$/, handler: (_m, p) => handleGetHistory(p as Record<string, unknown>) },
  { method: 'POST', pattern: /^\/api\/v1\/markets\/([^/]+)\/privacy-proof$/, handler: () => handleGenerateProof() },
  { method: 'GET', pattern: /^\/api\/v1\/history$/, handler: (_m, p) => handleGetHistory(p as Record<string, unknown>) },
  { method: 'GET', pattern: /^\/api\/v1\/positions$/, handler: () => success([]) },

  // ── Health / root ─────────────────────────────────────────
  { method: 'GET', pattern: /^\/api\/health$/, handler: () => success({ status: 'ok', mode: 'mock' }) },
  { method: 'GET', pattern: /^\/api$/, handler: () => success({ message: 'Syzy Mock API' }) },
];

// ── Router ────────────────────────────────────────────────────

function matchRoute(
  method: string,
  url: string,
): { match: RegExpExecArray; handler: Route['handler'] } | null {
  const upperMethod = method.toUpperCase();
  // Strip query string so route patterns only match the path
  const path = url.split('?')[0];

  for (const route of routes) {
    const methods = Array.isArray(route.method) ? route.method : [route.method];
    if (!methods.includes(upperMethod as Method)) continue;

    const match = route.pattern.exec(path);
    if (match) {
      return { match, handler: route.handler };
    }
  }

  return null;
}

// ── Mock client function ──────────────────────────────────────

export async function mockClient<TResponseData, _TError = unknown, TRequestData = unknown>(
  config: RequestConfig<TRequestData>,
): Promise<ResponseConfig<TResponseData>> {
  const { url = '', method = 'GET', params, data } = config;

  // Simulate network latency (100–300ms)
  await delay(100 + Math.random() * 200);

  const result = matchRoute(method, url);

  if (result) {
    // Merge query string params from URL with explicit params
    const queryParams = parseQueryString(url);
    const mergedParams = { ...queryParams, ...(params as Record<string, unknown> | undefined) };
    const body = result.handler(
      result.match,
      Object.keys(mergedParams).length > 0 ? mergedParams : (params as Record<string, unknown> | undefined),
      data,
    );
    return mockResponse(body) as ResponseConfig<TResponseData>;
  }

  // Fallback: unmatched routes return a generic success so the app does not crash
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[mock-client] No handler for ${method} ${url}`);
  }

  return mockResponse(success(null)) as ResponseConfig<TResponseData>;
}

export default mockClient;
