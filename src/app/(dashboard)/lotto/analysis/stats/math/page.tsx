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
import { Calculator, PieChart, Info, HelpCircle } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export default function MathPropertyStatsPage() {
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

  const total = stats
    ? stats.mathProperty.primes +
      stats.mathProperty.multiplesOf3 +
      stats.mathProperty.composites
    : 0;
  const primePercent =
    stats && total > 0 ? (stats.mathProperty.primes / total) * 100 : 0;
  const compositePercent =
    stats && total > 0 ? (stats.mathProperty.composites / total) * 100 : 0;
  // Multiples of 3 is a separate property overlapping with composites,
  // but for visualization let's show Prime vs Non-Prime coverage

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-3 text-cyan-600">
          수학적 성질 분석
        </h1>
        <p className="text-xl text-muted-foreground">
          소수(Prime), 합성수, 3의 배수 등 번호가 가진 수학적 특징을 분석합니다.
        </p>
      </div>

      <StatsFilter
        onApply={(v) => mutation.mutate(v)}
        isPending={mutation.isPending}
        latestDrawNo={latestDrawNo}
      />

      {!stats ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center border-dashed border-2">
          <Calculator className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-bold mb-2">수학 통계 데이터 대기 중</h3>
          <p className="text-muted-foreground">
            알고리즘 기반의 수치 데이터를 보려면 분석을 눌러주세요.
          </p>
        </Card>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-cyan-50/20 border-cyan-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-cyan-700 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  소수(Prime Number) 비중
                </CardTitle>
                <CardDescription>
                  1과 자기 자신만으로 나누어지는 수
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-6">
                <div className="text-6xl font-black text-cyan-600 mb-2">
                  {stats.mathProperty.primes}
                </div>
                <p className="text-xs font-bold text-cyan-800/60 uppercase tracking-widset">
                  Total Appearances
                </p>
              </CardContent>
            </Card>

            <Card className="bg-blue-50/20 border-blue-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-blue-700 flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  3의 배수 비중
                </CardTitle>
                <CardDescription>
                  3, 6, 9... 등 3으로 나누어지는 수
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-6">
                <div className="text-6xl font-black text-blue-600 mb-2">
                  {stats.mathProperty.multiplesOf3}
                </div>
                <p className="text-xs font-bold text-blue-800/60 uppercase tracking-widset">
                  Total Appearances
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-50 border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-700">합성수 비중</CardTitle>
                <CardDescription>약수가 3개 이상인 수</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-6">
                <div className="text-6xl font-black text-slate-600 mb-2">
                  {stats.mathProperty.composites}
                </div>
                <p className="text-xs font-bold text-slate-800/60 uppercase tracking-widset">
                  Total Appearances
                </p>
              </CardContent>
            </Card>

            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>수학적 균형 가이드</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <p className="text-sm leading-relaxed">
                      로또 당첨 번호 6개 중에는 <b>소수가 평균 1~2개</b>{" "}
                      포함되는 경향이 있습니다. 소수가 아예 없거나 4개 이상인
                      경우는 확률적으로 매우 드뭅니다.
                    </p>
                    <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
                      <Info className="w-5 h-5 text-cyan-600 shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        소수(Prime): 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37,
                        41, 43
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm leading-relaxed">
                      <b>합성수와 3의 배수</b>를 적절히 섞는 것이 번호의 균형을
                      유지하는 핵심입니다. 전체 출현 데이터를 보며 어떤 수학적
                      성질의 번호가 현재 과하게 나오는지 체크하세요.
                    </p>
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
