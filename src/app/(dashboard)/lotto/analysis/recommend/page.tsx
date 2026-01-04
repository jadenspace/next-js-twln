"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/shared/ui/card";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Sparkles, Copy } from "lucide-react";
import { toast } from "sonner";

export default function RecommendPage() {
  const [result, setResult] = useState<any | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/lotto/analysis/recommend", {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Recommendation failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data.data);
      toast.success("번호 생성이 완료되었습니다!");
    },
    onError: (err) => {
      alert(err.message);
    },
  });

  return (
    <div className="max-w-5xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">AI 번호 추천</h1>
      <p className="text-muted-foreground mb-8">
        빅데이터 분석과 통계 가중치를 적용한 AI 알고리즘이 5조합의 번호를
        추천해드립니다.
        <br />
        번호 생성 시 <span className="font-bold text-primary">500P</span>가
        소모됩니다.
      </p>

      {!result ? (
        <div className="flex flex-col items-center justify-center p-16 border rounded-lg bg-card shadow-sm text-center">
          <div className="p-4 bg-primary/10 rounded-full mb-6">
            <Sparkles className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">프리미엄 AI 추천</h2>
          <p className="text-muted-foreground mb-8 max-w-md">
            수천 회차의 당첨 데이터를 분석하여 최적의 번호 조합을 찾아드립니다.
            지금 바로 행운의 번호를 확인하세요!
          </p>
          <Button
            size="lg"
            className="w-full max-w-xs text-lg h-12"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                AI 분석 중...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 w-5 h-5" />
                500P 사용하고 번호 받기
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="grid gap-6">
          {result.recommendations.map((numbers: number[], idx: number) => (
            <Card key={idx} className="overflow-hidden">
              <CardHeader className="bg-secondary/20 pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Set {idx + 1}</CardTitle>
                  <span className="text-xs font-medium px-2 py-1 bg-background rounded border">
                    {
                      [
                        "Hot 분석",
                        "Cold 분석",
                        "밸런스 조합",
                        "최신 트렌드",
                        "AI 실험픽",
                      ][idx]
                    }
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-3 justify-center mb-4">
                  {numbers.map((num) => (
                    <div
                      key={num}
                      className={`
                                            w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm
                                            ${
                                              num <= 10
                                                ? "bg-yellow-500"
                                                : num <= 20
                                                  ? "bg-blue-500"
                                                  : num <= 30
                                                    ? "bg-red-500"
                                                    : num <= 40
                                                      ? "bg-gray-500"
                                                      : "bg-green-500"
                                            }
                                        `}
                    >
                      {num}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground text-center bg-muted p-2 rounded">
                  {result.reasoning[idx]}
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    navigator.clipboard.writeText(numbers.join(", "));
                    alert("복사되었습니다.");
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  번호 복사
                </Button>
              </CardFooter>
            </Card>
          ))}

          <div className="flex justify-center mt-8">
            <Button variant="outline" size="lg" onClick={() => setResult(null)}>
              다시 생성하기
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
