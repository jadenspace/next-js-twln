import { createClient } from "@/shared/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;

  const drwNoStart = searchParams.get("drwNoStart");
  const drwNoEnd = searchParams.get("drwNoEnd");
  const dateStart = searchParams.get("dateStart");
  const dateEnd = searchParams.get("dateEnd");

  let query = supabase.from("lotto_draws").select("*");

  if (drwNoStart || drwNoEnd) {
    if (drwNoStart) {
      query = query.gte("drw_no", parseInt(drwNoStart));
    }
    if (drwNoEnd) {
      query = query.lte("drw_no", parseInt(drwNoEnd));
    }
    query = query.order("drw_no", { ascending: false });
  } else if (dateStart || dateEnd) {
    if (dateStart) {
      query = query.gte("drw_no_date", dateStart);
    }
    if (dateEnd) {
      query = query.lte("drw_no_date", dateEnd);
    }
    query = query.order("drw_no", { ascending: false });
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
