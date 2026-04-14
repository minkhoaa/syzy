"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Share2, Link2, Check, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Event } from "@/app/(dashboard)/markets/_types";

interface MarketDetailHeaderProps {
  event: Event;
}

export function MarketDetailHeader({ event }: MarketDetailHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  const marketUrl = typeof window !== "undefined"
    ? `${window.location.origin}/markets/${event.slug}`
    : `/markets/${event.slug}`;

  const shareText = `${event.title} — Check it out on Syzy!`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(marketUrl);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => {
        setCopied(false);
        setShowMenu(false);
      }, 1200);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleShareX = () => {
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(marketUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setShowMenu(false);
  };

  const handleShare = async () => {
    // Use native share on mobile if available
    if (navigator.share) {
      try {
        await navigator.share({ title: event.title, text: shareText, url: marketUrl });
      } catch {
        // User cancelled -- ignore
      }
      return;
    }
    setShowMenu((prev) => !prev);
  };

  return (
    <div className="flex items-center justify-between mb-4 md:mb-6 animate-fade-scale-in">
      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground min-w-0 overflow-hidden">
        <Link
          href="/markets"
          className="hover:text-foreground transition-all duration-200 shrink-0 hover:underline underline-offset-2"
        >
          Markets
        </Link>
        <span className="shrink-0 text-muted-foreground/50">/</span>
        <span className="text-foreground font-semibold shrink-0 transition-colors duration-200">
          {event.main_tag}
        </span>
        <span className="shrink-0 hidden sm:inline text-muted-foreground/50">/</span>
        <span className="text-foreground font-semibold truncate max-w-[120px] sm:max-w-[200px] hidden sm:inline">
          {event.title}
        </span>
      </div>

      {/* Share button + menu */}
      <div className="relative shrink-0" ref={menuRef}>
        <Button variant="ghost" size="sm" className="h-8" onClick={handleShare}>
          <Share2 className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Share</span>
        </Button>

        {showMenu && (
          <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border border-border bg-popover shadow-lg py-1 animate-in fade-in-0 zoom-in-95">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-secondary" />
              ) : (
                <Link2 className="w-4 h-4 text-muted-foreground" />
              )}
              {copied ? "Copied!" : "Copy link"}
            </button>
            <button
              onClick={handleShareX}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
            >
              <XIcon className="w-4 h-4 text-muted-foreground" />
              Share on X
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
