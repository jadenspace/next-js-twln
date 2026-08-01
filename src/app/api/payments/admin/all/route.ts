import { requireAdmin } from "@/shared/lib/auth/guards";
import { createAdminClient } from "@/shared/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  // 이전 구현은 user_profiles.role 을 읽고도 조건문 본문이 비어 있어 사실상
  // 아무나 전체 결제 내역(이메일·입금자명 포함)을 조회할 수 있었다.
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { data, error } = await createAdminClient()
    .from("payments")
    .select(
      `
        *,
        user:user_profiles!user_id (email)
    `,
    )
    .order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}
