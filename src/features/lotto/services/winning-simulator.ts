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
        draw.drwt_no1,
        draw.drwt_no2,
        draw.drwt_no3,
        draw.drwt_no4,
        draw.drwt_no5,
        draw.drwt_no6,
      ];
      const bonusNumber = draw.bnus_no;

      const matchCount = winNumbers.filter((n) =>
        sortedMyNumbers.includes(n),
      ).length;
      const isBonusMatch = sortedMyNumbers.includes(bonusNumber);

      let rank = 0;
      let prize = 0;

      if (matchCount === 6) {
        rank = 1;
        // 실제 1등 당첨금 사용 (string이므로 Number로 변환)
        prize = Number(draw.first_win_amnt || 0);
      } else if (matchCount === 5 && isBonusMatch) {
        rank = 2;
        // 실제 2등 당첨금 사용
        prize = Number(draw.rnk2_win_amt || 50000000);
      } else if (matchCount === 5) {
        rank = 3;
        // 실제 3등 당첨금 사용
        prize = Number(draw.rnk3_win_amt || 1500000);
      } else if (matchCount === 4) {
        rank = 4;
        // 실제 4등 당첨금 사용
        prize = Number(draw.rnk4_win_amt || 50000);
      } else if (matchCount === 3) {
        rank = 5;
        // 실제 5등 당첨금 사용
        prize = Number(draw.rnk5_win_amt || 5000);
      } else {
        rank = 0; // Fail
      }

      if (rank > 0) {
        result.rankCounts[rank as keyof typeof result.rankCounts]++;
        result.totalPrize += prize;
        result.history.push({
          drwNo: draw.drw_no,
          rank,
          prize,
          date: draw.drw_no_date,
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
