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
import { PieChart, Info } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export default function OddEvenStatsPage() {
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

  const total = stats ? stats.oddEvenRatio.odd + stats.oddEvenRatio.even : 0;
  const oddPercent =
    stats && total > 0 ? (stats.oddEvenRatio.odd / total) * 100 : 0;
  const evenPercent =
    stats && total > 0 ? (stats.oddEvenRatio.even / total) * 100 : 0;

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-3">
          홀짝 통계 분석
        </h1>
        <p className="text-xl text-muted-foreground">
          당첨 번호의 홀수와 짝수 비율을 통해 행운의 균형을 찾으세요.
        </p>
      </div>

      <StatsFilter
        onApply={(v) => mutation.mutate(v)}
        isPending={mutation.isPending}
        latestDrawNo={latestDrawNo}
      />

      {!stats ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center border-dashed border-2">
          <PieChart className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-bold mb-2">홀짝 데이터 분석 대기 중</h3>
          <p className="text-muted-foreground">
            필터를 선택하고 분석 시작 버튼을 눌러주세요.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-700">
          <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle>홀/짝 비율 현황</CardTitle>
              <CardDescription>
                전체 출현 번호 중 홀수와 짝수의 비중을 시각적으로 보여줍니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="flex h-16 w-full rounded-2xl overflow-hidden shadow-lg mb-8">
                <div
                  className="bg-blue-500 flex items-center justify-center text-white font-black text-xl transition-all duration-1000"
                  style={{ width: `${oddPercent}%` }}
                >
                  {oddPercent.toFixed(0)}%
                </div>
                <div
                  className="bg-red-500 flex items-center justify-center text-white font-black text-xl transition-all duration-1000"
                  style={{ width: `${evenPercent}%` }}
                >
                  {evenPercent.toFixed(0)}%
                </div>
              </div>

              <div className="grid grid-cols-2 gap-20">
                <div className="text-center">
                  <p className="text-blue-500 text-5xl font-black mb-2">
                    {stats.oddEvenRatio.odd}
                  </p>
                  <p className="text-sm font-bold text-muted-foreground">
                    홀수 (Odd)
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-red-500 text-5xl font-black mb-2">
                    {stats.oddEvenRatio.even}
                  </p>
                  <p className="text-sm font-bold text-muted-foreground">
                    짝수 (Even)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>최근 트렌드 인사이트</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30">
                <Info className="w-5 h-5 text-primary mt-1" />
                <p className="text-sm leading-relaxed">
                  일반적으로 로또는 <b>홀3:짝3</b> 또는 <b>홀4:짝2 / 홀2:짝4</b>{" "}
                  비율이 가장 많이 등장합니다. 비중이 크게 차이나는 구간을
                  노려보세요.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
