import { createAdminClient } from "@/shared/lib/supabase/admin";
import { createClient } from "@/shared/lib/supabase/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**
 * API 라우트용 인증/인가 가드.
 *
 * 미들웨어는 `/api` 전체를 public 으로 두기 때문에(src/middleware.ts) 모든 라우트가
 * 스스로 인증해야 한다. 관리자 판별이 라우트마다 제각각(admin_users / approved_users /
 * 빈 블록)이던 문제를 막기 위해, 권한 검사는 반드시 이 파일의 가드를 통하도록 한다.
 *
 * 사용법:
 *   const guard = await requireAdmin();
 *   if (!guard.ok) return guard.response;
 *   const { user, supabase } = guard;
 */
export type GuardResult =
  | { ok: true; user: User; supabase: SupabaseClient }
  | { ok: false; response: NextResponse };

function deny(status: number, error: string): GuardResult {
  return { ok: false, response: NextResponse.json({ error }, { status }) };
}

/** 로그인한 사용자만 통과시킨다. */
export async function requireUser(): Promise<GuardResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return deny(401, "Unauthorized");

  return { ok: true, user, supabase };
}

/**
 * 이메일 인증까지 마친 사용자만 통과시킨다.
 *
 * 이 서비스의 실질적인 가입 관문은 이메일 인증이다. `approved_users` 등록은
 * 인증 직후 자동으로 이뤄지므로(src/app/api/auth/approval/route.ts) 별도의
 * 승인 심사 단계로 취급하지 않는다.
 */
export async function requireVerifiedUser(): Promise<GuardResult> {
  const guard = await requireUser();
  if (!guard.ok) return guard;

  if (!guard.user.email_confirmed_at) {
    return deny(403, "이메일 인증이 필요합니다.");
  }

  return guard;
}

/**
 * 관리자만 통과시킨다.
 *
 * 판별 기준은 `admin_users` 테이블 하나뿐이다. `approved_users` 는 일반 회원
 * 목록이므로 관리자 판별에 사용해서는 안 된다.
 *
 * 조회에는 service_role 클라이언트를 쓴다. 세션에서 검증된 이메일로만 조회하므로
 * 안전하고, `admin_users` 의 RLS 정책에 결과가 좌우되지 않는다.
 */
export async function requireAdmin(): Promise<GuardResult> {
  const guard = await requireUser();
  if (!guard.ok) return guard;

  const email = guard.user.email;
  if (!email) return deny(403, "Forbidden");

  const { data: adminUser, error } = await createAdminClient()
    .from("admin_users")
    .select("id")
    .eq("email", email)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("[requireAdmin] admin_users 조회 실패", error);
    return deny(500, "권한 확인에 실패했습니다.");
  }

  if (!adminUser) return deny(403, "Forbidden");

  return guard;
}
