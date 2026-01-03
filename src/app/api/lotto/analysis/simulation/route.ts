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
      .single();

    if (!userPoints || userPoints.balance < SIMULATION_COST) {
      return NextResponse.json(
        { error: "Insufficient points" },
        { status: 402 },
      );
    }

    // 3. Fetch Data & Simulate
    const { data: lottoData, error: lottoError } = await supabase
      .from("lotto_history")
      .select("*");

    if (lottoError || !lottoData) throw new Error("Failed to fetch lotto data");

    const draws: LottoDraw[] = lottoData.map((d: any) => ({
      drwNo: d.drw_no,
      drwNoDate: d.drw_no_date,
      totSellamnt: d.tot_sellamnt,
      firstWinamnt: d.first_winamnt,
      firstPrzwnerCo: d.first_przwner_co,
      firstAccumamnt: d.first_accumamnt,
      drwtNo1: d.drwt_no1,
      drwtNo2: d.drwt_no2,
      drwtNo3: d.drwt_no3,
      drwtNo4: d.drwt_no4,
      drwtNo5: d.drwt_no5,
      drwtNo6: d.drwt_no6,
      bnusNo: d.bnus_no,
    }));

    const simulator = new WinningSimulator(draws);
    const result = simulator.simulate(numbers);

    // 4. Deduct & Save
    await supabase
      .from("user_points")
      .update({
        balance: userPoints.balance - SIMULATION_COST,
        total_spent: (Number(userPoints.total_spent) || 0) + SIMULATION_COST,
      })
      .eq("user_id", user.id);

    await supabase.from("point_transactions").insert({
      user_id: user.id,
      transaction_type: "use",
      amount: -SIMULATION_COST,
      balance_after: userPoints.balance - SIMULATION_COST,
      description: "당첨 시뮬레이션",
      feature_type: "simulation_analysis",
    });

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
