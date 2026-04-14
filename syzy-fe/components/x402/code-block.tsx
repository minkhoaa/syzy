"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Copy, Check } from "lucide-react"
import { TerminalCard } from "./terminal-card"

interface CodeBlockProps {
  code: string
  language: "bash" | "typescript" | "json" | "curl"
  title?: string
  className?: string
}

export function CodeBlock({ code, language, title, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <TerminalCard className={cn("!p-0 border-white/10 bg-transparent flex flex-col h-full", className)}>
      <div className="flex flex-col h-full">
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <span className="text-xs text-zinc-500 font-mono tracking-widest uppercase">
              {title}
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-white transition-colors uppercase tracking-widest"
              aria-label="Copy code"
            >
              {copied ? <span className="text-emerald-500">Copied</span> : "Copy"}
            </button>
          </div>
        )}
        <div className="p-6 overflow-x-auto flex-1 flex flex-col justify-end">
          <pre className="text-[13px] font-mono text-zinc-400 leading-relaxed max-w-full whitespace-pre-wrap break-all md:whitespace-pre md:break-normal">
            <code>{code}</code>
          </pre>
        </div>
      </div>
    </TerminalCard>
  )
}
