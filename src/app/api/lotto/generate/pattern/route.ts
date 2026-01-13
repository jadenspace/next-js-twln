import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";
import { PatternFilter } from "@/features/lotto/services/pattern-filter";
import type {
  PatternFilterState,
  PatternGenerateRequest,
  GeneratedCombination,
} from "@/features/lotto/types/pattern-filter.types";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const body: PatternGenerateRequest = await request.json();
    const { filters, count = 5 } = body;

    // 입력 유효성 검사
    if (!filters) {
      return NextResponse.json(
        { error: "필터 정보가 필요합니다." },
        { status: 400 },
      );
    }

    if (count !== 5 && count !== 10) {
      return NextResponse.json(
        { error: "생성 개수는 5 또는 10이어야 합니다." },
        { status: 400 },
      );
    }

    // 패턴 필터 인스턴스 생성
    const patternFilter = new PatternFilter();

    // 조건에 맞는 조합 생성
    let results: GeneratedCombination[];

    try {
      results = patternFilter.generateFilteredCombinations(filters, count);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "조합 생성에 실패했습니다.",
        },
        { status: 400 },
      );
    }

    // 로그인 사용자인 경우 결과 저장
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      try {
        await supabase.from("generated_combinations").insert({
          user_id: user.id,
          filters: filters,
          results: results,
          count: count,
          generated_at: new Date().toISOString(),
        });
      } catch (saveError) {
        // 저장 실패해도 결과는 반환
        console.error("Failed to save generated combinations:", saveError);
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (err: unknown) {
    console.error("Pattern generation error:", err);
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
