/**
 * 패턴 필터 검증 서비스
 * 조합이 주어진 필터 조건을 만족하는지 검사
 */

import {
  PatternFilterState,
  GeneratedCombination,
  CombinationPatterns,
  StatsData,
} from "../types/pattern-filter.types";
import {
  calculateSum,
  calculateAC,
  getOddEvenRatio,
  getHighLowRatio,
  countConsecutivePairs,
  countSameEndDigit,
  countSameSection,
  countPrimes,
  countComposites,
  countMultiplesOf3,
  countMultiplesOf5,
  countSquares,
  generateRandomCombination,
  generateRandomCombinationWithFixed,
} from "../lib/lotto-math";

export class PatternFilter {
  /**
   * 조합이 모든 필터 조건을 만족하는지 검사
   */
  matchesFilter(numbers: number[], filters: PatternFilterState): boolean {
    const sorted = [...numbers].sort((a, b) => a - b);

    // 0. 고정수 포함 여부 검사
    if (filters.fixedNumbers.length > 0) {
      const fixedSet = new Set(filters.fixedNumbers);
      for (const fixed of fixedSet) {
        if (!sorted.includes(fixed)) {
          return false;
        }
      }
    }

    // 1. 총합 검사
    const sum = calculateSum(sorted);
    if (sum < filters.sumRange[0] || sum > filters.sumRange[1]) {
      return false;
    }

    // 2. 홀짝 비율 검사
    if (filters.oddEvenRatios.length > 0) {
      const oddEven = getOddEvenRatio(sorted);
      if (!filters.oddEvenRatios.includes(oddEven)) {
        return false;
      }
    }

    // 3. 고저 비율 검사
    if (filters.highLowRatios.length > 0) {
      const highLow = getHighLowRatio(sorted);
      if (!filters.highLowRatios.includes(highLow)) {
        return false;
      }
    }

    // 4. AC값 검사
    const ac = calculateAC(sorted);
    if (ac < filters.acRange[0] || ac > filters.acRange[1]) {
      return false;
    }

    // 5. 연속번호 패턴 검사
    if (!this.checkConsecutivePattern(sorted, filters.consecutivePattern)) {
      return false;
    }

    // 6. 동일 끝수 검사
    if (!this.checkSameEndDigit(sorted, filters.sameEndDigit)) {
      return false;
    }

    // 7. 동일 구간 검사
    if (!this.checkSameSection(sorted, filters.sameSection)) {
      return false;
    }

    // 8. 소수 개수 검사
    const primeCount = countPrimes(sorted);
    if (
      primeCount < filters.primeCount[0] ||
      primeCount > filters.primeCount[1]
    ) {
      return false;
    }

    // 9. 합성수 개수 검사
    const compositeCount = countComposites(sorted);
    if (
      compositeCount < filters.compositeCount[0] ||
      compositeCount > filters.compositeCount[1]
    ) {
      return false;
    }

    // 10. 3의 배수 개수 검사
    const multiplesOf3 = countMultiplesOf3(sorted);
    if (
      multiplesOf3 < filters.multiplesOf3[0] ||
      multiplesOf3 > filters.multiplesOf3[1]
    ) {
      return false;
    }

    // 11. 5의 배수 개수 검사
    const multiplesOf5 = countMultiplesOf5(sorted);
    if (
      multiplesOf5 < filters.multiplesOf5[0] ||
      multiplesOf5 > filters.multiplesOf5[1]
    ) {
      return false;
    }

    // 12. 제곱수 개수 검사
    const squareCount = countSquares(sorted);
    if (
      squareCount < filters.squareCount[0] ||
      squareCount > filters.squareCount[1]
    ) {
      return false;
    }

    return true;
  }

  /**
   * 통계 기반 필터 검증
   * statsData가 제공된 경우에만 검사
   */
  matchesStatsFilter(
    numbers: number[],
    filters: PatternFilterState,
    statsData: StatsData | null,
  ): boolean {
    // statsFilter가 없거나 statsData가 없으면 통과
    if (!filters.statsFilter || !statsData) {
      return true;
    }

    const sorted = [...numbers].sort((a, b) => a - b);
    const statsFilter = filters.statsFilter;

    // 1. 핫 번호 포함 개수 검사
    const hotCount = sorted.filter((n) =>
      statsData.hotNumbers.includes(n),
    ).length;
    if (
      hotCount < statsFilter.hotNumberCount[0] ||
      hotCount > statsFilter.hotNumberCount[1]
    ) {
      return false;
    }

    // 2. 콜드 번호 포함 개수 검사
    const coldCount = sorted.filter((n) =>
      statsData.coldNumbers.includes(n),
    ).length;
    if (
      coldCount < statsFilter.coldNumberCount[0] ||
      coldCount > statsFilter.coldNumberCount[1]
    ) {
      return false;
    }

    // 3. 직전 회차 번호 포함 개수 검사
    const previousCount = sorted.filter((n) =>
      statsData.previousNumbers.includes(n),
    ).length;
    if (
      previousCount < statsFilter.previousDrawCount[0] ||
      previousCount > statsFilter.previousDrawCount[1]
    ) {
      return false;
    }

    // 4. 미출현 번호 포함 개수 검사
    const missNumbers =
      statsData.missNumbers[statsFilter.missCountThreshold] ?? [];
    const missCount = sorted.filter((n) => missNumbers.includes(n)).length;
    if (
      missCount < statsFilter.missNumberCount[0] ||
      missCount > statsFilter.missNumberCount[1]
    ) {
      return false;
    }

    return true;
  }

  /**
   * 모든 필터 (기본 + 통계) 검사
   */
  matchesAllFilters(
    numbers: number[],
    filters: PatternFilterState,
    statsData: StatsData | null,
  ): boolean {
    return (
      this.matchesFilter(numbers, filters) &&
      this.matchesStatsFilter(numbers, filters, statsData)
    );
  }

  /**
   * 기타 필터만 검사 (경우의 수 추정용)
   */
  matchesOtherFilters(numbers: number[], filters: PatternFilterState): boolean {
    const sorted = [...numbers].sort((a, b) => a - b);

    // 연속번호 패턴 검사
    if (!this.checkConsecutivePattern(sorted, filters.consecutivePattern)) {
      return false;
    }

    // 동일 끝수 검사
    if (!this.checkSameEndDigit(sorted, filters.sameEndDigit)) {
      return false;
    }

    // 동일 구간 검사
    if (!this.checkSameSection(sorted, filters.sameSection)) {
      return false;
    }

    // 소수 개수 검사
    const primeCount = countPrimes(sorted);
    if (
      primeCount < filters.primeCount[0] ||
      primeCount > filters.primeCount[1]
    ) {
      return false;
    }

    // 합성수 개수 검사
    const compositeCount = countComposites(sorted);
    if (
      compositeCount < filters.compositeCount[0] ||
      compositeCount > filters.compositeCount[1]
    ) {
      return false;
    }

    // 3의 배수 개수 검사
    const multiplesOf3 = countMultiplesOf3(sorted);
    if (
      multiplesOf3 < filters.multiplesOf3[0] ||
      multiplesOf3 > filters.multiplesOf3[1]
    ) {
      return false;
    }

    // 5의 배수 개수 검사
    const multiplesOf5 = countMultiplesOf5(sorted);
    if (
      multiplesOf5 < filters.multiplesOf5[0] ||
      multiplesOf5 > filters.multiplesOf5[1]
    ) {
      return false;
    }

    // 제곱수 개수 검사
    const squareCount = countSquares(sorted);
    if (
      squareCount < filters.squareCount[0] ||
      squareCount > filters.squareCount[1]
    ) {
      return false;
    }

    return true;
  }

  /**
   * 연속번호 패턴 검사
   */
  private checkConsecutivePattern(
    numbers: number[],
    pattern: PatternFilterState["consecutivePattern"],
  ): boolean {
    const runs = this.getConsecutiveRuns(numbers);
    const maxRun = Math.max(...runs);
    const runsGe2 = runs.filter((len) => len >= 2).length;
    const runsEq2 = runs.filter((len) => len === 2).length;

    switch (pattern) {
      case "any":
        return true;
      case "none":
        return runsGe2 === 0;
      case "2-pair-1":
        return runsGe2 === 1 && maxRun === 2;
      case "2-pair-2":
        return runsEq2 === 2 && maxRun === 2;
      case "3-run-1":
        return runsGe2 === 1 && maxRun === 3;
      case "4-run-1":
        return runsGe2 === 1 && maxRun === 4;
      default:
        return true;
    }
  }

  private getConsecutiveRuns(numbers: number[]): number[] {
    const sorted = [...numbers].sort((a, b) => a - b);
    const runs: number[] = [];
    let runLength = 1;

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === sorted[i - 1] + 1) {
        runLength++;
      } else {
        runs.push(runLength);
        runLength = 1;
      }
    }

    runs.push(runLength);
    return runs;
  }

  /**
   * 동일 끝수 검사
   */
  private checkSameEndDigit(numbers: number[], targetCount: number): boolean {
    if (targetCount <= 0) {
      return true;
    }
    // 그 외의 경우 해당 개수 이하만 허용
    return countSameEndDigit(numbers) <= targetCount;
  }

  /**
   * 동일 구간 검사
   */
  private checkSameSection(numbers: number[], targetCount: number): boolean {
    if (targetCount <= 0) {
      return true;
    }
    // 그 외의 경우 해당 개수 이하만 허용
    return countSameSection(numbers) <= targetCount;
  }

  /**
   * 조합의 패턴 정보 계산
   */
  calculatePatterns(numbers: number[]): CombinationPatterns {
    const sorted = [...numbers].sort((a, b) => a - b);

    return {
      sum: calculateSum(sorted),
      oddEven: getOddEvenRatio(sorted),
      highLow: getHighLowRatio(sorted),
      ac: calculateAC(sorted),
      consecutive: countConsecutivePairs(sorted),
      primeCount: countPrimes(sorted),
      compositeCount: countComposites(sorted),
    };
  }

  /**
   * 필터 조건에 맞는 조합 생성
   */
  generateFilteredCombinations(
    filters: PatternFilterState,
    count: number,
    maxAttempts: number = 100000,
    statsData: StatsData | null = null,
  ): GeneratedCombination[] {
    const fixedNumbers = Array.from(new Set(filters.fixedNumbers));

    if (fixedNumbers.length > 6) {
      throw new Error("고정수는 최대 6개까지 선택할 수 있습니다.");
    }

    if (fixedNumbers.length === 6) {
      if (!this.matchesAllFilters(fixedNumbers, filters, statsData)) {
        throw new Error("고정수가 현재 필터 조건에 맞지 않습니다.");
      }

      return [
        {
          numbers: [...fixedNumbers].sort((a, b) => a - b),
          patterns: this.calculatePatterns(fixedNumbers),
        },
      ];
    }

    const results: GeneratedCombination[] = [];
    let attempts = 0;

    while (results.length < count && attempts < maxAttempts) {
      const combination =
        fixedNumbers.length > 0
          ? generateRandomCombinationWithFixed(fixedNumbers)
          : generateRandomCombination();

      if (this.matchesAllFilters(combination, filters, statsData)) {
        // 중복 검사
        const isDuplicate = results.some(
          (r) =>
            r.numbers.length === combination.length &&
            r.numbers.every((n, i) => n === combination[i]),
        );

        if (!isDuplicate) {
          results.push({
            numbers: combination,
            patterns: this.calculatePatterns(combination),
          });
        }
      }

      attempts++;
    }

    if (results.length < count) {
      throw new Error(
        `조건에 맞는 충분한 조합을 찾지 못했습니다. (${results.length}/${count} 생성, ${attempts}회 시도)`,
      );
    }

    return results;
  }
}
