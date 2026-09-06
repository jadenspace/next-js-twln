import type { LottoDraw } from "../types";

/**
 * lotto_draws 한 행에서 상세 화면에 보여줄 값을 꺼내는 헬퍼.
 *
 * 금액 컬럼은 BIGINT 라서 문자열로 올 수 있고, 구 API 로 적재된 회차는
 * 2~5등·자동/수동 정보가 0 또는 NULL 이다. 회차 번호로 경계를 나누는
 * 대신 값이 실제로 있는지로 판단한다.
 */

export interface WinTypeBreakdown {
  auto: number;
  manual: number;
  semiAuto: number;
  total: number;
}

export interface RankRow {
  rank: 1 | 2 | 3 | 4 | 5;
  winners: number;
  amount: number;
  totalAmount: number;
}

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function positiveOrNull(value: string | number | null | undefined) {
  const n = toNumber(value);
  return n > 0 ? n : null;
}

export function hasRankDetails(draw: LottoDraw): boolean {
  return (
    toNumber(draw.rnk2_win_nope) > 0 ||
    toNumber(draw.rnk3_win_nope) > 0 ||
    toNumber(draw.rnk4_win_nope) > 0 ||
    toNumber(draw.rnk5_win_nope) > 0
  );
}

/**
 * 총판매금액. 동행복권 새 API 의 wholEpsdSumNtslAmt 가 해당 회차 총판매금액이고
 * (1150회 기준 1,141억), rlvtEpsdSumNtslAmt 는 그 절반인 당첨금 재원이다.
 */
export function getTotalSalesAmount(draw: LottoDraw): number | null {
  return (
    positiveOrNull(draw.whol_epsd_sum_ntsl_amt) ??
    positiveOrNull(draw.tot_sell_amnt)
  );
}

/** 당첨금 재원(총판매금액의 50%). */
export function getPrizePoolAmount(draw: LottoDraw): number | null {
  return positiveOrNull(draw.rlvt_epsd_sum_ntsl_amt);
}

export function hasNoFirstPrizeWinner(draw: LottoDraw): boolean {
  return draw.first_przwner_co === 0;
}

export function getWinTypeBreakdown(draw: LottoDraw): WinTypeBreakdown | null {
  const auto = toNumber(draw.win_type_auto);
  const manual = toNumber(draw.win_type_manual);
  const semiAuto = toNumber(draw.win_type_semi_auto);
  const total = auto + manual + semiAuto;
  if (total === 0) return null;
  return { auto, manual, semiAuto, total };
}

export function getRankRows(draw: LottoDraw): RankRow[] {
  return [
    {
      rank: 1,
      winners: toNumber(draw.first_przwner_co),
      amount: toNumber(draw.first_win_amnt),
      totalAmount: toNumber(draw.first_accum_amnt),
    },
    {
      rank: 2,
      winners: toNumber(draw.rnk2_win_nope),
      amount: toNumber(draw.rnk2_win_amt),
      totalAmount: toNumber(draw.rnk2_sum_win_amt),
    },
    {
      rank: 3,
      winners: toNumber(draw.rnk3_win_nope),
      amount: toNumber(draw.rnk3_win_amt),
      totalAmount: toNumber(draw.rnk3_sum_win_amt),
    },
    {
      rank: 4,
      winners: toNumber(draw.rnk4_win_nope),
      amount: toNumber(draw.rnk4_win_amt),
      totalAmount: toNumber(draw.rnk4_sum_win_amt),
    },
    {
      rank: 5,
      winners: toNumber(draw.rnk5_win_nope),
      amount: toNumber(draw.rnk5_win_amt),
      totalAmount: toNumber(draw.rnk5_sum_win_amt),
    },
  ];
}
