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
import { Share2, MousePointer2, Info } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { LotteryBall } from "@/shared/ui/lottery-ball";
import { PageHeader } from "@/shared/ui/page-header";
import { EmptyStateCard } from "@/shared/ui/empty-state-card";

export default function MarkovStatsPage() {
  const [stats, setStats] = useState<AdvancedStats | null>(null);
  const [selectedNum, setSelectedNum] = useState<number | null>(null);

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

  const getTransitions = (num: number) => {
    if (!stats || !stats.markov.transitionMatrix[num]) return [];
    return Object.entries(stats.markov.transitionMatrix[num])
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10);
  };

  return (
    <div className="container mx-auto py-6 md:py-10 px-4 max-w-6xl">
      <PageHeader
        title="마르코프 전이 확률 분석"
        description="특정 번호가 당첨된 다음 회차에 어떤 번호가 출현할 확률이 높은지 분석합니다."
      />

      <StatsFilter
        onApply={(v) => mutation.mutate(v)}
        isPending={mutation.isPending}
        latestDrawNo={latestDrawNo}
      />

      {!stats ? (
        <EmptyStateCard
          icon={Share2}
          title="마르코프 데이터 분석 대기 중"
          description="번호 간의 연결 고리를 찾으려면 분석을 시작해 주세요."
        />
      ) : (
        <div className="space-y-8 animate-in slide-in-from-left-10 duration-700">
          <Card className="bg-purple-50/30 border-purple-200">
            <CardHeader>
              <CardTitle className="text-purple-700">
                전이 확률 행렬 (Transition Matrix)
              </CardTitle>
              <CardDescription>
                번호를 클릭하면 해당 번호 다음으로 가장 많이 출현한 번호들을
                확인할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 sm:grid-cols-9 lg:grid-cols-15 gap-2">
                {Array.from({ length: 45 }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    onClick={() => setSelectedNum(num)}
                    className={cn(
                      "w-full aspect-square rounded-xl border flex items-center justify-center transition-all hover:scale-110",
                      selectedNum === num
                        ? "bg-purple-600 border-purple-600 text-white shadow-lg ring-2 ring-purple-300 ring-offset-2"
                        : "bg-white border-purple-100 text-purple-700 hover:bg-purple-50",
                    )}
                  >
                    <span className="text-sm font-bold">{num}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedNum ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in zoom-in duration-500">
              <Card className="border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MousePointer2 className="w-5 h-5 text-purple-600" />
                    {selectedNum}번 다음 출현 확률 Top 10
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {getTransitions(selectedNum).map(
                      ([nextNum, count], idx) => (
                        <div
                          key={nextNum}
                          className="flex items-center justify-between p-3 rounded-lg border border-purple-50 bg-purple-50/10"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-purple-300 w-4">
                              #{idx + 1}
                            </span>
                            <LotteryBall
                              number={parseInt(nextNum)}
                              className="w-8 h-8 text-xs"
                            />
                            <span className="text-sm font-bold">
                              {nextNum}번
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black text-purple-600">
                              {count}회
                            </span>
                            <p className="text-[10px] text-muted-foreground">
                              전이 발생
                            </p>
                          </div>
                        </div>
                      ),
                    )}
                    {getTransitions(selectedNum).length === 0 && (
                      <p className="text-center py-10 text-muted-foreground">
                        데이터가 부족하거나 전이 사례가 없습니다.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-purple-600" />
                    알고리즘 가이드
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-4">
                  <p>
                    <b>마르코프 체인</b>은 '과거의 상태가 미래의 상태에 영향을
                    준다'는 원리를 이용합니다. 로또에서는 한 회차의 당첨
                    번호들이 다음 회차의 당첨 번호에 미치는 통계적 영향력을
                    계산합니다.
                  </p>
                  <div className="p-4 rounded-lg bg-muted text-xs leading-relaxed">
                    예를 들어, 1번이 나온 다음 회차에는 역사적으로 12번이 가장
                    많이 나왔다면, 1과 12 사이에는 <b>강한 전이 확률</b>이
                    존재한다고 봅니다. 이 수치는 번호들을 고를 때 '동반 출현'이
                    아닌 '연계 출현'의 지표로 활용됩니다.
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-2xl border-dashed border-2">
              <MousePointer2 className="w-10 h-10 text-muted-foreground/30 mb-2" />
              <p className="text-muted-foreground font-medium">
                위의 전이 행렬에서 번호를 선택해 주세요.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
