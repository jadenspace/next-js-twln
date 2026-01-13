/**
 * 패턴 필터 관련 타입 정의
 */

// 연속번호 패턴 옵션
export type ConsecutivePattern = "none" | "2-pair-1" | "2-pair-2";

// 경우의 수 상태
export type CombinationStatus = "comfortable" | "recommended" | "excessive";

/**
 * 패턴 필터 상태
 */
export interface PatternFilterState {
  // A. 기본 수치 패턴
  sumRange: [number, number]; // 총합 범위 (21-255, 기본 100-175)
  oddEvenRatios: string[]; // 홀짝 비율 ["3:3", "4:2", "2:4"]
  highLowRatios: string[]; // 고저 비율 ["3:3", "4:2", "2:4"]
  acRange: [number, number]; // AC값 범위 (0-10, 기본 7-10)

  // B. 반복/패턴 구조
  consecutivePattern: ConsecutivePattern; // 연속번호
  sameEndDigit: number; // 동일 끝수 (0, 2, 3)
  sameSection: number; // 동일 구간 (0, 2, 3)

  // C. 수학적 성질
  primeCount: [number, number]; // 소수 개수 범위 (0-3)
  compositeCount: [number, number]; // 합성수 개수 범위 (0-3)
  multiplesOf3: [number, number]; // 3의 배수 (0-3)
  multiplesOf5: [number, number]; // 5의 배수 (0-2)
  squareCount: [number, number]; // 제곱수 (0-2)
}

/**
 * 선택된 카테고리
 */
export type PatternCategory = "basic" | "repeat" | "math";

/**
 * 생성 옵션
 */
export interface GenerationOptions {
  count: 5 | 10;
}

/**
 * 생성된 조합의 패턴 정보
 */
export interface CombinationPatterns {
  sum: number;
  oddEven: string;
  highLow: string;
  ac: number;
  consecutive: number;
  primeCount: number;
  compositeCount: number;
}

/**
 * 생성된 조합
 */
export interface GeneratedCombination {
  numbers: number[];
  patterns: CombinationPatterns;
}

/**
 * 경우의 수 정보
 */
export interface CombinationInfo {
  total: number; // 현재 필터로 가능한 조합 수
  percentage: number; // 전체 대비 비율
  status: CombinationStatus; // 상태 ("여유"/"권장"/"과도한 필터링")
}

/**
 * 기본 필터 값
 */
export const DEFAULT_FILTER_STATE: PatternFilterState = {
  // 기본 수치
  sumRange: [100, 175],
  oddEvenRatios: ["2:4", "3:3", "4:2"],
  highLowRatios: ["2:4", "3:3", "4:2"],
  acRange: [7, 10],

  // 반복 패턴
  consecutivePattern: "none",
  sameEndDigit: 0,
  sameSection: 0,

  // 수학 성질
  primeCount: [0, 3],
  compositeCount: [0, 3],
  multiplesOf3: [0, 3],
  multiplesOf5: [0, 2],
  squareCount: [0, 2],
};

/**
 * 전체 로또 조합 수 (45C6)
 */
export const TOTAL_COMBINATIONS = 8145060;

/**
 * API 요청 타입
 */
export interface PatternGenerateRequest {
  filters: PatternFilterState;
  count: 5 | 10;
}

/**
 * API 응답 타입
 */
export interface PatternGenerateResponse {
  success: boolean;
  data?: GeneratedCombination[];
  error?: string;
}
