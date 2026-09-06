import { describe, expect, it } from "vitest";
import {
  MAX_SAVED_NUMBERS_PER_REQUEST,
  parseSavedNumbersInput,
} from "./saved-numbers-input";

const valid = [3, 11, 22, 33, 41, 45];

describe("parseSavedNumbersInput", () => {
  it("단일 조합을 받아 정렬된 1행으로 만든다", () => {
    const result = parseSavedNumbersInput({
      numbers: [45, 3, 22, 11, 41, 33],
      source: "simulation",
    });
    expect(result).toEqual({
      ok: true,
      rows: [valid],
      source: "simulation",
      filters: null,
    });
  });

  it("조합 배열을 받아 여러 행으로 만든다", () => {
    const result = parseSavedNumbersInput({
      numbers: [valid, [1, 2, 3, 4, 5, 6]],
      source: "pattern_generator",
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.rows).toHaveLength(2);
  });

  it("numbers 가 배열이 아니면 거부한다", () => {
    expect(
      parseSavedNumbersInput({ numbers: "x", source: "simulation" }).ok,
    ).toBe(false);
    expect(parseSavedNumbersInput({ source: "simulation" }).ok).toBe(false);
  });

  it("6개가 아니거나 범위를 벗어나거나 중복이면 거부한다", () => {
    const cases = [
      [1, 2, 3, 4, 5],
      [0, 2, 3, 4, 5, 6],
      [1, 2, 3, 4, 5, 46],
      [7, 7, 7, 7, 7, 7],
      [1.5, 2, 3, 4, 5, 6],
      ["1", 2, 3, 4, 5, 6],
      [],
    ];
    for (const numbers of cases) {
      expect(parseSavedNumbersInput({ numbers, source: "simulation" }).ok).toBe(
        false,
      );
    }
  });

  it("조합 배열 안에 잘못된 조합이 하나라도 있으면 전체를 거부한다", () => {
    const result = parseSavedNumbersInput({
      numbers: [valid, "oops"],
      source: "simulation",
    });
    expect(result.ok).toBe(false);
  });

  it(`한 번에 ${MAX_SAVED_NUMBERS_PER_REQUEST}개를 넘으면 거부한다`, () => {
    const rows = Array.from(
      { length: MAX_SAVED_NUMBERS_PER_REQUEST + 1 },
      () => valid,
    );
    expect(
      parseSavedNumbersInput({ numbers: rows, source: "simulation" }).ok,
    ).toBe(false);
    const okRows = rows.slice(0, MAX_SAVED_NUMBERS_PER_REQUEST);
    expect(
      parseSavedNumbersInput({ numbers: okRows, source: "simulation" }).ok,
    ).toBe(true);
  });

  it("source 가 허용 값이 아니면 거부한다", () => {
    expect(
      parseSavedNumbersInput({ numbers: valid, source: "manual" }).ok,
    ).toBe(false);
    expect(parseSavedNumbersInput({ numbers: valid }).ok).toBe(false);
  });

  it("filters 는 객체만 허용하고 없으면 null", () => {
    const withFilters = parseSavedNumbersInput({
      numbers: valid,
      source: "pattern_generator",
      filters: { sumRange: [100, 170] },
    });
    expect(withFilters.ok).toBe(true);
    if (withFilters.ok)
      expect(withFilters.filters).toEqual({ sumRange: [100, 170] });

    expect(
      parseSavedNumbersInput({
        numbers: valid,
        source: "simulation",
        filters: "x",
      }).ok,
    ).toBe(false);
  });

  it("입력 배열을 제자리 정렬로 변형하지 않는다", () => {
    const input = [45, 3, 22, 11, 41, 33];
    parseSavedNumbersInput({ numbers: input, source: "simulation" });
    expect(input).toEqual([45, 3, 22, 11, 41, 33]);
  });
});
