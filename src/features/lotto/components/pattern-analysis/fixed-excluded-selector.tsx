"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";
import {
  Lock,
  Unlock,
  Flame,
  Snowflake,
  MousePointerClick,
} from "lucide-react";

type SelectionMode = "fixed" | "excluded" | null;

interface FixedExcludedSelectorProps {
  fixedNumbers: number[];
  excludedNumbers: number[];
  onFixedChange: (numbers: number[]) => void;
  onExcludedChange: (numbers: number[]) => void;
  recommendations?: { hot: number[]; cold: number[] } | null;
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
      // 고정수 해제 → 제외수로
      onFixedChange(fixedNumbers.filter((n) => n !== value));
      onExcludedChange([...excludedNumbers, value]);
    } else if (isExcluded) {
      // 제외수 해제 → 일반 상태로
      onExcludedChange(excludedNumbers.filter((n) => n !== value));
    } else {
      // 일반 상태 → 고정수로 (최대 6개 제한)
      if (fixedNumbers.length < 6) {
        onFixedChange([...fixedNumbers, value]);
      }
    }
  };

  const getButtonStyle = (value: number) => {
    const isFixed = fixedNumbers.includes(value);
    const isExcluded = excludedNumbers.includes(value);

    if (isFixed) {
      return "bg-blue-500 text-white border-blue-500 hover:bg-blue-600";
    }
    if (isExcluded) {
      return "bg-red-500/20 text-red-400 border-red-500/50 line-through hover:bg-red-500/30";
    }
    return "bg-background text-foreground border-border hover:border-primary/60";
  };

  return (
    <Card className={cn(disabled && "opacity-60")}>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            1
          </span>
          고정수 / 제외수 선택
          {disabled && (
            <Lock className="w-4 h-4 text-muted-foreground ml-auto" />
          )}
          {!disabled && <Unlock className="w-4 h-4 text-primary ml-auto" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 안내 */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500" />
            <span>고정수 (반드시 포함)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/50" />
            <span>제외수 (절대 미포함)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-background border border-border" />
            <span>선택 가능</span>
          </div>
        </div>

        {/* 사용 안내 */}
        <div className="bg-secondary/40 p-3 sm:p-4 rounded-lg border flex items-start sm:items-center gap-3">
          <div className="p-2 bg-background rounded-full shadow-sm shrink-0">
            <MousePointerClick className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            번호를 클릭할 때마다{" "}
            <strong className="text-foreground border-muted-foreground/50">
              일반
            </strong>{" "}
            → <span className="font-bold text-blue-500">고정수</span> →{" "}
            <span className="font-bold text-red-500">제외수</span> →{" "}
            <strong className="text-foreground border-muted-foreground/50">
              일반
            </strong>{" "}
            순서로 전환됩니다.
          </p>
        </div>
        {/* 추천 번호 (Balanced Strategy) */}
        {recommendations && !disabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 p-3 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-medium text-muted-foreground">
                  최근 강세 (Hot 5)
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recommendations.hot.map((num) => {
                  const isFixed = fixedNumbers.includes(num);
                  const isExcluded = excludedNumbers.includes(num);
                  return (
                    <button
                      key={`hot-${num}`}
                      onClick={() => handleToggle(num)}
                      className={cn(
                        "px-2.5 py-1 text-xs font-semibold rounded-full border transition-colors",
                        isFixed
                          ? "bg-blue-500 text-white border-blue-500"
                          : isExcluded
                            ? "bg-red-500/20 text-red-500/70 border-red-500/50 line-through"
                            : "bg-background text-foreground border-border hover:bg-muted",
                      )}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Snowflake className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-medium text-muted-foreground">
                  최근 약세 (Cold 5)
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recommendations.cold.map((num) => {
                  const isFixed = fixedNumbers.includes(num);
                  const isExcluded = excludedNumbers.includes(num);
                  return (
                    <button
                      key={`cold-${num}`}
                      onClick={() => handleToggle(num)}
                      className={cn(
                        "px-2.5 py-1 text-xs font-semibold rounded-full border transition-colors",
                        isFixed
                          ? "bg-blue-500 text-white border-blue-500"
                          : isExcluded
                            ? "bg-red-500/20 text-red-500/70 border-red-500/50 line-through"
                            : "bg-background text-foreground border-border hover:bg-muted",
                      )}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 선택 현황 */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            고정수:{" "}
            <span className="font-semibold text-blue-500">
              {fixedNumbers.length}/6
            </span>
          </span>
          <span>
            제외수:{" "}
            <span className="font-semibold text-red-400">
              {excludedNumbers.length}개
            </span>
          </span>
        </div>

        {/* 번호 그리드 */}
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
                  "aspect-square rounded-lg border text-xs sm:text-sm font-semibold transition-all duration-200",
                  getButtonStyle(value),
                  disabled && "cursor-not-allowed",
                  // 추천 번호 하이라이트 효과 (뱃지 대신 테두리로 표현 가능하지만 복잡해짐)
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
