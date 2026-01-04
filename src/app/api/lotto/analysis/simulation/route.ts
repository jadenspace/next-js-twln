import { createClient } from "@/shared/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { WinningSimulator } from "@/features/lotto/services/winning-simulator";
import { LottoDraw } from "@/features/lotto/types";

const SIMULATION_COST = 300;

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // 1. Authenticate
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { numbers } = body; // [1, 2, 3, 4, 5, 6]

    if (!numbers || !Array.isArray(numbers) || numbers.length !== 6) {
      return NextResponse.json({ error: "Invalid numbers" }, { status: 400 });
    }

    // 2. Check Balance
    const { data: userPoints } = await supabase
      .from("user_points")
      .select("balance, total_spent")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!userPoints || userPoints.balance < SIMULATION_COST) {
      return NextResponse.json(
        { error: "Insufficient points" },
        { status: 402 },
      );
    }

    // 3. Fetch Data & Simulate
    const { data: lottoData, error: lottoError } = await supabase
      .from("lotto_draws")
      .select("*");

    if (lottoError || !lottoData) throw new Error("Failed to fetch lotto data");

    // DB 스키마와 타입이 일치하므로 직접 사용
    const draws: LottoDraw[] = lottoData;

    const simulator = new WinningSimulator(draws);
    const result = simulator.simulate(numbers);

    // 4. Deduct Points via RPC
    const { data: deductResult, error: deductError } = await supabase.rpc(
      "deduct_points",
      {
        user_uuid: user.id,
        amount_to_deduct: SIMULATION_COST,
        transaction_type: "use",
        description_text: "당첨 시뮬레이션",
        feat_type: "simulation_analysis",
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
      analysis_type: "simulation",
      input_params: { numbers },
      result_data: result,
      points_spent: SIMULATION_COST,
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
