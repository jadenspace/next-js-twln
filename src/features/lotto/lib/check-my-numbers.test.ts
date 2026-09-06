import { describe, expect, it } from "vitest";
import {
  checkDrawAgainstNumbers,
  summarizeRankResults,
} from "./check-my-numbers";
import { makeDraw } from "./lotto-draw.fixture";

// 기본 픽스처 당첨번호: 8 9 18 35 39 45 / 보너스 25
const draw = makeDraw();

describe("checkDrawAgainstNumbers", () => {
  it("6개가 모두 맞으면 1등이고 맞은 번호를 정렬해 돌려준다", () => {
    const result = checkDrawAgainstNumbers(draw, [45, 39, 35, 18, 9, 8]);
    expect(result.rank).toBe(1);
    expect(result.matched).toEqual([8, 9, 18, 35, 39, 45]);
    expect(result.bonusMatched).toBe(false);
  });

  it("5개와 보너스가 맞으면 2등이며 보너스 일치를 표시한다", () => {
    const result = checkDrawAgainstNumbers(draw, [8, 9, 18, 35, 39, 25]);
    expect(result.rank).toBe(2);
    expect(result.matched).toEqual([8, 9, 18, 35, 39]);
    expect(result.bonusMatched).toBe(true);
  });

  it("5개만 맞으면 3등이다", () => {
    expect(checkDrawAgainstNumbers(draw, [8, 9, 18, 35, 39, 1]).rank).toBe(3);
  });

  it("4개는 4등, 3개는 5등이다", () => {
    expect(checkDrawAgainstNumbers(draw, [8, 9, 18, 35, 1, 2]).rank).toBe(4);
    expect(checkDrawAgainstNumbers(draw, [8, 9, 18, 1, 2, 3]).rank).toBe(5);
  });

  it("2개 이하면 낙첨(0)이며 맞은 번호는 그대로 알려준다", () => {
    const result = checkDrawAgainstNumbers(draw, [8, 9, 1, 2, 3, 4]);
    expect(result.rank).toBe(0);
    expect(result.matched).toEqual([8, 9]);
  });

  it("보너스만 맞아도 등수에는 영향이 없다", () => {
    const result = checkDrawAgainstNumbers(draw, [25, 1, 2, 3, 4, 5]);
    expect(result.rank).toBe(0);
    expect(result.bonusMatched).toBe(true);
  });
});

describe("summarizeRankResults", () => {
  it("등수별 횟수와 낙첨 횟수를 집계한다", () => {
    const summary = summarizeRankResults([
      { rank: 5, matched: [], bonusMatched: false },
      { rank: 5, matched: [], bonusMatched: false },
      { rank: 4, matched: [], bonusMatched: false },
      { rank: 0, matched: [], bonusMatched: false },
    ]);
    expect(summary).toEqual({
      total: 4,
      byRank: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 2 },
      noWin: 1,
    });
  });

  it("결과가 없으면 모두 0이다", () => {
    expect(summarizeRankResults([])).toEqual({
      total: 0,
      byRank: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      noWin: 0,
    });
  });
});
