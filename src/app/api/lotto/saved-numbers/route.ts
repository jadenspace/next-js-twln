import { createClient } from "@/shared/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source"); // 'simulation' | 'pattern_generator' | null (전체)
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

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
  } catch (err: any) {
    console.error("Failed to fetch saved numbers:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { numbers, source, filters } = body;

    // Validation
    if (!numbers || !Array.isArray(numbers)) {
      return NextResponse.json(
        { error: "numbers must be an array" },
        { status: 400 },
      );
    }

    if (!source || !["simulation", "pattern_generator"].includes(source)) {
      return NextResponse.json(
        { error: "source must be 'simulation' or 'pattern_generator'" },
        { status: 400 },
      );
    }

    // 여러 번호 조합을 한 번에 저장하는 경우
    const numbersToSave = Array.isArray(numbers[0]) ? numbers : [numbers];

    const insertData = numbersToSave.map((nums: number[]) => ({
      user_id: user.id,
      numbers: nums.sort((a, b) => a - b),
      source,
      filters: filters || null,
    }));

    const { data, error } = await supabase
      .from("saved_lotto_numbers")
      .insert(insertData)
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Failed to save numbers:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
