"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { BasicStats } from "@/features/lotto/types";
import { lottoApi } from "@/features/lotto/api/lotto-api";
import { useLottoNumberStats } from "@/features/lotto/hooks/use-lotto-query";
import {
  StatsFilter,
  FilterValues,
} from "@/features/lotto/components/stats-filter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/ui/card";
import { Binary, Layers } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { LotteryBall } from "@/shared/ui/lottery-ball";
import { PageHeader } from "@/shared/ui/page-header";
import { EmptyStateCard } from "@/shared/ui/empty-state-card";

export default function ConsecutiveStatsPage() {
  const [filters, setFilters] = useState<FilterValues | null>(null);

  const { data: latestDrawNo } = useQuery({
    queryKey: ["lotto", "latest-draw-no"],
    queryFn: () => lottoApi.getLatestDrawNo(),
  });

  useEffect(() => {
    if (latestDrawNo && !filters) {
      setFilters({
        type: "all",
        startDraw: 1,
        endDraw: latestDrawNo,
        includeBonus: false,
      });
    }
  }, [latestDrawNo, filters]);

  const { data: statsData, isLoading } = useLottoNumberStats(
    filters || undefined,
  );
  const stats = statsData?.data || null;

  const topPairs = stats
    ? Object.entries(stats.consecutiveOccurrences.pairs)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
    : [];

  return (
    <div className="container mx-auto py-6 md:py-10 px-4 max-w-6xl">
      <PageHeader
        title="연속번호 출현 분석"
        description="연속된 숫자가 얼마나 자주 당첨되는지 분석하여 패턴을 예측해 보세요."
      />

      {latestDrawNo ? (
        <StatsFilter
          onApply={(v) => setFilters(v)}
          isPending={isLoading && !!filters}
          latestDrawNo={latestDrawNo}
          defaultValues={{
            type: "all",
            startDraw: 1,
            endDraw: latestDrawNo,
            includeBonus: false,
          }}
        />
      ) : (
        <div className="h-[100px] bg-muted/20 animate-pulse rounded-lg mb-8" />
      )}

      {!stats ? (
        <EmptyStateCard
          icon={Binary}
          title="연번 데이터 대기 중"
          description="분석 범위를 설정하고 버튼을 눌러주세요."
        />
      ) : (
        <div className="space-y-8 animate-in zoom-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 bg-primary/5 border-primary/10">
              <CardHeader>
                <CardTitle>전체 연번 발생</CardTitle>
                <CardDescription>검색된 회차 내 총 발생 횟수</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="text-6xl font-black text-primary mb-2">
                  {stats.consecutiveOccurrences.total}
                </div>
                <p className="text-sm font-bold text-muted-foreground/60">
                  Total Pairs
                </p>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>자주 등장하는 연번 쌍 (Top 10)</CardTitle>
                <CardDescription>
                  어떤 인접한 두 숫자가 가장 많이 같이 나왔을까요?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {topPairs.map(([pair, count]) => (
                    <div
                      key={pair}
                      className="flex flex-col items-center p-3 bg-card rounded-xl border min-w-[80px]"
                    >
                      <div className="flex gap-1 mb-2">
                        {pair.split(",").map((n) => (
                          <LotteryBall
                            key={n}
                            number={parseInt(n)}
                            className="w-8 h-8 text-xs"
                          />
                        ))}
                      </div>
                      <span className="text-xs font-black">{count}회</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  최근 회차별 연번 포함 개수
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.consecutiveOccurrences.byDraw)
                    .sort(([a], [b]) => parseInt(b) - parseInt(a))
                    .slice(0, 20)
                    .map(([draw, count]) => (
                      <div
                        key={draw}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border text-xs"
                      >
                        <span className="font-bold text-muted-foreground">
                          {draw}회:
                        </span>
                        <span className="font-black text-primary">
                          {count}개
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
