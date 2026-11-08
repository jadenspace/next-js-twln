import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/shared/lib/auth/guards";
import {
  supabaseErrorResponse,
  unexpectedErrorResponse,
} from "@/shared/lib/api/route-error";
import type { LottoDraw } from "@/features/lotto/types";
import { buildWeeklyStrategyLabData } from "@/features/lotto/lib/weekly-strategy-lab";

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;
    const { supabase } = guard;

    const targetBaseDraw =
      Number(request.nextUrl.searchParams.get("baseDraw")) || undefined;

    const allDraws: LottoDraw[] = [];
    const PAGE_SIZE = 1000;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      let query = supabase
        .from("lotto_draws")
        .select("*")
        .order("drw_no", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (targetBaseDraw) {
        query = query.lte("drw_no", targetBaseDraw);
      }

      const { data, error } = await query;
      if (error) return supabaseErrorResponse(error);

      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        allDraws.push(...(data as LottoDraw[]));
        if (data.length < PAGE_SIZE) {
          hasMore = false;
        } else {
          offset += PAGE_SIZE;
        }
      }
    }

    const payload = buildWeeklyStrategyLabData(allDraws);
    return NextResponse.json(payload);
  } catch (error) {
    return unexpectedErrorResponse("api/admin/lotto-strategy-lab", error);
  }
}
