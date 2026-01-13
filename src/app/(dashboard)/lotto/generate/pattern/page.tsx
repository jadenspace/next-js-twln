"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/shared/ui/button";
import { Sparkles, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  PatternCategorySelector,
  BasicFilterPanel,
  RepeatFilterPanel,
  MathFilterPanel,
  CombinationCounter,
  GeneratedResults,
} from "@/features/lotto/components/pattern-generator";
import {
  PatternFilterState,
  PatternCategory,
  DEFAULT_FILTER_STATE,
  CombinationInfo,
  GeneratedCombination,
} from "@/features/lotto/types/pattern-filter.types";
import { CombinationCalculator } from "@/features/lotto/services/combination-calculator";

export default function PatternGeneratePage() {
  // 선택된 카테고리
  const [selectedCategories, setSelectedCategories] = useState<
    PatternCategory[]
  >(["basic"]);

  // 필터 상태
  const [filters, setFilters] =
    useState<PatternFilterState>(DEFAULT_FILTER_STATE);

  // 경우의 수 정보
  const [combinationInfo, setCombinationInfo] =
    useState<CombinationInfo | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // 생성된 결과
  const [results, setResults] = useState<GeneratedCombination[]>([]);

  // 경우의 수 계산기
  const calculator = useMemo(() => new CombinationCalculator(), []);

  // 경우의 수 계산 (debounced)
  const calculateCombinations = useCallback(() => {
    setIsCalculating(true);

    // 선택된 카테고리에 따라 필터 적용
    const activeFilters = { ...DEFAULT_FILTER_STATE };

    if (selectedCategories.includes("basic")) {
      activeFilters.sumRange = filters.sumRange;
      activeFilters.oddEvenRatios = filters.oddEvenRatios;
      activeFilters.highLowRatios = filters.highLowRatios;
      activeFilters.acRange = filters.acRange;
    }

    if (selectedCategories.includes("repeat")) {
      activeFilters.consecutivePattern = filters.consecutivePattern;
      activeFilters.sameEndDigit = filters.sameEndDigit;
      activeFilters.sameSection = filters.sameSection;
    }

    if (selectedCategories.includes("math")) {
      activeFilters.primeCount = filters.primeCount;
      activeFilters.compositeCount = filters.compositeCount;
      activeFilters.multiplesOf3 = filters.multiplesOf3;
      activeFilters.multiplesOf5 = filters.multiplesOf5;
      activeFilters.squareCount = filters.squareCount;
    }

    // 약간의 지연 후 계산 (UI 반응성 개선)
    const timer = setTimeout(() => {
      const info = calculator.estimateCombinations(activeFilters);
      setCombinationInfo(info);
      setIsCalculating(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters, selectedCategories, calculator]);

  // 필터 변경 시 경우의 수 재계산
  useEffect(() => {
    const cleanup = calculateCombinations();
    return cleanup;
  }, [calculateCombinations]);

  // 조합 생성 뮤테이션
  const generateMutation = useMutation({
    mutationFn: async (count: 5 | 10) => {
      const response = await fetch("/api/lotto/generate/pattern", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filters: getActiveFilters(),
          count,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "생성 실패");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setResults(data.data);
      toast.success(`${data.data.length}개 조합이 생성되었습니다!`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // 활성화된 필터만 추출
  const getActiveFilters = (): PatternFilterState => {
    const activeFilters = { ...DEFAULT_FILTER_STATE };

    if (selectedCategories.includes("basic")) {
      activeFilters.sumRange = filters.sumRange;
      activeFilters.oddEvenRatios = filters.oddEvenRatios;
      activeFilters.highLowRatios = filters.highLowRatios;
      activeFilters.acRange = filters.acRange;
    }

    if (selectedCategories.includes("repeat")) {
      activeFilters.consecutivePattern = filters.consecutivePattern;
      activeFilters.sameEndDigit = filters.sameEndDigit;
      activeFilters.sameSection = filters.sameSection;
    }

    if (selectedCategories.includes("math")) {
      activeFilters.primeCount = filters.primeCount;
      activeFilters.compositeCount = filters.compositeCount;
      activeFilters.multiplesOf3 = filters.multiplesOf3;
      activeFilters.multiplesOf5 = filters.multiplesOf5;
      activeFilters.squareCount = filters.squareCount;
    }

    return activeFilters;
  };

  // 초기화
  const handleReset = () => {
    setFilters(DEFAULT_FILTER_STATE);
    setSelectedCategories(["basic"]);
    setResults([]);
    toast.info("필터가 초기화되었습니다.");
  };

  // 생성
  const handleGenerate = (count: 5 | 10) => {
    generateMutation.mutate(count);
  };

  const isGenerating = generateMutation.isPending;
  const canGenerate =
    combinationInfo && combinationInfo.status !== "excessive" && !isGenerating;

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">패턴 조합 생성기</h1>
          <p className="text-sm text-muted-foreground mt-1">
            원하는 패턴을 선택하고 조건에 맞는 번호 조합을 생성하세요.
          </p>
        </div>
        <Button variant="outline" onClick={handleReset} disabled={isGenerating}>
          <RotateCcw className="w-4 h-4 mr-2" />
          초기화
        </Button>
      </div>

      {/* STEP 1: 카테고리 선택 */}
      <PatternCategorySelector
        selectedCategories={selectedCategories}
        onCategoriesChange={setSelectedCategories}
      />

      {/* STEP 2: 필터 패널들 */}
      <div className="space-y-4">
        {selectedCategories.includes("basic") && (
          <BasicFilterPanel filters={filters} onFiltersChange={setFilters} />
        )}

        {selectedCategories.includes("repeat") && (
          <RepeatFilterPanel filters={filters} onFiltersChange={setFilters} />
        )}

        {selectedCategories.includes("math") && (
          <MathFilterPanel filters={filters} onFiltersChange={setFilters} />
        )}
      </div>

      {/* 경우의 수 카운터 */}
      <CombinationCounter
        info={combinationInfo}
        isCalculating={isCalculating}
      />

      {/* 생성 버튼 */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          size="lg"
          className="h-14 px-8 text-lg font-bold"
          onClick={() => handleGenerate(5)}
          disabled={!canGenerate}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              생성 중...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2 text-yellow-400" />
              5조합 생성
            </>
          )}
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-14 px-8 text-lg font-bold"
          onClick={() => handleGenerate(10)}
          disabled={!canGenerate}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              생성 중...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              10조합 생성
            </>
          )}
        </Button>
      </div>

      {combinationInfo?.status === "excessive" && (
        <p className="text-center text-sm text-destructive">
          필터 조건이 너무 엄격합니다. 일부 조건을 완화해주세요.
        </p>
      )}

      {/* 생성 결과 */}
      <GeneratedResults results={results} />
    </div>
  );
}
