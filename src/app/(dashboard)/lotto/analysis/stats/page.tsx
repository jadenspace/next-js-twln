"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { useMutation } from "@tanstack/react-query";
import { BasicStats } from "@/features/lotto/types";
import { Loader2, BarChart2 } from "lucide-react";
// import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'; // Would use this effectively if installed

export default function StatsAnalysisPage() {
  const [stats, setStats] = useState<BasicStats | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/lotto/analysis/stats", { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Analysis failed");
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

  return (
    <div className="container max-w-5xl py-10">
      <h1 className="text-3xl font-bold mb-6">기본 통계 분석</h1>
      <p className="text-muted-foreground mb-8">
        역대 로또 당첨번호 데이터를 기반으로 번호별 출현 빈도, 구간별 분포 등
        다양한 통계 정보를 제공합니다.
        <br />
        분석 시 <span className="font-bold text-primary">100P</span>가
        소모됩니다.
      </p>

      {!stats ? (
        <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-card shadow-sm">
          <BarChart2 className="w-16 h-16 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-4">
            분석 데이터를 불러오시겠습니까?
          </p>
          <Button
            size="lg"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending && (
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
            )}
            포인트 사용하고 분석 시작
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Frequently Appearing Numbers (Simple text viz for MVP without heavy graph lib setup yet) */}
          <Card>
            <CardHeader>
              <CardTitle>가장 많이 나온 번호 (Top 5)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 justify-center">
                {Object.entries(stats.frequency)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([num, count]) => (
                    <div key={num} className="text-center">
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-2">
                        {num}
                      </div>
                      <span className="text-sm font-medium">{count}회</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Odd/Even Ratio */}
          <Card>
            <CardHeader>
              <CardTitle>홀/짝 비율</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center items-center gap-8">
              <div className="text-center">
                <span className="block text-4xl font-bold text-blue-500">
                  {stats.oddEvenRatio.odd}
                </span>
                <span className="text-sm text-muted-foreground">홀수</span>
              </div>
              <div className="text-2xl font-bold">:</div>
              <div className="text-center">
                <span className="block text-4xl font-bold text-red-500">
                  {stats.oddEvenRatio.even}
                </span>
                <span className="text-sm text-muted-foreground">짝수</span>
              </div>
            </CardContent>
          </Card>

          {/* Raw JSON Dump for Debug/Verification */}
          <details className="text-xs text-muted-foreground cursor-pointer">
            <summary>전체 데이터 보기 (JSON)</summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto h-64">
              {JSON.stringify(stats, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
