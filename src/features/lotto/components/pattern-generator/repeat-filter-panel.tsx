"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Label } from "@/shared/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import type {
  PatternFilterState,
  ConsecutivePattern,
} from "../../types/pattern-filter.types";

interface RepeatFilterPanelProps {
  filters: PatternFilterState;
  onFiltersChange: (filters: PatternFilterState) => void;
}

export function RepeatFilterPanel({
  filters,
  onFiltersChange,
}: RepeatFilterPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            B
          </span>
          반복/패턴 구조
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 연속번호 패턴 */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">연속번호 패턴</Label>
          <RadioGroup
            value={filters.consecutivePattern}
            onValueChange={(value: ConsecutivePattern) =>
              onFiltersChange({
                ...filters,
                consecutivePattern: value,
              })
            }
            className="flex flex-col gap-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="none" id="consecutive-none" />
              <Label
                htmlFor="consecutive-none"
                className="text-sm cursor-pointer"
              >
                연속번호 없음
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="2-pair-1" id="consecutive-1" />
              <Label htmlFor="consecutive-1" className="text-sm cursor-pointer">
                2연속 1쌍{" "}
                <span className="text-muted-foreground">(예: 5, 6)</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="2-pair-2" id="consecutive-2" />
              <Label htmlFor="consecutive-2" className="text-sm cursor-pointer">
                2연속 2쌍{" "}
                <span className="text-muted-foreground">
                  (예: 5, 6 + 23, 24)
                </span>
              </Label>
            </div>
          </RadioGroup>
          <p className="text-xs text-muted-foreground">
            3연속 이상은 출현 확률이 매우 낮아 기본 비활성 상태입니다.
          </p>
        </div>

        {/* 동일 끝수 */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">동일 끝수</Label>
          <Select
            value={filters.sameEndDigit.toString()}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                sameEndDigit: parseInt(value),
              })
            }
          >
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">제한 없음</SelectItem>
              <SelectItem value="2">2개까지 허용</SelectItem>
              <SelectItem value="3">3개까지 허용</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            같은 끝자리 숫자의 최대 개수입니다. (예: 3, 13, 23 → 끝수 3)
          </p>
        </div>

        {/* 동일 구간 */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">동일 구간 (5단위)</Label>
          <Select
            value={filters.sameSection.toString()}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                sameSection: parseInt(value),
              })
            }
          >
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">제한 없음</SelectItem>
              <SelectItem value="2">2개까지 허용</SelectItem>
              <SelectItem value="3">3개까지 허용</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            같은 5단위 구간에서 나올 수 있는 최대 번호 개수입니다. (1-5, 6-10,
            ...)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
