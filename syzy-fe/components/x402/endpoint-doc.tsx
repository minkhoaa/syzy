"use client"

import { cn } from "@/lib/utils"
import { TerminalCard } from "@/components/x402/terminal-card"
import { CodeBlock } from "@/components/x402/code-block"
import { AlertTriangle } from "lucide-react"

interface EndpointDocProps {
  method: "GET" | "POST"
  path: string
  price: string
  description: string
  params?: { name: string; type: string; required: boolean; description: string }[]
  requestExample?: string
  responseExample?: string
  errorExample?: string
  notes?: string[]
}

export function EndpointDoc({
  method,
  path,
  price,
  description,
  params,
  requestExample,
  responseExample,
  errorExample,
  notes,
}: EndpointDocProps) {
  const isFree = price === "Free"

  return (
    <TerminalCard className="pt-6 relative">
      <div className="pb-4 border-b border-black/10 dark:border-white/10 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={cn(
              "px-2.5 py-1 text-[10px] font-mono tracking-wide",
              method === "POST"
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-500 border border-blue-500/20"
                : "bg-green-500/10 text-green-600 dark:text-green-500 border border-green-500/20"
            )}
          >
            {method}
          </span>
          <code className="font-mono text-base text-black dark:text-white">{path}</code>
          <div
            className={cn(
              "ml-auto text-[10px] font-mono px-2.5 py-1 border",
              isFree
                ? "bg-green-500/10 text-green-600 dark:text-green-500 border-green-500/20"
                : "bg-teal-500/10 text-teal-600 dark:text-teal-500 border-teal-500/20"
            )}
          >
            {isFree ? "Free" : price}
          </div>
        </div>
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl">{description}</p>
      </div>

      <div className="space-y-8 pb-2">
        {params && params.length > 0 && (
          <div>
            <h4 className="mb-3 text-xs font-mono tracking-wide text-zinc-500 uppercase">Parameters</h4>
            <div className="overflow-x-auto border border-black/10 dark:border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
                    <th className="px-4 py-2.5 text-left font-mono text-xs text-zinc-500 font-normal">Name</th>
                    <th className="px-4 py-2.5 text-left font-mono text-xs text-zinc-500 font-normal">Type</th>
                    <th className="px-4 py-2.5 text-left font-mono text-xs text-zinc-500 font-normal">Required</th>
                    <th className="px-4 py-2.5 text-left font-mono text-xs text-zinc-500 font-normal">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {params.map((param) => (
                    <tr key={param.name} className="border-b border-black/5 dark:border-white/5 last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-green-600 dark:text-green-500">{param.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">{param.type}</td>
                      <td className="px-4 py-3">
                        {param.required ? (
                          <span className="text-xs font-mono text-teal-600 dark:text-teal-500">Required</span>
                        ) : (
                          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-600">Optional</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{param.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {requestExample && (
          <div>
            <h4 className="mb-3 text-xs font-mono tracking-wide text-zinc-500 uppercase">Request Body</h4>
            <CodeBlock code={requestExample || ""} language="json" />
          </div>
        )}

        {responseExample && (
          <div>
            <h4 className="mb-3 text-xs font-mono tracking-wide text-zinc-500 uppercase">Success Response</h4>
            <CodeBlock code={responseExample || ""} language="json" />
          </div>
        )}

        {errorExample && (
          <div>
            <h4 className="mb-3 text-xs font-mono tracking-wide text-zinc-500 uppercase">Error / Alternative Response</h4>
            <CodeBlock code={errorExample || ""} language="json" />
          </div>
        )}

        {notes && notes.length > 0 && (
          <div className="border border-teal-500/20 bg-teal-500/10 dark:bg-teal-500/5 p-4">
            <ul className="space-y-2">
              {notes.map((note, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-teal-600 dark:text-teal-400">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
                  {note}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </TerminalCard>
  )
}
