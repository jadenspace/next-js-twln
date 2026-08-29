import { describe, expect, it } from "vitest";
import { getKstDayStartIso } from "./date-utils";

describe("getKstDayStartIso", () => {
  it("KST 기준 같은 날이면 그 날 자정(KST)의 UTC 시각을 반환한다", () => {
    // 2026-08-29 19:00 KST → KST 자정은 2026-08-29 00:00 KST = 2026-08-28 15:00 UTC
    const now = new Date("2026-08-29T10:00:00Z");
    expect(getKstDayStartIso(now)).toBe("2026-08-28T15:00:00.000Z");
  });

  it("UTC 날짜와 KST 날짜가 다른 시각도 KST 기준으로 계산한다", () => {
    // 2026-08-29 20:00 UTC = 2026-08-30 05:00 KST → KST 자정은 2026-08-29 15:00 UTC
    const now = new Date("2026-08-29T20:00:00Z");
    expect(getKstDayStartIso(now)).toBe("2026-08-29T15:00:00.000Z");
  });
});
