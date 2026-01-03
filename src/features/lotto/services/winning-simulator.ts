import { LottoDraw } from "../types";

export interface SimulationResult {
  totalDraws: number; // 총 회차 수
  rankCounts: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
    fail: number;
  };
  totalPrize: number; // 총 당첨금
  totalCost: number; // 총 투자금 (회차 수 * 1000원)
  roi: number; // 수익률 (%)
  history: {
    drwNo: number;
    rank: number;
    prize: number;
    date: string;
  }[];
}

export class WinningSimulator {
  private draws: LottoDraw[];

  constructor(draws: LottoDraw[]) {
    this.draws = draws;
  }

  public simulate(myNumbers: number[]): SimulationResult {
    const sortedMyNumbers = [...myNumbers].sort((a, b) => a - b);
    const result: SimulationResult = {
      totalDraws: this.draws.length,
      rankCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, fail: 0 },
      totalPrize: 0,
      totalCost: this.draws.length * 1000,
      roi: 0,
      history: [],
    };

    this.draws.forEach((draw) => {
      const winNumbers = [
        draw.drwtNo1,
        draw.drwtNo2,
        draw.drwtNo3,
        draw.drwtNo4,
        draw.drwtNo5,
        draw.drwtNo6,
      ];
      const bonusNumber = draw.bnusNo;

      const matchCount = winNumbers.filter((n) =>
        sortedMyNumbers.includes(n),
      ).length;
      const isBonusMatch = sortedMyNumbers.includes(bonusNumber);

      let rank = 0;
      let prize = 0;

      if (matchCount === 6) {
        rank = 1;
        prize = draw.firstWinamnt; // 1등 당첨금 (실제 데이터 사용)
      } else if (matchCount === 5 && isBonusMatch) {
        rank = 2;
        prize = 50000000; // 2등 평균 대략 5천 (데이터에 없으면 근사치 or need DB col for 2nd prize)
        // Since we only have firstWinamnt in LottoDraw interface currently,
        // strictly speaking we need more data. For MVP, let's estimate or use 0 if unsafe.
        // Let's assume fixed prizes for 4,5 and estimate 2,3 for better experience.
        // *Real implementation should fetch all rank prizes from DB.*
      } else if (matchCount === 5) {
        rank = 3;
        prize = 1500000; // 3등 근사치
      } else if (matchCount === 4) {
        rank = 4;
        prize = 50000; // 4등 고정
      } else if (matchCount === 3) {
        rank = 5;
        prize = 5000; // 5등 고정
      } else {
        rank = 0; // Fail
      }

      if (rank > 0) {
        result.rankCounts[rank as keyof typeof result.rankCounts]++;
        result.totalPrize += prize;
        result.history.push({
          drwNo: draw.drwNo,
          rank,
          prize,
          date: draw.drwNoDate,
        });
      } else {
        result.rankCounts.fail++;
      }
    });

    result.roi = (result.totalPrize / result.totalCost) * 100;
    // Sort history by Rank (High to Low) then Date
    result.history.sort((a, b) => a.rank - b.rank || b.drwNo - a.drwNo);

    return result;
  }
}
