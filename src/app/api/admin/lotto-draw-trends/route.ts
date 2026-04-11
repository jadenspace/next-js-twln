import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";
import type { LottoDraw } from "@/features/lotto/types";
import {
  buildDrawTrendRows,
  buildDrawTrendSummary,
} from "@/features/lotto/lib/draw-trend-analysis";

const DEFAULT_LIMIT = 120;
const MAX_LIMIT = 300;

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("email")
    .eq("email", user.email)
    .eq("is_active", true)
    .maybeSingle();

  if (adminError || !adminUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const startDraw = Number(searchParams.get("startDraw")) || undefined;
  const endDraw = Number(searchParams.get("endDraw")) || undefined;
  const limitParam = Number(searchParams.get("limit"));
  const limit =
    Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(limitParam, MAX_LIMIT)
      : DEFAULT_LIMIT;

  let query = supabase
    .from("lotto_draws")
    .select("*")
    .order("drw_no", { ascending: false })
    .limit(limit);

  if (startDraw) {
    query = query.gte("drw_no", startDraw);
  }

  if (endDraw) {
    query = query.lte("drw_no", endDraw);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const draws = (data ?? []) as LottoDraw[];
  const rows = buildDrawTrendRows(draws);
  const summary = buildDrawTrendSummary(rows);

  return NextResponse.json({ rows, summary });
}
