import { LottoDraw, BasicStats } from "../types";

export class StatisticsCalculator {
  private draws: LottoDraw[];

  constructor(draws: LottoDraw[]) {
    this.draws = draws;
  }

  public calculateBasicStats(includeBonus: boolean = false): BasicStats {
    const stats: BasicStats = {
      frequency: this.initZeroMap(45),
      recentAppearance: this.initZeroMap(45),
      missCount: this.initZeroMap(45),
      oddEvenRatio: { odd: 0, even: 0 },
      sectionDistribution: {
        "1-10": 0,
        "11-20": 0,
        "21-30": 0,
        "31-40": 0,
        "41-45": 0,
      },
      sumDistribution: {
        "0-100": 0,
        "101-150": 0,
        "151-200": 0,
        "201+": 0,
      },
      consecutiveOccurrences: {
        total: 0,
        pairs: {},
        byDraw: {},
      },
    };

    // Sort draws by drw_no ascending
    const sortedDraws = [...this.draws].sort((a, b) => a.drw_no - b.drw_no);
    const lastDrawNo = sortedDraws[sortedDraws.length - 1]?.drw_no || 0;

    sortedDraws.forEach((draw) => {
      const basicNumbers = [
        draw.drwt_no1,
        draw.drwt_no2,
        draw.drwt_no3,
        draw.drwt_no4,
        draw.drwt_no5,
        draw.drwt_no6,
      ].sort((a, b) => a - b);

      const allNumbers = includeBonus
        ? [...basicNumbers, draw.bnus_no]
        : basicNumbers;

      let sum = 0;
      let drawConsecutiveCount = 0;

      // Consecutive numbers check (usually based on basic 6 numbers)
      for (let i = 0; i < basicNumbers.length - 1; i++) {
        if (basicNumbers[i + 1] === basicNumbers[i] + 1) {
          stats.consecutiveOccurrences.total++;
          drawConsecutiveCount++;
          const pairKey = `${basicNumbers[i]},${basicNumbers[i + 1]}`;
          stats.consecutiveOccurrences.pairs[pairKey] =
            (stats.consecutiveOccurrences.pairs[pairKey] || 0) + 1;
        }
      }

      if (drawConsecutiveCount > 0) {
        stats.consecutiveOccurrences.byDraw[draw.drw_no] = drawConsecutiveCount;
      }

      allNumbers.forEach((num) => {
        // Frequency
        stats.frequency[num] = (stats.frequency[num] || 0) + 1;

        // Recent Appearance
        stats.recentAppearance[num] = draw.drw_no;

        // Odd/Even
        if (num % 2 !== 0) stats.oddEvenRatio.odd++;
        else stats.oddEvenRatio.even++;

        // Section
        if (num <= 10) stats.sectionDistribution["1-10"]++;
        else if (num <= 20) stats.sectionDistribution["11-20"]++;
        else if (num <= 30) stats.sectionDistribution["21-30"]++;
        else if (num <= 40) stats.sectionDistribution["31-40"]++;
        else stats.sectionDistribution["41-45"]++;

        if (!includeBonus || (includeBonus && num !== draw.bnus_no)) {
          sum += num;
        }
      });

      // Sum Distribution (always based on basic 6 numbers)
      if (sum <= 100) stats.sumDistribution["0-100"]++;
      else if (sum <= 150) stats.sumDistribution["101-150"]++;
      else if (sum <= 200) stats.sumDistribution["151-200"]++;
      else stats.sumDistribution["201+"]++;
    });

    // Calculate Miss Count
    for (let i = 1; i <= 45; i++) {
      stats.missCount[i] = lastDrawNo - (stats.recentAppearance[i] || 0);
    }

    return stats;
  }

  private initZeroMap(max: number): Record<number, number> {
    const map: Record<number, number> = {};
    for (let i = 1; i <= max; i++) {
      map[i] = 0;
    }
    return map;
  }
}
