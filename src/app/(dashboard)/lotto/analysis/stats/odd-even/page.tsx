"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { BasicStats } from "@/features/lotto/types";
import { lottoApi } from "@/features/lotto/api/lotto-api";
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
import { PieChart, Info } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { PageHeader } from "@/shared/ui/page-header";
import { EmptyStateCard } from "@/shared/ui/empty-state-card";

import { useLottoNumberStats } from "@/features/lotto/hooks/use-lotto-query";

export default function OddEvenStatsPage() {
  const [filters, setFilters] = useState<FilterValues | null>(null);

  const { data: latestDrawNo } = useQuery({
    queryKey: ["lotto", "latest-draw-no"],
    queryFn: () => lottoApi.getLatestDrawNo(),
  });

  // 초기 로딩 시 전체 회차로 필터 설정
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

  const total = stats ? stats.oddEvenRatio.odd + stats.oddEvenRatio.even : 0;
  const oddPercent =
    stats && total > 0 ? (stats.oddEvenRatio.odd / total) * 100 : 0;
  const evenPercent =
    stats && total > 0 ? (stats.oddEvenRatio.even / total) * 100 : 0;

  return (
    <div className="container mx-auto py-6 md:py-10 px-4 max-w-6xl">
      <PageHeader
        title="홀짝 통계 분석"
        description="당첨 번호의 홀수와 짝수 비율을 통해 행운의 균형을 찾으세요."
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
          icon={PieChart}
          title="홀짝 데이터 분석 대기 중"
          description="필터를 선택하고 분석 시작 버튼을 눌러주세요."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-700">
          <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle>홀/짝 비율 현황</CardTitle>
              <CardDescription>
                전체 출현 번호 중 홀수와 짝수의 비중을 시각적으로 보여줍니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="flex h-12 md:h-16 w-full rounded-xl md:rounded-2xl overflow-hidden shadow-lg mb-6 md:mb-8">
                <div
                  className="bg-blue-500 flex items-center justify-center text-white font-black text-base md:text-xl transition-all duration-1000 min-w-[60px]"
                  style={{ width: `${oddPercent}%` }}
                >
                  {oddPercent.toFixed(0)}%
                </div>
                <div
                  className="bg-red-500 flex items-center justify-center text-white font-black text-base md:text-xl transition-all duration-1000 min-w-[60px]"
                  style={{ width: `${evenPercent}%` }}
                >
                  {evenPercent.toFixed(0)}%
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 md:gap-20 w-full max-w-xs md:max-w-none">
                <div className="text-center">
                  <p className="text-blue-500 text-3xl md:text-5xl font-black mb-1 md:mb-2">
                    {stats.oddEvenRatio.odd}
                  </p>
                  <p className="text-xs md:text-sm font-bold text-muted-foreground">
                    홀수 (Odd)
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-red-500 text-3xl md:text-5xl font-black mb-1 md:mb-2">
                    {stats.oddEvenRatio.even}
                  </p>
                  <p className="text-xs md:text-sm font-bold text-muted-foreground">
                    짝수 (Even)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-base md:text-lg">
                최근 트렌드 인사이트
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg md:rounded-xl bg-muted/30">
                <Info className="w-4 h-4 md:w-5 md:h-5 text-primary mt-0.5 shrink-0" />
                <p className="text-xs md:text-sm leading-relaxed">
                  일반적으로 로또는 <b>홀3:짝3</b> 또는 <b>홀4:짝2 / 홀2:짝4</b>{" "}
                  비율이 가장 많이 등장합니다. 비중이 크게 차이나는 구간을
                  노려보세요.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
