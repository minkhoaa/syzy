"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ShieldCheck, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ShieldedTransactionStep {
  id: string;
  label: string;
  status: "pending" | "processing" | "completed" | "failed";
}

interface ShieldedTransactionModalProps {
  isOpen: boolean;
  steps: ShieldedTransactionStep[];
  currentStep: number;
  totalSteps: number;
  transactionType: "buy" | "sell" | "claim";
  onClose?: () => void;
}

export function ShieldedTransactionModal({
  isOpen,
  steps,
  currentStep,
  totalSteps,
  transactionType,
  onClose,
}: ShieldedTransactionModalProps) {
  const isComplete = steps.every((s) => s.status === "completed");
  const hasFailed = steps.some((s) => s.status === "failed");

  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="max-w-md p-0 gap-0 border-border/50 bg-background overflow-hidden [&>button]:hidden shadow-[0_8px_30px_rgb(0,0,0,0.5)]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Shielded Transaction in Progress</DialogTitle>

        {/* Header */}
        <div className="relative p-6 pb-4 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,165,0,0.15),transparent_70%)]" />

          <div className="relative">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/30 ring-4 ring-teal-500/20">
              {isComplete ? (
                <CheckCircle2 className="w-8 h-8 text-white" />
              ) : (
                <ShieldCheck className="w-8 h-8 text-white animate-pulse" />
              )}
            </div>

            <h2 className="text-xl font-bold text-foreground mb-1">
              {isComplete
                ? "Transaction Complete!"
                : hasFailed
                  ? "Transaction Issue"
                  : `Shielded ${transactionType === "buy" ? "Buy" : transactionType === "claim" ? "Claim" : "Sell"} in Progress`}
            </h2>

            <p className="text-sm text-muted-foreground">
              {isComplete
                ? "All transactions have been processed successfully."
                : `Step ${currentStep} of ${totalSteps}`}
            </p>
          </div>
        </div>

        {/* Warning Banner */}
        {!isComplete && !hasFailed && (
          <div className="mx-6 mb-4 p-3 rounded-lg bg-teal-500/10 border border-teal-500/20">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-teal-500 mb-1">
                  Do not close this window
                </p>
                <p className="text-xs text-teal-500/80 leading-relaxed">
                  Canceling any transaction after the first one or closing your browser
                  may result in <span className="font-bold">partial loss of funds</span>.
                  Please wait for all transactions to complete.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="px-6 pb-6 space-y-3">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all",
                step.status === "completed" && "bg-emerald-500/10 border-emerald-500/30",
                step.status === "processing" && "bg-teal-500/10 border-teal-500/30 shadow-sm",
                step.status === "pending" && "bg-muted/10 border-border/50 opacity-60",
                step.status === "failed" && "bg-destructive/10 border-destructive/30"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold",
                  step.status === "completed" && "bg-secondary text-white",
                  step.status === "processing" && "bg-gradient-to-br from-teal-400 to-teal-500 text-white",
                  step.status === "pending" && "bg-muted text-muted-foreground",
                  step.status === "failed" && "bg-destructive text-white"
                )}
              >
                {step.status === "completed" ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : step.status === "processing" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : step.status === "failed" ? (
                  "!"
                ) : (
                  index + 1
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium truncate",
                    step.status === "completed" && "text-emerald-500",
                    step.status === "processing" && "text-teal-500",
                    step.status === "pending" && "text-muted-foreground",
                    step.status === "failed" && "text-destructive"
                  )}
                >
                  {step.label}
                </p>
                {step.status === "processing" && (
                  <p className="text-xs text-teal-500/80 mt-0.5">
                    {step.id.startsWith("batch-")
                      ? "Processing via TEE (1 signature needed)..."
                      : "Waiting for wallet confirmation..."}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Progress Bar */}
        {!isComplete && !hasFailed && (
          <div className="h-1 bg-muted">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-teal-500 transition-all duration-500"
              style={{
                width: `${(steps.filter((s) => s.status === "completed").length / totalSteps) * 100}%`,
              }}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
