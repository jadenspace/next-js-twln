/**
 * 소거법 기반 조합 수 계산 서비스
 * Step 1: 8,145,060에서 고정수/제외수로 소거
 * Step 2: Step 1 결과에서 기본 수치 패턴으로 소거
 */

import { TOTAL_COMBINATIONS } from "../types/pattern-filter.types";

/**
 * 조합 공식 C(n, k)
 */
function combination(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  k = Math.min(k, n - k);
  let result = 1;
  for (let i = 0; i < k; i++) {
    result *= n - i;
    result /= i + 1;
  }
  return Math.round(result);
}

/**
 * 로또 번호 카테고리
 */
const LOTTO_NUMBERS = Array.from({ length: 45 }, (_, i) => i + 1);
const ODD_NUMBERS = LOTTO_NUMBERS.filter((n) => n % 2 === 1); // 22개
const EVEN_NUMBERS = LOTTO_NUMBERS.filter((n) => n % 2 === 0); // 23개
const LOW_NUMBERS = LOTTO_NUMBERS.filter((n) => n <= 22); // 22개
const HIGH_NUMBERS = LOTTO_NUMBERS.filter((n) => n > 22); // 23개

export interface Step1Result {
  total: number;
  percentage: number;
  availableNumbers: number[];
  fixedNumbers: number[];
  remainingToSelect: number;
}

export interface Step2Filters {
  sumRange: [number, number];
  oddEvenRatios: string[];
  highLowRatios: string[];
  acRange: [number, number];
}

export interface Step2Result {
  total: number;
  percentage: number;
  ratioFromStep1: number;
}

export class EliminationCounter {
  /**
   * Step 1: 고정수/제외수 기반 소거
   * 정확한 조합 수 계산: C(가용 번호 수, 선택할 개수)
   */
  calculateStep1(
    fixedNumbers: number[],
    excludedNumbers: number[],
  ): Step1Result {
    const fixedSet = new Set(fixedNumbers);
    const excludedSet = new Set(excludedNumbers);

    // 가용 번호: 전체 45개 - 고정수 - 제외수
    const availableNumbers = LOTTO_NUMBERS.filter(
      (n) => !fixedSet.has(n) && !excludedSet.has(n),
    );

    // 선택할 개수: 6 - 고정수 개수
    const remainingToSelect = 6 - fixedNumbers.length;

    // 조합 수: C(가용 번호 수, 선택할 개수)
    const total = combination(availableNumbers.length, remainingToSelect);
    const percentage = (total / TOTAL_COMBINATIONS) * 100;

    return {
      total,
      percentage,
      availableNumbers,
      fixedNumbers,
      remainingToSelect,
    };
  }

  /**
   * Step 2: 기본 수치 패턴 기반 소거 (전수 검사)
   * 모든 조합을 검사하여 정확한 값 계산
   */
  calculateStep2(step1Result: Step1Result, filters: Step2Filters): Step2Result {
    if (step1Result.total <= 0) {
      return { total: 0, percentage: 0, ratioFromStep1: 0 };
    }

    // 전수 검사: 모든 조합을 생성하고 필터 적용
    const passCount = this.exhaustiveCount(step1Result, filters);
    const passRate = passCount / step1Result.total;
    const percentage = (passCount / TOTAL_COMBINATIONS) * 100;

    return {
      total: passCount,
      percentage,
      ratioFromStep1: passRate,
    };
  }

  /**
   * 전수 검사: 모든 조합을 생성하고 필터 통과 개수 계산
   */
  private exhaustiveCount(
    step1Result: Step1Result,
    filters: Step2Filters,
  ): number {
    const { fixedNumbers, availableNumbers, remainingToSelect } = step1Result;

    if (remainingToSelect <= 0) {
      // 고정수만으로 6개가 완성된 경우
      return this.passesFilters(fixedNumbers, filters) ? 1 : 0;
    }

    let passCount = 0;

    // 모든 조합 생성 (반복적 조합 생성 - 스택 오버플로우 방지)
    const n = availableNumbers.length;
    const k = remainingToSelect;

    // 인덱스 배열 초기화 [0, 1, 2, ..., k-1]
    const indices: number[] = Array.from({ length: k }, (_, i) => i);

    while (true) {
      // 현재 조합 검사
      const current = indices.map((i) => availableNumbers[i]);
      const fullCombination = [...fixedNumbers, ...current].sort(
        (a, b) => a - b,
      );

      if (this.passesFilters(fullCombination, filters)) {
        passCount++;
      }

      // 다음 조합으로 이동
      let i = k - 1;
      while (i >= 0 && indices[i] === n - k + i) {
        i--;
      }

      if (i < 0) break; // 모든 조합 완료

      indices[i]++;
      for (let j = i + 1; j < k; j++) {
        indices[j] = indices[j - 1] + 1;
      }
    }

    return passCount;
  }

  /**
   * 랜덤 조합 생성 (고정수 포함)
   */
  private generateRandomCombination(
    fixedNumbers: number[],
    availableNumbers: number[],
    countToSelect: number,
  ): number[] {
    const selected = [...fixedNumbers];
    const available = [...availableNumbers];

    // Fisher-Yates 셔플 후 앞에서 countToSelect개 선택
    for (let i = available.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [available[i], available[j]] = [available[j], available[i]];
    }

    selected.push(...available.slice(0, countToSelect));
    return selected.sort((a, b) => a - b);
  }

  /**
   * 필터 통과 여부 확인
   */
  private passesFilters(numbers: number[], filters: Step2Filters): boolean {
    // 1. 총합 범위 체크
    const sum = numbers.reduce((a, b) => a + b, 0);
    if (sum < filters.sumRange[0] || sum > filters.sumRange[1]) {
      return false;
    }

    // 2. 홀짝 비율 체크
    if (filters.oddEvenRatios.length > 0) {
      const oddCount = numbers.filter((n) => n % 2 === 1).length;
      const evenCount = 6 - oddCount;
      const ratio = `${oddCount}:${evenCount}`;
      if (!filters.oddEvenRatios.includes(ratio)) {
        return false;
      }
    }

    // 3. 고저 비율 체크
    if (filters.highLowRatios.length > 0) {
      const highCount = numbers.filter((n) => n > 22).length;
      const lowCount = 6 - highCount;
      const ratio = `${highCount}:${lowCount}`;
      if (!filters.highLowRatios.includes(ratio)) {
        return false;
      }
    }

    // 4. AC값 체크
    const ac = this.calculateAC(numbers);
    if (ac < filters.acRange[0] || ac > filters.acRange[1]) {
      return false;
    }

    return true;
  }

  /**
   * AC값 계산 (Arithmetic Complexity)
   */
  private calculateAC(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const differences = new Set<number>();

    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        differences.add(sorted[j] - sorted[i]);
      }
    }

    return differences.size - 5;
  }

  /**
   * Step 2 필터가 전체 범위인지 확인 (기본값 = 필터 없음)
   */
  isStep2DefaultFilters(
    filters: Step2Filters,
    constraints: {
      sumRange: [number, number];
      acRange: [number, number];
      oddEvenRatios: string[];
      highLowRatios: string[];
    },
  ): boolean {
    // 총합 범위가 전체 가능 범위인지
    const sumIsDefault =
      filters.sumRange[0] <= constraints.sumRange[0] &&
      filters.sumRange[1] >= constraints.sumRange[1];

    // AC값 범위가 전체 가능 범위인지
    const acIsDefault =
      filters.acRange[0] <= constraints.acRange[0] &&
      filters.acRange[1] >= constraints.acRange[1];

    // 홀짝 비율이 모든 가능 옵션 선택인지
    const oddEvenIsDefault =
      filters.oddEvenRatios.length >= constraints.oddEvenRatios.length &&
      constraints.oddEvenRatios.every((r) => filters.oddEvenRatios.includes(r));

    // 고저 비율이 모든 가능 옵션 선택인지
    const highLowIsDefault =
      filters.highLowRatios.length >= constraints.highLowRatios.length &&
      constraints.highLowRatios.every((r) => filters.highLowRatios.includes(r));

    return sumIsDefault && acIsDefault && oddEvenIsDefault && highLowIsDefault;
  }
}
