import { createAdminClient } from "@/shared/lib/supabase/admin";
import { createClient } from "@/shared/lib/supabase/server";
import { getKstDayStartIso } from "@/shared/lib/date-utils";
import { unexpectedErrorResponse } from "@/shared/lib/api/route-error";
import { NextRequest, NextResponse } from "next/server";
import { WinningSimulator } from "@/features/lotto/services/winning-simulator";
import { validateLottoNumbers } from "@/features/lotto/lib/validate-lotto-numbers";
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

    if (!validateLottoNumbers(numbers)) {
      return NextResponse.json(
        { error: "1~45 범위의 서로 다른 번호 6개를 선택해주세요." },
        { status: 400 },
      );
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
      const { error: insertError } = await supabase
        .from("analysis_results")
        .insert({
          user_id: user.id,
          analysis_type: "simulation",
          input_params: { numbers },
          result_data: result,
          points_spent: 0, // 무료로 변경
        });

      // XP(20)는 KST 기준 하루 첫 시뮬레이션에만 지급한다 (반복 호출 XP 파밍 방지).
      // 방금 저장한 행을 포함해 오늘 행이 정확히 1개일 때만 지급하므로,
      // 동시 요청이 겹치면 지급하지 않는 쪽(fail-closed)으로 동작한다.
      // 카운트는 RLS 영향을 받지 않도록 service_role 로 조회한다.
      if (!insertError) {
        const adminSupabase = createAdminClient();
        const { count, error: countError } = await adminSupabase
          .from("analysis_results")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("analysis_type", "simulation")
          .gte("created_at", getKstDayStartIso());

        if (!countError && count === 1) {
          // add_xp 는 service_role 로만 호출한다.
          await adminSupabase.rpc("add_xp", {
            user_uuid: user.id,
            xp_to_add: 20,
          });
        }
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    return unexpectedErrorResponse("api/lotto/analysis/simulation", err);
  }
}
