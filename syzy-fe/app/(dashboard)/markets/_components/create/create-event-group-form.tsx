"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PublicKey, Connection } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { Rocket, Loader2, Upload, X, Plus, Trash2 } from "lucide-react";
import { uploadFileToR2 } from "@/lib/r2-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { usePredictionMarket } from "@/features/trading/hooks/use-prediction-market";
import { useReownWallet } from "@/features/auth/hooks/use-reown-wallet";
import { apiClient } from "@/lib/kubb";
import { CreateFeedDialog } from "@/components/prediction/create-feed-dialog";
import { METRIC_LABELS } from "@/lib/switchboard/job-templates";
import { detectFeedMetric } from "@/lib/switchboard/detect-metric";
import { RPC_URL, CLUSTER } from "@/lib/constants/network";

const CATEGORIES = ["Crypto", "Politics", "Sports", "Entertainment", "Science", "Other"] as const;

const outcomeSchema = z.object({
  label: z.string().min(1, "Label is required").max(32, "Max 32 characters"),
  priceTarget: z.string().optional(),
  comparisonType: z.string().optional(),
});

const formSchema = z.object({
  title: z.string().min(3, "Min 3 characters").max(100, "Max 100 characters"),
  description: z.string().max(500).optional(),
  slug: z.string().min(1, "Slug is required").max(128),
  imageUrl: z.string().optional(),
  category: z.enum(CATEGORIES),
  mutuallyExclusive: z.boolean(),
  endDate: z.string().min(1, "End date is required"),
  tokenSymbol: z.string().optional(),
  tokenAddress: z.string().optional(),
  oracleFeed: z.string().optional(),
  metricType: z.string().optional(),
  outcomes: z.array(outcomeSchema).min(2, "At least 2 outcomes").max(16, "Max 16 outcomes"),
});

type FormValues = z.infer<typeof formSchema>;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function CreateEventGroupForm() {
  const router = useRouter();
  const { address } = useReownWallet();
  const { createMarketWithOptions } = usePredictionMarket();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [detectedMetricLabel, setDetectedMetricLabel] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const connection = useMemo(() => new Connection(RPC_URL, CLUSTER), []);
  const searchParams = useSearchParams();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      slug: "",
      imageUrl: "",
      category: "Crypto",
      mutuallyExclusive: true,
      endDate: "",
      tokenSymbol: "",
      tokenAddress: "",
      oracleFeed: "",
      metricType: "",
      outcomes: [
        { label: "", priceTarget: "", comparisonType: "0" },
        { label: "", priceTarget: "", comparisonType: "0" },
      ],
    },
  });

  // Polymarket metadata ref (set during pre-fill, used on submit)
  const polymarketMetaRef = useRef<{
    polymarketEventId?: string;
    polymarketSlug?: string;
    resolutionSource?: string;
  }>({});

  // Pre-fill from Polymarket source
  useEffect(() => {
    if (searchParams.get("source") === "polymarket") {
      const title = searchParams.get("title");
      const imageUrl = searchParams.get("imageUrl");
      const category = searchParams.get("category");
      const endDate = searchParams.get("endDate");
      const outcomesStr = searchParams.get("outcomes");

      if (title) {
        setValue("title", title);
        setValue("slug", slugify(title));
      }
      if (imageUrl) setValue("imageUrl", imageUrl);
      if (category && CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
        setValue("category", category as (typeof CATEGORIES)[number]);
      }
      if (endDate) setValue("endDate", endDate.slice(0, 16));
      if (outcomesStr) {
        try {
          const outcomes: string[] = JSON.parse(outcomesStr);
          if (Array.isArray(outcomes) && outcomes.length >= 2) {
            setValue(
              "outcomes",
              outcomes.map((label) => ({
                label,
                priceTarget: "",
                comparisonType: "0",
              }))
            );
          }
        } catch {
          // Invalid JSON, ignore
        }
      }
      // Store Polymarket metadata for submit
      polymarketMetaRef.current = {
        polymarketEventId: searchParams.get("polymarketEventId") || undefined,
        polymarketSlug: searchParams.get("polymarketSlug") || undefined,
        resolutionSource: searchParams.get("resolutionSource") || undefined,
      };
    }
  }, [searchParams, setValue]);

  const watchOracleFeed = watch("oracleFeed");

  // Auto-detect metric type when oracle feed address changes
  useEffect(() => {
    const oracleFeed = (watchOracleFeed || "").trim();
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
        setValue("metricType", String(result.metricType));
        if (result.tokenAddress) setValue("tokenAddress", result.tokenAddress);
        if (result.tokenSymbol) setValue("tokenSymbol", result.tokenSymbol);
        setDetectedMetricLabel(result.label);

        if (result.tokenAddress && !result.tokenSymbol) {
          try {
            const res = await fetch(`/api/dexscreener?mint=${result.tokenAddress}`);
            if (!cancelled && res.ok) {
              const data = await res.json();
              const symbol = data?.[0]?.baseToken?.symbol;
              if (symbol) setValue("tokenSymbol", symbol.toUpperCase());
            }
          } catch {
            // Non-critical
          }
        }
      } else {
        setDetectedMetricLabel(null);
      }
    });

    return () => { cancelled = true; };
  }, [watchOracleFeed, connection, setValue]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "outcomes",
  });

  const watchTitle = watch("title");
  const watchImageUrl = watch("imageUrl");

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setValue("title", title);
    setValue("slug", slugify(title));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    setUploadingImage(true);
    try {
      const result = await uploadFileToR2(file);
      setValue("imageUrl", result.url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const endDateIso = new Date(data.endDate + "Z").toISOString();

      // 1. Create parent market (isMultiOutcome) in backend
      let parentId: string | undefined;
      try {
        const parentRes = await apiClient.post("/api/markets", {
          marketId: `parent-${data.slug}`,
          title: data.title,
          slug: data.slug,
          imageUrl: data.imageUrl || undefined,
          category: data.category,
          source: "EventGroup",
          creatorWallet: address || undefined,
          endDate: endDateIso,
          isMultiOutcome: true,
          mutuallyExclusive: data.mutuallyExclusive,
          tokenSymbol: data.tokenSymbol || undefined,
          tokenAddress: data.tokenAddress || undefined,
        });
        const unwrapped = parentRes.data?.data ?? parentRes.data;
        parentId = unwrapped?.id;
      } catch (err) {
        console.error("Failed to create parent market:", err);
      }

      // 2. Create on-chain markets for each outcome
      for (let i = 0; i < data.outcomes.length; i++) {
        const outcome = data.outcomes[i];
        toast.info(`Creating market ${i + 1}/${data.outcomes.length}: ${outcome.label}...`);

        const endDateUnix = Math.floor(new Date(data.endDate + "Z").getTime() / 1000);
        const marketSlug = `${data.slug}-${slugify(outcome.label)}`;

        // Build oracle params if oracle feed is configured and outcome has a price target
        const oracleParams = data.oracleFeed?.trim() && outcome.priceTarget?.trim()
          ? {
              oracleFeed: new PublicKey(data.oracleFeed.trim()),
              priceTarget: (() => {
                const value = outcome.priceTarget!.trim();
                const parts = value.split(".");
                const wholePart = parts[0] || "0";
                const decimalPart = (parts[1] || "").padEnd(9, "0").slice(0, 9);
                return new BN(wholePart + decimalPart);
              })(),
              comparisonType: parseInt(outcome.comparisonType || "0"),
              metricType: data.metricType ? parseInt(data.metricType) : undefined,
            }
          : {};

        const result = await createMarketWithOptions({
          marketName: outcome.label,
          question: `${data.title}: ${outcome.label}?`,
          slug: marketSlug,
          imageUrl: data.imageUrl || undefined,
          source: "EventGroup",
          category: data.category,
          endDate: endDateUnix,
          ...oracleParams,
        });

        if (result) {
          // Save sub-market to backend DB with parentMarketId
          try {
            await apiClient.post("/api/markets", {
              marketId: result.marketPda.toString(),
              title: outcome.label,
              description: `${data.title}: ${outcome.label}?`,
              question: `${data.title}: ${outcome.label}?`,
              slug: marketSlug,
              imageUrl: data.imageUrl || undefined,
              source: "EventGroup",
              category: data.category,
              creatorWallet: address || undefined,
              yesTokenMint: result.yesToken.toString(),
              noTokenMint: result.noToken.toString(),
              endDate: endDateIso,
              tokenSymbol: data.tokenSymbol || undefined,
              tokenAddress: data.tokenAddress || undefined,
              parentMarketId: parentId || undefined,
              outcomeLabel: outcome.label,
              sortOrder: i,
            });
          } catch {
            // Non-critical
          }

        }
      }

      toast.success("Multi-outcome market created!");
      router.push(`/markets/${data.slug}`);
    } catch (error) {
      console.error("Failed to create multi-outcome market:", error);
      toast.error("Failed to create multi-outcome market");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h1 className="text-2xl font-bold mb-2">Create Multi-Outcome Market</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Create a multi-outcome market with multiple sub-markets. Each outcome
            becomes its own YES/NO market.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Event Title <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder='e.g. "BTC price on March 5?"'
                {...register("title")}
                onChange={handleTitleChange}
              />
              {errors.title && (
                <p className="text-destructive text-xs mt-1">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Describe the event and resolution criteria"
                {...register("description")}
              />
            </div>

            {/* Slug */}
            <div>
              <label className="text-sm font-medium mb-2 block">Slug</label>
              <Input
                placeholder="btc-price-march-5"
                {...register("slug")}
              />
              {errors.slug && (
                <p className="text-destructive text-xs mt-1">{errors.slug.message}</p>
              )}
            </div>

            {/* Image */}
            <div>
              <label className="text-sm font-medium mb-2 block">Event Image</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              {watchImageUrl ? (
                <div className="relative inline-block">
                  <img
                    src={watchImageUrl}
                    alt="Event"
                    className="h-24 w-24 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => setValue("imageUrl", "")}
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

            {/* Category */}
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <select
                {...register("category")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Group Type */}
            <div>
              <label className="text-sm font-medium mb-2 block">Group Type</label>
              <div className="flex items-center gap-1 rounded-md border border-input p-0.5 w-fit">
                <button
                  type="button"
                  onClick={() => setValue("mutuallyExclusive", true)}
                  className={`px-3 py-1.5 text-xs rounded font-medium transition-colors ${
                    watch("mutuallyExclusive")
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Mutually Exclusive
                </button>
                <button
                  type="button"
                  onClick={() => setValue("mutuallyExclusive", false)}
                  className={`px-3 py-1.5 text-xs rounded font-medium transition-colors ${
                    !watch("mutuallyExclusive")
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Independent
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {watch("mutuallyExclusive")
                  ? "Only one outcome can win (e.g., price ranges)"
                  : "Multiple outcomes can be YES simultaneously"}
              </p>
            </div>

            {/* End Date */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                End Date <span className="text-destructive">*</span>
              </label>
              <Input type="datetime-local" {...register("endDate")} />
              {errors.endDate && (
                <p className="text-destructive text-xs mt-1">{errors.endDate.message}</p>
              )}
            </div>

            {/* Token fields */}
            {watch("category") === "Crypto" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Token Symbol</label>
                  <Input
                    placeholder="e.g. BTC, SOL"
                    {...register("tokenSymbol")}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Token Address</label>
                  <Input
                    placeholder="Mint address (optional)"
                    className="font-mono text-xs"
                    {...register("tokenAddress")}
                  />
                </div>
              </div>
            )}

            {/* Oracle Configuration */}
            <div className="border border-input rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Oracle Configuration</p>
                  <p className="text-xs text-muted-foreground">
                    Configure a Switchboard oracle feed for automated resolution.
                    Each outcome can have its own price target.
                  </p>
                </div>
                <CreateFeedDialog
                  onFeedCreated={(pubkey) => setValue("oracleFeed", pubkey)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Oracle Feed Address
                </label>
                <Input
                  placeholder="Switchboard feed pubkey"
                  className="font-mono text-xs"
                  {...register("oracleFeed")}
                />
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
                  {...register("metricType")}
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

            {/* Outcomes */}
            <div className="border border-input rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Outcomes</p>
                  <p className="text-xs text-muted-foreground">
                    Add 2-16 outcomes. Each becomes a separate YES/NO market.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ label: "", priceTarget: "", comparisonType: "0" })}
                  disabled={fields.length >= 16}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>

              {errors.outcomes?.root && (
                <p className="text-destructive text-xs">{errors.outcomes.root.message}</p>
              )}

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono w-6 shrink-0">
                        {index + 1}.
                      </span>
                      <Input
                        placeholder={`Outcome ${index + 1} label (e.g. "<56k")`}
                        {...register(`outcomes.${index}.label`)}
                      />
                      {fields.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {errors.outcomes?.[index]?.label && (
                      <p className="text-destructive text-xs ml-8">
                        {errors.outcomes[index].label?.message}
                      </p>
                    )}
                    <div className="flex items-center gap-2 ml-8">
                      <select
                        {...register(`outcomes.${index}.comparisonType`)}
                        className="flex h-9 rounded-md border border-input bg-background px-2 py-1 text-xs w-[130px]"
                      >
                        <option value="0">Greater Than</option>
                        <option value="1">Less Than</option>
                        <option value="2">Equal To</option>
                      </select>
                      <Input
                        type="number"
                        step="any"
                        placeholder="Price target (e.g. 56000)"
                        className="h-9 text-xs"
                        {...register(`outcomes.${index}.priceTarget`)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Multi-Outcome Market...
                </>
              ) : (
                <>
                  <Rocket className="mr-2 h-4 w-4" />
                  Launch Multi-Outcome Market
                </>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
