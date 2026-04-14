"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function AnimatedNumber({
  value,
  decimals = 0,
  className,
  prefix = "",
  suffix = ""
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (displayValue !== value) {
      setIsAnimating(true);
      const duration = 600;
      const steps = 30;
      const increment = (value - displayValue) / steps;
      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        if (currentStep === steps) {
          setDisplayValue(value);
          setIsAnimating(false);
          clearInterval(timer);
        } else {
          setDisplayValue(prev => prev + increment);
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [value, displayValue]);

  return (
    <span className={cn(
      "tabular-nums transition-all duration-300",
      isAnimating && "animate-number-roll",
      className
    )}>
      {prefix}{displayValue.toFixed(decimals)}{suffix}
    </span>
  );
}
