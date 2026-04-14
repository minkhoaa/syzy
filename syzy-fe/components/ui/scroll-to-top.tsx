"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronUp } from "lucide-react"

export const ScrollToTopButton = () => {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true)
            } else {
                setIsVisible(false)
            }
        }

        window.addEventListener("scroll", toggleVisibility)
        return () => window.removeEventListener("scroll", toggleVisibility)
    }, [])

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        })
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={scrollToTop}
                    className="fixed bottom-8 right-8 z-50 p-3 bg-white border border-neutral-200 rounded-full shadow-lg hover:shadow-xl hover:bg-neutral-50 transition-all group overflow-hidden"
                    aria-label="Scroll to top"
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-teal-100 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    <ChevronUp className="w-5 h-5 text-neutral-600 relative z-10" />
                </motion.button>
            )}
        </AnimatePresence>
    )
}
