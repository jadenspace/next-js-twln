import { describe, expect, it } from "vitest";
import {
  getPrizePoolAmount,
  getRankRows,
  getTotalSalesAmount,
  getWinTypeBreakdown,
  hasNoFirstPrizeWinner,
  hasRankDetails,
} from "./draw-details";
import { makeDraw } from "./lotto-draw.fixture";

describe("hasRankDetails", () => {
  it("2~5등 당첨 게임 수가 있으면 등위별 정보가 있다고 본다", () => {
    expect(hasRankDetails(makeDraw())).toBe(true);
  });

  it("구 API로 적재돼 2~5등이 모두 0이거나 비어 있으면 없다고 본다", () => {
    const legacy = makeDraw({
      rnk2_win_nope: 0,
      rnk3_win_nope: 0,
      rnk4_win_nope: 0,
      rnk5_win_nope: 0,
    });
    expect(hasRankDetails(legacy)).toBe(false);

    const missing = makeDraw({
      rnk2_win_nope: undefined,
      rnk3_win_nope: undefined,
      rnk4_win_nope: undefined,
      rnk5_win_nope: undefined,
    });
    expect(hasRankDetails(missing)).toBe(false);
  });
});

describe("getTotalSalesAmount", () => {
  it("새 API의 whol_epsd_sum_ntsl_amt 를 총판매금액으로 쓴다", () => {
    expect(getTotalSalesAmount(makeDraw())).toBe(114152034000);
  });

  it("새 API 값이 없으면 구 API의 tot_sell_amnt 로 대체한다", () => {
    const legacy = makeDraw({
      whol_epsd_sum_ntsl_amt: "0",
      tot_sell_amnt: "98765432100",
    });
    expect(getTotalSalesAmount(legacy)).toBe(98765432100);
  });

  it("둘 다 없으면 null 을 돌려준다", () => {
    const empty = makeDraw({
      whol_epsd_sum_ntsl_amt: undefined,
      tot_sell_amnt: undefined,
    });
    expect(getTotalSalesAmount(empty)).toBeNull();
  });
});

describe("getPrizePoolAmount", () => {
  it("rlvt_epsd_sum_ntsl_amt 를 당첨금 재원으로 쓴다", () => {
    expect(getPrizePoolAmount(makeDraw())).toBe(57076017000);
  });

  it("값이 0이거나 없으면 null 을 돌려준다", () => {
    expect(
      getPrizePoolAmount(makeDraw({ rlvt_epsd_sum_ntsl_amt: "0" })),
    ).toBeNull();
    expect(
      getPrizePoolAmount(makeDraw({ rlvt_epsd_sum_ntsl_amt: undefined })),
    ).toBeNull();
  });
});

describe("hasNoFirstPrizeWinner", () => {
  it("1등 당첨자가 0명으로 기록된 회차만 참이다", () => {
    expect(hasNoFirstPrizeWinner(makeDraw({ first_przwner_co: 0 }))).toBe(true);
    expect(hasNoFirstPrizeWinner(makeDraw({ first_przwner_co: 17 }))).toBe(
      false,
    );
  });

  it("당첨자 수 정보가 없는 회차는 거짓이다", () => {
    expect(
      hasNoFirstPrizeWinner(makeDraw({ first_przwner_co: undefined })),
    ).toBe(false);
  });
});

describe("getWinTypeBreakdown", () => {
  it("자동/수동/반자동 1등 수와 합계를 돌려준다", () => {
    expect(getWinTypeBreakdown(makeDraw())).toEqual({
      auto: 14,
      manual: 3,
      semiAuto: 0,
      total: 17,
    });
  });

  it("세 값이 모두 0이면 정보가 없는 것으로 보고 null 을 돌려준다", () => {
    const legacy = makeDraw({
      win_type_auto: 0,
      win_type_manual: 0,
      win_type_semi_auto: 0,
    });
    expect(getWinTypeBreakdown(legacy)).toBeNull();
  });
});

describe("getRankRows", () => {
  it("1~5등을 순서대로, 인원·1게임당 금액·총액과 함께 돌려준다", () => {
    const rows = getRankRows(makeDraw());
    expect(rows.map((r) => r.rank)).toEqual([1, 2, 3, 4, 5]);
    expect(rows[0]).toMatchObject({
      rank: 1,
      winners: 17,
      amount: 1570620309,
      totalAmount: 26700545253,
    });
    expect(rows[4]).toMatchObject({
      rank: 5,
      winners: 2626598,
      amount: 5000,
      totalAmount: 13132990000,
    });
  });

  it("금액 필드가 비어 있으면 0으로 채운다", () => {
    const rows = getRankRows(
      makeDraw({ rnk3_win_amt: undefined, rnk3_sum_win_amt: undefined }),
    );
    expect(rows[2]).toMatchObject({ rank: 3, amount: 0, totalAmount: 0 });
  });
});
