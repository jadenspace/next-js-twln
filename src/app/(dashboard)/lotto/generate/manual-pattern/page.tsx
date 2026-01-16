"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { RotateCcw, Sparkles, ChevronRight, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { getLottoBallColor } from "@/features/lotto/lib/lotto-colors";
import {
  StepIndicator,
  FixedExcludedSelector,
  ConstrainedBasicFilter,
  SimpleRepeatFilter,
} from "@/features/lotto/components/pattern-analysis";
import { PatternConstraintCalculator } from "@/features/lotto/services/pattern-constraint-calculator";
import { PatternFilter } from "@/features/lotto/services/pattern-filter";
import {
  TOTAL_COMBINATIONS,
  UNFILTERED_FILTER_STATE,
} from "@/features/lotto/types/pattern-filter.types";
import type {
  PatternAnalysisStep,
  PatternAnalysisStepData,
  PatternFilterState,
  GeneratedCombination,
} from "@/features/lotto/types/pattern-filter.types";

// 초기 상태
const INITIAL_STEP_DATA: PatternAnalysisStepData = {
  step1: {
    fixedNumbers: [],
    excludedNumbers: [],
    completed: false,
  },
  step2: {
    sumRange: [100, 175],
    oddEvenRatios: ["2:4", "3:3", "4:2"],
    highLowRatios: ["2:4", "3:3", "4:2"],
    acRange: [7, 10],
    completed: false,
  },
  step3: {
    consecutivePattern: "any",
    sameEndDigit: 0,
    sameSection: 0,
    completed: false,
  },
};

export default function ManualPatternAnalysisPage() {
  const [currentStep, setCurrentStep] = useState<PatternAnalysisStep>(1);
  const [stepData, setStepData] =
    useState<PatternAnalysisStepData>(INITIAL_STEP_DATA);
  const [completedSteps, setCompletedSteps] = useState<
    Set<PatternAnalysisStep>
  >(new Set());
  const [results, setResults] = useState<GeneratedCombination[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const calculator = useMemo(() => new PatternConstraintCalculator(), []);
  const patternFilter = useMemo(() => new PatternFilter(), []);

  // Step 1 경우의 수 (고정수/제외수 기반)
  const step1CombinationCount = useMemo(() => {
    const fixed = stepData.step1.fixedNumbers;
    const excluded = stepData.step1.excludedNumbers;

    if (fixed.length === 0 && excluded.length === 0) {
      return TOTAL_COMBINATIONS;
    }

    // 고정수만 있는 경우: (45 - 고정수개수 - 제외수개수) C (6 - 고정수개수)
    const availableCount = 45 - fixed.length - excluded.length;
    const remainingCount = 6 - fixed.length;

    if (availableCount < remainingCount || remainingCount < 0) {
      return 0;
    }

    // nCr 계산
    const factorial = (n: number): number => {
      if (n <= 1) return 1;
      let result = 1;
      for (let i = 2; i <= n; i++) result *= i;
      return result;
    };
    const nCr = (n: number, r: number): number => {
      if (r > n) return 0;
      if (r === 0 || r === n) return 1;
      return factorial(n) / (factorial(r) * factorial(n - r));
    };

    return nCr(availableCount, remainingCount);
  }, [stepData.step1.fixedNumbers, stepData.step1.excludedNumbers]);

  // Step 2 조합 수 (서버사이드 API로 계산)
  const [step2CombinationCount, setStep2CombinationCount] = useState<{
    total: number;
    percentage: number;
    status: "recommended" | "excessive";
  } | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Step 2 조합 수 계산 (서버사이드 API 호출 - 디바운스 + 이전 요청 취소)
  useEffect(() => {
    if (!stepData.step1.completed) {
      setStep2CombinationCount(null);
      return;
    }

    // 가능한 범위 계산 (기본값 확인용)
    const constraints = {
      sumRange: calculator.calculateSumRange(
        stepData.step1.fixedNumbers,
        stepData.step1.excludedNumbers,
      ),
      acRange: calculator.calculateACRange(
        stepData.step1.fixedNumbers,
        stepData.step1.excludedNumbers,
      ),
      oddEvenRatios: calculator.getAvailableOddEvenRatios(
        stepData.step1.fixedNumbers,
        stepData.step1.excludedNumbers,
      ),
      highLowRatios: calculator.getAvailableHighLowRatios(
        stepData.step1.fixedNumbers,
        stepData.step1.excludedNumbers,
      ),
    };

    // 기본값(전체 범위)인지 확인
    const sumIsDefault =
      stepData.step2.sumRange[0] <= constraints.sumRange[0] &&
      stepData.step2.sumRange[1] >= constraints.sumRange[1];
    const acIsDefault =
      stepData.step2.acRange[0] <= constraints.acRange[0] &&
      stepData.step2.acRange[1] >= constraints.acRange[1];
    const oddEvenIsDefault =
      stepData.step2.oddEvenRatios.length >= constraints.oddEvenRatios.length &&
      constraints.oddEvenRatios.every((r) =>
        stepData.step2.oddEvenRatios.includes(r),
      );
    const highLowIsDefault =
      stepData.step2.highLowRatios.length >= constraints.highLowRatios.length &&
      constraints.highLowRatios.every((r) =>
        stepData.step2.highLowRatios.includes(r),
      );
    const isDefault =
      sumIsDefault && acIsDefault && oddEvenIsDefault && highLowIsDefault;

    // 기본값이면 Step 1과 동일 (즉시 반환)
    if (isDefault) {
      setStep2CombinationCount({
        total: step1CombinationCount,
        percentage: (step1CombinationCount / TOTAL_COMBINATIONS) * 100,
        status: step1CombinationCount >= 10000 ? "recommended" : "excessive",
      });
      return;
    }

    // 필터가 적용된 경우: 디바운스 후 서버사이드 API 호출
    setIsCalculating(true);

    // AbortController로 이전 요청 취소
    const abortController = new AbortController();

    const debounceTimer = setTimeout(async () => {
      try {
        const response = await fetch("/api/lotto/calculate-combinations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fixedNumbers: stepData.step1.fixedNumbers,
            excludedNumbers: stepData.step1.excludedNumbers,
            filters: {
              sumRange: stepData.step2.sumRange,
              oddEvenRatios: stepData.step2.oddEvenRatios,
              highLowRatios: stepData.step2.highLowRatios,
              acRange: stepData.step2.acRange,
            },
          }),
          signal: abortController.signal, // 취소 신호 연결
        });

        if (!response.ok) throw new Error("API error");

        const data = await response.json();
        setStep2CombinationCount({
          total: data.step2.total,
          percentage: data.step2.percentage,
          status: data.step2.total >= 10000 ? "recommended" : "excessive",
        });
      } catch (error) {
        // 취소된 요청은 에러 무시
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error("Failed to calculate:", error);
        toast.error("조합 수 계산에 실패했습니다.");
      } finally {
        // 취소된 요청이 아닐 때만 로딩 해제
        if (!abortController.signal.aborted) {
          setIsCalculating(false);
        }
      }
    }, 500); // 500ms 디바운스

    return () => {
      clearTimeout(debounceTimer);
      abortController.abort(); // 이전 API 요청 취소
    };
  }, [
    stepData.step1.completed,
    stepData.step1.fixedNumbers,
    stepData.step1.excludedNumbers,
    stepData.step2.sumRange,
    stepData.step2.oddEvenRatios,
    stepData.step2.highLowRatios,
    stepData.step2.acRange,
    step1CombinationCount,
    calculator,
  ]);

  // 초기화
  const handleReset = useCallback(() => {
    setCurrentStep(1);
    setStepData(INITIAL_STEP_DATA);
    setCompletedSteps(new Set());
    setResults([]);
  }, []);

  // Step 1 완료 처리
  const handleStep1Complete = useCallback(() => {
    const validation = calculator.validateSelection(
      stepData.step1.fixedNumbers,
      stepData.step1.excludedNumbers,
    );

    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    // Step 2 기본값: 가능한 전체 범위로 설정 (필터 없음)
    const constraints = {
      sumRange: calculator.calculateSumRange(
        stepData.step1.fixedNumbers,
        stepData.step1.excludedNumbers,
      ),
      acRange: calculator.calculateACRange(
        stepData.step1.fixedNumbers,
        stepData.step1.excludedNumbers,
      ),
      oddEvenRatios: calculator.getAvailableOddEvenRatios(
        stepData.step1.fixedNumbers,
        stepData.step1.excludedNumbers,
      ),
      highLowRatios: calculator.getAvailableHighLowRatios(
        stepData.step1.fixedNumbers,
        stepData.step1.excludedNumbers,
      ),
    };

    // 기본값: 모든 가능한 옵션 선택 (필터 없음 = Step 1과 동일)
    setStepData((prev) => ({
      ...prev,
      step1: { ...prev.step1, completed: true },
      step2: {
        ...prev.step2,
        sumRange: constraints.sumRange, // 전체 가능 범위
        acRange: constraints.acRange, // 전체 가능 범위
        oddEvenRatios: constraints.oddEvenRatios, // 모든 가능한 옵션
        highLowRatios: constraints.highLowRatios, // 모든 가능한 옵션
      },
    }));
    setCompletedSteps((prev) => new Set([...prev, 1]));
    setCurrentStep(2);
    toast.success("Step 1 완료! 기본 수치 패턴을 설정하세요.");
  }, [stepData.step1.fixedNumbers, stepData.step1.excludedNumbers, calculator]);

  // Step 2 완료 처리
  const handleStep2Complete = useCallback(() => {
    if (stepData.step2.oddEvenRatios.length === 0) {
      toast.error("최소 하나의 홀짝 비율을 선택해주세요.");
      return;
    }
    if (stepData.step2.highLowRatios.length === 0) {
      toast.error("최소 하나의 고저 비율을 선택해주세요.");
      return;
    }

    setStepData((prev) => ({
      ...prev,
      step2: { ...prev.step2, completed: true },
    }));
    setCompletedSteps((prev) => new Set([...prev, 2]));
    setCurrentStep(3);
    toast.success("Step 2 완료! 반복/패턴 구조를 설정하세요.");
  }, [stepData.step2]);

  // Step 3 완료 및 번호 생성
  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setStepData((prev) => ({
      ...prev,
      step3: { ...prev.step3, completed: true },
    }));
    setCompletedSteps((prev) => new Set([...prev, 3]));

    try {
      // PatternFilterState 구성
      const filters: PatternFilterState = {
        sumRange: stepData.step2.sumRange,
        oddEvenRatios: stepData.step2.oddEvenRatios,
        highLowRatios: stepData.step2.highLowRatios,
        acRange: stepData.step2.acRange,
        consecutivePattern: stepData.step3.consecutivePattern,
        sameEndDigit: stepData.step3.sameEndDigit,
        sameSection: stepData.step3.sameSection,
        primeCount: [0, 6],
        compositeCount: [0, 6],
        multiplesOf3: [0, 6],
        multiplesOf5: [0, 6],
        squareCount: [0, 6],
        fixedNumbers: stepData.step1.fixedNumbers,
        excludedNumbers: stepData.step1.excludedNumbers,
      };

      // 번호 생성 (랜덤 생성 + 검증)
      const generated = patternFilter.generateFilteredCombinations(
        filters,
        5,
        100000,
        null,
      );

      if (generated.length === 0) {
        toast.error(
          "조건에 맞는 번호를 생성하지 못했습니다. 조건을 완화해 주세요.",
        );
      } else {
        setResults(generated);
        toast.success(`${generated.length}개의 번호 조합이 생성되었습니다!`);
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("번호 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  }, [stepData, patternFilter]);

  // 번호 복사
  const handleCopy = useCallback((numbers: number[]) => {
    const text = numbers.join(", ");
    navigator.clipboard.writeText(text);
    toast.success("번호가 클립보드에 복사되었습니다.", { description: text });
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">일반 패턴 분석</h1>
          <p className="text-sm text-muted-foreground mt-1">
            단계별로 조건을 설정하여 맞춤형 번호를 생성하세요.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="w-4 h-4 mr-2" />
          초기화
        </Button>
      </div>

      {/* 스텝 인디케이터 */}
      <Card>
        <CardContent className="py-6">
          <StepIndicator
            currentStep={currentStep}
            completedSteps={completedSteps}
          />
        </CardContent>
      </Card>

      {/* Step 1: 고정수/제외수 */}
      <FixedExcludedSelector
        fixedNumbers={stepData.step1.fixedNumbers}
        excludedNumbers={stepData.step1.excludedNumbers}
        onFixedChange={(numbers) =>
          setStepData((prev) => ({
            ...prev,
            step1: { ...prev.step1, fixedNumbers: numbers },
          }))
        }
        onExcludedChange={(numbers) =>
          setStepData((prev) => ({
            ...prev,
            step1: { ...prev.step1, excludedNumbers: numbers },
          }))
        }
        disabled={currentStep !== 1}
      />

      {/* Step 1 경우의 수 표시 */}
      <Card className="bg-muted/30 border-border/50">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                현재 고정수/제외수 적용 시
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                고정수 {stepData.step1.fixedNumbers.length}개, 제외수{" "}
                {stepData.step1.excludedNumbers.length}개
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">
                {step1CombinationCount.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">가지 조합</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 1 완료 버튼 */}
      {currentStep === 1 && (
        <div className="flex justify-end">
          <Button onClick={handleStep1Complete}>
            다음 단계
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      {currentStep >= 2 && (
        <>
          <ConstrainedBasicFilter
            fixedNumbers={stepData.step1.fixedNumbers}
            excludedNumbers={stepData.step1.excludedNumbers}
            sumRange={stepData.step2.sumRange}
            oddEvenRatios={stepData.step2.oddEvenRatios}
            highLowRatios={stepData.step2.highLowRatios}
            acRange={stepData.step2.acRange}
            onSumRangeChange={(value) =>
              setStepData((prev) => ({
                ...prev,
                step2: { ...prev.step2, sumRange: value },
              }))
            }
            onOddEvenRatiosChange={(value) =>
              setStepData((prev) => ({
                ...prev,
                step2: { ...prev.step2, oddEvenRatios: value },
              }))
            }
            onHighLowRatiosChange={(value) =>
              setStepData((prev) => ({
                ...prev,
                step2: { ...prev.step2, highLowRatios: value },
              }))
            }
            onACRangeChange={(value) =>
              setStepData((prev) => ({
                ...prev,
                step2: { ...prev.step2, acRange: value },
              }))
            }
            disabled={currentStep !== 2}
          />

          {/* Step 2 경우의 수 표시 */}
          <Card className="bg-muted/30 border-border/50">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Step 2 기본 수치 패턴 적용 후
                  </p>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>
                      총합: {stepData.step2.sumRange[0]}~
                      {stepData.step2.sumRange[1]}
                    </p>
                    <p>
                      홀짝: {stepData.step2.oddEvenRatios.join(", ") || "전체"}
                    </p>
                    <p>
                      고저: {stepData.step2.highLowRatios.join(", ") || "전체"}
                    </p>
                    <p>
                      AC값: {stepData.step2.acRange[0]}~
                      {stepData.step2.acRange[1]}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {isCalculating ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        계산 중...
                      </span>
                    </div>
                  ) : step2CombinationCount ? (
                    <>
                      <p className="text-2xl font-bold text-foreground">
                        {step2CombinationCount.total.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        가지 조합 ({step2CombinationCount.percentage.toFixed(2)}
                        %)
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">-</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 2 완료 버튼 */}
          {currentStep === 2 && (
            <div className="flex justify-end">
              <Button onClick={handleStep2Complete}>
                다음 단계
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Step 3: 반복/패턴 구조 */}
      {currentStep >= 3 && (
        <>
          <SimpleRepeatFilter
            consecutivePattern={stepData.step3.consecutivePattern}
            sameEndDigit={stepData.step3.sameEndDigit}
            sameSection={stepData.step3.sameSection}
            onConsecutivePatternChange={(value) =>
              setStepData((prev) => ({
                ...prev,
                step3: { ...prev.step3, consecutivePattern: value },
              }))
            }
            onSameEndDigitChange={(value) =>
              setStepData((prev) => ({
                ...prev,
                step3: { ...prev.step3, sameEndDigit: value },
              }))
            }
            onSameSectionChange={(value) =>
              setStepData((prev) => ({
                ...prev,
                step3: { ...prev.step3, sameSection: value },
              }))
            }
            disabled={currentStep !== 3 || results.length > 0}
          />

          {/* 번호 생성 버튼 */}
          {currentStep === 3 && results.length === 0 && (
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="min-w-[200px]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2 text-yellow-400" />
                    번호 생성하기
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      )}

      {/* 결과 */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              생성 결과
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.map((result, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
              >
                <div className="flex gap-2">
                  {result.numbers.map((num) => (
                    <div
                      key={num}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow"
                      style={{ backgroundColor: getLottoBallColor(num) }}
                    >
                      {num}
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(result.numbers)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            ))}

            {/* 다시 생성 버튼 */}
            <div className="flex justify-center gap-4 pt-4">
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                초기화
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                다시 생성
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
