"use client";

import { motion } from "framer-motion";
import { Lock, TrendingUp, Zap, Brain, ArrowRight, ShieldCheck, Activity, Eye, EyeOff, BarChart2, Radio, Terminal } from "lucide-react";
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

// --- DESIGN SYSTEM (Financial Industrial - Light/Dark) ---

const useCounter = (end: number, duration: number = 2) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let start = 0;
        const endCount = end;
        const totalDuration = duration * 1000;
        const incrementTime = totalDuration / endCount;

        const timer = setInterval(() => {
            start += 1;
            setCount(start);
            if (start === endCount) clearInterval(timer);
        }, incrementTime);

        const reset = setInterval(() => {
            start = 0;
            setCount(0);
        }, totalDuration + 2000);

        return () => {
            clearInterval(timer);
            clearInterval(reset);
        }
    }, [end, duration]);
    return count;
};

// --- VISUAL 1: SHIELD ---
export const ShieldVisual = () => {
    return (
        <div className="w-full h-full min-h-[12rem] flex items-center justify-center p-4 bg-neutral-50/50 dark:bg-neutral-950/50 relative overflow-hidden font-sans group">
            {/* Background - Technical Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-[size:16px_16px] opacity-50 dark:opacity-[0.08]" />

            <div className="relative z-10 w-full max-w-[95%] bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden transition-all duration-300 group-hover:translate-y-[-2px] group-hover:shadow-md">
                {/* Card Header */}
                <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/50 flex justify-between items-center">
                    <span className="text-[10px] bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">ZK-SNARK</span>
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                        <div className="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                    </div>
                </div>

                <div className="p-3 space-y-3">
                    {/* Step 1: Input */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-6 h-6 shrink-0 rounded bg-teal-50 dark:bg-teal-500/10 border border-teal-100 dark:border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400">
                                <Eye className="w-3 h-3" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[11px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">Public Input</span>
                                <span className="text-[9px] font-mono text-neutral-400 dark:text-neutral-500 truncate">0x7a...4bf2</span>
                            </div>
                        </div>
                        <div className="text-[10px] font-mono font-medium text-neutral-900 dark:text-neutral-100 shrink-0">+50 SOL</div>
                    </div>

                    {/* Connection Line */}
                    <div className="flex justify-center -my-2 relative z-0">
                        <div className="h-6 w-px bg-neutral-100 dark:bg-neutral-700 relative overflow-hidden">
                            <motion.div
                                className="absolute inset-0 bg-neutral-300 dark:bg-neutral-500"
                                animate={{ top: ["-100%", "100%"] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            />
                        </div>
                    </div>

                    {/* Step 2: Mixer */}
                    <div className="relative bg-neutral-900 dark:bg-white rounded border border-neutral-800 dark:border-neutral-300 p-2.5 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-3 h-3 text-white dark:text-neutral-900" />
                            <span className="text-white dark:text-neutral-900 text-[11px] font-medium tracking-tight">Proof Gen</span>
                        </div>
                        <div className="flex gap-0.5">
                            {[1, 2, 3].map(i => (
                                <motion.div
                                    key={i}
                                    className="w-0.5 h-2 bg-teal-500 rounded-sm"
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Out Connection */}
                    <div className="flex justify-center -my-2 relative z-0">
                        <div className="h-6 w-px bg-neutral-100 dark:bg-neutral-700" />
                    </div>

                    {/* Step 3: Output */}
                    <div className="flex items-center justify-between opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-6 h-6 shrink-0 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                                <EyeOff className="w-3 h-3" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[11px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">Private Output</span>
                                <span className="text-[9px] font-mono text-neutral-400 dark:text-neutral-500 blur-[2px]">0x******</span>
                            </div>
                        </div>
                        <div className="text-[10px] font-mono font-medium text-neutral-900 dark:text-neutral-100 shrink-0">50 SOL</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- VISUAL 2: PUMP ---
export const PumpVisual = () => {
    return (
        <div className="w-full h-full min-h-[12rem] flex flex-col pt-6 px-6 bg-neutral-50/30 dark:bg-neutral-950/30 relative overflow-hidden font-sans">
            <div className="flex justify-between items-start mb-2 z-10 w-full">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                        <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">Bonding Curve</span>
                    </div>
                    <div className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">85.4<span className="text-lg text-neutral-400 dark:text-neutral-500">%</span></div>
                </div>
                <div className="text-right shrink-0">
                    <div className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1">Current MC</div>
                    <div className="text-sm font-mono font-medium text-neutral-900 dark:text-white bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 rounded shadow-sm">$42,500</div>
                </div>
            </div>
            <div className="flex-1 w-full relative min-h-[8rem]">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0">
                    {[1, 2, 3, 4].map(i => <div key={i} className="w-full h-px bg-neutral-100 dark:bg-neutral-800" />)}
                </div>
                <svg className="w-full h-full overflow-visible z-10 relative" preserveAspectRatio="xMidYMid meet" viewBox="0 0 320 160">
                    <defs>
                        <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#5eead4" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#5eead4" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <motion.path
                        d="M0 160 C 100 160, 160 120, 220 60 C 260 20, 290 20, 320 20 V 160 H 0 Z"
                        fill="url(#curveGradient)"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 1 }}
                    />
                    <motion.path
                        d="M0 160 C 100 160, 160 120, 220 60 C 260 20, 290 20, 320 20"
                        fill="none"
                        stroke="#5eead4"
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                    <motion.circle
                        cx="220" cy="60" r="5" fill="currentColor" className="text-white dark:text-neutral-900" stroke="#5eead4" strokeWidth="2"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ delay: 0.5, duration: 0.3 }}
                    />
                </svg>
                <motion.div
                    className="absolute top-[25%] left-[60%] translate-x-3 z-20"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 12 }}
                    transition={{ delay: 1, duration: 0.5 }}
                >
                    <div className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[10px] px-2 py-1 rounded font-mono shadow-xl relative whitespace-nowrap">
                        Buy: +12.5%
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

// --- VISUAL 3: INSTANT ---
export const InstantVisual = () => {
    const ms = useCounter(14, 0.5);

    return (
        <div className="w-full h-full min-h-[12rem] bg-neutral-50/30 dark:bg-neutral-950/30 p-6 relative overflow-hidden flex flex-col justify-between group">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#e5e5e5_1px,transparent_1px)] [background-size:20px_20px] opacity-50 dark:opacity-[0.08]" />

            {/* Header */}
            <div className="flex justify-between items-center z-10 w-full">
                <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-teal-50 dark:bg-teal-500/10 border border-teal-100 dark:border-teal-500/20">
                        <Zap className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                    </div>
                    <span className="text-[10px] font-semibold text-neutral-900 dark:text-neutral-100 tracking-wide">LATENCY</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            </div>

            {/* Stat */}
            <div className="relative z-10 text-center my-auto transition-transform duration-300 group-hover:scale-105">
                <div className="font-mono text-7xl font-medium text-neutral-900 dark:text-white tracking-tighter tabular-nums flex items-baseline justify-center leading-none">
                    <motion.span
                        key={ms}
                        initial={{ opacity: 0.8, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {ms}
                    </motion.span>
                    <span className="text-2xl text-neutral-400 dark:text-neutral-500 ml-1 font-sans font-normal lowercase">ms</span>
                </div>
                <div className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-2 font-medium tracking-widest uppercase">Settlement Time</div>
            </div>

            {/* Footer */}
            <div className="z-10 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded border border-neutral-200 dark:border-neutral-700 p-2 flex justify-between items-center shadow-sm w-full">
                <span className="text-[9px] font-mono text-neutral-500 dark:text-neutral-400 w-full text-center">HELIUS RPC NODES</span>
            </div>
        </div>
    );
};

// --- VISUAL 4: AI ---
export const AIVisual = () => {
    return (
        <div className="w-full h-full min-h-[12rem] bg-neutral-50/30 dark:bg-neutral-950/30 p-6 relative overflow-hidden flex flex-col font-sans">
            {/* Header */}
            <div className="flex items-center justify-between mb-5 w-full">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">SENTIMENT.AI</span>
                </div>
                <div className="flex text-[9px] font-mono gap-3 text-neutral-400 dark:text-neutral-500">
                    <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-green-500" /> ONLINE</span>
                </div>
            </div>

            {/* Metrics */}
            <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                <div className="bg-white dark:bg-neutral-800/60 rounded-lg p-3 border border-neutral-200 dark:border-neutral-700 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-green-200 dark:hover:border-green-500/30 transition-colors">
                    <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase">Trend Signal</span>
                    <div className="mt-2">
                        <div className="text-xl font-bold text-green-600 dark:text-green-400 tracking-tight flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            BULLISH <ArrowRight className="w-4 h-4 -rotate-45" />
                        </div>
                        <div className="w-full h-1 bg-neutral-100 dark:bg-neutral-700 mt-2 rounded-full overflow-hidden">
                            <motion.div className="h-full bg-green-500" initial={{ width: 0 }} whileInView={{ width: "84%" }} transition={{ duration: 1 }} />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <MetricRow label="Social Vol" value="High" color="text-teal-600 dark:text-teal-400" />
                    <MetricRow label="Confidence" value="92%" color="text-neutral-900 dark:text-neutral-100" />
                    <MetricRow label="RSI (14)" value="64.2" color="text-neutral-900 dark:text-neutral-100" />
                </div>
            </div>

            {/* Ticker */}
            <div className="mt-4 pt-3 border-t border-neutral-200/50 dark:border-neutral-700/50 w-full">
                <div className="flex gap-2 overflow-hidden opacity-70 hover:opacity-100 transition-opacity">
                    <TickerItem symbol="$WIF" change="+14%" />
                    <TickerItem symbol="$POPCAT" change="+8.2%" />
                    <TickerItem symbol="$SOL" change="+4.5%" />
                </div>
            </div>
        </div>
    );
};

const MetricRow = ({ label, value, color }: { label: string, value: string, color: string }) => (
    <div className="flex items-center justify-between bg-white dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-700 px-2 py-1.5 rounded shadow-sm">
        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">{label}</span>
        <span className={cn("text-xs font-bold font-mono", color)}>{value}</span>
    </div>
);

const TickerItem = ({ symbol, change }: { symbol: string, change: string }) => (
    <div className="shrink-0 bg-white dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 px-2 py-1 rounded flex items-center gap-2 shadow-sm">
        <span className="text-[10px] font-bold text-neutral-700 dark:text-neutral-200">{symbol}</span>
        <span className="text-[9px] font-mono text-green-600 dark:text-green-400">{change}</span>
    </div>
);
