"use client"

import { cn } from "@/lib/utils"
import { TerminalCard } from "./terminal-card"

interface Endpoint {
  method: string
  path: string
  price: string
  description: string
}

interface CapabilityGroupProps {
  title: string
  description?: string
  endpoints: Endpoint[]
  delay?: number
  label?: string
}

export function CapabilityGroup({ title, description, endpoints, delay = 0, label }: CapabilityGroupProps) {
  return (
    <TerminalCard delay={delay} label={label} className="!p-0 border-r-0 border-l-0 border-b-0 sm:border !bg-transparent sm:!bg-white dark:sm:!bg-black">
      <div className="py-6 sm:p-8">
        <h4 className="text-xl font-bold text-black dark:text-white mb-4">
          {title}
        </h4>
        {description && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-8 max-w-sm">
            {description}
          </p>
        )}

        <div className="flex flex-col gap-2 font-mono text-xs">
          {endpoints.map((ep, i) => (
            <div
              key={`${ep.method}-${ep.path}`}
              className="flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <span className="text-zinc-500 dark:text-zinc-600 w-16 group-hover:text-emerald-600 dark:group-hover:text-emerald-500 transition-colors">{ep.method.toLowerCase()}</span>
                <span className="text-zinc-400 dark:text-zinc-500 group-hover:text-black dark:group-hover:text-white transition-colors">- {ep.price}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </TerminalCard>
  )
}
