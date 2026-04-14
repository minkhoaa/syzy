"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepState = "inactive" | "active" | "done";

export interface Step {
  id: string;
  label: string;
  state: StepState;
}

interface ProgressStepperProps {
  steps: Step[];
  className?: string;
}

export function ProgressStepper({ steps, className }: ProgressStepperProps) {
  return (
    <div className={cn("flex w-full items-start", className)}>
      {steps.map((step, i) => (
        <div key={step.id} className="flex flex-1 flex-col items-center">
          {/* Dot */}
          <div
            data-step={step.id}
            className={cn(
              "mb-2 flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all duration-300",
              step.state === "done" && "border-green-500 bg-green-500 text-white animate-stepper-pop",
              step.state === "active" && "border-primary bg-primary/10 text-primary",
              step.state === "inactive" && "border-border bg-background text-muted-foreground"
            )}
          >
            {step.state === "done" ? (
              <Check className="h-4 w-4" />
            ) : (
              <span>{i + 1}</span>
            )}
          </div>

          {/* Label */}
          <span
            className={cn(
              "text-center text-xs font-medium leading-tight",
              step.state === "done" && "text-green-600",
              step.state === "active" && "text-primary",
              step.state === "inactive" && "text-muted-foreground"
            )}
          >
            {step.label}
          </span>

          {/* Connector line */}
          {i < steps.length - 1 && (
            <div className="mt-4 h-0.5 w-full overflow-hidden rounded-full">
              <div
                className={cn(
                  "h-full w-full rounded-full transition-all duration-500 ease-out",
                  step.state === "done" ? "bg-green-500" : "bg-border"
                )}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
