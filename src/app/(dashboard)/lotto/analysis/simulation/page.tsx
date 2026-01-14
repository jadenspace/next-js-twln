"use client";

import { useState, useEffect } from "react";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Calculator } from "lucide-react";
import { toast } from "sonner";
import { lottoApi } from "@/features/lotto/api/lotto-api";
import { PageHeader } from "@/shared/ui/page-header";

export default function SimulationPage() {
  const [numbers, setNumbers] = useState<string[]>(Array(6).fill(""));
  const [result, setResult] = useState<any | null>(null);
  const [rangeType, setRangeType] = useState<"all" | "custom">("all");
  const [startDraw, setStartDraw] = useState<string>("");
  const [endDraw, setEndDraw] = useState<string>("");

  // 최근 회차 조회
  const { data: latestDrawNo } = useQuery({
    queryKey: ["lotto", "latest-draw-no"],
    queryFn: () => lottoApi.getLatestDrawNo(),
  });

  // 회차 범위 지정 선택 시 기본값 설정 (1 ~ 최근 회차)
  useEffect(() => {
    if (rangeType === "custom" && latestDrawNo && latestDrawNo > 0) {
      if (!startDraw || !endDraw) {
        setStartDraw("1");
        setEndDraw(latestDrawNo.toString());
      }
    }
  }, [rangeType, latestDrawNo]);

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

      // 회차 범위 검증
      let drawRange: { startDraw?: number; endDraw?: number } | undefined;
      if (rangeType === "custom") {
        const start = startDraw ? parseInt(startDraw) : undefined;
        const end = endDraw ? parseInt(endDraw) : undefined;

        if (start !== undefined && end !== undefined) {
          if (start < 1 || end < 1)
            throw new Error("회차는 1 이상이어야 합니다.");
          if (start > end)
            throw new Error("시작 회차는 종료 회차보다 작거나 같아야 합니다.");
          drawRange = { startDraw: start, endDraw: end };
        } else if (start !== undefined || end !== undefined) {
          throw new Error("시작 회차와 종료 회차를 모두 입력해주세요.");
        }
      }

      const res = await fetch("/api/lotto/analysis/simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numbers: numParams,
          drawRange: drawRange,
        }),
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
    <div className="max-w-5xl mx-auto py-6 md:py-10 px-4">
      <PageHeader
        title="당첨 시뮬레이션"
        description="선택하신 번호로 과거 모든 회차에 응모했다면? 수익률(ROI)과 당첨 내역을 시뮬레이션합니다."
      />

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

          {/* 회차 범위 선택 */}
          <div className="mt-8 space-y-4">
            <div>
              <Label className="text-base font-semibold mb-3 block">
                회차 범위 선택
              </Label>
              <RadioGroup
                value={rangeType}
                onValueChange={(value) =>
                  setRangeType(value as "all" | "custom")
                }
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="cursor-pointer">
                    전체 회차
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom" className="cursor-pointer">
                    회차 범위 지정
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {rangeType === "custom" && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="startDraw" className="whitespace-nowrap">
                    시작 회차:
                  </Label>
                  <Input
                    id="startDraw"
                    type="number"
                    value={startDraw}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val || /^\d*$/.test(val)) {
                        setStartDraw(val);
                      }
                    }}
                    className="w-32"
                    placeholder="예: 1"
                    min="1"
                  />
                </div>
                <span className="text-muted-foreground">~</span>
                <div className="flex items-center gap-2">
                  <Label htmlFor="endDraw" className="whitespace-nowrap">
                    종료 회차:
                  </Label>
                  <Input
                    id="endDraw"
                    type="number"
                    value={endDraw}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val || /^\d*$/.test(val)) {
                        setEndDraw(val);
                      }
                    }}
                    className="w-32"
                    placeholder="예: 1000"
                    min="1"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 text-center">
            <Button
              size="lg"
              onClick={() => mutation.mutate()}
              disabled={
                mutation.isPending ||
                numbers.some((n) => !n) ||
                (rangeType === "custom" && (!startDraw || !endDraw))
              }
            >
              {mutation.isPending ? (
                <Loader2 className="animate-spin mr-2" />
              ) : (
                <Calculator className="mr-2" />
              )}
              시뮬레이션 시작
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
