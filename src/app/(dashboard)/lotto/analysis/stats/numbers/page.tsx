"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { Info } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { LotteryBall } from "@/shared/ui/lottery-ball";
import { PageHeader } from "@/shared/ui/page-header";
import { EmptyStateCard } from "@/shared/ui/empty-state-card";

export default function NumbersStatsPage() {
  const [stats, setStats] = useState<BasicStats | null>(null);

  const { data: latestDrawNo } = useQuery({
    queryKey: ["lotto", "latest-draw-no"],
    queryFn: () => lottoApi.getLatestDrawNo(),
  });

  const mutation = useMutation({
    mutationFn: async (filters: FilterValues) => {
      const res = await fetch("/api/lotto/analysis/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
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

  const maxFreq = stats ? Math.max(...Object.values(stats.frequency)) : 0;
  const minFreq = stats ? Math.min(...Object.values(stats.frequency)) : 0;

  // 최대값과 최소값에 해당하는 번호들만 식별
  const maxFreqNumbers = stats
    ? Object.entries(stats.frequency)
        .filter(([, freq]) => freq === maxFreq)
        .map(([num]) => parseInt(num))
    : [];
  const minFreqNumbers = stats
    ? Object.entries(stats.frequency)
        .filter(([, freq]) => freq === minFreq)
        .map(([num]) => parseInt(num))
    : [];

  return (
    <div className="container mx-auto py-6 md:py-10 px-4 max-w-6xl">
      <PageHeader
        title="번호별 통계"
        description="각 번호(1~45)의 출현 빈도를 통해 행운의 패턴을 발견하세요."
      />

      <StatsFilter
        onApply={(v) => mutation.mutate(v)}
        isPending={mutation.isPending}
        latestDrawNo={latestDrawNo}
      />

      {!stats ? (
        <EmptyStateCard
          icon={Info}
          title="분석을 시작해 주세요"
          description="상단의 필터를 설정하고 분석 적용 버튼을 누르면 통계 데이터가 표시됩니다."
        />
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="w-full overflow-hidden">
            <CardHeader>
              <CardTitle>번호별 출현 빈도 현황</CardTitle>
              <CardDescription>
                선택된 범위 내에서 각 번호가 몇 번 당첨되었는지 보여줍니다.
                (파랑: 최대 횟수, 빨강: 최소 횟수)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Desktop Chart */}
              <div className="hidden md:flex h-[350px] w-full items-end gap-[2px] pt-10 pb-6 border-b">
                {Array.from({ length: 45 }, (_, i) => i + 1).map((num) => {
                  const freq = stats.frequency[num] || 0;
                  const height = maxFreq > 0 ? (freq / maxFreq) * 100 : 0;
                  const isMaxFreq = maxFreqNumbers.includes(num);
                  const isMinFreq = minFreqNumbers.includes(num);

                  return (
                    <div
                      key={num}
                      className="flex-1 flex flex-col items-center group relative h-full justify-end"
                    >
                      <span
                        className={cn(
                          "text-[9px] mb-1 font-bold transition-colors group-hover:text-black",
                          isMaxFreq
                            ? "text-blue-500"
                            : isMinFreq
                              ? "text-red-500"
                              : "text-muted-foreground/50",
                        )}
                      >
                        {freq}
                      </span>
                      <div
                        className={cn(
                          "w-full rounded-t-[1px] transition-all duration-700 group-hover:bg-black",
                          isMaxFreq
                            ? "bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.3)]"
                            : isMinFreq
                              ? "bg-red-400"
                              : "bg-muted-foreground/20",
                        )}
                        style={{ height: `${height}%` }}
                      />
                      <span
                        className={cn(
                          "text-[10px] mt-1.5 font-medium transition-colors group-hover:text-black",
                          isMaxFreq && "text-blue-600 font-black",
                          isMinFreq && "text-red-600 font-black",
                          !isMaxFreq && !isMinFreq && "text-muted-foreground",
                        )}
                      >
                        {num}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Mobile Chart (Vertical Bar) */}
              <div className="md:hidden space-y-2 mt-4">
                {Array.from({ length: 45 }, (_, i) => i + 1).map((num) => {
                  const freq = stats.frequency[num] || 0;
                  const width = maxFreq > 0 ? (freq / maxFreq) * 100 : 0;
                  const isMaxFreq = maxFreqNumbers.includes(num);
                  const isMinFreq = minFreqNumbers.includes(num);

                  return (
                    <div key={num} className="flex items-center gap-3">
                      <span
                        className={cn(
                          "text-xs font-bold w-5 text-right",
                          isMaxFreq && "text-blue-500",
                          isMinFreq && "text-red-500",
                        )}
                      >
                        {num}
                      </span>
                      <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all duration-1000",
                            isMaxFreq
                              ? "bg-blue-400"
                              : isMinFreq
                                ? "bg-red-400"
                                : "bg-muted-foreground/20",
                          )}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-bold w-6",
                          isMaxFreq && "text-blue-500",
                          isMinFreq && "text-red-500",
                        )}
                      >
                        {freq}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg text-primary">
                  가장 많이 나온 수
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  // 빈도별로 그룹화
                  const groupedByFreq: Record<number, number[]> = {};
                  Object.entries(stats.frequency).forEach(([num, freq]) => {
                    if (!groupedByFreq[freq]) {
                      groupedByFreq[freq] = [];
                    }
                    groupedByFreq[freq].push(parseInt(num));
                  });

                  // 빈도가 높은 순서대로 정렬하고 상위 3개 그룹만 선택
                  const sortedGroups = Object.entries(groupedByFreq)
                    .sort(([a], [b]) => parseInt(b) - parseInt(a))
                    .slice(0, 3);

                  return sortedGroups.map(([freq, numbers], rankIdx) => (
                    <div
                      key={freq}
                      className="p-3 bg-background rounded-lg border border-primary/10 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-muted/60 text-foreground">
                            {rankIdx + 1}
                          </span>
                          <div className="text-center">
                            <p className="text-sm font-bold">{freq}회</p>
                            <p className="text-[10px] text-muted-foreground">
                              출현 빈도
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 flex-1 items-start">
                          {numbers.map((num) => (
                            <LotteryBall key={num} number={num} />
                          ))}
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </CardContent>
            </Card>

            <Card className="md:col-span-1 border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg text-primary">
                  가장 적게 나온 수
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  // 빈도별로 그룹화
                  const groupedByFreq: Record<number, number[]> = {};
                  Object.entries(stats.frequency).forEach(([num, freq]) => {
                    if (!groupedByFreq[freq]) {
                      groupedByFreq[freq] = [];
                    }
                    groupedByFreq[freq].push(parseInt(num));
                  });

                  // 빈도가 낮은 순서대로 정렬하고 하위 3개 그룹만 선택
                  const sortedGroups = Object.entries(groupedByFreq)
                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                    .slice(0, 3);

                  return sortedGroups.map(([freq, numbers], rankIdx) => (
                    <div
                      key={freq}
                      className="p-3 bg-background rounded-lg border border-primary/10 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-muted/60 text-foreground">
                            {rankIdx + 1}
                          </span>
                          <div className="text-center">
                            <p className="text-sm font-bold">{freq}회</p>
                            <p className="text-[10px] text-muted-foreground">
                              출현 빈도
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 flex-1 items-start">
                          {numbers.map((num) => (
                            <LotteryBall key={num} number={num} />
                          ))}
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </CardContent>
            </Card>

            <Card className="md:col-span-1 flex flex-col gap-0">
              <CardHeader>
                <CardTitle className="text-lg">평균 출현 횟수</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center flex-1 text-center">
                <div className="text-5xl font-black text-primary mb-2">
                  {(
                    Object.values(stats.frequency).reduce((a, b) => a + b, 0) /
                    45
                  ).toFixed(1)}
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  전체 번호 평균 빈도
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
