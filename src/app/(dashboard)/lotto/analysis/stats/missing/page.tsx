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
import { Timer, AlertCircle } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { LotteryBall } from "@/shared/ui/lottery-ball";

export default function MissingStatsPage() {
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

  const sortedMiss = stats
    ? Object.entries(stats.missCount).sort(([, a], [, b]) => b - a)
    : [];

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-3">
          미출현 번호 분석
        </h1>
        <p className="text-xl text-muted-foreground">
          최근 당첨되지 않은 번호들을 분석하여 '임계점'에 도달한 번호를
          확인하세요.
        </p>
      </div>

      <StatsFilter
        onApply={(v) => mutation.mutate(v)}
        isPending={mutation.isPending}
        latestDrawNo={latestDrawNo}
      />

      {!stats ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center border-dashed border-2">
          <Timer className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-bold mb-2">미출현 데이터 대기 중</h3>
          <p className="text-muted-foreground">
            분석 범위를 설정하고 버튼을 눌러주세요.
          </p>
        </Card>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="md:col-span-4 bg-primary/5 border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-primary" />
                  장기 미출현 주의 번호 (주기 20회 이상)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {sortedMiss
                    .filter(([, count]) => count >= 20)
                    .map(([num, count]) => (
                      <div
                        key={num}
                        className="flex items-center gap-2 bg-white dark:bg-muted p-2 px-3 rounded-lg border shadow-sm"
                      >
                        <LotteryBall
                          number={parseInt(num)}
                          className="w-8 h-8 text-xs"
                        />
                        <div className="text-xs">
                          <p className="font-black text-primary">{count}회</p>
                          <p className="text-muted-foreground">미출현</p>
                        </div>
                      </div>
                    ))}
                  {sortedMiss.filter(([, count]) => count >= 20).length ===
                    0 && (
                    <p className="text-sm text-muted-foreground italic">
                      현재 장기 미출현 번호가 없습니다.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="md:col-span-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
              {sortedMiss.map(([num, count]) => (
                <div
                  key={num}
                  className={cn(
                    "p-3 rounded-xl border flex flex-col items-center transition-all hover:scale-105 bg-card",
                    count >= 20
                      ? "border-primary shadow-sm"
                      : count >= 10
                        ? "border-primary/30"
                        : "border-border",
                  )}
                >
                  <LotteryBall number={parseInt(num)} className="mb-2" />
                  <span className="text-xs font-bold">{count}회</span>
                  <span className="text-[10px] text-muted-foreground">
                    연속 미출현
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
