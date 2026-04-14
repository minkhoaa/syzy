"use client";

import { useState, useEffect } from "react";
import { Newspaper, Info } from "lucide-react";
import { useMarketNews } from "@/features/markets/hooks/use-market-news";

interface FeaturedNewsProps {
  tokenSymbol?: string | null;
  marketTitle?: string | null;
  fallbackText?: string | null;
}

export const FeaturedNews = ({ tokenSymbol, marketTitle, fallbackText }: FeaturedNewsProps) => {
  const [newsIndex, setNewsIndex] = useState(0);
  const { data } = useMarketNews(tokenSymbol, { limit: 5, title: marketTitle ?? undefined });

  const items =
    data?.news && data.news.length > 0
      ? data.news.map((item) => ({ title: item.title, url: item.url }))
      : [];

  useEffect(() => {
    if (items.length === 0) return;
    const timer = setInterval(() => {
      setNewsIndex((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (items.length === 0) {
    if (!fallbackText) return null;
    return (
      <div className="flex gap-2 items-start text-[13px] border-t border-border/50 pt-2.5 pb-1 text-muted-foreground/80">
        <span className="shrink-0 mt-0.5">
          <Info className="w-3.5 h-3.5" />
        </span>
        <p className="leading-relaxed line-clamp-2">
          {fallbackText}
        </p>
      </div>
    );
  }

  const current = items[newsIndex % items.length];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(current.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      onClick={handleClick}
      className="flex gap-2 items-start text-[13px] border-t border-border/50 pt-2.5 pb-1 interactive-area cursor-pointer group/news"
    >
      <span className="text-primary/80 shrink-0 mt-0.5">
        <Newspaper className="w-3.5 h-3.5" />
      </span>
      <p
        key={current.title}
        className="text-muted-foreground leading-relaxed line-clamp-2 animate-text-rotate group-hover/news:text-foreground transition-colors"
      >
        {current.title}
      </p>
    </div>
  );
};
