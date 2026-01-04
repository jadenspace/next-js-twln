import { createClient } from "@/shared/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { AiRecommender } from "@/features/lotto/services/ai-recommender";
import { LottoDraw } from "@/features/lotto/types";

const RECOMMEND_COST = 500;

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Check Balance
    const { data: userPoints } = await supabase
      .from("user_points")
      .select("balance, total_spent")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!userPoints || userPoints.balance < RECOMMEND_COST) {
      return NextResponse.json(
        { error: "Insufficient points" },
        { status: 402 },
      );
    }

    // Fetch Data
    const { data: lottoData, error: lottoError } = await supabase
      .from("lotto_draws")
      .select("*");

    if (lottoError || !lottoData) throw new Error("Failed to fetch lotto data");

    // DB 스키마와 타입이 일치하므로 직접 사용
    const draws: LottoDraw[] = lottoData;

    const recommender = new AiRecommender(draws);
    const result = recommender.recommend();

    // 4. Deduct Points via RPC
    const { data: deductResult, error: deductError } = await supabase.rpc(
      "deduct_points",
      {
        user_uuid: user.id,
        amount_to_deduct: RECOMMEND_COST,
        transaction_type: "use",
        description_text: "AI 번호 추천",
        feat_type: "ai_recommend",
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
      analysis_type: "ai_recommend",
      result_data: result,
      points_spent: RECOMMEND_COST,
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
