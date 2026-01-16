/**
 * 정확한 조합 수 계산 서비스
 * 샘플링 대신 수학적 공식으로 조합 수를 정확하게 계산
 */

import { PatternFilterState } from "../types/pattern-filter.types";
import { DPCombinationCounter } from "./dp-combination-counter";

/**
 * 조합 공식 C(n, k) = n! / (k! * (n-k)!)
 * 오버플로우 방지를 위해 최적화된 계산
 */
export function combination(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;

  // C(n, k) = C(n, n-k)이므로 작은 값 사용
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
const LOTTO_CATEGORIES = {
  // 홀수: 1, 3, 5, ..., 43, 45 (22개)
  oddNumbers: Array.from({ length: 23 }, (_, i) => i * 2 + 1).filter(
    (n) => n <= 45,
  ),
  // 짝수: 2, 4, 6, ..., 42, 44 (23개)
  evenNumbers: Array.from({ length: 23 }, (_, i) => i * 2).filter(
    (n) => n > 0 && n <= 45,
  ),
  // 저번호: 1-22 (22개)
  lowNumbers: Array.from({ length: 22 }, (_, i) => i + 1),
  // 고번호: 23-45 (23개)
  highNumbers: Array.from({ length: 23 }, (_, i) => i + 23),
};

// 검증
console.assert(LOTTO_CATEGORIES.oddNumbers.length === 22, "홀수 개수 오류");
console.assert(LOTTO_CATEGORIES.evenNumbers.length === 23, "짝수 개수 오류");
console.assert(LOTTO_CATEGORIES.lowNumbers.length === 22, "저번호 개수 오류");
console.assert(LOTTO_CATEGORIES.highNumbers.length === 23, "고번호 개수 오류");

/**
 * 정확한 조합 수 계산 클래스
 */
export class ExactCombinationCounter {
  private dpCounter: DPCombinationCounter;

  constructor() {
    this.dpCounter = new DPCombinationCounter();
  }
  /**
   * 홀짝 비율에 따른 정확한 조합 수 계산
   * @param oddCount 홀수 개수 (0-6)
   * @returns 정확한 조합 수
   */
  countOddEvenCombinations(oddCount: number): number {
    if (oddCount < 0 || oddCount > 6) return 0;

    const evenCount = 6 - oddCount;

    // 홀수 22개 중 oddCount개, 짝수 23개 중 evenCount개
    return combination(22, oddCount) * combination(23, evenCount);
  }

  /**
   * 고저 비율에 따른 정확한 조합 수 계산
   * @param lowCount 저번호 개수 (0-6)
   * @returns 정확한 조합 수
   */
  countHighLowCombinations(lowCount: number): number {
    if (lowCount < 0 || lowCount > 6) return 0;

    const highCount = 6 - lowCount;

    // 저번호(1-22) 22개 중 lowCount개, 고번호(23-45) 23개 중 highCount개
    return combination(22, lowCount) * combination(23, highCount);
  }

  /**
   * 고정 번호가 있을 때 조합 수 계산
   * @param fixedNumbers 고정된 번호 배열
   * @returns 정확한 조합 수
   */
  countWithFixedNumbers(fixedNumbers: number[]): number {
    const fixedCount = fixedNumbers.length;

    if (fixedCount > 6) return 0;
    if (fixedCount === 6) return 1;

    // 나머지 (45 - fixedCount)개 중 (6 - fixedCount)개 선택
    return combination(45 - fixedCount, 6 - fixedCount);
  }

  /**
   * 홀짝 + 고저 비율 동시 적용 조합 수 계산 (교집합)
   * @param oddCount 홀수 개수
   * @param lowCount 저번호 개수
   * @returns 정확한 조합 수
   */
  countOddEvenAndHighLow(oddCount: number, lowCount: number): number {
    if (oddCount < 0 || oddCount > 6) return 0;
    if (lowCount < 0 || lowCount > 6) return 0;

    const evenCount = 6 - oddCount;
    const highCount = 6 - lowCount;

    // 4개 그룹으로 나눔:
    // 1. 홀수 & 저번호 (1-22 중 홀수): 1,3,5,...,21 (11개)
    // 2. 홀수 & 고번호 (23-45 중 홀수): 23,25,...,45 (11개)
    // 3. 짝수 & 저번호 (1-22 중 짝수): 2,4,6,...,22 (11개)
    // 4. 짝수 & 고번호 (23-45 중 짝수): 24,26,...,44 (12개)

    const oddLowCount = 11; // 1,3,5,...,21
    const oddHighCount = 11; // 23,25,...,45
    const evenLowCount = 11; // 2,4,6,...,22
    const evenHighCount = 12; // 24,26,...,44

    let totalCount = 0;

    // 각 그룹에서 몇 개씩 선택할지 모든 경우의 수 합산
    // a = oddLow, b = oddHigh, c = evenLow, d = evenHigh
    // 조건: a + b + c + d = 6
    //      a + b = oddCount
    //      a + c = lowCount

    for (let a = 0; a <= Math.min(oddLowCount, oddCount, lowCount); a++) {
      const b = oddCount - a; // oddHigh
      const c = lowCount - a; // evenLow
      const d = evenCount - c; // evenHigh

      // 유효성 검사
      if (b < 0 || b > oddHighCount) continue;
      if (c < 0 || c > evenLowCount) continue;
      if (d < 0 || d > evenHighCount) continue;
      if (a + b + c + d !== 6) continue;

      // 각 그룹에서 선택하는 조합 수를 곱함
      const count =
        combination(oddLowCount, a) *
        combination(oddHighCount, b) *
        combination(evenLowCount, c) *
        combination(evenHighCount, d);

      totalCount += count;
    }

    return totalCount;
  }

  /**
   * 홀짝 + 고저 + 고정수 모두 적용된 조합 수 계산
   * @param oddCount 홀수 개수
   * @param lowCount 저번호 개수
   * @param fixedNumbers 고정된 번호 배열
   * @returns 정확한 조합 수
   */
  countWithAllBasicFilters(
    oddCount: number,
    lowCount: number,
    fixedNumbers: number[],
  ): number {
    const fixedCount = fixedNumbers.length;

    if (fixedCount > 6) return 0;
    if (oddCount < 0 || oddCount > 6) return 0;
    if (lowCount < 0 || lowCount > 6) return 0;

    // 고정 번호 분석
    const fixedOddCount = fixedNumbers.filter((n) => n % 2 === 1).length;
    const fixedEvenCount = fixedCount - fixedOddCount;
    const fixedLowCount = fixedNumbers.filter((n) => n <= 22).length;
    const fixedHighCount = fixedCount - fixedLowCount;

    // 남은 선택 개수
    const remainingOddCount = oddCount - fixedOddCount;
    const remainingEvenCount = 6 - oddCount - fixedEvenCount;
    const remainingLowCount = lowCount - fixedLowCount;
    const remainingHighCount = 6 - lowCount - fixedHighCount;

    // 유효성 검사
    if (remainingOddCount < 0 || remainingEvenCount < 0) return 0;
    if (remainingLowCount < 0 || remainingHighCount < 0) return 0;
    if (remainingOddCount + remainingEvenCount !== 6 - fixedCount) return 0;
    if (remainingLowCount + remainingHighCount !== 6 - fixedCount) return 0;

    // 고정 번호를 제외한 가용 번호 계산
    const fixedSet = new Set(fixedNumbers);

    // 각 그룹의 가용 번호 개수
    const availableOddLow = LOTTO_CATEGORIES.oddNumbers.filter(
      (n) => n <= 22 && !fixedSet.has(n),
    ).length;
    const availableOddHigh = LOTTO_CATEGORIES.oddNumbers.filter(
      (n) => n > 22 && !fixedSet.has(n),
    ).length;
    const availableEvenLow = LOTTO_CATEGORIES.evenNumbers.filter(
      (n) => n <= 22 && !fixedSet.has(n),
    ).length;
    const availableEvenHigh = LOTTO_CATEGORIES.evenNumbers.filter(
      (n) => n > 22 && !fixedSet.has(n),
    ).length;

    let totalCount = 0;

    // 각 그룹에서 몇 개씩 선택할지 모든 경우의 수 합산
    for (
      let a = 0;
      a <= Math.min(availableOddLow, remainingOddCount, remainingLowCount);
      a++
    ) {
      const b = remainingOddCount - a; // oddHigh
      const c = remainingLowCount - a; // evenLow
      const d = remainingEvenCount - c; // evenHigh

      // 유효성 검사
      if (b < 0 || b > availableOddHigh) continue;
      if (c < 0 || c > availableEvenLow) continue;
      if (d < 0 || d > availableEvenHigh) continue;
      if (a + b + c + d !== 6 - fixedCount) continue;

      // 각 그룹에서 선택하는 조합 수를 곱함
      const count =
        combination(availableOddLow, a) *
        combination(availableOddHigh, b) *
        combination(availableEvenLow, c) *
        combination(availableEvenHigh, d);

      totalCount += count;
    }

    return totalCount;
  }

  /**
   * 수학 필터 조합 수 계산
   * @param filters 필터 상태
   * @returns 정확한 조합 수, 계산 불가능하면 null
   */
  countMathFilters(filters: PatternFilterState): number | null {
    const { primeCount, multiplesOf3, multiplesOf5, fixedNumbers } = filters;

    // 모든 수학 필터가 비활성화된 경우
    const isPrimeDisabled = primeCount[0] <= 0 && primeCount[1] >= 6;
    const isMult3Disabled = multiplesOf3[0] <= 0 && multiplesOf3[1] >= 6;
    const isMult5Disabled = multiplesOf5[0] <= 0 && multiplesOf5[1] >= 6;

    if (isPrimeDisabled && isMult3Disabled && isMult5Disabled) {
      return null; // 모두 비활성화, 계산 불필요
    }

    // 단일 필터만 활성화된 경우
    if (!isPrimeDisabled && isMult3Disabled && isMult5Disabled) {
      // 소수만
      return this.dpCounter.countPrimeCombinations(
        primeCount[0],
        primeCount[1],
        fixedNumbers,
      );
    }

    if (isPrimeDisabled && !isMult3Disabled && isMult5Disabled) {
      // 3의 배수만
      return this.dpCounter.countMultiplesOf3Combinations(
        multiplesOf3[0],
        multiplesOf3[1],
        fixedNumbers,
      );
    }

    if (isPrimeDisabled && isMult3Disabled && !isMult5Disabled) {
      // 5의 배수만
      return this.dpCounter.countMultiplesOf5Combinations(
        multiplesOf5[0],
        multiplesOf5[1],
        fixedNumbers,
      );
    }

    // 소수 + 3의 배수 (상관관계 있음 - 3이 소수이자 3의 배수)
    if (!isPrimeDisabled && !isMult3Disabled && isMult5Disabled) {
      return this.dpCounter.countPrimeAndMult3Combinations(
        primeCount,
        multiplesOf3,
        fixedNumbers,
      );
    }

    // 그 외 복잡한 조합은 계산 불가 (샘플링 사용)
    return null;
  }

  /**
   * 번호 총합 범위 조합 수 계산
   * @param filters 필터 상태
   * @returns 정확한 조합 수, 계산 불가능하면 null
   */
  countSumRangeFilter(filters: PatternFilterState): number | null {
    const { sumRange, fixedNumbers } = filters;

    // 총합 범위가 전체 범위인 경우 (비활성화)
    const minPossible = 21; // 1+2+3+4+5+6
    const maxPossible = 255; // 40+41+42+43+44+45

    if (sumRange[0] <= minPossible && sumRange[1] >= maxPossible) {
      return null; // 전체 범위, 계산 불필요
    }

    // DP로 정확한 조합 수 계산
    return this.dpCounter.countSumRangeCombinations(
      sumRange[0],
      sumRange[1],
      fixedNumbers,
    );
  }

  /**
   * AC값 범위 조합 수 계산
   * @param filters 필터 상태
   * @returns 정확한 조합 수, 계산 불가능하면 null
   */
  countACRangeFilter(filters: PatternFilterState): number | null {
    const { acRange, fixedNumbers } = filters;

    // AC값 범위가 전체 범위인 경우 (비활성화)
    const minPossible = 0; // 1,2,3,4,5,6 => 6-1-5=0
    const maxPossible = 39; // 1,6,12,18,24,45 같은 극단적 경우

    if (acRange[0] <= minPossible && acRange[1] >= maxPossible) {
      return null; // 전체 범위, 계산 불필요
    }

    // DP로 정확한 조합 수 계산
    return this.dpCounter.countACRangeCombinations(
      acRange[0],
      acRange[1],
      fixedNumbers,
    );
  }

  /**
   * 기본 필터 조합 수 계산 (통합 인터페이스)
   * @param filters 필터 상태
   * @returns 정확한 조합 수, 계산 불가능하면 null
   */
  countBasicFilters(filters: PatternFilterState): number | null {
    // 홀짝 비율 파싱
    const oddCounts = this.parseOddEvenRatios(filters.oddEvenRatios);

    // 고저 비율 파싱
    const lowCounts = this.parseHighLowRatios(filters.highLowRatios);

    // 고정 번호
    const fixedNumbers = filters.fixedNumbers;

    // 홀짝과 고저 비율이 모두 여러 개면 복잡하므로 계산 불가
    if (oddCounts.length > 1 && lowCounts.length > 1) {
      return null; // 너무 복잡, 샘플링 사용
    }

    // 고정 번호만 있는 경우
    if (oddCounts.length === 0 && lowCounts.length === 0) {
      return this.countWithFixedNumbers(fixedNumbers);
    }

    let totalCount = 0;

    // 모든 조합을 합산
    for (const oddCount of oddCounts.length > 0 ? oddCounts : [null]) {
      for (const lowCount of lowCounts.length > 0 ? lowCounts : [null]) {
        let count: number;

        if (oddCount !== null && lowCount !== null) {
          // 홀짝 + 고저 + 고정수
          count = this.countWithAllBasicFilters(
            oddCount,
            lowCount,
            fixedNumbers,
          );
        } else if (oddCount !== null) {
          // 홀짝 + 고정수
          count = this.countOddEvenWithFixed(oddCount, fixedNumbers);
        } else if (lowCount !== null) {
          // 고저 + 고정수
          count = this.countHighLowWithFixed(lowCount, fixedNumbers);
        } else {
          // 고정수만
          count = this.countWithFixedNumbers(fixedNumbers);
        }

        totalCount += count;
      }
    }

    return totalCount;
  }

  /**
   * 홀짝 비율 문자열 배열을 홀수 개수 배열로 변환
   */
  private parseOddEvenRatios(ratios: string[]): number[] {
    return ratios.map((ratio) => {
      const [odd] = ratio.split(":").map(Number);
      return odd;
    });
  }

  /**
   * 고저 비율 문자열 배열을 저번호 개수 배열로 변환
   */
  private parseHighLowRatios(ratios: string[]): number[] {
    return ratios.map((ratio) => {
      const [low] = ratio.split(":").map(Number);
      return low;
    });
  }

  /**
   * 홀짝 비율 + 고정수 조합 수 계산
   */
  private countOddEvenWithFixed(
    oddCount: number,
    fixedNumbers: number[],
  ): number {
    const fixedCount = fixedNumbers.length;
    const fixedOddCount = fixedNumbers.filter((n) => n % 2 === 1).length;
    const fixedEvenCount = fixedCount - fixedOddCount;

    const remainingOddCount = oddCount - fixedOddCount;
    const remainingEvenCount = 6 - oddCount - fixedEvenCount;

    if (remainingOddCount < 0 || remainingEvenCount < 0) return 0;

    // 고정 번호 제외한 가용 홀수/짝수 개수
    const fixedSet = new Set(fixedNumbers);
    const availableOdd = LOTTO_CATEGORIES.oddNumbers.filter(
      (n) => !fixedSet.has(n),
    ).length;
    const availableEven = LOTTO_CATEGORIES.evenNumbers.filter(
      (n) => !fixedSet.has(n),
    ).length;

    return (
      combination(availableOdd, remainingOddCount) *
      combination(availableEven, remainingEvenCount)
    );
  }

  /**
   * 고저 비율 + 고정수 조합 수 계산
   */
  private countHighLowWithFixed(
    lowCount: number,
    fixedNumbers: number[],
  ): number {
    const fixedCount = fixedNumbers.length;
    const fixedLowCount = fixedNumbers.filter((n) => n <= 22).length;
    const fixedHighCount = fixedCount - fixedLowCount;

    const remainingLowCount = lowCount - fixedLowCount;
    const remainingHighCount = 6 - lowCount - fixedHighCount;

    if (remainingLowCount < 0 || remainingHighCount < 0) return 0;

    // 고정 번호 제외한 가용 저/고번호 개수
    const fixedSet = new Set(fixedNumbers);
    const availableLow = LOTTO_CATEGORIES.lowNumbers.filter(
      (n) => !fixedSet.has(n),
    ).length;
    const availableHigh = LOTTO_CATEGORIES.highNumbers.filter(
      (n) => !fixedSet.has(n),
    ).length;

    return (
      combination(availableLow, remainingLowCount) *
      combination(availableHigh, remainingHighCount)
    );
  }
}
