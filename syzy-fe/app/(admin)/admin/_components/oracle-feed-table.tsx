"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Pencil,
  Trash2,
  X,
  Check,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/ui/copy-button";
import type { OracleFeedWithData } from "@/features/admin/hooks/use-oracle-feeds";

const COMPARISON_LABELS: Record<number, string> = {
  0: ">",
  1: "<",
  2: "=",
};

function StalenessIndicator({ feed }: { feed: OracleFeedWithData }) {
  if (feed.lastUpdateTimestamp == null) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        No data
      </span>
    );
  }

  if (feed.isStale) {
    return (
      <span className="flex items-center gap-1 text-xs text-red-500">
        <AlertTriangle className="h-3 w-3" />
        Stale
      </span>
    );
  }

  if (feed.stalenessRatio > 0.5) {
    return (
      <span className="flex items-center gap-1 text-xs text-yellow-500">
        <Clock className="h-3 w-3" />
        Aging
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 text-xs text-green-500">
      <CheckCircle2 className="h-3 w-3" />
      Fresh
    </span>
  );
}

function formatValue(value: number | null): string {
  if (value == null) return "—";
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }
  if (Math.abs(value) < 0.01 && value !== 0) {
    return value.toExponential(3);
  }
  return value.toFixed(value < 1 ? 6 : 2);
}

function SourceBadge({ source }: { source: OracleFeedWithData["source"] }) {
  const variants: Record<string, "default" | "secondary" | "outline"> = {
    market: "default",
    created: "secondary",
    imported: "outline",
    scanned: "outline",
  };
  return (
    <Badge variant={variants[source] ?? "outline"} className="text-[10px]">
      {source}
    </Badge>
  );
}

interface OracleFeedTableProps {
  feeds: OracleFeedWithData[];
  onRemoveFeed?: (address: string) => void;
  onUpdateLabel?: (address: string, label: string) => void;
}

export function OracleFeedTable({
  feeds,
  onRemoveFeed,
  onUpdateLabel,
}: OracleFeedTableProps) {
  const [expandedFeeds, setExpandedFeeds] = useState<Set<string>>(new Set());
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const toggleFeed = (address: string) => {
    setExpandedFeeds((prev) => {
      const next = new Set(prev);
      if (next.has(address)) next.delete(address);
      else next.add(address);
      return next;
    });
  };

  const startEditLabel = (address: string, currentLabel?: string) => {
    setEditingLabel(address);
    setEditValue(currentLabel ?? "");
  };

  const saveLabel = (address: string) => {
    onUpdateLabel?.(address, editValue.trim());
    setEditingLabel(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingLabel(null);
    setEditValue("");
  };

  if (feeds.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">No oracle feeds found</p>
        <p className="text-xs mt-1">
          Create a feed, import an existing one, or scan for feeds you own
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {feeds.map((feed) => {
        const isExpanded = expandedFeeds.has(feed.address);
        const canRemove = feed.source !== "market";

        return (
          <div
            key={feed.address}
            className="border rounded-lg overflow-hidden"
          >
            {/* Collapsed row */}
            <button
              type="button"
              onClick={() => toggleFeed(feed.address)}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )}

              {/* Address */}
              <div className="flex items-center gap-1.5 min-w-0 shrink-0">
                <code className="text-xs font-mono">
                  {feed.address.slice(0, 8)}...{feed.address.slice(-6)}
                </code>
                <CopyButton text={feed.address} size="sm" />
              </div>

              {/* Feed name */}
              {feed.name && (
                <span className="text-xs text-muted-foreground truncate max-w-[120px] hidden lg:inline">
                  {feed.name}
                </span>
              )}

              {/* User label */}
              {feed.userLabel && (
                <Badge variant="outline" className="text-[10px] hidden md:inline-flex">
                  {feed.userLabel}
                </Badge>
              )}

              <div className="flex-1" />

              {/* Metric badge */}
              <Badge variant="secondary" className="shrink-0">
                {feed.metricLabel}
              </Badge>

              {/* Current value */}
              <span className="text-xs font-mono font-medium shrink-0 min-w-[60px] text-right">
                {formatValue(feed.currentValue)}
              </span>

              {/* Staleness */}
              <div className="shrink-0 min-w-[60px]">
                <StalenessIndicator feed={feed} />
              </div>

              {/* Market count */}
              {feed.markets.length > 0 && (
                <Badge variant="outline" className="shrink-0">
                  {feed.markets.length} market{feed.markets.length !== 1 ? "s" : ""}
                </Badge>
              )}

              {/* Source */}
              <div className="shrink-0 hidden sm:block">
                <SourceBadge source={feed.source} />
              </div>
            </button>

            {/* Expanded detail */}
            {isExpanded && (
              <div className="border-t bg-muted/30">
                {/* Feed metadata */}
                <div className="px-4 py-3 space-y-2 text-xs border-b">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-24 shrink-0">
                      Full address:
                    </span>
                    <code className="font-mono break-all">{feed.address}</code>
                    <CopyButton text={feed.address} size="sm" />
                    <a
                      href={`https://explorer.solana.com/address/${feed.address}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>

                  {feed.name && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-24 shrink-0">
                        Feed name:
                      </span>
                      <span>{feed.name}</span>
                    </div>
                  )}

                  {feed.authority && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-24 shrink-0">
                        Authority:
                      </span>
                      <code className="font-mono">
                        {feed.authority.slice(0, 8)}...{feed.authority.slice(-6)}
                      </code>
                      <CopyButton text={feed.authority} size="sm" />
                    </div>
                  )}

                  {feed.maxStaleness != null && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-24 shrink-0">
                        Max staleness:
                      </span>
                      <span>{feed.maxStaleness} slots (~{(feed.maxStaleness * 0.4).toFixed(0)}s)</span>
                    </div>
                  )}

                  {feed.lastUpdateTimestamp != null && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-24 shrink-0">
                        Last update:
                      </span>
                      <span>
                        {new Date(feed.lastUpdateTimestamp * 1000).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Label editing */}
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-24 shrink-0">
                      Label:
                    </span>
                    {editingLabel === feed.address ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          placeholder="Custom label..."
                          className="h-6 text-xs w-40"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveLabel(feed.address);
                            if (e.key === "Escape") cancelEdit();
                          }}
                          autoFocus
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => saveLabel(feed.address)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={cancelEdit}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span>{feed.userLabel || "—"}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            startEditLabel(feed.address, feed.userLabel)
                          }
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Remove button */}
                  {canRemove && (
                    <div className="pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive text-xs h-7"
                        onClick={() => onRemoveFeed?.(feed.address)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove from tracked feeds
                      </Button>
                    </div>
                  )}
                </div>

                {/* Associated markets */}
                {feed.markets.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs text-muted-foreground font-medium border-b">
                      Associated Markets ({feed.markets.length})
                    </div>
                    {feed.markets.map((m) => (
                      <div
                        key={m.publicKey.toString()}
                        className="flex items-center gap-3 px-4 py-2.5 border-b last:border-b-0 hover:bg-muted/50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {m.marketName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {m.question}
                          </p>
                        </div>

                        <Badge
                          variant={m.isCompleted ? "outline" : "default"}
                          className="shrink-0"
                        >
                          {m.isCompleted ? "Resolved" : "Active"}
                        </Badge>

                        <span className="text-xs font-mono text-muted-foreground shrink-0">
                          {m.comparisonType !== null
                            ? COMPARISON_LABELS[m.comparisonType] ?? "?"
                            : "?"}{" "}
                          {m.priceTarget}
                        </span>

                        {m.slug && (
                          <Link
                            href={`/markets/${m.slug}`}
                            className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {feed.markets.length === 0 && (
                  <div className="px-4 py-3 text-xs text-muted-foreground">
                    No markets using this feed
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
