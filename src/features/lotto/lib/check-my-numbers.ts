import type { LottoDraw } from "../types";
import { calculateRanking, type LottoRank } from "./calculate-ranking";
import { getDrawNumbers } from "./draw-trend-analysis";

/**
 * 검색 결과 회차에 사용자의 번호 6개를 대보고 등수·맞은 번호를 돌려준다.
 * 등수 판정은 calculate-ranking 을 그대로 쓰고, 화면 강조에 필요한
 * 일치 번호와 보너스 일치 여부만 덧붙인다.
 */

export interface MyNumbersCheck {
  rank: LottoRank;
  /** 당첨번호 6개 중 맞은 번호, 오름차순. 보너스는 포함하지 않는다. */
  matched: number[];
  bonusMatched: boolean;
}

export interface RankSummary {
  total: number;
  byRank: Record<1 | 2 | 3 | 4 | 5, number>;
  noWin: number;
}

export function checkDrawAgainstNumbers(
  draw: LottoDraw,
  myNumbers: number[],
): MyNumbersCheck {
  const winning = getDrawNumbers(draw);
  const mine = new Set(myNumbers);
  return {
    rank: calculateRanking(myNumbers, winning, draw.bnus_no),
    matched: winning.filter((n) => mine.has(n)),
    bonusMatched: mine.has(draw.bnus_no),
  };
}

export function summarizeRankResults(checks: MyNumbersCheck[]): RankSummary {
  const summary: RankSummary = {
    total: checks.length,
    byRank: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    noWin: 0,
  };
  for (const check of checks) {
    if (check.rank === 0) summary.noWin++;
    else summary.byRank[check.rank]++;
  }
  return summary;
}
