"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const COPIED_DURATION_MS = 3000;

interface CopyButtonProps {
  text: string;
  className?: string;
  iconClassName?: string;
  showLabel?: boolean;
  label?: string;
  size?: "sm" | "default" | "lg";
}

export function CopyButton({
  text,
  className,
  iconClassName,
  showLabel = false,
  label = "Copy",
  size = "default",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_DURATION_MS);
    },
    [text]
  );

  const iconSize = size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5";

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1 text-slate-400 hover:text-primary transition-colors cursor-pointer",
        className
      )}
      aria-label={copied ? "Copied" : "Copy"}
    >
      {copied ? (
        <Check className={cn(iconSize, "text-green-600", iconClassName)} />
      ) : (
        <Copy className={cn(iconSize, iconClassName)} />
      )}
      {showLabel && (
        <span className="text-[10px] font-medium">{copied ? "Copied" : label}</span>
      )}
    </button>
  );
}
