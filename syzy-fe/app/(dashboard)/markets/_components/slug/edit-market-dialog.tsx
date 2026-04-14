"use client";

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MarketAccount } from "@/types/prediction-market.types";
import { usePredictionMarket } from "@/features/trading/hooks/use-prediction-market";

interface EditMarketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  market: MarketAccount;
  marketAddress: string;
  refresh: () => void;
}

export function EditMarketDialog({
  open,
  onOpenChange,
  market,
  marketAddress,
  refresh,
}: EditMarketDialogProps) {
  const { updateMarket } = usePredictionMarket();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [marketName, setMarketName] = useState(market.marketName ?? "");
  const [question, setQuestion] = useState(market.question ?? "");
  const [slug, setSlug] = useState(market.slug ?? "");
  const [imageUrl, setImageUrl] = useState(market.imageUrl ?? "");
  const [source, setSource] = useState(market.source ?? "");
  const [category, setCategory] = useState(market.category ?? "");

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const params: Record<string, string> = {};
      if (marketName !== (market.marketName ?? "")) params.marketName = marketName;
      if (question !== (market.question ?? "")) params.question = question;
      if (slug !== (market.slug ?? "")) params.slug = slug;
      if (imageUrl !== (market.imageUrl ?? "")) params.imageUrl = imageUrl;
      if (source !== (market.source ?? "")) params.source = source;
      if (category !== (market.category ?? "")) params.category = category;

      if (Object.keys(params).length === 0) {
        toast.info("No changes to save");
        return;
      }

      await updateMarket(new PublicKey(marketAddress), params);
      refresh();
      onOpenChange(false);
    } catch {
      // Error toast is handled inside updateMarket
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Market</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="marketName">Market Name (max 32)</Label>
            <Input
              id="marketName"
              value={marketName}
              onChange={(e) => setMarketName(e.target.value)}
              maxLength={32}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="question">Question (max 100)</Label>
            <Input
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug (max 128)</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              maxLength={128}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL (max 256)</Label>
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              maxLength={256}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Source (max 32)</Label>
            <Input
              id="source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              maxLength={32}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category (max 32)</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              maxLength={32}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
