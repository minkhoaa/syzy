"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSyncExternalStore } from "react";

// Stable references for client-side mount detection via useSyncExternalStore
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon-sm"
        className="h-8 w-8 rounded-full"
        disabled
      >
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const isDark = theme === "dark";

  return (
    <Button
      variant="outline"
      size="icon-sm"
      className={cn(
        "relative h-8 w-8 rounded-full overflow-hidden transition-all duration-300",
        "hover:scale-110 active:scale-95",
        isDark
          ? "bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 hover:border-slate-600/50"
          : "bg-gradient-to-br from-teal-50/80 to-teal-50/80 border-teal-200/50 hover:border-teal-300/50"
      )}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {/* Animated gradient background */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-500",
          isDark
            ? "bg-gradient-to-br from-purple-900/20 to-blue-900/20 opacity-100"
            : "bg-gradient-to-br from-yellow-400/20 to-teal-400/20 opacity-100"
        )}
      />

      {/* Icon container with rotation animation */}
      <div className="relative z-10 flex items-center justify-center">
        <Sun
          className={cn(
            "absolute h-4 w-4 transition-all duration-500",
            isDark
              ? "rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100 text-teal-600"
          )}
        />
        <Moon
          className={cn(
            "absolute h-4 w-4 transition-all duration-500",
            isDark
              ? "rotate-0 scale-100 opacity-100 text-slate-300"
              : "-rotate-90 scale-0 opacity-0"
          )}
        />
      </div>

      {/* Glow effect */}
      <div
        className={cn(
          "absolute -inset-0.5 rounded-full blur-sm transition-opacity duration-300 opacity-0 group-hover:opacity-100 pointer-events-none",
          isDark
            ? "bg-gradient-to-r from-purple-500/30 to-blue-500/30"
            : "bg-gradient-to-r from-teal-500/30 to-teal-500/30"
        )}
      />
    </Button>
  );
}
