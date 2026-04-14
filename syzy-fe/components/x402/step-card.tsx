"use client"

import { TerminalCard } from "./terminal-card"

interface StepCardProps {
  step: number
  title: string
  description: string
  icon: React.ReactNode
  delay?: number
}

export function StepCard({ step, title, description, icon, delay = 0 }: StepCardProps) {
  return (
    <TerminalCard delay={delay} label={step.toString()} className="flex flex-col text-left space-y-6 flex-1 min-h-[200px]">
      <div className="font-mono text-zinc-500 dark:text-zinc-600 border-b border-black/10 dark:border-white/10 pb-4 mb-2">
        {/* Top area mimic */}
        <span className="text-emerald-600 dark:text-emerald-500">#</span> Step 0{step}
      </div>

      <div className="flex-1">
        <h3 className="text-2xl font-bold text-black dark:text-white mb-3 tracking-tighter">{title}</h3>
        <p className="text-base text-zinc-600 dark:text-zinc-500 leading-relaxed font-medium">
          {description}
        </p>
      </div>

      <div className="pt-4 border-t border-black/5 dark:border-white/5 opacity-50">
        {/* Visual filler */}
        <div className="h-1 w-8 bg-emerald-600/20 dark:bg-emerald-500/20" />
      </div>
    </TerminalCard>
  )
}
