"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Rocket } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePredictionMarket } from "@/features/trading/hooks/use-prediction-market";
import { useReownWallet } from "@/features/auth/hooks/use-reown-wallet";
import { apiClient } from "@/lib/kubb";

interface CloneMarketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: "polymarket" | "kalshi";
  title: string;
  imageUrl?: string;
  category?: string;
  endDate?: string;
  isBinary: boolean;
  question?: string;
  outcomes?: string[];
  polymarketMeta?: {
    conditionId?: string;
    slug?: string;
    marketId?: string;
    resolutionSource?: string;
  };
  kalshiMeta?: {
    eventTicker?: string;
    marketTicker?: string;
  };
}

function generateSlug(text: string): string {
  const base = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .slice(0, 120);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

function generateMarketName(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
}

export function CloneMarketDialog({
  open,
  onOpenChange,
  source,
  title,
  imageUrl,
  category: initialCategory,
  endDate: initialEndDate,
  isBinary,
  question,
  outcomes,
  polymarketMeta,
  kalshiMeta,
}: CloneMarketDialogProps) {
  const router = useRouter();
  const { createMarketWithOptions } = usePredictionMarket();
  const { address } = useReownWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [questionText, setQuestionText] = useState(
    () => (question || title || "").slice(0, 100)
  );
  const [marketName, setMarketName] = useState(() =>
    generateMarketName(question || title || "")
  );
  const [marketNameManuallyEdited, setMarketNameManuallyEdited] = useState(false);
  const [category, setCategory] = useState(initialCategory || "Crypto");
  const [endDate, setEndDate] = useState(() =>
    initialEndDate ? initialEndDate.slice(0, 16) : ""
  );

  // Reset form when dialog opens with new props
  const [lastTitle, setLastTitle] = useState(title);
  if (title !== lastTitle) {
    setLastTitle(title);
    setQuestionText((question || title || "").slice(0, 100));
    setMarketName(generateMarketName(question || title || ""));
    setMarketNameManuallyEdited(false);
    setCategory(initialCategory || "Crypto");
    setEndDate(initialEndDate ? initialEndDate.slice(0, 16) : "");
  }

  const handleQuestionChange = (value: string) => {
    const trimmed = value.slice(0, 100);
    setQuestionText(trimmed);
    if (!marketNameManuallyEdited) {
      setMarketName(generateMarketName(trimmed));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedMarketName = marketName.replace(/\s+/g, "-").slice(0, 32);
    if (!sanitizedMarketName.trim()) {
      toast.error("Market name is required");
      return;
    }
    if (isBinary && !questionText.trim()) {
      toast.error("Question is required");
      return;
    }
    if (!endDate) {
      toast.error("End date is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const endDateUnix = Math.floor(new Date(endDate + "Z").getTime() / 1000);
      const sourceLabel = source === "polymarket" ? "Polymarket" : "Kalshi";

      if (isBinary) {
        // --- Binary market flow ---
        const slug = generateSlug(questionText);
        const result = await createMarketWithOptions({
          marketName: sanitizedMarketName,
          question: questionText,
          endDate: endDateUnix,
          slug,
          imageUrl: imageUrl || undefined,
          source: sourceLabel,
          category,
        });

        if (result) {
          try {
            await apiClient.post("/api/markets", {
              marketId: result.marketPda.toString(),
              title: sanitizedMarketName,
              question: questionText,
              slug,
              imageUrl: imageUrl || undefined,
              source: sourceLabel,
              category,
              creatorWallet: address || undefined,
              yesTokenMint: result.yesToken.toString(),
              noTokenMint: result.noToken.toString(),
              endDate: new Date(endDate + "Z").toISOString(),
              polymarketConditionId: polymarketMeta?.conditionId || undefined,
              polymarketSlug: polymarketMeta?.slug || undefined,
              polymarketMarketId: polymarketMeta?.marketId || undefined,
              resolutionSource: polymarketMeta?.resolutionSource || undefined,
              kalshiEventTicker: kalshiMeta?.eventTicker || undefined,
              kalshiMarketTicker: kalshiMeta?.marketTicker || undefined,
            });
          } catch (dbError) {
            console.error("Failed to save market to database:", dbError);
            toast.error(
              "Market created on-chain but failed to save to database"
            );
          }

          toast.success("Market created!");
          onOpenChange(false);
          router.push(`/markets/${slug}`);
        }
      } else {
        // --- Multi-outcome flow ---
        if (!outcomes || outcomes.length < 2) {
          toast.error("At least 2 outcomes required");
          return;
        }

        const groupSlug = generateSlug(title);
        const endDateIso = new Date(endDate + "Z").toISOString();

        // 1. Create parent market (isMultiOutcome)
        let parentMarketRes: { data: { id: string } };
        try {
          parentMarketRes = await apiClient.post("/api/markets", {
            marketId: `parent-${groupSlug}`,
            title,
            slug: groupSlug,
            imageUrl: imageUrl || undefined,
            category,
            source: sourceLabel,
            creatorWallet: address || undefined,
            endDate: endDateIso,
            isMultiOutcome: true,
            mutuallyExclusive: true,
          });
        } catch (err) {
          console.error("Failed to create parent market:", err);
          toast.error("Failed to create parent market");
          return;
        }

        const parentData = (parentMarketRes.data as { data?: { id?: string }; id?: string });
        const parentId = parentData?.data?.id ?? parentData?.id;

        // 2. Create on-chain markets for each outcome
        for (let i = 0; i < outcomes.length; i++) {
          const outcome = outcomes[i];
          toast.info(
            `Creating market ${i + 1}/${outcomes.length}: ${outcome}...`
          );

          const outcomeMarketName = generateMarketName(outcome);
          const marketSlug = generateSlug(`${title}-${outcome}`);
          const result = await createMarketWithOptions({
            marketName: outcomeMarketName,
            question: outcome,
            slug: marketSlug,
            imageUrl: imageUrl || undefined,
            source: sourceLabel,
            category,
            endDate: endDateUnix,
          });

          if (result) {
            // Save sub-market with parentMarketId
            try {
              await apiClient.post("/api/markets", {
                marketId: result.marketPda.toString(),
                title: outcome,
                question: outcome,
                slug: marketSlug,
                imageUrl: imageUrl || undefined,
                source: sourceLabel,
                category,
                creatorWallet: address || undefined,
                yesTokenMint: result.yesToken.toString(),
                noTokenMint: result.noToken.toString(),
                endDate: endDateIso,
                parentMarketId: parentId || undefined,
                outcomeLabel: outcome,
                sortOrder: i,
                kalshiEventTicker: kalshiMeta?.eventTicker || undefined,
                kalshiMarketTicker: kalshiMeta?.marketTicker || undefined,
              });
            } catch {
              // Non-critical
            }

          }
        }

        toast.success("Multi-outcome market created!");
        onOpenChange(false);
        router.push(`/markets/${groupSlug}`);
      }
    } catch (error) {
      console.error("Failed to clone market:", error);
      toast.error("Failed to create market");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Clone Market</DialogTitle>
          <DialogDescription>
            Create a Syzy market from this{" "}
            {source === "polymarket" ? "Polymarket" : "Kalshi"} event.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Source badge + image */}
          <div className="flex items-start gap-3">
            {imageUrl && (
              <div className="w-12 h-12 relative rounded-lg overflow-hidden shrink-0 bg-muted">
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex flex-col gap-1.5 min-w-0">
              <Badge
                variant="secondary"
                className={
                  source === "polymarket"
                    ? "w-fit px-1.5 py-0 h-4 text-[9px] font-bold tracking-wider uppercase border-0 bg-blue-500/10 text-blue-500 rounded-sm"
                    : "w-fit px-1.5 py-0 h-4 text-[9px] font-bold tracking-wider uppercase border-0 bg-teal-500/10 text-teal-500 rounded-sm"
                }
              >
                {source === "polymarket" ? "Polymarket" : "Kalshi"}
              </Badge>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {title}
              </p>
            </div>
          </div>

          {/* Question (editable for binary) */}
          {isBinary ? (
            <div>
              <Label className="text-sm font-medium mb-1.5 block">
                Question <span className="text-destructive">*</span>
              </Label>
              <Input
                value={questionText}
                onChange={(e) => handleQuestionChange(e.target.value)}
                placeholder="Full question text (max 100 chars)"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {questionText.length}/100
              </p>
            </div>
          ) : (
            /* Outcomes list (multi-outcome, read-only) */
            outcomes &&
            outcomes.length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-1.5 block">
                  Outcomes ({outcomes.length})
                </Label>
                <div className="bg-muted/50 rounded-md px-3 py-2 space-y-1.5 max-h-40 overflow-y-auto">
                  {outcomes.map((outcome, i) => (
                    <div key={i} className="text-sm">
                      <p className="text-foreground">
                        {i + 1}. {outcome}
                      </p>
                      <p className="text-xs text-muted-foreground ml-4">
                        Name: {generateMarketName(outcome)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          {/* Market name (binary only, auto-generated) */}
          {isBinary && (
            <div>
              <Label className="text-sm font-medium mb-1.5 block">
                Market Name <span className="text-destructive">*</span>
              </Label>
              <Input
                value={marketName}
                onChange={(e) => {
                  setMarketNameManuallyEdited(true);
                  setMarketName(
                    e.target.value
                      .replace(/\s+/g, "-")
                      .slice(0, 32)
                  );
                }}
                placeholder="short-identifier (max 32 chars)"
                maxLength={32}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {marketName.length}/32 — Short identifier, no spaces
                (auto-generated)
              </p>
            </div>
          )}

          {/* Category */}
          <div>
            <Label className="text-sm font-medium mb-1.5 block">
              Category
            </Label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Crypto, Politics, Sports"
            />
          </div>

          {/* End date */}
          <div>
            <Label className="text-sm font-medium mb-1.5 block">
              End Date <span className="text-destructive">*</span>
            </Label>
            <Input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">UTC timezone</p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Rocket className="mr-2 h-4 w-4" />
                  {isBinary ? "Create Market" : `Create ${outcomes?.length ?? 0} Markets`}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
