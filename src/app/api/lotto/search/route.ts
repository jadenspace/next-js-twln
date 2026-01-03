import { createClient } from "@/shared/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;

  const drwNo = searchParams.get("drwNo");
  const date = searchParams.get("date");

  let query = supabase.from("lotto_history").select("*");

  if (drwNo) {
    query = query.eq("drw_no", drwNo);
  } else if (date) {
    // Basic date matching (YYYY-MM-DD)
    query = query.eq("drw_no_date", date);
  } else {
    // Default: recent 10 (or pagination)
    query = query.order("drw_no", { ascending: false }).limit(10);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
