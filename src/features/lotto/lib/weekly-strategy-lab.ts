import type { LottoDraw } from "../types";
import {
  calculateAC,
  calculateSum,
  countConsecutivePairs,
  countSameEndDigit,
  countSameSection,
  getHighLowRatio,
  getOddEvenRatio,
} from "./lotto-math";
import { getDrawNumbers } from "./draw-trend-analysis";

export interface NumberProfile {
  num: number;
  missCount: number;
  freqAll: number;
  freq120: number;
  freq30: number;
  freq10: number;
  inPrev1: boolean;
  inPrev3: boolean;
  inPrev6: boolean;
  inPrev10: boolean;
  isHot120: boolean;
  isHot30: boolean;
  isOverdue: boolean;
}

export interface StrategySetEvaluation {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  numbers: number[];
  sum: number;
  ac: number;
  oddEvenRatio: string;
  highLowRatio: string;
  high32Count: number;
  consecutivePairs: number;
  maxSameEndDigit: number;
  maxSameSection: number;
  maxOmrRow: number;
  maxOmrCol: number;
  omrCoordinates: Array<{ num: number; row: number; col: number }>;
  regressionPrev1: number[];
  regressionLast3: number[];
  regressionLast6: number[];
  regressionLast10: number[];
  overdueNumbers: number[];
  hotNumbers: number[];
  historicalMatches: {
    rank1: number;
    rank3: number;
    rank4: number;
    rank5: number;
  };
  strategy1Score: number;
  strategy2Score: number;
  totalScore: number;
  reasons: string[];
  cautions: string[];
}

export interface StrategyEmpiricalBucket {
  label: string;
  drawCount: number;
  ratioPct: number;
  avgWinners: number;
  avgPrizeEok: number;
  avgManualWinners?: number;
}

export interface WeeklyStrategyLabResponse {
  baseDraw: {
    drawNo: number;
    drawDate: string;
    numbers: number[];
    bonusNo: number;
    sum: number;
    ac: number;
    oddEvenRatio: string;
    high32Count: number;
    firstWinners: number;
    firstPrizeEok: number;
    autoWinners: number;
    manualWinners: number;
    semiAutoWinners: number;
  };
  targetDrawNo: number;
  totalAnalyzedDraws: number;
  strategy1Insights: {
    recentDrawCount: number;
    autoManualStats: {
      analyzedDraws: number;
      totalWinners: number;
      autoRatioPct: number;
      manualRatioPct: number;
      semiAutoRatioPct: number;
      lowMidSumManualAvg: number;
      highSumManualAvg: number;
    };
    byHigh32Count: StrategyEmpiricalBucket[];
    bySumBracket: StrategyEmpiricalBucket[];
    trapExamples: Array<{
      drawNo: number;
      drawDate: string;
      numbers: number[];
      sum: number;
      high32Count: number;
      winners: number;
      prizeEok: number;
      reason: string;
    }>;
    jackpotExamples: Array<{
      drawNo: number;
      drawDate: string;
      numbers: number[];
      sum: number;
      high32Count: number;
      winners: number;
      manualWinners?: number;
      prizeEok: number;
      reason: string;
    }>;
  };
  strategy2Insights: {
    chiSquareAll: number;
    chiSquare120: number;
    meanSumAll: number;
    meanSum120: number;
    meanSum30: number;
    meanAcAll: number;
    prev1CarryoverRate120Pct: number;
    avgPrev1Carryover120: number;
    avgLast3Carryover120: number;
    avgLast10Carryover120: number;
    sectionCap2Rate120Pct: number;
    hotAllTop: NumberProfile[];
    hot120Top: NumberProfile[];
    hot30Top: NumberProfile[];
    hotHigh32Top: NumberProfile[];
    overdueTop: NumberProfile[];
    prev1Numbers: NumberProfile[];
  };
  recommendedSets: StrategySetEvaluation[];
  referenceSets: StrategySetEvaluation[];
  numberProfiles: NumberProfile[];
}

export function getOmrCoordinates(
  numbers: number[],
): Array<{ num: number; row: number; col: number }> {
  return [...numbers]
    .sort((a, b) => a - b)
    .map((num) => ({
      num,
      row: Math.floor((num - 1) / 7) + 1,
      col: ((num - 1) % 7) + 1,
    }));
}

function getMaxOmrLineCount(
  coords: Array<{ num: number; row: number; col: number }>,
): { maxRow: number; maxCol: number } {
  const rowCounts: Record<number, number> = {};
  const colCounts: Record<number, number> = {};

  for (const c of coords) {
    rowCounts[c.row] = (rowCounts[c.row] || 0) + 1;
    colCounts[c.col] = (colCounts[c.col] || 0) + 1;
  }

  return {
    maxRow: Math.max(0, ...Object.values(rowCounts)),
    maxCol: Math.max(0, ...Object.values(colCounts)),
  };
}

function hasThreeConsecutive(numbers: number[]): boolean {
  const sorted = [...numbers].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length - 2; i++) {
    if (sorted[i + 1] === sorted[i] + 1 && sorted[i + 2] === sorted[i] + 2) {
      return true;
    }
  }
  return false;
}

export function evaluateNumberSet(params: {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  numbers: number[];
  drawsDesc: LottoDraw[];
  profilesMap: Map<number, NumberProfile>;
  customReasons?: string[];
}): StrategySetEvaluation {
  const { id, title, subtitle, badge, drawsDesc, profilesMap, customReasons } =
    params;
  const numbers = [...params.numbers].sort((a, b) => a - b);
  const sum = calculateSum(numbers);
  const ac = calculateAC(numbers);
  const oddEvenRatio = getOddEvenRatio(numbers);
  const highLowRatio = getHighLowRatio(numbers);
  const high32Count = numbers.filter((n) => n >= 32).length;
  const consecutivePairs = countConsecutivePairs(numbers);
  const maxSameEndDigit = countSameEndDigit(numbers) || 1;
  const maxSameSection = countSameSection(numbers) || 1;
  const omrCoordinates = getOmrCoordinates(numbers);
  const { maxRow: maxOmrRow, maxCol: maxOmrCol } =
    getMaxOmrLineCount(omrCoordinates);

  const set1 = new Set(drawsDesc.slice(0, 1).flatMap(getDrawNumbers));
  const set3 = new Set(drawsDesc.slice(0, 3).flatMap(getDrawNumbers));
  const set6 = new Set(drawsDesc.slice(0, 6).flatMap(getDrawNumbers));
  const set10 = new Set(drawsDesc.slice(0, 10).flatMap(getDrawNumbers));

  const regressionPrev1 = numbers.filter((n) => set1.has(n));
  const regressionLast3 = numbers.filter((n) => set3.has(n));
  const regressionLast6 = numbers.filter((n) => set6.has(n));
  const regressionLast10 = numbers.filter((n) => set10.has(n));

  const overdueNumbers = numbers.filter(
    (n) => (profilesMap.get(n)?.missCount ?? 0) >= 10,
  );
  const hotNumbers = numbers.filter((n) => {
    const p = profilesMap.get(n);
    return p ? p.isHot120 || p.isHot30 || p.freqAll >= 175 : false;
  });

  let rank1 = 0;
  let rank3 = 0;
  let rank4 = 0;
  let rank5 = 0;

  for (const d of drawsDesc) {
    const dNums = getDrawNumbers(d);
    let matched = 0;
    for (const n of numbers) {
      if (dNums.includes(n)) matched++;
    }
    if (matched === 6) rank1++;
    else if (matched === 5) rank3++;
    else if (matched === 4) rank4++;
    else if (matched === 3) rank5++;
  }

  // Score calculation (Strategy 1: Max 50, Strategy 2: Max 50)
  let s1 = 0;
  const cautions: string[] = [];

  if (high32Count >= 4 && high32Count <= 5) s1 += 18;
  else if (high32Count === 3) s1 += 12;
  else if (high32Count === 6) {
    s1 += 8;
    cautions.push(
      "6개 모두 32~45 구간에 몰려 역발상 수동 쏠림(196회 사례) 주의",
    );
  }

  const birthdayCoreCount = numbers.filter((n) => n <= 12).length;
  if (birthdayCoreCount === 0) s1 += 10;
  else {
    s1 += Math.max(0, 10 - birthdayCoreCount * 5);
    cautions.push(
      `1~12번(월·일 중복 생일 구간) 번호 ${birthdayCoreCount}개 포함`,
    );
  }

  if (sum >= 185 && sum <= 222) s1 += 10;
  else if (sum >= 170 && sum <= 228) s1 += 6;
  else if (sum > 228) {
    s1 += 4;
    cautions.push(
      `번호 총합(${sum})이 228을 초과하여 극단적 우측 하단 쏠림 주의`,
    );
  }

  if (
    consecutivePairs >= 1 &&
    consecutivePairs <= 2 &&
    !hasThreeConsecutive(numbers)
  ) {
    s1 += 6;
  } else if (hasThreeConsecutive(numbers)) {
    cautions.push("3연번 포함으로 수동 패턴 마킹 중복(1152회 사례) 위험");
  }

  if (maxOmrRow <= 2 && maxOmrCol <= 2) {
    s1 += 6;
  } else {
    cautions.push(
      `OMR 용지 동일 행(${maxOmrRow}개) 또는 열(${maxOmrCol}개)에 3개 이상 정렬됨`,
    );
  }

  let s2 = 0;
  if (ac >= 7) s2 += 14;
  else {
    s2 += 4;
    cautions.push(`AC 복잡도(${ac})가 7 미만으로 등차·간격 대칭성 존재`);
  }

  if (maxSameSection <= 2) s2 += 10;
  else {
    s2 += 3;
    cautions.push(
      `동일 5단위 구간에 ${maxSameSection}개 과밀 (최근 120회 출현율 5.8% 희귀 패턴)`,
    );
  }

  if (maxSameEndDigit <= 2) s2 += 8;
  else {
    s2 += 3;
    cautions.push(`동일 끝수 ${maxSameEndDigit}개 중복`);
  }

  if (regressionPrev1.length >= 1 && regressionPrev1.length <= 2) s2 += 8;
  else if (regressionPrev1.length === 0) {
    s2 += 3;
    cautions.push(
      "직전 회차 이월수 미포함 (최근 120회 중 65%가 이월수 1개 이상 포함)",
    );
  }

  if (regressionLast10.length >= 3 && regressionLast10.length <= 5) s2 += 5;
  else if (regressionLast10.length === 6) {
    cautions.push(
      "6개 모두 최근 10회차 출현 번호로 장기 미출현 반등 번호 부재",
    );
  }

  if (overdueNumbers.length >= 1 && hotNumbers.length >= 2) s2 += 5;

  const autoReasons: string[] = [];
  if (regressionPrev1.length > 0) {
    autoReasons.push(
      `전회차(${drawsDesc[0]?.drw_no}회) 이월수 ${regressionPrev1.join(", ")}번 포함`,
    );
  }
  if (hotNumbers.length > 0) {
    autoReasons.push(
      `다빈도 강세 핫볼(${hotNumbers.join(", ")}번) 모멘텀 반영`,
    );
  }
  if (overdueNumbers.length > 0) {
    autoReasons.push(
      `장기 미출현(${overdueNumbers
        .map((n) => `${n}번[${profilesMap.get(n)?.missCount}주]`)
        .join(", ")}) 반등 결합`,
    );
  }
  if (maxOmrRow <= 2 && maxOmrCol <= 2) {
    autoReasons.push("OMR 용지 가로·세로 최대 2개 이하 완전 비대칭 분산");
  }

  return {
    id,
    title,
    subtitle,
    badge,
    numbers,
    sum,
    ac,
    oddEvenRatio,
    highLowRatio,
    high32Count,
    consecutivePairs,
    maxSameEndDigit,
    maxSameSection,
    maxOmrRow,
    maxOmrCol,
    omrCoordinates,
    regressionPrev1,
    regressionLast3,
    regressionLast6,
    regressionLast10,
    overdueNumbers,
    hotNumbers,
    historicalMatches: { rank1, rank3, rank4, rank5 },
    strategy1Score: s1,
    strategy2Score: s2,
    totalScore: s1 + s2,
    reasons:
      customReasons && customReasons.length > 0 ? customReasons : autoReasons,
    cautions,
  };
}

function generateDynamicWeeklySets(
  drawsDesc: LottoDraw[],
  profiles: NumberProfile[],
  profilesMap: Map<number, NumberProfile>,
): StrategySetEvaluation[] {
  const latestDraw = drawsDesc[0];
  const latestNums = latestDraw ? getDrawNumbers(latestDraw) : [];
  const prev2Nums = drawsDesc[1] ? getDrawNumbers(drawsDesc[1]) : [];

  // Pool helpers
  const highPrev1 = latestNums.filter((n) => n >= 32);
  const midPrev1 = latestNums.filter((n) => n >= 16 && n <= 31);
  const carryPrimary =
    highPrev1[0] ??
    midPrev1[midPrev1.length - 1] ??
    latestNums[latestNums.length - 1] ??
    34;
  const carrySecondary =
    highPrev1[1] ?? highPrev1[0] ?? latestNums[latestNums.length - 2] ?? 35;

  // Deterministic pseudo-random candidate search to find optimal 5 sets every week
  // Each archetype has its own scoring objective on top of strict Strategy 1 + Strategy 2 constraints
  const allHigh = profiles
    .filter((p) => p.num >= 32)
    .sort(
      (a, b) =>
        b.freq120 * 2 +
        b.freq30 * 3 +
        b.freqAll * 0.2 -
        (a.freq120 * 2 + a.freq30 * 3 + a.freqAll * 0.2),
    );
  const allMidNonBirthday = profiles
    .filter((p) => p.num >= 13 && p.num <= 31)
    .sort(
      (a, b) =>
        b.freq120 * 2 +
        b.freq30 * 3 +
        a.missCount * 0.5 -
        (a.freq120 * 2 + a.freq30 * 3 + b.missCount * 0.5),
    );
  const overdueHigh = profiles
    .filter((p) => p.num >= 32 && p.missCount >= 8)
    .sort((a, b) => b.missCount - a.missCount);
  const overdueMid = profiles
    .filter((p) => p.num >= 13 && p.num <= 31 && p.missCount >= 10)
    .sort((a, b) => b.missCount - a.missCount);

  function passesHardFilters(
    nums: number[],
    opts: {
      minHigh32: number;
      minConsec: number;
      maxConsec: number;
      minAc: number;
      maxEndDigit?: number;
    },
  ): boolean {
    const sorted = [...nums].sort((a, b) => a - b);
    if (new Set(sorted).size !== 6) return false;
    const h32 = sorted.filter((n) => n >= 32).length;
    if (h32 < opts.minHigh32) return false;
    const sum = calculateSum(sorted);
    if (sum < 192 || sum > 224) return false;
    const consec = countConsecutivePairs(sorted);
    if (consec < opts.minConsec || consec > opts.maxConsec) return false;
    if (hasThreeConsecutive(sorted)) return false;
    const ac = calculateAC(sorted);
    if (ac < opts.minAc) return false;
    const maxSec = countSameSection(sorted) || 1;
    if (maxSec > 2) return false;
    const maxEnd = countSameEndDigit(sorted) || 1;
    if (maxEnd > (opts.maxEndDigit ?? 2)) return false;
    const { maxRow, maxCol } = getMaxOmrLineCount(getOmrCoordinates(sorted));
    if (maxRow > 2 || maxCol > 2) return false;
    const odd = sorted.filter((n) => n % 2 === 1).length;
    if (odd < 2 || odd > 4) return false;
    return true;
  }

  function findBestCombination(params: {
    id: string;
    title: string;
    subtitle: string;
    badge: string;
    seeds: number[];
    candidatePool: number[];
    minHigh32: number;
    minConsec: number;
    maxConsec: number;
    minAc: number;
    maxEndDigit?: number;
    scoreFn: (nums: number[]) => number;
    usedCombinations: Set<string>;
  }): StrategySetEvaluation {
    const {
      id,
      title,
      subtitle,
      badge,
      seeds,
      candidatePool,
      minHigh32,
      minConsec,
      maxConsec,
      minAc,
      maxEndDigit,
      scoreFn,
      usedCombinations,
    } = params;

    const uniqueSeeds = Array.from(new Set(seeds)).filter(
      (n) => n >= 13 && n <= 45,
    );
    const pool = Array.from(new Set([...uniqueSeeds, ...candidatePool])).filter(
      (n) => n >= 13 && n <= 45,
    );

    let bestNums: number[] | null = null;
    let bestScore = -Infinity;

    const nPool = pool.length;
    for (let i1 = 0; i1 < nPool - 5; i1++) {
      for (let i2 = i1 + 1; i2 < nPool - 4; i2++) {
        for (let i3 = i2 + 1; i3 < nPool - 3; i3++) {
          for (let i4 = i3 + 1; i4 < nPool - 2; i4++) {
            for (let i5 = i4 + 1; i5 < nPool - 1; i5++) {
              for (let i6 = i5 + 1; i6 < nPool; i6++) {
                const comb = [
                  pool[i1],
                  pool[i2],
                  pool[i3],
                  pool[i4],
                  pool[i5],
                  pool[i6],
                ].sort((a, b) => a - b);
                const key = comb.join(",");
                if (usedCombinations.has(key)) continue;
                if (
                  !passesHardFilters(comb, {
                    minHigh32,
                    minConsec,
                    maxConsec,
                    minAc,
                    maxEndDigit,
                  })
                ) {
                  continue;
                }
                const sc = scoreFn(comb);
                if (sc > bestScore) {
                  bestScore = sc;
                  bestNums = comb;
                }
              }
            }
          }
        }
      }
    }

    const finalNums = bestNums ?? [18, 29, 34, 38, 39, 45];
    usedCombinations.add(finalNums.join(","));
    return evaluateNumberSet({
      id,
      title,
      subtitle,
      badge,
      numbers: finalNums,
      drawsDesc,
      profilesMap,
    });
  }

  const usedCombinations = new Set<string>();
  const basePool = Array.from(
    new Set([
      ...allHigh.map((p) => p.num),
      ...overdueHigh.map((p) => p.num),
      ...overdueMid.slice(0, 5).map((p) => p.num),
      ...allMidNonBirthday.slice(0, 8).map((p) => p.num),
    ]),
  );

  // Set 1: Momentum + Prev1 Carryover + Overdue Rebound Standard
  const set1 = findBestCombination({
    id: "hybrid-1",
    title: "세트 1 · 모멘텀 & 전회차 회귀 표준형",
    subtitle: "전회차 고번호 이월 1개 + 3~10회차 강세 번호 + 미출현 반등 결합",
    badge: "전략 1+2 밸런스 1위",
    seeds: [carryPrimary],
    candidatePool: basePool,
    minHigh32: 4,
    minConsec: 1,
    maxConsec: 1,
    minAc: 7,
    scoreFn: (nums) => {
      let sc = 0;
      if (nums.includes(carryPrimary)) sc += 50;
      const inPrev1 = nums.filter((n) => latestNums.includes(n)).length;
      if (inPrev1 === 1) sc += 30;
      const inPrev2 = nums.filter((n) => prev2Nums.includes(n)).length;
      if (inPrev2 >= 1 && inPrev2 <= 2) sc += 25;
      for (const n of nums) {
        const p = profilesMap.get(n)!;
        sc += p.freqAll * 0.25 + p.freq120 * 1.2 + p.freq30 * 1.5;
        if (p.missCount >= 12) sc += 18;
      }
      if (nums.filter((n) => n % 2 === 1).length === 3) sc += 15;
      return sc;
    },
    usedCombinations,
  });

  // Set 2: Double Consecutive High Numbers + 120-Draw Hot Leader
  const hot120MidLeader = allMidNonBirthday.find((p) => p.num >= 23)?.num ?? 27;
  const set2 = findBestCombination({
    id: "hybrid-2",
    title: "세트 2 · 고번호 이중연번 & 핫볼 집중형",
    subtitle:
      "생일 구간(1~22) 완전 배제 + 30·40번대 연번 2쌍 + 120회 최다출 결합",
    badge: "수동 회피 극대화",
    seeds: [hot120MidLeader, carryPrimary],
    candidatePool: basePool.filter((n) => n >= 23),
    minHigh32: 5,
    minConsec: 2,
    maxConsec: 2,
    minAc: 7,
    scoreFn: (nums) => {
      let sc = 0;
      if (nums.includes(hot120MidLeader)) sc += 45;
      if (nums.includes(carryPrimary)) sc += 35;
      for (const n of nums) {
        const p = profilesMap.get(n)!;
        sc += p.freq120 * 1.5 + p.freq30 * 2.0;
        if (p.missCount >= 10) sc += 15;
      }
      return sc;
    },
    usedCombinations,
  });

  // Set 3: Long-Absent Overdue Rebound + Carryover
  const topOverdue1 = overdueMid[0]?.num ?? 17;
  const topOverdue2 = overdueMid[1]?.num ?? 30;
  const set3 = findBestCombination({
    id: "hybrid-3",
    title: "세트 3 · 장기 미출현 반등 & 이월 결합형",
    subtitle: "12~25주 이상 장기 미출현 콜드볼 반등 압력 + 전회차 연번 이월",
    badge: "평균회귀 특화",
    seeds: [topOverdue1, topOverdue2, carrySecondary],
    candidatePool: basePool,
    minHigh32: 4,
    minConsec: 1,
    maxConsec: 1,
    minAc: 8,
    scoreFn: (nums) => {
      let sc = 0;
      if (nums.includes(topOverdue1)) sc += 45;
      if (nums.includes(topOverdue2)) sc += 40;
      if (nums.includes(carrySecondary)) sc += 40;
      for (const n of nums) {
        const p = profilesMap.get(n)!;
        sc += p.missCount * 2.2 + p.freqAll * 0.15;
      }
      if (nums.filter((n) => n % 2 === 1).length === 3) sc += 15;
      return sc;
    },
    usedCombinations,
  });

  // Set 4: High Complexity AC >= 9 & Unique End Digits (6 distinct end digits)
  const set4 = findBestCombination({
    id: "hybrid-4",
    title: "세트 4 · 고복잡도(AC 9+) & 끝자리 완전분산형",
    subtitle: "6개 번호 끝자리 전원 불일치 + 고번호 5개 + OMR 완전 비대칭",
    badge: "최고 산술복잡도",
    seeds: [carryPrimary, 18, 45],
    candidatePool: basePool,
    minHigh32: 5,
    minConsec: 1,
    maxConsec: 1,
    minAc: 9,
    maxEndDigit: 1,
    scoreFn: (nums) => {
      let sc = 0;
      if (nums.includes(carryPrimary)) sc += 35;
      const ac = calculateAC(nums);
      sc += ac * 15;
      for (const n of nums) {
        const p = profilesMap.get(n)!;
        sc += p.freqAll * 0.3 + p.missCount * 0.8;
      }
      return sc;
    },
    usedCombinations,
  });

  // Set 5: Short-Term 30-Draw Surge Momentum + Double Consecutive
  const hot30Leader =
    profiles
      .filter((p) => p.num >= 13 && p.num <= 28)
      .sort((a, b) => b.freq30 - a.freq30 || b.freq120 - a.freq120)[0]?.num ??
    13;
  const set5 = findBestCombination({
    id: "hybrid-5",
    title: "세트 5 · 단기(30회) 초강세 추세 추종형",
    subtitle: "최근 30회차 최다 출현 핫볼 트리오 + 30·40번대 이중연번 배치",
    badge: "단기 모멘텀 1위",
    seeds: [hot30Leader, carryPrimary, carrySecondary],
    candidatePool: basePool,
    minHigh32: 5,
    minConsec: 2,
    maxConsec: 2,
    minAc: 8,
    scoreFn: (nums) => {
      let sc = 0;
      if (nums.includes(hot30Leader)) sc += 45;
      if (nums.includes(carryPrimary)) sc += 35;
      for (const n of nums) {
        const p = profilesMap.get(n)!;
        sc += p.freq30 * 6.0 + p.freq120 * 1.0;
      }
      if (nums.filter((n) => n % 2 === 1).length === 3) sc += 15;
      return sc;
    },
    usedCombinations,
  });

  return [set1, set2, set3, set4, set5];
}

export function buildWeeklyStrategyLabData(
  allDrawsInput: LottoDraw[],
): WeeklyStrategyLabResponse {
  const drawsDesc = [...allDrawsInput].sort((a, b) => b.drw_no - a.drw_no);
  const latestDraw = drawsDesc[0];
  const latestNumbers = latestDraw ? getDrawNumbers(latestDraw) : [];
  const totalDraws = drawsDesc.length;

  // 1. Build Number Profiles (1..45)
  const draws120 = drawsDesc.slice(0, 120);
  const draws30 = drawsDesc.slice(0, 30);

  const setPrev1 = new Set(drawsDesc.slice(0, 1).flatMap(getDrawNumbers));
  const setPrev3 = new Set(drawsDesc.slice(0, 3).flatMap(getDrawNumbers));
  const setPrev6 = new Set(drawsDesc.slice(0, 6).flatMap(getDrawNumbers));
  const setPrev10 = new Set(drawsDesc.slice(0, 10).flatMap(getDrawNumbers));

  const freqAll: Record<number, number> = {};
  const freq120: Record<number, number> = {};
  const freq30: Record<number, number> = {};
  const freq10: Record<number, number> = {};
  const missCount: Record<number, number> = {};

  for (let n = 1; n <= 45; n++) {
    freqAll[n] = 0;
    freq120[n] = 0;
    freq30[n] = 0;
    freq10[n] = 0;
    missCount[n] = totalDraws;
  }

  drawsDesc.forEach((d, idx) => {
    const nums = getDrawNumbers(d);
    for (const n of nums) {
      freqAll[n]++;
      if (idx < 120) freq120[n]++;
      if (idx < 30) freq30[n]++;
      if (idx < 10) freq10[n]++;
      if (missCount[n] === totalDraws) {
        missCount[n] = idx;
      }
    }
  });

  const numberProfiles: NumberProfile[] = [];
  const profilesMap = new Map<number, NumberProfile>();

  for (let n = 1; n <= 45; n++) {
    const profile: NumberProfile = {
      num: n,
      missCount: missCount[n],
      freqAll: freqAll[n],
      freq120: freq120[n],
      freq30: freq30[n],
      freq10: freq10[n],
      inPrev1: setPrev1.has(n),
      inPrev3: setPrev3.has(n),
      inPrev6: setPrev6.has(n),
      inPrev10: setPrev10.has(n),
      isHot120: freq120[n] >= 19,
      isHot30: freq30[n] >= 6,
      isOverdue: missCount[n] >= 12,
    };
    numberProfiles.push(profile);
    profilesMap.set(n, profile);
  }

  // 2. Strategy 1 Empirical Analysis (Recent 500 draws with valid prize info)
  const validRecent500 = drawsDesc
    .filter(
      (d) => (d.first_przwner_co ?? 0) > 0 && Number(d.first_win_amnt) > 0,
    )
    .slice(0, 500);

  const drawsWithWinType = drawsDesc.filter(
    (d) =>
      (d.win_type_auto ?? 0) +
        (d.win_type_manual ?? 0) +
        (d.win_type_semi_auto ?? 0) >
      0,
  );

  let totalW = 0;
  let totalAuto = 0;
  let totalMan = 0;
  let totalSemi = 0;
  for (const d of drawsWithWinType) {
    totalAuto += d.win_type_auto ?? 0;
    totalMan += d.win_type_manual ?? 0;
    totalSemi += d.win_type_semi_auto ?? 0;
    totalW += d.first_przwner_co ?? 0;
  }

  const lowMidSumWinType = drawsWithWinType.filter(
    (d) => calculateSum(getDrawNumbers(d)) <= 165,
  );
  const highSumWinType = drawsWithWinType.filter(
    (d) => calculateSum(getDrawNumbers(d)) >= 166,
  );

  const lowMidSumManualAvg =
    lowMidSumWinType.length > 0
      ? Number(
          (
            lowMidSumWinType.reduce(
              (acc, d) => acc + (d.win_type_manual ?? 0),
              0,
            ) / lowMidSumWinType.length
          ).toFixed(2),
        )
      : 0;
  const highSumManualAvg =
    highSumWinType.length > 0
      ? Number(
          (
            highSumWinType.reduce(
              (acc, d) => acc + (d.win_type_manual ?? 0),
              0,
            ) / highSumWinType.length
          ).toFixed(2),
        )
      : 0;

  function makeBucket(
    label: string,
    subset: LottoDraw[],
    totalRef: number,
  ): StrategyEmpiricalBucket {
    if (subset.length === 0) {
      return {
        label,
        drawCount: 0,
        ratioPct: 0,
        avgWinners: 0,
        avgPrizeEok: 0,
      };
    }
    const avgWinners =
      subset.reduce((acc, d) => acc + (d.first_przwner_co ?? 0), 0) /
      subset.length;
    const avgPrizeEok =
      subset.reduce((acc, d) => acc + Number(d.first_win_amnt ?? 0) / 1e8, 0) /
      subset.length;
    const withMan = subset.filter(
      (d) =>
        (d.win_type_auto ?? 0) +
          (d.win_type_manual ?? 0) +
          (d.win_type_semi_auto ?? 0) >
        0,
    );
    const avgManualWinners =
      withMan.length > 0
        ? Number(
            (
              withMan.reduce((acc, d) => acc + (d.win_type_manual ?? 0), 0) /
              withMan.length
            ).toFixed(2),
          )
        : undefined;

    return {
      label,
      drawCount: subset.length,
      ratioPct: Number(((subset.length / totalRef) * 100).toFixed(1)),
      avgWinners: Number(avgWinners.toFixed(2)),
      avgPrizeEok: Number(avgPrizeEok.toFixed(2)),
      avgManualWinners,
    };
  }

  const byHigh32Count: StrategyEmpiricalBucket[] = [
    makeBucket(
      "32~45번 0개 (전부 생일구간 1~31)",
      validRecent500.filter(
        (d) => getDrawNumbers(d).filter((n) => n >= 32).length === 0,
      ),
      validRecent500.length,
    ),
    makeBucket(
      "32~45번 1~2개 (표준 분포)",
      validRecent500.filter((d) => {
        const c = getDrawNumbers(d).filter((n) => n >= 32).length;
        return c === 1 || c === 2;
      }),
      validRecent500.length,
    ),
    makeBucket(
      "32~45번 3개 (중고번호 우세)",
      validRecent500.filter(
        (d) => getDrawNumbers(d).filter((n) => n >= 32).length === 3,
      ),
      validRecent500.length,
    ),
    makeBucket(
      "32~45번 4개 이상 (비선호 타겟 구간)",
      validRecent500.filter(
        (d) => getDrawNumbers(d).filter((n) => n >= 32).length >= 4,
      ),
      validRecent500.length,
    ),
  ];

  const bySumBracket: StrategyEmpiricalBucket[] = [
    makeBucket(
      "합계 ≤ 100 (초저합 · 생일 밀집)",
      validRecent500.filter((d) => calculateSum(getDrawNumbers(d)) <= 100),
      validRecent500.length,
    ),
    makeBucket(
      "합계 101 ~ 140 (중저합)",
      validRecent500.filter((d) => {
        const s = calculateSum(getDrawNumbers(d));
        return s >= 101 && s <= 140;
      }),
      validRecent500.length,
    ),
    makeBucket(
      "합계 141 ~ 179 (중고합)",
      validRecent500.filter((d) => {
        const s = calculateSum(getDrawNumbers(d));
        return s >= 141 && s <= 179;
      }),
      validRecent500.length,
    ),
    makeBucket(
      "합계 ≥ 180 (고합계 비선호 타겟)",
      validRecent500.filter((d) => calculateSum(getDrawNumbers(d)) >= 180),
      validRecent500.length,
    ),
  ];

  // 3. Strategy 2 Statistical Metrics
  const expAll = (totalDraws * 6) / 45;
  let chiSqAll = 0;
  for (let i = 1; i <= 45; i++) {
    chiSqAll += Math.pow(freqAll[i] - expAll, 2) / expAll;
  }

  const exp120 = (draws120.length * 6) / 45;
  let chiSq120 = 0;
  for (let i = 1; i <= 45; i++) {
    chiSq120 += Math.pow(freq120[i] - exp120, 2) / exp120;
  }

  const meanSumAll =
    totalDraws > 0
      ? Number(
          (
            drawsDesc.reduce(
              (acc, d) => acc + calculateSum(getDrawNumbers(d)),
              0,
            ) / totalDraws
          ).toFixed(2),
        )
      : 138;
  const meanSum120 =
    draws120.length > 0
      ? Number(
          (
            draws120.reduce(
              (acc, d) => acc + calculateSum(getDrawNumbers(d)),
              0,
            ) / draws120.length
          ).toFixed(2),
        )
      : 138;
  const meanSum30 =
    draws30.length > 0
      ? Number(
          (
            draws30.reduce(
              (acc, d) => acc + calculateSum(getDrawNumbers(d)),
              0,
            ) / draws30.length
          ).toFixed(2),
        )
      : 138;
  const meanAcAll =
    totalDraws > 0
      ? Number(
          (
            drawsDesc.reduce(
              (acc, d) => acc + calculateAC(getDrawNumbers(d)),
              0,
            ) / totalDraws
          ).toFixed(2),
        )
      : 8.06;

  // Regression stats on recent 120 draws
  let prev1HasAnyCount = 0;
  let prev1Total = 0;
  let last3Total = 0;
  let last10Total = 0;
  let sectionCap2Count = 0;
  const regWindow = Math.min(120, Math.max(0, drawsDesc.length - 10));

  for (let idx = 0; idx < regWindow; idx++) {
    const nums = getDrawNumbers(drawsDesc[idx]);
    const s1 = new Set(getDrawNumbers(drawsDesc[idx + 1]));
    const s3 = new Set(
      drawsDesc.slice(idx + 1, idx + 4).flatMap(getDrawNumbers),
    );
    const s10 = new Set(
      drawsDesc.slice(idx + 1, idx + 11).flatMap(getDrawNumbers),
    );

    const c1 = nums.filter((n) => s1.has(n)).length;
    const c3 = nums.filter((n) => s3.has(n)).length;
    const c10 = nums.filter((n) => s10.has(n)).length;

    if (c1 > 0) prev1HasAnyCount++;
    prev1Total += c1;
    last3Total += c3;
    last10Total += c10;

    if ((countSameSection(nums) || 1) <= 2) {
      sectionCap2Count++;
    }
  }

  // 4. Recommended Dynamic Sets & Reference Sets
  const recommendedSets = generateDynamicWeeklySets(
    drawsDesc,
    numberProfiles,
    profilesMap,
  );

  const referenceSets: StrategySetEvaluation[] = [
    evaluateNumberSet({
      id: "ref-a",
      title: "참고 조합 A · 극단적 고번호 + 연번형",
      subtitle: "생일 범위 배제 5개 + 34-35, 41-42 이중 연번",
      badge: "참고 문서 A",
      numbers: [19, 34, 35, 41, 42, 45],
      drawsDesc,
      profilesMap,
    }),
    evaluateNumberSet({
      id: "ref-b",
      title: "참고 조합 B · 비인기 소수 + 후반부 밀집형",
      subtitle: "20대 후반 소수(23, 29) + 30·40대 연번 결합",
      badge: "참고 문서 B",
      numbers: [23, 29, 37, 38, 43, 44],
      drawsDesc,
      profilesMap,
    }),
    evaluateNumberSet({
      id: "ref-c",
      title: "참고 조합 C · 초고합계형 (합계 229)",
      subtitle: "전 번호 31번 이상 + 31-32, 39-40 연번 배치",
      badge: "참고 문서 C",
      numbers: [31, 32, 39, 40, 42, 45],
      drawsDesc,
      profilesMap,
    }),
    evaluateNumberSet({
      id: "ref-d",
      title: "참고 조합 D · 비선호 끝자리 완전분산형",
      subtitle: "끝자리 전원 불일치(AC 9) + 하단부 비대칭 배열",
      badge: "참고 문서 D (최고점)",
      numbers: [18, 33, 34, 39, 41, 45],
      drawsDesc,
      profilesMap,
    }),
    evaluateNumberSet({
      id: "ref-e",
      title: "참고 조합 E · 불규칙 고번호형",
      subtitle: "35-36 연번 포함 + 40번대 3개 배치",
      badge: "참고 문서 E",
      numbers: [26, 35, 36, 40, 43, 45],
      drawsDesc,
      profilesMap,
    }),
  ];

  return {
    baseDraw: {
      drawNo: latestDraw?.drw_no ?? 0,
      drawDate: latestDraw?.drw_no_date ?? "-",
      numbers: latestNumbers,
      bonusNo: latestDraw?.bnus_no ?? 0,
      sum: latestNumbers.length ? calculateSum(latestNumbers) : 0,
      ac: latestNumbers.length ? calculateAC(latestNumbers) : 0,
      oddEvenRatio: latestNumbers.length
        ? getOddEvenRatio(latestNumbers)
        : "3:3",
      high32Count: latestNumbers.filter((n) => n >= 32).length,
      firstWinners: latestDraw?.first_przwner_co ?? 0,
      firstPrizeEok: Number(
        (Number(latestDraw?.first_win_amnt ?? 0) / 1e8).toFixed(2),
      ),
      autoWinners: latestDraw?.win_type_auto ?? 0,
      manualWinners: latestDraw?.win_type_manual ?? 0,
      semiAutoWinners: latestDraw?.win_type_semi_auto ?? 0,
    },
    targetDrawNo: (latestDraw?.drw_no ?? 0) + 1,
    totalAnalyzedDraws: totalDraws,
    strategy1Insights: {
      recentDrawCount: validRecent500.length,
      autoManualStats: {
        analyzedDraws: drawsWithWinType.length,
        totalWinners: totalW,
        autoRatioPct:
          totalW > 0 ? Number(((totalAuto / totalW) * 100).toFixed(1)) : 70.6,
        manualRatioPct:
          totalW > 0 ? Number(((totalMan / totalW) * 100).toFixed(1)) : 25.4,
        semiAutoRatioPct:
          totalW > 0 ? Number(((totalSemi / totalW) * 100).toFixed(1)) : 4.0,
        lowMidSumManualAvg,
        highSumManualAvg,
      },
      byHigh32Count,
      bySumBracket,
      trapExamples: [
        {
          drawNo: 1128,
          drawDate: "2024-07-13",
          numbers: [1, 5, 8, 16, 28, 33],
          sum: 91,
          high32Count: 1,
          winners: 63,
          prizeEok: 4.2,
          reason: "생일 구간(1~31) 5개 밀집 + 저합계(91)로 수동 당첨자 대폭발",
        },
        {
          drawNo: 1152,
          drawDate: "2024-12-28",
          numbers: [30, 31, 32, 35, 36, 37],
          sum: 201,
          high32Count: 4,
          winners: 35,
          prizeEok: 8.74,
          reason:
            "고번호(합 201)임에도 3연번 2묶음(30-31-32, 35-36-37) 줄세우기 수동 중복",
        },
        {
          drawNo: 196,
          drawDate: "2006-09-02",
          numbers: [35, 36, 37, 41, 44, 45],
          sum: 238,
          high32Count: 6,
          winners: 15,
          prizeEok: 7.28,
          reason: "6개 전부 35~45 하단 끝에 몰아 찍은 역발상 패턴족 중복",
        },
      ],
      jackpotExamples: [
        {
          drawNo: 1018,
          drawDate: "2022-06-04",
          numbers: [3, 19, 21, 25, 37, 45],
          sum: 150,
          high32Count: 2,
          winners: 2,
          prizeEok: 123.62,
          reason:
            "비선호 소수(19, 37) + 45번 끝수 결합으로 1등 단 2명 (123.6억)",
        },
        {
          drawNo: 778,
          drawDate: "2017-10-28",
          numbers: [6, 21, 35, 36, 37, 41],
          sum: 176,
          high32Count: 4,
          winners: 3,
          prizeEok: 62.64,
          reason: "32~45번 4개 포함 + 불규칙 간격으로 1등 3명 (62.6억)",
        },
        {
          drawNo: 1208,
          drawDate: "2026-01-24",
          numbers: [6, 27, 30, 36, 38, 42],
          sum: 179,
          high32Count: 3,
          winners: 6,
          manualWinners: 0,
          prizeEok: 50.02,
          reason:
            "수동·반자동 당첨자 0명 (자동만 6명 당첨)으로 1인당 50.0억 수령",
        },
      ],
    },
    strategy2Insights: {
      chiSquareAll: Number(chiSqAll.toFixed(2)),
      chiSquare120: Number(chiSq120.toFixed(2)),
      meanSumAll,
      meanSum120,
      meanSum30,
      meanAcAll,
      prev1CarryoverRate120Pct:
        regWindow > 0
          ? Number(((prev1HasAnyCount / regWindow) * 100).toFixed(1))
          : 65.0,
      avgPrev1Carryover120:
        regWindow > 0 ? Number((prev1Total / regWindow).toFixed(2)) : 0.83,
      avgLast3Carryover120:
        regWindow > 0 ? Number((last3Total / regWindow).toFixed(2)) : 1.93,
      avgLast10Carryover120:
        regWindow > 0 ? Number((last10Total / regWindow).toFixed(2)) : 4.56,
      sectionCap2Rate120Pct:
        regWindow > 0
          ? Number(((sectionCap2Count / regWindow) * 100).toFixed(1))
          : 94.2,
      hotAllTop: [...numberProfiles]
        .sort((a, b) => b.freqAll - a.freqAll)
        .slice(0, 8),
      hot120Top: [...numberProfiles]
        .sort((a, b) => b.freq120 - a.freq120 || b.freqAll - a.freqAll)
        .slice(0, 8),
      hot30Top: [...numberProfiles]
        .sort((a, b) => b.freq30 - a.freq30 || b.freq120 - a.freq120)
        .slice(0, 8),
      hotHigh32Top: numberProfiles
        .filter((p) => p.num >= 32)
        .sort(
          (a, b) =>
            b.freq120 * 2 +
            b.freq30 * 3 +
            b.freqAll * 0.2 -
            (a.freq120 * 2 + a.freq30 * 3 + a.freqAll * 0.2),
        )
        .slice(0, 8),
      overdueTop: [...numberProfiles]
        .sort((a, b) => b.missCount - a.missCount)
        .slice(0, 10),
      prev1Numbers: numberProfiles.filter((p) => p.inPrev1),
    },
    recommendedSets,
    referenceSets,
    numberProfiles,
  };
}
