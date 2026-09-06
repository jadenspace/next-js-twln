import { describe, expect, it } from "vitest";
import { formatWon } from "./format-won";

describe("formatWon", () => {
  it("천 단위 구분 기호와 원 단위를 붙인다", () => {
    expect(formatWon(1570620309)).toBe("1,570,620,309원");
    expect(formatWon(0)).toBe("0원");
  });

  it("문자열이나 빈 값도 숫자로 바꿔 처리한다", () => {
    expect(formatWon("5000")).toBe("5,000원");
    expect(formatWon(undefined)).toBe("0원");
    expect(formatWon(null)).toBe("0원");
  });
});
