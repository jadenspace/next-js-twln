"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Slider } from "@/shared/ui/slider";
import { Label } from "@/shared/ui/label";
import type { PatternFilterState } from "../../types/pattern-filter.types";

interface MathFilterPanelProps {
  filters: PatternFilterState;
  onFiltersChange: (filters: PatternFilterState) => void;
}

interface RangeFilterProps {
  label: string;
  description: string;
  value: [number, number];
  min: number;
  max: number;
  onChange: (value: [number, number]) => void;
}

function RangeFilter({
  label,
  description,
  value,
  min,
  max,
  onChange,
}: RangeFilterProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <span className="text-sm font-mono text-primary">
          {value[0]} ~ {value[1]}개
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={1}
        value={value}
        onValueChange={(v) => onChange(v as [number, number])}
        className="w-full"
      />
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

export function MathFilterPanel({
  filters,
  onFiltersChange,
}: MathFilterPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            C
          </span>
          수학적 성질
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 소수 개수 */}
        <RangeFilter
          label="소수 개수"
          description="1~45 중 소수: 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43 (14개)"
          value={filters.primeCount}
          min={0}
          max={3}
          onChange={(value) =>
            onFiltersChange({ ...filters, primeCount: value })
          }
        />

        {/* 합성수 개수 */}
        <RangeFilter
          label="합성수 개수"
          description="1과 소수를 제외한 숫자 (4, 6, 8, 9, 10, ... 총 30개)"
          value={filters.compositeCount}
          min={0}
          max={3}
          onChange={(value) =>
            onFiltersChange({ ...filters, compositeCount: value })
          }
        />

        {/* 3의 배수 개수 */}
        <RangeFilter
          label="3의 배수 개수"
          description="3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45 (15개)"
          value={filters.multiplesOf3}
          min={0}
          max={3}
          onChange={(value) =>
            onFiltersChange({ ...filters, multiplesOf3: value })
          }
        />

        {/* 5의 배수 개수 */}
        <RangeFilter
          label="5의 배수 개수"
          description="5, 10, 15, 20, 25, 30, 35, 40, 45 (9개)"
          value={filters.multiplesOf5}
          min={0}
          max={2}
          onChange={(value) =>
            onFiltersChange({ ...filters, multiplesOf5: value })
          }
        />

        {/* 제곱수 개수 */}
        <RangeFilter
          label="제곱수 개수"
          description="1, 4, 9, 16, 25, 36 (6개)"
          value={filters.squareCount}
          min={0}
          max={2}
          onChange={(value) =>
            onFiltersChange({ ...filters, squareCount: value })
          }
        />
      </CardContent>
    </Card>
  );
}
