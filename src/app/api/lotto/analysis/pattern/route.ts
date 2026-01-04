import { createClient } from "@/shared/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { PatternAnalyzer } from "@/features/lotto/services/pattern-analyzer";
import { LottoDraw } from "@/features/lotto/types";

const PATTERN_COST = 200;

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Check balance
    const { data: userPoints } = await supabase
      .from("user_points")
      .select("balance, total_spent")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!userPoints || userPoints.balance < PATTERN_COST) {
      return NextResponse.json(
        { error: "Insufficient points" },
        { status: 402 },
      );
    }

    // Fetch data
    const { data: lottoData, error: lottoError } = await supabase
      .from("lotto_draws")
      .select("*");

    if (lottoError || !lottoData) throw new Error("Failed to fetch lotto data");

    // DB 스키마와 타입이 일치하므로 직접 사용
    const draws: LottoDraw[] = lottoData;

    const analyzer = new PatternAnalyzer(draws);
    const result = analyzer.calculatePatterns();

    // 4. Deduct Points via RPC
    const { data: deductResult, error: deductError } = await supabase.rpc(
      "deduct_points",
      {
        user_uuid: user.id,
        amount_to_deduct: PATTERN_COST,
        transaction_type: "use",
        description_text: "로또 패턴 분석",
        feat_type: "pattern_analysis",
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

    await supabase.from("analysis_results").insert({
      user_id: user.id,
      analysis_type: "pattern",
      result_data: result,
      points_spent: PATTERN_COST,
    });

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
