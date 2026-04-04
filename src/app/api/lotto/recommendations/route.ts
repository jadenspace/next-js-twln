import { StatisticsCalculator } from "@/features/lotto/services/statistics-calculator";
import type { LottoDraw } from "@/features/lotto/types";
import { createClient } from "@/shared/lib/supabase/server";
import { NextResponse } from "next/server";

type RecommendationAction = "fixed" | "excluded";

interface RecommendationGroup {
  id: string;
  label: string;
  description: string;
  defaultAction: RecommendationAction;
  numbers: number[];
}

function getMainNumbers(draw: LottoDraw): number[] {
  return [
    draw.drwt_no1,
    draw.drwt_no2,
    draw.drwt_no3,
    draw.drwt_no4,
    draw.drwt_no5,
    draw.drwt_no6,
  ].sort((a, b) => a - b);
}

function getTopNumbers(
  entries: Array<[string, number]>,
  count: number,
  descending: boolean = true,
): number[] {
  return entries
    .sort((a, b) => {
      if (a[1] === b[1]) {
        return Number(a[0]) - Number(b[0]);
      }

      return descending ? b[1] - a[1] : a[1] - b[1];
    })
    .slice(0, count)
    .map(([num]) => Number(num));
}

function collectWindowNumbers(
  draws: LottoDraw[],
  startOffset: number,
  count: number,
): number[] {
  return Array.from(
    new Set(
      draws
        .slice(startOffset, startOffset + count)
        .flatMap((draw) => getMainNumbers(draw)),
    ),
  ).sort((a, b) => a - b);
}

function calculateAveragePreviousRegression(
  draws: LottoDraw[],
  sampleSize: number,
): number {
  const scopedDraws = draws.slice(0, sampleSize);

  if (scopedDraws.length < 2) {
    return 0;
  }

  let totalMatches = 0;

  for (let index = 0; index < scopedDraws.length - 1; index += 1) {
    const currentNumbers = getMainNumbers(scopedDraws[index]);
    const previousNumbers = new Set(getMainNumbers(scopedDraws[index + 1]));

    totalMatches += currentNumbers.filter((num) =>
      previousNumbers.has(num),
    ).length;
  }

  return Number((totalMatches / (scopedDraws.length - 1)).toFixed(1));
}

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("lotto_draws")
      .select("*")
      .order("drw_no", { ascending: false })
      .limit(120);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch data" },
        { status: 500 },
      );
    }

    const draws = (data ?? []) as LottoDraw[];

    if (draws.length === 0) {
      return NextResponse.json({ groups: [], baseDraw: null });
    }

    const recent30 = draws.slice(0, 30);
    const latestDraw = draws[0];
    const latestNumbers = latestDraw ? getMainNumbers(latestDraw) : [];

    const recent30Stats = new StatisticsCalculator(
      recent30,
    ).calculateBasicStats();
    const hot30Numbers = getTopNumbers(
      Object.entries(recent30Stats.frequency),
      6,
    );
    const cool30Numbers = getTopNumbers(
      Object.entries(recent30Stats.missCount),
      6,
    );
    const averagePreviousRegression = calculateAveragePreviousRegression(
      draws,
      100,
    );

    const regression3Numbers = collectWindowNumbers(draws, 1, 3);
    const regression6Numbers = collectWindowNumbers(draws, 4, 3);
    const regression10Numbers = collectWindowNumbers(draws, 7, 4);

    const groups: RecommendationGroup[] = [
      {
        id: "hot-30",
        label: "핫 번호 (30회)",
        description: "최근 30회 기준 출현 빈도가 높은 번호",
        defaultAction: "fixed",
        numbers: hot30Numbers,
      },
      {
        id: "cool-30",
        label: "쿨 번호 (30회)",
        description: "최근 30회 기준 미출현 흐름이 긴 번호",
        defaultAction: "excluded",
        numbers: cool30Numbers,
      },
      {
        id: "previous-draw",
        label: "직전회차 번호",
        description: `최근 100회 기준 직전회차 평균 회귀 ${averagePreviousRegression}개`,
        defaultAction: "excluded",
        numbers: latestNumbers,
      },
      {
        id: "regression-3",
        label: "최근 3회 회귀",
        description: "다음 회차 기준 1~3회 전 구간에 나온 번호 전체",
        defaultAction: "fixed",
        numbers: regression3Numbers,
      },
      {
        id: "regression-6",
        label: "최근 6회 회귀",
        description: "다음 회차 기준 4~6회 전 구간에 나온 번호 전체",
        defaultAction: "fixed",
        numbers: regression6Numbers,
      },
      {
        id: "regression-10",
        label: "최근 10회 회귀",
        description: "다음 회차 기준 7~10회 전 구간에 나온 번호 전체",
        defaultAction: "fixed",
        numbers: regression10Numbers,
      },
    ].filter((group) => group.numbers.length > 0);

    return NextResponse.json({
      groups,
      baseDraw: latestDraw
        ? {
            drawNo: latestDraw.drw_no,
            drawDate: latestDraw.drw_no_date,
          }
        : null,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
