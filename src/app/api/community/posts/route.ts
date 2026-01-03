import { createClient } from "@/shared/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get("limit") || "10");
  const offset = parseInt(searchParams.get("offset") || "0");

  const { data, error, count } = await supabase
    .from("posts")
    // Join with user_profiles if needed, but for now just raw or simple join
    .select(
      `
        *,
        user:user_id (email)
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, count });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { title, content, isNotice } = await request.json();

    const { data, error } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        title,
        content,
        is_notice: isNotice || false,
      })
      .select()
      .single();

    if (error) throw error;

    // Grant XP (10 XP)
    await supabase.rpc("add_xp", {
      user_uuid: user.id,
      xp_to_add: 10,
    });

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
