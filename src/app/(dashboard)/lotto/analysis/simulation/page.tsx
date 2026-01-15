"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/ui/card";
import { Label } from "@/shared/ui/label";
import { Input } from "@/shared/ui/input";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Calculator, X } from "lucide-react";
import { toast } from "sonner";
import { lottoApi } from "@/features/lotto/api/lotto-api";
import { PageHeader } from "@/shared/ui/page-header";
import { cn } from "@/shared/lib/utils";
import { getLottoBallColor } from "@/features/lotto/lib/lotto-colors";

export default function SimulationPage() {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
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

  const handleNumberToggle = useCallback((num: number) => {
    setSelectedNumbers((prev) => {
      if (prev.includes(num)) {
        return prev.filter((n) => n !== num);
      }
      if (prev.length >= 6) {
        toast.error("6개 번호만 선택할 수 있습니다.");
        return prev;
      }
      return [...prev, num].sort((a, b) => a - b);
    });
  }, []);

  const handleClearAll = useCallback(() => {
    setSelectedNumbers([]);
  }, []);

  const mutation = useMutation({
    mutationFn: async () => {
      // Validation
      if (selectedNumbers.length !== 6)
        throw new Error("6개 번호를 선택해주세요.");

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
          numbers: selectedNumbers,
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
      <Card className="mb-6 md:mb-8">
        <CardHeader className="pb-4 md:pb-6">
          <CardTitle className="text-base md:text-lg">번호 선택</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            시뮬레이션 할 6개 번호를 클릭해서 선택해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 선택된 번호 표시 */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                선택된 번호 ({selectedNumbers.length}/6)
              </span>
              {selectedNumbers.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3 mr-1" />
                  전체 해제
                </Button>
              )}
            </div>
            <div className="flex gap-2 min-h-[48px] p-3 bg-muted/30 rounded-lg">
              {selectedNumbers.length === 0 ? (
                <span className="text-sm text-muted-foreground">
                  아래에서 번호를 선택해주세요
                </span>
              ) : (
                selectedNumbers.map((num) => (
                  <button
                    key={num}
                    onClick={() => handleNumberToggle(num)}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: getLottoBallColor(num) }}
                  >
                    {num}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* 1~45 번호 그리드 */}
          <div className="grid grid-cols-9 gap-1.5 md:gap-2">
            {Array.from({ length: 45 }, (_, i) => i + 1).map((num) => {
              const isSelected = selectedNumbers.includes(num);
              return (
                <button
                  key={num}
                  onClick={() => handleNumberToggle(num)}
                  className={cn(
                    "aspect-square rounded-full flex items-center justify-center text-xs md:text-sm font-semibold transition-all",
                    isSelected
                      ? "text-white shadow-md ring-2 ring-offset-1 ring-primary"
                      : "bg-muted/50 text-foreground hover:bg-muted",
                  )}
                  style={
                    isSelected
                      ? { backgroundColor: getLottoBallColor(num) }
                      : undefined
                  }
                >
                  {num}
                </button>
              );
            })}
          </div>

          {/* 회차 범위 선택 */}
          <div className="mt-6 md:mt-8 space-y-3 md:space-y-4">
            <div>
              <Label className="text-sm md:text-base font-semibold mb-2 md:mb-3 block">
                회차 범위 선택
              </Label>
              <RadioGroup
                value={rangeType}
                onValueChange={(value) =>
                  setRangeType(value as "all" | "custom")
                }
                className="flex gap-4 md:gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label
                    htmlFor="all"
                    className="cursor-pointer text-sm md:text-base"
                  >
                    전체 회차
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label
                    htmlFor="custom"
                    className="cursor-pointer text-sm md:text-base"
                  >
                    범위 지정
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {rangeType === "custom" && (
              <div className="grid grid-cols-2 gap-3 md:flex md:items-center md:gap-4 p-3 md:p-4 bg-muted/30 rounded-lg">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="startDraw"
                    className="text-xs md:text-sm text-muted-foreground"
                  >
                    시작 회차
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
                    className="h-9 md:h-10 md:w-28 text-sm"
                    placeholder="1"
                    min="1"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="endDraw"
                    className="text-xs md:text-sm text-muted-foreground"
                  >
                    종료 회차
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
                    className="h-9 md:h-10 md:w-28 text-sm"
                    placeholder={latestDrawNo?.toString() || "1000"}
                    min="1"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 md:mt-8">
            <Button
              size="lg"
              className="w-full md:w-auto md:mx-auto md:flex h-11 md:h-12 text-sm md:text-base"
              onClick={() => mutation.mutate()}
              disabled={
                mutation.isPending ||
                selectedNumbers.length !== 6 ||
                (rangeType === "custom" && (!startDraw || !endDraw))
              }
            >
              {mutation.isPending ? (
                <Loader2 className="animate-spin mr-2 w-4 h-4 md:w-5 md:h-5" />
              ) : (
                <Calculator className="mr-2 w-4 h-4 md:w-5 md:h-5" />
              )}
              시뮬레이션 시작
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-2.5 md:space-y-6">
          {/* 요약 통계 - 모바일에서 하나의 카드에 3칸 */}
          <Card>
            <CardContent className="px-4 md:px-6">
              <div className="grid grid-cols-3 gap-2 md:gap-6 text-center">
                <div className="space-y-0.5 md:space-y-1">
                  <p className="text-xs md:text-sm text-muted-foreground">
                    총 투자금
                  </p>
                  <p className="text-base md:text-2xl font-bold truncate">
                    {parseFloat((result.totalCost / 10000).toFixed(1))}
                    <span className="text-sm md:text-base">만원</span>
                  </p>
                  <p className="text-xs md:text-xs text-muted-foreground">
                    {result.totalDraws}회
                  </p>
                </div>
                <div className="space-y-0.5 md:space-y-1">
                  <p className="text-xs md:text-sm text-muted-foreground">
                    총 당첨금
                  </p>
                  <p className="text-base md:text-2xl font-bold text-blue-600 truncate">
                    {result.totalPrize >= 10000
                      ? `${parseFloat((result.totalPrize / 10000).toFixed(1))}만원`
                      : `${result.totalPrize.toLocaleString()}원`}
                  </p>
                </div>
                <div className="space-y-0.5 md:space-y-1">
                  <p className="text-xs md:text-sm text-muted-foreground">
                    수익률
                  </p>
                  <p
                    className={`text-base md:text-2xl font-bold ${result.roi >= 100 ? "text-red-500" : "text-blue-500"}`}
                  >
                    {result.roi.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 당첨 내역 요약 - 모바일에서 가로 한 줄 */}
          <Card>
            <CardContent className="px-4 md:px-6">
              <p className="text-sm md:text-sm font-medium text-muted-foreground mb-2 md:mb-4">
                당첨 내역
              </p>
              <div className="flex justify-between md:grid md:grid-cols-5 gap-2 md:gap-4">
                {Object.entries(result.rankCounts).map(([rank, count]: any) => {
                  if (rank === "fail") return null;
                  return (
                    <div
                      key={rank}
                      className="flex-1 p-2 md:p-4 bg-secondary/20 rounded-lg text-center"
                    >
                      <div className="text-sm md:text-lg font-bold">
                        {rank}등
                      </div>
                      <div className="text-xs md:text-base text-primary font-medium">
                        {count}회
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 주요 당첨 기록 - 모바일에서 컴팩트 테이블 */}
          <Card>
            <CardContent className="px-4 md:px-6">
              <p className="text-sm md:text-sm font-medium text-muted-foreground mb-2 md:mb-4">
                주요 당첨 기록
              </p>
              <div className="max-h-48 md:max-h-96 overflow-auto">
                <table className="w-full text-sm md:text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-1.5 md:py-2 text-left">회차</th>
                      <th className="py-1.5 md:py-2 text-left hidden md:table-cell">
                        날짜
                      </th>
                      <th className="py-1.5 md:py-2 text-center">등수</th>
                      <th className="py-1.5 md:py-2 text-right">당첨금</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.history.map((record: any, i: number) => (
                      <tr
                        key={i}
                        className="border-b last:border-0 hover:bg-muted/50"
                      >
                        <td className="py-1.5 md:py-2">{record.drwNo}회</td>
                        <td className="py-1.5 md:py-2 hidden md:table-cell">
                          {record.date}
                        </td>
                        <td className="py-1.5 md:py-2 text-center font-bold">
                          {record.rank}등
                        </td>
                        <td className="py-1.5 md:py-2 text-right">
                          {record.prize >= 10000
                            ? `${(record.prize / 10000).toFixed(0)}만`
                            : `${record.prize.toLocaleString()}원`}
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
