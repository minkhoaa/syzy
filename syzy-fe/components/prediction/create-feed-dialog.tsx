"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Satellite, Loader2, Copy, Check, ExternalLink, AlertTriangle, Search, ChevronDown } from "lucide-react";
import { useSwitchboardFeed } from "@/features/trading/hooks/use-switchboard-feed";
import {
  createPumpOracleJob,
  generatePumpFeedName,
  simulatePumpJob,
  PUMP_METRICS,
  METRIC_CATEGORIES,
  type BinanceToken,
} from "@/lib/switchboard/job-templates";
import { apiClient } from "@/lib/kubb";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CreatedFeed {
  pubkey: string;
  signature: string;
  metricLabel: string;
}

interface CreateFeedDialogProps {
  onFeedCreated?: (feedPubkey: string) => void;
}

const API_SOURCE_LABELS: Record<string, string> = {
  v3: "Pump.fun",
  dexscreener: "DexScreener",
  binance: "Binance",
  coingecko: "CoinGecko",
  jupiter: "Jupiter",
  helius: "Helius",
};

/** Cache fetched tokens in memory so we don't re-fetch on every dialog open */
let cachedTokens: BinanceToken[] | null = null;
let cacheExpiry = 0;

async function fetchBinanceTokens(): Promise<BinanceToken[]> {
  if (cachedTokens && Date.now() < cacheExpiry) return cachedTokens;

  const res = await apiClient.get<{ success: boolean; data: BinanceToken[] }>("/api/token-data/binance/tokens");
  const tokens = res.data?.data ?? res.data ?? [];
  cachedTokens = Array.isArray(tokens) ? tokens : [];
  cacheExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24h
  return cachedTokens;
}

function CryptoTokenSelector({
  selectedToken,
  onSelect,
}: {
  selectedToken: BinanceToken | null;
  onSelect: (token: BinanceToken) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [tokens, setTokens] = useState<BinanceToken[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBinanceTokens()
      .then(setTokens)
      .catch(() => setTokens([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search) return tokens;
    const q = search.toLowerCase();
    return tokens.filter(
      (t) =>
        t.symbol.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.pair.toLowerCase().includes(q)
    );
  }, [search, tokens]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <label className="text-sm font-medium mb-2 block">Token *</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-secondary/50 transition-colors"
      >
        {selectedToken ? (
          <span>
            <span className="font-medium">{selectedToken.symbol}</span>
            <span className="text-muted-foreground ml-2">{selectedToken.name}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">Select a token...</span>
        )}
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-input bg-background shadow-lg">
          <div className="p-2 border-b border-input">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search by name, ticker, or pair..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
          <div className="max-h-[200px] overflow-y-auto p-1">
            {loading ? (
              <div className="flex items-center justify-center py-4 gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Loading tokens...</p>
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No tokens found</p>
            ) : (
              filtered.map((token) => (
                <button
                  key={token.pair}
                  type="button"
                  onClick={() => {
                    onSelect(token);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-md hover:bg-secondary/50 transition-colors ${
                    selectedToken?.pair === token.pair ? "bg-secondary/70" : ""
                  }`}
                >
                  <span>
                    <span className="font-medium">{token.symbol}</span>
                    <span className="text-muted-foreground ml-2">{token.name}</span>
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">{token.pair}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function CreateFeedDialog({ onFeedCreated }: CreateFeedDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [createdFeed, setCreatedFeed] = useState<CreatedFeed | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [simulatedValue, setSimulatedValue] = useState<{ value: number; label: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [tokenMint, setTokenMint] = useState("");
  const [metric, setMetric] = useState("usd_market_cap");
  const [selectedCryptoToken, setSelectedCryptoToken] = useState<BinanceToken | null>(null);
  const [errors, setErrors] = useState<{ tokenMint?: string; cryptoToken?: string }>({});

  const { createCustomFeed } = useSwitchboardFeed();

  const metricInfo = PUMP_METRICS[metric];
  const isGlobalMetric = metricInfo?.global === true;
  const needsCryptoSelector = metricInfo?.needsCryptoSelector === true;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation(); // prevent bubbling to outer market creation form

    const errs: { tokenMint?: string; cryptoToken?: string } = {};
    if (!isGlobalMetric && tokenMint.length < 32) {
      errs.tokenMint = "Valid Solana token mint address required";
    }
    if (needsCryptoSelector && !selectedCryptoToken) {
      errs.cryptoToken = "Please select a token";
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const metricDef = PUMP_METRICS[metric];
    if (!metricDef) return;

    const apiParam = needsCryptoSelector ? selectedCryptoToken?.pair : undefined;
    const displayLabel = needsCryptoSelector && selectedCryptoToken
      ? `${selectedCryptoToken.symbol} Price (USD)`
      : metricDef.label;

    // Step 1: Validate data source
    try {
      setSimulationError(null);
      setSimulatedValue(null);
      setIsSimulating(true);
      const value = await simulatePumpJob(metric, isGlobalMetric ? undefined : tokenMint, apiParam);
      setSimulatedValue({ value, label: displayLabel });
    } catch (simError: any) {
      setSimulationError(simError?.message || "Data source validation failed");
      setIsSimulating(false);
      return;
    } finally {
      setIsSimulating(false);
    }

    // Step 2: Create on-chain feed
    try {
      setIsLoading(true);
      const job = createPumpOracleJob(metric, isGlobalMetric ? undefined : tokenMint, apiParam);
      const name = generatePumpFeedName(metric, isGlobalMetric ? undefined : tokenMint, apiParam);

      const result = await createCustomFeed(job, name);
      if (result) {
        const pubkey = result.feedPubkey.toBase58();
        setCreatedFeed({
          pubkey,
          signature: result.signature,
          metricLabel: displayLabel,
        });
        onFeedCreated?.(pubkey);
      }
    } catch (error) {
      console.error("Failed to create feed:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleCopy() {
    if (!createdFeed) return;
    navigator.clipboard.writeText(createdFeed.pubkey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleReset() {
    setCreatedFeed(null);
    setCopied(false);
    setSimulationError(null);
    setSimulatedValue(null);
    setTokenMint("");
    setMetric("usd_market_cap");
    setSelectedCryptoToken(null);
    setErrors({});
  }

  function handleOpenChange(open: boolean) {
    setIsOpen(open);
    if (!open) handleReset();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Satellite className="mr-2 h-4 w-4" />
          Create Feed
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Oracle Feed</DialogTitle>
          <DialogDescription>
            Create a Switchboard oracle feed for a Solana token. Choose a metric to track, then use the feed address when creating a market.
          </DialogDescription>
        </DialogHeader>

        {createdFeed ? (
          <div className="space-y-4 pt-4">
            <div className="border border-green-500/30 rounded-lg p-4 bg-green-500/5 space-y-3">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <p className="text-sm font-medium text-green-400">Feed Created &mdash; {createdFeed.metricLabel}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Feed Address</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono bg-secondary/50 border border-input rounded px-3 py-2 break-all select-all">
                    {createdFeed.pubkey}
                  </code>
                  <Button variant="outline" size="sm" onClick={handleCopy} className="shrink-0">
                    {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>

              <a
                href={`https://explorer.solana.com/address/${createdFeed.pubkey}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                View on Solana Explorer <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <p className="text-xs text-muted-foreground">
              Copy this address and paste it into the &quot;Oracle Feed Address&quot; field when creating a market.
            </p>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={handleReset}>
                Create Another
              </Button>
              <Button type="button" onClick={() => { handleCopy(); setIsOpen(false); }}>
                {copied ? "Copied!" : "Copy & Close"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Metric *</label>
              <select
                value={metric}
                onChange={(e) => {
                  setMetric(e.target.value);
                  setSimulationError(null);
                  setSimulatedValue(null);
                  setSelectedCryptoToken(null);
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {Object.entries(METRIC_CATEGORIES).map(([catKey, cat]) => (
                  <optgroup key={catKey} label={cat.label}>
                    {cat.metrics.map((metricKey) => {
                      const m = PUMP_METRICS[metricKey];
                      return (
                        <option key={metricKey} value={metricKey}>
                          {m.label}
                        </option>
                      );
                    })}
                  </optgroup>
                ))}
              </select>
              {metricInfo && (
                <p className="text-xs text-muted-foreground mt-1">
                  {metricInfo.description}
                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                    {API_SOURCE_LABELS[metricInfo.api] ?? metricInfo.api}
                  </span>
                </p>
              )}
            </div>

            {needsCryptoSelector && (
              <div>
                <CryptoTokenSelector
                  selectedToken={selectedCryptoToken}
                  onSelect={(token) => {
                    setSelectedCryptoToken(token);
                    setSimulationError(null);
                    setSimulatedValue(null);
                    setErrors((prev) => ({ ...prev, cryptoToken: undefined }));
                  }}
                />
                {errors.cryptoToken && (
                  <p className="text-destructive text-xs mt-1">{errors.cryptoToken}</p>
                )}
              </div>
            )}

            {!isGlobalMetric && (
              <div>
                <label className="text-sm font-medium mb-2 block">Token Mint Address *</label>
                <Input
                  placeholder="Solana token mint pubkey"
                  className="font-mono text-xs"
                  value={tokenMint}
                  onChange={(e) => setTokenMint(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  The Solana mint address of the token
                </p>
                {errors.tokenMint && (
                  <p className="text-destructive text-xs mt-1">{errors.tokenMint}</p>
                )}
              </div>
            )}

            {isGlobalMetric && !needsCryptoSelector && (
              <div className="border border-input rounded-lg p-3 bg-secondary/20">
                <p className="text-xs text-muted-foreground">
                  This is a global metric &mdash; no token mint address is needed.
                </p>
              </div>
            )}

            {simulationError && (
              <div className="border border-red-500/30 rounded-lg p-3 bg-red-500/5">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-400">Data source validation failed</p>
                    <p className="text-xs text-muted-foreground mt-1">{simulationError}</p>
                  </div>
                </div>
              </div>
            )}

            {simulatedValue && !simulationError && (
              <div className="border border-green-500/30 rounded-lg p-3 bg-green-500/5">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-400 shrink-0" />
                  <p className="text-sm text-green-400">
                    {simulatedValue.label} OK &mdash; current value: <span className="font-mono font-bold">{simulatedValue.value.toLocaleString()}</span>
                  </p>
                </div>
              </div>
            )}

            <div className="border border-input rounded-lg p-3 bg-secondary/20">
              <p className="text-xs text-muted-foreground">
                Creating a feed costs ~0.003 SOL for account rent. The feed will be stored on-chain and can be used by any market.
              </p>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isLoading || isSimulating} className="w-full">
                {isSimulating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating Data Source...
                  </>
                ) : isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Feed...
                  </>
                ) : (
                  <>
                    <Satellite className="mr-2 h-4 w-4" />
                    Create Feed
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
