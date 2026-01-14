import { createClient } from "@/shared/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { WinningSimulator } from "@/features/lotto/services/winning-simulator";
import { LottoDraw } from "@/features/lotto/types";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // 사용자 정보 가져오기 (로그인 여부 확인용, 필수 아님)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    const body = await request.json();
    const { numbers, drawRange } = body; // [1, 2, 3, 4, 5, 6], { startDraw?: number, endDraw?: number }

    if (!numbers || !Array.isArray(numbers) || numbers.length !== 6) {
      return NextResponse.json({ error: "Invalid numbers" }, { status: 400 });
    }

    // 3. Fetch Data & Filter by Draw Range with Pagination
    const PAGE_SIZE = 1000;
    const allLottoData: LottoDraw[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      let query = supabase
        .from("lotto_draws")
        .select("*")
        .order("drw_no", { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);

      // 회차 범위 필터링
      if (
        drawRange?.startDraw !== undefined &&
        drawRange?.endDraw !== undefined
      ) {
        query = query
          .gte("drw_no", drawRange.startDraw)
          .lte("drw_no", drawRange.endDraw);
      }

      const { data: pageData, error: lottoError } = await query;

      if (lottoError) throw new Error("Failed to fetch lotto data");

      if (!pageData || pageData.length === 0) {
        hasMore = false;
      } else {
        allLottoData.push(...(pageData as LottoDraw[]));
        // 페이지 크기보다 적게 반환되면 마지막 페이지
        if (pageData.length < PAGE_SIZE) {
          hasMore = false;
        } else {
          offset += PAGE_SIZE;
        }
      }
    }

    if (allLottoData.length === 0) {
      return NextResponse.json(
        { error: "선택한 회차 범위에 데이터가 없습니다." },
        { status: 400 },
      );
    }

    const lottoData = allLottoData;

    // DB 스키마와 타입이 일치하므로 직접 사용
    const draws: LottoDraw[] = lottoData;

    const simulator = new WinningSimulator(draws);
    const result = simulator.simulate(numbers);

    // 로그인한 사용자인 경우에만 결과 저장 및 XP 지급
    if (user) {
      await supabase.from("analysis_results").insert({
        user_id: user.id,
        analysis_type: "simulation",
        input_params: { numbers },
        result_data: result,
        points_spent: 0, // 무료로 변경
      });

      // XP 지급 (20 XP)
      await supabase.rpc("add_xp", {
        user_uuid: user.id,
        xp_to_add: 20,
      });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
