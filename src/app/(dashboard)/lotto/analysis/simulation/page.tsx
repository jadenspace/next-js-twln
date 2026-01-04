"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Calculator } from "lucide-react";
import { toast } from "sonner";

export default function SimulationPage() {
  const [numbers, setNumbers] = useState<string[]>(Array(6).fill(""));
  const [result, setResult] = useState<any | null>(null);

  const handleNumberChange = (index: number, value: string) => {
    const newNumbers = [...numbers];
    // Allow only number input
    if (value && !/^\d*$/.test(value)) return;

    // Limit 1-45
    if (parseInt(value) > 45) return;

    newNumbers[index] = value;
    setNumbers(newNumbers);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const numParams = numbers.map((n) => parseInt(n));
      // Validation
      if (numParams.some((n) => isNaN(n) || n < 1 || n > 45))
        throw new Error("1~45 사이의 숫자를 입력해주세요.");
      if (new Set(numParams).size !== 6)
        throw new Error("중복된 숫자가 있습니다.");

      const res = await fetch("/api/lotto/analysis/simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numbers: numParams }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Simulation failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data.data);
      toast.success("시뮬레이션 완료!");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  return (
    <div className="container max-w-5xl py-10">
      <h1 className="text-3xl font-bold mb-6">당첨 시뮬레이션</h1>
      <p className="text-muted-foreground mb-8">
        선택하신 번호로 과거 모든 회차에 응모했다면? 수익률(ROI)과 당첨 내역을
        시뮬레이션합니다.
        <br />
        분석 시 <span className="font-bold text-primary">300P</span>가
        소모됩니다.
      </p>

      {/* Input Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>번호 입력</CardTitle>
          <CardDescription>
            시뮬레이션 할 6개 번호를 입력해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 justify-center">
            {numbers.map((num, idx) => (
              <Input
                key={idx}
                value={num}
                onChange={(e) => handleNumberChange(idx, e.target.value)}
                className="w-16 h-16 text-center text-2xl font-bold rounded-full"
                maxLength={2}
                placeholder={(idx + 1).toString()}
              />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button
              size="lg"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || numbers.some((n) => !n)}
            >
              {mutation.isPending ? (
                <Loader2 className="animate-spin mr-2" />
              ) : (
                <Calculator className="mr-2" />
              )}
              시뮬레이션 시작 (300P)
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  총 투자금
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-2xl font-bold">
                  {result.totalCost.toLocaleString()}원
                </p>
                <p className="text-xs text-muted-foreground">
                  {result.totalDraws}회 참여
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  총 당첨금
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {result.totalPrize.toLocaleString()}원
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  수익률 (ROI)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p
                  className={`text-2xl font-bold ${result.roi >= 100 ? "text-red-500" : "text-blue-500"}`}
                >
                  {result.roi.toFixed(2)}%
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>당첨 내역 요약</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                {Object.entries(result.rankCounts).map(([rank, count]: any) => {
                  if (rank === "fail") return null;
                  return (
                    <div key={rank} className="p-4 bg-secondary/20 rounded-lg">
                      <div className="text-lg font-bold">{rank}등</div>
                      <div className="text-primary font-medium">{count}회</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>주요 당첨 기록 (상위 내역)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left">회차</th>
                      <th className="py-2 text-left">날짜</th>
                      <th className="py-2 text-center">등수</th>
                      <th className="py-2 text-right">당첨금</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.history.map((record: any, i: number) => (
                      <tr
                        key={i}
                        className="border-b last:border-0 hover:bg-muted/50"
                      >
                        <td className="py-2">{record.drwNo}회</td>
                        <td className="py-2">{record.date}</td>
                        <td className="py-2 text-center font-bold">
                          {record.rank}등
                        </td>
                        <td className="py-2 text-right">
                          {record.prize.toLocaleString()}원
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
