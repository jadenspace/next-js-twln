import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/shared/lib/auth/guards";
import {
  supabaseErrorResponse,
  unexpectedErrorResponse,
} from "@/shared/lib/api/route-error";
import type { LottoDraw } from "@/features/lotto/types";
import {
  buildDrawTrendRows,
  buildDrawTrendSummary,
} from "@/features/lotto/lib/draw-trend-analysis";

const DEFAULT_LIMIT = 120;
const MAX_LIMIT = 300;

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;
    const { supabase } = guard;

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

    if (error) return supabaseErrorResponse(error);

    const draws = (data ?? []) as LottoDraw[];
    const rows = buildDrawTrendRows(draws);
    const summary = buildDrawTrendSummary(rows);

    return NextResponse.json({ rows, summary });
  } catch (error) {
    return unexpectedErrorResponse("api/admin/lotto-draw-trends", error);
  }
}
