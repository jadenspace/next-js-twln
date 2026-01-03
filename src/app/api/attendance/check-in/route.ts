import { createClient } from "@/shared/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const ATTENDANCE_REWARD = 50;

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date().toISOString().split("T")[0];

  try {
    // 1. Insert attendance log (Unique constraint will prevent double dipping)
    const { error: logError } = await supabase.from("attendance_logs").insert({
      user_id: user.id,
      check_in_date: today,
    });

    if (logError) {
      if (logError.code === "23505") {
        // Unique violation
        return NextResponse.json(
          { error: "Already checked in today" },
          { status: 400 },
        );
      }
      throw logError;
    }

    // 2. Grant Points
    // Fetch Current Points
    const { data: userPoints } = await supabase
      .from("user_points")
      .select("balance, total_earned")
      .eq("user_id", user.id)
      .single();

    const newBalance = (userPoints?.balance || 0) + ATTENDANCE_REWARD;
    const newTotalEarned = (userPoints?.total_earned || 0) + ATTENDANCE_REWARD;

    // Upsert user_points
    await supabase.from("user_points").upsert(
      {
        user_id: user.id,
        balance: newBalance,
        total_earned: newTotalEarned,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    // 3. Record Point Transaction
    await supabase.from("point_transactions").insert({
      user_id: user.id,
      transaction_type: "bonus",
      amount: ATTENDANCE_REWARD,
      balance_after: newBalance,
      description: "일일 출석체크 보너스",
      feature_type: "attendance",
    });

    // 4. Grant XP (10 XP)
    await supabase.rpc("add_xp", {
      user_uuid: user.id,
      xp_to_add: 10,
    });

    return NextResponse.json({ success: true, reward: ATTENDANCE_REWARD });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
