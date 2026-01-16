# 실제 조합 수 정확 계산 시스템 구현 계획

## 📌 목표
샘플링 기반 추정 방식을 **수학적으로 정확한 조합 수 계산**으로 전환

## 🎯 기대 효과
- ✅ 매번 동일한 입력에 대해 동일한 결과 보장
- ✅ 샘플링 오차 제거로 정확도 100% 달성
- ✅ 교집합 문제 완벽 해결
- ✅ 성능: 캐싱을 통해 실시간 계산 가능 (목표: <100ms)

---

## 📊 Phase 1: 기본 필터 정확 계산 (🟢 Level 1)
**난이도**: ⭐⭐☆☆☆  
**예상 시간**: 2-3시간  
**우선순위**: 최우선

### 구현 대상
1. **홀짝 비율** (oddEvenRatios)
2. **고저 비율** (highLowRatios)  
3. **고정 번호** (fixedNumbers)

### 기술적 접근
- 기본 조합론 공식: C(n, k) = n! / (k! × (n-k)!)
- 홀수 22개, 짝수 23개로 분리하여 계산
- 고저: 1-22 (저), 23-45 (고)
- 고정수: 남은 번호에서 선택 C(45-fixed, 6-fixed)

### 구현 계획
```typescript
// src/features/lotto/services/exact-combination-counter.ts (새 파일)

class ExactCombinationCounter {
  /**
   * 홀짝 비율 조합 수 계산
   * @param oddCount 홀수 개수
   * @returns 정확한 조합 수
   */
  countOddEvenCombinations(oddCount: number): number {
    // 홀수 22개 중 oddCount개, 짝수 23개 중 (6-oddCount)개
    return C(22, oddCount) * C(23, 6 - oddCount);
  }

  /**
   * 고저 비율 조합 수 계산
   * @param lowCount 저번호 개수
   */
  countHighLowCombinations(lowCount: number): number {
    // 저번호(1-22) lowCount개, 고번호(23-45) (6-lowCount)개
    return C(22, lowCount) * C(23, 6 - lowCount);
  }

  /**
   * 고정 번호 조합 수 계산
   */
  countWithFixedNumbers(fixedNumbers: number[]): number {
    const fixedCount = fixedNumbers.length;
    if (fixedCount > 6) return 0;
    // 나머지 (45-fixedCount)개 중 (6-fixedCount)개 선택
    return C(45 - fixedCount, 6 - fixedCount);
  }

  /**
   * 복수 필터 교집합 계산
   */
  countWithMultipleBasicFilters(
    oddCount: number | null,
    lowCount: number | null,
    fixedNumbers: number[]
  ): number {
    // 고정수가 있으면 가능 영역 축소
    const available = getAvailableNumbers(fixedNumbers);
    const oddAvailable = available.filter(n => n % 2 === 1);
    const evenAvailable = available.filter(n => n % 2 === 0);
    const lowAvailable = available.filter(n => n <= 22);
    const highAvailable = available.filter(n => n > 22);
    
    // 4개 그룹으로 나눔: 홀수저, 홀수고, 짝수저, 짝수고
    const groups = {
      oddLow: oddAvailable.filter(n => n <= 22),
      oddHigh: oddAvailable.filter(n => n > 22),
      evenLow: evenAvailable.filter(n => n <= 22),
      evenHigh: evenAvailable.filter(n => n > 22),
    };

    // 각 그룹에서 몇 개씩 선택할지 모든 경우 합산
    // (a, b, c, d) where a+b+c+d = 6 - fixedNumbers.length
    // a = oddLow, b = oddHigh, c = evenLow, d = evenHigh
    // a+c = lowCount, a+b = oddCount 조건 만족
    
    return sumAllValidCombinations(groups, oddCount, lowCount, 6 - fixedNumbers.length);
  }
}
```

### 검증 방법
- 샘플링 결과와 비교하여 ±1% 이내 일치 확인
- 알려진 조합 수와 검증 (예: 전체 C(45,6) = 8,145,060)

---

## 📊 Phase 2: 동적 프로그래밍 필터 (🟡 Level 2)
**난이도**: ⭐⭐⭐⭐☆  
**예상 시간**: 1-2일  
**우선순위**: 높음

### 구현 대상
1. **총합 범위** (sumRange)
2. **소수 개수** (primeCount)
3. **3의 배수 개수** (multiplesOf3)
4. **5의 배수 개수** (multiplesOf5)

### 기술적 접근
**동적 프로그래밍 (DP)**을 사용하여 조합 수 계산

#### DP 상태 정의 (소수 개수 예시)
```
dp[i][j][k] = i번째 번호까지 고려했을 때, 
              j개의 번호를 선택했고, 
              그 중 k개가 소수인 조합 수
```

#### 점화식
```
if (isPrime[i]):
  dp[i+1][j+1][k+1] += dp[i][j][k]  // i번 선택 (소수)
else:
  dp[i+1][j+1][k] += dp[i][j][k]    // i번 선택 (비소수)

dp[i+1][j][k] += dp[i][j][k]        // i번 미선택
```

### 구현 계획
```typescript
class DPCombinationCounter {
  /**
   * 소수 개수 조합 수 계산
   * @param minPrimes 최소 소수 개수
   * @param maxPrimes 최대 소수 개수
   * @returns 정확한 조합 수
   */
  countPrimeCombinations(minPrimes: number, maxPrimes: number): number {
    const primes = [2,3,5,7,11,13,17,19,23,29,31,37,41,43]; // 14개
    
    // dp[선택한 번호 수][선택한 소수 수] = 조합 수
    const dp: number[][] = Array(7).fill(0).map(() => Array(7).fill(0));
    dp[0][0] = 1;
    
    for (let num = 1; num <= 45; num++) {
      const isPrime = primes.includes(num);
      const newDp = dp.map(row => [...row]);
      
      for (let selected = 0; selected < 6; selected++) {
        for (let primeCount = 0; primeCount <= selected; primeCount++) {
          if (dp[selected][primeCount] === 0) continue;
          
          if (isPrime) {
            newDp[selected + 1][primeCount + 1] += dp[selected][primeCount];
          } else {
            newDp[selected + 1][primeCount] += dp[selected][primeCount];
          }
        }
      }
      
      dp = newDp;
    }
    
    // minPrimes ~ maxPrimes 범위 합산
    let total = 0;
    for (let p = minPrimes; p <= maxPrimes; p++) {
      total += dp[6][p];
    }
    return total;
  }

  /**
   * 총합 범위 조합 수 계산 (생성 함수 방식)
   */
  countSumRangeCombinations(minSum: number, maxSum: number): number {
    // 생성함수를 사용한 DP
    // dp[i][j][s] = i번째까지, j개 선택, 합 s
    // 메모리 최적화: 슬라이딩 윈도우
    
    const dp = new Map<string, number>();
    
    function solve(index: number, selected: number, sum: number): number {
      if (selected === 6) {
        return (sum >= minSum && sum <= maxSum) ? 1 : 0;
      }
      if (index > 45 || (45 - index + 1) < (6 - selected)) {
        return 0; // 불가능
      }
      
      const key = `${index},${selected},${sum}`;
      if (dp.has(key)) return dp.get(key)!;
      
      // index번 선택 or 미선택
      const count = 
        solve(index + 1, selected + 1, sum + index) + 
        solve(index + 1, selected, sum);
      
      dp.set(key, count);
      return count;
    }
    
    return solve(1, 0, 0);
  }
}
```

### 최적화
- **메모이제이션**: 계산 결과 캐싱
- **슬라이딩 윈도우**: 메모리 사용량 최소화
- **사전 계산**: 앱 시작 시 주요 값들 미리 계산

---

## 📊 Phase 3: 복잡한 패턴 필터 (🔴 Level 3)
**난이도**: ⭐⭐⭐⭐⭐  
**예상 시간**: 3-4일  
**우선순위**: 중간

### 구현 대상
1. **연속번호 패턴** (consecutivePattern)
2. **동일 끝수** (sameEndDigit)
3. **동일 구간** (sameSection)
4. **AC 값** (acRange)

### 기술적 접근

#### 1. 동일 끝수 계산
끝수별로 그룹화하여 조합 계산
```
끝수 0: [10, 20, 30, 40]         (4개)
끝수 1: [1, 11, 21, 31, 41]      (5개)
끝수 2: [2, 12, 22, 32, 42]      (5개)
...
끝수 9: [9, 19, 29, 39]          (4개)

"2개까지 허용" = 각 그룹에서 최대 2개씩만 선택
```

**포함-배제 원리** 사용:
```
전체 - (3개 이상 선택한 경우)
```

#### 2. 연속번호 패턴 계산
매우 복잡하지만 가능:
```
"연속번호 없음" = 
  전체 - (2연속 이상 포함한 조합)
  
포함-배제 원리로 계산
```

### 구현 계획
```typescript
class ComplexPatternCounter {
  /**
   * 동일 끝수 제한 조합 수 계산
   */
  countSameEndDigitCombinations(maxPerGroup: number): number {
    // 끝수별 그룹
    const groups = [
      [10, 20, 30, 40],           // 0: 4개
      [1, 11, 21, 31, 41],        // 1: 5개
      [2, 12, 22, 32, 42],        // 2: 5개
      // ... (10개 그룹)
    ];
    
    // 각 그룹에서 0~maxPerGroup개씩 선택하여 총 6개
    return this.countDistributedSelection(groups, 6, maxPerGroup);
  }

  /**
   * 분산 선택 조합 수 계산 (DP)
   * @param groups 각 그룹의 원소 리스트
   * @param total 총 선택 개수
   * @param maxPerGroup 그룹당 최대 선택 수
   */
  private countDistributedSelection(
    groups: number[][],
    total: number,
    maxPerGroup: number
  ): number {
    // dp[i][j] = i번째 그룹까지 고려, j개 선택
    const dp: number[][] = Array(groups.length + 1)
      .fill(0)
      .map(() => Array(total + 1).fill(0));
    
    dp[0][0] = 1;
    
    for (let i = 0; i < groups.length; i++) {
      const groupSize = groups[i].length;
      
      for (let j = 0; j <= total; j++) {
        if (dp[i][j] === 0) continue;
        
        // 이 그룹에서 k개 선택 (0 ~ min(groupSize, maxPerGroup))
        for (let k = 0; k <= Math.min(groupSize, maxPerGroup, total - j); k++) {
          dp[i + 1][j + k] += dp[i][j] * C(groupSize, k);
        }
      }
    }
    
    return dp[groups.length][total];
  }

  /**
   * 연속번호 패턴 조합 수 계산
   */
  countConsecutivePatternCombinations(pattern: ConsecutivePattern): number {
    switch (pattern) {
      case "any":
        return TOTAL_COMBINATIONS;
      
      case "none":
        // 포함-배제 원리
        return TOTAL_COMBINATIONS - this.countWithConsecutive(2);
      
      case "2-pair-1":
        // 정확히 2연속 1쌍만
        return this.countWithConsecutive(2) - this.countWithConsecutive(3);
      
      // ... 다른 패턴들
    }
  }

  /**
   * N개 이상 연속 포함 조합 수
   */
  private countWithConsecutive(n: number): number {
    // 복잡한 계산... 캐싱 필수
    // 이미 계산된 값이 있으면 반환
    if (this.consecutiveCache.has(n)) {
      return this.consecutiveCache.get(n)!;
    }
    
    // 실제 계산 로직...
    const result = /* ... 복잡한 계산 ... */;
    this.consecutiveCache.set(n, result);
    return result;
  }
}
```

---

## 📊 Phase 4: 통합 및 교집합 처리
**난이도**: ⭐⭐⭐⭐☆  
**예상 시간**: 2-3일  
**우선순위**: 높음

### 목표
여러 필터가 동시에 적용될 때 정확한 교집합 계산

### 전략

#### 전략 1: 독립 필터 곱셈
일부 필터는 **독립적**이므로 곱셈 가능:
```typescript
// 소수 개수와 3의 배수 개수는 거의 독립적
count = countPrime(2,4) * countMultiplesOf3(1,3) / TOTAL_COMBINATIONS
```

#### 전략 2: 결합 DP
일부 필터는 **함께 계산** 필요:
```typescript
// 홀짝 + 고저 + 소수를 하나의 DP로 계산
dp[i][j][odd][low][prime] = ...
```

#### 전략 3: 샘플링 폴백
매우 복잡한 조합은 **샘플링으로 보정**:
```typescript
if (isTooComplex(filters)) {
  baseCount = exactCalculation(simpleFilters);
  ratio = samplingEstimate(complexFilters);
  return baseCount * ratio;
}
```

### 구현 계획
```typescript
class IntegratedCombinationCounter {
  /**
   * 모든 필터 적용 조합 수 계산
   */
  countWithAllFilters(filters: PatternFilterState): number {
    // 1. 독립 필터 그룹화
    const independentGroups = this.groupIndependentFilters(filters);
    
    // 2. 각 그룹별 정확 계산
    let totalCount = TOTAL_COMBINATIONS;
    
    for (const group of independentGroups) {
      const groupCount = this.countFilterGroup(group);
      const groupRatio = groupCount / TOTAL_COMBINATIONS;
      totalCount *= groupRatio;
    }
    
    // 3. 교차 의존성 보정
    const correctionFactor = this.calculateCorrectionFactor(filters);
    totalCount *= correctionFactor;
    
    return Math.round(totalCount);
  }

  /**
   * 독립 필터 그룹화
   */
  private groupIndependentFilters(filters: PatternFilterState) {
    // 필터 간 독립성/의존성 분석
    // 독립적인 필터끼리 묶음
    return [
      { type: 'basic', filters: { oddEven, highLow, fixed } },
      { type: 'math', filters: { prime, mult3, mult5 } },
      { type: 'pattern', filters: { consecutive, sameEnd, sameSection } },
    ];
  }
}
```

---

## 📊 Phase 5: 성능 최적화 및 캐싱
**난이도**: ⭐⭐⭐☆☆  
**예상 시간**: 1-2일  
**우선순위**: 높음

### 최적화 전략

#### 1. 메모리 캐싱
```typescript
class CombinationCache {
  private cache = new Map<string, number>();
  
  getCached(key: string): number | null {
    return this.cache.get(key) ?? null;
  }
  
  setCached(key: string, value: number): void {
    this.cache.set(key, value);
  }
  
  // LRU 캐시로 메모리 관리
  evictOldest(): void {
    // ...
  }
}
```

#### 2. IndexedDB 영구 캐싱
자주 사용되는 조합은 IndexedDB에 저장:
```typescript
// 앱 시작 시 사전 계산
await precomputeCommonCombinations([
  { oddCount: 3, lowCount: 3, primeCount: [2, 4] },
  { oddCount: 4, lowCount: 2, primeCount: [1, 3] },
  // ... 100개 정도
]);
```

#### 3. Web Worker
무거운 계산은 Web Worker로 비동기 처리:
```typescript
const worker = new Worker('combination-worker.js');
worker.postMessage({ filters });
worker.onmessage = (e) => {
  const count = e.data.count;
  updateUI(count);
};
```

---

## 🧪 Phase 6: 테스트 및 검증
**난이도**: ⭐⭐⭐☆☆  
**예상 시간**: 1일  
**우선순위**: 필수

### 테스트 케이스
```typescript
describe('ExactCombinationCounter', () => {
  it('should count total combinations correctly', () => {
    expect(counter.countAll()).toBe(8145060);
  });

  it('should count odd-even combinations', () => {
    // 홀수 3개 = C(22,3) * C(23,3) = 1540 * 1771 = 2,727,340
    expect(counter.countOddEven(3)).toBe(2727340);
  });

  it('should handle intersection correctly', () => {
    const count = counter.count({
      oddCount: 3,
      lowCount: 3,
    });
    // 샘플링 결과와 ±0.1% 이내
    expect(count).toBeCloseTo(samplingResult, 8145);
  });

  it('should match sampling for complex filters', () => {
    const exact = counter.count(complexFilters);
    const sampled = samplingCounter.count(complexFilters);
    expect(Math.abs(exact - sampled) / exact).toBeLessThan(0.01);
  });
});
```

---

## 📅 전체 일정

| Phase | 작업 | 예상 시간 | 우선순위 |
|:---:|:---|:---:|:---:|
| 1 | 기본 필터 정확 계산 | 2-3시간 | ⭐⭐⭐⭐⭐ |
| 2 | DP 필터 구현 | 1-2일 | ⭐⭐⭐⭐☆ |
| 3 | 복잡한 패턴 필터 | 3-4일 | ⭐⭐⭐☆☆ |
| 4 | 통합 및 교집합 처리 | 2-3일 | ⭐⭐⭐⭐☆ |
| 5 | 성능 최적화 | 1-2일 | ⭐⭐⭐⭐☆ |
| 6 | 테스트 및 검증 | 1일 | ⭐⭐⭐⭐⭐ |
| **총계** | | **8-15일** | |

---

## 🎯 권장 실행 순서

### Step 1️⃣: 기본 필터 (즉시 시작 가능)
- 홀짝, 고저, 고정수 정확 계산
- 기존 샘플링과 비교 검증
- **목표**: 1일 내 완료

### Step 2️⃣: DP 필터 (병렬 진행)
- 소수, 3의 배수, 5의 배수
- **목표**: 2-3일 내 완료

### Step 3️⃣: 통합 시스템 (Step 1+2 완료 후)
- 교집합 처리 로직
- **목표**: 1주일 내 MVP 완성

### Step 4️⃣: 복잡한 패턴 (선택적)
- 연속번호, 동일 끝수 등
- 필요시 샘플링 병행
- **목표**: 2주 내 완성

---

## ⚠️ 리스크 및 대응

| 리스크 | 확률 | 영향 | 대응 방안 |
|:---|:---:|:---:|:---|
| DP 계산 너무 느림 | 중 | 높음 | Web Worker + 캐싱 |
| 메모리 부족 | 낮 | 중 | 슬라이딩 윈도우 DP |
| 교집합 계산 복잡 | 높음 | 높음 | 샘플링 폴백 |
| 정확도 검증 어려움 | 중 | 중 | 다양한 테스트 케이스 |

---

## ✅ 성공 기준

1. **정확도**: 샘플링 대비 ±0.1% 이내
2. **성능**: 필터 변경 시 조합 수 계산 <100ms
3. **교집합**: 2개 이상 필터 동시 적용 시 정확한 계산
4. **안정성**: 모든 필터 조합에서 오류 없이 작동

---

## 🚀 다음 단계

이 계획을 검토하신 후:
1. **어떤 Phase부터 시작**할지 결정
2. **우선순위 조정**이 필요한지 확인
3. **즉시 시작** 또는 **추가 논의** 선택

**추천**: Phase 1 (기본 필터)부터 시작하여 빠른 성과 확인!
