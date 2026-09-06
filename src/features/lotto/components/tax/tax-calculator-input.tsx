"use client";

import React from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { RotateCcw, Plus, Sparkles, Users } from "lucide-react";
import { formatKoreanCurrency } from "../../lib/lotto-tax-calculator";
import { useQuery } from "@tanstack/react-query";
import { lottoApi } from "../../api/lotto-api";
import { formatWon } from "../../lib/format-won";

interface TaxCalculatorInputProps {
  grossPrize: number;
  onGrossPrizeChange: (val: number) => void;
  splitCount: number;
  onSplitCountChange: (val: number) => void;
}

export function TaxCalculatorInput({
  grossPrize,
  onGrossPrizeChange,
  splitCount,
  onSplitCountChange,
}: TaxCalculatorInputProps) {
  // 최신 회차 당첨 정보 가져오기
  const { data: latestDraw } = useQuery({
    queryKey: ["lotto", "latest-draw-for-tax"],
    queryFn: () => lottoApi.getLatestDraw(),
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, "");
    const num = rawVal ? parseInt(rawVal, 10) : 0;
    onGrossPrizeChange(num);
  };

  const handleAddAmount = (amount: number) => {
    onGrossPrizeChange(grossPrize + amount);
  };

  const handleReset = () => {
    onGrossPrizeChange(0);
    onSplitCountChange(1);
  };

  const handlePreset = (amount: number) => {
    onGrossPrizeChange(amount);
  };

  return (
    <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-foreground">당첨금 입력</h3>
          <p className="text-xs text-muted-foreground">
            세금을 계산할 당첨 금액을 입력하세요
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="text-xs text-muted-foreground hover:text-foreground h-8 gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" /> 초기화
        </Button>
      </div>

      {/* 최신 회차 프리셋 버튼 */}
      {latestDraw && (
        <div className="bg-muted/40 p-3 rounded-xl space-y-2 border">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1 font-semibold text-primary">
              <Sparkles className="w-3.5 h-3.5" /> 제 {latestDraw.drw_no}회 공식
              당첨금 불러오기
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                handlePreset(parseInt(latestDraw.first_win_amnt || "0", 10))
              }
              className="text-xs h-9 font-semibold bg-background hover:border-primary flex flex-col items-center justify-center p-1"
            >
              <span>
                1등 ({formatWon(parseInt(latestDraw.first_win_amnt || "0", 10))}
                원)
              </span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                handlePreset(parseInt(latestDraw.rnk2_win_amt || "0", 10))
              }
              className="text-xs h-9 font-semibold bg-background hover:border-primary flex flex-col items-center justify-center p-1"
            >
              <span>
                2등 ({formatWon(parseInt(latestDraw.rnk2_win_amt || "0", 10))}
                원)
              </span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                handlePreset(parseInt(latestDraw.rnk3_win_amt || "0", 10))
              }
              className="text-xs h-9 font-semibold bg-background hover:border-primary flex flex-col items-center justify-center p-1"
            >
              <span>
                3등 ({formatWon(parseInt(latestDraw.rnk3_win_amt || "0", 10))}
                원)
              </span>
            </Button>
          </div>
        </div>
      )}

      {/* 금액 직접 입력 인풋 */}
      <div className="space-y-2">
        <Label
          htmlFor="gross-prize"
          className="text-xs font-semibold text-muted-foreground"
        >
          당첨 금액 (원)
        </Label>
        <div className="relative">
          <Input
            id="gross-prize"
            type="text"
            inputMode="numeric"
            value={grossPrize > 0 ? grossPrize.toLocaleString() : ""}
            placeholder="예: 2,500,000,000"
            onChange={handleInputChange}
            className="text-lg md:text-xl font-mono font-bold pr-12 h-12"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
            원
          </span>
        </div>
        {grossPrize > 0 && (
          <p className="text-sm font-semibold text-primary tracking-tight">
            ≈ {formatKoreanCurrency(grossPrize)}
          </p>
        )}
      </div>

      {/* 빠른 금액 추가 버튼 */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-muted-foreground">
          금액 빠르게 더하기
        </p>
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: "+10억", val: 1000000000 },
            { label: "+5억", val: 500000000 },
            { label: "+1억", val: 100000000 },
            { label: "+5,000만", val: 50000000 },
            { label: "+1,000만", val: 10000000 },
            { label: "+100만", val: 1000000 },
          ].map((item) => (
            <Button
              key={item.label}
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleAddAmount(item.val)}
              className="text-xs h-8 px-2.5 font-medium"
            >
              <Plus className="w-3 h-3 mr-0.5" />
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {/* 공동 구매 인원 분할 옵션 */}
      <div className="pt-4 border-t space-y-2">
        <div className="flex justify-between items-center">
          <Label
            htmlFor="split-count"
            className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" /> 공동 수령자 분할 (N분의 1)
          </Label>
          <span className="text-xs font-bold text-foreground">
            {splitCount}명
          </span>
        </div>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((cnt) => (
            <Button
              key={cnt}
              type="button"
              variant={splitCount === cnt ? "default" : "outline"}
              size="sm"
              onClick={() => onSplitCountChange(cnt)}
              className="flex-1 text-xs h-8"
            >
              {cnt === 1 ? "단독" : `${cnt}명`}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
