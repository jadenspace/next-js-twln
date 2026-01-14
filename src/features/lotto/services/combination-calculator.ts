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

  constructor() {
    this.patternFilter = new PatternFilter();
  }

  /**
   * 필터 조건에 따른 경우의 수 추정
   * 샘플링 + 사전 계산 비율 조합
   */
  estimateCombinations(filters: PatternFilterState): CombinationInfo {
    const fixedNumbers = Array.from(new Set(filters.fixedNumbers));
    const fixedCount = fixedNumbers.length;

    if (fixedCount > 6) {
      return { total: 0, percentage: 0, status: "excessive" };
    }

    const fixedBaseTotal =
      fixedCount > 0 ? combination(45 - fixedCount, 6 - fixedCount) : null;

    const isUnfiltered =
      filters.oddEvenRatios.length === 0 &&
      filters.highLowRatios.length === 0 &&
      filters.sumRange[0] <= 21 &&
      filters.sumRange[1] >= 255 &&
      filters.acRange[0] <= 0 &&
      filters.acRange[1] >= 10 &&
      filters.consecutivePattern === "any" &&
      filters.sameEndDigit <= 0 &&
      filters.sameSection <= 0 &&
      filters.primeCount[0] <= 0 &&
      filters.primeCount[1] >= 6 &&
      filters.compositeCount[0] <= 0 &&
      filters.compositeCount[1] >= 6 &&
      filters.multiplesOf3[0] <= 0 &&
      filters.multiplesOf3[1] >= 6 &&
      filters.multiplesOf5[0] <= 0 &&
      filters.multiplesOf5[1] >= 6 &&
      filters.squareCount[0] <= 0 &&
      filters.squareCount[1] >= 6;

    if (fixedBaseTotal !== null && isUnfiltered) {
      const ratio = fixedBaseTotal / TOTAL_COMBINATIONS;
      return {
        total: fixedBaseTotal,
        percentage: ratio * 100,
        status: this.getStatus(fixedBaseTotal),
      };
    }

    if (fixedBaseTotal !== null) {
      const samplingRatio = this.estimateWithFixedSampling(
        filters,
        fixedNumbers,
      );
      const estimated = Math.round(fixedBaseTotal * samplingRatio);
      const ratio = estimated / TOTAL_COMBINATIONS;

      return {
        total: Math.max(0, estimated),
        percentage: ratio * 100,
        status: this.getStatus(estimated),
      };
    }

    let ratio = 1.0;

    // 1. 홀짝 비율 적용
    if (filters.oddEvenRatios.length > 0 && filters.oddEvenRatios.length < 7) {
      const oddEvenRatio =
        filters.oddEvenRatios.reduce(
          (sum, r) => sum + (ODD_EVEN_COUNTS[r] || 0),
          0,
        ) / TOTAL_COMBINATIONS;
      ratio *= oddEvenRatio;
    }

    // 2. 고저 비율 적용
    if (filters.highLowRatios.length > 0 && filters.highLowRatios.length < 7) {
      const highLowRatio =
        filters.highLowRatios.reduce(
          (sum, r) => sum + (HIGH_LOW_COUNTS[r] || 0),
          0,
        ) / TOTAL_COMBINATIONS;
      ratio *= highLowRatio;
    }

    // 3. 총합 범위 적용
    const sumRatio = getSumRangeRatio(filters.sumRange[0], filters.sumRange[1]);
    ratio *= sumRatio;

    // 4. AC값 범위 적용
    let acRatio = 0;
    for (let ac = filters.acRange[0]; ac <= filters.acRange[1]; ac++) {
      acRatio += AC_VALUE_RATIOS[ac] || 0;
    }
    ratio *= acRatio;

    // 5. 기타 필터는 샘플링으로 추정
    const samplingRatio = this.estimateOtherFiltersBySampling(filters);
    ratio *= samplingRatio;

    // 최종 계산
    const estimated = Math.round(TOTAL_COMBINATIONS * ratio);

    return {
      total: Math.max(0, estimated),
      percentage: ratio * 100,
      status: this.getStatus(estimated),
    };
  }

  /**
   * 샘플링으로 기타 필터 비율 추정
   */
  private estimateOtherFiltersBySampling(filters: PatternFilterState): number {
    const sampleSize = 10000;
    let matchCount = 0;

    // 기본 필터를 제외한 나머지 필터만 적용
    const otherFilters: PatternFilterState = {
      ...filters,
      // 이미 사전 계산된 필터는 무시
      oddEvenRatios: [],
      highLowRatios: [],
      sumRange: [21, 255],
      acRange: [0, 10],
    };

    // 남은 필터가 기본값인지 확인
    const hasOtherFilters =
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

    if (!hasOtherFilters) {
      return 1.0;
    }

    for (let i = 0; i < sampleSize; i++) {
      const combination = generateRandomCombination();
      if (this.patternFilter.matchesOtherFilters(combination, otherFilters)) {
        matchCount++;
      }
    }

    return matchCount / sampleSize;
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
