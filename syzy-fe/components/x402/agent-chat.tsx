"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { PanelLeft, SquarePen } from "lucide-react"
import { AgentChatMessage } from "./agent-chat-message"
import { AgentChatInput } from "./agent-chat-input"
import { AgentSessionBudget } from "./agent-session-budget"
import { AgentFundingPrompt } from "./agent-funding-prompt"
import { AgentChatSidebar } from "./agent-chat-sidebar"
import { useAgentSession } from "@/hooks/use-agent-session"
import { useAuthStore } from "@/features/auth/store/use-auth-store"
import { useAgentSidebarStore } from "@/features/agent/store/use-agent-sidebar-store"
import { useChatHistory } from "@/hooks/use-chat-history"
import { useIsMobile } from "@/hooks/common/use-mobile"
import { wrapFetchWithPayment, x402Client } from "@x402/fetch"
import { ExactSvmScheme } from "@x402/svm/exact/client"
import { createKeyPairSignerFromBytes } from "@solana/kit"
import { RPC_URL } from "@/lib/constants/network"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"
import type { ChatMessage, ChatSSEEvent, ToolCall } from "./agent-chat-types"

const SUGGESTED_PROMPTS = [
  "Show me active prediction markets",
  "What is the x402 protocol?",
  "Get details for the top market",
  "Check system health status",
]

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"

function generateId() {
  return crypto.randomUUID()
}

export function AgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [mode, setMode] = useState<"dry_run" | "live">("dry_run")
  const abortControllerRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const session = useAgentSession()
  const { accessToken, user } = useAuthStore()
  const showBudget = mode === "live" || session.isActive
  const searchParams = useSearchParams()
  const router = useRouter()
  const isMobile = useIsMobile()
  const { isOpen: sidebarOpen, toggle: toggleSidebar, setOpen: setSidebarOpen } = useAgentSidebarStore()
  const { refetch: refetchHistory } = useChatHistory()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const executeX402CallRef = useRef<
    (tcId: string, endpoint: string, method: string, args: Record<string, any>, convId: string) => void
  >(() => {})

  // Resume conversation from ?c= query param
  useEffect(() => {
    const resumeId = searchParams.get("c")
    if (resumeId && resumeId !== conversationId) {
      setConversationId(resumeId)
      loadConversationHistory(resumeId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Keyboard shortcut: Cmd/Ctrl+Shift+S to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "s") {
        e.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggleSidebar])

  const handleNewChat = useCallback(() => {
    setMessages([])
    setConversationId(null)
    refetchHistory()
    router.replace("/agent")
    if (isMobile) setSidebarOpen(false)
  }, [refetchHistory, router, isMobile, setSidebarOpen])

  const handleSelectConversation = useCallback(
    (id: string) => {
      if (id === conversationId) return
      router.push(`/agent?c=${id}`)
      if (isMobile) setSidebarOpen(false)
    },
    [conversationId, router, isMobile, setSidebarOpen]
  )

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`
    }
    return headers
  }, [accessToken])

  const loadConversationHistory = useCallback(
    async (convId: string) => {
      try {
        const res = await fetch(`${BASE_URL}/api/chat/history/${convId}`, {
          headers: getAuthHeaders(),
        })
        if (!res.ok) return
        const json = await res.json()
        if (json.data?.messages) {
          const loaded: ChatMessage[] = json.data.messages.map(
            (msg: { role: string; content: string; tool_calls?: ToolCall[] }) => ({
              id: generateId(),
              role: msg.role as "user" | "assistant",
              content: msg.content || "",
              toolCalls: msg.tool_calls || [],
            })
          )
          setMessages(loaded)
        }
      } catch {
        // Failed to load history, start fresh
      }
    },
    [getAuthHeaders]
  )

  const processSSEStream = useCallback(
    async (res: Response) => {
      const reader = res.body?.getReader()
      if (!reader) throw new Error("No response body")

      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith("data: ")) continue

          let event: ChatSSEEvent
          try {
            event = JSON.parse(trimmed.slice(6))
          } catch {
            continue
          }

          switch (event.type) {
            case "tool_call_payment_required": {
              const {
                tool_call_id,
                arguments: args,
                x402_endpoint,
                estimated_cost,
                method: eventMethod,
              } = event.data
              const cost = parseFloat(
                String(estimated_cost).replace(/[^0-9.]/g, "")
              )
              const httpMethod: string = eventMethod || "POST"
              // Refresh on-chain balance — refreshBalance updates balanceRef which checkSufficientBalance reads from
              await session.refreshBalance()
              const balanceCheck = session.checkSufficientBalance(cost)

              if (balanceCheck.sufficient) {
                // Auto-execute x402 call
                executeX402CallRef.current(
                  tool_call_id,
                  x402_endpoint,
                  httpMethod,
                  args,
                  conversationId!
                )
              } else {
                // Show inline funding prompt
                const promptMsg: ChatMessage = {
                  id: generateId(),
                  role: "funding_prompt",
                  content: "",
                  fundingPrompt: {
                    estimatedCost: cost,
                    currentBalance: session.balance,
                    toolCallId: tool_call_id,
                    x402Endpoint: x402_endpoint,
                    method: httpMethod,
                    args: args || {},
                  },
                }
                setMessages((prev) => [...prev, promptMsg])
              }
              break
            }

            case "waiting_for_payment": {
              // Stream is about to end, mark as waiting
              setMessages((prev) => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                if (last?.role === "assistant") {
                  updated[updated.length - 1] = {
                    ...last,
                    isStreaming: false,
                  }
                }
                return updated
              })
              setIsStreaming(false)
              break
            }

            default: {
              // Handle standard events within the last assistant message
              setMessages((prev) => {
                const updated = [...prev]
                const lastIdx = updated.length - 1
                // Find the last assistant message
                let assistantIdx = lastIdx
                while (
                  assistantIdx >= 0 &&
                  updated[assistantIdx].role !== "assistant"
                ) {
                  assistantIdx--
                }
                if (assistantIdx < 0) return prev
                const last = { ...updated[assistantIdx] }

                switch (event.type) {
                  case "text_delta":
                    last.content += event.data.content
                    break

                  case "thinking":
                    break

                  case "tool_call_start": {
                    const tc: ToolCall = {
                      id: event.data.id || generateId(),
                      name: event.data.name,
                      arguments: event.data.arguments || {},
                      loading: true,
                    }
                    last.toolCalls = [...(last.toolCalls || []), tc]
                    break
                  }

                  case "tool_call_result": {
                    last.toolCalls = (last.toolCalls || []).map((tc) =>
                      tc.name === event.data.name && tc.loading
                        ? {
                            ...tc,
                            result: event.data.result,
                            dry_run: event.data.dry_run,
                            loading: false,
                          }
                        : tc
                    )
                    break
                  }

                  case "done":
                    if (event.data.conversation_id) {
                      setConversationId(event.data.conversation_id)
                    }
                    last.isStreaming = false
                    // Refetch chat history when conversation completes
                    refetchHistory()
                    break

                  case "error":
                    last.error = event.data.message
                    last.isStreaming = false
                    break
                }

                updated[assistantIdx] = last
                return updated
              })

              if (event.type === "done" || event.type === "error") {
                setIsStreaming(false)
              }
              break
            }
          }
        }
      }
    },
    [session, conversationId, refetchHistory]
  )

  const executeX402Call = useCallback(
    async (
      toolCallId: string,
      endpoint: string,
      method: string = "POST",
      args: Record<string, any>,
      convId: string
    ) => {
      try {
        // Strip optional "METHOD " prefix (e.g. "POST /api/...") — endpoint must be path-only
        const path = endpoint.replace(/^(GET|POST|PUT|DELETE|PATCH)\s+/, "")
        const keypair = session.getSessionSigner()

        let fetchFn: typeof fetch = fetch
        if (keypair) {
          const signer = await createKeyPairSignerFromBytes(keypair.secretKey)
          const scheme = new ExactSvmScheme(signer, { rpcUrl: RPC_URL })
          const client = new x402Client()
          client.register("solana:*", scheme)
          fetchFn = wrapFetchWithPayment(fetch, client) as typeof fetch
        }

        const isGet = method.toUpperCase() === "GET"
        const url = isGet
          ? `${BASE_URL}${path}?${new URLSearchParams(args as Record<string, string>).toString()}`
          : `${BASE_URL}${path}`

        const result = await fetchFn(url, {
          method: method.toUpperCase(),
          headers: { "Content-Type": "application/json" },
          body: isGet ? undefined : JSON.stringify(args),
        })

        const data = await result.json()
        await resumeWithToolResult(convId, toolCallId, data)
      } catch (error: any) {
        await resumeWithToolResult(convId, toolCallId, {
          error: error.message,
        })
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session]
  )

  // Keep ref in sync with latest executeX402Call
  executeX402CallRef.current = executeX402Call

  const resumeWithToolResult = useCallback(
    async (
      convId: string,
      toolCallId: string,
      result: Record<string, any>
    ) => {
      // Add a new assistant message for the resumed stream
      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: "",
        toolCalls: [],
        isStreaming: true,
      }
      setMessages((prev) => [...prev, assistantMsg])
      setIsStreaming(true)

      try {
        const res = await fetch(`${BASE_URL}/api/chat/tool-result`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            conversation_id: convId,
            tool_call_id: toolCallId,
            result,
          }),
        })

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        }

        await processSSEStream(res)
      } catch (err: any) {
        setMessages((prev) => {
          const updated = [...prev]
          const last = { ...updated[updated.length - 1] }
          last.error = err.message || "Connection failed"
          last.isStreaming = false
          updated[updated.length - 1] = last
          return updated
        })
      } finally {
        setIsStreaming(false)
        session.refreshBalance()
      }
    },
    [getAuthHeaders, processSSEStream, session]
  )

  const handleFundAndRetry = useCallback(
    async (
      amount: number,
      toolCallId: string,
      x402Endpoint: string,
      method: string,
      args: Record<string, any>
    ) => {
      await session.fundSession(amount)
      if (conversationId) {
        await executeX402Call(toolCallId, x402Endpoint, method, args, conversationId)
      }
    },
    [session, conversationId, executeX402Call]
  )

  const handleSkipFunding = useCallback(
    async (toolCallId: string) => {
      if (conversationId) {
        await resumeWithToolResult(conversationId, toolCallId, {
          error: "User skipped payment — insufficient budget",
        })
      }
    },
    [conversationId, resumeWithToolResult]
  )

  const sendMessage = useCallback(
    async (content: string) => {
      const userMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        content,
      }
      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: "",
        toolCalls: [],
        isStreaming: true,
      }

      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setIsStreaming(true)

      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        const res = await fetch(`${BASE_URL}/api/chat/message`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            message: content,
            ...(conversationId && { conversation_id: conversationId }),
            mode,
            ...(user?.walletAddress && {
              wallet_address: user.walletAddress,
            }),
          }),
          signal: controller.signal,
        })

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        }

        await processSSEStream(res)
      } catch (err: any) {
        if (err.name === "AbortError") {
          setMessages((prev) => {
            const updated = [...prev]
            const last = { ...updated[updated.length - 1] }
            last.isStreaming = false
            updated[updated.length - 1] = last
            return updated
          })
        } else {
          setMessages((prev) => {
            const updated = [...prev]
            const last = { ...updated[updated.length - 1] }
            last.error = err.message || "Connection failed"
            last.isStreaming = false
            updated[updated.length - 1] = last
            return updated
          })
        }
      } finally {
        setIsStreaming(false)
        abortControllerRef.current = null
        setMessages((prev) => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last?.isStreaming) {
            updated[updated.length - 1] = { ...last, isStreaming: false }
          }
          return updated
        })
      }
    },
    [conversationId, mode, getAuthHeaders, processSSEStream, user?.walletAddress]
  )

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort()
    setIsStreaming(false)
  }, [])

  const sidebarContent = (
    <AgentChatSidebar
      activeConversationId={conversationId}
      onNewChat={handleNewChat}
      onSelectConversation={handleSelectConversation}
      onToggle={toggleSidebar}
    />
  )

  return (
    <div className="flex h-full">
      {/* Desktop: push sidebar */}
      {!isMobile && (
        <div
          className={cn(
            "h-full shrink-0 overflow-hidden transition-all duration-300 ease-in-out",
            sidebarOpen ? "w-72" : "w-0"
          )}
        >
          <div className="h-full w-72">{sidebarContent}</div>
        </div>
      )}

      {/* Mobile: sheet overlay */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-72 p-0" hideCloseButton>
            <SheetTitle className="sr-only">Chat History</SheetTitle>
            {sidebarContent}
          </SheetContent>
        </Sheet>
      )}

      {/* Main chat area */}
      <div className="flex-1 min-w-0 flex flex-col bg-background">
        {/* Chat header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              sidebarOpen ? "w-0 opacity-0" : "w-8 opacity-100"
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleSidebar}
              title="Toggle sidebar (Ctrl+Shift+S)"
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleNewChat}
            title="New Chat"
          >
            <SquarePen className="h-4 w-4" />
          </Button>
        </div>

        {showBudget && <AgentSessionBudget />}

        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 flex items-center justify-center px-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-center"
              >
                <h1 className="text-3xl font-semibold tracking-tight">
                  Hello there!
                </h1>
                <p className="text-lg text-muted-foreground mt-1">
                  How can I help you today?
                </p>
              </motion.div>
            </div>

            <div className="w-full max-w-3xl mx-auto px-4 pb-6 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <motion.button
                    key={prompt}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    onClick={() => sendMessage(prompt)}
                    className="border border-border rounded-xl px-4 py-3.5 text-sm text-left text-muted-foreground hover:bg-accent transition-colors cursor-pointer"
                  >
                    {prompt}
                  </motion.button>
                ))}
              </div>
              <AgentChatInput
                onSend={sendMessage}
                onStop={handleStop}
                isStreaming={isStreaming}
                mode={mode}
                onModeChange={setMode}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                {messages.map((msg) =>
                  msg.role === "funding_prompt" && msg.fundingPrompt ? (
                    <AgentFundingPrompt
                      key={msg.id}
                      estimatedCost={msg.fundingPrompt.estimatedCost}
                      currentBalance={msg.fundingPrompt.currentBalance}
                      toolCallId={msg.fundingPrompt.toolCallId}
                      x402Endpoint={msg.fundingPrompt.x402Endpoint}
                      method={msg.fundingPrompt.method}
                      args={msg.fundingPrompt.args}
                      onFund={handleFundAndRetry}
                      onSkip={() =>
                        handleSkipFunding(msg.fundingPrompt!.toolCallId)
                      }
                    />
                  ) : (
                    <AgentChatMessage key={msg.id} message={msg} mode={mode} />
                  )
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="w-full max-w-3xl mx-auto px-4 pb-4 pt-2">
              <AgentChatInput
                onSend={sendMessage}
                onStop={handleStop}
                isStreaming={isStreaming}
                mode={mode}
                onModeChange={setMode}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
