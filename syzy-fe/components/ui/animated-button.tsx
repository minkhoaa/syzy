"use client"
import React, { useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode
    className?: string
}

export const AnimatedButton = ({ children, className, ...props }: AnimatedButtonProps) => {
    const divRef = useRef<HTMLButtonElement>(null)
    const [isFocused, setIsFocused] = useState(false)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [opacity, setOpacity] = useState(0)

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!divRef.current || isFocused) return

        const div = divRef.current
        const rect = div.getBoundingClientRect()

        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    }

    const handleFocus = () => {
        setIsFocused(true)
        setOpacity(1)
    }

    const handleBlur = () => {
        setIsFocused(false)
        setOpacity(0)
    }

    const handleMouseEnter = () => {
        setOpacity(1)
    }

    const handleMouseLeave = () => {
        setOpacity(0)
    }

    return (
        <button
            ref={divRef}
            onMouseMove={handleMouseMove}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={cn(
                "relative inline-flex w-fit items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-background px-8 py-3 font-medium text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 focus:ring-offset-neutral-50 cursor-pointer",
                className
            )}
            {...props}
        >
            <div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
                style={{
                    opacity,
                    background: `radial-gradient(100px circle at ${position.x}px ${position.y}px, rgba(45, 212, 191, 0.15), transparent)`,
                }}
            />
            <span className="relative z-20 flex items-center">{children}</span>
        </button>
    )
}
