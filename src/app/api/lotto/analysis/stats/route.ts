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
      .maybeSingle();

    if (!userPoints || userPoints.balance < STATS_COST) {
      return NextResponse.json(
        { error: "Insufficient points" },
        { status: 402 },
      );
    }

    // 3. Perform Analysis
    // Fetch all lotto data (cached or direct DB)
    const { data: lottoData, error: lottoError } = await supabase
      .from("lotto_draws")
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
