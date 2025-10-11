import { createClient } from "@/shared/lib/supabase/client";

// 동행복권 API 응답 데이터 타입
export interface LottoApiData {
  totSellamnt: number;
  returnValue: "success" | "fail";
  drwNoDate: string;
  firstWinamnt: number;
  drwtNo6: number;
  drwtNo4: number;
  firstPrzwnerCo: number;
  drwtNo5: number;
  bnusNo: number;
  firstAccumamnt: number;
  drwNo: number;
  drwtNo2: number;
  drwtNo3: number;
  drwtNo1: number;
}

// 데이터베이스에 저장될 데이터 타입
export interface LottoDraw {
  drw_no: number;
  drw_no_date: string;
  tot_sell_amnt: number;
  first_win_amnt: number;
  first_przwner_co: number;
  drwt_no1: number;
  drwt_no2: number;
  drwt_no3: number;
  drwt_no4: number;
  drwt_no5: number;
  drwt_no6: number;
  bnus_no: number;
}

export const lottoApi = {
  /**
   * 동행복권 API에서 특정 회차의 당첨 정보를 가져옵니다.
   * @param drawNo - 조회할 회차 번호
   * @returns API 응답 데이터 또는 null
   */
  async fetchLottoDraw(drawNo: number): Promise<LottoApiData | null> {
    try {
      // CORS 문제를 피하기 위해 Next.js API 라우트를 통해 요청을 보냅니다.
      // 여기서는 임시로 클라이언트 측 fetch를 사용하지만, 실제로는 API 라우트를 만들어야 합니다.
      // 우선 개념 증명을 위해 직접 호출합니다.
      const response = await fetch(
        `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${"$"}{drawNo}`
      );
      if (!response.ok) {
        console.error(`HTTP error! status: ${"$"}{response.status}`);
        return null;
      }
      const data: LottoApiData = await response.json();
      if (data.returnValue === "fail") {
        // console.log(`No data for draw number: ${"$"}{drawNo}`);
        return null;
      }
      return data;
    } catch (error) {
      console.error("Failed to fetch lotto draw:", error);
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

    if (error && error.code !== "PGRST116") { // PGRST116: 'single' found no rows
      console.error("Failed to get latest draw number:", error);
      return 0;
    }

    return data?.drw_no || 0;
  },
};
