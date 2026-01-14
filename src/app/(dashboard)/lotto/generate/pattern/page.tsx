"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/shared/ui/button";
import { Sparkles, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  PatternCategorySelector,
  BasicFilterPanel,
  RepeatFilterPanel,
  MathFilterPanel,
  StatsFilterPanel,
  FixedNumberSelector,
  CombinationCounter,
  GeneratedResults,
} from "@/features/lotto/components/pattern-generator";
import {
  PatternFilterState,
  PatternCategory,
  DEFAULT_FILTER_STATE,
  UNFILTERED_FILTER_STATE,
  CombinationInfo,
  GeneratedCombination,
  StatsData,
} from "@/features/lotto/types/pattern-filter.types";
import { CombinationCalculator } from "@/features/lotto/services/combination-calculator";
import { PatternFilter } from "@/features/lotto/services/pattern-filter";
import { generateRandomCombinationWithFixed } from "@/features/lotto/lib/lotto-math";

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
  const [pendingCount, setPendingCount] = useState<5 | 10 | null>(null);

  // 경우의 수 계산기
  const calculator = useMemo(() => new CombinationCalculator(), []);
  const patternFilter = useMemo(() => new PatternFilter(), []);

  // 통계 데이터 fetch (stats 카테고리 선택 시에만)
  const { data: statsData, isLoading: isStatsLoading } = useQuery<StatsData>({
    queryKey: ["pattern-stats"],
    queryFn: async () => {
      const response = await fetch("/api/lotto/generate/pattern/stats");
      if (!response.ok) {
        throw new Error("통계 데이터 로딩 실패");
      }
      const result = await response.json();
      return result.data;
    },
    enabled: selectedCategories.includes("stats"),
    staleTime: 5 * 60 * 1000, // 5분 캐시
  });

  const normalizeFixedNumbers = useCallback(
    (numbers: number[]) => Array.from(new Set(numbers)).sort((a, b) => a - b),
    [],
  );

  const getActiveFiltersWithFixed = useCallback(
    (fixedNumbers: number[]): PatternFilterState => {
      const activeFilters = {
        ...UNFILTERED_FILTER_STATE,
        fixedNumbers: selectedCategories.includes("fixed") ? fixedNumbers : [],
      };

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

      if (selectedCategories.includes("stats") && filters.statsFilter) {
        activeFilters.statsFilter = filters.statsFilter;
      }

      return activeFilters;
    },
    [filters, selectedCategories],
  );

  const activeFilters = useMemo(
    () => getActiveFiltersWithFixed(filters.fixedNumbers),
    [filters.fixedNumbers, getActiveFiltersWithFixed],
  );

  const canMakeCombination = useCallback(
    (fixedNumbers: number[], currentFilters: PatternFilterState): boolean => {
      if (fixedNumbers.length > 6) {
        return false;
      }

      if (fixedNumbers.length === 0) {
        return true;
      }

      const attempts = fixedNumbers.length === 6 ? 1 : 3000;

      for (let i = 0; i < attempts; i++) {
        const combination =
          fixedNumbers.length === 6
            ? fixedNumbers
            : generateRandomCombinationWithFixed(fixedNumbers);
        if (patternFilter.matchesFilter(combination, currentFilters)) {
          return true;
        }
      }

      return false;
    },
    [patternFilter],
  );

  // 경우의 수 계산 (debounced)
  const calculateCombinations = useCallback(() => {
    setIsCalculating(true);

    // 약간의 지연 후 계산 (UI 반응성 개선)
    const timer = setTimeout(() => {
      const info = calculator.estimateCombinations(activeFilters);
      setCombinationInfo(info);
      setIsCalculating(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [activeFilters, calculator]);

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
    onSettled: () => {
      setPendingCount(null);
    },
  });

  // 활성화된 필터만 추출
  const getActiveFilters = () =>
    getActiveFiltersWithFixed(filters.fixedNumbers);

  const handleToggleFixedNumber = useCallback(
    (value: number) => {
      setFilters((prev) => {
        if (prev.fixedNumbers.includes(value)) {
          return {
            ...prev,
            fixedNumbers: prev.fixedNumbers.filter((num) => num !== value),
          };
        }

        if (prev.fixedNumbers.length >= 6) {
          toast.error("고정수는 최대 6개까지 선택할 수 있습니다.");
          return prev;
        }

        const nextFixed = normalizeFixedNumbers([...prev.fixedNumbers, value]);

        return {
          ...prev,
          fixedNumbers: nextFixed,
        };
      });
    },
    [normalizeFixedNumbers],
  );

  const disabledNumbers = useMemo(() => {
    if (!selectedCategories.includes("fixed")) {
      return new Set<number>();
    }

    const disabled = new Set<number>();

    for (let value = 1; value <= 45; value++) {
      if (filters.fixedNumbers.includes(value)) {
        continue;
      }

      if (filters.fixedNumbers.length >= 6) {
        disabled.add(value);
        continue;
      }

      const candidateFixed = [...filters.fixedNumbers, value];
      const candidateFilters = getActiveFiltersWithFixed(candidateFixed);
      if (!canMakeCombination(candidateFixed, candidateFilters)) {
        disabled.add(value);
      }
    }

    return disabled;
  }, [
    filters.fixedNumbers,
    getActiveFiltersWithFixed,
    canMakeCombination,
    selectedCategories,
  ]);

  const filterSignature = useMemo(() => {
    const signatureFilters = getActiveFiltersWithFixed([]);
    const categoriesKey = [...selectedCategories].sort().join(",");
    return JSON.stringify({ categoriesKey, signatureFilters });
  }, [getActiveFiltersWithFixed, selectedCategories]);

  const previousSignatureRef = useRef<string>(filterSignature);

  useEffect(() => {
    if (previousSignatureRef.current === filterSignature) {
      return;
    }
    previousSignatureRef.current = filterSignature;

    if (filters.fixedNumbers.length === 0) {
      return;
    }

    const currentFilters = getActiveFiltersWithFixed(filters.fixedNumbers);
    if (canMakeCombination(filters.fixedNumbers, currentFilters)) {
      return;
    }

    const removable = filters.fixedNumbers.filter((value) => {
      const nextFixed = filters.fixedNumbers.filter((num) => num !== value);
      const nextFilters = getActiveFiltersWithFixed(nextFixed);
      return canMakeCombination(nextFixed, nextFilters);
    });

    const removedNumbers =
      removable.length > 0 ? removable : filters.fixedNumbers;
    const nextFixedNumbers =
      removable.length > 0
        ? filters.fixedNumbers.filter((num) => !removedNumbers.includes(num))
        : [];

    if (removedNumbers.length > 0) {
      setFilters((prev) => ({
        ...prev,
        fixedNumbers: nextFixedNumbers,
      }));
      toast.error(
        `필터 변경으로 고정수 ${removedNumbers.join(", ")}가 해제되었습니다.`,
      );
    }
  }, [
    filterSignature,
    filters.fixedNumbers,
    getActiveFiltersWithFixed,
    canMakeCombination,
  ]);

  useEffect(() => {
    if (!selectedCategories.includes("fixed") && filters.fixedNumbers.length) {
      setFilters((prev) => ({
        ...prev,
        fixedNumbers: [],
      }));
      toast.info("고정수 선택이 해제되었습니다.");
    }
  }, [selectedCategories, filters.fixedNumbers.length]);

  // 초기화
  const handleReset = () => {
    setFilters(DEFAULT_FILTER_STATE);
    setSelectedCategories(["basic"]);
    setResults([]);
    toast.info("필터가 초기화되었습니다.");
  };

  // 생성
  const handleGenerate = (count: 5 | 10) => {
    if (isGenerating) {
      return;
    }
    setPendingCount(count);
    generateMutation.mutate(count);
  };

  const isGenerating = generateMutation.isPending;
  const isAllCombinations =
    !!combinationInfo && combinationInfo.total === 8145060;
  const hasSelectedCategories = selectedCategories.length > 0;
  const canGenerate5 =
    hasSelectedCategories &&
    !!combinationInfo &&
    combinationInfo.total > 5 &&
    !isAllCombinations &&
    !isGenerating;
  const canGenerate10 =
    hasSelectedCategories &&
    !!combinationInfo &&
    combinationInfo.total > 10 &&
    !isAllCombinations &&
    !isGenerating;

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">패턴 조합 생성</h1>
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

        {selectedCategories.includes("stats") && (
          <StatsFilterPanel
            filters={filters}
            onFiltersChange={setFilters}
            statsData={statsData ?? null}
            isLoading={isStatsLoading}
          />
        )}
      </div>

      {/* STEP 3: 고정수 선택 */}
      {selectedCategories.includes("fixed") && (
        <FixedNumberSelector
          fixedNumbers={filters.fixedNumbers}
          disabledNumbers={disabledNumbers}
          onToggle={handleToggleFixedNumber}
        />
      )}

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
          disabled={!canGenerate5}
        >
          {isGenerating && pendingCount === 5 ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              생성 중...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              5조합 생성 (50P)
            </>
          )}
        </Button>
        <Button
          size="lg"
          className="h-14 px-8 text-lg font-bold"
          onClick={() => handleGenerate(10)}
          disabled={!canGenerate10}
        >
          {isGenerating && pendingCount === 10 ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              생성 중...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              10조합 생성 (100P)
            </>
          )}
        </Button>
      </div>

      {/* 생성 결과 */}
      <GeneratedResults results={results} />
    </div>
  );
}
