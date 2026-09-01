import { getKstDateString } from "@/shared/lib/date-utils";
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

    const today = getKstDateString();

    const { data, error } = await supabase
      .from("attendance_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("check_in_date", today)
      .maybeSingle();

    if (error) return supabaseErrorResponse(error);

    return NextResponse.json({ isCheckedIn: !!data });
  } catch (error) {
    return unexpectedErrorResponse("api/attendance/status", error);
  }
}
