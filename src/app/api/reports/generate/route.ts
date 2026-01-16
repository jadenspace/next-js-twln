import { createClient } from "@/shared/lib/supabase/server";
import { createAdminClient } from "@/shared/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { aggregateRankings } from "@/features/lotto/lib/calculate-ranking";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // 관리자 권한 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 관리자 여부 확인
  const { data: adminCheck } = await supabase
    .from("admin_users")
    .select("id")
    .eq("email", user.email)
    .eq("is_active", true)
    .maybeSingle();

  if (!adminCheck) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const { draw_no } = body;

    if (!draw_no) {
      return NextResponse.json(
        { error: "draw_no is required" },
        { status: 400 },
      );
    }

    // 1. 해당 회차 당첨 정보 조회
    const { data: currentDraw, error: drawError } = await supabase
      .from("lotto_draws")
      .select("*")
      .eq("drw_no", draw_no)
      .single();

    if (drawError || !currentDraw) {
      return NextResponse.json({ error: "Draw not found" }, { status: 404 });
    }

    // 2. 이전 회차의 created_at 조회 (수집 시작 시점)
    const { data: prevDraw } = await supabase
      .from("lotto_draws")
      .select("created_at")
      .eq("drw_no", draw_no - 1)
      .single();

    const periodStart = prevDraw?.created_at || new Date(0).toISOString();
    const periodEnd = currentDraw.created_at;

    // 3. 해당 기간 내 저장된 번호 조회
    const { data: savedNumbers, error: numbersError } = await adminSupabase
      .from("saved_lotto_numbers")
      .select("numbers, source")
      .gte("created_at", periodStart)
      .lt("created_at", periodEnd);

    if (numbersError) throw numbersError;

    // 당첨 번호 추출
    const winningNumbers = [
      currentDraw.drwt_no1,
      currentDraw.drwt_no2,
      currentDraw.drwt_no3,
      currentDraw.drwt_no4,
      currentDraw.drwt_no5,
      currentDraw.drwt_no6,
    ];
    const bonusNumber = currentDraw.bnus_no;

    // 4. 전체 결과 집계
    const allNumbers = (savedNumbers || []).map((n) => n.numbers);
    const totalResults = aggregateRankings(
      allNumbers,
      winningNumbers,
      bonusNumber,
    );

    // 5. 소스별 결과 집계
    const simulationNumbers = (savedNumbers || [])
      .filter((n) => n.source === "simulation")
      .map((n) => n.numbers);
    const patternNumbers = (savedNumbers || [])
      .filter((n) => n.source === "pattern_generator")
      .map((n) => n.numbers);

    const statsBySource = {
      simulation: aggregateRankings(
        simulationNumbers,
        winningNumbers,
        bonusNumber,
      ),
      pattern_generator: aggregateRankings(
        patternNumbers,
        winningNumbers,
        bonusNumber,
      ),
    };

    // 6. 리포트 저장
    const { data: report, error: insertError } = await adminSupabase
      .from("weekly_reports")
      .upsert(
        {
          draw_no,
          draw_date: currentDraw.drw_no_date,
          winning_numbers: winningNumbers,
          bonus_number: bonusNumber,
          period_start: periodStart,
          period_end: periodEnd,
          total_entries: totalResults.total,
          rank_1_count: totalResults.rank_1,
          rank_2_count: totalResults.rank_2,
          rank_3_count: totalResults.rank_3,
          rank_4_count: totalResults.rank_4,
          rank_5_count: totalResults.rank_5,
          no_win_count: totalResults.no_win,
          stats_by_source: statsBySource,
        },
        { onConflict: "draw_no" },
      )
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (err: any) {
    console.error("Failed to generate report:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
