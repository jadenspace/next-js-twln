"use client";

import { cn } from "@/shared/lib/utils";
import { Check } from "lucide-react";
import type { PatternAnalysisStep } from "../../types/pattern-filter.types";

interface StepIndicatorProps {
  currentStep: PatternAnalysisStep;
  completedSteps: Set<PatternAnalysisStep>;
}

const STEPS = [
  { step: 1, title: "고정수/제외수", description: "분석에 사용할 번호 선택" },
  { step: 2, title: "기본 수치 패턴", description: "총합, 홀짝, 고저, AC값" },
  { step: 3, title: "반복/패턴 구조", description: "연속번호, 끝수, 구간" },
] as const;

export function StepIndicator({
  currentStep,
  completedSteps,
}: StepIndicatorProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {STEPS.map((stepInfo, index) => {
          const isCompleted = completedSteps.has(
            stepInfo.step as PatternAnalysisStep,
          );
          const isCurrent = currentStep === stepInfo.step;
          const isPast = stepInfo.step < currentStep;

          return (
            <div key={stepInfo.step} className="flex flex-1 items-center">
              {/* Step Circle */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300",
                    isCompleted &&
                      "bg-primary text-primary-foreground border-primary",
                    isCurrent &&
                      !isCompleted &&
                      "bg-primary/10 text-primary border-primary",
                    !isCurrent &&
                      !isCompleted &&
                      "bg-muted text-muted-foreground border-muted",
                  )}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : stepInfo.step}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isCurrent || isCompleted
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {stepInfo.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                    {stepInfo.description}
                  </p>
                </div>
              </div>

              {/* Connector Line */}
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-2 transition-colors duration-300",
                    isPast || isCompleted ? "bg-primary" : "bg-muted",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
