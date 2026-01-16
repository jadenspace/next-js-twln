import { createClient } from "@/shared/lib/supabase/server";
import { NextResponse } from "next/server";
import { StatisticsCalculator } from "@/features/lotto/services/statistics-calculator";
import { LottoDraw } from "@/features/lotto/types";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("lotto_draws")
      .select("*")
      .order("drw_no", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json(
        { error: "Failed to fetch data" },
        { status: 500 },
      );
    }

    const draws = data as LottoDraw[];

    if (!draws || draws.length === 0) {
      return NextResponse.json({ hot: [], cold: [] });
    }

    // Hot: 최근 10회 기준 빈도수 상위 5개
    // 번호가 적게 선택되지 않도록 동점 처리 등을 생각할 수 있으나, 일단 단순 상위 5개
    const recent10Draws = draws.slice(0, 10);
    const hotCalc = new StatisticsCalculator(recent10Draws);
    const hotStats = hotCalc.calculateBasicStats();

    const hotNumbers = Object.entries(hotStats.frequency)
      .sort(([, a], [, b]) => b - a) // 빈도 내림차순
      .slice(0, 5)
      .map(([num]) => parseInt(num));

    // Cold: 최근 100회 기준 미출현(missCount) 상위 5개
    const coldCalc = new StatisticsCalculator(draws);
    const coldStats = coldCalc.calculateBasicStats();

    const coldNumbers = Object.entries(coldStats.missCount)
      .sort(([, a], [, b]) => b - a) // 미출현 기간 내림차순
      .slice(0, 5)
      .map(([num]) => parseInt(num));

    return NextResponse.json({
      hot: hotNumbers,
      cold: coldNumbers,
    });
  } catch (err: any) {
    console.error("Server Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
