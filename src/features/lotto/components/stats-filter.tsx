"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Card, CardContent } from "@/shared/ui/card";
import { Switch } from "@/shared/ui/switch";
import { Search, RotateCcw } from "lucide-react";

export interface FilterValues {
  type: "all" | "range" | "recent";
  startDraw?: number;
  endDraw?: number;
  limit?: number;
  includeBonus?: boolean;
}

interface StatsFilterProps {
  onApply: (values: FilterValues) => void;
  isPending?: boolean;
  latestDrawNo?: number;
  isAdvanced?: boolean;
}

export function StatsFilter({
  onApply,
  isPending,
  latestDrawNo = 1100,
  isAdvanced = false,
}: StatsFilterProps) {
  const [filterType, setFilterType] = useState<FilterValues["type"]>("recent");
  const [startDraw, setStartDraw] = useState<number>(latestDrawNo - 100);
  const [endDraw, setEndDraw] = useState<number>(latestDrawNo);
  const [limit, setLimit] = useState<number>(100);
  const [includeBonus, setIncludeBonus] = useState<boolean>(false);

  const handleApply = () => {
    onApply({
      type: filterType,
      startDraw:
        filterType === "range"
          ? startDraw
          : filterType === "all"
            ? 1
            : undefined,
      endDraw:
        filterType === "range"
          ? endDraw
          : filterType === "all"
            ? latestDrawNo
            : undefined,
      limit: filterType === "recent" ? limit : undefined,
      includeBonus,
    });
  };

  return (
    <Card className="mb-8 border-border bg-muted/30 shadow-sm">
      <CardContent className="pt-6 pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-4">
          {/* 분석 범위 */}
          <div className="flex-1 min-w-0 space-y-2">
            <Label className="text-sm font-medium text-foreground">
              분석 범위
            </Label>
            <Select
              value={filterType}
              onValueChange={(val: FilterValues["type"]) => setFilterType(val)}
            >
              <SelectTrigger className="bg-background border-border h-10">
                <SelectValue placeholder="범위 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  전체 회차 (1 ~ {latestDrawNo})
                </SelectItem>
                <SelectItem value="recent">최근 회차 분석</SelectItem>
                <SelectItem value="range">직접 구간 입력</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 최근 회차 수 */}
          {filterType === "recent" && (
            <div className="flex-1 min-w-0 space-y-2">
              <Label className="text-sm font-medium text-foreground">
                최근 회차 수
              </Label>
              <Select
                value={limit.toString()}
                onValueChange={(val) => setLimit(parseInt(val))}
              >
                <SelectTrigger className="bg-background border-border h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">최근 10회</SelectItem>
                  <SelectItem value="20">최근 20회</SelectItem>
                  <SelectItem value="30">최근 30회</SelectItem>
                  <SelectItem value="50">최근 50회</SelectItem>
                  <SelectItem value="100">최근 100회</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 직접 구간 입력 */}
          {filterType === "range" && (
            <>
              <div className="flex-1 min-w-0 space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  시작 회차
                </Label>
                <Input
                  type="number"
                  value={startDraw}
                  onChange={(e) => setStartDraw(parseInt(e.target.value))}
                  min={1}
                  max={latestDrawNo}
                  className="bg-background border-border h-10"
                />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  종료 회차
                </Label>
                <Input
                  type="number"
                  value={endDraw}
                  onChange={(e) => setEndDraw(parseInt(e.target.value))}
                  min={1}
                  max={latestDrawNo}
                  className="bg-background border-border h-10"
                />
              </div>
            </>
          )}

          {/* 보너스 번호 포함 토글 */}
          <div className="flex items-center justify-between lg:justify-start gap-3 px-3 py-2 rounded-md border border-border bg-background/50 lg:self-end">
            <Label
              htmlFor="bonus-toggle"
              className="text-sm font-medium text-foreground cursor-pointer whitespace-nowrap"
            >
              보너스 번호 포함
            </Label>
            <Switch
              id="bonus-toggle"
              checked={includeBonus}
              onCheckedChange={setIncludeBonus}
              className="data-[state=checked]:bg-foreground/80 data-[state=unchecked]:bg-muted-foreground/30"
            />
          </div>

          {/* 분석 적용 버튼 */}
          <Button
            variant="outline"
            className="w-full lg:w-auto gap-2 h-10 border-foreground/20 bg-background hover:bg-muted hover:border-foreground/30 text-foreground font-medium"
            onClick={handleApply}
            disabled={isPending}
          >
            {isPending ? (
              <RotateCcw className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            분석 적용
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
          {isAdvanced
            ? "* 심화 분석 적용 시 200P가 소모되며, 정밀 알고리즘이 가동됩니다. (50 XP 지급)"
            : "* 기본 분석은 무료로 제공되며, 최신 데이터를 기반으로 통계가 갱신됩니다."}
        </p>
      </CardContent>
    </Card>
  );
}
