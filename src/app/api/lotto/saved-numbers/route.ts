import {
  MAX_SAVED_NUMBERS_PER_USER,
  parseSavedNumbersInput,
} from "@/features/lotto/lib/saved-numbers-input";
import { requireUser } from "@/shared/lib/auth/guards";
import { unexpectedErrorResponse } from "@/shared/lib/api/route-error";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function parsePositiveInt(
  value: string | null,
  fallback: number,
  { min, max }: { min: number; max: number },
): number {
  const parsed = Number(value);
  if (value === null || !Number.isInteger(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

export async function GET(request: NextRequest) {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;
  const { user, supabase } = guard;

  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source"); // 'simulation' | 'pattern_generator' | null (전체)
    const limit = parsePositiveInt(searchParams.get("limit"), DEFAULT_LIMIT, {
      min: 1,
      max: MAX_LIMIT,
    });
    const offset = parsePositiveInt(searchParams.get("offset"), 0, {
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
    });

    let query = supabase
      .from("saved_lotto_numbers")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (source) {
      query = query.eq("source", source);
    }

    const { data, count, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      data,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (err) {
    return unexpectedErrorResponse("api/lotto/saved-numbers", err);
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;
  const { user, supabase } = guard;

  try {
    const body = await request.json().catch(() => null);
    const input = parseSavedNumbersInput(body);
    if (!input.ok) {
      return NextResponse.json({ error: input.error }, { status: 400 });
    }

    // 사용자별 총 저장 개수 상한. 스크립트로 수만 행을 밀어 넣는 것을 막는다.
    const { count: existing, error: countError } = await supabase
      .from("saved_lotto_numbers")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (countError) throw countError;

    if ((existing ?? 0) + input.rows.length > MAX_SAVED_NUMBERS_PER_USER) {
      return NextResponse.json(
        {
          error: `저장 번호는 최대 ${MAX_SAVED_NUMBERS_PER_USER}개까지 보관할 수 있습니다. 기존 번호를 삭제한 뒤 다시 시도해주세요.`,
        },
        { status: 409 },
      );
    }

    const insertData = input.rows.map((numbers) => ({
      user_id: user.id,
      numbers,
      source: input.source,
      filters: input.filters,
    }));

    const { data, error } = await supabase
      .from("saved_lotto_numbers")
      .insert(insertData)
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return unexpectedErrorResponse("api/lotto/saved-numbers", err);
  }
}
