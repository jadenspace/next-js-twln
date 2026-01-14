import { createClient } from "@/shared/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.email)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: adminCheck, error: adminError } = await supabase
    .from("admin_users")
    .select("id")
    .eq("email", user.email)
    .eq("is_active", true)
    .single();

  if (adminError || !adminCheck) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { content } = await request.json();
    const { id: postId } = await params;

    const { data, error } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        user_id: user.id,
        content,
      })
      .select()
      .single();

    if (error) throw error;

    console.info("[admin-answer]", {
      postId,
      commentId: data?.id,
      adminEmail: user.email,
    });

    // Grant XP (5 XP)
    await supabase.rpc("add_xp", {
      user_uuid: user.id,
      xp_to_add: 5,
    });

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
