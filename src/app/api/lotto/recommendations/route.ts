import { StatisticsCalculator } from "@/features/lotto/services/statistics-calculator";
import type { LottoDraw } from "@/features/lotto/types";
import { choice, getJevClient } from "@/shared/lib/ai/jev";
import { createClient } from "@/shared/lib/supabase/server";
import {
  supabaseErrorResponse,
  unexpectedErrorResponse,
} from "@/shared/lib/api/route-error";
import { NextResponse } from "next/server";

type RecommendationAction = "fixed" | "excluded";
export type RecommendedStrategyKey =
  | "hot_momentum"
  | "cold_rebound"
  | "regression_focus"
  | "balanced_standard";

interface RecommendationGroup {
  id: string;
  label: string;
  description: string;
  defaultAction: RecommendationAction;
  numbers: number[];
  aiConfidence?: number;
  aiDecided?: boolean;
}

export interface JevRecommendationStrategy {
  key: RecommendedStrategyKey;
  label: string;
  description: string;
  confidence: number;
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

const STRATEGY_METADATA: Record<
  RecommendedStrategyKey,
  { label: string; description: string }
> = {
  hot_momentum: {
    label: "핫 번호 모멘텀 추종",
    description:
      "최근 30회 다빈도 번호와 단기 회귀 흐름이 강세를 보여 추세 중심 고정이 유리합니다.",
  },
  cold_rebound: {
    label: "장기 미출현 반등 노림",
    description:
      "장기 미출현 구간의 에너지가 누적되어 쿨 번호 일부를 고정수로 전환하는 전략이 유리합니다.",
  },
  regression_focus: {
    label: "중단기 회귀 구간 집중",
    description:
      "최근 3~6회차 구간 번호의 재출현 비율이 높아 회귀 번호군 중심 조합이 유리합니다.",
  },
  balanced_standard: {
    label: "정석 밸런스 분산",
    description:
      "특정 구간의 쏠림이 완화되어 직전 당첨 번호를 제외하고 고른 분포로 접근하는 것이 유리합니다.",
  },
};

async function evaluateGroupsWithJev(
  draws: LottoDraw[],
  groups: RecommendationGroup[],
  averagePreviousRegression: number,
): Promise<{
  groups: RecommendationGroup[];
  strategy: JevRecommendationStrategy | null;
}> {
  const client = getJevClient();
  if (!client || draws.length < 15) {
    return { groups, strategy: null };
  }

  try {
    const recent5Carryovers = draws.slice(0, 5).map((draw, idx) => {
      const next = draws[idx + 1];
      if (!next) return 0;
      const prevSet = new Set(getMainNumbers(next));
      return getMainNumbers(draw).filter((n) => prevSet.has(n)).length;
    });

    const actionCriteria = {
      fixed:
        "Recommend selecting numbers from this group as fixed seed numbers for the next draw",
      excluded: "Recommend excluding numbers in this group from the next draw",
    } as const;

    const { answers } = await client.systemOne({
      state: {
        latestDrawNo: draws[0]?.drw_no ?? 0,
        averagePreviousCarryover100Draws: averagePreviousRegression,
        recent5DrawsPreviousCarryoverCounts: recent5Carryovers,
        groups: groups.map((g) => ({
          id: g.id,
          label: g.label,
          count: g.numbers.length,
          numbers: g.numbers,
          baselineDefaultAction: g.defaultAction,
        })),
      },
      questions: {
        hot30Action: choice(
          "Should hot-30 numbers (high frequency in last 30 draws) be recommended as fixed or excluded?",
          actionCriteria,
        ),
        cool30Action: choice(
          "Should cool-30 numbers (long absence in last 30 draws) be recommended as fixed or excluded?",
          actionCriteria,
        ),
        previousDrawAction: choice(
          "Given the recent carryover counts vs the 100-draw average, should the immediately preceding draw numbers be recommended as fixed or excluded?",
          actionCriteria,
        ),
        regression3Action: choice(
          "Should numbers from 1-3 draws ago (regression-3) be recommended as fixed or excluded?",
          actionCriteria,
        ),
        regression6Action: choice(
          "Should numbers from 4-6 draws ago (regression-6) be recommended as fixed or excluded?",
          actionCriteria,
        ),
        regression10Action: choice(
          "Should numbers from 7-10 draws ago (regression-10) be recommended as fixed or excluded?",
          actionCriteria,
        ),
        overallStrategy: choice(
          "Which overall number selection strategy best fits the current draw trend state?",
          {
            hot_momentum: "Focus on hot numbers and recent frequent numbers",
            cold_rebound:
              "Include overdue cool numbers expecting mean reversion",
            regression_focus: "Focus on 3-to-6 draw regression carryover pools",
            balanced_standard:
              "Standard balanced filtering excluding immediate previous draw",
          },
        ),
      },
    });

    const actionByGroupId: Record<
      string,
      { action: RecommendationAction; confidence: number }
    > = {
      "hot-30": {
        action: answers.hot30Action.choice,
        confidence: answers.hot30Action.confidence,
      },
      "cool-30": {
        action: answers.cool30Action.choice,
        confidence: answers.cool30Action.confidence,
      },
      "previous-draw": {
        action: answers.previousDrawAction.choice,
        confidence: answers.previousDrawAction.confidence,
      },
      "regression-3": {
        action: answers.regression3Action.choice,
        confidence: answers.regression3Action.confidence,
      },
      "regression-6": {
        action: answers.regression6Action.choice,
        confidence: answers.regression6Action.confidence,
      },
      "regression-10": {
        action: answers.regression10Action.choice,
        confidence: answers.regression10Action.confidence,
      },
    };

    const enrichedGroups = groups.map((group) => {
      const decision = actionByGroupId[group.id];
      if (!decision) return group;
      return {
        ...group,
        defaultAction: decision.action,
        aiConfidence: Number(decision.confidence.toFixed(2)),
        aiDecided: true,
      };
    });

    const strategyKey = answers.overallStrategy.choice;
    const meta = STRATEGY_METADATA[strategyKey];

    return {
      groups: enrichedGroups,
      strategy: {
        key: strategyKey,
        label: meta.label,
        description: meta.description,
        confidence: Number(answers.overallStrategy.confidence.toFixed(2)),
      },
    };
  } catch (err) {
    console.warn("[api/lotto/recommendations] Jev fallback to baseline:", err);
    return { groups, strategy: null };
  }
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
      return supabaseErrorResponse(error);
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

    // draws 는 최신 회차가 앞에 오도록 정렬돼 있다. 다음 회차 기준으로
    // draws[0] 이 "1회 전"이므로 각 구간은 인덱스 0/3/6 에서 시작해야 한다.
    // 예전에는 1/4/7 에서 시작해 라벨보다 한 회차씩 밀렸고, 최신 회차 번호가
    // "최근 3회 회귀"에서 통째로 빠져 있었다.
    const regression3Numbers = collectWindowNumbers(draws, 0, 3);
    const regression6Numbers = collectWindowNumbers(draws, 3, 3);
    const regression10Numbers = collectWindowNumbers(draws, 6, 4);

    const allGroups: RecommendationGroup[] = [
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
    ];

    // 배열 리터럴에 직접 타입을 붙여야 defaultAction 이 RecommendationAction 으로
    // 좁혀진다. .filter() 결과에 붙이면 리터럴은 string 으로 추론된다.
    const nonEmptyGroups = allGroups.filter(
      (group) => group.numbers.length > 0,
    );
    const { groups, strategy } = await evaluateGroupsWithJev(
      draws,
      nonEmptyGroups,
      averagePreviousRegression,
    );

    return NextResponse.json({
      groups,
      strategy,
      baseDraw: latestDraw
        ? {
            drawNo: latestDraw.drw_no,
            drawDate: latestDraw.drw_no_date,
          }
        : null,
    });
  } catch (error) {
    return unexpectedErrorResponse("api/lotto/recommendations", error);
  }
}
