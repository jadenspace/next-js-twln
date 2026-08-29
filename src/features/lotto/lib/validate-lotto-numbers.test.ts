import { describe, expect, it } from "vitest";
import { validateLottoNumbers } from "./validate-lotto-numbers";

describe("validateLottoNumbers", () => {
  it("1~45 범위의 서로 다른 정수 6개를 허용한다", () => {
    expect(validateLottoNumbers([1, 2, 3, 4, 5, 45])).toBe(true);
  });

  it("배열이 아닌 입력을 거부한다", () => {
    expect(validateLottoNumbers(undefined)).toBe(false);
    expect(validateLottoNumbers(null)).toBe(false);
    expect(validateLottoNumbers("123456")).toBe(false);
    expect(validateLottoNumbers({ 0: 1, length: 6 })).toBe(false);
  });

  it("6개가 아닌 배열을 거부한다", () => {
    expect(validateLottoNumbers([1, 2, 3, 4, 5])).toBe(false);
    expect(validateLottoNumbers([1, 2, 3, 4, 5, 6, 7])).toBe(false);
    expect(validateLottoNumbers([])).toBe(false);
  });

  it("중복된 번호를 거부한다", () => {
    expect(validateLottoNumbers([1, 2, 3, 4, 5, 5])).toBe(false);
    expect(validateLottoNumbers([7, 7, 7, 7, 7, 7])).toBe(false);
  });

  it("1~45 범위를 벗어난 번호를 거부한다", () => {
    expect(validateLottoNumbers([0, 2, 3, 4, 5, 6])).toBe(false);
    expect(validateLottoNumbers([1, 2, 3, 4, 5, 46])).toBe(false);
    expect(validateLottoNumbers([-1, 2, 3, 4, 5, 6])).toBe(false);
  });

  it("정수가 아닌 요소를 거부한다", () => {
    expect(validateLottoNumbers([1.5, 2, 3, 4, 5, 6])).toBe(false);
    expect(validateLottoNumbers(["1", 2, 3, 4, 5, 6])).toBe(false);
    expect(validateLottoNumbers([NaN, 2, 3, 4, 5, 6])).toBe(false);
    expect(validateLottoNumbers([null, 2, 3, 4, 5, 6])).toBe(false);
  });
});
