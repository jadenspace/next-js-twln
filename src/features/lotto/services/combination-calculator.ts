/**
 * 경우의 수 계산 서비스
 * 샘플링 기반 추정 방식으로 실시간 경우의 수를 계산
 */

import {
  PatternFilterState,
  CombinationInfo,
  CombinationStatus,
  TOTAL_COMBINATIONS,
} from "../types/pattern-filter.types";
import {
  generateRandomCombination,
  generateRandomCombinationWithFixed,
} from "../lib/lotto-math";
import { PatternFilter } from "./pattern-filter";
import { ExactCombinationCounter } from "./exact-combination-counter";

// 사전 계산된 홀짝 비율별 조합 수
const ODD_EVEN_COUNTS: Record<string, number> = {
  "0:6": 38380, // 0.47%
  "1:5": 296010, // 3.63%
  "2:4": 930465, // 11.42%
  "3:3": 1560780, // 19.16%
  "4:2": 1395360, // 17.13%
  "5:1": 629200, // 7.72%
  "6:0": 74613, // 0.92%
};

// 사전 계산된 고저 비율별 조합 수
const HIGH_LOW_COUNTS: Record<string, number> = {
  "0:6": 74613, // 저번호만 (1-22 중 6개)
  "1:5": 629200,
  "2:4": 1395360,
  "3:3": 1560780,
  "4:2": 930465,
  "5:1": 296010,
  "6:0": 38380, // 고번호만 (23-45 중 6개)
};

// AC값 분포 (대략적 추정)
const AC_VALUE_RATIOS: Record<number, number> = {
  0: 0.001,
  1: 0.005,
  2: 0.015,
  3: 0.035,
  4: 0.065,
  5: 0.1,
  6: 0.14,
  7: 0.18,
  8: 0.2,
  9: 0.17,
  10: 0.089,
};

// 연속번호 패턴별 비율 (실제 분포 기반 추정)
const CONSECUTIVE_PATTERN_RATIOS: Record<string, number> = {
  any: 1.0, // 제한 없음
  none: 0.223, // 연속번호 없음 (~22.3%)
  "2-pair-1": 0.425, // 2연속 1쌍 (~42.5%)
  "2-pair-2": 0.089, // 2연속 2쌍 (~8.9%)
  "3-run-1": 0.175, // 3연속 1쌍 (~17.5%)
  "4-run-1": 0.045, // 4연속 1쌍 (~4.5%)
};

// 동일 끝수 제한별 비율
const SAME_END_DIGIT_RATIOS: Record<number, number> = {
  0: 1.0, // 제한 없음 (모든 경우)
  3: 0.95, // 3개까지 허용 (~95% - 4개 이상 제외)
  2: 0.65, // 2개까지 허용 (~65% - 3개 이상 제외)
};

// 동일 구간 제한별 비율
const SAME_SECTION_RATIOS: Record<number, number> = {
  0: 1.0, // 제한 없음 (모든 경우)
  3: 0.92, // 3개까지 허용 (~92% - 4개 이상 제외)
  2: 0.58, // 2개까지 허용 (~58% - 3개 이상 제외)
};

// 소수 개수별 비율 (1~45 중 소수: 2,3,5,7,11,13,17,19,23,29,31,37,41,43 = 14개)
const PRIME_COUNT_RATIOS: Record<string, number> = {
  "0-6": 1.0, // 제한 없음
  "0-0": 0.002, // 0개
  "1-1": 0.018,
  "2-2": 0.088,
  "3-3": 0.232,
  "4-4": 0.312,
  "5-5": 0.235,
  "6-6": 0.113,
};

// 3의 배수 개수별 비율 (1~45 중 15개)
const MULTIPLES_OF_3_RATIOS: Record<string, number> = {
  "0-6": 1.0,
  "0-0": 0.007,
  "1-1": 0.056,
  "2-2": 0.195,
  "3-3": 0.325,
  "4-4": 0.281,
  "5-5": 0.118,
  "6-6": 0.018,
};

// 5의 배수 개수별 비율 (1~45 중 9개)
const MULTIPLES_OF_5_RATIOS: Record<string, number> = {
  "0-6": 1.0,
  "0-0": 0.065,
  "1-1": 0.285,
  "2-2": 0.368,
  "3-3": 0.213,
  "4-4": 0.062,
  "5-5": 0.007,
  "6-6": 0.0003,
};

// 총합 구간별 비율 (정규분포 근사)
function getSumRangeRatio(min: number, max: number): number {
  if (min <= 21 && max >= 255) {
    return 1;
  }
  // 총합 범위: 21 (1+2+3+4+5+6) ~ 255 (40+41+42+43+44+45)
  // 평균: 약 138, 표준편차: 약 28
  const mean = 138;
  const stdDev = 28;

  // 정규분포 CDF 근사
  const cdf = (x: number) => {
    const z = (x - mean) / stdDev;
    return 0.5 * (1 + erf(z / Math.sqrt(2)));
  };

  // 오차 함수 근사
  function erf(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    const t = 1.0 / (1.0 + p * x);
    const y =
      1.0 -
      ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
  }

  const lowerCdf = cdf(min - 0.5);
  const upperCdf = cdf(max + 0.5);
  return Math.max(0, upperCdf - lowerCdf);
}

export class CombinationCalculator {
  private patternFilter: PatternFilter;
  private exactCounter: ExactCombinationCounter;

  constructor() {
    this.patternFilter = new PatternFilter();
    this.exactCounter = new ExactCombinationCounter();
  }

  /**
   * 필터 조건에 따른 경우의 수 추정
   * 기본 필터(홀짝, 고저, 고정수)는 정확한 계산 사용
   * 나머지는 샘플링 + 사전 계산 비율 조합
   */
  estimateCombinations(filters: PatternFilterState): CombinationInfo {
    const fixedNumbers = Array.from(new Set(filters.fixedNumbers));
    const fixedCount = fixedNumbers.length;

    if (fixedCount > 6) {
      return { total: 0, percentage: 0, status: "excessive" };
    }

    // 기타 필터가 모두 비활성화되었는지 확인
    const hasOtherFilters =
      !(filters.sumRange[0] <= 21 && filters.sumRange[1] >= 255) ||
      !(filters.acRange[0] <= 0 && filters.acRange[1] >= 10) ||
      filters.consecutivePattern !== "any" ||
      filters.sameEndDigit > 0 ||
      filters.sameSection > 0 ||
      filters.primeCount[0] > 0 ||
      filters.primeCount[1] < 6 ||
      filters.compositeCount[0] > 0 ||
      filters.compositeCount[1] < 6 ||
      filters.multiplesOf3[0] > 0 ||
      filters.multiplesOf3[1] < 6 ||
      filters.multiplesOf5[0] > 0 ||
      filters.multiplesOf5[1] < 6 ||
      filters.squareCount[0] > 0 ||
      filters.squareCount[1] < 6;

    // 기본 필터(홀짝, 고저, 고정수)만 있는 경우 정확한 계산 사용
    if (!hasOtherFilters) {
      const exactCount = this.exactCounter.countBasicFilters(filters);

      if (exactCount !== null) {
        const ratio = exactCount / TOTAL_COMBINATIONS;
        return {
          total: exactCount,
          percentage: ratio * 100,
          status: this.getStatus(exactCount),
        };
      }
    }

    // 복잡한 필터가 있는 경우: 기본 필터는 정확하게, 나머지는 샘플링
    const exactBasicCount = this.exactCounter.countBasicFilters(filters);

    if (exactBasicCount !== null && exactBasicCount > 0) {
      // 기본 필터 제외한 나머지 필터의 비율 추정
      const otherFiltersRatio = this.estimateNonBasicFilters(filters);

      const estimated = Math.round(exactBasicCount * otherFiltersRatio);
      const ratio = estimated / TOTAL_COMBINATIONS;

      return {
        total: Math.max(0, estimated),
        percentage: ratio * 100,
        status: this.getStatus(estimated),
      };
    }

    // 기본 필터가 복잡하거나 계산 불가능한 경우: 기존 방식 사용 (전체 샘플링)
    // 이 경로는 exactCounter.countBasicFilters가 null을 반환하거나 0을 반환했을 때 사용될 수 있음.
    // 또는 fixedNumbers가 있지만 exactCounter가 처리하지 못하는 경우 (현재는 처리함)
    // 이 경우, 전체 조합에 대해 샘플링을 수행하여 비율을 추정한다.
    const sampleSize = 10000;
    let matchCount = 0;
    for (let i = 0; i < sampleSize; i++) {
      const combination = generateRandomCombination();
      if (this.patternFilter.matchesFilter(combination, filters)) {
        matchCount++;
      }
    }
    const ratio = matchCount / sampleSize;
    const estimated = Math.round(TOTAL_COMBINATIONS * ratio);

    return {
      total: Math.max(0, estimated),
      percentage: ratio * 100,
      status: this.getStatus(estimated),
    };
  }

  /**
   * 기본 필터(홀짝, 고저, 고정수) 외 나머지 필터의 비율 추정
   */
  private estimateNonBasicFilters(filters: PatternFilterState): number {
    let ratio = 1.0;

    // 1. 총합 범위 적용
    const sumRatio = getSumRangeRatio(filters.sumRange[0], filters.sumRange[1]);
    ratio *= sumRatio;

    // 2. AC값 범위 적용
    let acRatio = 0;
    for (let ac = filters.acRange[0]; ac <= filters.acRange[1]; ac++) {
      acRatio += AC_VALUE_RATIOS[ac] || 0;
    }
    ratio *= acRatio;

    // 3. 수학 필터: 정확한 계산 시도
    const mathCount = this.exactCounter.countMathFilters(filters);
    if (mathCount !== null) {
      // 정확한 계산 가능
      const baseMathTotal = combination(
        45 - filters.fixedNumbers.length,
        6 - filters.fixedNumbers.length,
      );
      if (baseMathTotal > 0) {
        const mathRatio = mathCount / baseMathTotal;
        ratio *= mathRatio;
      }
    } else {
      // 수학 필터 정확 계산 불가 - 샘플링에 포함됨
    }

    // 4. 패턴 필터는 샘플링으로 추정
    const samplingRatio = this.estimateOtherFiltersBySampling(filters);
    ratio *= samplingRatio;

    return ratio;
  }

  /**
   * 샘플링으로 기타 필터 비율 추정
   */
  private estimateOtherFiltersBySampling(filters: PatternFilterState): number {
    let ratio = 1.0;

    // 반복/패턴 필터가 여러 개 활성화되었는지 확인
    const repeatPatternFiltersActive = [
      filters.consecutivePattern !== "any",
      filters.sameEndDigit > 0,
      filters.sameSection > 0,
    ].filter(Boolean).length;

    // 반복/패턴 필터가 2개 이상 활성화되면 교집합 문제가 있으므로 샘플링 사용
    if (repeatPatternFiltersActive >= 2) {
      const sampleSize = 10000;
      let matchCount = 0;

      const repeatFilters: PatternFilterState = {
        ...filters,
        // 기본 필터는 무시 (이미 계산됨)
        oddEvenRatios: [],
        highLowRatios: [],
        sumRange: [21, 255],
        acRange: [0, 10],
        // 수학 필터도 무시
        primeCount: [0, 6],
        compositeCount: [0, 6],
        multiplesOf3: [0, 6],
        multiplesOf5: [0, 6],
        squareCount: [0, 6],
      };

      for (let i = 0; i < sampleSize; i++) {
        const combination = generateRandomCombination();
        if (
          this.patternFilter.matchesOtherFilters(combination, repeatFilters)
        ) {
          matchCount++;
        }
      }

      ratio = matchCount / sampleSize;
    } else {
      // 반복/패턴 필터가 0개 또는 1개만 활성화되면 사전 계산 비율 사용 가능

      // 1. 연속번호 패턴 (사전 계산된 비율 사용)
      const consecutiveRatio =
        CONSECUTIVE_PATTERN_RATIOS[filters.consecutivePattern] ?? 1.0;
      ratio *= consecutiveRatio;

      // 2. 동일 끝수 (사전 계산된 비율 사용)
      const sameEndDigitRatio =
        SAME_END_DIGIT_RATIOS[filters.sameEndDigit] ?? 1.0;
      ratio *= sameEndDigitRatio;

      // 3. 동일 구간 (사전 계산된 비율 사용)
      const sameSectionRatio = SAME_SECTION_RATIOS[filters.sameSection] ?? 1.0;
      ratio *= sameSectionRatio;
    }

    // 4. 소수 개수 (사전 계산된 비율 우선 사용)
    const primeKey = `${filters.primeCount[0]}-${filters.primeCount[1]}`;
    const primeRatio = PRIME_COUNT_RATIOS[primeKey];
    if (primeRatio !== undefined) {
      ratio *= primeRatio;
    } else if (filters.primeCount[0] > 0 || filters.primeCount[1] < 6) {
      // 범위가 복잡하면 샘플링으로 추정
      ratio *= this.estimateSingleFilterBySampling((nums) => {
        const count = nums.filter((n) => this.isPrime(n)).length;
        return count >= filters.primeCount[0] && count <= filters.primeCount[1];
      });
    }

    // 5. 3의 배수 개수 (사전 계산된 비율 우선 사용)
    const mult3Key = `${filters.multiplesOf3[0]}-${filters.multiplesOf3[1]}`;
    const mult3Ratio = MULTIPLES_OF_3_RATIOS[mult3Key];
    if (mult3Ratio !== undefined) {
      ratio *= mult3Ratio;
    } else if (filters.multiplesOf3[0] > 0 || filters.multiplesOf3[1] < 6) {
      ratio *= this.estimateSingleFilterBySampling((nums) => {
        const count = nums.filter((n) => n % 3 === 0).length;
        return (
          count >= filters.multiplesOf3[0] && count <= filters.multiplesOf3[1]
        );
      });
    }

    // 6. 5의 배수 개수 (사전 계산된 비율 우선 사용)
    const mult5Key = `${filters.multiplesOf5[0]}-${filters.multiplesOf5[1]}`;
    const mult5Ratio = MULTIPLES_OF_5_RATIOS[mult5Key];
    if (mult5Ratio !== undefined) {
      ratio *= mult5Ratio;
    } else if (filters.multiplesOf5[0] > 0 || filters.multiplesOf5[1] < 6) {
      ratio *= this.estimateSingleFilterBySampling((nums) => {
        const count = nums.filter((n) => n % 5 === 0).length;
        return (
          count >= filters.multiplesOf5[0] && count <= filters.multiplesOf5[1]
        );
      });
    }

    // 7. 합성수와 제곱수는 복잡하므로 샘플링 사용
    const hasComplexMathFilters =
      filters.compositeCount[0] > 0 ||
      filters.compositeCount[1] < 6 ||
      filters.squareCount[0] > 0 ||
      filters.squareCount[1] < 6;

    if (hasComplexMathFilters) {
      const complexFilters: PatternFilterState = {
        ...filters,
        oddEvenRatios: [],
        highLowRatios: [],
        sumRange: [21, 255],
        acRange: [0, 10],
        consecutivePattern: "any",
        sameEndDigit: 0,
        sameSection: 0,
        primeCount: [0, 6],
        multiplesOf3: [0, 6],
        multiplesOf5: [0, 6],
      };

      const sampleSize = 10000;
      let matchCount = 0;

      for (let i = 0; i < sampleSize; i++) {
        const combination = generateRandomCombination();
        if (
          this.patternFilter.matchesOtherFilters(combination, complexFilters)
        ) {
          matchCount++;
        }
      }

      ratio *= matchCount / sampleSize;
    }

    return ratio;
  }

  /**
   * 단일 필터 조건에 대한 샘플링 추정
   */
  private estimateSingleFilterBySampling(
    filterFn: (numbers: number[]) => boolean,
  ): number {
    const sampleSize = 10000;
    let matchCount = 0;

    for (let i = 0; i < sampleSize; i++) {
      const combination = generateRandomCombination();
      if (filterFn(combination)) {
        matchCount++;
      }
    }

    return matchCount / sampleSize;
  }

  /**
   * 소수 판별
   */
  private isPrime(n: number): boolean {
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;
    for (let i = 3; i * i <= n; i += 2) {
      if (n % i === 0) return false;
    }
    return true;
  }

  private estimateWithFixedSampling(
    filters: PatternFilterState,
    fixedNumbers: number[],
  ): number {
    if (fixedNumbers.length === 6) {
      return this.patternFilter.matchesFilter(fixedNumbers, filters) ? 1 : 0;
    }

    const sampleSize = 10000;
    let matchCount = 0;

    for (let i = 0; i < sampleSize; i++) {
      const combination = generateRandomCombinationWithFixed(fixedNumbers);
      if (this.patternFilter.matchesFilter(combination, filters)) {
        matchCount++;
      }
    }

    return matchCount / sampleSize;
  }

  /**
   * 경우의 수에 따른 상태 반환
   */
  private getStatus(count: number): CombinationStatus {
    if (count >= 100000) return "comfortable";
    if (count >= 10000) return "recommended";
    return "excessive";
  }

  /**
   * 상태에 따른 메시지 반환
   */
  static getStatusMessage(status: CombinationStatus): string {
    switch (status) {
      case "comfortable":
        return "여유로운 범위입니다.";
      case "recommended":
        return "적절한 범위입니다.";
      case "excessive":
        return "필터가 너무 엄격합니다. 일부 조건을 완화해주세요.";
    }
  }

  /**
   * 상태에 따른 라벨 반환
   */
  static getStatusLabel(status: CombinationStatus): string {
    switch (status) {
      case "comfortable":
        return "여유";
      case "recommended":
        return "권장";
      case "excessive":
        return "과도한 필터링";
    }
  }
}

function combination(n: number, k: number): number {
  if (k < 0 || k > n) {
    return 0;
  }
  if (k === 0 || k === n) {
    return 1;
  }

  const kEff = Math.min(k, n - k);
  let result = 1;
  for (let i = 1; i <= kEff; i++) {
    result = (result * (n - kEff + i)) / i;
  }

  return Math.round(result);
}
