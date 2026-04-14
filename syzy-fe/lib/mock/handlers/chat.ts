/**
 * Mock handlers for chat endpoints
 *
 * GET  /api/chat/conversations
 * GET  /api/chat/history/:id
 * POST /api/chat/message
 * POST /api/chat/tool-result
 */

import { success } from '../utils';

export function handleGetConversations() {
  return success([]);
}

export function handleGetHistory(_id: string) {
  return success([]);
}

export function handleSendMessage(_params: unknown, data: unknown) {
  const body = data as { message?: string } | undefined;
  return success({
    id: 'msg-' + Date.now(),
    conversationId: 'conv-mock-1',
    role: 'assistant',
    content:
      'I am a mock AI assistant. This feature is not available in demo mode. ' +
      (body?.message ? `You said: "${body.message}"` : ''),
    createdAt: new Date().toISOString(),
  });
}

export function handleSubmitToolResult() {
  return success({
    id: 'msg-tool-' + Date.now(),
    conversationId: 'conv-mock-1',
    role: 'assistant',
    content: 'Tool result received. Mock mode does not process tool calls.',
    createdAt: new Date().toISOString(),
  });
}
