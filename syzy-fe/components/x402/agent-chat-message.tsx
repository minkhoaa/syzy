"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  Loader2,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"
import type { ChatMessage } from "./agent-chat-types"
import { TOOL_COSTS_USDC } from "./agent-chat-types"
import { AgentChatToolCall } from "./agent-chat-tool-call"
import type { Components } from "react-markdown"

const markdownComponents: Components = {
  table: ({ children }) => (
    <div className="overflow-x-auto my-3">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-zinc-50 dark:bg-zinc-900">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-sm">
      {children}
    </td>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-emerald-600 dark:text-emerald-400 hover:underline"
    >
      {children}
    </a>
  ),
  code: ({ children, className }) => {
    const isInline = !className
    return isInline ? (
      <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    ) : (
      <code className={className}>{children}</code>
    )
  },
  pre: ({ children }) => (
    <pre className="bg-zinc-100 dark:bg-zinc-900 rounded-lg p-4 overflow-x-auto text-sm my-3 font-mono">
      {children}
    </pre>
  ),
  p: ({ children }) => (
    <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-5 mb-3 space-y-1.5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 mb-3 space-y-1.5">{children}</ol>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
}

/**
 * Sanitise content before passing to ReactMarkdown.
 * The backend sometimes sends raw `<br>` / `<br/>` tags that ReactMarkdown
 * won't render.  Convert them to markdown newlines.
 */
function sanitizeContent(raw: string): string {
  return raw.replace(/<br\s*\/?>/gi, "\n")
}

// ---------------------------------------------------------------------------
// StreamingMarkdown — gradually reveals characters at a smooth, constant
// pace so text "flows" like Gemini / Claude instead of jumping in chunks.
//
// How it works:
//   • `content` (from props) is the full text received so far from SSE.
//   • We keep a `revealedLen` counter that trails behind content.length.
//   • Every 30 ms we advance `revealedLen` toward content.length with an
//     adaptive step (fast when far behind, slow as it catches up).
//   • React state is updated each tick → ReactMarkdown re-renders with the
//     partial string `content.slice(0, revealedLen)`.
//   • When streaming stops, we immediately show the full content.
// ---------------------------------------------------------------------------
function StreamingMarkdown({
  content,
  isStreaming,
}: {
  content: string
  isStreaming: boolean
}) {
  const targetRef = useRef(content)
  const revealedLenRef = useRef(0)
  const [displayed, setDisplayed] = useState("")

  targetRef.current = content

  // Initialise revealedLen when the component first mounts (e.g. if content
  // already exists from a completed message in history).
  useEffect(() => {
    if (!isStreaming) {
      revealedLenRef.current = content.length
      setDisplayed(content)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Steady typewriter loop — exactly 1 character per tick, no batching.
  // Uses requestAnimationFrame for paint-aligned smoothness.
  //
  // The loop reads `targetRef.current` each tick (always fresh via the
  // assignment above) and `streamingRef` to know when SSE is done.
  // When streaming ends the loop keeps running until it finishes
  // revealing the final content — no sudden flush.
  const streamingRef = useRef(isStreaming)
  streamingRef.current = isStreaming

  useEffect(() => {
    // History-loaded message — already complete, nothing to animate.
    if (!isStreaming && revealedLenRef.current === 0 && content.length > 0) {
      revealedLenRef.current = content.length
      setDisplayed(content)
      return
    }

    // Don't start a loop if there's nothing to do
    if (!isStreaming && revealedLenRef.current >= targetRef.current.length) {
      return
    }

    let rafId: number
    let lastTime = 0
    const CHAR_MS = 4 // ms per character — ~250 chars/sec target

    const tick = (now: number) => {
      if (!lastTime) lastTime = now

      const elapsed = now - lastTime
      if (elapsed >= CHAR_MS) {
        const target = targetRef.current
        const current = revealedLenRef.current

        if (current < target.length) {
          // Reveal multiple chars per frame based on elapsed time
          const charsToReveal = Math.max(1, Math.floor(elapsed / CHAR_MS))
          const next = Math.min(current + charsToReveal, target.length)
          revealedLenRef.current = next
          setDisplayed(target.slice(0, next))
          lastTime = now
        } else if (!streamingRef.current) {
          // Caught up AND streaming is done — stop the loop
          return
        }
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming])

  const sanitized = sanitizeContent(displayed)

  return (
    <div
      className={cn(
        "text-sm text-zinc-800 dark:text-zinc-200",
        isStreaming && displayed.length < content.length && "streaming-cursor"
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {sanitized}
      </ReactMarkdown>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Thinking / Reasoning block — shown while the agent is processing.
// Displays elapsed time and embeds tool calls as "reasoning steps".
// Auto-collapses when the text response starts arriving.
// ---------------------------------------------------------------------------
function ThinkingBlock({
  isStreaming,
  hasContent,
  toolCalls,
  liveMode,
}: {
  isStreaming: boolean
  hasContent: boolean
  toolCalls?: ChatMessage["toolCalls"]
  liveMode?: boolean
}) {
  const [isOpen, setIsOpen] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const startTime = useRef(Date.now())
  const hasToolCalls = toolCalls && toolCalls.length > 0

  // Track elapsed seconds while the thinking phase is active
  useEffect(() => {
    if (!isStreaming) return
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [isStreaming])

  // Auto-collapse the reasoning panel once the response text starts
  useEffect(() => {
    if (hasContent && hasToolCalls) {
      setIsOpen(false)
    }
  }, [hasContent, hasToolCalls])

  // Nothing to show
  if (!isStreaming && !hasToolCalls) return null

  const isThinkingPhase = isStreaming && !hasContent

  return (
    <div className="mb-3">
      {/* Header — clickable when there are tool calls to expand/collapse */}
      <button
        type="button"
        onClick={() => hasToolCalls && setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 text-xs transition-colors",
          hasToolCalls
            ? "cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300"
            : "cursor-default",
          "text-zinc-500 dark:text-zinc-400"
        )}
      >
        {isThinkingPhase ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />
        ) : (
          <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
        )}

        <span className="font-medium">
          {isThinkingPhase
            ? "Thinking" + (elapsed > 0 ? `... ${elapsed}s` : "...")
            : `Thought for ${elapsed}s`}
        </span>

        {hasToolCalls && (
          <ChevronDown
            className={cn(
              "h-3 w-3 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        )}
      </button>

      {/* Collapsible reasoning steps (tool calls) */}
      <AnimatePresence initial={false}>
        {isOpen && hasToolCalls && (
          <motion.div
            key="thinking-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 ml-5 border-l-2 border-zinc-200 dark:border-zinc-800 pl-3 space-y-1">
              {toolCalls?.map((tc) => (
                <AgentChatToolCall key={tc.id} toolCall={tc} liveMode={liveMode} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Copy button
// ---------------------------------------------------------------------------
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      aria-label="Copy message"
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </button>
  )
}

// ---------------------------------------------------------------------------
// AgentChatMessage — main exported component
// ---------------------------------------------------------------------------
export function AgentChatMessage({
  message,
  mode = "dry_run",
}: {
  message: ChatMessage
  mode?: "dry_run" | "live"
}) {
  const isUser = message.role === "user"
  const liveMode = mode === "live"

  // ---- User message ----
  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex justify-end items-start gap-2 group"
      >
        <div className="opacity-0 group-hover:opacity-100 transition-opacity pt-1">
          <CopyButton text={message.content} />
        </div>
        <div className="bg-emerald-500 text-white rounded-3xl px-4 py-2.5 max-w-[70%]">
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>
        </div>
      </motion.div>
    )
  }

  // ---- Assistant message ----
  const isStreaming = !!message.isStreaming
  const hasContent = !!message.content
  const hasError = !!message.error
  const hasToolCalls = !!message.toolCalls?.length
  const isInitialLoading =
    isStreaming && !hasContent && !hasToolCalls && !hasError

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex gap-4 items-start"
    >
      {/* Avatar */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
        <Sparkles
          className={cn(
            "h-4 w-4",
            isStreaming
              ? "text-emerald-500 animate-spin-slow"
              : "text-zinc-600 dark:text-zinc-400"
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        {/* Initial loading dots (before any tool call or text arrives) */}
        {isInitialLoading && (
          <div className="flex items-center gap-2 py-2">
            <div className="flex gap-1.5">
              <span className="h-2 w-2 bg-emerald-400 dark:bg-emerald-500 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="h-2 w-2 bg-emerald-400 dark:bg-emerald-500 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="h-2 w-2 bg-emerald-400 dark:bg-emerald-500 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              Thinking...
            </span>
          </div>
        )}

        {/* Thinking / reasoning block — shows once tool calls start */}
        {(hasToolCalls || (isStreaming && !isInitialLoading)) && (
          <ThinkingBlock
            isStreaming={isStreaming}
            hasContent={hasContent}
            toolCalls={message.toolCalls}
            liveMode={liveMode}
          />
        )}

        {/* Streamed text content with smooth character-by-character reveal */}
        {hasContent && (
          <StreamingMarkdown
            content={message.content}
            isStreaming={isStreaming}
          />
        )}

        {/* Error */}
        {hasError && (
          <p className="text-red-500 text-sm mt-2">
            Error: {message.error}
          </p>
        )}

        {/* Action buttons + response cost */}
        {(hasContent || hasError) && !isStreaming && (() => {
          // Compute total cost for this response (live mode, paid tools only)
          const totalCost = liveMode
            ? (message.toolCalls ?? []).reduce((sum, tc) => {
                if (tc.dry_run || tc.loading) return sum
                const c = TOOL_COSTS_USDC[tc.name]
                return sum + (typeof c === "number" ? c : 0)
              }, 0)
            : 0
          const hasPaidCalls = liveMode && (message.toolCalls ?? []).some(
            (tc) => !tc.dry_run && !tc.loading && (TOOL_COSTS_USDC[tc.name] ?? 0) > 0
          )

          return (
            <div className="flex items-center gap-1 mt-3">
              <CopyButton text={message.content} />
              <button className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <ThumbsUp className="h-4 w-4" />
              </button>
              <button className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <ThumbsDown className="h-4 w-4" />
              </button>
              {hasPaidCalls && (
                <span className="ml-1 text-[11px] text-zinc-400 dark:text-zinc-500 tabular-nums">
                  cost:&nbsp;
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    ${totalCost.toFixed(2)}
                  </span>
                </span>
              )}
            </div>
          )
        })()}
      </div>
    </motion.div>
  )
}
