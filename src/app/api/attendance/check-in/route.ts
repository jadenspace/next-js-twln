import { getKstDateString } from "@/shared/lib/date-utils";
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

  const today = getKstDateString();

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

    // 2. Grant Points via RPC (Handles user_points and point_transactions)
    const { data: pointResult, error: pointError } = await supabase.rpc(
      "add_points",
      {
        user_uuid: user.id,
        amount_to_add: ATTENDANCE_REWARD,
        transaction_type: "bonus",
        description_text: "일일 출석체크 보너스",
        feat_type: "attendance",
      },
    );

    if (pointError || !pointResult?.success) {
      throw new Error(pointError?.message || "Failed to grant points");
    }

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
