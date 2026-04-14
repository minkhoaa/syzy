"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, AlertTriangle, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import type { OracleFeedWithData } from "@/features/admin/hooks/use-oracle-feeds";

function isValidBase58(str: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(str);
}

function formatValue(value: number | null): string {
  if (value == null) return "—";
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  if (Math.abs(value) < 0.01 && value !== 0) return value.toExponential(3);
  return value.toFixed(value < 1 ? 6 : 2);
}

interface OracleAddFeedDialogProps {
  onAddFeed: (address: string) => Promise<OracleFeedWithData | null>;
  onRefresh: () => void;
}

export function OracleAddFeedDialog({
  onAddFeed,
  onRefresh,
}: OracleAddFeedDialogProps) {
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<OracleFeedWithData | null>(null);
  const [isAdded, setIsAdded] = useState(false);

  const reset = () => {
    setAddress("");
    setError(null);
    setPreview(null);
    setIsLoading(false);
    setIsAdded(false);
  };

  const handleLoad = async () => {
    const trimmed = address.trim();
    if (!isValidBase58(trimmed)) {
      setError("Invalid Solana address (must be base58)");
      return;
    }

    setError(null);
    setIsLoading(true);
    setPreview(null);

    const result = await onAddFeed(trimmed);
    setIsLoading(false);

    if (result) {
      setPreview(result);
      setIsAdded(true);
    } else {
      setError("Feed not found on-chain or failed to load");
    }
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      if (isAdded) onRefresh();
      reset();
    }
    setOpen(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add by Address
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Oracle Feed</DialogTitle>
          <DialogDescription>
            Paste a Switchboard feed address to import it into your tracked feeds
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Input
              placeholder="Feed address (base58)"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setError(null);
                setPreview(null);
                setIsAdded(false);
              }}
              className="font-mono text-sm"
            />
            {error && (
              <div className="flex items-center gap-1.5 mt-2 text-sm text-destructive">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </div>
            )}
          </div>

          {/* Preview */}
          {preview && (
            <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                <span className="text-sm font-medium">Feed loaded</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Name:</span>{" "}
                  <span className="font-medium">{preview.name || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Metric:</span>{" "}
                  <Badge variant="secondary" className="text-[10px] ml-1">
                    {preview.metricLabel}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Value:</span>{" "}
                  <span className="font-mono font-medium">
                    {formatValue(preview.currentValue)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Authority:</span>{" "}
                  <span className="font-mono">
                    {preview.authority
                      ? `${preview.authority.slice(0, 6)}...`
                      : "—"}
                  </span>
                  {preview.authority && (
                    <CopyButton text={preview.authority} size="sm" className="ml-1" />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => handleClose(false)}>
            {isAdded ? "Done" : "Cancel"}
          </Button>
          {!isAdded && (
            <Button onClick={handleLoad} disabled={isLoading || !address.trim()}>
              {isLoading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {isLoading ? "Loading..." : "Import Feed"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
