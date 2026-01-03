export interface LottoDraw {
  drwNo: number;
  drwNoDate: string;
  totSellamnt: number;
  firstWinamnt: number;
  firstPrzwnerCo: number;
  firstAccumamnt: number;
  drwtNo1: number;
  drwtNo2: number;
  drwtNo3: number;
  drwtNo4: number;
  drwtNo5: number;
  drwtNo6: number;
  bnusNo: number;
}

export interface BasicStats {
  frequency: Record<number, number>; // 번호별 출현 빈도
  recentAppearance: Record<number, number>; // 번호별 최근 출현 회차
  missCount: Record<number, number>; // 연속 미출현 횟수
  oddEvenRatio: { odd: number; even: number }; // 전체 홀짝 비율
  sectionDistribution: Record<string, number>; // 구간별 분포 (1-10, 11-20...)
  sumDistribution: Record<string, number>; // 합계 구간 분포
}

export interface AnalysisResult {
  id: string;
  analysis_type: "stat" | "pattern" | "ai_recommend" | "simulation";
  created_at: string;
  result_data: any;
  is_bookmarked: boolean;
}
