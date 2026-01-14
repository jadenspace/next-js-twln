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
import { Grid, BarChart } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { PageHeader } from "@/shared/ui/page-header";
import { EmptyStateCard } from "@/shared/ui/empty-state-card";

export default function NineRangesStatsPage() {
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

  const nineRanges = stats ? stats.nineRanges : {};
  const maxFreq = stats ? Math.max(...Object.values(stats.nineRanges)) : 0;

  return (
    <div className="container mx-auto py-6 md:py-10 px-4 max-w-6xl">
      <PageHeader
        title="9구간 상세 분포 통계"
        description="45개 번호를 5개 단위의 9개 구간으로 나누어 더욱 정밀하게 데이터 흐름을 추적합니다."
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
          icon={Grid}
          title="9구간 데이터 대기 중"
          description="상세한 구간별 에너지를 분석하려면 필터를 적용해 주세요."
        />
      ) : (
        <div className="space-y-8 animate-in fade-in duration-700">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="w-5 h-5 text-emerald-600" />
                9구간별 출현 비중
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-9 gap-4">
                {Array.from({ length: 9 }, (_, i) => i).map((idx) => {
                  const key = `${idx * 5 + 1}-${(idx + 1) * 5}`;
                  const freq = nineRanges[key] || 0;
                  const ratio = maxFreq > 0 ? (freq / maxFreq) * 100 : 0;
                  return (
                    <div key={key} className="flex flex-col items-center">
                      <div className="w-full aspect-[1/2] bg-muted rounded-xl relative overflow-hidden mb-3">
                        <div
                          className={cn(
                            "absolute bottom-0 w-full transition-all duration-1000",
                            freq === maxFreq
                              ? "bg-emerald-600"
                              : "bg-emerald-400",
                          )}
                          style={{ height: `${ratio}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center font-black text-xs text-background mix-blend-difference">
                          {freq}회
                        </div>
                      </div>
                      <span className="text-xs font-bold text-muted-foreground">
                        {key}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-emerald-50/20 border-emerald-100">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <h4 className="text-xl font-bold text-emerald-800">
                    분석 인사이트
                  </h4>
                  <p className="text-sm text-emerald-700/80 leading-relaxed">
                    일반적인 5구간(10단위) 분석보다 더 세밀한 9구간 분석은 특정
                    번호대가 '몰림' 현상을 보이는지 확인하는 데 매우 유용합니다.
                    현재 막대가 가장 높게 솟은 구간은 에너지가 과포화 상태이며,
                    반대로 가장 낮은 구간은 조만간 채워질 확률이 높습니다.
                  </p>
                </div>
                <div className="flex justify-center">
                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
                      <div
                        key={n}
                        className={cn(
                          "w-12 h-12 rounded-lg border-2 flex items-center justify-center font-bold text-sm",
                          n === Object.values(nineRanges).indexOf(maxFreq) + 1
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-emerald-200 text-emerald-700",
                        )}
                      >
                        {n}구
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
