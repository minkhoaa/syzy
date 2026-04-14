"use client"

import { TerminalCard } from "./terminal-card"

interface SafetyCardProps {
  icon?: React.ReactNode
  title: string
  description: string
  delay?: number
  label?: string
}

export function SafetyCard({ icon, title, description, delay = 0, label }: SafetyCardProps) {
  return (
    <TerminalCard delay={delay} label={label} className="!p-8">
      <div className="text-left">
        <h4 className="text-lg font-bold text-black dark:text-white mb-2 tracking-tight">{title}</h4>
        <p className="text-sm text-zinc-600 dark:text-zinc-500 leading-relaxed font-medium">{description}</p>
      </div>
    </TerminalCard>
  )
}
