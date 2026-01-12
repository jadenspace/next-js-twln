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
    const { startDraw, endDraw, limit, includeBonus } = body;

    // 2. Check Point balance
    const { data: userPoints } = await supabase
      .from("user_points")
      .select("balance, total_spent")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!userPoints || userPoints.balance < STATS_COST) {
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
    if (limit) query = query.limit(limit);

    const { data: lottoData, error: lottoError } = await query;

    if (lottoError || !lottoData) {
      throw new Error("Failed to fetch lotto data");
    }

    // DB 스키마와 타입이 일치하므로 직접 사용
    const draws: LottoDraw[] = lottoData;

    const calculator = new StatisticsCalculator(draws);
    const result = calculator.calculateBasicStats(includeBonus === true);

    // 4. Deduct Points via RPC (Atomic & Bypasses RLS issues)
    const { data: deductResult, error: deductError } = await supabase.rpc(
      "deduct_points",
      {
        user_uuid: user.id,
        amount_to_deduct: STATS_COST,
        transaction_type: "use",
        description_text: "로또 기본 통계 분석",
        feat_type: "stat_analysis",
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
        analysis_type: "stat",
        result_data: result,
        points_spent: STATS_COST,
      })
      .select()
      .single();

    if (saveError) throw saveError;

    // 5. Grant XP (20 XP)
    await supabase.rpc("add_xp", {
      user_uuid: user.id,
      xp_to_add: 20,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
