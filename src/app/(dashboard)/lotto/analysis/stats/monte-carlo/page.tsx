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
import { Button } from "@/shared/ui/button";
import { Play, RotateCcw, Zap, Info } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { LotteryBall } from "@/shared/ui/lottery-ball";
import { PageHeader } from "@/shared/ui/page-header";
import { EmptyStateCard } from "@/shared/ui/empty-state-card";

export default function MonteCarloStatsPage() {
  const [filters, setFilters] = useState<FilterValues | null>(null);
  const [simResults, setSimResults] = useState<Record<number, number> | null>(
    null,
  );
  const [isSimulating, setIsSimulating] = useState(false);

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
  // 시뮬레이션 결과 초기화 로직이 필요하다면 useEffect로 처리 가능하지만,
  // 여기서는 데이터가 바뀌면 시뮬레이션 결과는 그대로 두고 재실행 유도
  // 만약 필터 변경 시 결과 초기화하고 싶다면 useEffect([filters]) 사용
  useEffect(() => {
    setSimResults(null);
  }, [filters]);

  const stats = statsData?.data || null;

  const runSimulation = () => {
    if (!stats) return;
    setIsSimulating(true);

    // Simple frequency-based simulation for demonstration
    // In a real scenario, this could use Markov transitions or more complex models
    setTimeout(() => {
      const results: Record<number, number> = {};
      for (let i = 1; i <= 45; i++) results[i] = 0;

      const totalFreq = Object.values(stats.frequency).reduce(
        (a, b) => a + b,
        0,
      );
      const cumulativeWeights: number[] = [];
      let currentSum = 0;
      for (let i = 1; i <= 45; i++) {
        currentSum += (stats.frequency[i] || 0) / totalFreq;
        cumulativeWeights.push(currentSum);
      }

      for (let i = 0; i < 10000; i++) {
        const selectedDraw: Set<number> = new Set();
        while (selectedDraw.size < 6) {
          const rand = Math.random();
          const num = cumulativeWeights.findIndex((w) => rand <= w) + 1;
          selectedDraw.add(num);
        }
        selectedDraw.forEach((n) => results[n]++);
      }

      setSimResults(results);
      setIsSimulating(false);
    }, 1000);
  };

  const sortedResults = simResults
    ? Object.entries(simResults)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
    : [];

  return (
    <div className="container mx-auto py-6 md:py-10 px-4 max-w-6xl">
      <PageHeader
        title="몬테카를로 시뮬레이션"
        description="통계 데이터를 기반으로 10,000번의 가상 추첨을 시행하여 당첨 확률이 가장 높은 조합을 예측합니다."
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
          icon={Zap}
          title="시뮬레이션 데이터 대기 중"
          description="시뮬레이션의 기초가 될 통계 학습 데이터를 먼저 불러와주세요."
        />
      ) : (
        <div className="space-y-8 animate-in fade-in duration-700">
          <Card className="bg-amber-50/20 border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-amber-700">
                  추첨 시뮬레이터 가동
                </CardTitle>
                <CardDescription>
                  학습된{" "}
                  {Object.values(stats.frequency).reduce((a, b) => a + b, 0)}
                  개의 당첨 데이터를 기반으로 연산을 수행합니다.
                </CardDescription>
              </div>
              <Button
                size="lg"
                className="bg-amber-600 hover:bg-amber-700 gap-2 shadow-lg hover:shadow-amber-200 transition-all font-bold"
                onClick={runSimulation}
                disabled={isSimulating}
              >
                {isSimulating ? (
                  <RotateCcw className="w-5 h-5 animate-spin" />
                ) : (
                  <Play className="w-5 h-5 fill-current" />
                )}
                10,000회 시뮬레이션 시작
              </Button>
            </CardHeader>
            <CardContent>
              {simResults ? (
                <div className="space-y-6 animate-in zoom-in-95 duration-500">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {sortedResults.slice(0, 5).map(([num, count], idx) => (
                      <div
                        key={num}
                        className="p-4 bg-white rounded-2xl border-2 border-amber-100 flex flex-col items-center shadow-sm"
                      >
                        <span className="text-xs font-black text-amber-400 mb-2">
                          RANK #{idx + 1}
                        </span>
                        <LotteryBall
                          number={parseInt(num)}
                          className="w-12 h-12 text-base mb-3"
                        />
                        <span className="text-lg font-black text-amber-600">
                          {count}회
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          시뮬레이션 당첨
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-amber-100/50 rounded-xl flex items-start gap-4">
                    <Zap className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-amber-900">
                        시뮬레이션 추천 조합
                      </h4>
                      <p className="text-sm text-amber-800/80 mb-3">
                        10,000번의 독립 시행 중 가장 많이 등장한 상위 6개 번호의
                        조합입니다.
                      </p>
                      <div className="flex gap-2">
                        {sortedResults.slice(0, 6).map(([num]) => (
                          <LotteryBall key={num} number={parseInt(num)} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 opacity-50 border-2 border-dashed rounded-2xl">
                  <Play className="w-8 h-8 mb-2" />
                  <p className="text-sm">
                    버튼을 눌러 시뮬레이션을 시작하세요.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-amber-600" />
                몬테카를로 방법이란?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed space-y-4">
              <p>
                <b>몬테카를로 시뮬레이션</b>은 난수를 이용하여 함수의 값을
                확률적으로 계산하는 방법입니다. 로또 시스템에서는 과거의 출현
                빈도나 전이 확률을 '가중치'로 설정하고, 이 규칙에 따라 컴퓨터가
                만 번 이상의 가상 추첨을 직접 수행합니다.
              </p>
              <div className="p-4 bg-muted rounded-xl text-xs">
                수학적으로는 수많은 우연을 겹치게 하여 가장 가능성 높은
                필연(데이터의 중심)을 찾아내는 기법으로, 핵물리학이나 금융
                공학에서 널리 사용되는 신뢰도 높은 예측 알고리즘입니다.
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
