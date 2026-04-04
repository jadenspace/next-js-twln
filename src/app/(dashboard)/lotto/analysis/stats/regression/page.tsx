"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { History, TrendingUp, AlertTriangle } from "lucide-react";
import { AdvancedStats } from "@/features/lotto/types";
import { lottoApi } from "@/features/lotto/api/lotto-api";
import { useLottoNumberStats } from "@/features/lotto/hooks/use-lotto-query";
import {
  StatsFilter,
  FilterValues,
} from "@/features/lotto/components/stats-filter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";
import { LotteryBall } from "@/shared/ui/lottery-ball";
import { PageHeader } from "@/shared/ui/page-header";
import { EmptyStateCard } from "@/shared/ui/empty-state-card";

type RegressionRow = {
  num: string;
  numericNum: number;
  lag: number;
  avg: number;
  std: number;
  gap: number;
  absGap: number;
};

type RegressionViewModel = {
  rows: RegressionRow[];
  delayedRows: RegressionRow[];
  mostDelayed: RegressionRow | null;
  mostStable: RegressionRow | null;
};

function getDefaultFilters(latestDrawNo: number): FilterValues {
  return {
    type: "all",
    startDraw: 1,
    endDraw: latestDrawNo,
    includeBonus: false,
  };
}

function buildRegressionViewModel(
  stats: AdvancedStats | null,
): RegressionViewModel {
  const rows = stats
    ? Object.entries(stats.regression.lastCycles)
        .map(([num, lag]) => {
          const numericNum = Number(num);
          const avg = stats.regression.averageCycles[numericNum] || 0;
          const std = stats.regression.stdDev[numericNum] || 0;

          return {
            num,
            numericNum,
            lag,
            avg,
            std,
            gap: lag - avg,
            absGap: Math.abs(lag - avg),
          };
        })
        .sort((a, b) => b.lag - a.lag)
    : [];

  const summary = rows.reduce(
    (acc, row) => {
      if (row.gap > 0) {
        acc.delayedRows.push(row);
        if (!acc.mostDelayed || row.gap > acc.mostDelayed.gap) {
          acc.mostDelayed = row;
        }
      }

      if (!acc.mostStable || row.absGap < acc.mostStable.absGap) {
        acc.mostStable = row;
      }

      return acc;
    },
    {
      delayedRows: [] as RegressionRow[],
      mostDelayed: null as RegressionRow | null,
      mostStable: null as RegressionRow | null,
    },
  );

  return { rows, ...summary };
}

export default function RegressionStatsPage() {
  const [filters, setFilters] = useState<FilterValues | null>(null);

  const { data: latestDrawNo } = useQuery({
    queryKey: ["lotto", "latest-draw-no"],
    queryFn: () => lottoApi.getLatestDrawNo(),
  });

  const defaultFilters = useMemo(
    () => (latestDrawNo ? getDefaultFilters(latestDrawNo) : null),
    [latestDrawNo],
  );

  useEffect(() => {
    if (defaultFilters && !filters) {
      setFilters(defaultFilters);
    }
  }, [defaultFilters, filters]);

  const { data: statsData, isLoading } = useLottoNumberStats<AdvancedStats>(
    filters || undefined,
    { style: "advanced" },
  );
  const stats = statsData?.data || null;

  const { rows, delayedRows, mostDelayed, mostStable } = useMemo(
    () => buildRegressionViewModel(stats),
    [stats],
  );

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 md:py-10">
      <PageHeader
        title="n회귀 분석"
        description="번호별 출현 주기를 비교해 현재 흐름이 평균 리듬에서 얼마나 벗어났는지 살펴봅니다."
      />

      {latestDrawNo ? (
        <StatsFilter
          onApply={(nextFilters) => setFilters(nextFilters)}
          isPending={isLoading && !!filters}
          latestDrawNo={latestDrawNo}
          defaultValues={defaultFilters as FilterValues}
        />
      ) : (
        <div className="mb-8 h-[100px] animate-pulse rounded-lg bg-muted/20" />
      )}

      {!stats ? (
        <EmptyStateCard
          icon={History}
          title="n회귀 분석 대기 중"
          description="필터를 설정하고 조회 버튼을 눌러 주세요."
        />
      ) : (
        <div className="space-y-8 animate-in fade-in duration-700">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-emerald-200/70 bg-emerald-50/40 dark:border-emerald-900/60 dark:bg-emerald-950/20">
              <CardHeader className="pb-2">
                <CardDescription className="text-emerald-700 dark:text-emerald-300">
                  늦어진 번호 수
                </CardDescription>
                <CardTitle className="text-2xl md:text-3xl">
                  {delayedRows.length}개
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-orange-200/70 bg-orange-50/40 dark:border-orange-900/60 dark:bg-orange-950/20">
              <CardHeader className="pb-2">
                <CardDescription className="text-orange-700 dark:text-orange-300">
                  가장 늦어진 번호
                </CardDescription>
                <CardTitle className="text-2xl md:text-3xl">
                  {mostDelayed ? `${mostDelayed.num}번` : "-"}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-sky-200/70 bg-sky-50/40 dark:border-sky-900/60 dark:bg-sky-950/20">
              <CardHeader className="pb-2">
                <CardDescription className="text-sky-700 dark:text-sky-300">
                  가장 안정적인 번호
                </CardDescription>
                <CardTitle className="text-2xl md:text-3xl">
                  {mostStable ? `${mostStable.num}번` : "-"}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card className="border-orange-200 bg-orange-50/30 dark:border-orange-800 dark:bg-orange-950/20">
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-orange-700 dark:text-orange-300 md:text-lg">
                <AlertTriangle className="h-4 w-4 md:h-5 md:w-5" />
                회귀 해석 기준
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground md:text-base">
              회귀는 다음에 나올 번호를 예측하는 도구가 아니라, 현재 흐름이
              평균적인 리듬에서 얼마나 벗어났는지 확인하는 참고 지표입니다.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                번호별 리듬 비교
              </CardTitle>
              <CardDescription>
                현재 기다림, 평균 주기, 차이, 흔들림을 한눈에 비교합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[560px] space-y-3 overflow-y-auto pr-2">
                {rows.map((row) => (
                  <div
                    key={row.num}
                    className="grid gap-3 rounded-lg border bg-muted/20 p-3 transition-colors hover:bg-muted/40 md:grid-cols-[auto_minmax(0,1fr)] md:items-center"
                  >
                    <div className="flex items-center gap-3">
                      <LotteryBall
                        number={row.numericNum}
                        className="h-8 w-8 text-xs"
                      />
                      <div>
                        <p className="text-sm font-bold">번호 {row.num}</p>
                        <p className="text-[10px] text-muted-foreground">
                          리듬 기준 비교
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                      <div className="rounded-md bg-background/80 px-2 py-2">
                        <p className="text-muted-foreground">현재 기다림</p>
                        <p className="mt-1 font-semibold">{row.lag}회</p>
                      </div>
                      <div className="rounded-md bg-background/80 px-2 py-2">
                        <p className="text-muted-foreground">평균 주기</p>
                        <p className="mt-1 font-semibold">
                          {row.avg.toFixed(1)}회
                        </p>
                      </div>
                      <div className="rounded-md bg-background/80 px-2 py-2">
                        <p className="text-muted-foreground">차이</p>
                        <p
                          className={cn(
                            "mt-1 font-semibold",
                            row.gap > 0
                              ? "text-orange-600"
                              : "text-emerald-600",
                          )}
                        >
                          {row.gap > 0
                            ? `+${row.gap.toFixed(1)}회`
                            : `${row.gap.toFixed(1)}회`}
                        </p>
                      </div>
                      <div className="rounded-md bg-background/80 px-2 py-2">
                        <p className="text-muted-foreground">흔들림</p>
                        <p className="mt-1 font-semibold">
                          {row.std.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>회귀 해석 가이드</CardTitle>
              <CardDescription>
                이 페이지의 숫자는 예측값이 아닌 비교 기준입니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>
                <b>n회귀 분석</b>은 각 번호가 가진 평균적인 출현 주기를 기준으로
                지금 얼마나 늦거나 빠른 상태인지 읽는 데 사용합니다. 평균적으로
                7~8회마다 나오는 번호라도 현재 15회 넘게 비어 있다면, 회귀
                기준에서는 늦어진 상태로 볼 수 있습니다.
              </p>
              <div className="rounded-lg bg-blue-50 p-4 text-xs leading-6 text-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
                회귀는 당첨 예측이 아니라, 현재 리듬이 평균에서 얼마나 벌어져
                있는지 보는 기준입니다. 늦어졌다고 바로 선택하지 말고, 평균
                주기와 흔들림을 함께 확인하세요.
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
