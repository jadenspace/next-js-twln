/**
 * 소거법 기반 조합 수 계산 API
 * POST /api/lotto/calculate-combinations
 */

import { NextRequest, NextResponse } from "next/server";

const TOTAL_COMBINATIONS = 8145060;

interface CalculateRequest {
  fixedNumbers: number[];
  excludedNumbers: number[];
  filters?: {
    sumRange: [number, number];
    oddEvenRatios: string[];
    highLowRatios: string[];
    acRange: [number, number];
  };
}

interface CalculateResponse {
  step1: {
    total: number;
    percentage: number;
  };
  step2?: {
    total: number;
    percentage: number;
    ratioFromStep1: number;
  };
}

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
 * AC값 계산
 */
function calculateAC(numbers: number[]): number {
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
 * 필터 통과 여부 확인
 */
function passesFilters(
  numbers: number[],
  filters: NonNullable<CalculateRequest["filters"]>,
): boolean {
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
  const ac = calculateAC(numbers);
  if (ac < filters.acRange[0] || ac > filters.acRange[1]) {
    return false;
  }

  return true;
}

/**
 * 전수 검사
 */
function exhaustiveCount(
  fixedNumbers: number[],
  availableNumbers: number[],
  remainingToSelect: number,
  filters: NonNullable<CalculateRequest["filters"]>,
): number {
  if (remainingToSelect <= 0) {
    return passesFilters(fixedNumbers, filters) ? 1 : 0;
  }

  let passCount = 0;
  const n = availableNumbers.length;
  const k = remainingToSelect;

  // 인덱스 배열 초기화
  const indices: number[] = Array.from({ length: k }, (_, i) => i);

  while (true) {
    // 현재 조합 검사
    const current = indices.map((i) => availableNumbers[i]);
    const fullCombination = [...fixedNumbers, ...current].sort((a, b) => a - b);

    if (passesFilters(fullCombination, filters)) {
      passCount++;
    }

    // 다음 조합으로 이동
    let i = k - 1;
    while (i >= 0 && indices[i] === n - k + i) {
      i--;
    }

    if (i < 0) break;

    indices[i]++;
    for (let j = i + 1; j < k; j++) {
      indices[j] = indices[j - 1] + 1;
    }
  }

  return passCount;
}

export async function POST(request: NextRequest) {
  try {
    const body: CalculateRequest = await request.json();
    const { fixedNumbers, excludedNumbers, filters } = body;

    const LOTTO_NUMBERS = Array.from({ length: 45 }, (_, i) => i + 1);
    const fixedSet = new Set(fixedNumbers);
    const excludedSet = new Set(excludedNumbers);

    // 가용 번호 계산
    const availableNumbers = LOTTO_NUMBERS.filter(
      (n) => !fixedSet.has(n) && !excludedSet.has(n),
    );

    const remainingToSelect = 6 - fixedNumbers.length;

    // Step 1: 고정수/제외수 기반 조합 수
    const step1Total = combination(availableNumbers.length, remainingToSelect);
    const step1Percentage = (step1Total / TOTAL_COMBINATIONS) * 100;

    const response: CalculateResponse = {
      step1: {
        total: step1Total,
        percentage: step1Percentage,
      },
    };

    // Step 2: 필터가 있으면 전수 검사
    if (filters) {
      const step2Total = exhaustiveCount(
        fixedNumbers,
        availableNumbers,
        remainingToSelect,
        filters,
      );

      response.step2 = {
        total: step2Total,
        percentage: (step2Total / TOTAL_COMBINATIONS) * 100,
        ratioFromStep1: step1Total > 0 ? step2Total / step1Total : 0,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Calculate combinations error:", error);
    return NextResponse.json(
      { error: "Failed to calculate combinations" },
      { status: 500 },
    );
  }
}
