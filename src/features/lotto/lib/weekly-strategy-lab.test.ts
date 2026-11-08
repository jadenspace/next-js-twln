import { describe, expect, it } from "vitest";
import { makeDraw } from "./lotto-draw.fixture";
import {
  buildWeeklyStrategyLabData,
  getOmrCoordinates,
} from "./weekly-strategy-lab";

describe("weekly-strategy-lab", () => {
  it("calculates 7x7 OMR coordinates accurately", () => {
    const coords = getOmrCoordinates([1, 7, 8, 34, 35, 45]);
    expect(coords).toEqual([
      { num: 1, row: 1, col: 1 },
      { num: 7, row: 1, col: 7 },
      { num: 8, row: 2, col: 1 },
      { num: 34, row: 5, col: 6 },
      { num: 35, row: 5, col: 7 },
      { num: 45, row: 7, col: 3 },
    ]);
  });

  it("builds weekly strategy lab response with 5 recommended sets and 5 reference sets", () => {
    const sampleDraws = [
      makeDraw({
        drw_no: 1249,
        drw_no_date: "2026-11-07",
        drwt_no1: 2,
        drwt_no2: 11,
        drwt_no3: 16,
        drwt_no4: 25,
        drwt_no5: 34,
        drwt_no6: 35,
        bnus_no: 14,
      }),
      makeDraw({
        drw_no: 1248,
        drw_no_date: "2026-10-31",
        drwt_no1: 16,
        drwt_no2: 18,
        drwt_no3: 27,
        drwt_no4: 36,
        drwt_no5: 38,
        drwt_no6: 42,
        bnus_no: 22,
      }),
      makeDraw({
        drw_no: 1247,
        drw_no_date: "2026-10-24",
        drwt_no1: 8,
        drwt_no2: 14,
        drwt_no3: 21,
        drwt_no4: 22,
        drwt_no5: 42,
        drwt_no6: 45,
        bnus_no: 24,
      }),
    ];

    const result = buildWeeklyStrategyLabData(sampleDraws);

    expect(result.recommendedSets).toHaveLength(5);
    expect(result.referenceSets).toHaveLength(5);
    expect(result.numberProfiles).toHaveLength(45);
    expect(result.targetDrawNo).toBe(result.baseDraw.drawNo + 1);

    for (const set of result.recommendedSets) {
      expect(set.numbers).toHaveLength(6);
      expect(new Set(set.numbers).size).toBe(6);
      expect(set.high32Count).toBeGreaterThanOrEqual(4);
      expect(set.ac).toBeGreaterThanOrEqual(7);
      expect(set.maxOmrRow).toBeLessThanOrEqual(2);
      expect(set.maxOmrCol).toBeLessThanOrEqual(2);
    }
  });
});
