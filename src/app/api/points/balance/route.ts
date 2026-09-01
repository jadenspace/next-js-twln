import { requireUser } from "@/shared/lib/auth/guards";
import {
  supabaseErrorResponse,
  unexpectedErrorResponse,
} from "@/shared/lib/api/route-error";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const guard = await requireUser();
    if (!guard.ok) return guard.response;
    const { user, supabase } = guard;

    const { data, error } = await supabase
      .from("user_points")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) return supabaseErrorResponse(error);

    if (!data) {
      // User has no points record yet, return 0 or create one?
      // Ideally handled by trigger, but fail safe:
      return NextResponse.json({
        user_id: user.id,
        balance: 0,
        total_earned: 0,
        total_spent: 0,
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    return unexpectedErrorResponse("api/points/balance", error);
  }
}
