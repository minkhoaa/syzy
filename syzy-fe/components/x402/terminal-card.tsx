"use client"

import { cn } from "@/lib/utils"
import { motion, HTMLMotionProps } from "framer-motion"

interface TerminalCardProps extends HTMLMotionProps<"div"> {
    className?: string
    children: React.ReactNode
    delay?: number
    label?: string
}

export function TerminalCard({
    className,
    children,
    delay = 0,
    label,
    ...props
}: TerminalCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4, delay }}
            className={cn(
                "relative p-6 sm:p-8 border border-black/10 dark:border-white/10 bg-white dark:bg-black group",
                className
            )}
            {...props}
        >
            {/* Corner Brackets */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-zinc-400 dark:border-zinc-500 opacity-50 -translate-x-[1px] -translate-y-[1px]" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-zinc-400 dark:border-zinc-500 opacity-50 translate-x-[1px] -translate-y-[1px]" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-zinc-400 dark:border-zinc-500 opacity-50 -translate-x-[1px] translate-y-[1px]" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-zinc-400 dark:border-zinc-500 opacity-50 translate-x-[1px] translate-y-[1px]" />

            {/* Optional Label (e.g. [01] or [P1]) */}
            {label && (
                <div className="absolute top-0 left-6 -translate-y-1/2 bg-white dark:bg-black px-2">
                    <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-500 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">[{label}]</span>
                </div>
            )}

            {children}
        </motion.div>
    )
}
