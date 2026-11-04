import { requireVerifiedUser } from "@/shared/lib/auth/guards";
import { choice, getJevClient, noul, score } from "@/shared/lib/ai/jev";
import { createAdminClient } from "@/shared/lib/supabase/admin";
import { createClient } from "@/shared/lib/supabase/server";
import { unexpectedErrorResponse } from "@/shared/lib/api/route-error";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { StatisticsCalculator } from "@/features/lotto/services/statistics-calculator";
import {
  BasicStats,
  JevStatsInsight,
  LottoDraw,
  StatsAnomalyKey,
  StatsStrategyKey,
} from "@/features/lotto/types";

const ANOMALY_META: Record<
  StatsAnomalyKey,
  { label: string; description: string }
> = {
  odd_even_imbalance: {
    label: "홀짝 비율 편중 감지",
    description:
      "선택한 회차 구간에서 홀수 또는 짝수 한쪽의 출현 비중이 통계 평균 대비 뚜렷하게 쏠려 있습니다.",
  },
  section_concentration: {
    label: "특정 번호대 과밀 출현",
    description:
      "10단위 구간 분포에서 특정 번호대 출현이 집중되고 소외 구간과의 격차가 벌어져 있습니다.",
  },
  consecutive_surge: {
    label: "연속번호 동반 출현 강세",
    description:
      "선택 구간 내 이웃한 연속번호 쌍의 출현 빈도가 높게 나타나고 있습니다.",
  },
  long_absence_accumulation: {
    label: "장기 미출현 번호 누적",
    description:
      "20회차 이상 출현하지 않은 장기 미출현 번호들이 다수 누적되어 회귀 압력이 형성되어 있습니다.",
  },
  sum_extreme_shift: {
    label: "당첨번호 총합 구간 편향",
    description:
      "번호 6개의 합계가 표준 구간(101~150)을 벗어나 고합 또는 저합 구간 비중이 확대되었습니다.",
  },
  balanced_flow: {
    label: "표준 균형 분포 유지",
    description:
      "홀짝, 구간별 분포, 합계 구간이 큰 왜곡 없이 고른 통계적 리듬을 유지하고 있습니다.",
  },
};

const STRATEGY_META: Record<
  StatsStrategyKey,
  { label: string; description: string; presetPrompt: string }
> = {
  trend_following: {
    label: "강세 번호 모멘텀 추종",
    description:
      "현재 구간의 다빈도 핫 번호를 1~2개 고정수로 활용하고 직전 당첨번호는 제외하는 전략을 권장합니다.",
    presetPrompt:
      "최근 핫 번호 위주로 1~2개 고정하고 직전 회차 번호는 제외한 뒤 안정적인 합계로 세팅해줘",
  },
  mean_reversion: {
    label: "장기 미출현 반등(평균 회귀) 공략",
    description:
      "누적된 미출현(쿨) 번호 반등을 노려 쿨 번호 일부를 포함하고 홀짝·고저 균형을 맞추는 전략을 권장합니다.",
    presetPrompt:
      "오랫동안 안 나온 쿨 번호 반등을 노리고 홀짝과 고저 비율을 균형 있게 맞춰줘",
  },
  anti_cluster_strict: {
    label: "군집 억제 및 엄격 분산 필터링",
    description:
      "특정 구간·끝수 쏠림과 연속번호를 제한하고 AC값 8 이상의 고복잡도 분산 조합을 권장합니다.",
    presetPrompt:
      "연번 없이 동일 구간과 끝수 쏠림을 엄격하게 제한하고 골고루 분산된 조합으로 세팅해줘",
  },
  golden_balance: {
    label: "정석 황금 밸런스 조합",
    description:
      "총합 115~160, 홀짝 2:4~4:2의 표준 중심 구간에서 무리한 고정수 없이 깔끔하게 조합하는 것을 권장합니다.",
    presetPrompt:
      "특정 번호 고정 없이 직전 당첨번호만 빼고 총합 115~160 정석 황금 밸런스로 맞춰줘",
  },
};

async function evaluateStatsWithJev(
  draws: LottoDraw[],
  stats: BasicStats,
): Promise<JevStatsInsight | null> {
  const client = getJevClient();
  if (!client || draws.length === 0) return null;

  try {
    const freqEntries = Object.entries(stats.frequency).map(([k, v]) => ({
      num: Number(k),
      count: v,
    }));
    const sortedFreq = [...freqEntries].sort((a, b) => b.count - a.count);
    const topHot = sortedFreq.slice(0, 5);
    const topCold = sortedFreq.slice(-5);

    const longAbsentCount = Object.values(stats.missCount).filter(
      (c) => c >= 20,
    ).length;
    const maxMissCount = Math.max(...Object.values(stats.missCount));

    const totalOddEven = stats.oddEvenRatio.odd + stats.oddEvenRatio.even;
    const oddRatioPct =
      totalOddEven > 0
        ? Number(((stats.oddEvenRatio.odd / totalOddEven) * 100).toFixed(1))
        : 50;

    const consecutivePerDraw = Number(
      (stats.consecutiveOccurrences.total / draws.length).toFixed(2),
    );

    const { answers } = await client.systemOne({
      state: {
        analyzedDrawCount: draws.length,
        oddPercentage: oddRatioPct,
        evenPercentage: Number((100 - oddRatioPct).toFixed(1)),
        sectionDistribution: stats.sectionDistribution,
        sumDistribution: stats.sumDistribution,
        averageConsecutivePairsPerDraw: consecutivePerDraw,
        numbersAbsent20OrMoreDrawsCount: longAbsentCount,
        maxConsecutiveMissDraws: maxMissCount,
        top5MostFrequent: topHot,
        bottom5LeastFrequent: topCold,
      },
      questions: {
        dominantAnomaly: choice(
          "What is the single most notable statistical pattern or anomaly in this draw range?",
          {
            odd_even_imbalance:
              "Noticeable skew between odd and even number counts away from 50/50",
            section_concentration:
              "Concentration or imbalance across the 1-10, 11-20, 21-30, 31-40, 41-45 number sections",
            consecutive_surge:
              "High frequency of consecutive number pairs per draw",
            long_absence_accumulation:
              "Significant accumulation of overdue numbers absent for 20+ draws",
            sum_extreme_shift:
              "Shift in sum distribution toward low (<=100) or high (201+) sums",
            balanced_flow:
              "Well-balanced distribution across sections, odd/even, and sums",
          },
        ),
        recommendedStrategy: choice(
          "Which pattern generation strategy should be recommended to the user based on these statistics?",
          {
            trend_following:
              "Follow hot numbers and active sections while excluding immediate carryover",
            mean_reversion:
              "Target overdue/cold numbers expecting mean reversion",
            anti_cluster_strict:
              "Apply strict anti-clustering (no consecutive pairs, strict section/ending-digit caps)",
            golden_balance:
              "Use standard golden-zone sum (115-160) and balanced 3:3/4:2 ratios",
          },
        ),
        volatility: score(
          "How volatile or skewed is the number distribution in this range?",
          [
            "Low volatility: stable and close to theoretical expectations",
            "Moderate volatility: typical minor fluctuations across sections and frequencies",
            "High volatility: strong skew, clustering, or extreme absence gaps",
          ],
        ),
        meanReversionTimely: noul(
          "Is it statistically reasonable to include overdue/long-absent numbers for mean reversion in the next combination?",
        ),
      },
    });

    const anomalyKey = answers.dominantAnomaly.choice;
    const strategyKey = answers.recommendedStrategy.choice;
    const volatilityScore = Number(answers.volatility.score.toFixed(2));
    const levelLabel =
      volatilityScore >= 1.35
        ? "높음 (쏠림·변동 확대)"
        : volatilityScore >= 0.65
          ? "보통 (일반적 흐름)"
          : "낮음 (안정적 균형)";

    return {
      anomaly: {
        key: anomalyKey,
        label: ANOMALY_META[anomalyKey].label,
        description: ANOMALY_META[anomalyKey].description,
        confidence: Number(answers.dominantAnomaly.confidence.toFixed(2)),
      },
      strategy: {
        key: strategyKey,
        label: STRATEGY_META[strategyKey].label,
        description: STRATEGY_META[strategyKey].description,
        confidence: Number(answers.recommendedStrategy.confidence.toFixed(2)),
        presetPrompt: STRATEGY_META[strategyKey].presetPrompt,
      },
      volatility: {
        score: volatilityScore,
        levelLabel,
        confidence: Number(answers.volatility.confidence.toFixed(2)),
      },
      meanReversionProb: Number(answers.meanReversionTimely.noul.toFixed(2)),
      analyzedDrawCount: draws.length,
    };
  } catch (err) {
    console.warn("[api/lotto/analysis/stats] Jev insight fallback:", err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { startDraw, endDraw, limit, includeBonus, style = "basic" } = body;
    const isAdvanced = style === "advanced";

    // 1. Authenticate — 기본 통계는 누구나, 심화 통계(유료)는 인증된 회원만.
    //    정지된 계정은 가드가 403 으로 막는다.
    let user: User | null = null;
    let supabase: SupabaseClient;
    if (isAdvanced) {
      const guard = await requireVerifiedUser();
      if (!guard.ok) return guard.response;
      user = guard.user;
      supabase = guard.supabase;
    } else {
      supabase = await createClient();
    }

    const currentCost = isAdvanced ? 200 : 0; // Basic stats are free now as per "전부 접근 가능"

    // 2. Check Point balance (only if cost > 0)
    if (user && currentCost > 0) {
      const { data: userPoints } = await supabase
        .from("user_points")
        .select("balance, total_spent")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!userPoints || userPoints.balance < currentCost) {
        return NextResponse.json(
          { error: "Insufficient points" },
          { status: 402 },
        );
      }
    }

    // 3. Perform Analysis
    // Fetch lotto data with filters
    let draws: LottoDraw[] = [];

    const PAGE_SIZE = 1000;
    const needsPagination = !limit || limit > PAGE_SIZE;

    if (needsPagination) {
      // limit이 없거나 1000보다 큰 경우 페이지네이션으로 데이터 가져오기
      const allLottoData: LottoDraw[] = [];
      let offset = 0;
      let hasMore = true;
      const targetLimit = limit || Infinity;

      while (hasMore && allLottoData.length < targetLimit) {
        const remaining = targetLimit - allLottoData.length;
        const currentPageSize = Math.min(PAGE_SIZE, remaining);

        let query = supabase
          .from("lotto_draws")
          .select("*")
          .order("drw_no", { ascending: false })
          .range(offset, offset + currentPageSize - 1);

        if (startDraw) query = query.gte("drw_no", startDraw);
        if (endDraw) query = query.lte("drw_no", endDraw);

        const { data: pageData, error: lottoError } = await query;

        if (lottoError) {
          throw new Error("Failed to fetch lotto data");
        }

        if (!pageData || pageData.length === 0) {
          hasMore = false;
        } else {
          allLottoData.push(...(pageData as LottoDraw[]));
          // 목표 limit에 도달했거나 페이지 크기보다 적게 반환되면 마지막 페이지
          if (
            allLottoData.length >= targetLimit ||
            pageData.length < currentPageSize
          ) {
            hasMore = false;
          } else {
            offset += currentPageSize;
          }
        }
      }

      // limit이 있는 경우 정확히 limit만큼만 반환
      draws = limit ? allLottoData.slice(0, limit) : allLottoData;
    } else {
      // limit이 1000 이하인 경우 일반 쿼리 사용
      let query = supabase.from("lotto_draws").select("*");

      if (startDraw) query = query.gte("drw_no", startDraw);
      if (endDraw) query = query.lte("drw_no", endDraw);
      query = query.order("drw_no", { ascending: false }).limit(limit);

      const { data: lottoData, error: lottoError } = await query;

      if (lottoError || !lottoData) {
        throw new Error("Failed to fetch lotto data");
      }

      draws = lottoData;
    }
    const calculator = new StatisticsCalculator(draws);

    const result = isAdvanced
      ? calculator.calculateAdvancedStats(includeBonus === true)
      : calculator.calculateBasicStats(includeBonus === true);

    result.jevInsight = await evaluateStatsWithJev(draws, result);

    // 4. Deduct Points via RPC (if user is logged in and there is a cost)
    if (user && currentCost > 0) {
      // 포인트/경험치 함수는 service_role 로만 호출한다.
      const adminSupabase = createAdminClient();

      const { data: deductResult, error: deductError } =
        await adminSupabase.rpc("deduct_points", {
          user_uuid: user.id,
          amount_to_deduct: currentCost,
          transaction_type: "use",
          description_text: isAdvanced
            ? "로또 심화 통계 분석"
            : "로또 기본 통계 분석",
          feat_type: isAdvanced ? "advanced_stat_analysis" : "stat_analysis",
        });

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

      // Save Analysis Result.
      // 이 시점에 포인트는 이미 차감됐다. 이력 저장 실패로 요청 전체를 실패시키면
      // 사용자는 돈만 내고 결과를 못 받는다. 기록만 남기고 결과는 반환한다.
      const { error: saveError } = await adminSupabase
        .from("analysis_results")
        .insert({
          user_id: user.id,
          analysis_type: isAdvanced ? "advanced_stat" : "stat",
          result_data: result,
          points_spent: currentCost,
        });

      if (saveError) {
        console.error(
          "[lotto/analysis/stats] 분석 이력 저장 실패 (포인트는 차감됨)",
          { userId: user.id, cost: currentCost, saveError },
        );
      }

      // 5. Grant XP (50 XP for advanced, basic is now free so maybe no XP)
      await adminSupabase.rpc("add_xp", {
        user_uuid: user.id,
        xp_to_add: isAdvanced ? 50 : 0,
      });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    return unexpectedErrorResponse("api/lotto/analysis/stats", err);
  }
}
