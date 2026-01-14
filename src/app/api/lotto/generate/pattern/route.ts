import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";
import { PatternFilter } from "@/features/lotto/services/pattern-filter";
import type {
  PatternFilterState,
  PatternGenerateRequest,
  GeneratedCombination,
  StatsData,
} from "@/features/lotto/types/pattern-filter.types";
import { LottoDraw } from "@/features/lotto/types";

const PATTERN_COSTS = {
  5: 50,
  10: 100,
} as const;

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body: PatternGenerateRequest = await request.json();
    const { filters, count = 5 } = body;

    // 입력 유효성 검사
    if (!filters) {
      return NextResponse.json(
        { error: "필터 정보가 필요합니다." },
        { status: 400 },
      );
    }

    if (count !== 5 && count !== 10) {
      return NextResponse.json(
        { error: "생성 개수는 5 또는 10이어야 합니다." },
        { status: 400 },
      );
    }

    const currentCost = PATTERN_COSTS[count];

    const fixedNumbers = Array.isArray(filters.fixedNumbers)
      ? filters.fixedNumbers
      : [];
    const uniqueFixedNumbers = Array.from(new Set(fixedNumbers));
    const hasInvalidFixedNumber = uniqueFixedNumbers.some(
      (num) => typeof num !== "number" || num < 1 || num > 45,
    );

    if (hasInvalidFixedNumber || uniqueFixedNumbers.length > 6) {
      return NextResponse.json(
        { error: "고정수는 1~45 사이에서 최대 6개까지 선택할 수 있습니다." },
        { status: 400 },
      );
    }

    filters.fixedNumbers = uniqueFixedNumbers;

    // 통계 필터 사용 여부 확인
    const hasStatsFilter =
      filters.statsFilter &&
      (filters.statsFilter.hotNumberCount[0] > 0 ||
        filters.statsFilter.hotNumberCount[1] < 6 ||
        filters.statsFilter.coldNumberCount[0] > 0 ||
        filters.statsFilter.coldNumberCount[1] < 6 ||
        filters.statsFilter.previousDrawCount[0] > 0 ||
        filters.statsFilter.previousDrawCount[1] < 6 ||
        filters.statsFilter.missNumberCount[0] > 0 ||
        filters.statsFilter.missNumberCount[1] < 6);

    // 총 비용 계산
    const totalCost = currentCost;

    const { data: userPoints } = await supabase
      .from("user_points")
      .select("balance, total_spent")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!userPoints || userPoints.balance < totalCost) {
      return NextResponse.json(
        { error: "Insufficient points" },
        { status: 402 },
      );
    }

    // 통계 데이터 가져오기 (statsFilter가 있는 경우)
    let statsData: StatsData | null = null;

    if (hasStatsFilter) {
      try {
        // 최신 회차 번호 조회
        const { data: latestDraw, error: latestError } = await supabase
          .from("lotto_draws")
          .select("drw_no")
          .order("drw_no", { ascending: false })
          .limit(1)
          .single();

        if (latestError || !latestDraw) {
          throw new Error("Failed to fetch latest draw number");
        }

        const latestDrawNo = latestDraw.drw_no;

        // 최근 10회차 데이터 (최신 회차부터 정확히 10개)
        const { data: recentDraws } = await supabase
          .from("lotto_draws")
          .select("*")
          .lte("drw_no", latestDrawNo)
          .order("drw_no", { ascending: false })
          .limit(10);

        // 최근 50회차 데이터 (최신 회차부터 정확히 50개)
        const { data: allDraws } = await supabase
          .from("lotto_draws")
          .select("*")
          .lte("drw_no", latestDrawNo)
          .order("drw_no", { ascending: false })
          .limit(50);

        if (recentDraws && allDraws && recentDraws.length > 0) {
          const draws: LottoDraw[] = allDraws;
          const lastDraw = draws[0];

          // 출현 빈도 계산
          const recentFrequency: Record<number, number> = {};
          for (let i = 1; i <= 45; i++) recentFrequency[i] = 0;

          recentDraws.forEach((draw: LottoDraw) => {
            const numbers = [
              draw.drwt_no1,
              draw.drwt_no2,
              draw.drwt_no3,
              draw.drwt_no4,
              draw.drwt_no5,
              draw.drwt_no6,
            ];
            numbers.forEach((num) => {
              recentFrequency[num]++;
            });
          });

          const sortedByFrequency = Object.entries(recentFrequency)
            .map(([num, count]) => ({ num: parseInt(num), count }))
            .sort((a, b) => b.count - a.count);

          const hotNumbers = sortedByFrequency
            .slice(0, 15)
            .map((item) => item.num);
          const coldNumbers = sortedByFrequency
            .slice(-15)
            .map((item) => item.num)
            .reverse();

          const previousNumbers = [
            lastDraw.drwt_no1,
            lastDraw.drwt_no2,
            lastDraw.drwt_no3,
            lastDraw.drwt_no4,
            lastDraw.drwt_no5,
            lastDraw.drwt_no6,
          ].sort((a, b) => a - b);

          // 미출현 번호 계산
          const lastAppearance: Record<number, number> = {};
          for (let i = 1; i <= 45; i++) lastAppearance[i] = 0;

          draws.forEach((draw: LottoDraw) => {
            const numbers = [
              draw.drwt_no1,
              draw.drwt_no2,
              draw.drwt_no3,
              draw.drwt_no4,
              draw.drwt_no5,
              draw.drwt_no6,
            ];
            numbers.forEach((num) => {
              if (lastAppearance[num] === 0) lastAppearance[num] = draw.drw_no;
            });
          });

          const missNumbers: Record<number, number[]> = {};
          [10, 15, 20, 30].forEach((threshold) => {
            const missNumbersForThreshold: number[] = [];
            for (let num = 1; num <= 45; num++) {
              const missCount =
                lastAppearance[num] === 0
                  ? draws.length
                  : latestDrawNo - lastAppearance[num];
              if (missCount >= threshold) missNumbersForThreshold.push(num);
            }
            missNumbers[threshold] = missNumbersForThreshold.sort(
              (a, b) => a - b,
            );
          });

          statsData = {
            hotNumbers,
            coldNumbers,
            previousNumbers,
            missNumbers,
            lastDrawNo: latestDrawNo,
          };
        }
      } catch (statsError) {
        console.error("Failed to fetch stats data:", statsError);
        // 통계 데이터 로딩 실패해도 계속 진행 (statsData = null)
      }
    }

    // 패턴 필터 인스턴스 생성
    const patternFilter = new PatternFilter();

    // 조건에 맞는 조합 생성
    let results: GeneratedCombination[];

    try {
      results = patternFilter.generateFilteredCombinations(
        filters,
        count,
        100000,
        statsData,
      );
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "조합 생성에 실패했습니다.",
        },
        { status: 400 },
      );
    }

    const descriptionText = hasStatsFilter
      ? `패턴 조합 생성 (${count}조합, 통계 필터 포함)`
      : `패턴 조합 생성 (${count}조합)`;

    const { data: deductResult, error: deductError } = await supabase.rpc(
      "deduct_points",
      {
        user_uuid: user.id,
        amount_to_deduct: totalCost,
        transaction_type: "use",
        description_text: descriptionText,
        feat_type: "pattern_generate",
      },
    );

    if (deductError || !deductResult?.success) {
      return NextResponse.json(
        {
          error:
            deductError?.message ||
            deductResult?.error ||
            "Failed to deduct points",
        },
        { status: 402 },
      );
    }

    try {
      await supabase.from("generated_combinations").insert({
        user_id: user.id,
        filters: filters,
        results: results,
        count: count,
        generated_at: new Date().toISOString(),
      });
    } catch (saveError) {
      // 저장 실패해도 결과는 반환
      console.error("Failed to save generated combinations:", saveError);
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (err: unknown) {
    console.error("Pattern generation error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "알 수 없는 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
