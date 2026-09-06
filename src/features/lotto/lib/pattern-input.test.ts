import { describe, expect, it } from "vitest";
import {
  parseCombinationRequest,
  parseNumbers,
  parsePatternFilters,
  parseRange,
} from "./pattern-input";

describe("parseNumbers", () => {
  it("없으면 빈 배열, 배열이 아니면 null", () => {
    expect(parseNumbers(undefined, 6)).toEqual([]);
    expect(parseNumbers(null, 6)).toEqual([]);
    expect(parseNumbers("1,2", 6)).toBeNull();
  });

  it("1~45 정수만 허용하고 중복은 제거한다", () => {
    expect(parseNumbers([1, 45, 1], 6)).toEqual([1, 45]);
    expect(parseNumbers([0], 6)).toBeNull();
    expect(parseNumbers([46], 6)).toBeNull();
    expect(parseNumbers([1.5], 6)).toBeNull();
  });

  it("최대 길이를 넘으면 null", () => {
    expect(parseNumbers([1, 2, 3, 4, 5, 6, 7], 6)).toBeNull();
  });
});

describe("parseRange", () => {
  it("[low, high] 정수 쌍만 허용한다", () => {
    expect(parseRange([21, 255], 21, 255)).toEqual([21, 255]);
    expect(parseRange([20, 255], 21, 255)).toBeNull();
    expect(parseRange([30, 20], 21, 255)).toBeNull();
    expect(parseRange([21], 21, 255)).toBeNull();
    expect(parseRange("x", 21, 255)).toBeNull();
  });
});

describe("parseCombinationRequest", () => {
  it("객체가 아니면 null", () => {
    expect(parseCombinationRequest(null)).toBeNull();
    expect(parseCombinationRequest("x")).toBeNull();
  });

  it("고정수/제외수가 없으면 빈 배열로 기본값을 준다", () => {
    const parsed = parseCombinationRequest({});
    expect(parsed).toEqual({
      fixedNumbers: [],
      excludedNumbers: [],
      filters: null,
    });
  });

  it("고정수와 제외수가 겹치면 null", () => {
    expect(
      parseCombinationRequest({ fixedNumbers: [1], excludedNumbers: [1] }),
    ).toBeNull();
  });

  it("고정수 7개 이상, 범위 밖 번호는 null", () => {
    expect(
      parseCombinationRequest({ fixedNumbers: [1, 2, 3, 4, 5, 6, 7] }),
    ).toBeNull();
    expect(parseCombinationRequest({ excludedNumbers: [99] })).toBeNull();
    expect(parseCombinationRequest({ fixedNumbers: "1" })).toBeNull();
  });

  it("filters 가 있으면 sumRange/acRange/비율/패턴을 검증한다", () => {
    const filters = {
      sumRange: [100, 170],
      acRange: [7, 10],
      oddEvenRatios: ["3:3"],
      highLowRatios: [],
      consecutivePattern: "none",
      sameEndDigit: 2,
      sameSection: 3,
    };
    const parsed = parseCombinationRequest({ fixedNumbers: [7], filters });
    expect(parsed?.filters).toEqual(filters);

    expect(
      parseCombinationRequest({
        filters: { ...filters, sumRange: [300, 400] },
      }),
    ).toBeNull();
    expect(
      parseCombinationRequest({ filters: { ...filters, oddEvenRatios: [3] } }),
    ).toBeNull();
    expect(
      parseCombinationRequest({
        filters: { ...filters, consecutivePattern: "weird" },
      }),
    ).toBeNull();
    expect(
      parseCombinationRequest({ filters: { ...filters, sameEndDigit: 7 } }),
    ).toBeNull();
  });

  it("filters 의 선택 항목은 생략할 수 있다", () => {
    const parsed = parseCombinationRequest({
      filters: {
        sumRange: [21, 255],
        acRange: [0, 10],
        oddEvenRatios: [],
        highLowRatios: [],
      },
    });
    expect(parsed?.filters).toEqual({
      sumRange: [21, 255],
      acRange: [0, 10],
      oddEvenRatios: [],
      highLowRatios: [],
    });
  });
});

describe("parsePatternFilters", () => {
  const base = {
    sumRange: [21, 255],
    acRange: [0, 10],
    primeCount: [0, 6],
    compositeCount: [0, 6],
    multiplesOf3: [0, 6],
    multiplesOf5: [0, 6],
    squareCount: [0, 6],
  };

  it("필수 범위가 모두 있으면 기본값을 채워 반환한다", () => {
    const parsed = parsePatternFilters(base);
    expect(parsed).toMatchObject({
      ...base,
      oddEvenRatios: [],
      highLowRatios: [],
      consecutivePattern: "any",
      sameEndDigit: 0,
      sameSection: 0,
      fixedNumbers: [],
      excludedNumbers: [],
    });
  });

  it("consecutivePattern 이 허용 값이 아니면 null", () => {
    expect(
      parsePatternFilters({ ...base, consecutivePattern: "typo" }),
    ).toBeNull();
  });

  it("고정수와 제외수가 겹치면 null", () => {
    expect(
      parsePatternFilters({ ...base, fixedNumbers: [3], excludedNumbers: [3] }),
    ).toBeNull();
  });
});
