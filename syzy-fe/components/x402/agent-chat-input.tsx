"use client"

import {
  useRef,
  useCallback,
  type KeyboardEvent,
  type ChangeEvent,
} from "react"
import { ArrowUp, Square } from "lucide-react"
import { cn } from "@/lib/utils"

interface AgentChatInputProps {
  onSend: (message: string) => void
  onStop: () => void
  isStreaming: boolean
  disabled?: boolean
  mode: "dry_run" | "live"
  onModeChange: (mode: "dry_run" | "live") => void
}

export function AgentChatInput({
  onSend,
  onStop,
  isStreaming,
  disabled,
  mode,
  onModeChange,
}: AgentChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = "auto"
    const maxHeight = 200
    ta.style.height = `${Math.min(ta.scrollHeight, maxHeight)}px`
  }, [])

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    adjustHeight()
    void e
  }

  const handleSend = () => {
    const value = textareaRef.current?.value.trim()
    if (!value || isStreaming) return
    onSend(value)
    if (textareaRef.current) {
      textareaRef.current.value = ""
      textareaRef.current.style.height = "auto"
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 overflow-hidden shadow-sm">
      <textarea
        ref={textareaRef}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled || isStreaming}
        placeholder="Send a message..."
        rows={1}
        className="w-full resize-none bg-transparent px-4 pt-4 pb-2 text-sm text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none disabled:opacity-50 min-h-[52px]"
      />
      <div className="flex items-center justify-between px-4 pb-3">
        <button
          onClick={() =>
            onModeChange(mode === "dry_run" ? "live" : "dry_run")
          }
          className={cn(
            "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-colors cursor-pointer",
            mode === "live"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-teal-500/10 text-teal-600 dark:text-teal-400"
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              mode === "live" ? "bg-emerald-500" : "bg-teal-500"
            )}
          />
          {mode === "live" ? "Live" : "Dry Run"}
        </button>

        {isStreaming ? (
          <button
            onClick={onStop}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black hover:opacity-80 transition-opacity cursor-pointer"
            aria-label="Stop generating"
          >
            <Square className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={disabled}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black hover:opacity-80 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Send message"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
