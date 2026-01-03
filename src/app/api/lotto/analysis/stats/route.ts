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
    // 2. Check Point Balance & Deduct Points
    // Using RPC or simple checking - for MVP doing simple check then transaction record
    // Ideally use a database transaction or stored procedure to ensure atomicity

    // Check balance
    const { data: userPoints } = await supabase
      .from("user_points")
      .select("balance, total_spent")
      .eq("user_id", user.id)
      .single();

    if (!userPoints || userPoints.balance < STATS_COST) {
      return NextResponse.json(
        { error: "Insufficient points" },
        { status: 402 },
      );
    }

    // 3. Perform Analysis
    // Fetch all lotto data (cached or direct DB)
    const { data: lottoData, error: lottoError } = await supabase
      .from("lotto_history")
      .select("*");

    if (lottoError || !lottoData) {
      throw new Error("Failed to fetch lotto data");
    }

    // Map DB fields to Interface if necessary (assuming DB columns match or snake_case to camelCase conversion needed)
    // Supabase returns snake_case usually, need to ensure type compatibility
    // Quick mapping if needed, or assume interface allows flexible mapping.
    // Let's do explicit mapping for safety.
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

    const calculator = new StatisticsCalculator(draws);
    const result = calculator.calculateBasicStats();

    // 4. Deduct Points & Save Result
    // Deduct
    const { error: updateError } = await supabase.rpc("decrement_balance", {
      user_uuid: user.id,
      amount: STATS_COST,
    });
    // Note: If 'decrement_balance' RPC doesn't exist, use direct update. Be careful with concurrency.
    // Fallback manual update if RPC missing (Create RPC is best practice, but for this context assuming direct update)

    await supabase
      .from("user_points")
      .update({
        balance: userPoints.balance - STATS_COST,
        total_spent: (Number(userPoints.total_spent) || 0) + STATS_COST,
      })
      .eq("user_id", user.id);

    // Record Transaction
    await supabase.from("point_transactions").insert({
      user_id: user.id,
      transaction_type: "use",
      amount: -STATS_COST,
      balance_after: userPoints.balance - STATS_COST,
      description: "로또 기본 통계 분석",
      feature_type: "stat_analysis",
    });

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
