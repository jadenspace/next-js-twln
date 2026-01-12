/**
 * 로또 당첨 정보 (DB 스키마와 일치)
 * 필드명은 DB의 snake_case를 따릅니다.
 */
export interface LottoDraw {
  drw_no: number;
  drw_no_date: string;
  gm_sq_no?: number;

  // 당첨 번호
  drwt_no1: number;
  drwt_no2: number;
  drwt_no3: number;
  drwt_no4: number;
  drwt_no5: number;
  drwt_no6: number;
  bnus_no: number;

  // 1등 당첨 정보
  first_przwner_co?: number;
  first_win_amnt?: string;
  first_accum_amnt?: string;
  win_type_auto?: number;
  win_type_manual?: number;
  win_type_semi_auto?: number;

  // 2등 당첨 정보
  rnk2_win_nope?: number;
  rnk2_win_amt?: string;
  rnk2_sum_win_amt?: string;

  // 3등 당첨 정보
  rnk3_win_nope?: number;
  rnk3_win_amt?: string;
  rnk3_sum_win_amt?: string;

  // 4등 당첨 정보
  rnk4_win_nope?: number;
  rnk4_win_amt?: string;
  rnk4_sum_win_amt?: string;

  // 5등 당첨 정보
  rnk5_win_nope?: number;
  rnk5_win_amt?: string;
  rnk5_sum_win_amt?: string;

  // 전체 통계
  sum_win_nope?: number;
  rlvt_epsd_sum_ntsl_amt?: string;
  whol_epsd_sum_ntsl_amt?: string;
  tot_sell_amnt?: string; // 구 API에서만 제공

  // 기타
  excel_rnk?: string;
  created_at?: string;
}

export interface BasicStats {
  frequency: Record<number, number>; // 번호별 출현 빈도
  recentAppearance: Record<number, number>; // 번호별 최근 출현 회차
  missCount: Record<number, number>; // 연속 미출현 횟수
  oddEvenRatio: { odd: number; even: number }; // 전체 홀짝 비율
  sectionDistribution: Record<string, number>; // 구간별 분포 (1-10, 11-20...)
  sumDistribution: Record<string, number>; // 합계 구간 분포
  consecutiveOccurrences: {
    total: number; // 전체 연번 발생 횟수
    pairs: Record<string, number>; // 연번 쌍별 빈도 (e.g. "1,2")
    byDraw: Record<number, number>; // 회차별 연번 개수
  };
}

export interface AdvancedStats extends BasicStats {
  regression: {
    averageCycles: Record<number, number>;
    lastCycles: Record<number, number>;
    stdDev: Record<number, number>;
  };
  markov: {
    transitionMatrix: Record<number, Record<number, number>>; // [prevNum][nextNum] = count
  };
  endingDigit: Record<number, number>; // 0~9 빈도
  compatibility: {
    pairs: Record<string, number>; // 6C2 조합 빈도
  };
  mathProperty: {
    primes: number;
    multiplesOf3: number;
    composites: number;
  };
  nineRanges: Record<string, number>; // 1-5, 6-10... 빈도
  interval: {
    averageGaps: number[]; // n번째와 n+1번째 번호 사이의 평균 간격
    drawGaps: Record<number, number[]>; // 회차별 간격 리스트
  };
  expertBalance: {
    sums: number[];
    averages: number[];
    spreads: number[]; // (max - min)
  };
}

export interface AnalysisResult {
  id: string;
  analysis_type:
    | "stat"
    | "advanced_stat"
    | "pattern"
    | "ai_recommend"
    | "simulation";
  created_at: string;
  result_data: any;
  is_bookmarked: boolean;
}
