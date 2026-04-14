"use client"

import { TerminalCard } from "./terminal-card"

interface UseCaseCardProps {
  icon: React.ReactNode
  title: string
  description: string
  cost: string
  delay?: number
  label?: string
}

export function UseCaseCard({ icon, title, description, cost, delay = 0, label }: UseCaseCardProps) {
  return (
    <TerminalCard delay={delay} label={label} className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="text-zinc-400">
          {icon}
        </div>
      </div>

      <div className="space-y-4 flex-1">
        <h3 className="text-2xl font-bold text-black dark:text-white tracking-tighter">{title}</h3>
        <p className="text-base text-zinc-600 dark:text-zinc-500 leading-relaxed font-medium">{description}</p>
      </div>

      <div className="pt-4 border-t border-black/5 dark:border-white/5 font-mono">
        <div className="text-[11px] text-zinc-500 dark:text-zinc-600 mb-2 tracking-widest uppercase">Pricing</div>
        <div className="text-emerald-600 dark:text-emerald-500 font-medium">
          {cost}
        </div>
      </div>
    </TerminalCard>
  )
}
