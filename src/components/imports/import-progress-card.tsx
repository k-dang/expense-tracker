"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const steps = [
  { label: "Reading file", duration: 1200 },
  { label: "Processing data", duration: 2400 },
  { label: "Validating rows", duration: 1800 },
] as const;

function StepIndicator({ status }: { status: "done" | "active" | "pending" }) {
  if (status === "done") {
    return (
      <div className="relative flex size-5 items-center justify-center">
        <div className="size-5 rounded-full bg-primary/15" />
        <svg
          aria-hidden="true"
          className="absolute size-3 text-primary animate-in fade-in zoom-in duration-300"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M2.5 6.5L5 9L9.5 3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="[stroke-dasharray:20] [stroke-dashoffset:0] animate-[draw_0.3s_ease-out]"
          />
        </svg>
      </div>
    );
  }
  if (status === "active") {
    return (
      <div className="relative flex size-5 items-center justify-center">
        <div className="absolute size-5 rounded-full bg-primary/10 animate-[pulse-ring_1.5s_ease-in-out_infinite]" />
        <div className="size-2.5 rounded-full bg-primary animate-[pulse-dot_1.5s_ease-in-out_infinite]" />
      </div>
    );
  }
  return (
    <div className="flex size-5 items-center justify-center">
      <div className="size-2 rounded-full bg-muted-foreground/25" />
    </div>
  );
}

export function ImportProgressCard({
  isPending,
  fileNames,
}: {
  isPending: boolean;
  fileNames: string[];
}) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isPending) {
      setCurrentStep(0);
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    let elapsed = 0;

    for (let i = 1; i < steps.length; i++) {
      elapsed += steps[i - 1].duration;
      timers.push(setTimeout(() => setCurrentStep(i), elapsed));
    }

    return () => timers.forEach(clearTimeout);
  }, [isPending]);

  if (!isPending) return null;

  const fileLabel =
    fileNames.length === 1 ? fileNames[0] : `${fileNames.length} files`;

  const progress = ((currentStep + 0.5) / steps.length) * 100;

  return (
    <Card className="border-l-2 border-l-primary/60 animate-in fade-in slide-in-from-top-2 duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <FileText className="size-4 text-primary" />
          Processing {fileLabel}
        </CardTitle>
        <CardDescription className="text-xs">
          This may take a moment…
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2.5">
          {steps.map((step, i) => {
            const status =
              i < currentStep
                ? "done"
                : i === currentStep
                  ? "active"
                  : "pending";
            return (
              <div
                key={step.label}
                className={`flex items-center gap-2.5 transition-opacity duration-300 ${
                  status === "pending" ? "opacity-40" : "opacity-100"
                }`}
              >
                <StepIndicator status={status} />
                <span
                  className={`text-sm transition-colors duration-300 ${
                    status === "active"
                      ? "text-foreground font-medium"
                      : status === "done"
                        ? "text-muted-foreground"
                        : "text-muted-foreground/60"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary/70 transition-[width] duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
