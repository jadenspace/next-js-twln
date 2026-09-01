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
import { Share2, MousePointer2, Info } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { LotteryBall } from "@/shared/ui/lottery-ball";
import { PageHeader } from "@/shared/ui/page-header";
import { EmptyStateCard } from "@/shared/ui/empty-state-card";
import { ServiceUnavailableNotice } from "@/shared/components/service-unavailable-notice";

export default function MarkovStatsPage() {
  const [filters, setFilters] = useState<FilterValues | null>(null);
  // 심화 분석은 1회당 200P가 차감되므로, 사용자가 직접 "분석 적용"을
  // 누르기 전에는 요청하지 않는다.
  const [hasRequested, setHasRequested] = useState(false);
  const [selectedNum, setSelectedNum] = useState<number | null>(null);

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

  const {
    data: statsData,
    isLoading,
    isError,
    refetch,
  } = useLottoNumberStats<AdvancedStats>(
    filters || undefined,
    { style: "advanced" },
    { enabled: hasRequested },
  );
  const stats = statsData?.data || null;

  const getTransitions = (num: number) => {
    if (!stats || !stats.markov.transitionMatrix[num]) return [];
    return Object.entries(stats.markov.transitionMatrix[num])
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10);
  };

  return (
    <div className="max-w-5xl mx-auto py-6 md:py-10 px-4 md:px-0">
      <PageHeader
        title="마르코프 전이 확률 분석"
        description="어떤 번호가 나온 다음 회차에 어떤 번호가 실제로 몇 번 나왔는지 세어 봅니다. 과거 기록이며 다음 회차의 확률과는 무관합니다."
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

      {isError ? (
        <ServiceUnavailableNotice onRetry={() => refetch()} />
      ) : !stats ? (
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
                    {selectedNum}번 다음 회차 동반 출현 횟수 Top 10
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
                    <b>마르코프 체인</b>은 현재 상태에서 다음 상태로 넘어갈
                    확률을 다루는 모형입니다. 다만 로또는 매 회차가 완전히
                    독립적인 추첨이라 이 전제가 성립하지 않습니다. 아래 표는
                    실제 전이 확률이 아니라, 과거에 어떤 번호 다음 회차에 어떤
                    번호가 몇 번 나왔는지를 센 기록입니다.
                  </p>
                  <div className="p-4 rounded-lg bg-muted text-xs leading-relaxed">
                    예를 들어 1번이 나온 다음 회차에 12번이 가장 많이 나왔다면,
                    그건 지금까지 그랬다는 관찰일 뿐입니다. 회차 수가 늘어날수록
                    이런 횟수 차이는 우연으로 설명되는 범위 안에 들어옵니다.
                    다음 회차의 12번 확률은 다른 번호와 똑같습니다.
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
