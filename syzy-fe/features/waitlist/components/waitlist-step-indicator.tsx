"use client";

import { ProgressStepper, type Step } from "./progress-stepper";

interface WaitlistStepIndicatorProps {
  currentStep: 1 | 2 | 3;
}

export function WaitlistStepIndicator({ currentStep }: WaitlistStepIndicatorProps) {
  const steps: Step[] = [
    {
      id: "connect",
      label: "Connect",
      state: currentStep > 1 ? "done" : currentStep === 1 ? "active" : "inactive",
    },
    {
      id: "register",
      label: "Register",
      state: currentStep > 2 ? "done" : currentStep === 2 ? "active" : "inactive",
    },
    {
      id: "share",
      label: "Share",
      state: currentStep === 3 ? "done" : "inactive",
    },
  ];

  return <ProgressStepper steps={steps} />;
}
