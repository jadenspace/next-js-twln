/**
 * 패턴 필터 관련 타입 정의
 */

// 연속번호 패턴 옵션
export type ConsecutivePattern =
  | "any"
  | "none"
  | "2-pair-1"
  | "2-pair-2"
  | "3-run-1"
  | "4-run-1";

// 경우의 수 상태
export type CombinationStatus = "comfortable" | "recommended" | "excessive";

// 번호 빈도 타입 (핫/콜드)
export type FrequencyType = "hot" | "cold" | "normal";

// 통계 기반 필터 설정
export interface StatsFilterConfig {
  // 핫 번호 포함 개수 (최근 N회차 기준 상위 출현 번호)
  hotNumberCount: [number, number]; // [최소, 최대] 0-6
  // 콜드 번호 포함 개수 (최근 N회차 기준 하위 출현 번호)
  coldNumberCount: [number, number]; // [최소, 최대] 0-6
  // 직전 회차 번호 포함 개수
  previousDrawCount: [number, number]; // [최소, 최대] 0-6
  // 미출현 회차 기준 (N회차 이상 미출현 번호)
  missCountThreshold: number; // 10, 20, 30 등
  missNumberCount: [number, number]; // 미출현 번호 포함 개수
}

// 통계 데이터 (API에서 받아올 데이터)
export interface StatsData {
  hotNumbers: number[]; // 핫 번호 목록 (상위 15개)
  coldNumbers: number[]; // 콜드 번호 목록 (하위 15개)
  previousNumbers: number[]; // 직전 회차 당첨 번호 (6개)
  missNumbers: Record<number, number[]>; // 미출현 회차별 번호 목록 {10: [...], 20: [...]}
  lastDrawNo: number; // 최신 회차 번호
}

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
  primeCount: [number, number]; // 소수 개수 범위 (0-6)
  compositeCount: [number, number]; // 합성수 개수 범위 (0-6)
  multiplesOf3: [number, number]; // 3의 배수 (0-6)
  multiplesOf5: [number, number]; // 5의 배수 (0-6)
  squareCount: [number, number]; // 제곱수 (0-6)

  // D. 고정수
  fixedNumbers: number[]; // 고정 번호 (1~45 중 최대 6개)

  // E. 통계 기반 (유료)
  statsFilter?: StatsFilterConfig;
}

/**
 * 선택된 카테고리
 */
export type PatternCategory = "basic" | "repeat" | "math" | "fixed" | "stats";

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
  consecutivePattern: "any",
  sameEndDigit: 3,
  sameSection: 3,

  // 수학 성질
  primeCount: [0, 5],
  compositeCount: [0, 5],
  multiplesOf3: [0, 5],
  multiplesOf5: [0, 5],
  squareCount: [0, 5],

  // 고정수
  fixedNumbers: [],

  // 통계 기반 (기본값)
  statsFilter: {
    hotNumberCount: [0, 6],
    coldNumberCount: [0, 6],
    previousDrawCount: [0, 6],
    missCountThreshold: 10,
    missNumberCount: [0, 6],
  },
};

/**
 * 통계 필터 기본값 (필터 미적용)
 */
export const DEFAULT_STATS_FILTER: StatsFilterConfig = {
  hotNumberCount: [0, 6],
  coldNumberCount: [0, 6],
  previousDrawCount: [0, 6],
  missCountThreshold: 10,
  missNumberCount: [0, 6],
};

/**
 * 필터 미적용 상태
 */
export const UNFILTERED_FILTER_STATE: PatternFilterState = {
  // 기본 수치
  sumRange: [21, 255],
  oddEvenRatios: [],
  highLowRatios: [],
  acRange: [0, 10],

  // 반복 패턴
  consecutivePattern: "any",
  sameEndDigit: 0,
  sameSection: 0,

  // 수학 성질 (6개 선택이므로 최대 6)
  primeCount: [0, 6],
  compositeCount: [0, 6],
  multiplesOf3: [0, 6],
  multiplesOf5: [0, 6],
  squareCount: [0, 6],

  // 고정수
  fixedNumbers: [],

  // 통계 기반 (필터 미적용)
  statsFilter: {
    hotNumberCount: [0, 6],
    coldNumberCount: [0, 6],
    previousDrawCount: [0, 6],
    missCountThreshold: 10,
    missNumberCount: [0, 6],
  },
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
