"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";

interface FixedNumberSelectorProps {
  fixedNumbers: number[];
  disabledNumbers: Set<number>;
  onToggle: (value: number) => void;
}

export function FixedNumberSelector({
  fixedNumbers,
  disabledNumbers,
  onToggle,
}: FixedNumberSelectorProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            D
          </span>
          고정수 선택
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          원하는 번호를 최대 6개까지 고정할 수 있습니다.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <span>선택 {fixedNumbers.length}/6</span>
        </div>
        <div className="grid grid-cols-9 sm:grid-cols-10 md:grid-cols-12 gap-2">
          {Array.from({ length: 45 }, (_, idx) => {
            const value = idx + 1;
            const isSelected = fixedNumbers.includes(value);
            const isDisabled = !isSelected && disabledNumbers.has(value);

            return (
              <button
                key={value}
                type="button"
                disabled={isDisabled}
                aria-pressed={isSelected}
                onClick={() => onToggle(value)}
                className={cn(
                  "w-9 h-9 rounded-lg border text-sm font-semibold transition-colors",
                  "hover:border-primary/60",
                  isSelected &&
                    "bg-primary text-primary-foreground border-primary",
                  !isSelected && "bg-background text-foreground",
                  isDisabled &&
                    "opacity-40 cursor-not-allowed hover:border-muted",
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
