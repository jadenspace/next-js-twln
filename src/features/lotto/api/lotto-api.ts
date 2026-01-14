/**
 * 새 API 응답 래퍼
 */
export interface LottoApiResponse {
  resultCode: string | null;
  resultMessage: string | null;
  data: {
    list: LottoResultDto[];
  };
}

/**
 * 로또 회차 당첨 결과 DTO (새 API 응답)
 * 동행복권 API: https://dhlottery.co.kr/lt645/selectPstLt645Info.do
 */
export interface LottoResultDto {
  /** 당첨 방식별 1등 수 */
  winType0: number; // (미사용 또는 예비 값)
  winType1: number; // 자동 1등 당첨 수
  winType2: number; // 수동 1등 당첨 수
  winType3: number; // 반자동 1등 당첨 수

  /** 내부 게임 시퀀스 번호 */
  gmSqNo: number;

  /** 로또 회차 번호 */
  ltEpsd: number;

  /** 당첨 번호 */
  tm1WnNo: number;
  tm2WnNo: number;
  tm3WnNo: number;
  tm4WnNo: number;
  tm5WnNo: number;
  tm6WnNo: number;

  /** 보너스 번호 */
  bnsWnNo: number;

  /** 추첨일 (YYYYMMDD) */
  ltRflYmd: string;

  /** 1등 */
  rnk1WnNope: number; // 당첨 게임 수
  rnk1WnAmt: number; // 1게임당 당첨금
  rnk1SumWnAmt: number; // 총 당첨금

  /** 2등 */
  rnk2WnNope: number;
  rnk2WnAmt: number;
  rnk2SumWnAmt: number;

  /** 3등 */
  rnk3WnNope: number;
  rnk3WnAmt: number;
  rnk3SumWnAmt: number;

  /** 4등 */
  rnk4WnNope: number;
  rnk4WnAmt: number;
  rnk4SumWnAmt: number;

  /** 5등 */
  rnk5WnNope: number;
  rnk5WnAmt: number;
  rnk5SumWnAmt: number;

  /** 전체 당첨 게임 수 */
  sumWnNope: number;

  /** 해당 회차 총 지급 당첨금 */
  rlvtEpsdSumNtslAmt: number;

  /** 누적 총 금액 (내부 통계용) */
  wholEpsdSumNtslAmt: number;

  /** 최고 당첨 등수 (예: "1등") */
  excelRnk: string;
}

// 데이터베이스에 저장될 데이터 타입
export interface LottoDraw {
  drw_no: number;
  drw_no_date: string;
  gm_sq_no: number;

  // 당첨 번호
  drwt_no1: number;
  drwt_no2: number;
  drwt_no3: number;
  drwt_no4: number;
  drwt_no5: number;
  drwt_no6: number;
  bnus_no: number;

  // 1등 당첨 정보
  first_przwner_co: number;
  first_win_amnt: string;
  first_accum_amnt: string;
  win_type_auto: number;
  win_type_manual: number;
  win_type_semi_auto: number;

  // 2등 당첨 정보
  rnk2_win_nope: number;
  rnk2_win_amt: string;
  rnk2_sum_win_amt: string;

  // 3등 당첨 정보
  rnk3_win_nope: number;
  rnk3_win_amt: string;
  rnk3_sum_win_amt: string;

  // 4등 당첨 정보
  rnk4_win_nope: number;
  rnk4_win_amt: string;
  rnk4_sum_win_amt: string;

  // 5등 당첨 정보
  rnk5_win_nope: number;
  rnk5_win_amt: string;
  rnk5_sum_win_amt: string;

  // 전체 통계
  sum_win_nope: number;
  rlvt_epsd_sum_ntsl_amt: string;
  whol_epsd_sum_ntsl_amt: string;
  tot_sell_amnt?: string; // 구 API에서만 제공, nullable

  // 기타
  excel_rnk?: string;
}

import { createClient } from "@/shared/lib/supabase/client";
import axios from "axios";

/**
 * 날짜 문자열을 YYYY-MM-DD 형식으로 변환
 * @param dateStr - YYYYMMDD 형식의 날짜 문자열
 */
const formatDate = (dateStr: string): string => {
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  return `${year}-${month}-${day}`;
};

/**
 * 새 API 응답 데이터를 DB 형식으로 변환
 * @param apiData - 동행복권 API 응답 데이터
 */
export const transformLottoData = (apiData: LottoResultDto): LottoDraw => ({
  drw_no: apiData.ltEpsd,
  drw_no_date: formatDate(apiData.ltRflYmd),
  gm_sq_no: apiData.gmSqNo,

  // 당첨 번호
  drwt_no1: apiData.tm1WnNo,
  drwt_no2: apiData.tm2WnNo,
  drwt_no3: apiData.tm3WnNo,
  drwt_no4: apiData.tm4WnNo,
  drwt_no5: apiData.tm5WnNo,
  drwt_no6: apiData.tm6WnNo,
  bnus_no: apiData.bnsWnNo,

  // 1등 당첨 정보
  first_przwner_co: apiData.rnk1WnNope,
  first_win_amnt: apiData.rnk1WnAmt.toString(),
  first_accum_amnt: apiData.rnk1SumWnAmt.toString(),
  win_type_auto: apiData.winType1,
  win_type_manual: apiData.winType2,
  win_type_semi_auto: apiData.winType3,

  // 2등 당첨 정보
  rnk2_win_nope: apiData.rnk2WnNope,
  rnk2_win_amt: apiData.rnk2WnAmt.toString(),
  rnk2_sum_win_amt: apiData.rnk2SumWnAmt.toString(),

  // 3등 당첨 정보
  rnk3_win_nope: apiData.rnk3WnNope,
  rnk3_win_amt: apiData.rnk3WnAmt.toString(),
  rnk3_sum_win_amt: apiData.rnk3SumWnAmt.toString(),

  // 4등 당첨 정보
  rnk4_win_nope: apiData.rnk4WnNope,
  rnk4_win_amt: apiData.rnk4WnAmt.toString(),
  rnk4_sum_win_amt: apiData.rnk4SumWnAmt.toString(),

  // 5등 당첨 정보
  rnk5_win_nope: apiData.rnk5WnNope,
  rnk5_win_amt: apiData.rnk5WnAmt.toString(),
  rnk5_sum_win_amt: apiData.rnk5SumWnAmt.toString(),

  // 전체 통계
  sum_win_nope: apiData.sumWnNope,
  rlvt_epsd_sum_ntsl_amt: apiData.rlvtEpsdSumNtslAmt.toString(),
  whol_epsd_sum_ntsl_amt: apiData.wholEpsdSumNtslAmt.toString(),

  // 기타
  excel_rnk: apiData.excelRnk,
});

export const lottoApi = {
  /**
   * 동행복권 API에서 특정 회차의 당첨 정보를 가져옵니다.
   * @param drawNo - 조회할 회차 번호
   * @returns API 응답 데이터 또는 null
   */
  async fetchLottoDraw(drawNo: number): Promise<LottoResultDto | null> {
    const url = `https://dhlottery.co.kr/lt645/selectPstLt645Info.do?srchLtEpsd=${drawNo}`;

    try {
      console.log(`[API] Fetching draw #${drawNo} from ${url}`);

      // axios 사용 (fetch 대신)
      const response = await axios.get<LottoApiResponse>(url, {
        timeout: 10000, // 10초 타임아웃
      });

      console.log(
        `[API] Response status for draw #${drawNo}: ${response.status}`,
      );

      // 새 API 응답 구조: data.list[0]에서 실제 데이터 추출
      const data = response.data?.data?.list?.[0];

      if (!data) {
        console.log(`[API] No data found in response for draw #${drawNo}`);
        return null;
      }

      console.log(`[API] Response data for draw #${drawNo}:`, {
        ltEpsd: data.ltEpsd,
        tm1WnNo: data.tm1WnNo,
      });

      // 새 API는 ltEpsd가 0이면 데이터가 없는 것으로 판단
      if (!data.ltEpsd || data.ltEpsd === 0) {
        console.log(
          `[API] No valid data for draw #${drawNo}: ltEpsd=${data.ltEpsd}`,
        );
        return null;
      }

      return data;
    } catch (error) {
      console.error(`[API] Error fetching draw #${drawNo} from ${url}:`, error);
      if (axios.isAxiosError(error)) {
        console.error(`[API] Axios error details:`, {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
        });
      }
      return null;
    }
  },

  /**
   * 파싱된 로또 당첨 정보를 Supabase 데이터베이스에 저장합니다.
   * @param drawData - 저장할 로또 정보
   */
  async saveLottoDraw(drawData: LottoDraw): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("lotto_draws").upsert(drawData);

    if (error) {
      console.error("Failed to save lotto draw:", error);
      throw new Error(error.message);
    }
  },

  /**
   * 데이터베이스에 저장된 가장 최신 회차 번호를 가져옵니다.
   * @returns 최신 회차 번호 또는 0
   */
  async getLatestDrawNo(): Promise<number> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("lotto_draws")
      .select("drw_no")
      .order("drw_no", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116: 'single' found no rows
      console.error("Failed to get latest draw number:", error);
      return 0;
    }

    return data?.drw_no || 0;
  },

  /**
   * 데이터베이스에 저장된 가장 최신 회차의 전체 정보를 가져옵니다.
   * @returns 최신 회차 정보 또는 null
   */
  async getLatestDraw(): Promise<LottoDraw | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("lotto_draws")
      .select("*")
      .order("drw_no", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code !== "PGRST116") {
        console.error("Failed to fetch latest draw:", error);
      }
      return null;
    }

    return data;
  },
};
