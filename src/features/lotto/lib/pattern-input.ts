import type {
  ConsecutivePattern,
  PatternFilterState,
} from "../types/pattern-filter.types";

/**
 * 패턴 필터 요청 본문 검증.
 *
 * 패턴 조합 생성(/api/lotto/generate-pattern)과 조합 수 계산
 * (/api/lotto/calculate-combinations)이 같은 필터 구조를 받는다. 이전에는
 * 생성 라우트만 검증하고 계산 라우트는 본문을 그대로 신뢰해 범위 밖 번호나
 * 배열이 아닌 값으로 500 을 냈다. 두 라우트가 이 모듈 하나를 쓴다.
 */

export const CONSECUTIVE_PATTERNS: readonly ConsecutivePattern[] = [
  "any",
  "none",
  "2-pair-1",
  "2-pair-2",
  "3-run-1",
  "4-run-1",
];

export function isConsecutivePattern(
  value: unknown,
): value is ConsecutivePattern {
  return (
    typeof value === "string" &&
    (CONSECUTIVE_PATTERNS as readonly string[]).includes(value)
  );
}

/** 1~45 정수 목록. 없으면 빈 배열, 형식이 틀리면 null. 중복은 제거한다. */
export function parseNumbers(
  value: unknown,
  maxLength: number,
): number[] | null {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > maxLength) return null;

  const unique = new Set<number>();
  for (const entry of value) {
    if (!Number.isInteger(entry) || entry < 1 || entry > 45) return null;
    unique.add(entry as number);
  }

  return [...unique];
}

/** [low, high] 정수 쌍. min/max 를 벗어나거나 low > high 면 null. */
export function parseRange(
  value: unknown,
  min: number,
  max: number,
): [number, number] | null {
  if (!Array.isArray(value) || value.length !== 2) return null;

  const [low, high] = value;
  if (!Number.isInteger(low) || !Number.isInteger(high)) return null;
  if (low < min || high > max || low > high) return null;

  return [low as number, high as number];
}

/** 문자열 배열. 없으면 빈 배열. */
export function parseStrings(value: unknown): string[] | null {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) return null;
  if (value.some((entry) => typeof entry !== "string")) return null;

  return value as string[];
}

/** 0~6 정수. 없으면 0. */
export function parseCount(value: unknown): number | null {
  if (value === undefined || value === null) return 0;
  if (!Number.isInteger(value)) return null;
  if ((value as number) < 0 || (value as number) > 6) return null;

  return value as number;
}

/** 패턴 조합 생성용 전체 필터. */
export function parsePatternFilters(value: unknown): PatternFilterState | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;

  const fixedNumbers = parseNumbers(raw.fixedNumbers, 6);
  const excludedNumbers = parseNumbers(raw.excludedNumbers, 39);
  if (!fixedNumbers || !excludedNumbers) return null;

  // 고정수와 제외수가 겹치면 어떤 조합도 만들 수 없다.
  if (fixedNumbers.some((n) => excludedNumbers.includes(n))) return null;

  const sumRange = parseRange(raw.sumRange, 21, 255);
  const acRange = parseRange(raw.acRange, 0, 10);
  const primeCount = parseRange(raw.primeCount, 0, 6);
  const compositeCount = parseRange(raw.compositeCount, 0, 6);
  const multiplesOf3 = parseRange(raw.multiplesOf3, 0, 6);
  const multiplesOf5 = parseRange(raw.multiplesOf5, 0, 6);
  const squareCount = parseRange(raw.squareCount, 0, 6);

  if (
    !sumRange ||
    !acRange ||
    !primeCount ||
    !compositeCount ||
    !multiplesOf3 ||
    !multiplesOf5 ||
    !squareCount
  ) {
    return null;
  }

  const oddEvenRatios = parseStrings(raw.oddEvenRatios);
  const highLowRatios = parseStrings(raw.highLowRatios);
  if (!oddEvenRatios || !highLowRatios) return null;

  const sameEndDigit = parseCount(raw.sameEndDigit);
  const sameSection = parseCount(raw.sameSection);
  if (sameEndDigit === null || sameSection === null) return null;

  // 오타 등 허용되지 않은 값은 거절한다. 이전에는 그대로 캐스팅해 필터가
  // 조용히 꺼진 채 과금됐다.
  const consecutivePattern =
    raw.consecutivePattern === undefined || raw.consecutivePattern === null
      ? "any"
      : raw.consecutivePattern;
  if (!isConsecutivePattern(consecutivePattern)) return null;

  return {
    sumRange,
    oddEvenRatios,
    highLowRatios,
    acRange,
    consecutivePattern,
    sameEndDigit,
    sameSection,
    primeCount,
    compositeCount,
    multiplesOf3,
    multiplesOf5,
    squareCount,
    fixedNumbers,
    excludedNumbers,
  };
}

/** 조합 수 계산용 필터(생성 필터의 부분집합). */
export interface CombinationFilters {
  sumRange: [number, number];
  acRange: [number, number];
  oddEvenRatios: string[];
  highLowRatios: string[];
  consecutivePattern?: ConsecutivePattern;
  sameEndDigit?: number;
  sameSection?: number;
}

export interface CombinationRequest {
  fixedNumbers: number[];
  excludedNumbers: number[];
  filters: CombinationFilters | null;
}

export function parseCombinationRequest(
  value: unknown,
): CombinationRequest | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;

  const fixedNumbers = parseNumbers(raw.fixedNumbers, 6);
  const excludedNumbers = parseNumbers(raw.excludedNumbers, 39);
  if (!fixedNumbers || !excludedNumbers) return null;
  if (fixedNumbers.some((n) => excludedNumbers.includes(n))) return null;

  if (raw.filters === undefined || raw.filters === null) {
    return { fixedNumbers, excludedNumbers, filters: null };
  }

  const filters = parseCombinationFilters(raw.filters);
  if (!filters) return null;

  return { fixedNumbers, excludedNumbers, filters };
}

function parseCombinationFilters(value: unknown): CombinationFilters | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;

  const sumRange = parseRange(raw.sumRange, 21, 255);
  const acRange = parseRange(raw.acRange, 0, 10);
  const oddEvenRatios = parseStrings(raw.oddEvenRatios);
  const highLowRatios = parseStrings(raw.highLowRatios);
  if (!sumRange || !acRange || !oddEvenRatios || !highLowRatios) return null;

  const filters: CombinationFilters = {
    sumRange,
    acRange,
    oddEvenRatios,
    highLowRatios,
  };

  if (raw.consecutivePattern !== undefined) {
    if (!isConsecutivePattern(raw.consecutivePattern)) return null;
    filters.consecutivePattern = raw.consecutivePattern;
  }

  if (raw.sameEndDigit !== undefined) {
    const parsed = parseCount(raw.sameEndDigit);
    if (parsed === null) return null;
    filters.sameEndDigit = parsed;
  }

  if (raw.sameSection !== undefined) {
    const parsed = parseCount(raw.sameSection);
    if (parsed === null) return null;
    filters.sameSection = parsed;
  }

  return filters;
}
