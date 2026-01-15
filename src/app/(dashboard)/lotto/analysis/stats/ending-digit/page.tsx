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
import { Hash, BarChart3, Info } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { PageHeader } from "@/shared/ui/page-header";
import { EmptyStateCard } from "@/shared/ui/empty-state-card";

export default function EndingDigitStatsPage() {
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

  const endingDigits = stats ? stats.endingDigit : {};
  const maxFreq = stats ? Math.max(...Object.values(stats.endingDigit)) : 0;

  return (
    <div className="container mx-auto py-6 md:py-10 px-4 max-w-6xl">
      <PageHeader
        title="끝수 분석 통계"
        description="당첨 번호의 일의 자리(0~9) 분포를 통해 패턴을 분석합니다."
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
          icon={Hash}
          title="끝수 데이터 대기 중"
          description="일의 자리 패턴을 분석하려면 버튼을 눌러주세요."
        />
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-10 duration-700">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
                끝수별 출현 빈도 (0~9)
              </CardTitle>
              <CardDescription>
                어떤 끝수가 로또 당첨의 중심에 있는지 확인하세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 md:px-6">
              <div className="h-[250px] md:h-[300px] w-full flex items-end gap-1 md:gap-3 pt-6 md:pt-10">
                {Array.from({ length: 10 }, (_, i) => i).map((digit) => {
                  const freq = endingDigits[digit] || 0;
                  const height = maxFreq > 0 ? (freq / maxFreq) * 100 : 0;
                  return (
                    <div
                      key={digit}
                      className="flex-1 min-w-0 flex flex-col items-center group relative h-full justify-end"
                    >
                      <span className="text-[10px] md:text-xs font-bold mb-1 text-emerald-600">
                        {freq}
                      </span>
                      <div
                        className={cn(
                          "w-full rounded-t-md md:rounded-t-lg transition-all duration-700 bg-emerald-400 group-hover:bg-emerald-500 shadow-sm",
                          freq === maxFreq && "bg-emerald-600 shadow-lg",
                        )}
                        style={{ height: `${height}%` }}
                      />
                      <div className="w-full text-center py-1.5 md:py-2 bg-muted/30 rounded-b-md md:rounded-b-lg mt-0.5 md:mt-1 font-black text-xs md:text-sm">
                        {digit}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>인사이트 가이드</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>
                  <b>일의 자리 분포</b>는 로또 번호를 조합할 때 숫자의 뒷자리를
                  고르게 섞는 데 도움을 줍니다. 보통 한 회차에는 2~3개의 동일한
                  끝수가 나타나는 경우가 많습니다.
                </p>
                <div className="p-4 bg-muted rounded-xl flex gap-3">
                  <Info className="w-5 h-5 text-primary shrink-0" />
                  <p className="text-xs leading-relaxed">
                    특정 끝수가 과도하게 출현했다면(그래프 최상단), 다음
                    회차에는 해당 끝수보다는 분포가 낮은 끝수를 고려해 보시는
                    것이 좋습니다.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-emerald-50/30 border-emerald-100">
              <CardHeader>
                <CardTitle className="text-emerald-800">
                  최빈 끝수 리포트
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-emerald-100 shadow-sm">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                      가장 많이 나온 끝수
                    </span>
                    <h4 className="text-4xl font-black text-emerald-600">
                      {
                        Object.entries(endingDigits).sort(
                          ([, a], [, b]) => (b as number) - (a as number),
                        )[0][0]
                      }
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                      출현 횟수
                    </span>
                    <h4 className="text-4xl font-black text-emerald-600">
                      {
                        Object.entries(endingDigits).sort(
                          ([, a], [, b]) => (b as number) - (a as number),
                        )[0][1]
                      }
                      회
                    </h4>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
