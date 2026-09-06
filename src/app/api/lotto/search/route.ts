import { createClient } from "@/shared/lib/supabase/server";
import {
  supabaseErrorResponse,
  unexpectedErrorResponse,
} from "@/shared/lib/api/route-error";
import { NextRequest, NextResponse } from "next/server";
import { LottoDraw } from "@/features/lotto/types";
import {
  buildNumberOrFilter,
  isDefaultSearch,
  MAX_RESULTS,
  parseLottoSearchParams,
} from "@/features/lotto/lib/search-query";

const DEFAULT_LIMIT = 10;

// Next.js 라우트 파일은 HTTP 핸들러 외의 값을 export 할 수 없어서
// 응답 타입은 hooks/use-lotto-search.ts 의 LottoSearchResult 와 맞춘다.
interface LottoSearchResponse {
  data: LottoDraw[];
  truncated: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const parsed = parseLottoSearchParams(request.nextUrl.searchParams);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const q = parsed.value;

    const supabase = await createClient();
    let query = supabase
      .from("lotto_draws")
      .select("*")
      .order("drw_no", { ascending: false });

    if (isDefaultSearch(q)) {
      const { data, error } = await query.limit(DEFAULT_LIMIT);
      if (error) return supabaseErrorResponse(error);
      const body: LottoSearchResponse = {
        data: (data ?? []) as LottoDraw[],
        truncated: false,
      };
      return NextResponse.json(body);
    }

    if (q.drwNoStart !== undefined) query = query.gte("drw_no", q.drwNoStart);
    if (q.drwNoEnd !== undefined) query = query.lte("drw_no", q.drwNoEnd);
    if (q.dateStart) query = query.gte("drw_no_date", q.dateStart);
    if (q.dateEnd) query = query.lte("drw_no_date", q.dateEnd);
    // 번호마다 or() 를 하나씩 걸면 서로 AND 로 묶여 "모두 포함" 조건이 된다.
    for (const n of q.numbers ?? []) {
      query = query.or(buildNumberOrFilter(n, q.includeBonus));
    }

    // 상한보다 하나 더 가져와서 잘렸는지 판단한다.
    const { data, error } = await query.limit(MAX_RESULTS + 1);
    if (error) return supabaseErrorResponse(error);

    const rows = (data ?? []) as LottoDraw[];
    const truncated = rows.length > MAX_RESULTS;
    const body: LottoSearchResponse = {
      data: truncated ? rows.slice(0, MAX_RESULTS) : rows,
      truncated,
    };
    return NextResponse.json(body);
  } catch (error) {
    return unexpectedErrorResponse("api/lotto/search", error);
  }
}
