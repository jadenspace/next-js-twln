"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Slider } from "@/shared/ui/slider";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { cn } from "@/shared/lib/utils";
import type { PatternFilterState } from "../../types/pattern-filter.types";

const ODD_EVEN_OPTIONS = ["0:6", "1:5", "2:4", "3:3", "4:2", "5:1", "6:0"];
const HIGH_LOW_OPTIONS = ["0:6", "1:5", "2:4", "3:3", "4:2", "5:1", "6:0"];

interface BasicFilterPanelProps {
  filters: PatternFilterState;
  onFiltersChange: (filters: PatternFilterState) => void;
}

export function BasicFilterPanel({
  filters,
  onFiltersChange,
}: BasicFilterPanelProps) {
  const toggleOption = (
    key: "oddEvenRatios" | "highLowRatios",
    value: string,
  ) => {
    const current = filters[key];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, [key]: updated });
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            A
          </span>
          기본 수치 패턴
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* 번호 총합 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">번호 총합</Label>
            <span className="text-sm font-mono text-primary">
              {filters.sumRange[0]} ~ {filters.sumRange[1]}
            </span>
          </div>
          <Slider
            min={21}
            max={255}
            step={1}
            value={filters.sumRange}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                sumRange: value as [number, number],
              })
            }
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>최소 21</span>
            <span className="font-semibold text-primary">추천: 100 ~ 175</span>
            <span>최대 255</span>
          </div>
        </div>

        {/* 홀짝 비율 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">홀짝 비율 (홀수:짝수)</Label>
            <span className="text-xs text-muted-foreground">
              {filters.oddEvenRatios.length}개 선택
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {ODD_EVEN_OPTIONS.map((ratio) => (
              <Button
                key={ratio}
                variant={
                  filters.oddEvenRatios.includes(ratio) ? "default" : "outline"
                }
                size="sm"
                onClick={() => toggleOption("oddEvenRatios", ratio)}
                className={cn(
                  "min-w-[52px]",
                  filters.oddEvenRatios.includes(ratio) &&
                    "bg-primary hover:bg-primary/90",
                )}
              >
                {ratio}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            추천: 2:4, 3:3, 4:2 (극단적 비율 제외)
          </p>
        </div>

        {/* 고저 비율 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              고저 비율 (고번호:저번호)
            </Label>
            <span className="text-xs text-muted-foreground">
              {filters.highLowRatios.length}개 선택
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {HIGH_LOW_OPTIONS.map((ratio) => (
              <Button
                key={ratio}
                variant={
                  filters.highLowRatios.includes(ratio) ? "default" : "outline"
                }
                size="sm"
                onClick={() => toggleOption("highLowRatios", ratio)}
                className={cn(
                  "min-w-[52px]",
                  filters.highLowRatios.includes(ratio) &&
                    "bg-primary hover:bg-primary/90",
                )}
              >
                {ratio}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            1~22: 저번호, 23~45: 고번호
          </p>
        </div>

        {/* AC값 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">AC값 (분산도)</Label>
            <span className="text-sm font-mono text-primary">
              {filters.acRange[0]} ~ {filters.acRange[1]}
            </span>
          </div>
          <Slider
            min={0}
            max={10}
            step={1}
            value={filters.acRange}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                acRange: value as [number, number],
              })
            }
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 (집중)</span>
            <span className="font-semibold text-primary">추천: 7 ~ 10</span>
            <span>10 (분산)</span>
          </div>
          <p className="text-xs text-muted-foreground">
            숫자 간 간격의 다양성을 나타냅니다. 높을수록 번호가 고르게
            분포됩니다.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
