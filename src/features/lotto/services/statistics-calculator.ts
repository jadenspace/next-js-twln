import { LottoDraw, BasicStats, AdvancedStats } from "../types";

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
    const earliestDrawNo = sortedDraws[0]?.drw_no || 0;
    for (let i = 1; i <= 45; i++) {
      const lastApp = stats.recentAppearance[i];
      if (lastApp > 0) {
        stats.missCount[i] = lastDrawNo - lastApp;
      } else {
        // If never appeared in the range, we can only say it's more than the range size
        stats.missCount[i] = lastDrawNo - earliestDrawNo + 1;
      }
    }

    return stats;
  }

  public calculateAdvancedStats(includeBonus: boolean = false): AdvancedStats {
    const basic = this.calculateBasicStats(includeBonus);
    const sortedDraws = [...this.draws].sort((a, b) => a.drw_no - b.drw_no);
    const earliestDrawNo = sortedDraws[0]?.drw_no || 0;

    const advanced: AdvancedStats = {
      ...basic,
      regression: { averageCycles: {}, lastCycles: {}, stdDev: {} },
      markov: { transitionMatrix: {} },
      endingDigit: {},
      compatibility: { pairs: {} },
      mathProperty: { primes: 0, multiplesOf3: 0, composites: 0 },
      nineRanges: {},
      interval: { averageGaps: [0, 0, 0, 0, 0], drawGaps: {} },
      expertBalance: { sums: [], averages: [], spreads: [] },
    };

    const occurrenceHistory: Record<number, number[]> = {};
    for (let i = 1; i <= 45; i++) occurrenceHistory[i] = [];

    const isPrime = (n: number) => {
      if (n < 2) return false;
      for (let i = 2; i <= Math.sqrt(n); i++) if (n % i === 0) return false;
      return true;
    };

    const sumGaps = [0, 0, 0, 0, 0];

    sortedDraws.forEach((draw, index) => {
      const basicNos = [
        draw.drwt_no1,
        draw.drwt_no2,
        draw.drwt_no3,
        draw.drwt_no4,
        draw.drwt_no5,
        draw.drwt_no6,
      ].sort((a, b) => a - b);
      const nums = includeBonus ? [...basicNos, draw.bnus_no] : basicNos;

      // Expert Balance
      const sum = basicNos.reduce((a, b) => a + b, 0);
      advanced.expertBalance.sums.push(sum);
      advanced.expertBalance.averages.push(sum / 6);
      advanced.expertBalance.spreads.push(basicNos[5] - basicNos[0]);

      // Gaps (Interval)
      const gaps = [];
      for (let i = 0; i < 5; i++) {
        const gap = basicNos[i + 1] - basicNos[i];
        gaps.push(gap);
        sumGaps[i] += gap;
      }
      advanced.interval.drawGaps[draw.drw_no] = gaps;

      // Math Property & Ending Digit & Nine Ranges
      nums.forEach((n) => {
        if (isPrime(n)) advanced.mathProperty.primes++;
        else if (n > 1) advanced.mathProperty.composites++;
        if (n % 3 === 0) advanced.mathProperty.multiplesOf3++;

        const end = n % 10;
        advanced.endingDigit[end] = (advanced.endingDigit[end] || 0) + 1;

        const rangeIdx = Math.floor((n - 1) / 5); // 0~8
        const rangeKey = `${rangeIdx * 5 + 1}-${(rangeIdx + 1) * 5}`;
        advanced.nineRanges[rangeKey] =
          (advanced.nineRanges[rangeKey] || 0) + 1;

        occurrenceHistory[n].push(draw.drw_no);
      });

      // Compatibility (6C2 - typically based on basic numbers)
      for (let i = 0; i < basicNos.length; i++) {
        for (let j = i + 1; j < basicNos.length; j++) {
          const pair = [basicNos[i], basicNos[j]]
            .sort((a, b) => a - b)
            .join(",");
          advanced.compatibility.pairs[pair] =
            (advanced.compatibility.pairs[pair] || 0) + 1;
        }
      }

      // Markov (Transition from current's basic numbers to next's basic numbers)
      if (index < sortedDraws.length - 1) {
        const nextDraw = sortedDraws[index + 1];
        const nextNums = [
          nextDraw.drwt_no1,
          nextDraw.drwt_no2,
          nextDraw.drwt_no3,
          nextDraw.drwt_no4,
          nextDraw.drwt_no5,
          nextDraw.drwt_no6,
        ];
        basicNos.forEach((p) => {
          if (!advanced.markov.transitionMatrix[p])
            advanced.markov.transitionMatrix[p] = {};
          nextNums.forEach((n) => {
            advanced.markov.transitionMatrix[p][n] =
              (advanced.markov.transitionMatrix[p][n] || 0) + 1;
          });
        });
      }
    });

    // Finalize averageGaps
    if (sortedDraws.length > 0) {
      advanced.interval.averageGaps = sumGaps.map(
        (sg) => sg / sortedDraws.length,
      );
    }

    // Regression calculations
    const lastDrawNo = sortedDraws[sortedDraws.length - 1]?.drw_no || 0;
    for (let i = 1; i <= 45; i++) {
      const history = occurrenceHistory[i];
      if (history.length > 1) {
        const cycles = [];
        for (let j = 1; j < history.length; j++) {
          cycles.push(history[j] - history[j - 1]);
        }
        const avg = cycles.reduce((a, b) => a + b, 0) / cycles.length;
        advanced.regression.averageCycles[i] = avg;

        const variance =
          cycles.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / cycles.length;
        advanced.regression.stdDev[i] = Math.sqrt(variance);
      }
      advanced.regression.lastCycles[i] =
        history.length > 0
          ? lastDrawNo - history[history.length - 1]
          : lastDrawNo - earliestDrawNo + 1;
    }

    return advanced;
  }

  private initZeroMap(max: number): Record<number, number> {
    const map: Record<number, number> = {};
    for (let i = 1; i <= max; i++) {
      map[i] = 0;
    }
    return map;
  }
}
