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
    <div className="w-full relative">
      {/* Background Line */}
      <div className="absolute top-4 left-0 w-full h-0.5 bg-muted -z-10" />

      {/* Progress Line */}
      <div
        className="absolute top-4 left-0 h-0.5 bg-primary -z-10 transition-all duration-300"
        style={{
          width: `${((Math.max(currentStep, Math.max(...Array.from(completedSteps), 0)) - 1) / (STEPS.length - 1)) * 100}%`,
        }}
      />

      <div className="flex justify-around w-full">
        {STEPS.map((stepInfo, index) => {
          const isCompleted = completedSteps.has(
            stepInfo.step as PatternAnalysisStep,
          );
          const isCurrent = currentStep === stepInfo.step;

          return (
            <div
              key={stepInfo.step}
              className="flex flex-col items-center bg-background px-2"
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 bg-background",
                  isCompleted
                    ? "bg-primary text-primary-foreground border-primary"
                    : isCurrent
                      ? "bg-background text-primary border-primary"
                      : "bg-background text-muted-foreground border-muted",
                )}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : stepInfo.step}
              </div>
              <div className="mt-2 text-center">
                <p
                  className={cn(
                    "text-xs sm:text-sm font-medium whitespace-nowrap",
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
          );
        })}
      </div>
    </div>
  );
}
