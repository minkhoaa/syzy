/**
 * Mock handlers for content endpoints (articles, blogs, comments)
 *
 * GET  /api/articles
 * GET  /api/articles/featured
 * GET  /api/articles/:slug
 * POST /api/articles
 * PUT  /api/articles/:id
 * DELETE /api/articles/:id
 * GET  /api/blogs
 * GET  /api/blogs/featured
 * GET  /api/blogs/:slug
 * POST /api/blogs
 * PUT  /api/blogs/:id
 * DELETE /api/blogs/:id
 * GET  /api/comments/market/:marketId
 * GET  /api/comments/user/:userId
 * GET  /api/comments/replies/:commentId
 * GET  /api/comments/:id
 * POST /api/comments
 * PUT  /api/comments/:id
 * DELETE /api/comments/:id
 */

import { MOCK_ARTICLES, MOCK_BLOG_POSTS, MOCK_COMMENTS } from '../data/content';
import { success, paginated } from '../utils';

// ── Articles ──────────────────────────────────────────────────

export function handleGetArticles(params: Record<string, unknown> | undefined) {
  const page = Number(params?.page ?? 1);
  const limit = Number(params?.limit ?? 20);
  return paginated(MOCK_ARTICLES, page, limit);
}

export function handleGetFeaturedArticle() {
  return success(MOCK_ARTICLES[0] ?? null);
}

export function handleGetArticleBySlug(slug: string) {
  const article = MOCK_ARTICLES.find((a) => a.slug === slug);
  return success(article ?? MOCK_ARTICLES[0] ?? null);
}

export function handleCreateArticle(_params: unknown, data: unknown) {
  const body = data as Record<string, unknown>;
  return success({
    id: 'mock-article-' + Date.now(),
    createdAt: new Date().toISOString(),
    ...body,
  });
}

export function handleUpdateArticle(id: string, _params: unknown, data: unknown) {
  const body = data as Record<string, unknown>;
  const existing = MOCK_ARTICLES.find((a) => a.id === id);
  return success({
    ...(existing ?? MOCK_ARTICLES[0]),
    ...body,
    updatedAt: new Date().toISOString(),
  });
}

export function handleDeleteArticle(_id: string) {
  return success({ success: true });
}

// ── Blogs ─────────────────────────────────────────────────────

export function handleGetBlogs(params: Record<string, unknown> | undefined) {
  const page = Number(params?.page ?? 1);
  const limit = Number(params?.limit ?? 20);
  return paginated(MOCK_BLOG_POSTS, page, limit);
}

export function handleGetFeaturedBlog() {
  return success(MOCK_BLOG_POSTS[0] ?? null);
}

export function handleGetBlogBySlug(slug: string) {
  const blog = MOCK_BLOG_POSTS.find((b) => b.slug === slug);
  return success(blog ?? MOCK_BLOG_POSTS[0] ?? null);
}

export function handleCreateBlog(_params: unknown, data: unknown) {
  const body = data as Record<string, unknown>;
  return success({
    id: 'mock-blog-' + Date.now(),
    createdAt: new Date().toISOString(),
    ...body,
  });
}

export function handleUpdateBlog(id: string, _params: unknown, data: unknown) {
  const body = data as Record<string, unknown>;
  const existing = MOCK_BLOG_POSTS.find((b) => b.id === id);
  return success({
    ...(existing ?? MOCK_BLOG_POSTS[0]),
    ...body,
    updatedAt: new Date().toISOString(),
  });
}

export function handleDeleteBlog(_id: string) {
  return success({ success: true });
}

// ── Comments ──────────────────────────────────────────────────

export function handleGetCommentsByMarket(marketId: string) {
  const comments = MOCK_COMMENTS.filter((c) => c.marketId === marketId);
  return success(comments.length > 0 ? comments : MOCK_COMMENTS);
}

export function handleGetCommentsByUser(userId: string) {
  const comments = MOCK_COMMENTS.filter((c) => c.userId === userId);
  return success(comments);
}

export function handleGetCommentReplies(commentId: string) {
  const replies = MOCK_COMMENTS.filter((c) => c.parentId === commentId);
  return success(replies);
}

export function handleGetComment(id: string) {
  const comment = MOCK_COMMENTS.find((c) => c.id === id);
  return success(comment ?? MOCK_COMMENTS[0] ?? null);
}

export function handleCreateComment(_params: unknown, data: unknown) {
  const body = data as Record<string, unknown>;
  return success({
    id: 'mock-comment-' + Date.now(),
    createdAt: new Date().toISOString(),
    likes: 0,
    ...body,
  });
}

export function handleUpdateComment(id: string, _params: unknown, data: unknown) {
  const body = data as Record<string, unknown>;
  const existing = MOCK_COMMENTS.find((c) => c.id === id);
  return success({
    ...(existing ?? MOCK_COMMENTS[0]),
    ...body,
    updatedAt: new Date().toISOString(),
  });
}

export function handleDeleteComment(_id: string) {
  return success({ success: true });
}
