"use client";

import { useState, useEffect } from "react";
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
}

import { Switch } from "@/shared/ui/switch";

export function StatsFilter({
  onApply,
  isPending,
  latestDrawNo = 1100,
}: StatsFilterProps) {
  const [filterType, setFilterType] = useState<FilterValues["type"]>("recent");
  const [startDraw, setStartDraw] = useState<number>(latestDrawNo - 100);
  const [endDraw, setEndDraw] = useState<number>(latestDrawNo);
  const [limit, setLimit] = useState<number>(100);
  const [includeBonus, setIncludeBonus] = useState<boolean>(false);

  const handleApply = () => {
    onApply({
      type: filterType,
      startDraw: filterType === "range" ? startDraw : undefined,
      endDraw: filterType === "range" ? endDraw : undefined,
      limit: filterType === "recent" ? limit : undefined,
      includeBonus,
    });
  };

  return (
    <Card className="mb-8 border-primary/20 bg-primary/5">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2">
            <Label>분석 범위</Label>
            <Select
              value={filterType}
              onValueChange={(val: FilterValues["type"]) => setFilterType(val)}
            >
              <SelectTrigger className="bg-background">
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

          {filterType === "recent" && (
            <div className="flex-1 space-y-2">
              <Label>최근 회차 수</Label>
              <Select
                value={limit.toString()}
                onValueChange={(val) => setLimit(parseInt(val))}
              >
                <SelectTrigger className="bg-background">
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

          {filterType === "range" && (
            <>
              <div className="flex-1 space-y-2">
                <Label>시작 회차</Label>
                <Input
                  type="number"
                  value={startDraw}
                  onChange={(e) => setStartDraw(parseInt(e.target.value))}
                  min={1}
                  max={latestDrawNo}
                  className="bg-background"
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label>종료 회차</Label>
                <Input
                  type="number"
                  value={endDraw}
                  onChange={(e) => setEndDraw(parseInt(e.target.value))}
                  min={1}
                  max={latestDrawNo}
                  className="bg-background"
                />
              </div>
            </>
          )}

          <div className="flex items-center gap-3 h-10 px-4 rounded-md self-center md:self-end">
            <Label
              htmlFor="bonus-toggle"
              className="text-xs font-bold cursor-pointer"
            >
              보너스 번호 포함
            </Label>
            <Switch
              id="bonus-toggle"
              checked={includeBonus}
              onCheckedChange={setIncludeBonus}
            />
          </div>

          <Button
            className="w-full md:w-auto gap-2"
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
        <p className="text-[10px] text-muted-foreground mt-3 italic">
          * 분석 적용 시 마다 100P가 소모되며, 최신 데이터를 기반으로 통계가
          갱신됩니다.
        </p>
      </CardContent>
    </Card>
  );
}
