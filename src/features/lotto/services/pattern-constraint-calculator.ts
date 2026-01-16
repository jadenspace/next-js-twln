/**
 * 패턴 제약 계산 서비스
 * 고정수/제외수 기반으로 가능한 필터 옵션을 계산
 */

import { calculateAC } from "../lib/lotto-math";

// 1~45 범위의 홀수 (23개)
const ODD_NUMBERS = Array.from({ length: 23 }, (_, i) => i * 2 + 1).filter(
  (n) => n <= 45,
);
// 1~45 범위의 짝수 (22개)
const EVEN_NUMBERS = Array.from({ length: 22 }, (_, i) => (i + 1) * 2);

// 1~22: 저번호 (22개), 23~45: 고번호 (23개)
const LOW_NUMBERS = Array.from({ length: 22 }, (_, i) => i + 1);
const HIGH_NUMBERS = Array.from({ length: 23 }, (_, i) => i + 23);

/**
 * 패턴 제약 계산 클래스
 */
export class PatternConstraintCalculator {
  /**
   * 사용 가능한 번호 풀 계산
   * @param fixedNumbers 고정수 배열
   * @param excludedNumbers 제외수 배열
   * @returns 선택 가능한 번호 배열
   */
  getAvailableNumbers(
    fixedNumbers: number[],
    excludedNumbers: number[],
  ): number[] {
    const fixedSet = new Set(fixedNumbers);
    const excludedSet = new Set(excludedNumbers);

    return Array.from({ length: 45 }, (_, i) => i + 1).filter(
      (n) => !fixedSet.has(n) && !excludedSet.has(n),
    );
  }

  /**
   * 가능한 총합 범위 계산
   * @param fixedNumbers 고정수 배열
   * @param excludedNumbers 제외수 배열
   * @returns [최소합, 최대합]
   */
  calculateSumRange(
    fixedNumbers: number[],
    excludedNumbers: number[],
  ): [number, number] {
    const available = this.getAvailableNumbers(fixedNumbers, excludedNumbers);
    const remainingCount = 6 - fixedNumbers.length;

    if (remainingCount < 0 || available.length < remainingCount) {
      return [0, 0]; // 불가능한 조합
    }

    const fixedSum = fixedNumbers.reduce((a, b) => a + b, 0);

    // 최소합: 고정수 + 사용 가능한 가장 작은 번호들
    const sortedAsc = [...available].sort((a, b) => a - b);
    const minSum =
      fixedSum + sortedAsc.slice(0, remainingCount).reduce((a, b) => a + b, 0);

    // 최대합: 고정수 + 사용 가능한 가장 큰 번호들
    const sortedDesc = [...available].sort((a, b) => b - a);
    const maxSum =
      fixedSum + sortedDesc.slice(0, remainingCount).reduce((a, b) => a + b, 0);

    return [minSum, maxSum];
  }

  /**
   * 가능한 홀짝 비율 목록 반환
   * @param fixedNumbers 고정수 배열
   * @param excludedNumbers 제외수 배열
   * @returns 가능한 홀짝 비율 문자열 배열 (예: ["2:4", "3:3", "4:2"])
   */
  getAvailableOddEvenRatios(
    fixedNumbers: number[],
    excludedNumbers: number[],
  ): string[] {
    const available = this.getAvailableNumbers(fixedNumbers, excludedNumbers);
    const remainingCount = 6 - fixedNumbers.length;

    // 고정수 중 홀수/짝수 개수
    const fixedOddCount = fixedNumbers.filter((n) => n % 2 === 1).length;

    // 사용 가능한 홀수/짝수 개수
    const availableOdd = available.filter((n) => n % 2 === 1).length;
    const availableEven = available.filter((n) => n % 2 === 0).length;

    const validRatios: string[] = [];

    // 0:6부터 6:0까지 모든 비율 확인
    for (let oddCount = 0; oddCount <= 6; oddCount++) {
      const evenCount = 6 - oddCount;

      // 필요한 추가 홀수/짝수 개수
      const neededOdd = oddCount - fixedOddCount;
      const neededEven = evenCount - (fixedNumbers.length - fixedOddCount);

      // 조건 충족 여부 확인
      if (
        neededOdd >= 0 &&
        neededEven >= 0 &&
        neededOdd <= availableOdd &&
        neededEven <= availableEven &&
        neededOdd + neededEven === remainingCount
      ) {
        validRatios.push(`${oddCount}:${evenCount}`);
      }
    }

    return validRatios;
  }

  /**
   * 가능한 고저 비율 목록 반환
   * @param fixedNumbers 고정수 배열
   * @param excludedNumbers 제외수 배열
   * @returns 가능한 고저 비율 문자열 배열 (예: ["2:4", "3:3", "4:2"])
   */
  getAvailableHighLowRatios(
    fixedNumbers: number[],
    excludedNumbers: number[],
  ): string[] {
    const available = this.getAvailableNumbers(fixedNumbers, excludedNumbers);
    const remainingCount = 6 - fixedNumbers.length;

    // 고정수 중 고번호/저번호 개수
    const fixedHighCount = fixedNumbers.filter((n) => n >= 23).length;
    const fixedLowCount = fixedNumbers.length - fixedHighCount;

    // 사용 가능한 고번호/저번호 개수
    const availableHigh = available.filter((n) => n >= 23).length;
    const availableLow = available.filter((n) => n < 23).length;

    const validRatios: string[] = [];

    // 0:6부터 6:0까지 모든 비율 확인 (고:저 형식)
    for (let highCount = 0; highCount <= 6; highCount++) {
      const lowCount = 6 - highCount;

      // 필요한 추가 고번호/저번호 개수
      const neededHigh = highCount - fixedHighCount;
      const neededLow = lowCount - fixedLowCount;

      // 조건 충족 여부 확인
      if (
        neededHigh >= 0 &&
        neededLow >= 0 &&
        neededHigh <= availableHigh &&
        neededLow <= availableLow &&
        neededHigh + neededLow === remainingCount
      ) {
        validRatios.push(`${highCount}:${lowCount}`);
      }
    }

    return validRatios;
  }

  /**
   * 가능한 AC값 범위 계산
   * @param fixedNumbers 고정수 배열
   * @param excludedNumbers 제외수 배열
   * @returns [최소AC, 최대AC]
   */
  calculateACRange(
    fixedNumbers: number[],
    excludedNumbers: number[],
  ): [number, number] {
    const available = this.getAvailableNumbers(fixedNumbers, excludedNumbers);
    const remainingCount = 6 - fixedNumbers.length;

    if (remainingCount < 0 || available.length < remainingCount) {
      return [0, 0]; // 불가능한 조합
    }

    // AC값은 정확한 범위 계산이 복잡하므로, 일반적인 범위 제공
    // 고정수가 많을수록 AC값 범위가 좁아짐
    if (fixedNumbers.length === 6) {
      const ac = calculateAC(fixedNumbers);
      return [ac, ac];
    }

    // 일반적인 경우: 0~10 범위 내에서 가능
    // 실제로는 고정수와 사용 가능한 번호에 따라 달라짐
    return [0, 10];
  }

  /**
   * 번호 선택이 유효한지 검증
   * @param fixedNumbers 고정수 배열
   * @param excludedNumbers 제외수 배열
   * @returns 유효성 및 메시지
   */
  validateSelection(
    fixedNumbers: number[],
    excludedNumbers: number[],
  ): { valid: boolean; message?: string } {
    // 중복 체크
    const overlap = fixedNumbers.filter((n) => excludedNumbers.includes(n));
    if (overlap.length > 0) {
      return {
        valid: false,
        message: `고정수와 제외수에 중복된 번호가 있습니다: ${overlap.join(", ")}`,
      };
    }

    // 고정수 개수 체크
    if (fixedNumbers.length > 6) {
      return {
        valid: false,
        message: "고정수는 최대 6개까지 선택할 수 있습니다.",
      };
    }

    // 범위 체크
    const invalidFixed = fixedNumbers.filter((n) => n < 1 || n > 45);
    if (invalidFixed.length > 0) {
      return {
        valid: false,
        message: `유효하지 않은 고정수가 있습니다: ${invalidFixed.join(", ")}`,
      };
    }

    const invalidExcluded = excludedNumbers.filter((n) => n < 1 || n > 45);
    if (invalidExcluded.length > 0) {
      return {
        valid: false,
        message: `유효하지 않은 제외수가 있습니다: ${invalidExcluded.join(", ")}`,
      };
    }

    // 사용 가능한 번호가 충분한지 체크
    const available = this.getAvailableNumbers(fixedNumbers, excludedNumbers);
    const remainingCount = 6 - fixedNumbers.length;

    if (available.length < remainingCount) {
      return {
        valid: false,
        message: `선택 가능한 번호가 부족합니다. 최소 ${remainingCount}개가 필요합니다.`,
      };
    }

    return { valid: true };
  }
}
