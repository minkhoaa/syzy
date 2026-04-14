"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Loader2 } from "lucide-react";

interface TweetEmbedProps {
  tweetUrl: string;
}

function getTweetId(url: string): string | null {
  const match = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
  return match ? match[1] : null;
}

declare global {
  interface Window {
    twttr?: {
      widgets: {
        createTweet: (
          id: string,
          el: HTMLElement,
          options?: Record<string, unknown>
        ) => Promise<HTMLElement>;
      };
    };
  }
}

function loadTwitterScript(): Promise<void> {
  if (window.twttr) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(
      'script[src="https://platform.twitter.com/widgets.js"]'
    );
    if (existing) {
      const check = setInterval(() => {
        if (window.twttr) {
          clearInterval(check);
          resolve();
        }
      }, 50);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    script.onload = () => {
      const check = setInterval(() => {
        if (window.twttr) {
          clearInterval(check);
          resolve();
        }
      }, 50);
    };
    script.onerror = () => reject(new Error("Failed to load Twitter widget"));
    document.head.appendChild(script);
  });
}

export function TweetEmbed({ tweetUrl }: TweetEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { resolvedTheme } = useTheme();

  const tweetId = getTweetId(tweetUrl);

  // Reset state when inputs change (render-time adjustment)
  const [prevInputKey, setPrevInputKey] = useState(`${tweetUrl}|${resolvedTheme}`);
  const inputKey = `${tweetUrl}|${resolvedTheme}`;
  if (prevInputKey !== inputKey) {
    setPrevInputKey(inputKey);
    setLoading(!!tweetId);
    setError(!tweetId);
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!tweetId || !container) return;

    let cancelled = false;
    container.innerHTML = "";

    loadTwitterScript()
      .then(() => {
        if (cancelled || !window.twttr) return;
        return window.twttr.widgets.createTweet(tweetId, container, {
          theme: resolvedTheme === "dark" ? "dark" : "light",
          align: "center",
          dnt: true,
        });
      })
      .then((el) => {
        if (cancelled) {
          if (container) container.innerHTML = "";
          return;
        }
        setLoading(false);
        if (!el) setError(true);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      container.innerHTML = "";
    };
  }, [tweetId, resolvedTheme]);

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Could not load tweet. Please view the original post.
      </div>
    );
  }

  return (
    <div>
      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}
      <div ref={containerRef} />
    </div>
  );
}
