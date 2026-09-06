/**
 * 소거법 기반 조합 수 계산 API
 * POST /api/lotto/calculate-combinations
 *
 * 필터가 있으면 남은 번호의 모든 조합을 전수 검사한다(최대 C(45,6)=8,145,060).
 * 이전에는 인증도 입력 검증도 없어 누구나 빈 필터로 반복 호출해 CPU 를
 * 소진시킬 수 있었다. 지금은 로그인 사용자만 호출할 수 있고(패턴 조합 생성기
 * 페이지 자체가 로그인 필수), 본문은 pattern-input 으로 검증하며, 같은 요청은
 * 인스턴스 내 캐시로 재계산을 피한다.
 */

import {
  parseCombinationRequest,
  type CombinationFilters,
} from "@/features/lotto/lib/pattern-input";
import { requireUser } from "@/shared/lib/auth/guards";
import { NextRequest, NextResponse } from "next/server";

const TOTAL_COMBINATIONS = 8145060;
const CACHE_MAX_ENTRIES = 200;

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

// 요청 본문(정규화된 형태) → 결과. Map 은 삽입 순서를 유지하므로 가장 오래된
// 항목부터 밀어낸다.
const resultCache = new Map<string, CalculateResponse>();

function remember(key: string, value: CalculateResponse) {
  if (resultCache.size >= CACHE_MAX_ENTRIES) {
    const oldest = resultCache.keys().next().value;
    if (oldest !== undefined) resultCache.delete(oldest);
  }
  resultCache.set(key, value);
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
  filters: CombinationFilters,
): boolean {
  const sorted = [...numbers].sort((a, b) => a - b);

  // 1. 총합 범위 체크
  const sum = sorted.reduce((a, b) => a + b, 0);
  if (sum < filters.sumRange[0] || sum > filters.sumRange[1]) {
    return false;
  }

  // 2. 홀짝 비율 체크
  if (filters.oddEvenRatios.length > 0) {
    const oddCount = sorted.filter((n) => n % 2 === 1).length;
    const evenCount = 6 - oddCount;
    const ratio = `${oddCount}:${evenCount}`;
    if (!filters.oddEvenRatios.includes(ratio)) {
      return false;
    }
  }

  // 3. 고저 비율 체크
  if (filters.highLowRatios.length > 0) {
    const highCount = sorted.filter((n) => n > 22).length;
    const lowCount = 6 - highCount;
    const ratio = `${highCount}:${lowCount}`;
    if (!filters.highLowRatios.includes(ratio)) {
      return false;
    }
  }

  // 4. AC값 체크
  const ac = calculateAC(sorted);
  if (ac < filters.acRange[0] || ac > filters.acRange[1]) {
    return false;
  }

  // 5. 연속번호 패턴 체크
  if (filters.consecutivePattern === "none") {
    // 연속번호가 없어야 함
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i + 1] - sorted[i] === 1) {
        return false;
      }
    }
  }

  // 6. 동일 끝수 체크
  if (filters.sameEndDigit !== undefined && filters.sameEndDigit > 0) {
    const endDigits: Record<number, number> = {};
    sorted.forEach((n) => {
      const digit = n % 10;
      endDigits[digit] = (endDigits[digit] || 0) + 1;
    });
    const maxSameEndDigit = Math.max(...Object.values(endDigits));
    if (maxSameEndDigit > filters.sameEndDigit) {
      return false;
    }
  }

  // 7. 동일 구간 체크
  // 구간은 5단위 9구간(1-5, 6-10, ..., 41-45)이다. UI 문구와 실제 번호 생성
  // (features/lotto/lib/lotto-math.ts countSameSection)이 모두 5단위를 쓰는데
  // 여기만 10단위로 세고 있어서, 화면에 표시되는 조합 수가 실제보다 적게
  // 나오고 생성 결과의 구간 표기와도 어긋났다.
  if (filters.sameSection !== undefined && filters.sameSection > 0) {
    const sections: Record<number, number> = {};
    sorted.forEach((n) => {
      const section = Math.floor((n - 1) / 5);
      sections[section] = (sections[section] || 0) + 1;
    });
    const maxSameSection = Math.max(...Object.values(sections));
    if (maxSameSection > filters.sameSection) {
      return false;
    }
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
  filters: CombinationFilters,
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
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  const parsed = parseCombinationRequest(
    await request.json().catch(() => null),
  );
  if (!parsed) {
    return NextResponse.json(
      { error: "입력이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const cacheKey = JSON.stringify(parsed);
  const cached = resultCache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const { fixedNumbers, excludedNumbers, filters } = parsed;

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

    remember(cacheKey, response);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Calculate combinations error:", error);
    return NextResponse.json(
      { error: "Failed to calculate combinations" },
      { status: 500 },
    );
  }
}
