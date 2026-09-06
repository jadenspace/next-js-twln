import { describe, it, expect } from "vitest";
import { parseLottoQrUrl } from "./lotto-qr-parser";
import { checkLottoQrResult } from "./lotto-qr-checker";
import { LottoDraw } from "../types";

describe("parseLottoQrUrl", () => {
  it("동행복권 공식 모바일 전체 QR URL을 올바르게 파싱한다", () => {
    // 1100회차, 2개 게임 (A: 01,02,03,04,05,06, B: 07,08,09,10,11,12)
    const url =
      "https://m.dhlottery.co.kr/qr.do?method=winQr&v=1100m010203040506q070809101112";

    const result = parseLottoQrUrl(url);

    expect(result.drawNo).toBe(1100);
    expect(result.games).toHaveLength(2);
    expect(result.games[0].label).toBe("A");
    expect(result.games[0].numbers).toEqual([1, 2, 3, 4, 5, 6]);
    expect(result.games[1].label).toBe("B");
    expect(result.games[1].numbers).toEqual([7, 8, 9, 10, 11, 12]);
  });

  it("v= 파라미터만 직접 입력된 경우에도 파싱한다", () => {
    const input = "v=1050m031522344145";
    const result = parseLottoQrUrl(input);

    expect(result.drawNo).toBe(1050);
    expect(result.games).toHaveLength(1);
    expect(result.games[0].numbers).toEqual([3, 15, 22, 34, 41, 45]);
  });

  it("원시 코드 형태(1050m...)로 입력된 경우에도 파싱한다", () => {
    const input = "1050m031522344145";
    const result = parseLottoQrUrl(input);

    expect(result.drawNo).toBe(1050);
    expect(result.games[0].numbers).toEqual([3, 15, 22, 34, 41, 45]);
  });

  it("빈 문자열이나 잘못된 형식은 에러를 발생시킨다", () => {
    expect(() => parseLottoQrUrl("")).toThrow();
    expect(() => parseLottoQrUrl("https://google.com")).toThrow();
    expect(() => parseLottoQrUrl("v=invalid")).toThrow();
  });
});

describe("checkLottoQrResult", () => {
  const mockDraw: LottoDraw = {
    drw_no: 1100,
    drw_no_date: "2024-01-06",
    gm_sq_no: 1,
    drwt_no1: 1,
    drwt_no2: 2,
    drwt_no3: 3,
    drwt_no4: 4,
    drwt_no5: 5,
    drwt_no6: 6,
    bnus_no: 7,
    first_przwner_co: 10,
    first_win_amnt: "2000000000",
    first_accum_amnt: "20000000000",
    win_type_auto: 8,
    win_type_manual: 2,
    win_type_semi_auto: 0,
    rnk2_win_nope: 50,
    rnk2_win_amt: "50000000",
    rnk2_sum_win_amt: "2500000000",
    rnk3_win_nope: 2000,
    rnk3_win_amt: "1500000",
    rnk3_sum_win_amt: "3000000000",
    rnk4_win_nope: 100000,
    rnk4_win_amt: "50000",
    rnk4_sum_win_amt: "5000000000",
    rnk5_win_nope: 1500000,
    rnk5_win_amt: "5000",
    rnk5_sum_win_amt: "7500000000",
    sum_win_nope: 1602060,
    rlvt_epsd_sum_ntsl_amt: "50000000000",
    whol_epsd_sum_ntsl_amt: "100000000000",
  };

  it("1등(6개 일치)을 정확히 판정한다", () => {
    const parsed = {
      drawNo: 1100,
      rawUrl: "mock",
      games: [{ label: "A" as const, numbers: [1, 2, 3, 4, 5, 6] }],
    };
    const result = checkLottoQrResult(parsed, mockDraw);

    expect(result.highestRank).toBe(1);
    expect(result.games[0].rank).toBe(1);
    expect(result.games[0].matchCount).toBe(6);
    expect(result.games[0].prizeAmount).toBe(2000000000);
  });

  it("2등(5개 일치 + 보너스 일치)을 정확히 판정한다", () => {
    const parsed = {
      drawNo: 1100,
      rawUrl: "mock",
      games: [{ label: "A" as const, numbers: [1, 2, 3, 4, 5, 7] }], // 1~5 일치, 7 보너스
    };
    const result = checkLottoQrResult(parsed, mockDraw);

    expect(result.highestRank).toBe(2);
    expect(result.games[0].rank).toBe(2);
    expect(result.games[0].bonusMatched).toBe(true);
    expect(result.games[0].prizeAmount).toBe(50000000);
  });

  it("추첨 전 회차인 경우 isDrawPending이 true여야 한다", () => {
    const parsed = {
      drawNo: 9999,
      rawUrl: "mock",
      games: [{ label: "A" as const, numbers: [1, 2, 3, 4, 5, 6] }],
    };
    const result = checkLottoQrResult(parsed, null);

    expect(result.isDrawPending).toBe(true);
    expect(result.games[0].formattedPrize).toBe("추첨 전");
  });
});
