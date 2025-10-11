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
  tot_sell_amnt: string; // 큰 숫자를 처리하기 위해 string으로 변경
  first_win_amnt: string; // 큰 숫자를 처리하기 위해 string으로 변경
  first_przwner_co: number;
  drwt_no1: number;
  drwt_no2: number;
  drwt_no3: number;
  drwt_no4: number;
  drwt_no5: number;
  drwt_no6: number;
  bnus_no: number;
}

// API 데이터를 DB 형식으로 변환하고 큰 숫자를 문자열로 처리
export const transformLottoData = (apiData: LottoApiData): LottoDraw => ({
  drw_no: apiData.drwNo,
  drw_no_date: apiData.drwNoDate,
  tot_sell_amnt: apiData.totSellamnt.toString(),
  first_win_amnt: apiData.firstWinamnt.toString(),
  first_przwner_co: apiData.firstPrzwnerCo,
  drwt_no1: apiData.drwtNo1,
  drwt_no2: apiData.drwtNo2,
  drwt_no3: apiData.drwtNo3,
  drwt_no4: apiData.drwtNo4,
  drwt_no5: apiData.drwtNo5,
  drwt_no6: apiData.drwtNo6,
  bnus_no: apiData.bnusNo,
});

export const lottoApi = {
  /**
   * 동행복권 API에서 특정 회차의 당첨 정보를 가져옵니다.
   * @param drawNo - 조회할 회차 번호
   * @returns API 응답 데이터 또는 null
   */
  async fetchLottoDraw(drawNo: number): Promise<LottoApiData | null> {
    try {
      // User-Agent 헤더를 추가하여 서버의 차단을 우회합니다.
      const response = await fetch(
        `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${drawNo}`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
        },
      );
      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`);
        return null;
      }
      const data: LottoApiData = await response.json();
      if (data.returnValue === "fail") {
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

    if (error && error.code !== "PGRST116") {
      // PGRST116: 'single' found no rows
      console.error("Failed to get latest draw number:", error);
      return 0;
    }

    return data?.drw_no || 0;
  },
};
