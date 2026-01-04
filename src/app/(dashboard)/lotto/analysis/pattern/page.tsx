"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { useMutation } from "@tanstack/react-query";
import { PatternStats } from "@/features/lotto/services/pattern-analyzer"; // Import type locally or from index if exported
import { Loader2, TrendingUp } from "lucide-react";

export default function PatternAnalysisPage() {
  // Ideally PatternStats should be exported from types/index.ts
  const [patterns, setPatterns] = useState<any | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/lotto/analysis/pattern", {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Analysis failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setPatterns(data.data);
    },
    onError: (err) => {
      alert(err.message);
    },
  });

  return (
    <div className="max-w-5xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">패턴 분석</h1>
      <p className="text-muted-foreground mb-8">
        연속 번호, 끝자리 패턴, AC값 등 고급 패턴 정보를 분석하여 제공합니다.
        <br />
        분석 시 <span className="font-bold text-primary">200P</span>가
        소모됩니다.
      </p>

      {!patterns ? (
        <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-card shadow-sm">
          <TrendingUp className="w-16 h-16 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-4">
            고급 패턴 데이터를 분석하시겠습니까?
          </p>
          <Button
            size="lg"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending && (
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
            )}
            200P 사용하고 분석 시작
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Consecutive Patterns */}
          <Card>
            <CardHeader>
              <CardTitle>연속 번호 패턴</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(patterns.consecutivePatterns).map(
                  ([key, count]: any) => (
                    <div
                      key={key}
                      className="flex justify-between border-b pb-2"
                    >
                      <span>{key}연속 번호</span>
                      <span className="font-bold">{count}회</span>
                    </div>
                  ),
                )}
                {Object.keys(patterns.consecutivePatterns).length === 0 && (
                  <p className="text-muted-foreground text-center">
                    연속 번호 패턴 데이터가 없습니다.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* High/Low */}
          <Card>
            <CardHeader>
              <CardTitle>고/저 비율 (기준: 23)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-around text-center">
                <div>
                  <div className="text-3xl font-bold text-red-500 mb-1">
                    {patterns.highLowRatio.high}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    고 (23이상)
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-500 mb-1">
                    {patterns.highLowRatio.low}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    저 (23미만)
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* End Digit JSON Dump */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>상세 데이터</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded overflow-auto h-48">
                {JSON.stringify(patterns, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
