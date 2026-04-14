"use client"
import { cn } from "@/lib/utils"
import React, { useEffect, useState, type JSX } from "react"

export function Blocks({
    activeDivs,
    divClass,
    classname,
    activeDivsClass,
    containerRef,
}: {
    activeDivsClass?: string
    activeDivs?: any
    divClass?: string
    classname?: string
    containerRef: React.RefObject<HTMLDivElement | null>
}) {
    const [blocks, setBlocks] = useState<JSX.Element[]>([])

    useEffect(() => {
        const updateBlocks = () => {
            const container = containerRef.current
            if (container) {
                const containerWidth = container.clientWidth
                const containerHeight = container.clientHeight
                const blockSize = containerWidth * 0.05 // Adjusted to 5% for better density

                const columns = Math.ceil(containerWidth / blockSize)
                const rows = Math.ceil(containerHeight / blockSize)

                const newBlocks = Array.from({ length: columns }, (_, columnIndex) => (
                    <div key={columnIndex} className="w-[5vw] h-full">
                        {Array.from({ length: rows }, (_, rowIndex) => (
                            <div
                                key={rowIndex}
                                className={cn(
                                    `h-[5vw] w-full border border-neutral-100/50 dark:border-neutral-800/50 ${
                                    // @ts-ignore
                                    activeDivs?.[columnIndex]?.has(rowIndex)
                                        ? `${activeDivsClass}`
                                        : ""
                                    }`,
                                    divClass
                                )}
                                style={{ height: `${blockSize}px` }}
                            ></div>
                        ))}
                    </div>
                ))

                setBlocks(newBlocks)
            }
        }

        updateBlocks()
        window.addEventListener("resize", updateBlocks)

        return () => window.removeEventListener("resize", updateBlocks)
    }, [activeDivs, activeDivsClass, divClass, containerRef])

    return (
        <div
            className={cn(
                "flex h-full overflow-hidden absolute inset-0 pointer-events-none z-0",
                classname
            )}
        >
            {blocks}
        </div>
    )
}
