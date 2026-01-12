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
import { History, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { LotteryBall } from "@/shared/ui/lottery-ball";

export default function RegressionStatsPage() {
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

  const sortedByLag = stats
    ? Object.entries(stats.regression.lastCycles).sort(([, a], [, b]) => b - a)
    : [];

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-3">
          n회귀 통계 분석
        </h1>
        <p className="text-xl text-muted-foreground">
          번호별 당첨 주기를 분석하여 다음 출현 시점을 예측합니다.
        </p>
      </div>

      <StatsFilter
        onApply={(v) => mutation.mutate(v)}
        isPending={mutation.isPending}
        latestDrawNo={latestDrawNo}
      />

      {!stats ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center border-dashed border-2">
          <History className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-bold mb-2">회귀 통계 분석 대기 중</h3>
          <p className="text-muted-foreground">
            심화 분석을 위해 필터를 설정하고 버튼을 눌러주세요. (200P 소모)
          </p>
        </Card>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="col-span-1 md:col-span-2 bg-orange-50/30 border-orange-200">
              <CardHeader>
                <CardTitle className="text-orange-700 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  출현 임계점 도달 번호 (평균 주기 초과)
                </CardTitle>
                <CardDescription>
                  평균적인 출현 주기보다 더 오랫동안 나오지 않아 출현 가능성이
                  높아진 번호입니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {sortedByLag
                    .filter(
                      ([num, lag]) =>
                        lag >
                        (stats.regression.averageCycles[parseInt(num)] || 0),
                    )
                    .map(([num, lag]) => {
                      const avg =
                        stats.regression.averageCycles[parseInt(num)] || 0;
                      return (
                        <div
                          key={num}
                          className="flex flex-col items-center p-3 bg-white rounded-xl border border-orange-200 shadow-sm min-w-[100px]"
                        >
                          <LotteryBall
                            number={parseInt(num)}
                            className="mb-2"
                          />
                          <span className="text-xs font-bold text-orange-600">
                            현재 {lag}회 지연
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            평균 {avg.toFixed(1)}회
                          </span>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  번호별 상세 회귀 데이터
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {sortedByLag.map(([num, lag]) => {
                    const avg =
                      stats.regression.averageCycles[parseInt(num)] || 0;
                    const std = stats.regression.stdDev[parseInt(num)] || 0;
                    return (
                      <div
                        key={num}
                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <LotteryBall
                            number={parseInt(num)}
                            className="w-8 h-8 text-xs"
                          />
                          <div>
                            <p className="text-xs font-bold">
                              최근 {lag}회차 전 출현
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              평균 주기: {avg.toFixed(1)}회
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={cn(
                              "text-xs font-black",
                              lag > avg
                                ? "text-orange-600"
                                : "text-emerald-600",
                            )}
                          >
                            {lag > avg
                              ? `+${(lag - avg).toFixed(1)}회`
                              : `${(lag - avg).toFixed(1)}회`}
                          </div>
                          <p className="text-[9px] text-muted-foreground">
                            표준편차: {std.toFixed(1)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>회귀 통계 활용 가이드</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-4">
                <p>
                  <b>n회귀 통계</b>는 각 번호가 가진 고유한 출현 주기를
                  이용합니다. 평균적으로 7~8회차마다 나오는 번호가 현재 15회차째
                  나오지 않고 있다면, 이는 통계적 임계점에 도달했다고 볼 수
                  있습니다.
                </p>
                <div className="p-4 rounded-lg bg-blue-50 text-blue-800 text-xs">
                  <p className="font-bold mb-1">Tip!</p>
                  평균 주기와 현재 지연 회차의 차이가 <b>표준편차</b>의 2배 이상
                  벌어진 번호를 주목하세요. 이는 확률적으로 매우 출현 임박한
                  상태임을 의미합니다.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
