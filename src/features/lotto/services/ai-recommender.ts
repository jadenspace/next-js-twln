import { LottoDraw } from "../types";

export interface RecommendationResult {
  recommendations: number[][]; // 5 sets of numbers
  reasoning: string[]; // Reasons per set or general reasoning
}

export class AiRecommender {
  private draws: LottoDraw[];

  constructor(draws: LottoDraw[]) {
    this.draws = draws;
  }

  public recommend(): RecommendationResult {
    // Simple Weighted Random Algorithm for MVP (Phase 3)
    // 1. Calculate weights based on frequency (inverse or direct, let's mix)
    // 2. Recent absence increases weight (Hot/Cold logic)

    const weights = this.calculateWeights();

    // Generate 5 sets
    const recommendations: number[][] = [];
    const reasoning: string[] = [];

    // Set 1: High Frequency focus (Hot numbers)
    recommendations.push(this.generateSet(weights.frequency, "hot"));
    reasoning.push(
      "최근 및 전체 출현 빈도가 높은 '핫(Hot)' 번호 위주로 구성했습니다.",
    );

    // Set 2: High Absence focus (Cold numbers - due theory)
    recommendations.push(this.generateSet(weights.absence, "cold"));
    reasoning.push(
      "오랫동안 나오지 않아 출현 가능성이 높아진 '콜드(Cold)' 번호를 포함했습니다.",
    );

    // Set 3: Balanced (Random with some weight)
    recommendations.push(this.generateSet(weights.balanced, "weighted_random"));
    reasoning.push("빈도와 미출현 기간을 균형있게 고려하여 랜덤 조합했습니다.");

    // Set 4: Recent Trend (Last 10 draws focus)
    recommendations.push(this.generateSet(weights.recent, "trend"));
    reasoning.push(
      "최근 10회차의 흐름을 분석하여 상승세에 있는 번호를 선택했습니다.",
    );

    // Set 5: AI Experimental (Mix)
    recommendations.push(this.generateSet(weights.balanced, "experimental"));
    reasoning.push(
      "AI 알고리즘이 다양한 패턴 가중치를 적용하여 생성한 실험적 조합입니다.",
    );

    return { recommendations, reasoning };
  }

  private calculateWeights() {
    const freqMap: Record<number, number> = {};
    const absenceMap: Record<number, number> = {};
    const recentMap: Record<number, number> = {};

    // Initialize
    for (let i = 1; i <= 45; i++) {
      freqMap[i] = 1;
      absenceMap[i] = 0;
      recentMap[i] = 1;
    }

    const lastDrawNo = this.draws[0]?.drwNo || 0; // Assuming sorted descending or check

    // Sort draws descending to check absence easily
    const sortedDraws = [...this.draws].sort((a, b) => b.drwNo - a.drwNo);

    // Calculate Absence
    for (let i = 1; i <= 45; i++) {
      let lastSeen = -1;
      for (const draw of sortedDraws) {
        const nums = [
          draw.drwtNo1,
          draw.drwtNo2,
          draw.drwtNo3,
          draw.drwtNo4,
          draw.drwtNo5,
          draw.drwtNo6,
        ];
        if (nums.includes(i)) {
          lastSeen = draw.drwNo;
          break;
        }
      }
      absenceMap[i] = lastSeen === -1 ? 100 : sortedDraws[0].drwNo - lastSeen;
    }

    // Calculate Frequency & Recent
    sortedDraws.forEach((draw, idx) => {
      const nums = [
        draw.drwtNo1,
        draw.drwtNo2,
        draw.drwtNo3,
        draw.drwtNo4,
        draw.drwtNo5,
        draw.drwtNo6,
      ];
      nums.forEach((n) => {
        freqMap[n]++;
        if (idx < 10) recentMap[n] += 5; // Boost recent
      });
    });

    // Normalize or prepare weight arrays maps
    return {
      frequency: freqMap,
      absence: absenceMap,
      recent: recentMap,
      balanced: this.mergeWeights(freqMap, absenceMap),
    };
  }

  private mergeWeights(w1: Record<number, number>, w2: Record<number, number>) {
    const merged: Record<number, number> = {};
    for (let i = 1; i <= 45; i++) {
      merged[i] = w1[i] + w2[i];
    }
    return merged;
  }

  private generateSet(
    weights: Record<number, number>,
    method: string,
  ): number[] {
    const selected = new Set<number>();
    // Convert weights map to array for weighted random selection
    const pool: number[] = [];

    Object.entries(weights).forEach(([num, weight]) => {
      // Simple expansion: add num 'weight' times to pool
      // Cap weight to avoid memory issues if weight is huge, though here it's small enough.
      const safeWeight = Math.min(Math.floor(weight), 100);
      for (let k = 0; k < safeWeight; k++) pool.push(parseInt(num));
    });

    // Fallback if pool empty
    if (pool.length === 0) {
      for (let i = 1; i <= 45; i++) pool.push(i);
    }

    while (selected.size < 6) {
      const pick = pool[Math.floor(Math.random() * pool.length)];
      selected.add(pick);
    }

    return Array.from(selected).sort((a, b) => a - b);
  }
}
