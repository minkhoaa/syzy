"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PublicKey, Connection } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { Rocket, Loader2, Upload, X } from "lucide-react";
import { usePredictionMarket } from "@/features/trading/hooks/use-prediction-market";
import { useReownWallet } from "@/features/auth/hooks/use-reown-wallet";
import { uploadFileToR2 } from "@/lib/r2-upload";
import { apiClient } from "@/lib/kubb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { CreateFeedDialog } from "@/components/prediction/create-feed-dialog";
import { METRIC_LABELS } from "@/lib/switchboard/job-templates";
import { detectFeedMetric } from "@/lib/switchboard/detect-metric";
import { RPC_URL, CLUSTER } from "@/lib/constants/network";

const CATEGORIES = [
  "Crypto",
  "Politics",
  "Sports",
  "Entertainment",
  "Science",
  "Other",
] as const;

type FormValues = {
  marketName: string;
  question: string;
  slug: string;
  imageUrl: string;
  category: (typeof CATEGORIES)[number];
  startDate: string; // datetime-local value or ""
  endDate: string;   // datetime-local value or ""
  oracleFeed: string;
  priceTarget: string;
  comparisonType: string;
  metricType: string;
  tokenSymbol: string;
  tokenAddress: string;
};

export function CreateMarketForm() {
  const router = useRouter();
  const { createMarketWithOptions } = usePredictionMarket();
  const { address } = useReownWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formValues, setFormValues] = useState<FormValues>({
    marketName: "",
    question: "",
    slug: "",
    imageUrl: "",
    category: "Crypto",
    startDate: "",
    endDate: "",
    oracleFeed: "",
    priceTarget: "",
    comparisonType: "0",
    metricType: "",
    tokenSymbol: "",
    tokenAddress: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormValues, string>>
  >({});
  const [detectedMetricLabel, setDetectedMetricLabel] = useState<string | null>(null);
  const [timeZone, setTimeZone] = useState<"utc" | "local">("utc");
  const searchParams = useSearchParams();
  const polymarketMetaRef = useRef<{
    conditionId?: string;
    polymarketSlug?: string;
    polymarketMarketId?: string;
    resolutionSource?: string;
  }>({});

  // Pre-fill from Polymarket source
  useEffect(() => {
    if (searchParams.get("source") === "polymarket") {
      const question = searchParams.get("question");
      const imageUrl = searchParams.get("imageUrl");
      const category = searchParams.get("category");
      const endDate = searchParams.get("endDate");
      setFormValues((prev) => ({
        ...prev,
        ...(question ? { question, marketName: question.slice(0, 32) } : {}),
        ...(imageUrl ? { imageUrl } : {}),
        ...(category && CATEGORIES.includes(category as (typeof CATEGORIES)[number])
          ? { category: category as (typeof CATEGORIES)[number] }
          : {}),
        ...(endDate
          ? { endDate: endDate.slice(0, 16) }
          : {}),
      }));
      // Store Polymarket metadata for submit
      polymarketMetaRef.current = {
        conditionId: searchParams.get("conditionId") || undefined,
        polymarketSlug: searchParams.get("polymarketSlug") || undefined,
        polymarketMarketId: searchParams.get("polymarketMarketId") || undefined,
        resolutionSource: searchParams.get("resolutionSource") || undefined,
      };
    }
  }, [searchParams]);

  // Helper: get the user's local UTC offset label, e.g. "UTC+7" or "UTC-5"
  const localOffsetLabel = useMemo(() => {
    const offsetMin = new Date().getTimezoneOffset(); // negative = ahead of UTC
    const sign = offsetMin <= 0 ? "+" : "-";
    const hours = Math.floor(Math.abs(offsetMin) / 60);
    const mins = Math.abs(offsetMin) % 60;
    return `UTC${sign}${hours}${mins ? `:${String(mins).padStart(2, "0")}` : ""}`;
  }, []);

  /** Parse a datetime-local string respecting the selected timezone */
  const parseDate = (value: string) => {
    if (!value) return null;
    // Append "Z" for UTC so the value isn't shifted by the browser's local offset
    return new Date(timeZone === "utc" ? value + "Z" : value);
  };

  const connection = useMemo(() => new Connection(RPC_URL, CLUSTER), []);

  // Auto-detect metric type when oracle feed address changes
  useEffect(() => {
    const oracleFeed = formValues.oracleFeed.trim();
    if (!oracleFeed) {
      setDetectedMetricLabel(null);
      return;
    }

    let pubkey: PublicKey;
    try {
      pubkey = new PublicKey(oracleFeed);
    } catch {
      setDetectedMetricLabel(null);
      return;
    }

    let cancelled = false;

    detectFeedMetric(connection, pubkey).then(async (result) => {
      if (cancelled) return;
      if (result) {
        setFormValues((prev) => ({
          ...prev,
          metricType: String(result.metricType),
          ...(result.tokenAddress ? { tokenAddress: result.tokenAddress } : {}),
          ...(result.tokenSymbol ? { tokenSymbol: result.tokenSymbol } : {}),
        }));
        setDetectedMetricLabel(result.label);

        // If we got a mint address but no symbol, look it up via DexScreener
        if (result.tokenAddress && !result.tokenSymbol) {
          try {
            const res = await fetch(`/api/dexscreener?mint=${result.tokenAddress}`);
            if (!cancelled && res.ok) {
              const data = await res.json();
              const symbol = data?.[0]?.baseToken?.symbol;
              if (symbol) {
                setFormValues((prev) => ({ ...prev, tokenSymbol: symbol.toUpperCase() }));
              }
            }
          } catch {
            // Non-critical — user can still fill it manually
          }
        }
      } else {
        setDetectedMetricLabel(null);
      }
    });

    return () => { cancelled = true; };
  }, [formValues.oracleFeed, connection]);

  const imageUrl = formValues.imageUrl;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (PNG, JPG, etc.)");
      return;
    }
    setUploadingImage(true);
    try {
      const result = await uploadFileToR2(file);
      setFormValues((prev) => ({ ...prev, imageUrl: result.url }));
      toast.success("Image uploaded to R2");
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Failed to upload image"
      );
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Partial<Record<keyof FormValues, string>> = {};
    if (formValues.marketName.length < 3) {
      errs.marketName = "Market name must be at least 3 characters";
    }
    if (formValues.marketName.length > 32) {
      errs.marketName = "Market name limited to 32 characters";
    }
    if (!formValues.question.trim()) {
      errs.question = "Market question is required";
    }
    if (!formValues.endDate) {
      errs.endDate = "End date is required";
    }
    if (formValues.endDate && formValues.startDate) {
      const start = parseDate(formValues.startDate)!.getTime();
      const end = parseDate(formValues.endDate)!.getTime();
      if (end <= start) {
        errs.endDate = "End date must be after start date";
      }
    }
    if (formValues.oracleFeed && !formValues.priceTarget) {
      errs.priceTarget = "Price target is required when an oracle feed is configured";
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const startDateUnix = formValues.startDate
      ? Math.floor(parseDate(formValues.startDate)!.getTime() / 1000)
      : undefined;
    const endDateUnix = formValues.endDate
      ? Math.floor(parseDate(formValues.endDate)!.getTime() / 1000)
      : undefined;

    try {
      setIsLoading(true);
      const isPolymarket = searchParams.get("source") === "polymarket";
      const result = await createMarketWithOptions({
        marketName: formValues.marketName,
        question: formValues.question || undefined,
        slug: formValues.slug || undefined,
        imageUrl: formValues.imageUrl || undefined,
        source: isPolymarket ? "Polymarket" : "Pumpfun",
        category: formValues.category,
        startDate: startDateUnix,
        endDate: endDateUnix,
        ...(formValues.oracleFeed
          ? {
              oracleFeed: new PublicKey(formValues.oracleFeed),
              priceTarget: formValues.priceTarget
                ? (() => {
                    // Use string-based BN multiplication to avoid JS number overflow
                    // Price target is stored with 9 decimals on-chain
                    const value = formValues.priceTarget.trim();
                    const parts = value.split(".");
                    const wholePart = parts[0] || "0";
                    const decimalPart = (parts[1] || "").padEnd(9, "0").slice(0, 9);
                    return new BN(wholePart + decimalPart);
                  })()
                : undefined,
              comparisonType: parseInt(formValues.comparisonType),
              metricType: formValues.metricType
                ? parseInt(formValues.metricType)
                : undefined,
            }
          : {}),
      });

      if (result) {
        // Save market to database
        try {
          await apiClient.post("/api/markets", {
            marketId: result.marketPda.toString(),
            title: formValues.marketName,
            description: formValues.question || undefined,
            question: formValues.question || undefined,
            slug: formValues.slug || undefined,
            imageUrl: formValues.imageUrl || undefined,
            source: isPolymarket ? "Polymarket" : "Pumpfun",
            category: formValues.category,
            creatorWallet: address || undefined,
            yesTokenMint: result.yesToken.toString(),
            noTokenMint: result.noToken.toString(),
            startDate: formValues.startDate
              ? parseDate(formValues.startDate)!.toISOString()
              : undefined,
            endDate: formValues.endDate
              ? parseDate(formValues.endDate)!.toISOString()
              : undefined,
            tokenSymbol: formValues.tokenSymbol || undefined,
            tokenAddress: formValues.tokenAddress || undefined,
            polymarketConditionId: polymarketMetaRef.current.conditionId || undefined,
            polymarketSlug: polymarketMetaRef.current.polymarketSlug || undefined,
            polymarketMarketId: polymarketMetaRef.current.polymarketMarketId || undefined,
            resolutionSource: polymarketMetaRef.current.resolutionSource || undefined,
          });
        } catch (dbError) {
          console.error("Failed to save market to database:", dbError);
          toast.error("Market created on-chain but failed to save to database");
        }

        toast.success("Market created!");
        router.push(`/markets/${result.marketPda.toString()}`);
      }
    } catch (error) {
      console.error("Failed to create market:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-xl">
        <div className="mb-8">
          <Link
            href="/markets"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Back to Markets
          </Link>
        </div>

        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-2">Create Market</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Launch a new prediction market. Initial liquidity of 0.1 SOL will be
            seeded.
          </p>

          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Market Name / Ticker *
              </label>
              <Input
                placeholder="e.g. TRUMP2024"
                value={formValues.marketName}
                onChange={(e) =>
                  setFormValues((prev) => ({
                    ...prev,
                    marketName: e.target.value,
                  }))
                }
              />
              {errors.marketName && (
                <p className="text-destructive text-xs mt-1">
                  {errors.marketName}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Market Question <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. Will X happen by 2025?"
                value={formValues.question}
                onChange={(e) => {
                  setFormValues((prev) => ({ ...prev, question: e.target.value }));
                  if (errors.question) setErrors((prev) => ({ ...prev, question: undefined }));
                }}
              />
              {errors.question && (
                <p className="text-destructive text-xs mt-1">{errors.question}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Slug (optional)
              </label>
              <Input
                placeholder="e.g. whitewhale-price-tomorrow"
                value={formValues.slug}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, slug: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Market Image
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              {imageUrl ? (
                <div className="relative inline-block">
                  <img
                    src={imageUrl}
                    alt="Market"
                    className="h-24 w-24 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setFormValues((prev) => ({ ...prev, imageUrl: "" }))
                    }
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Upload Image
                </Button>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <select
                value={formValues.category}
                onChange={(e) =>
                  setFormValues((prev) => ({
                    ...prev,
                    category: e.target.value as FormValues["category"],
                  }))
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} disabled={c !== "Crypto"}>
                    {c}{c !== "Crypto" ? " (Coming soon)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Token fields (shown only for Crypto category) */}
            {formValues.category === "Crypto" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Token Symbol
                  </label>
                  <Input
                    placeholder="e.g., SOL, PENGUIN"
                    value={formValues.tokenSymbol}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        tokenSymbol: e.target.value.toUpperCase(),
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Token Address
                  </label>
                  <Input
                    placeholder="Solana mint address (optional)"
                    className="font-mono text-xs"
                    value={formValues.tokenAddress}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        tokenAddress: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            )}

            {/* Timezone toggle for date fields */}
            <div className="flex items-center gap-1 rounded-md border border-input p-0.5 w-fit">
              <button
                type="button"
                onClick={() => setTimeZone("utc")}
                className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                  timeZone === "utc"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                UTC
              </button>
              <button
                type="button"
                onClick={() => setTimeZone("local")}
                className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                  timeZone === "local"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Local ({localOffsetLabel})
              </button>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Start Date (optional)
              </label>
              <Input
                type="datetime-local"
                value={formValues.startDate}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, startDate: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                When the market opens for trading (leave empty = immediately)
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                End Date <span className="text-destructive">*</span>
              </label>
              <Input
                type="datetime-local"
                value={formValues.endDate}
                onChange={(e) => {
                  setFormValues((prev) => ({ ...prev, endDate: e.target.value }));
                  if (errors.endDate) setErrors((prev) => ({ ...prev, endDate: undefined }));
                }}
              />
              {errors.endDate && (
                <p className="text-destructive text-xs mt-1">{errors.endDate}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                When the market closes for trading and resolution
              </p>
            </div>

            {/* Oracle Configuration */}
            <div className="border border-input rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Oracle Configuration</p>
                  <p className="text-xs text-muted-foreground">
                    Configure a Switchboard oracle feed for automated, trustless
                    resolution.
                  </p>
                </div>
                <CreateFeedDialog
                  onFeedCreated={(pubkey) =>
                    setFormValues((prev) => ({ ...prev, oracleFeed: pubkey }))
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Oracle Feed Address
                </label>
                <Input
                  placeholder="Switchboard feed pubkey"
                  className="font-mono text-xs"
                  value={formValues.oracleFeed}
                  onChange={(e) =>
                    setFormValues((prev) => ({
                      ...prev,
                      oracleFeed: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Price Target{formValues.oracleFeed && <span className="text-destructive"> *</span>}
                </label>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g. 100000"
                  value={formValues.priceTarget}
                  onChange={(e) =>
                    setFormValues((prev) => ({
                      ...prev,
                      priceTarget: e.target.value,
                    }))
                  }
                />
                {errors.priceTarget && (
                  <p className="text-destructive text-xs mt-1">{errors.priceTarget}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Target value for oracle comparison
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Condition
                  </label>
                  <select
                    value={formValues.comparisonType}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        comparisonType: e.target.value,
                      }))
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="0">Greater Than</option>
                    <option value="1">Less Than</option>
                    <option value="2">Equal To</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Metric
                    {detectedMetricLabel && (
                      <span className="ml-2 text-xs font-normal text-emerald-500">
                        Auto-detected: {detectedMetricLabel}
                      </span>
                    )}
                  </label>
                  <select
                    value={formValues.metricType}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        metricType: e.target.value,
                      }))
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Default (Price)</option>
                    {Object.entries(METRIC_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Market...
                </>
              ) : (
                <>
                  <Rocket className="mr-2 h-4 w-4" />
                  Launch Market
                </>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
