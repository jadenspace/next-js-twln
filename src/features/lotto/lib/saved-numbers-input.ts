import { validateLottoNumbers } from "./validate-lotto-numbers";

/**
 * 저장 번호 요청 본문 검증.
 *
 * 이전 라우트는 `numbers` 가 배열인지만 확인해 `[7,7,7,7,7,7]`, `[]`, 문자열이
 * 섞인 배열, 수천 개의 조합이 그대로 저장됐다. 잘못 저장된 조합은 주간 리포트의
 * 등수 계산까지 오염시킨다(`[7,7,7,7,7,7]` 이 1등으로 집계됨).
 */

export const MAX_SAVED_NUMBERS_PER_REQUEST = 20;
export const MAX_SAVED_NUMBERS_PER_USER = 500;

export const SAVED_NUMBER_SOURCES = [
  "simulation",
  "pattern_generator",
] as const;
export type SavedNumberSource = (typeof SAVED_NUMBER_SOURCES)[number];

export type SavedNumbersInput =
  | {
      ok: true;
      rows: number[][];
      source: SavedNumberSource;
      filters: Record<string, unknown> | null;
    }
  | { ok: false; error: string };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseSavedNumbersInput(body: unknown): SavedNumbersInput {
  if (!isPlainObject(body)) {
    return { ok: false, error: "요청 본문이 올바르지 않습니다." };
  }

  const { numbers, source, filters } = body;

  if (!Array.isArray(numbers)) {
    return { ok: false, error: "numbers must be an array" };
  }

  if (
    typeof source !== "string" ||
    !(SAVED_NUMBER_SOURCES as readonly string[]).includes(source)
  ) {
    return {
      ok: false,
      error: "source must be 'simulation' or 'pattern_generator'",
    };
  }

  // 단일 조합([1,2,3,4,5,6])과 조합 배열([[...],[...]]) 을 모두 받는다.
  const candidates: unknown[] =
    numbers.length > 0 && Array.isArray(numbers[0]) ? numbers : [numbers];

  if (candidates.length > MAX_SAVED_NUMBERS_PER_REQUEST) {
    return {
      ok: false,
      error: `한 번에 최대 ${MAX_SAVED_NUMBERS_PER_REQUEST}개까지 저장할 수 있습니다.`,
    };
  }

  const rows: number[][] = [];
  for (const candidate of candidates) {
    if (!validateLottoNumbers(candidate)) {
      return {
        ok: false,
        error: "각 조합은 1~45 사이의 서로 다른 정수 6개여야 합니다.",
      };
    }
    rows.push([...candidate].sort((a, b) => a - b));
  }

  if (filters !== undefined && filters !== null && !isPlainObject(filters)) {
    return { ok: false, error: "filters must be an object" };
  }

  return {
    ok: true,
    rows,
    source: source as SavedNumberSource,
    filters: filters ?? null,
  };
}
