import type { LottoDraw } from "../types";

/**
 * 테스트용 LottoDraw 생성기. 1150회 실제 값을 기본으로 쓰고
 * 필요한 필드만 덮어쓴다.
 */
export function makeDraw(overrides: Partial<LottoDraw> = {}): LottoDraw {
  return {
    drw_no: 1150,
    drw_no_date: "2024-12-14",
    drwt_no1: 8,
    drwt_no2: 9,
    drwt_no3: 18,
    drwt_no4: 35,
    drwt_no5: 39,
    drwt_no6: 45,
    bnus_no: 25,
    first_przwner_co: 17,
    first_win_amnt: "1570620309",
    first_accum_amnt: "26700545253",
    win_type_auto: 14,
    win_type_manual: 3,
    win_type_semi_auto: 0,
    rnk2_win_nope: 226,
    rnk2_win_amt: "19690668",
    rnk2_sum_win_amt: "4450090968",
    rnk3_win_nope: 3312,
    rnk3_win_amt: "1343631",
    rnk3_sum_win_amt: "4450105872",
    rnk4_win_nope: 164964,
    rnk4_win_amt: "50000",
    rnk4_sum_win_amt: "8248200000",
    rnk5_win_nope: 2626598,
    rnk5_win_amt: "5000",
    rnk5_sum_win_amt: "13132990000",
    sum_win_nope: 2797100,
    rlvt_epsd_sum_ntsl_amt: "57076017000",
    whol_epsd_sum_ntsl_amt: "114152034000",
    ...overrides,
  };
}
