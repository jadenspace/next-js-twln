import { createClient } from "@/shared/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { LottoDraw } from "@/features/lotto/types";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;

  const drwNoStart = searchParams.get("drwNoStart");
  const drwNoEnd = searchParams.get("drwNoEnd");
  const dateStart = searchParams.get("dateStart");
  const dateEnd = searchParams.get("dateEnd");

  // Default: recent 10 (no pagination needed for small limit)
  if (!drwNoStart && !drwNoEnd && !dateStart && !dateEnd) {
    const { data, error } = await supabase
      .from("lotto_draws")
      .select("*")
      .order("drw_no", { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  }

  // Pagination for range queries
  const PAGE_SIZE = 1000;
  const allData: LottoDraw[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    let query = supabase
      .from("lotto_draws")
      .select("*")
      .order("drw_no", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (drwNoStart || drwNoEnd) {
      if (drwNoStart) {
        query = query.gte("drw_no", parseInt(drwNoStart));
      }
      if (drwNoEnd) {
        query = query.lte("drw_no", parseInt(drwNoEnd));
      }
    } else if (dateStart || dateEnd) {
      if (dateStart) {
        query = query.gte("drw_no_date", dateStart);
      }
      if (dateEnd) {
        query = query.lte("drw_no_date", dateEnd);
      }
    }

    const { data: pageData, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!pageData || pageData.length === 0) {
      hasMore = false;
    } else {
      allData.push(...(pageData as LottoDraw[]));
      // 페이지 크기보다 적게 반환되면 마지막 페이지
      if (pageData.length < PAGE_SIZE) {
        hasMore = false;
      } else {
        offset += PAGE_SIZE;
      }
    }
  }

  return NextResponse.json({ data: allData });
}
