/**
 * /api/lotto/search 의 쿼리스트링을 검증·정규화한다.
 *
 * 서버 라우트와 클라이언트가 같은 규칙을 쓰도록 순수 함수로 분리했다.
 * 범위 상한(MAX_RANGE_SIZE)은 비로그인 공개 API가 전체 테이블을 한 번에
 * 내려주는 일을 막기 위한 것이다.
 */

export const MAX_RANGE_SIZE = 300;
export const MAX_SEARCH_NUMBERS = 6;
/**
 * 회차 범위는 MAX_RANGE_SIZE 로 막지만, 날짜 범위나 번호 검색처럼 결과 수를
 * 미리 알 수 없는 조건은 이 상한에서 잘라 내고 truncated 로 알린다.
 */
export const MAX_RESULTS = 500;

const WINNING_NUMBER_COLUMNS = [
  "drwt_no1",
  "drwt_no2",
  "drwt_no3",
  "drwt_no4",
  "drwt_no5",
  "drwt_no6",
] as const;

export interface LottoSearchQuery {
  drwNoStart?: number;
  drwNoEnd?: number;
  dateStart?: string;
  dateEnd?: string;
  /** 정렬된 고유 번호. 비어 있으면 undefined. */
  numbers?: number[];
  includeBonus: boolean;
}

export type ParseResult =
  | { ok: true; value: LottoSearchQuery }
  | { ok: false; error: string };

/** 개별 파라미터 파싱 결과. 값이 없으면 ok 이면서 value 가 undefined 다. */
type Field<T> =
  | { ok: true; value: T | undefined }
  | { ok: false; error: string };

const fail = (error: string): ParseResult => ({ ok: false, error });
const fieldOk = <T>(value: T | undefined): Field<T> => ({ ok: true, value });
const fieldFail = <T>(error: string): Field<T> => ({ ok: false, error });

function parsePositiveInt(raw: string | null, label: string): Field<number> {
  if (raw === null || raw === "") return fieldOk(undefined);
  if (!/^\d+$/.test(raw)) return fieldFail(`${label}는 정수여야 합니다.`);
  const value = Number(raw);
  if (value < 1) return fieldFail(`${label}는 1 이상이어야 합니다.`);
  return fieldOk(value);
}

function parseIsoDate(raw: string | null, label: string): Field<string> {
  if (raw === null || raw === "") return fieldOk(undefined);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return fieldFail(`${label}는 YYYY-MM-DD 형식이어야 합니다.`);
  }
  const [y, m, d] = raw.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const isReal =
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d;
  if (!isReal) return fieldFail(`${label}가 실제 날짜가 아닙니다.`);
  return fieldOk(raw);
}

function parseNumbers(raw: string | null): Field<number[]> {
  if (raw === null || raw.trim() === "") return fieldOk(undefined);
  const parts = raw.split(",").map((p) => p.trim());
  const parsed: number[] = [];
  for (const part of parts) {
    if (!/^\d+$/.test(part)) {
      return fieldFail("번호는 1~45 사이의 정수여야 합니다.");
    }
    const n = Number(part);
    if (n < 1 || n > 45) {
      return fieldFail("번호는 1~45 사이의 정수여야 합니다.");
    }
    parsed.push(n);
  }
  const unique = Array.from(new Set(parsed)).sort((a, b) => a - b);
  if (unique.length > MAX_SEARCH_NUMBERS) {
    return fieldFail(
      `번호는 최대 ${MAX_SEARCH_NUMBERS}개까지 지정할 수 있습니다.`,
    );
  }
  return fieldOk(unique);
}

function parseBoolean(raw: string | null): boolean {
  return raw === "1" || raw === "true";
}

export function parseLottoSearchParams(params: URLSearchParams): ParseResult {
  const start = parsePositiveInt(params.get("drwNoStart"), "시작 회차");
  if (!start.ok) return fail(start.error);
  const end = parsePositiveInt(params.get("drwNoEnd"), "종료 회차");
  if (!end.ok) return fail(end.error);

  let drwNoStart = start.value;
  let drwNoEnd = end.value;
  if (drwNoStart !== undefined && drwNoEnd !== undefined) {
    if (drwNoStart > drwNoEnd) [drwNoStart, drwNoEnd] = [drwNoEnd, drwNoStart];
    if (drwNoEnd - drwNoStart + 1 > MAX_RANGE_SIZE) {
      return fail(
        `회차 범위는 한 번에 최대 ${MAX_RANGE_SIZE}회차까지 조회할 수 있습니다.`,
      );
    }
  }

  const dateStartParsed = parseIsoDate(params.get("dateStart"), "시작 날짜");
  if (!dateStartParsed.ok) return fail(dateStartParsed.error);
  const dateEndParsed = parseIsoDate(params.get("dateEnd"), "종료 날짜");
  if (!dateEndParsed.ok) return fail(dateEndParsed.error);

  let dateStart = dateStartParsed.value;
  let dateEnd = dateEndParsed.value;
  if (dateStart && dateEnd && dateStart > dateEnd) {
    [dateStart, dateEnd] = [dateEnd, dateStart];
  }

  const numbers = parseNumbers(params.get("numbers"));
  if (!numbers.ok) return fail(numbers.error);

  return {
    ok: true,
    value: {
      drwNoStart,
      drwNoEnd,
      dateStart,
      dateEnd,
      numbers: numbers.value,
      includeBonus: parseBoolean(params.get("includeBonus")),
    },
  };
}

/** 조건이 하나도 없으면 "최근 회차" 기본 조회다. */
export function isDefaultSearch(query: LottoSearchQuery): boolean {
  return (
    query.drwNoStart === undefined &&
    query.drwNoEnd === undefined &&
    query.dateStart === undefined &&
    query.dateEnd === undefined &&
    (query.numbers === undefined || query.numbers.length === 0)
  );
}

/**
 * 번호 하나가 당첨번호(선택적으로 보너스 포함)에 들어 있는지 묻는
 * PostgREST `or()` 필터 문자열. 번호마다 하나씩 `.or()` 를 걸면 AND 가 된다.
 */
export function buildNumberOrFilter(n: number, includeBonus: boolean): string {
  const columns: string[] = [...WINNING_NUMBER_COLUMNS];
  if (includeBonus) columns.push("bnus_no");
  return columns.map((col) => `${col}.eq.${n}`).join(",");
}
