import { createClient } from "@/shared/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { StatisticsCalculator } from "@/features/lotto/services/statistics-calculator";
import { LottoDraw } from "@/features/lotto/types";
import type { StatsData } from "@/features/lotto/types/pattern-filter.types";

/**
 * 패턴 생성기용 통계 데이터 API
 * 핫/콜드 번호, 직전 회차 번호, 미출현 번호 정보를 제공
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  try {
    // 최신 회차 번호 조회
    const { data: latestDraw, error: latestError } = await supabase
      .from("lotto_draws")
      .select("drw_no")
      .order("drw_no", { ascending: false })
      .limit(1)
      .single();

    if (latestError || !latestDraw) {
      return NextResponse.json(
        { error: "Failed to fetch latest draw number" },
        { status: 500 },
      );
    }

    const latestDrawNo = latestDraw.drw_no;

    // 최근 10회차 데이터 가져오기 (핫/콜드 계산용)
    // 최신 회차부터 정확히 10개를 가져오기 위해 명시적으로 범위 지정
    const { data: recentDraws, error: recentError } = await supabase
      .from("lotto_draws")
      .select("*")
      .lte("drw_no", latestDrawNo)
      .order("drw_no", { ascending: false })
      .limit(10);

    if (recentError || !recentDraws || recentDraws.length === 0) {
      return NextResponse.json(
        { error: "Failed to fetch recent draws" },
        { status: 500 },
      );
    }

    // 최근 50회차 데이터 가져오기 (미출현 번호 계산용)
    // 최신 회차부터 정확히 50개를 가져오기 위해 명시적으로 범위 지정
    const { data: allDraws, error: allError } = await supabase
      .from("lotto_draws")
      .select("*")
      .lte("drw_no", latestDrawNo)
      .order("drw_no", { ascending: false })
      .limit(50);

    if (allError || !allDraws || allDraws.length === 0) {
      return NextResponse.json(
        { error: "Failed to fetch draws data" },
        { status: 500 },
      );
    }

    const draws: LottoDraw[] = allDraws;
    const lastDraw = draws[0];

    // 최근 10회차 기준 출현 빈도 계산
    const recentFrequency: Record<number, number> = {};
    for (let i = 1; i <= 45; i++) {
      recentFrequency[i] = 0;
    }

    recentDraws.forEach((draw: LottoDraw) => {
      const numbers = [
        draw.drwt_no1,
        draw.drwt_no2,
        draw.drwt_no3,
        draw.drwt_no4,
        draw.drwt_no5,
        draw.drwt_no6,
      ];
      numbers.forEach((num) => {
        recentFrequency[num]++;
      });
    });

    // 핫 번호 (상위 15개)
    const sortedByFrequency = Object.entries(recentFrequency)
      .map(([num, count]) => ({ num: parseInt(num), count }))
      .sort((a, b) => b.count - a.count);

    const hotNumbers = sortedByFrequency.slice(0, 15).map((item) => item.num);

    // 콜드 번호 (하위 15개)
    const coldNumbers = sortedByFrequency
      .slice(-15)
      .map((item) => item.num)
      .reverse();

    // 직전 회차 번호
    const previousNumbers = [
      lastDraw.drwt_no1,
      lastDraw.drwt_no2,
      lastDraw.drwt_no3,
      lastDraw.drwt_no4,
      lastDraw.drwt_no5,
      lastDraw.drwt_no6,
    ].sort((a, b) => a - b);

    // 미출현 번호 계산 (10회, 15회, 20회, 30회 기준)
    const missNumbers: Record<number, number[]> = {};
    const thresholds = [10, 15, 20, 30];

    // 각 번호별 마지막 출현 회차 계산
    const lastAppearance: Record<number, number> = {};
    for (let i = 1; i <= 45; i++) {
      lastAppearance[i] = 0;
    }

    draws.forEach((draw: LottoDraw) => {
      const numbers = [
        draw.drwt_no1,
        draw.drwt_no2,
        draw.drwt_no3,
        draw.drwt_no4,
        draw.drwt_no5,
        draw.drwt_no6,
      ];
      numbers.forEach((num) => {
        if (lastAppearance[num] === 0) {
          lastAppearance[num] = draw.drw_no;
        }
      });
    });

    // 각 threshold별로 미출현 번호 계산
    thresholds.forEach((threshold) => {
      const missNumbersForThreshold: number[] = [];

      for (let num = 1; num <= 45; num++) {
        const missCount =
          lastAppearance[num] === 0
            ? draws.length // 전체 기간 동안 미출현
            : latestDrawNo - lastAppearance[num];

        if (missCount >= threshold) {
          missNumbersForThreshold.push(num);
        }
      }

      missNumbers[threshold] = missNumbersForThreshold.sort((a, b) => a - b);
    });

    const statsData: StatsData = {
      hotNumbers,
      coldNumbers,
      previousNumbers,
      missNumbers,
      lastDrawNo: latestDrawNo,
    };

    return NextResponse.json({
      success: true,
      data: statsData,
    });
  } catch (err: unknown) {
    console.error("Pattern stats error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "알 수 없는 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
