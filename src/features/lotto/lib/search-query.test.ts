import { describe, expect, it } from "vitest";
import {
  buildNumberOrFilter,
  isDefaultSearch,
  MAX_RANGE_SIZE,
  parseLottoSearchParams,
} from "./search-query";

const parse = (query: string) =>
  parseLottoSearchParams(new URLSearchParams(query));

describe("parseLottoSearchParams", () => {
  it("파라미터가 없으면 기본 검색으로 판정한다", () => {
    const result = parse("");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(isDefaultSearch(result.value)).toBe(true);
  });

  it("회차 범위를 정수로 파싱한다", () => {
    const result = parse("drwNoStart=1100&drwNoEnd=1110");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.drwNoStart).toBe(1100);
    expect(result.value.drwNoEnd).toBe(1110);
    expect(isDefaultSearch(result.value)).toBe(false);
  });

  it("시작 회차가 종료 회차보다 크면 순서를 바꾼다", () => {
    const result = parse("drwNoStart=1110&drwNoEnd=1100");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.drwNoStart).toBe(1100);
    expect(result.value.drwNoEnd).toBe(1110);
  });

  it("숫자가 아닌 회차는 거부한다", () => {
    expect(parse("drwNoStart=abc").ok).toBe(false);
    expect(parse("drwNoEnd=1.5").ok).toBe(false);
    expect(parse("drwNoStart=0").ok).toBe(false);
  });

  it("회차 범위가 상한을 넘으면 거부한다", () => {
    const tooWide = parse(`drwNoStart=1&drwNoEnd=${1 + MAX_RANGE_SIZE}`);
    expect(tooWide.ok).toBe(false);

    const justFits = parse(`drwNoStart=1&drwNoEnd=${MAX_RANGE_SIZE}`);
    expect(justFits.ok).toBe(true);
  });

  it("YYYY-MM-DD 형식의 날짜 범위를 받는다", () => {
    const result = parse("dateStart=2024-01-01&dateEnd=2024-03-31");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.dateStart).toBe("2024-01-01");
    expect(result.value.dateEnd).toBe("2024-03-31");
  });

  it("날짜 순서가 뒤집혀 있으면 바로잡는다", () => {
    const result = parse("dateStart=2024-03-31&dateEnd=2024-01-01");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.dateStart).toBe("2024-01-01");
    expect(result.value.dateEnd).toBe("2024-03-31");
  });

  it("형식이 틀린 날짜는 거부한다", () => {
    expect(parse("dateStart=20240101").ok).toBe(false);
    expect(parse("dateEnd=2024-13-01").ok).toBe(false);
    expect(parse("dateEnd=abcd-ef-gh").ok).toBe(false);
  });

  it("포함 번호 목록을 정렬된 고유 정수 배열로 파싱한다", () => {
    const result = parse("numbers=23,7,7");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.numbers).toEqual([7, 23]);
    expect(result.value.includeBonus).toBe(false);
  });

  it("보너스 포함 옵션을 읽는다", () => {
    const result = parse("numbers=7&includeBonus=1");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.includeBonus).toBe(true);
  });

  it("범위를 벗어나거나 7개 이상인 번호는 거부한다", () => {
    expect(parse("numbers=0").ok).toBe(false);
    expect(parse("numbers=46").ok).toBe(false);
    expect(parse("numbers=1,2,3,4,5,6,7").ok).toBe(false);
    expect(parse("numbers=a,b").ok).toBe(false);
  });

  it("빈 번호 목록은 번호 조건이 없는 것으로 본다", () => {
    const result = parse("numbers=");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.numbers).toBeUndefined();
    expect(isDefaultSearch(result.value)).toBe(true);
  });

  it("번호 조건과 회차 범위를 함께 받을 수 있다", () => {
    const result = parse("numbers=7&drwNoStart=1000&drwNoEnd=1100");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.numbers).toEqual([7]);
    expect(result.value.drwNoStart).toBe(1000);
  });
});

describe("buildNumberOrFilter", () => {
  it("당첨번호 6개 컬럼에 대한 PostgREST or 조건을 만든다", () => {
    expect(buildNumberOrFilter(7, false)).toBe(
      "drwt_no1.eq.7,drwt_no2.eq.7,drwt_no3.eq.7,drwt_no4.eq.7,drwt_no5.eq.7,drwt_no6.eq.7",
    );
  });

  it("보너스 포함이면 bnus_no 조건을 덧붙인다", () => {
    expect(buildNumberOrFilter(45, true)).toBe(
      "drwt_no1.eq.45,drwt_no2.eq.45,drwt_no3.eq.45,drwt_no4.eq.45,drwt_no5.eq.45,drwt_no6.eq.45,bnus_no.eq.45",
    );
  });
});
