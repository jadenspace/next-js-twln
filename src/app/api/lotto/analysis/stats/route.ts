import { createClient } from "@/shared/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { StatisticsCalculator } from "@/features/lotto/services/statistics-calculator";
import { LottoDraw } from "@/features/lotto/types";

const STATS_COST = 100;

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // 1. Authenticate
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { startDraw, endDraw, limit, includeBonus, style = "basic" } = body;
    const isAdvanced = style === "advanced";
    const currentCost = isAdvanced ? 200 : 100;

    // 2. Check Point balance
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

    // 3. Perform Analysis
    // Fetch lotto data with filters
    let query = supabase.from("lotto_draws").select("*");

    if (startDraw) query = query.gte("drw_no", startDraw);
    if (endDraw) query = query.lte("drw_no", endDraw);
    query = query.order("drw_no", { ascending: false });

    // For advanced stats like Markov/Regression, we might need more historical data
    // than the requested limit to calculate tendencies correctly.
    // But for now, we follow the limit if provided.
    if (limit) query = query.limit(limit);

    const { data: lottoData, error: lottoError } = await query;

    if (lottoError || !lottoData) {
      throw new Error("Failed to fetch lotto data");
    }

    const draws: LottoDraw[] = lottoData;
    const calculator = new StatisticsCalculator(draws);

    const result = isAdvanced
      ? calculator.calculateAdvancedStats(includeBonus === true)
      : calculator.calculateBasicStats(includeBonus === true);

    // 4. Deduct Points via RPC
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

    // 5. Grant XP (20 XP for basic, 50 XP for advanced)
    await supabase.rpc("add_xp", {
      user_uuid: user.id,
      xp_to_add: isAdvanced ? 50 : 20,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
