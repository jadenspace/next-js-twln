"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/ui/card";
import { Scale, Activity, Maximize2, Info } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { PageHeader } from "@/shared/ui/page-header";
import { EmptyStateCard } from "@/shared/ui/empty-state-card";

export default function JapaneseStatsPage() {
  const [filters, setFilters] = useState<FilterValues | null>(null);
  // 심화 분석은 1회당 200P가 차감되므로, 사용자가 직접 "분석 적용"을
  // 누르기 전에는 요청하지 않는다.
  const [hasRequested, setHasRequested] = useState(false);

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

  const { data: statsData, isLoading } = useLottoNumberStats<AdvancedStats>(
    filters || undefined,
    { style: "advanced" },
    { enabled: hasRequested },
  );
  const stats = statsData?.data || null;

  const getAvg = (arr: number[]) =>
    arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  return (
    <div className="container mx-auto py-6 md:py-10 px-4 max-w-6xl">
      <PageHeader
        title="후나츠 사카이 밸런스 분석"
        description="일본의 분석가 후나츠 사카이의 이론에 따라 합계(Sum), 평균(Avg), 산도(Spread) 균형을 확인합니다."
      />

      {latestDrawNo ? (
        <StatsFilter
          onApply={(v) => {
            setFilters(v);
            setHasRequested(true);
          }}
          isPending={isLoading && !!filters}
          isAdvanced
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
          icon={Scale}
          title="밸런스 분석 데이터 대기 중"
          description="일본 정통 로또 6 분석법을 적용하려면 분석을 시작하세요."
        />
      ) : (
        <div className="space-y-8 animate-in fade-in duration-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-indigo-50/20 border-indigo-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-indigo-700 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  평균 합계 (Sum)
                </CardTitle>
                <CardDescription>6개 번호의 총 합계 평균</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-6">
                <div className="text-5xl font-black text-indigo-600 mb-2">
                  {getAvg(stats.expertBalance.sums).toFixed(1)}
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-4">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-1000"
                    style={{
                      width: `${(getAvg(stats.expertBalance.sums) / 200) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  이론적 중심값: 138 (1~45 중간합)
                </p>
              </CardContent>
            </Card>

            <Card className="bg-blue-50/20 border-blue-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-blue-700 flex items-center gap-2">
                  <Maximize2 className="w-5 h-5" />
                  평균 산도 (Spread)
                </CardTitle>
                <CardDescription>최대값 - 최소값의 평균</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-6">
                <div className="text-5xl font-black text-blue-600 mb-2">
                  {getAvg(stats.expertBalance.spreads).toFixed(1)}
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-4">
                  <div
                    className="h-full bg-blue-500 transition-all duration-1000"
                    style={{
                      width: `${(getAvg(stats.expertBalance.spreads) / 44) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  폭이 넓을수록 번호가 고르게 분포됨
                </p>
              </CardContent>
            </Card>

            <Card className="bg-violet-50/20 border-violet-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-violet-700">평균값 분포</CardTitle>
                <CardDescription>평균 단일 번호값</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-6">
                <div className="text-5xl font-black text-violet-600 mb-2">
                  {getAvg(stats.expertBalance.averages).toFixed(1)}
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-4">
                  <div
                    className="h-full bg-violet-500 transition-all duration-1000"
                    style={{
                      width: `${(getAvg(stats.expertBalance.averages) / 45) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  23.0에 가까울수록 표준적 분포
                </p>
              </CardContent>
            </Card>

            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>후나츠 사카이 분석법 가이드</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="font-bold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    황금 합계 구간: 121 ~ 160
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    로또 6/45의 이론적 합계 평균은 138이며, ±20 범위(121~160)에
                    해당하는 조합은 전체 8,145,060가지 중 약 48.5%입니다. 절반
                    가까운 조합이 이 구간에 몰려 있다는 뜻일 뿐, 이 구간을
                    골랐다고 당첨 확률이 올라가지는 않습니다.
                  </p>
                </div>
                <div className="space-y-4">
                  <h4 className="font-bold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    폭(Spread)의 중요성
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    산도가 지나치게 낮으면(예: 10 이하) 번호들이 특정 구간에
                    뭉쳐있다는 의미입니다. 과거 당첨 번호의 산도는 대체로 30~40
                    구간에 분포했는데, 이는 가능한 조합 자체가 그 구간에 많기
                    때문이지 그 범위가 더 잘 당첨되기 때문은 아닙니다.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
