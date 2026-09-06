import { setApprovalStatus } from "@/shared/lib/auth/approval";
import { requireAdmin } from "@/shared/lib/auth/guards";
import { createAdminClient } from "@/shared/lib/supabase/admin";
import {
  supabaseErrorResponse,
  unexpectedErrorResponse,
} from "@/shared/lib/api/route-error";
import { NextRequest, NextResponse } from "next/server";

/**
 * 관리자용 회원 목록(승인 대기 / 승인 완료).
 *
 * 이전에는 관리자 페이지가 브라우저의 anon 클라이언트로 `approved_users` 를
 * 직접 읽었고, 그러려면 이 테이블의 SELECT 정책이 모두에게 열려 있어야 했다.
 * 즉 anon 키만 있으면 누구나 전체 회원 이메일을 내려받을 수 있었다.
 * 목록은 이 라우트에서 관리자 확인 후 service_role 로만 읽는다.
 */
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const admin = createAdminClient();
    const [pending, approved] = await Promise.all([
      admin
        .from("user_profiles")
        .select("id, email, full_name, created_at")
        .eq("is_approved", false)
        .order("created_at", { ascending: false }),
      admin
        .from("approved_users")
        .select("*")
        .eq("is_active", true)
        .order("approved_at", { ascending: false }),
    ]);

    if (pending.error) return supabaseErrorResponse(pending.error);
    if (approved.error) return supabaseErrorResponse(approved.error);

    return NextResponse.json({
      pending: pending.data ?? [],
      approved: approved.data ?? [],
    });
  } catch (err) {
    return unexpectedErrorResponse("api/auth/approval", err);
  }
}

/** 관리자가 다른 회원의 승인 상태를 변경한다. */
export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json();
    const { email, action } = body;

    if (typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    if (action !== "approve" && action !== "revoke") {
      return NextResponse.json(
        { error: 'action must be "approve" or "revoke"' },
        { status: 400 },
      );
    }

    await setApprovalStatus(
      email,
      action === "approve",
      guard.user.email ?? "admin",
    );

    console.info("[auth/approval]", {
      email,
      action,
      actor: guard.user.email,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return unexpectedErrorResponse("api/auth/approval", err);
  }
}
