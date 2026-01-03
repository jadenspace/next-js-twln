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
      .single();

    if (!userPoints || userPoints.balance < PATTERN_COST) {
      return NextResponse.json(
        { error: "Insufficient points" },
        { status: 402 },
      );
    }

    // Fetch data
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

    const analyzer = new PatternAnalyzer(draws);
    const result = analyzer.calculatePatterns();

    // Deduct & Save
    await supabase
      .from("user_points")
      .update({
        balance: userPoints.balance - PATTERN_COST,
        total_spent: (Number(userPoints.total_spent) || 0) + PATTERN_COST,
      })
      .eq("user_id", user.id);

    await supabase.from("point_transactions").insert({
      user_id: user.id,
      transaction_type: "use",
      amount: -PATTERN_COST,
      balance_after: userPoints.balance - PATTERN_COST,
      description: "로또 패턴 분석",
      feature_type: "pattern_analysis",
    });

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
