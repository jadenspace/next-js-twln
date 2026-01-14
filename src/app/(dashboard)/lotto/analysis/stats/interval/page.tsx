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
import { Ruler, ArrowRightLeft, Info } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { PageHeader } from "@/shared/ui/page-header";
import { EmptyStateCard } from "@/shared/ui/empty-state-card";

export default function IntervalStatsPage() {
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

  const { data: statsData, isLoading } = useLottoNumberStats<AdvancedStats>(
    filters || undefined,
    { style: "advanced" },
  );
  const stats = statsData?.data || null;

  const avgGaps = stats ? stats.interval.averageGaps : [0, 0, 0, 0, 0];

  return (
    <div className="container mx-auto py-6 md:py-10 px-4 max-w-6xl">
      <PageHeader
        title="번호 간격 분석 (Gap)"
        description="당첨 번호들 사이의 거리(간격)를 분석하여 번호 배열의 패턴을 파악합니다."
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
          icon={Ruler}
          title="간격 데이터 분석 대기 중"
          description="번호 사이의 밀도와 간격을 분석하려면 시작해 주세요."
        />
      ) : (
        <div className="space-y-8 animate-in slide-in-from-left-10 duration-700">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {avgGaps.map((gap, i) => (
              <Card key={i} className="bg-slate-50 border-slate-200">
                <CardHeader className="py-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase">
                    {i + 1}번째-{i + 2}번째
                  </span>
                  <CardTitle className="text-2xl text-slate-700">
                    평균 {gap.toFixed(1)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-1.5 h-1">
                    {Array.from({ length: 15 }, (_, j) => (
                      <div
                        key={j}
                        className={cn(
                          "flex-1 h-full rounded-full transition-all duration-1000",
                          j < gap ? "bg-slate-500" : "bg-slate-200",
                        )}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-slate-600" />
                최근 15회차 간격 변화 추이
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 overflow-x-auto">
                {Object.entries(stats.interval.drawGaps)
                  .sort(([a], [b]) => parseInt(b) - parseInt(a))
                  .slice(0, 15)
                  .map(([draw, gaps]) => (
                    <div
                      key={draw}
                      className="flex items-center gap-4 min-w-[600px] p-2 hover:bg-muted/50 rounded-lg"
                    >
                      <span className="text-xs font-bold w-12 text-slate-500">
                        {draw}회
                      </span>
                      <div className="flex-1 flex gap-1">
                        {gaps.map((g, gi) => (
                          <div
                            key={gi}
                            className="bg-slate-200 rounded-md flex items-center justify-center text-[10px] font-bold text-slate-600 transition-all border border-slate-300 shadow-sm"
                            style={{
                              width: `${(g / 45) * 100}%`,
                              minWidth: "20px",
                              height: "24px",
                            }}
                          >
                            {g}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-slate-400" />
                간격 통계 활용법
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-300 space-y-4">
              <p>
                <b>간격(Gap)</b>은 번호가 얼마나 골고루 퍼져 있는지를 수치화한
                것입니다. 모든 간격의 합은 `최댓값 - 최솟값`과 같습니다. 특정
                위치의 간격이 평균보다 유난히 좁다면, 다음 회차에는 그 위치가
                넓어지는(번호가 멀어지는) 경향이 있습니다.
              </p>
              <div className="p-4 bg-slate-800 rounded-xl text-xs border border-slate-700">
                로또 6/45에서의 <b>황금 간격</b>은 각 번호 사이가 약 <b>7~8</b>{" "}
                정도 차이가 나는 것입니다. 연속번호(간격 1)가 포함되더라도
                전체적인 균형을 이 간격 통계로 체크하세요.
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
