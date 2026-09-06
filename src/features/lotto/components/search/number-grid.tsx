"use client";

import { cn } from "@/shared/lib/utils";

const ALL_NUMBERS = Array.from({ length: 45 }, (_, i) => i + 1);

function selectedTone(num: number) {
  if (num <= 10) return "bg-yellow-500 border-yellow-500 text-white";
  if (num <= 20) return "bg-blue-500 border-blue-500 text-white";
  if (num <= 30) return "bg-red-500 border-red-500 text-white";
  if (num <= 40) return "bg-gray-500 border-gray-500 text-white";
  return "bg-green-500 border-green-500 text-white";
}

interface NumberGridProps {
  selected: number[];
  onChange: (next: number[]) => void;
  /** 이 개수에 도달하면 나머지 번호는 비활성화된다 */
  max: number;
  disabled?: boolean;
  className?: string;
}

/** 1~45 번호를 토글로 고르는 격자. 정렬된 배열을 돌려준다. */
export function NumberGrid({
  selected,
  onChange,
  max,
  disabled = false,
  className,
}: NumberGridProps) {
  const isFull = selected.length >= max;

  const toggle = (num: number) => {
    if (selected.includes(num)) {
      onChange(selected.filter((n) => n !== num));
      return;
    }
    if (isFull) return;
    onChange([...selected, num].sort((a, b) => a - b));
  };

  return (
    <div
      role="group"
      aria-label="번호 선택"
      className={cn("grid grid-cols-9 gap-1.5 sm:gap-2", className)}
    >
      {ALL_NUMBERS.map((num) => {
        const isSelected = selected.includes(num);
        const isDisabled = disabled || (!isSelected && isFull);
        return (
          <button
            key={num}
            type="button"
            aria-pressed={isSelected}
            disabled={isDisabled}
            onClick={() => toggle(num)}
            className={cn(
              "h-8 w-8 sm:h-9 sm:w-9 rounded-full border text-xs sm:text-sm font-semibold transition-colors",
              isSelected
                ? selectedTone(num)
                : "bg-background border-border hover:bg-muted",
              isDisabled && !isSelected && "opacity-40 cursor-not-allowed",
            )}
          >
            {num}
          </button>
        );
      })}
    </div>
  );
}
