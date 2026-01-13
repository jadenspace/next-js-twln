/**
 * 패턴 필터 검증 서비스
 * 조합이 주어진 필터 조건을 만족하는지 검사
 */

import {
  PatternFilterState,
  GeneratedCombination,
  CombinationPatterns,
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
} from "../lib/lotto-math";

export class PatternFilter {
  /**
   * 조합이 모든 필터 조건을 만족하는지 검사
   */
  matchesFilter(numbers: number[], filters: PatternFilterState): boolean {
    const sorted = [...numbers].sort((a, b) => a - b);

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
    const consecutiveCount = countConsecutivePairs(numbers);

    switch (pattern) {
      case "none":
        return consecutiveCount === 0;
      case "2-pair-1":
        return consecutiveCount === 1;
      case "2-pair-2":
        return consecutiveCount === 2;
      default:
        return true;
    }
  }

  /**
   * 동일 끝수 검사
   */
  private checkSameEndDigit(numbers: number[], targetCount: number): boolean {
    if (targetCount === 0) {
      // 0이면 동일 끝수가 2개 이상 없어야 함
      return countSameEndDigit(numbers) < 2;
    }
    // 그 외의 경우 해당 개수와 일치해야 함
    return countSameEndDigit(numbers) === targetCount;
  }

  /**
   * 동일 구간 검사
   */
  private checkSameSection(numbers: number[], targetCount: number): boolean {
    if (targetCount === 0) {
      // 0이면 동일 구간이 2개 이상 없어야 함
      return countSameSection(numbers) < 2;
    }
    // 그 외의 경우 해당 개수와 일치해야 함
    return countSameSection(numbers) === targetCount;
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
  ): GeneratedCombination[] {
    const results: GeneratedCombination[] = [];
    let attempts = 0;

    while (results.length < count && attempts < maxAttempts) {
      const combination = generateRandomCombination();

      if (this.matchesFilter(combination, filters)) {
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
