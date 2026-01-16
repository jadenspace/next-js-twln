/**
 * 동적 프로그래밍 기반 조합 수 계산 서비스
 * 수학적 성질(소수, 배수 등)을 가진 조합의 개수를 정확히 계산
 */

/**
 * 1-45 범위의 소수 목록 (14개)
 */
const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43];
const PRIME_SET = new Set(PRIMES);

/**
 * 1-45 범위의 3의 배수 목록 (15개)
 */
const MULTIPLES_OF_3 = [
  3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45,
];
const MULTIPLES_OF_3_SET = new Set(MULTIPLES_OF_3);

/**
 * 1-45 범위의 5의 배수 목록 (9개)
 */
const MULTIPLES_OF_5 = [5, 10, 15, 20, 25, 30, 35, 40, 45];
const MULTIPLES_OF_5_SET = new Set(MULTIPLES_OF_5);

/**
 * 동적 프로그래밍 기반 조합 수 계산 클래스
 */
export class DPCombinationCounter {
  // 캐시: 이미 계산된 결과 저장
  private primeCountCache = new Map<string, number>();
  private mult3CountCache = new Map<string, number>();
  private mult5CountCache = new Map<string, number>();

  /**
   * 소수 개수 범위에 해당하는 조합 수 계산
   * @param minPrimes 최소 소수 개수 (0-6)
   * @param maxPrimes 최대 소수 개수 (0-6)
   * @param excludedNumbers 제외할 번호 (고정 번호 등)
   * @returns 정확한 조합 수
   */
  countPrimeCombinations(
    minPrimes: number,
    maxPrimes: number,
    excludedNumbers: number[] = [],
  ): number {
    // 캐시 키 생성
    const cacheKey = `${minPrimes}-${maxPrimes}-${excludedNumbers.sort().join(",")}`;
    if (this.primeCountCache.has(cacheKey)) {
      return this.primeCountCache.get(cacheKey)!;
    }

    const excludedSet = new Set(excludedNumbers);

    // 사용 가능한 번호 분류
    const availablePrimes = PRIMES.filter((n) => !excludedSet.has(n));
    const availableComposites = Array.from(
      { length: 45 },
      (_, i) => i + 1,
    ).filter((n) => !PRIME_SET.has(n) && !excludedSet.has(n));

    const primeCount = availablePrimes.length;
    const compositeCount = availableComposites.length;
    const selectCount = 6 - excludedNumbers.length;

    if (selectCount < 0 || selectCount > 6) {
      return 0;
    }

    // DP: dp[선택한 소수 개수] = 조합 수
    // 소수와 합성수를 독립적으로 선택
    let totalCount = 0;

    for (
      let primes = minPrimes;
      primes <= Math.min(maxPrimes, selectCount);
      primes++
    ) {
      const composites = selectCount - primes;

      if (primes < 0 || primes > primeCount) continue;
      if (composites < 0 || composites > compositeCount) continue;

      // C(primeCount, primes) × C(compositeCount, composites)
      const count =
        this.combination(primeCount, primes) *
        this.combination(compositeCount, composites);
      totalCount += count;
    }

    this.primeCountCache.set(cacheKey, totalCount);
    return totalCount;
  }

  /**
   * 3의 배수 개수 범위에 해당하는 조합 수 계산
   * @param minMult3 최소 3의 배수 개수 (0-6)
   * @param maxMult3 최대 3의 배수 개수 (0-6)
   * @param excludedNumbers 제외할 번호
   * @returns 정확한 조합 수
   */
  countMultiplesOf3Combinations(
    minMult3: number,
    maxMult3: number,
    excludedNumbers: number[] = [],
  ): number {
    const cacheKey = `${minMult3}-${maxMult3}-${excludedNumbers.sort().join(",")}`;
    if (this.mult3CountCache.has(cacheKey)) {
      return this.mult3CountCache.get(cacheKey)!;
    }

    const excludedSet = new Set(excludedNumbers);

    // 사용 가능한 번호 분류
    const availableMult3 = MULTIPLES_OF_3.filter((n) => !excludedSet.has(n));
    const availableNonMult3 = Array.from(
      { length: 45 },
      (_, i) => i + 1,
    ).filter((n) => !MULTIPLES_OF_3_SET.has(n) && !excludedSet.has(n));

    const mult3Count = availableMult3.length;
    const nonMult3Count = availableNonMult3.length;
    const selectCount = 6 - excludedNumbers.length;

    if (selectCount < 0 || selectCount > 6) {
      return 0;
    }

    let totalCount = 0;

    for (
      let mult3 = minMult3;
      mult3 <= Math.min(maxMult3, selectCount);
      mult3++
    ) {
      const nonMult3 = selectCount - mult3;

      if (mult3 < 0 || mult3 > mult3Count) continue;
      if (nonMult3 < 0 || nonMult3 > nonMult3Count) continue;

      const count =
        this.combination(mult3Count, mult3) *
        this.combination(nonMult3Count, nonMult3);
      totalCount += count;
    }

    this.mult3CountCache.set(cacheKey, totalCount);
    return totalCount;
  }

  /**
   * 5의 배수 개수 범위에 해당하는 조합 수 계산
   * @param minMult5 최소 5의 배수 개수 (0-6)
   * @param maxMult5 최대 5의 배수 개수 (0-6)
   * @param excludedNumbers 제외할 번호
   * @returns 정확한 조합 수
   */
  countMultiplesOf5Combinations(
    minMult5: number,
    maxMult5: number,
    excludedNumbers: number[] = [],
  ): number {
    const cacheKey = `${minMult5}-${maxMult5}-${excludedNumbers.sort().join(",")}`;
    if (this.mult5CountCache.has(cacheKey)) {
      return this.mult5CountCache.get(cacheKey)!;
    }

    const excludedSet = new Set(excludedNumbers);

    // 사용 가능한 번호 분류
    const availableMult5 = MULTIPLES_OF_5.filter((n) => !excludedSet.has(n));
    const availableNonMult5 = Array.from(
      { length: 45 },
      (_, i) => i + 1,
    ).filter((n) => !MULTIPLES_OF_5_SET.has(n) && !excludedSet.has(n));

    const mult5Count = availableMult5.length;
    const nonMult5Count = availableNonMult5.length;
    const selectCount = 6 - excludedNumbers.length;

    if (selectCount < 0 || selectCount > 6) {
      return 0;
    }

    let totalCount = 0;

    for (
      let mult5 = minMult5;
      mult5 <= Math.min(maxMult5, selectCount);
      mult5++
    ) {
      const nonMult5 = selectCount - mult5;

      if (mult5 < 0 || mult5 > mult5Count) continue;
      if (nonMult5 < 0 || nonMult5 > nonMult5Count) continue;

      const count =
        this.combination(mult5Count, mult5) *
        this.combination(nonMult5Count, nonMult5);
      totalCount += count;
    }

    this.mult5CountCache.set(cacheKey, totalCount);
    return totalCount;
  }

  /**
   * 소수 개수와 3의 배수 개수를 동시에 고려한 조합 수 계산
   * 주의: 소수와 3의 배수는 독립적이지 않음 (3은 소수이면서 3의 배수)
   * @param primeRange [min, max]
   * @param mult3Range [min, max]
   * @param excludedNumbers 제외할 번호
   * @returns 정확한 조합 수
   */
  countPrimeAndMult3Combinations(
    primeRange: [number, number],
    mult3Range: [number, number],
    excludedNumbers: number[] = [],
  ): number {
    const excludedSet = new Set(excludedNumbers);
    const selectCount = 6 - excludedNumbers.length;

    if (selectCount < 0 || selectCount > 6) {
      return 0;
    }

    // 4개 그룹으로 분류:
    // 1. 소수 & 3의 배수: [3] (1개)
    // 2. 소수 & 비3의 배수: [2,5,7,11,13,17,19,23,29,31,37,41,43] (13개)
    // 3. 비소수 & 3의 배수: [6,9,12,15,18,21,24,27,30,33,36,39,42,45] (14개)
    // 4. 비소수 & 비3의 배수: 나머지 (17개)

    const primeMult3 = [3].filter((n) => !excludedSet.has(n));
    const primeNonMult3 = PRIMES.filter((n) => n !== 3 && !excludedSet.has(n));
    const nonPrimeMult3 = MULTIPLES_OF_3.filter(
      (n) => !PRIME_SET.has(n) && !excludedSet.has(n),
    );
    const nonPrimeNonMult3 = Array.from({ length: 45 }, (_, i) => i + 1).filter(
      (n) =>
        !PRIME_SET.has(n) && !MULTIPLES_OF_3_SET.has(n) && !excludedSet.has(n),
    );

    let totalCount = 0;

    // a, b, c, d를 선택 (각 그룹에서 선택할 개수)
    for (let a = 0; a <= Math.min(primeMult3.length, selectCount); a++) {
      for (
        let b = 0;
        b <= Math.min(primeNonMult3.length, selectCount - a);
        b++
      ) {
        for (
          let c = 0;
          c <= Math.min(nonPrimeMult3.length, selectCount - a - b);
          c++
        ) {
          const d = selectCount - a - b - c;

          if (d < 0 || d > nonPrimeNonMult3.length) continue;

          // 제약 조건 확인
          const primeCount = a + b;
          const mult3Count = a + c;

          if (primeCount < primeRange[0] || primeCount > primeRange[1])
            continue;
          if (mult3Count < mult3Range[0] || mult3Count > mult3Range[1])
            continue;

          // 조합 수 계산
          const count =
            this.combination(primeMult3.length, a) *
            this.combination(primeNonMult3.length, b) *
            this.combination(nonPrimeMult3.length, c) *
            this.combination(nonPrimeNonMult3.length, d);

          totalCount += count;
        }
      }
    }

    return totalCount;
  }

  /**
   * 조합 공식 C(n, k)
   */
  private combination(n: number, k: number): number {
    if (k < 0 || k > n) return 0;
    if (k === 0 || k === n) return 1;

    k = Math.min(k, n - k);

    let result = 1;
    for (let i = 0; i < k; i++) {
      result *= n - i;
      result /= i + 1;
    }

    return Math.round(result);
  }

  /**
   * 번호 총합 범위에 해당하는 조합 수 계산 (DP)
   * @param minSum 최소 총합
   * @param maxSum 최대 총합
   * @param excludedNumbers 제외할 번호
   * @returns 정확한 조합 수
   */
  countSumRangeCombinations(
    minSum: number,
    maxSum: number,
    excludedNumbers: number[] = [],
  ): number {
    const excludedSet = new Set(excludedNumbers);
    const availableNumbers = Array.from({ length: 45 }, (_, i) => i + 1).filter(
      (n) => !excludedSet.has(n),
    );

    const selectCount = 6 - excludedNumbers.length;
    if (selectCount <= 0) {
      // 이미 6개 선택됨 - 총합 확인
      const sum = excludedNumbers.reduce((a, b) => a + b, 0);
      return sum >= minSum && sum <= maxSum ? 1 : 0;
    }

    // DP: dp[i][j][s] = i번째 번호까지 고려, j개 선택, 총합 s
    // 메모리 최적화: Map으로 필요한 상태만 저장
    const dp = new Map<string, number>();

    const getKey = (idx: number, selected: number, sum: number) =>
      `${idx},${selected},${sum}`;

    const solve = (idx: number, selected: number, sum: number): number => {
      // 종료 조건
      if (selected === selectCount) {
        return sum >= minSum && sum <= maxSum ? 1 : 0;
      }

      // 남은 번호로 선택 불가능
      if (idx >= availableNumbers.length) {
        return 0;
      }

      // 남은 번호가 부족
      if (availableNumbers.length - idx < selectCount - selected) {
        return 0;
      }

      // 캐시 확인
      const key = getKey(idx, selected, sum);
      if (dp.has(key)) {
        return dp.get(key)!;
      }

      // 현재 번호 선택 or 미선택
      const currentNum = availableNumbers[idx];
      const count =
        solve(idx + 1, selected + 1, sum + currentNum) + // 선택
        solve(idx + 1, selected, sum); // 미선택

      dp.set(key, count);
      return count;
    };

    return solve(0, 0, 0);
  }

  /**
   * AC값 (Arithmetic Complexity) 범위에 해당하는 조합 수 계산
   * AC = (최대값 - 최소값) - 5
   * @param minAC 최소 AC값
   * @param maxAC 최대 AC값
   * @param excludedNumbers 제외할 번호
   * @returns 정확한 조합 수
   */
  countACRangeCombinations(
    minAC: number,
    maxAC: number,
    excludedNumbers: number[] = [],
  ): number {
    const excludedSet = new Set(excludedNumbers);
    const availableNumbers = Array.from({ length: 45 }, (_, i) => i + 1).filter(
      (n) => !excludedSet.has(n),
    );

    const selectCount = 6 - excludedNumbers.length;
    if (selectCount <= 0) {
      // 이미 6개 선택됨 - AC값 확인
      const sorted = excludedNumbers.slice().sort((a, b) => a - b);
      const ac = sorted[sorted.length - 1] - sorted[0] - 5;
      return ac >= minAC && ac <= maxAC ? 1 : 0;
    }

    // DP: dp[i][j][min][max] = 조합 수
    // 메모리 최적화: Map으로 필요한 상태만 저장
    const dp = new Map<string, number>();

    const getKey = (idx: number, selected: number, min: number, max: number) =>
      `${idx},${selected},${min},${max}`;

    const solve = (
      idx: number,
      selected: number,
      min: number,
      max: number,
    ): number => {
      // 종료 조건
      if (selected === selectCount) {
        const ac = max - min - 5;
        return ac >= minAC && ac <= maxAC ? 1 : 0;
      }

      // 남은 번호로 선택 불가능
      if (idx >= availableNumbers.length) {
        return 0;
      }

      // 남은 번호가 부족
      if (availableNumbers.length - idx < selectCount - selected) {
        return 0;
      }

      // 캐시 확인
      const key = getKey(idx, selected, min, max);
      if (dp.has(key)) {
        return dp.get(key)!;
      }

      // 현재 번호 선택 or 미선택
      const currentNum = availableNumbers[idx];

      let count = 0;

      // 선택: min/max 업데이트
      const newMin = Math.min(min, currentNum);
      const newMax = Math.max(max, currentNum);
      count += solve(idx + 1, selected + 1, newMin, newMax);

      // 미선택
      count += solve(idx + 1, selected, min, max);

      dp.set(key, count);
      return count;
    };

    return solve(0, 0, Infinity, -Infinity);
  }

  /**
   * 캐시 초기화
   */
  clearCache(): void {
    this.primeCountCache.clear();
    this.mult3CountCache.clear();
    this.mult5CountCache.clear();
  }

  /**
   * 캐시 통계 조회
   */
  getCacheStats(): {
    primeCount: number;
    mult3Count: number;
    mult5Count: number;
  } {
    return {
      primeCount: this.primeCountCache.size,
      mult3Count: this.mult3CountCache.size,
      mult5Count: this.mult5CountCache.size,
    };
  }
}
