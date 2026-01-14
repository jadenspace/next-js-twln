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
import { Brain, Flame, Snowflake, Scale, Info } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { LotteryBall } from "@/shared/ui/lottery-ball";
import { PageHeader } from "@/shared/ui/page-header";
import { EmptyStateCard } from "@/shared/ui/empty-state-card";

export default function AlgorithmStatsPage() {
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

  const getHotNumbers = () => {
    if (!stats) return [];
    return Object.entries(stats.frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
  };

  const getColdNumbers = () => {
    if (!stats) return [];
    return Object.entries(stats.frequency)
      .sort(([, a], [, b]) => a - b)
      .slice(0, 10);
  };

  return (
    <div className="container mx-auto py-6 md:py-10 px-4 max-w-6xl">
      <PageHeader
        title="알고리즘 기법 분석"
        description="Hot/Cold 이론과 가중치 알고리즘을 통해 추천 번호군을 추출합니다."
      />

      <StatsFilter
        onApply={(v) => mutation.mutate(v)}
        isPending={mutation.isPending}
        latestDrawNo={latestDrawNo}
      />

      {!stats ? (
        <EmptyStateCard
          icon={Brain}
          title="알고리즘 분석 대기 중"
          description="정교한 가중치 분석을 시작하려면 버튼을 클릭해 주세요."
        />
      ) : (
        <div className="space-y-8 animate-in zoom-in-95 duration-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-orange-200 bg-orange-50/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <Flame className="w-5 h-5 fill-current" />
                  Hot Numbers (최근 강세)
                </CardTitle>
                <CardDescription>
                  지정된 범위 내에서 가장 출현 빈도가 높은 번호들입니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {getHotNumbers().map(([num, count]) => (
                    <div
                      key={num}
                      className="flex flex-col items-center p-3 bg-white rounded-xl border border-orange-100 shadow-sm"
                    >
                      <LotteryBall number={parseInt(num)} className="mb-2" />
                      <span className="text-xs font-bold text-orange-600">
                        {count}회
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-cyan-200 bg-cyan-50/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyan-600">
                  <Snowflake className="w-5 h-5" />
                  Cold Numbers (최근 약세)
                </CardTitle>
                <CardDescription>
                  출현 빈도가 낮아 반등의 기회가 있는 번호들입니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {getColdNumbers().map(([num, count]) => (
                    <div
                      key={num}
                      className="flex flex-col items-center p-3 bg-white rounded-xl border border-cyan-100 shadow-sm"
                    >
                      <LotteryBall number={parseInt(num)} className="mb-2" />
                      <span className="text-xs font-bold text-cyan-600">
                        {count}회
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-indigo-600" />
                  Balanced 추천 전략 (Mixed Weight)
                </CardTitle>
                <CardDescription>
                  Hot 3개 + Cold 2개 + 이월수 1개 조합법
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    통계적으로 당첨 번호는 항상 강세인 번호(Hot)와 오랫동안
                    나오지 않은 번호(Cold)가 적절히 섞여서 출현합니다. 아래는
                    현재 데이터 기반의 가장 균형 잡힌 가중치 그룹입니다.
                  </p>
                  <div className="p-6 bg-slate-50 rounded-2xl border flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1 space-y-2">
                      <h4 className="font-bold text-indigo-700">
                        추천 그룹 구성
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        이 그룹 내에서 무작위로 번호를 조합하는 것이 가장 높은
                        승률을 보입니다.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {[
                        ...getHotNumbers().slice(0, 5),
                        ...getColdNumbers().slice(0, 5),
                      ].map(([num]) => (
                        <LotteryBall
                          key={num}
                          number={parseInt(num)}
                          className="w-8 h-8 text-[10px]"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  알고리즘 활용 팁
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-4">
                <p>
                  <b>가중치 알고리즘</b>은 매 회차 변하는 숫자의 온도를
                  체크합니다. 무조건 많이 나온 번호만 고르는 '빈도 맹신'보다는,
                  흐름이 바뀌는 포인트(Cold에서 반등)를 잡아내는 것이
                  중요합니다.
                </p>
                <div className="p-4 bg-blue-50 text-blue-800 rounded-xl text-xs">
                  최근 10회차 이내의 데이터로 Hot Numbers를 분석하고, 전체 회차
                  데이터로 Cold Numbers를 분석하여 교차 검증해 보세요.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
