"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AdvancedStats } from "@/features/lotto/types";
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
import { Scale, Activity, Maximize2, Info } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { PageHeader } from "@/shared/ui/page-header";
import { EmptyStateCard } from "@/shared/ui/empty-state-card";

export default function JapaneseStatsPage() {
  const [stats, setStats] = useState<AdvancedStats | null>(null);

  const { data: latestDrawNo } = useQuery({
    queryKey: ["lotto", "latest-draw-no"],
    queryFn: () => lottoApi.getLatestDrawNo(),
  });

  const mutation = useMutation({
    mutationFn: async (filters: FilterValues) => {
      const res = await fetch("/api/lotto/analysis/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...filters, style: "advanced" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "분석에 실패했습니다.");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setStats(data.data);
    },
    onError: (err) => {
      alert(err.message);
    },
  });

  const getAvg = (arr: number[]) =>
    arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  return (
    <div className="container mx-auto py-6 md:py-10 px-4 max-w-6xl">
      <PageHeader
        title="후나츠 사카이 밸런스 분석"
        description="일본의 분석가 후나츠 사카이의 이론에 따라 합계(Sum), 평균(Avg), 산도(Spread) 균형을 확인합니다."
      />

      <StatsFilter
        onApply={(v) => mutation.mutate(v)}
        isPending={mutation.isPending}
        latestDrawNo={latestDrawNo}
      />

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
                    로또 6/45의 이론적 합계 평균인 138을 기준으로, ±20 범위
                    내에서 당첨 번호가 나올 확률이 70% 이상입니다. 내가 고른
                    번호의 합계가 이 구간을 벗어난다면 다시 한 번 검토해 보시기
                    바랍니다.
                  </p>
                </div>
                <div className="space-y-4">
                  <h4 className="font-bold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    폭(Spread)의 중요성
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    산도가 지나치게 낮으면(예: 10 이하) 번호들이 특정 구간에
                    뭉쳐있다는 의미입니다. 과거 당첨 데이터의 평균 산도인 30~40
                    사이를 유지하는 것이 통계적으로 유리합니다.
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
