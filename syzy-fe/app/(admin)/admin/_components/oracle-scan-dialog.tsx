"use client";

import { useState } from "react";
import { Loader2, Radar, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAppKitAccount } from "@reown/appkit/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import type { StoredFeed } from "@/features/admin/store/use-oracle-feed-store";

interface OracleScanDialogProps {
  isScanning: boolean;
  onScan: () => Promise<StoredFeed[]>;
  onImport: (feeds: StoredFeed[]) => void;
}

export function OracleScanDialog({
  isScanning,
  onScan,
  onImport,
}: OracleScanDialogProps) {
  const { address } = useAppKitAccount();
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<StoredFeed[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hasScanned, setHasScanned] = useState(false);
  const [imported, setImported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setResults([]);
    setSelected(new Set());
    setHasScanned(false);
    setImported(false);
    setError(null);
  };

  const handleScan = async () => {
    setError(null);
    try {
      const found = await onScan();
      setResults(found);
      setSelected(new Set(found.map((f) => f.address)));
      setHasScanned(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Scan failed");
    }
  };

  const toggleSelect = (address: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(address)) next.delete(address);
      else next.add(address);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === results.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(results.map((f) => f.address)));
    }
  };

  const handleImport = () => {
    const toImport = results.filter((f) => selected.has(f.address));
    onImport(toImport);
    setImported(true);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    setOpen(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={!address}>
          <Radar className="h-4 w-4 mr-1" />
          Scan for My Feeds
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Scan for Oracle Feeds</DialogTitle>
          <DialogDescription>
            Discover all Switchboard feeds owned by your connected wallet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Wallet info */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Wallet:</span>
            {address ? (
              <>
                <code className="font-mono">
                  {address.slice(0, 8)}...{address.slice(-6)}
                </code>
                <CopyButton text={address} size="sm" />
              </>
            ) : (
              <span className="text-destructive">Not connected</span>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-sm text-destructive">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Scan button */}
          {!hasScanned && !isScanning && (
            <Button onClick={handleScan} disabled={!address} className="w-full">
              <Radar className="h-4 w-4 mr-1" />
              Scan On-Chain
            </Button>
          )}

          {isScanning && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Scanning all Switchboard feed accounts...
            </div>
          )}

          {/* Results */}
          {hasScanned && !isScanning && (
            <>
              {results.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">No new feeds found</p>
                  <p className="text-xs mt-1">
                    All feeds owned by this wallet are already tracked
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Found {results.length} feed{results.length !== 1 ? "s" : ""}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={toggleSelectAll}
                    >
                      {selected.size === results.length
                        ? "Deselect all"
                        : "Select all"}
                    </Button>
                  </div>

                  <div className="max-h-[240px] overflow-y-auto space-y-1 border rounded-lg p-2">
                    {results.map((feed) => (
                      <label
                        key={feed.address}
                        className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(feed.address)}
                          onChange={() => toggleSelect(feed.address)}
                          className="h-4 w-4 rounded border-input accent-primary"
                        />
                        <code className="text-xs font-mono flex-1 truncate">
                          {feed.address}
                        </code>
                        <CopyButton text={feed.address} size="sm" />
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Imported confirmation */}
          {imported && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              {selected.size} feed{selected.size !== 1 ? "s" : ""} imported
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => handleClose(false)}>
            {imported ? "Done" : "Cancel"}
          </Button>
          {hasScanned && results.length > 0 && !imported && (
            <Button onClick={handleImport} disabled={selected.size === 0}>
              Import {selected.size} Feed{selected.size !== 1 ? "s" : ""}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
