import { LottoDraw, BasicStats } from "../types";

export class StatisticsCalculator {
  private draws: LottoDraw[];

  constructor(draws: LottoDraw[]) {
    this.draws = draws;
  }

  public calculateBasicStats(): BasicStats {
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
    };

    // Calculate Frequency & Odd/Even & Section & Sum
    // We iterate from oldest to newest or newest to oldest.
    // Logic: Frequency counts all. Recent appearance needs latest index.

    // Sort draws by drw_no ascending just in case
    const sortedDraws = [...this.draws].sort((a, b) => a.drw_no - b.drw_no);
    const lastDrawNo = sortedDraws[sortedDraws.length - 1]?.drw_no || 0;

    sortedDraws.forEach((draw) => {
      const numbers = [
        draw.drwt_no1,
        draw.drwt_no2,
        draw.drwt_no3,
        draw.drwt_no4,
        draw.drwt_no5,
        draw.drwt_no6,
      ];
      let sum = 0;

      numbers.forEach((num) => {
        // Frequency
        stats.frequency[num] = (stats.frequency[num] || 0) + 1;

        // Recent Appearance (Update to current draw No)
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

        sum += num;
      });

      // Sum Distribution
      if (sum <= 100) stats.sumDistribution["0-100"]++;
      else if (sum <= 150) stats.sumDistribution["101-150"]++;
      else if (sum <= 200) stats.sumDistribution["151-200"]++;
      else stats.sumDistribution["201+"]++;
    });

    // Calculate Miss Count (Continuous absence from latest draw)
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
