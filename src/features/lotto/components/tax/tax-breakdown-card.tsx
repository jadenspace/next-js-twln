"use client";

import React from "react";
import { TaxCalculationResult } from "../../types/tax.types";
import { Badge } from "@/shared/ui/badge";
import { formatKoreanCurrency } from "../../lib/lotto-tax-calculator";
import { Landmark, ArrowDownRight, ShieldCheck, PieChart } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface TaxBreakdownCardProps {
  calc: TaxCalculationResult;
  splitCount: number;
}

export function TaxBreakdownCard({ calc, splitCount }: TaxBreakdownCardProps) {
  const perPersonGross = Math.floor(calc.grossPrize / splitCount);
  const perPersonNet = Math.floor(calc.netPrize / splitCount);
  const perPersonTax = Math.floor(calc.totalTax / splitCount);

  const netPercent =
    calc.grossPrize > 0
      ? Math.round((calc.netPrize / calc.grossPrize) * 100)
      : 100;

  return (
    <div className="space-y-6">
      {/* 1. 실수령액 하이라이트 카드 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/95 via-primary to-primary/85 text-primary-foreground p-6 md:p-8 shadow-xl">
        <div className="relative z-10 space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-widest font-bold opacity-80 flex items-center gap-1.5">
                <Landmark className="w-4 h-4" /> 통장 입금 실수령액
              </span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight">
                {calc.netPrize.toLocaleString()} 원
              </h2>
            </div>
            <Badge
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-md"
            >
              실효세율 {calc.effectiveTaxRate}%
            </Badge>
          </div>

          <p className="text-sm font-semibold opacity-90">
            ≈ {formatKoreanCurrency(calc.netPrize)}
          </p>

          {/* 인원 분할 시 1인당 수령액 */}
          {splitCount > 1 && (
            <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center text-xs">
              <span className="opacity-80">
                1인당 실수령액 ({splitCount}명 분할)
              </span>
              <span className="font-bold text-sm">
                {perPersonNet.toLocaleString()} 원 (
                {formatKoreanCurrency(perPersonNet)})
              </span>
            </div>
          )}

          {/* 수령 비율 바 게이지 */}
          <div className="pt-2 space-y-1.5">
            <div className="flex justify-between text-[11px] font-medium opacity-80">
              <span>실수령 {netPercent}%</span>
              <span>세금 {100 - netPercent}%</span>
            </div>
            <div className="h-2.5 w-full bg-black/20 rounded-full overflow-hidden flex">
              <div
                className="bg-white transition-all duration-500 rounded-l-full"
                style={{ width: `${netPercent}%` }}
              />
              <div
                className="bg-red-400/80 transition-all duration-500 rounded-r-full"
                style={{ width: `${100 - netPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* 배경 은은한 워터마크 아이콘 */}
        <PieChart className="absolute right-[-20px] bottom-[-20px] w-48 h-48 opacity-10 pointer-events-none" />
      </div>

      {/* 2. 세금 상세 명세서 카드 */}
      <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-5">
        <h3 className="font-bold text-base text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" /> 세금 세부 내역서
          (2023년 소득세법)
        </h3>

        <div className="divide-y divide-border/60 text-xs">
          {/* 세전 당첨금 */}
          <div className="py-3 flex justify-between items-center">
            <span className="text-muted-foreground">세전 총 당첨금</span>
            <span className="font-semibold text-foreground text-sm">
              {calc.grossPrize.toLocaleString()} 원
            </span>
          </div>

          {/* 구입비 공제 */}
          <div className="py-3 flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">복권 구입비용 공제</span>
              <Badge variant="outline" className="text-[10px] py-0">
                비용 차감
              </Badge>
            </div>
            <span className="font-medium text-muted-foreground">
              - {calc.ticketCost.toLocaleString()} 원
            </span>
          </div>

          {/* 비과세 구간 */}
          <div className="py-3 flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">
                비과세 적용 금액 (200만 원 이하)
              </span>
              <Badge
                variant="secondary"
                className="text-[10px] py-0 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
              >
                0% 비과세
              </Badge>
            </div>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              0 원 (전액 비과세)
            </span>
          </div>

          {/* 22% 구간 */}
          {calc.bracket22Base > 0 && (
            <div className="py-3 flex justify-between items-center">
              <div>
                <p className="text-muted-foreground">
                  22% 과세 구간 (200만 원 초과 ~ 3억 원 이하)
                </p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                  과세표준: {calc.bracket22Base.toLocaleString()} 원 (소득세 20%
                  + 지방세 2%)
                </p>
              </div>
              <span className="font-semibold text-destructive">
                - {calc.bracket22Tax.toLocaleString()} 원
              </span>
            </div>
          )}

          {/* 33% 구간 */}
          {calc.bracket33Base > 0 && (
            <div className="py-3 flex justify-between items-center">
              <div>
                <p className="text-muted-foreground">
                  33% 과세 구간 (3억 원 초과분)
                </p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                  과세표준: {calc.bracket33Base.toLocaleString()} 원 (소득세 30%
                  + 지방세 3%)
                </p>
              </div>
              <span className="font-semibold text-destructive">
                - {calc.bracket33Tax.toLocaleString()} 원
              </span>
            </div>
          )}

          {/* 세목별 소계 */}
          <div className="py-3 flex justify-between items-center bg-muted/20 px-3 rounded-lg mt-2">
            <div>
              <span className="font-semibold text-foreground">
                총 세금 합계
              </span>
              <p className="text-[10px] text-muted-foreground">
                소득세 {calc.incomeTax.toLocaleString()}원 + 지방소득세{" "}
                {calc.localIncomeTax.toLocaleString()}원
              </p>
            </div>
            <span className="font-black text-destructive text-base">
              - {calc.totalTax.toLocaleString()} 원
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
