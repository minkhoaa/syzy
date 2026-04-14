"use client"

import { cn } from "@/lib/utils"
import { CodeBlock } from "@/components/x402/code-block"

interface ResponseExampleProps {
  title: string
  json: string
  className?: string
}

export function ResponseExample({ title, json, className }: ResponseExampleProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <CodeBlock code={json} language="json" />
    </div>
  )
}
