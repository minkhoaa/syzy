"use client";
import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
    children: ReactNode;
    showRadialGradient?: boolean;
}

export const AuroraBackground = ({
    className,
    children,
    showRadialGradient = true,
    ...props
}: AuroraBackgroundProps) => {
    return (
        <div
            className={cn(
                "relative flex flex-col h-full items-center justify-center bg-white dark:bg-black text-slate-950 transition-bg",
                className
            )}
            {...props}
        >
            <div
                className={cn(
                    `
            [--white-gradient:repeating-linear-gradient(100deg,#f0fdf4_0%,#f0fdf4_7%,transparent_10%,transparent_12%,#f0fdf4_16%)]
            [--dark-gradient:repeating-linear-gradient(100deg,#000000_0%,#000000_7%,transparent_10%,transparent_12%,#000000_16%)]
            [--aurora:repeating-linear-gradient(100deg,#80d4b8_10%,#e6f7f0_20%,#b0e8d0_30%,#e0f5ed_40%,#80d4b8_50%)]
            dark:[--aurora:repeating-linear-gradient(100deg,#0a0a0a_10%,#0d2b20_20%,#051510_30%,#0d2b20_40%,#0a0a0a_50%)]
            [background-image:var(--white-gradient),var(--aurora)]
            dark:[background-image:var(--dark-gradient),var(--aurora)]
            [background-size:300%,_200%]
            [background-position:50%_50%,50%_50%]
            filter blur-[10px]
            absolute -inset-[10px] opacity-100 will-change-transform`
                )}
            />

            <div
                className={cn(
                    `
            [--white-gradient:repeating-linear-gradient(100deg,#f0fdf4_0%,#f0fdf4_7%,transparent_10%,transparent_12%,#f0fdf4_16%)]
            [--dark-gradient:repeating-linear-gradient(100deg,#000000_0%,#000000_7%,transparent_10%,transparent_12%,#000000_16%)]
            [--aurora:repeating-linear-gradient(100deg,#80d4b8_10%,#e6f7f0_20%,#b0e8d0_30%,#e0f5ed_40%,#80d4b8_50%)]
            dark:[--aurora:repeating-linear-gradient(100deg,#0a0a0a_10%,#0d2b20_20%,#051510_30%,#0d2b20_40%,#0a0a0a_50%)]
            [background-image:var(--white-gradient),var(--aurora)]
            dark:[background-image:var(--dark-gradient),var(--aurora)]
            [background-size:200%,_100%]
            [background-attachment:fixed]
            absolute -inset-[10px] opacity-100 will-change-transform`,
                    "animate-aurora"
                )}
            />
            {children}
        </div>
    );
};
