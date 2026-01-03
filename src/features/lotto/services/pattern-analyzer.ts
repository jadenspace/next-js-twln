import { LottoDraw } from "../types";

export interface PatternStats {
  consecutivePatterns: Record<number, number>; // 연속번호 (2연속, 3연속 등) 출현 횟수
  endDigitPatterns: Record<number, number>; // 끝자리(0~9) 출현 빈도
  acValues: Record<number, number>; // AC값 분포
  highLowRatio: { high: number; low: number }; // 고저 비율 (23 기준)
}

export class PatternAnalyzer {
  private draws: LottoDraw[];

  constructor(draws: LottoDraw[]) {
    this.draws = draws;
  }

  public calculatePatterns(): PatternStats {
    const stats: PatternStats = {
      consecutivePatterns: {},
      endDigitPatterns: this.initZeroMap(9, 0),
      acValues: {},
      highLowRatio: { high: 0, low: 0 },
    };

    this.draws.forEach((draw) => {
      const numbers = [
        draw.drwtNo1,
        draw.drwtNo2,
        draw.drwtNo3,
        draw.drwtNo4,
        draw.drwtNo5,
        draw.drwtNo6,
      ];

      // 1. Consecutive Numbers (연속번호)
      let consecutiveCount = 0;
      for (let i = 0; i < numbers.length - 1; i++) {
        if (numbers[i + 1] === numbers[i] + 1) {
          consecutiveCount++;
        } else {
          if (consecutiveCount > 0) {
            const key = consecutiveCount + 1; // 2 numbers consecutive means 1 diff
            stats.consecutivePatterns[key] =
              (stats.consecutivePatterns[key] || 0) + 1;
            consecutiveCount = 0;
          }
        }
      }
      // Check last pair
      if (consecutiveCount > 0) {
        const key = consecutiveCount + 1;
        stats.consecutivePatterns[key] =
          (stats.consecutivePatterns[key] || 0) + 1;
      }

      // 2. End Digit (끝자리)
      numbers.forEach((num) => {
        const endDigit = num % 10;
        stats.endDigitPatterns[endDigit]++;

        // 4. High/Low (고저)
        if (num >= 23) stats.highLowRatio.high++;
        else stats.highLowRatio.low++;
      });

      // 3. AC Value
      const ac = this.calculateAC(numbers);
      stats.acValues[ac] = (stats.acValues[ac] || 0) + 1;
    });

    return stats;
  }

  private calculateAC(numbers: number[]): number {
    // AC = (Total distinctive diffs between all pairs) - (6 - 1)
    const diffs = new Set<number>();
    for (let i = 0; i < numbers.length; i++) {
      for (let j = i + 1; j < numbers.length; j++) {
        diffs.add(Math.abs(numbers[i] - numbers[j]));
      }
    }
    return diffs.size - 5;
  }

  private initZeroMap(max: number, min: number = 1): Record<number, number> {
    const map: Record<number, number> = {};
    for (let i = min; i <= max; i++) {
      map[i] = 0;
    }
    return map;
  }
}
