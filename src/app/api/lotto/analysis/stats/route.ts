import { createClient } from "@/shared/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { StatisticsCalculator } from "@/features/lotto/services/statistics-calculator";
import { LottoDraw } from "@/features/lotto/types";

const STATS_COST = 100;

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const body = await request.json().catch(() => ({}));
    const { startDraw, endDraw, limit, includeBonus, style = "basic" } = body;
    const isAdvanced = style === "advanced";

    // 1. Authenticate (optional for basic stats, required for advanced)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (isAdvanced && !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // 4. Deduct Points via RPC (if user is logged in and there is a cost)
    if (user && currentCost > 0) {
      const { data: deductResult, error: deductError } = await supabase.rpc(
        "deduct_points",
        {
          user_uuid: user.id,
          amount_to_deduct: currentCost,
          transaction_type: "use",
          description_text: isAdvanced
            ? "로또 심화 통계 분석"
            : "로또 기본 통계 분석",
          feat_type: isAdvanced ? "advanced_stat_analysis" : "stat_analysis",
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

      // Save Analysis Result
      const { data: savedResult, error: saveError } = await supabase
        .from("analysis_results")
        .insert({
          user_id: user.id,
          analysis_type: isAdvanced ? "advanced_stat" : "stat",
          result_data: result,
          points_spent: currentCost,
        })
        .select()
        .single();

      if (saveError) throw saveError;

      // 5. Grant XP (50 XP for advanced, basic is now free so maybe no XP)
      await supabase.rpc("add_xp", {
        user_uuid: user.id,
        xp_to_add: isAdvanced ? 50 : 0,
      });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
