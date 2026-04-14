"use client";
import React, { useRef, useState } from "react";
import { useMotionValueEvent, useScroll, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const StickyScroll = ({
    content,
    contentClassName,
}: {
    content: {
        title: string;
        description: string;
        content?: React.ReactNode | any;
    }[];
    contentClassName?: string;
}) => {
    const [activeCard, setActiveCard] = useState(0);
    const ref = useRef<any>(null);

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end end"],
    });

    const cardLength = content.length;

    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        const index = Math.min(
            Math.max(Math.floor(latest * cardLength), 0),
            cardLength - 1
        );
        setActiveCard(index);
    });

    return (
        <div ref={ref} className="relative w-full">
            <div className="flex w-full max-w-6xl mx-auto relative px-4 sm:px-6 lg:px-10">

                {/* ── Desktop layout: text left, sticky image right ── */}
                <div className="hidden lg:flex w-full">
                    {/* Left: Text */}
                    <div className="w-1/2 py-[10vh]">
                        {content.map((item, index) => (
                            <div key={item.title + index} className="h-screen flex flex-col justify-center">
                                <motion.h2
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: activeCard === index ? 1 : 0.3 }}
                                    transition={{ duration: 0.5 }}
                                    className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-6"
                                >
                                    {item.title}
                                </motion.h2>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: activeCard === index ? 1 : 0.3 }}
                                    transition={{ duration: 0.5 }}
                                    className="text-xl text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed"
                                >
                                    {item.description}
                                </motion.p>
                            </div>
                        ))}
                    </div>

                    {/* Right: Sticky image */}
                    <div className="w-1/2 sticky top-0 h-screen flex items-center justify-center pt-20">
                        <div
                            className={cn(
                                "h-[500px] w-[500px] relative flex items-center justify-center",
                                contentClassName
                            )}
                        >
                            {content.map((item, index) => (
                                <motion.div
                                    key={item.title + index}
                                    initial={{ opacity: 0 }}
                                    animate={{
                                        opacity: activeCard === index ? 1 : 0,
                                        scale: activeCard === index ? 1 : 0.95,
                                    }}
                                    transition={{ duration: 0.5, ease: "easeInOut" }}
                                    className="absolute inset-0 h-full w-full flex items-center justify-center p-8 origin-center"
                                >
                                    {item.content}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Mobile layout: sticky image top, text scrolls below ── */}
                <div className="flex flex-col w-full lg:hidden">
                    {/* Sticky image area — uses mask-image to fade edges instead of hard cut */}
                    <div
                        className="sticky top-14 z-10 pt-4 pb-6 bg-linear-to-b from-white via-white to-transparent dark:from-black dark:via-black dark:to-transparent"
                    >
                        {/* White cover above to hide text scrolling behind header */}
                        <div className="absolute -top-20 left-0 right-0 h-24 bg-white dark:bg-black z-10" />
                        <div
                            className={cn(
                                "relative w-full aspect-square max-w-[260px] sm:max-w-[300px] mx-auto",
                                contentClassName
                            )}
                            style={{
                                WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 50% 45%, black 50%, transparent 100%)",
                                maskImage: "radial-gradient(ellipse 70% 70% at 50% 45%, black 50%, transparent 100%)",
                            }}
                        >
                            {content.map((item, index) => (
                                <motion.div
                                    key={item.title + index}
                                    initial={{ opacity: 0 }}
                                    animate={{
                                        opacity: activeCard === index ? 1 : 0,
                                        scale: activeCard === index ? 1 : 0.9,
                                    }}
                                    transition={{ duration: 0.4, ease: "easeInOut" }}
                                    className="absolute inset-0 h-full w-full flex items-center justify-center p-4 origin-center"
                                >
                                    {item.content}
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Scrollable text items */}
                    <div className="pt-0">
                        {content.map((item, index) => (
                            <div key={item.title + index} className="min-h-[70vh] flex flex-col justify-center py-8">
                                <motion.h2
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: activeCard === index ? 1 : 0.3 }}
                                    transition={{ duration: 0.5 }}
                                    className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4"
                                >
                                    {item.title}
                                </motion.h2>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: activeCard === index ? 1 : 0.3 }}
                                    transition={{ duration: 0.5 }}
                                    className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed"
                                >
                                    {item.description}
                                </motion.p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};
