"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/shared/ui/page-header";
import { TaxCalculatorInput } from "@/features/lotto/components/tax/tax-calculator-input";
import { TaxBreakdownCard } from "@/features/lotto/components/tax/tax-breakdown-card";
import { TaxFunFacts } from "@/features/lotto/components/tax/tax-fun-facts";
import { TaxGuideInfo } from "@/features/lotto/components/tax/tax-guide-info";
import {
  calculateLottoTax,
  calculateFunFacts,
} from "@/features/lotto/lib/lotto-tax-calculator";

function TaxCalculatorContent() {
  const searchParams = useSearchParams();
  const initialAmountStr = searchParams ? searchParams.get("amount") : null;

  // 기본 당첨금: 쿼리 파라미터가 있으면 해당 값, 없으면 20억 원
  const [grossPrize, setGrossPrize] = useState<number>(() => {
    if (initialAmountStr) {
      const parsed = parseInt(initialAmountStr, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return 2000000000;
  });

  const [splitCount, setSplitCount] = useState<number>(1);

  // URL 변경 시 파라미터 반영
  useEffect(() => {
    if (initialAmountStr) {
      const parsed = parseInt(initialAmountStr, 10);
      if (!isNaN(parsed) && parsed > 0) {
        setGrossPrize(parsed);
      }
    }
  }, [initialAmountStr]);

  // 세금 계산 결과 (메모이제이션)
  const taxCalculation = useMemo(() => {
    return calculateLottoTax(grossPrize);
  }, [grossPrize]);

  // 위트 인포그래픽 아이템 (실수령액 기준)
  const funFacts = useMemo(() => {
    const net =
      splitCount > 1
        ? Math.floor(taxCalculation.netPrize / splitCount)
        : taxCalculation.netPrize;
    return calculateFunFacts(net);
  }, [taxCalculation.netPrize, splitCount]);

  return (
    <div className="py-6 md:py-10 max-w-6xl mx-auto px-4 space-y-8">
      <PageHeader
        title="로또 세금 & 실수령액 계산기"
        description="2023년 개정 소득세법(200만 원 비과세, 3억 원 초과 33%)을 완벽 반영한 실수령액 자동 계산기입니다."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* 좌측 컬럼: 당첨금 입력 및 수령 안내 (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <TaxCalculatorInput
            grossPrize={grossPrize}
            onGrossPrizeChange={setGrossPrize}
            splitCount={splitCount}
            onSplitCountChange={setSplitCount}
          />
          <TaxGuideInfo />
        </div>

        {/* 우측 컬럼: 실수령액 하이라이트, 세부 명세서, 인포그래픽 (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <TaxBreakdownCard calc={taxCalculation} splitCount={splitCount} />
          <TaxFunFacts
            items={funFacts}
            netPrize={
              splitCount > 1
                ? Math.floor(taxCalculation.netPrize / splitCount)
                : taxCalculation.netPrize
            }
          />
        </div>
      </div>
    </div>
  );
}

export default function LottoTaxCalculatorPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-muted-foreground">
          로딩 중...
        </div>
      }
    >
      <TaxCalculatorContent />
    </Suspense>
  );
}
