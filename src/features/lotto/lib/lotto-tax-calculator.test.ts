import { describe, it, expect } from "vitest";
import {
  calculateLottoTax,
  formatKoreanCurrency,
  calculateFunFacts,
} from "./lotto-tax-calculator";

describe("calculateLottoTax", () => {
  it("200만 원 이하 당첨금은 세금이 0원이다 (비과세)", () => {
    const result = calculateLottoTax(1500000); // 150만 원 (3등)
    expect(result.totalTax).toBe(0);
    expect(result.netPrize).toBe(1500000);
    expect(result.effectiveTaxRate).toBe(0);
  });

  it("200만 원 초과 3억 이하 당첨금은 22% 세율이 적용된다", () => {
    // 5,000만 원 (2등)
    // 과세표준 = 50,000,000 - 1,000 = 49,999,000
    // 비과세 2,000,000 차감 -> 과세 47,999,000
    // 소득세 20% = 9,599,800, 지방세 10% = 959,980 -> 총 10,559,780
    const result = calculateLottoTax(50000000);
    expect(result.bracket22Tax).toBe(10559780);
    expect(result.bracket33Tax).toBe(0);
    expect(result.totalTax).toBe(10559780);
    expect(result.netPrize).toBe(50000000 - 10559780);
  });

  it("3억 초과 고액 당첨금(10억 원)은 22%와 33% 누진세율이 적용된다", () => {
    // 10억 원
    // 과세표준 = 999,999,000
    // 22% 구간(200만~3억): 2억 9,800만 * 0.22 = 65,560,000원
    // 33% 구간(3억 초과): 699,999,000 * 0.33 = 230,999,670원
    // 총 세금 = 296,559,670원
    const result = calculateLottoTax(1000000000);
    expect(result.bracket22Tax).toBe(65560000);
    expect(result.bracket33Tax).toBe(230999670);
    expect(result.totalTax).toBe(296559670);
    expect(result.netPrize).toBe(1000000000 - 296559670);
    expect(result.effectiveTaxRate).toBeCloseTo(29.66, 1);
  });
});

describe("formatKoreanCurrency", () => {
  it("금액을 한국어 단위로 가독성 있게 표현한다", () => {
    expect(formatKoreanCurrency(0)).toBe("0원");
    expect(formatKoreanCurrency(5000)).toBe("5,000원");
    expect(formatKoreanCurrency(50000)).toBe("5만 원");
    expect(formatKoreanCurrency(50000000)).toBe("5,000만 원");
    expect(formatKoreanCurrency(2543210000)).toBe("25억 4,321만 원");
  });
});

describe("calculateFunFacts", () => {
  it("실수령액에 따라 적절한 비교 항목들을 계산한다", () => {
    const facts = calculateFunFacts(2000000000); // 20억
    expect(facts.length).toBeGreaterThan(0);
    const coffee = facts.find((f) => f.id === "coffee");
    expect(coffee).toBeDefined();
    expect(coffee!.quantity).toBeGreaterThan(10000);
  });
});
