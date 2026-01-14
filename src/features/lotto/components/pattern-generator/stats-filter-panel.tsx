"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Slider } from "@/shared/ui/slider";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";
import { Flame, Snowflake, History, Clock, Loader2, Crown } from "lucide-react";
import type {
  PatternFilterState,
  StatsFilterConfig,
  StatsData,
} from "../../types/pattern-filter.types";

interface StatsFilterPanelProps {
  filters: PatternFilterState;
  onFiltersChange: (filters: PatternFilterState) => void;
  statsData: StatsData | null;
  isLoading?: boolean;
}

const MISS_THRESHOLD_OPTIONS = [10, 15, 20, 30];

interface RangeFilterProps {
  label: string;
  description: string;
  value: [number, number];
  min: number;
  max: number;
  onChange: (value: [number, number]) => void;
  icon?: React.ReactNode;
  iconColor?: string;
}

function RangeFilter({
  label,
  description,
  value,
  min,
  max,
  onChange,
  icon,
  iconColor,
}: RangeFilterProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className={cn("w-5 h-5", iconColor)}>{icon}</span>}
          <Label className="text-sm font-medium">{label}</Label>
        </div>
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

function NumberBadgeList({
  numbers,
  label,
  variant,
  maxShow = 10,
}: {
  numbers: number[];
  label: string;
  variant: "hot" | "cold" | "previous" | "miss";
  maxShow?: number;
}) {
  const displayNumbers = numbers.slice(0, maxShow);
  const remaining = numbers.length - maxShow;

  const variantStyles = {
    hot: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
    cold: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    previous:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
    miss: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  };

  if (numbers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {displayNumbers.map((num) => (
          <Badge
            key={num}
            variant="outline"
            className={cn(
              "text-xs font-mono px-2 py-0.5",
              variantStyles[variant],
            )}
          >
            {num}
          </Badge>
        ))}
        {remaining > 0 && (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            +{remaining}
          </Badge>
        )}
      </div>
    </div>
  );
}

export function StatsFilterPanel({
  filters,
  onFiltersChange,
  statsData,
  isLoading = false,
}: StatsFilterPanelProps) {
  const statsFilter = filters.statsFilter ?? {
    hotNumberCount: [0, 6],
    coldNumberCount: [0, 6],
    previousDrawCount: [0, 6],
    missCountThreshold: 10,
    missNumberCount: [0, 6],
  };

  const updateStatsFilter = (updates: Partial<StatsFilterConfig>) => {
    onFiltersChange({
      ...filters,
      statsFilter: {
        ...statsFilter,
        ...updates,
      },
    });
  };

  const missNumbers =
    statsData?.missNumbers?.[statsFilter.missCountThreshold] ?? [];

  return (
    <Card className="relative overflow-hidden">
      {/* 유료 기능 표시 */}
      <div className="absolute top-3 right-3">
        <Badge
          variant="secondary"
          className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 gap-1"
        >
          <Crown className="w-3 h-3" />
          유료
        </Badge>
      </div>

      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            E
          </span>
          통계 기반 패턴
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              통계 데이터 로딩 중...
            </span>
          </div>
        ) : (
          <>
            {/* 핫 번호 */}
            <div className="space-y-3">
              <RangeFilter
                label="핫 번호 포함"
                description="최근 10회차 기준 출현 빈도 상위 15개 번호 중 포함할 개수"
                value={statsFilter.hotNumberCount}
                min={0}
                max={6}
                onChange={(value) =>
                  updateStatsFilter({ hotNumberCount: value })
                }
                icon={<Flame className="w-4 h-4" />}
                iconColor="text-red-500"
              />
              {statsData && (
                <NumberBadgeList
                  numbers={statsData.hotNumbers}
                  label="핫 번호 목록"
                  variant="hot"
                />
              )}
            </div>

            {/* 콜드 번호 */}
            <div className="space-y-3">
              <RangeFilter
                label="콜드 번호 포함"
                description="최근 10회차 기준 출현 빈도 하위 15개 번호 중 포함할 개수"
                value={statsFilter.coldNumberCount}
                min={0}
                max={6}
                onChange={(value) =>
                  updateStatsFilter({ coldNumberCount: value })
                }
                icon={<Snowflake className="w-4 h-4" />}
                iconColor="text-blue-500"
              />
              {statsData && (
                <NumberBadgeList
                  numbers={statsData.coldNumbers}
                  label="콜드 번호 목록"
                  variant="cold"
                />
              )}
            </div>

            {/* 직전 회차 번호 */}
            <div className="space-y-3">
              <RangeFilter
                label="직전 회차 번호 포함"
                description={`${statsData?.lastDrawNo ?? "최신"}회차 당첨 번호 중 포함할 개수`}
                value={statsFilter.previousDrawCount}
                min={0}
                max={6}
                onChange={(value) =>
                  updateStatsFilter({ previousDrawCount: value })
                }
                icon={<History className="w-4 h-4" />}
                iconColor="text-purple-500"
              />
              {statsData && (
                <NumberBadgeList
                  numbers={statsData.previousNumbers}
                  label={`${statsData.lastDrawNo}회차 당첨번호`}
                  variant="previous"
                />
              )}
            </div>

            {/* 미출현 번호 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <Label className="text-sm font-medium">미출현 번호</Label>
              </div>

              {/* 미출현 회차 기준 선택 */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  미출현 기준 회차 선택
                </p>
                <div className="flex flex-wrap gap-2">
                  {MISS_THRESHOLD_OPTIONS.map((threshold) => (
                    <Button
                      key={threshold}
                      variant={
                        statsFilter.missCountThreshold === threshold
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        updateStatsFilter({ missCountThreshold: threshold })
                      }
                      className={cn(
                        "min-w-[60px]",
                        statsFilter.missCountThreshold === threshold &&
                          "bg-primary hover:bg-primary/90",
                      )}
                    >
                      {threshold}회 이상
                    </Button>
                  ))}
                </div>
              </div>

              {/* 미출현 번호 포함 개수 */}
              <RangeFilter
                label="미출현 번호 포함"
                description={`${statsFilter.missCountThreshold}회 이상 미출현 번호 중 포함할 개수`}
                value={statsFilter.missNumberCount}
                min={0}
                max={6}
                onChange={(value) =>
                  updateStatsFilter({ missNumberCount: value })
                }
              />

              {statsData && missNumbers.length > 0 && (
                <NumberBadgeList
                  numbers={missNumbers}
                  label={`${statsFilter.missCountThreshold}회 이상 미출현 번호 (${missNumbers.length}개)`}
                  variant="miss"
                  maxShow={15}
                />
              )}

              {statsData && missNumbers.length === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  {statsFilter.missCountThreshold}회 이상 미출현 번호가
                  없습니다.
                </p>
              )}
            </div>

            {/* 안내 메시지 */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                통계 기반 필터는 최근 당첨 데이터를 분석하여 번호 출현 빈도를
                기준으로 조합을 필터링합니다. 핫 번호는 최근 자주 나온 번호,
                콜드 번호는 잘 나오지 않는 번호입니다.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
