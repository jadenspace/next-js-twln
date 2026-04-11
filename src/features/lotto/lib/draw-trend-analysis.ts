import type { LottoDraw } from "../types";
import {
  calculateAC,
  calculateSum,
  countConsecutivePairs,
  countSameEndDigit,
  countSameSection,
  getHighLowRatio,
  getOddEvenRatio,
} from "./lotto-math";

export interface DrawTrendRow {
  drawNo: number;
  drawDate: string;
  numbers: number[];
  bonusNo: number;
  oddEvenRatio: string;
  highLowRatio: string;
  sum: number;
  ac: number;
  consecutiveCount: number;
  sameEndDigitCount: number;
  sameSectionCount: number;
  previousRegressionCount: number;
  last3RegressionCount: number;
  last6RegressionCount: number;
  last10RegressionCount: number;
  previousBonusRegressionCount: number;
  repeatedNumbersFromPrevious: number[];
  repeatedNumbersFromLast3: number[];
  repeatedNumbersFromLast6: number[];
  repeatedNumbersFromLast10: number[];
  matchedPreviousBonusNumbers: number[];
}

export interface DrawTrendSummary {
  totalRows: number;
  averageSum: number;
  averageAc: number;
  averagePreviousRegression: number;
  maxPreviousRegression: number;
  outlierCount: number;
}

export interface DrawTrendResponse {
  rows: DrawTrendRow[];
  summary: DrawTrendSummary;
}

export function getDrawNumbers(draw: LottoDraw): number[] {
  return [
    draw.drwt_no1,
    draw.drwt_no2,
    draw.drwt_no3,
    draw.drwt_no4,
    draw.drwt_no5,
    draw.drwt_no6,
  ].sort((a, b) => a - b);
}

function buildRecentNumberSet(
  ordered: LottoDraw[],
  startIndex: number,
  windowSize: number,
): Set<number> {
  const recentNumbers = ordered
    .slice(startIndex, startIndex + windowSize)
    .flatMap((draw) => getDrawNumbers(draw));

  return new Set(recentNumbers);
}

function getRepeatedNumbers(
  numbers: number[],
  targetSet: Set<number>,
): number[] {
  return numbers.filter((num) => targetSet.has(num));
}

export function buildDrawTrendRows(draws: LottoDraw[]): DrawTrendRow[] {
  const ordered = [...draws].sort((a, b) => b.drw_no - a.drw_no);

  return ordered.map((draw, index) => {
    const numbers = getDrawNumbers(draw);
    const previousDraw = ordered[index + 1];
    const previousNumbers = previousDraw ? getDrawNumbers(previousDraw) : [];
    const previousSet = new Set(previousNumbers);
    const last3Set = buildRecentNumberSet(ordered, index + 1, 3);
    const last6Set = buildRecentNumberSet(ordered, index + 1, 6);
    const last10Set = buildRecentNumberSet(ordered, index + 1, 10);
    const repeatedNumbersFromPrevious = getRepeatedNumbers(
      numbers,
      previousSet,
    );
    const repeatedNumbersFromLast3 = getRepeatedNumbers(numbers, last3Set);
    const repeatedNumbersFromLast6 = getRepeatedNumbers(numbers, last6Set);
    const repeatedNumbersFromLast10 = getRepeatedNumbers(numbers, last10Set);
    const matchedPreviousBonusNumbers =
      previousDraw && numbers.includes(previousDraw.bnus_no)
        ? [previousDraw.bnus_no]
        : [];

    return {
      drawNo: draw.drw_no,
      drawDate: draw.drw_no_date,
      numbers,
      bonusNo: draw.bnus_no,
      oddEvenRatio: getOddEvenRatio(numbers),
      highLowRatio: getHighLowRatio(numbers),
      sum: calculateSum(numbers),
      ac: calculateAC(numbers),
      consecutiveCount: countConsecutivePairs(numbers),
      sameEndDigitCount: countSameEndDigit(numbers),
      sameSectionCount: countSameSection(numbers),
      previousRegressionCount: repeatedNumbersFromPrevious.length,
      last3RegressionCount: repeatedNumbersFromLast3.length,
      last6RegressionCount: repeatedNumbersFromLast6.length,
      last10RegressionCount: repeatedNumbersFromLast10.length,
      previousBonusRegressionCount: matchedPreviousBonusNumbers.length,
      repeatedNumbersFromPrevious,
      repeatedNumbersFromLast3,
      repeatedNumbersFromLast6,
      repeatedNumbersFromLast10,
      matchedPreviousBonusNumbers,
    };
  });
}

export function buildDrawTrendSummary(rows: DrawTrendRow[]): DrawTrendSummary {
  if (rows.length === 0) {
    return {
      totalRows: 0,
      averageSum: 0,
      averageAc: 0,
      averagePreviousRegression: 0,
      maxPreviousRegression: 0,
      outlierCount: 0,
    };
  }

  const totalSum = rows.reduce((acc, row) => acc + row.sum, 0);
  const totalAc = rows.reduce((acc, row) => acc + row.ac, 0);
  const totalRegression = rows.reduce(
    (acc, row) => acc + row.previousRegressionCount,
    0,
  );
  const maxPreviousRegression = rows.reduce(
    (acc, row) => Math.max(acc, row.previousRegressionCount),
    0,
  );
  const outlierCount = rows.filter(
    (row) =>
      row.previousRegressionCount >= 3 ||
      row.last3RegressionCount >= 4 ||
      row.ac <= 4 ||
      row.oddEvenRatio === "6:0" ||
      row.oddEvenRatio === "0:6",
  ).length;

  return {
    totalRows: rows.length,
    averageSum: Number((totalSum / rows.length).toFixed(1)),
    averageAc: Number((totalAc / rows.length).toFixed(1)),
    averagePreviousRegression: Number(
      (totalRegression / rows.length).toFixed(1),
    ),
    maxPreviousRegression,
    outlierCount,
  };
}
