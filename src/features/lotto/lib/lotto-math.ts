/**
 * 로또 수학 유틸리티 함수
 */

// 1~45 범위의 소수
export const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43];
export const PRIMES_SET = new Set(PRIMES);

// 1~45 범위의 제곱수
export const SQUARES = [1, 4, 9, 16, 25, 36];
export const SQUARES_SET = new Set(SQUARES);

// 3의 배수 (1~45)
export const MULTIPLES_OF_3 = [
  3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45,
];
export const MULTIPLES_OF_3_SET = new Set(MULTIPLES_OF_3);

// 5의 배수 (1~45)
export const MULTIPLES_OF_5 = [5, 10, 15, 20, 25, 30, 35, 40, 45];
export const MULTIPLES_OF_5_SET = new Set(MULTIPLES_OF_5);

// 합성수 (1, 소수가 아닌 2이상의 수)
export const COMPOSITES = [
  4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 22, 24, 25, 26, 27, 28, 30, 32,
  33, 34, 35, 36, 38, 39, 40, 42, 44, 45,
];
export const COMPOSITES_SET = new Set(COMPOSITES);

/**
 * 소수인지 확인
 */
export function isPrime(n: number): boolean {
  return PRIMES_SET.has(n);
}

/**
 * 제곱수인지 확인
 */
export function isSquare(n: number): boolean {
  return SQUARES_SET.has(n);
}

/**
 * 3의 배수인지 확인
 */
export function isMultipleOf3(n: number): boolean {
  return MULTIPLES_OF_3_SET.has(n);
}

/**
 * 5의 배수인지 확인
 */
export function isMultipleOf5(n: number): boolean {
  return MULTIPLES_OF_5_SET.has(n);
}

/**
 * 합성수인지 확인
 */
export function isComposite(n: number): boolean {
  return COMPOSITES_SET.has(n);
}

/**
 * 번호 6개의 총합 계산
 */
export function calculateSum(numbers: number[]): number {
  return numbers.reduce((a, b) => a + b, 0);
}

/**
 * AC값 계산 (분산도)
 * AC = (두 번호 간 차이의 고유 개수) - 5
 * 범위: 0 ~ 10
 */
export function calculateAC(numbers: number[]): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  const diffs = new Set<number>();

  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      diffs.add(sorted[j] - sorted[i]);
    }
  }

  return diffs.size - 5;
}

/**
 * 홀짝 비율 계산 (홀수:짝수)
 */
export function getOddEvenRatio(numbers: number[]): string {
  const oddCount = numbers.filter((n) => n % 2 === 1).length;
  return `${oddCount}:${6 - oddCount}`;
}

/**
 * 고저 비율 계산 (고번호:저번호)
 * 1~22: 저번호, 23~45: 고번호
 */
export function getHighLowRatio(numbers: number[]): string {
  const highCount = numbers.filter((n) => n >= 23).length;
  return `${highCount}:${6 - highCount}`;
}

/**
 * 연속번호 쌍의 개수 계산
 */
export function countConsecutivePairs(numbers: number[]): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  let count = 0;

  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1] === sorted[i] + 1) {
      count++;
    }
  }

  return count;
}

/**
 * 동일 끝수 개수 계산
 * 가장 많이 중복되는 끝자리의 개수 반환
 */
export function countSameEndDigit(numbers: number[]): number {
  const endDigits = numbers.map((n) => n % 10);
  const counts: Record<number, number> = {};

  for (const digit of endDigits) {
    counts[digit] = (counts[digit] || 0) + 1;
  }

  const maxCount = Math.max(...Object.values(counts));
  return maxCount >= 2 ? maxCount : 0;
}

/**
 * 동일 구간 개수 계산
 * 9구간 (1-5, 6-10, ..., 41-45)에서 가장 많이 중복되는 구간의 개수
 */
export function countSameSection(numbers: number[]): number {
  const sections = numbers.map((n) => Math.floor((n - 1) / 5));
  const counts: Record<number, number> = {};

  for (const section of sections) {
    counts[section] = (counts[section] || 0) + 1;
  }

  const maxCount = Math.max(...Object.values(counts));
  return maxCount >= 2 ? maxCount : 0;
}

/**
 * 소수 개수 계산
 */
export function countPrimes(numbers: number[]): number {
  return numbers.filter(isPrime).length;
}

/**
 * 합성수 개수 계산
 */
export function countComposites(numbers: number[]): number {
  return numbers.filter(isComposite).length;
}

/**
 * 3의 배수 개수 계산
 */
export function countMultiplesOf3(numbers: number[]): number {
  return numbers.filter(isMultipleOf3).length;
}

/**
 * 5의 배수 개수 계산
 */
export function countMultiplesOf5(numbers: number[]): number {
  return numbers.filter(isMultipleOf5).length;
}

/**
 * 제곱수 개수 계산
 */
export function countSquares(numbers: number[]): number {
  return numbers.filter(isSquare).length;
}

/**
 * 랜덤 조합 생성 (1~45에서 6개)
 */
export function generateRandomCombination(): number[] {
  const numbers: number[] = [];

  while (numbers.length < 6) {
    const num = Math.floor(Math.random() * 45) + 1;
    if (!numbers.includes(num)) {
      numbers.push(num);
    }
  }

  return numbers.sort((a, b) => a - b);
}

/**
 * 고정수가 포함된 랜덤 조합 생성 (1~45에서 6개)
 */
export function generateRandomCombinationWithFixed(
  fixedNumbers: number[],
): number[] {
  const uniqueFixed = Array.from(new Set(fixedNumbers)).filter(
    (num) => num >= 1 && num <= 45,
  );

  if (uniqueFixed.length > 6) {
    throw new Error("고정수는 최대 6개까지 허용됩니다.");
  }

  const numbers = [...uniqueFixed];

  while (numbers.length < 6) {
    const num = Math.floor(Math.random() * 45) + 1;
    if (!numbers.includes(num)) {
      numbers.push(num);
    }
  }

  return numbers.sort((a, b) => a - b);
}

/**
 * 조합의 모든 패턴 정보 계산
 */
export function calculateAllPatterns(numbers: number[]) {
  return {
    sum: calculateSum(numbers),
    oddEven: getOddEvenRatio(numbers),
    highLow: getHighLowRatio(numbers),
    ac: calculateAC(numbers),
    consecutive: countConsecutivePairs(numbers),
    primeCount: countPrimes(numbers),
    compositeCount: countComposites(numbers),
    multiplesOf3: countMultiplesOf3(numbers),
    multiplesOf5: countMultiplesOf5(numbers),
    squareCount: countSquares(numbers),
    sameEndDigit: countSameEndDigit(numbers),
    sameSection: countSameSection(numbers),
  };
}
