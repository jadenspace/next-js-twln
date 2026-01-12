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
import { Info, BarChart3 } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export default function RangesStatsPage() {
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

  const sectionColors: Record<string, string> = {
    "1-10": "bg-[#fbc400]", // Yellow
    "11-20": "bg-[#69c8f2]", // Blue
    "21-30": "bg-[#ff7272]", // Red
    "31-40": "bg-[#aaa]", // Gray
    "41-45": "bg-[#b0d840]", // Green
  };

  const totalHits = stats
    ? Object.values(stats.sectionDistribution).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-3">
          구간별 출현 횟수
        </h1>
        <p className="text-xl text-muted-foreground">
          번호대별 분포를 통해 어느 구간에서 번호가 집중되는지 확인하세요.
        </p>
      </div>

      <StatsFilter
        onApply={(v) => mutation.mutate(v)}
        isPending={mutation.isPending}
        latestDrawNo={latestDrawNo}
      />

      {!stats ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center border-dashed border-2">
          <BarChart3 className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-bold mb-2">구간 분석 대기 중</h3>
          <p className="text-muted-foreground">
            필터를 선택하고 분석 시작 버튼을 눌러주세요.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in zoom-in-95 duration-500">
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle>구간별 누적 분포</CardTitle>
              <CardDescription>
                각 10단위 번호대별로 출현한 번호들의 총합 비중입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-12 w-full flex rounded-full overflow-hidden shadow-inner bg-muted mb-8">
                {Object.entries(stats.sectionDistribution).map(
                  ([label, count]) => {
                    const percent =
                      totalHits > 0 ? (count / totalHits) * 100 : 0;
                    return (
                      <div
                        key={label}
                        className={cn(
                          sectionColors[label],
                          "h-full transition-all duration-1000 ease-out flex items-center justify-center text-[10px] font-bold text-white shadow-sm",
                        )}
                        style={{ width: `${percent}%` }}
                        title={`${label}: ${count}회 (${percent.toFixed(1)}%)`}
                      >
                        {percent > 5 && `${percent.toFixed(0)}%`}
                      </div>
                    );
                  },
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(stats.sectionDistribution).map(
                  ([label, count]) => {
                    const percent =
                      totalHits > 0 ? (count / totalHits) * 100 : 0;
                    return (
                      <div
                        key={label}
                        className="p-4 rounded-xl border bg-card flex flex-col items-center text-center"
                      >
                        <div
                          className={cn(
                            "w-3 h-3 rounded-full mb-2",
                            sectionColors[label],
                          )}
                        />
                        <span className="text-sm font-bold text-muted-foreground mb-1">
                          {label}
                        </span>
                        <span className="text-2xl font-black">{count}</span>
                        <span className="text-xs text-muted-foreground">
                          ({percent.toFixed(1)}%)
                        </span>
                      </div>
                    );
                  },
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>가장 활발한 구간</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              {(() => {
                const topSection = Object.entries(
                  stats.sectionDistribution,
                ).sort(([, a], [, b]) => b - a)[0];
                return (
                  <>
                    <div
                      className={cn(
                        "w-24 h-24 rounded-full flex items-center justify-center text-xl font-black text-white mb-4 shadow-lg",
                        sectionColors[topSection[0]],
                      )}
                    >
                      {topSection[0]}
                    </div>
                    <p className="text-lg font-bold">
                      최다 출현: {topSection[0]} 구간
                    </p>
                    <p className="text-sm text-muted-foreground">
                      해당 구간에서 총 {topSection[1]}개의 번호가
                      추출되었습니다.
                    </p>
                  </>
                );
              })()}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>구간별 균형 지표</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.sectionDistribution).map(
                  ([label, count]) => {
                    const avg = totalHits / 5;
                    const diff = count - avg;
                    const isHigh = diff > 0;
                    return (
                      <div
                        key={label}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm font-medium">
                          {label} 번호대
                        </span>
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                              isHigh
                                ? "bg-red-100 text-red-600"
                                : "bg-blue-100 text-blue-600",
                            )}
                          >
                            {isHigh ? "과항" : "저조"}
                          </div>
                          <span className="text-sm font-mono">
                            {isHigh ? "+" : ""}
                            {diff.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
