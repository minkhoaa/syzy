"use client";

import { cn } from '@/lib/utils';

interface BinaryOutcomeButtonProps {
    label: string;
    price: number; // 0 to 1
    side: 'yes' | 'no';
    onClick: (e: React.MouseEvent) => void;
    compact?: boolean;
    selected?: boolean;
    disabled?: boolean;
}

export function BinaryOutcomeButton({ label, price, side, onClick, compact = false, selected, disabled }: BinaryOutcomeButtonProps) {
    const isYes = side === 'yes';
    const prob = (price * 100).toFixed(2);
    // Use Emerald for Yes, keep Primary (Orange) for No
    const textClass = isYes ? "text-emerald-600 dark:text-emerald-500" : "text-red-600 dark:text-red-500";
    const bgClass = isYes ? "bg-emerald-500/10" : "bg-red-500/10";
    const borderClass = isYes ? "border-emerald-500" : "border-red-500";
    const ringClass = isYes ? "ring-emerald-500/20" : "ring-red-500/20";
    const shadowClass = isYes ? "shadow-glow-emerald" : "shadow-glow-red";

    return (
        <button
            onClick={(e) => !disabled && onClick(e)}
            disabled={disabled}
            className={cn(
                "group/btn relative rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center overflow-hidden",
                "bg-gradient-to-br from-surface-1 to-surface-2",
                "shadow-sm transition-all duration-300",
                !disabled && "hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]",
                disabled && "opacity-50 cursor-not-allowed grayscale-[0.5]",
                selected !== undefined
                    ? selected
                        ? isYes
                            ? `${borderClass} ${bgClass} ring-2 ${ringClass} ${shadowClass}` // Emerald for Yes
                            : `${borderClass} ${bgClass} ring-2 ${ringClass} ${shadowClass}` // Red for No
                        : "border-border/50 text-muted-foreground hover:border-foreground/20"
                    : isYes
                        ? "border-border/50 hover:border-emerald-500 hover:shadow-glow-emerald"
                        : "border-border/50 hover:border-red-500 hover:shadow-glow-red",
                compact ? "h-12" : "h-16"
            )}
        >
            {/* Animated gradient background on hover */}
            <div className={cn(
                "absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 pointer-events-none",
                isYes
                    ? "bg-gradient-to-br from-emerald-500/10 to-emerald-500/5"
                    : "bg-gradient-to-br from-red-500/10 to-red-500/5"
            )} />

            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer transition-opacity duration-300 pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between w-full px-3 gap-2">
                <span className={cn(
                    "font-bold uppercase tracking-wide shrink-0 transition-all duration-300",
                    selected !== undefined && !selected
                        ? "text-muted-foreground"
                        : textClass, // Always use colored text (Green/Red) for visibility
                    compact ? "text-[10px]" : "text-sm"
                )}>
                    {label}
                </span>
                <span className={cn(
                    "font-black tabular-nums shrink-0 transition-all duration-300",
                    selected !== undefined && !selected
                        ? "text-muted-foreground"
                        : textClass,
                    selected && "animate-number-roll",
                    compact ? "text-sm" : "text-2xl"
                )}>
                    {prob}%
                </span>
            </div>
            {/* Enhanced Progress Bar */}
            <div className="absolute bottom-0 left-0 h-1.5 bg-muted/20 w-full">
                <div
                    className={cn(
                        "h-full relative overflow-hidden transition-all duration-700",
                        selected !== undefined && !selected
                            ? "bg-muted-foreground/20"
                            : isYes ? "bg-emerald-500" : "bg-red-500"
                    )}
                    style={{ width: `${prob}%` }}
                >
                    {/* Shimmer on progress bar */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </div>
            </div>
        </button>
    );
}