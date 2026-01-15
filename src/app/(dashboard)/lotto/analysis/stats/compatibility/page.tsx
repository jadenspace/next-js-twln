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
import { Heart, Users, Search } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { LotteryBall } from "@/shared/ui/lottery-ball";
import { PageHeader } from "@/shared/ui/page-header";
import { EmptyStateCard } from "@/shared/ui/empty-state-card";

export default function CompatibilityStatsPage() {
  const [filters, setFilters] = useState<FilterValues | null>(null);
  const [targetNum, setTargetNum] = useState<number | null>(null);

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

  const getBestPartners = (num: number) => {
    if (!stats) return [];
    return Object.entries(stats.compatibility.pairs)
      .filter(([pair]) => pair.split(",").includes(num.toString()))
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([pair, count]) => {
        const partner = pair.split(",").find((n) => n !== num.toString());
        return { num: partner, count };
      })
      .slice(0, 10);
  };

  const topOverallPairs = stats
    ? Object.entries(stats.compatibility.pairs)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 10)
    : [];

  return (
    <div className="container mx-auto py-6 md:py-10 px-4 max-w-6xl">
      <PageHeader
        title="궁합수 분석 (동반 출현)"
        description="함께 당첨될 확률이 높은 번호 조합을 분석하여 시너지를 찾습니다."
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
          icon={Heart}
          title="궁합 분석 데이터 대기 중"
          description="번호 간의 궁합 관계를 분석하려면 시작해 주세요."
        />
      ) : (
        <div className="space-y-8 animate-in slide-in-from-right-10 duration-700">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-red-100 bg-red-50/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Users className="w-5 h-5" />
                  번호 선택하여 최고의 파트너 찾기
                </CardTitle>
                <CardDescription>
                  특정 번호와 가장 자주 함께 당첨된 번호 리스트입니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 md:px-6">
                <div className="space-y-4 md:space-y-6">
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    {Array.from({ length: 45 }, (_, i) => i + 1).map((num) => (
                      <button
                        key={num}
                        onClick={() => setTargetNum(num)}
                        className={cn(
                          "w-8 h-8 md:w-10 md:h-10 rounded-md md:rounded-lg border flex items-center justify-center text-[10px] md:text-xs font-bold transition-all",
                          targetNum === num
                            ? "bg-red-500 border-red-500 text-white shadow-md active:scale-95"
                            : "bg-white border-red-100 text-red-700 hover:bg-red-50",
                        )}
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  {targetNum && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 md:gap-3 animate-in fade-in slide-in-from-top-2">
                      {getBestPartners(targetNum).map((partner, idx) => (
                        <div
                          key={partner.num}
                          className="p-2 md:p-3 bg-white rounded-lg md:rounded-xl border border-red-100 flex flex-col items-center shadow-sm"
                        >
                          <span className="text-[9px] md:text-[10px] font-bold text-red-300 mb-0.5 md:mb-1">
                            BEST {idx + 1}
                          </span>
                          <LotteryBall
                            number={parseInt(partner.num!)}
                            className="w-7 h-7 md:w-8 md:h-8 text-xs mb-1 md:mb-2"
                          />
                          <span className="font-black text-red-600 text-sm md:text-base">
                            {partner.count}회
                          </span>
                          <span className="text-[9px] md:text-[10px] text-muted-foreground">
                            동반 출현
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {!targetNum && (
                    <div className="flex flex-col items-center justify-center py-10 opacity-50">
                      <Search className="w-8 h-8 mb-2" />
                      <p className="text-sm">분석할 번호를 선택해 주세요.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="text-base md:text-lg">
                  역대 최강 콤비 (Top 10)
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  전체 데이터 중 가장 많이 출현한 쌍
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 md:px-6">
                <div className="space-y-2 md:space-y-3">
                  {topOverallPairs.map(([pair, count], idx) => (
                    <div
                      key={pair}
                      className="flex items-center justify-between p-2 md:p-3 bg-muted/20 rounded-lg md:rounded-xl border border-transparent hover:border-red-200 transition-all"
                    >
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <span className="text-[10px] md:text-xs font-black text-muted-foreground/30 w-4">
                          #{idx + 1}
                        </span>
                        <div className="flex gap-1">
                          {pair.split(",").map((n) => (
                            <LotteryBall
                              key={n}
                              number={parseInt(n)}
                              className="w-6 h-6 md:w-7 md:h-7 text-[9px] md:text-[10px]"
                            />
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs md:text-sm font-black text-red-500">
                          {count}회
                        </span>
                        <p className="text-[9px] md:text-[10px] text-muted-foreground">
                          동반
                        </p>
                      </div>
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
