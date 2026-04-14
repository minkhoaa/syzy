"use client";

import { cn } from "@/lib/utils";

export const AnimatedText = ({
  text,
  className,
}: {
  text: string | number;
  className?: string;
}) => (
  <div
    className={cn(
      "overflow-hidden relative inline-block align-top h-[1.2em]",
      className
    )}
  >
    <span key={String(text)} className="block animate-text-rotate">
      {text}
    </span>
  </div>
);

export const RollingNumber = ({
  value,
  prefix = "",
  suffix = "",
  className,
}: {
  value: number | string;
  prefix?: string;
  suffix?: string;
  className?: string;
}) => (
  <div
    className={cn(
      "relative inline-flex overflow-hidden h-[1.1em] align-baseline",
      className
    )}
  >
    <span className="invisible font-bold tabular-nums">
      {prefix}
      {value}
      {suffix}
    </span>
    <span
      key={String(value)}
      className="absolute top-0 left-0 w-full text-center tabular-nums animate-[slideUpText_0.2s_ease-out_forwards]"
    >
      {prefix}
      {value}
      {suffix}
    </span>
  </div>
);
