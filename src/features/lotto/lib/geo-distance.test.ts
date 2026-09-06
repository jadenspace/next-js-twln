import { describe, it, expect } from "vitest";
import { calculateHaversineDistance, formatDistance } from "./geo-distance";

describe("calculateHaversineDistance", () => {
  it("동일한 좌표 간의 거리는 0이어야 한다", () => {
    const dist = calculateHaversineDistance(37.5665, 126.978, 37.5665, 126.978);
    expect(dist).toBe(0);
  });

  it("서울시청과 강남역 사이의 거리를 약 8~9km 범위로 정확히 계산한다", () => {
    // 서울시청: 37.5665, 126.9780
    // 강남역: 37.4979, 127.0276
    const dist = calculateHaversineDistance(
      37.5665,
      126.978,
      37.4979,
      127.0276,
    );
    expect(dist).toBeGreaterThan(8);
    expect(dist).toBeLessThan(10);
  });
});

describe("formatDistance", () => {
  it("1km 미만은 미터(m) 단위로 표시한다", () => {
    expect(formatDistance(0.45)).toBe("450m");
    expect(formatDistance(0.08)).toBe("80m");
  });

  it("1km 이상은 킬로미터(km) 단위로 소수점 1자리까지 표시한다", () => {
    expect(formatDistance(2.34)).toBe("2.3km");
    expect(formatDistance(12.89)).toBe("12.9km");
  });
});
