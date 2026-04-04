"use client";

import { Lock, MousePointerClick, Unlock } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

interface RecommendationGroup {
  id: string;
  label: string;
  description: string;
  defaultAction: "fixed" | "excluded";
  numbers: number[];
}

interface LottoRecommendations {
  groups: RecommendationGroup[];
  baseDraw?: {
    drawNo: number;
    drawDate: string;
  } | null;
  hot?: number[];
  cold?: number[];
}

interface FixedExcludedSelectorProps {
  fixedNumbers: number[];
  excludedNumbers: number[];
  onFixedChange: (numbers: number[]) => void;
  onExcludedChange: (numbers: number[]) => void;
  recommendations?: LottoRecommendations | null;
  disabled?: boolean;
}

export function FixedExcludedSelector({
  fixedNumbers,
  excludedNumbers,
  onFixedChange,
  onExcludedChange,
  recommendations,
  disabled = false,
}: FixedExcludedSelectorProps) {
  const handleToggle = (value: number) => {
    if (disabled) return;

    const isFixed = fixedNumbers.includes(value);
    const isExcluded = excludedNumbers.includes(value);

    if (isFixed) {
      onFixedChange(fixedNumbers.filter((n) => n !== value));
      onExcludedChange([...excludedNumbers, value]);
    } else if (isExcluded) {
      onExcludedChange(excludedNumbers.filter((n) => n !== value));
    } else if (fixedNumbers.length < 6) {
      onFixedChange([...fixedNumbers, value]);
    }
  };

  const getButtonStyle = (value: number) => {
    const isFixed = fixedNumbers.includes(value);
    const isExcluded = excludedNumbers.includes(value);

    if (isFixed) {
      return "bg-blue-500 text-white border-blue-500 hover:bg-blue-600";
    }

    if (isExcluded) {
      return "bg-red-500/20 text-red-500 border-red-500/50 line-through hover:bg-red-500/30";
    }

    return "bg-background text-foreground border-border hover:border-primary/60";
  };

  const recommendationGroups = recommendations?.groups ?? [];
  const baseDraw = recommendations?.baseDraw;

  return (
    <Card className={cn(disabled && "opacity-60")}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            1
          </span>
          고정수 / 제외수 선택
          {disabled ? (
            <Lock className="ml-auto h-4 w-4 text-muted-foreground" />
          ) : (
            <Unlock className="ml-auto h-4 w-4 text-primary" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 text-xs sm:flex-row sm:gap-6 sm:text-sm">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-blue-500" />
            <span>고정수</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded border border-red-500/50 bg-red-500/20" />
            <span>제외수</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded border border-border bg-background" />
            <span>선택 가능</span>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border bg-secondary/40 p-3 sm:items-center sm:p-4">
          <div className="shrink-0 rounded-full bg-background p-2 shadow-sm">
            <MousePointerClick className="h-4 w-4 text-primary" />
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
            번호를 클릭할 때마다 `일반 → 고정수 → 제외수 → 일반` 순서로
            바뀝니다. 아래 추천 번호군의 개별 번호를 눌러 바로 반영할 수
            있습니다.
          </p>
        </div>

        {!disabled && recommendationGroups.length > 0 && (
          <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
            <p className="text-sm font-semibold">추천 번호군</p>

            <div className="grid gap-3 lg:grid-cols-2">
              {recommendationGroups.map((group) => (
                <div
                  key={group.id}
                  className="rounded-xl border bg-background p-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">{group.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {group.description}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-medium",
                        group.defaultAction === "fixed"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-sky-100 text-sky-700",
                      )}
                    >
                      기본 제안:{" "}
                      {group.defaultAction === "fixed" ? "고정수" : "제외수"}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {group.numbers.map((num) => {
                      const isFixed = fixedNumbers.includes(num);
                      const isExcluded = excludedNumbers.includes(num);

                      return (
                        <button
                          key={`${group.id}-${num}`}
                          type="button"
                          onClick={() => handleToggle(num)}
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
                            isFixed
                              ? "border-blue-500 bg-blue-500 text-white"
                              : isExcluded
                                ? "border-red-500/50 bg-red-500/20 text-red-500 line-through"
                                : "border-border bg-background text-foreground hover:bg-muted",
                          )}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {baseDraw && (
              <div className="rounded-lg border border-dashed bg-background/70 px-3 py-2 text-xs text-muted-foreground">
                기준 회차: {baseDraw.drawNo}회 / 기준 추첨일:{" "}
                {baseDraw.drawDate}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            고정수
            <span className="font-semibold text-blue-500">
              {fixedNumbers.length}/6
            </span>
          </span>
          <span>
            제외수
            <span className="font-semibold text-red-500">
              {excludedNumbers.length}개
            </span>
          </span>
        </div>

        <div className="grid grid-cols-9 gap-1.5 sm:gap-2">
          {Array.from({ length: 45 }, (_, idx) => {
            const value = idx + 1;

            return (
              <button
                key={value}
                type="button"
                disabled={disabled}
                onClick={() => handleToggle(value)}
                className={cn(
                  "aspect-square rounded-lg border text-xs font-semibold transition-all duration-200 sm:text-sm",
                  getButtonStyle(value),
                  disabled && "cursor-not-allowed",
                )}
              >
                {value}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
