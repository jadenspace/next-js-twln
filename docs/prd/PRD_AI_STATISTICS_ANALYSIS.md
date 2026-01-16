# PRD – AI 통계 분석 및 패턴 정의

## 1. 개요
본 문서는 로또 AI 분석 시스템에서 사용되는 다양한 통계 통계 분석 카테고리의 정의, 판별 로직, 그리고 필요한 계산 공식을 명세합니다. 이 분석 지표들은 생성된 조합의 품질을 평가하거나 특정 패턴을 필터링하는 데 사용됩니다.

## 2. 카테고리별 패턴 명세

### 2.1 기본 수치 분석 (Basic Numerical Patterns)
가장 기초적인 숫자의 합과 분포를 분석하는 지표입니다.

| 항목 | 설명 | 계산/판별 로직 |
|---|---|---|
| **총합 (Sum)** | 당첨 번호 6개의 전체 합계 | $\sum_{i=1}^{6} n_i$ <br> (일반적 범위: 100~175) |
| **홀짝 비율 (Odd/Even)** | 홀수와 짝수의 구성 비율 | - 홀수 개수: $count(n \% 2 \neq 0)$ <br> - 짝수 개수: $6 - 홀수$ <br> - 표기: "홀수:짝수" (예: 4:2) |
| **고저 비율 (High/Low)** | 번호의 높낮이(23 기준) 비율 | - 고번호(High): $n \ge 23$ <br> - 저번호(Low): $n < 23$ <br> - 표기: "고:저" (예: 3:3) |
| **AC 값 (Arithmetic Complexity)** | 번호 간 복잡도(산술적 복잡성) 지수 | 1. 6개 번호에서 가능한 모든 두 수의 차이(절댓값)를 계산 (총 15개) <br> 2. 중복되지 않는 차이값의 개수($D$)를 구함 <br> 3. $AC = D - (6 - 1)$ <br> (범위: 0~10, 평균 7 이상 권장) |

### 2.2 구조 및 반복 패턴 (Structural Patterns)
번호들 사이의 관계나 배치 구조를 분석하는 지표입니다.

| 항목 | 설명 | 계산/판별 로직 |
|---|---|---|
| **연속 번호 (Consecutive)** | 1, 2 처럼 숫자가 이어진 경우 | - 정렬된 번호 리스트에서 $n_{i+1} = n_i + 1$인 쌍의 개수 <br> - 예: [1, 2, 10, 11, 20, 30] -> (1,2), (10,11) -> 2쌍 |
| **동일 끝수 (Same End Digit)** | 일의 자리가 같은 번호의 최대 개수 | 1. 각 번호의 끝수($n \% 10$) 추출 <br> 2. 끝수별 빈도 계산 <br> 3. 가장 많이 나온 끝수의 빈도값 (단, 2개 미만이면 0 처리) |
| **동일 구간 (Same Section)** | 특정 구간(5단 위 9구간)에 몰린 번호 개수 | 1. 구간 정의: 1~5, 6~10 ... 41~45 (총 9구간) <br> 2. 각 번호의 구간 인덱스 $\lfloor (n-1)/5 \rfloor$ 계산 <br> 3. 구간별 빈도 중 최댓값 (단, 2개 미만이면 0 처리) |

### 2.3 수학적 성질 (Mathematical Properties)
숫자의 수학적 특성에 따른 분류입니다.

| 항목 | 설명 | 계산/판별 로직 | 대상 번호(1~45) |
|---|---|---|---|
| **소수 (Primes)** | 1과 자신으로만 나누어지는 수 | 포함된 소수의 개수 | 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43 |
| **합성수 (Composites)** | 소수가 아닌 수 (1 제외) | 포함된 합성수의 개수 | 4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, ... (소수 외 나머지) |
| **3의 배수** | 3으로 나누어 떨어지는 수 | $n \% 3 = 0$인 개수 | 3, 6, 9, 12 ... 45 |
| **5의 배수** | 5로 나누어 떨어지는 수 | $n \% 5 = 0$인 개수 | 5, 10, 15, 20 ... 45 |
| **제곱수 (Squares)** | 정수의 제곱인 수 | $\sqrt{n}$이 정수인 개수 | 1, 4, 9, 16, 25, 36 |

### 2.4 통계 및 이력 분석 (Historical Stats)
과거 당첨 데이터를 기반으로 한 동적 필터링 지표입니다.

| 항목 | 설명 | 계산/판별 로직 |
|---|---|---|
| **핫 번호 (Hot Numbers)** | 최근 회차에서 자주 출현한 번호 | - 최근 N회차(설정값) 기준 출현 빈도 상위 15개(또는 설정값) 번호에 포함된 개수 |
| **콜드 번호 (Cold Numbers)** | 최근 회차에서 드물게 출현한 번호 | - 최근 N회차 기준 출현 빈도 하위 15개 번호에 포함된 개수 |
| **이월수 (Previous Draw)** | 직전 회차 당첨 번호와의 중복 | - (현재 조합 $\cap$ 직전 회차 당첨 번호)의 개수 |
| **미출현 번호 (Missing)** | 오랫동안 나오지 않은 번호 (장기 미출현) | - 최근 N회차 이상 출현하지 않은 번호 목록에 포함된 개수 |

## 3. 데이터 구조 (Types)

### 3.1 조합 패턴 결과 (CombinationPatterns)
```typescript
interface CombinationPatterns {
  sum: number;            // 총합
  oddEven: string;        // 홀짝비율 "3:3"
  highLow: string;        // 고저비율 "2:4"
  ac: number;             // AC값
  consecutive: number;    // 연속쌍 개수
  primeCount: number;     // 소수 개수
  compositeCount: number; // 합성수 개수
  multiplesOf3?: number;  // 3의 배수 (Optional)
  multiplesOf5?: number;  // 5의 배수 (Optional)
  squareCount?: number;   // 제곱수 (Optional)
}
```

### 3.2 필터 설정 (PatternFilterState)
```typescript
interface PatternFilterState {
  // 범위 설정 [min, max]
  sumRange: [number, number]; 
  acRange: [number, number];
  
  // 허용 패턴 목록
  oddEvenRatios: string[];
  highLowRatios: string[];
  
  // 구조적 조건
  consecutivePattern: "any" | "none" | "2-pair-1" ...;
  sameEndDigit: number; // 허용 최대 개수
  sameSection: number;  // 허용 최대 개수
  
  // 수학적 조건 (개수 범위)
  primeCount: [number, number];
  compositeCount: [number, number];
  multiplesOf3: [number, number];
  multiplesOf5: [number, number];
  squareCount: [number, number];
}
```
