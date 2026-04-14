import { motion, Variants } from "framer-motion"
import React from "react"

interface TimelineContentProps {
    children?: React.ReactNode
    animationNum: number
    className?: string
    timelineRef?: React.RefObject<HTMLElement | null>
    as?: "div" | "h1" | "h2" | "h3" | "p" | "span" | "section"
    customVariants?: Variants
    once?: boolean
}

// Pre-created motion components (declared outside render to satisfy react-compiler)
const motionComponents = {
    div: motion.div,
    h1: motion.create("h1"),
    h2: motion.create("h2"),
    h3: motion.create("h3"),
    p: motion.create("p"),
    span: motion.create("span"),
    section: motion.create("section"),
} as Record<string, typeof motion.div>;

export const TimelineAnimation = ({
    children,
    animationNum,
    timelineRef,
    className,
    as = "div",
    customVariants,
    once = true,
    ...props
}: TimelineContentProps) => {
    const defaultSequenceVariants: Variants = {
        visible: (i: number) => ({
            filter: "blur(0px)",
            y: 0,
            opacity: 1,
            transition: {
                delay: i * 0.1, // Faster delay for snappier feel
                duration: 0.5,
                ease: "easeOut"
            },
        }),
        hidden: {
            filter: "blur(20px)",
            y: 20,
            opacity: 0,
        },
    }

    const sequenceVariants = customVariants || defaultSequenceVariants

    const Component = motionComponents[as] || motionComponents.div

    return (
        <Component
            initial="hidden"
            whileInView="visible"
            viewport={{ once }}
            custom={animationNum}
            variants={sequenceVariants}
            className={className}
            {...props}
        >
            {children}
        </Component>
    )
}
