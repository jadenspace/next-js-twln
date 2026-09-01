import { createClient } from "@/shared/lib/supabase/server";
import {
  supabaseErrorResponse,
  unexpectedErrorResponse,
} from "@/shared/lib/api/route-error";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Increment view count (Simple update)
    await supabase.rpc("increment_view_count", { post_uuid: id });
    // If RPC doesn't exist, we'll need to create it or do manual update.
    // For now let's do manual update if RPC fails or just select.

    const { data, error } = await supabase
      .from("posts")
      .select(
        `
        *,
        user:user_profiles!user_id (email),
        comments (
            *,
            user:user_profiles!user_id (email)
        )
    `,
      )
      .eq("id", id)
      .single();

    if (error) return supabaseErrorResponse(error);

    // Manual increment fallback if RPC not used
    await supabase
      .from("posts")
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq("id", id);

    return NextResponse.json({ data });
  } catch (error) {
    return unexpectedErrorResponse("api/community/posts/[id]", error);
  }
}
