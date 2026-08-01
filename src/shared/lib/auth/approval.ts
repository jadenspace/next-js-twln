import { createAdminClient } from "@/shared/lib/supabase/admin";

/**
 * 회원 승인 상태 변경 (서버 전용).
 *
 * 이전에는 브라우저가 anon 클라이언트로 `approved_users` 를 직접 upsert 했다.
 * 이메일을 인자로 받는 구조라 다른 사람의 승인 상태까지 건드릴 수 있었고,
 * 이 테이블이 한때 결제 승인 권한의 판별 기준이기도 해서 권한 상승 경로가 됐다.
 *
 * 이제 쓰기는 이 헬퍼를 통해 서버에서만 일어난다. 호출자가 이메일의 소유권
 * 또는 관리자 권한을 먼저 검증해야 한다.
 */
export async function setApprovalStatus(
  email: string,
  approved: boolean,
  actorEmail: string,
): Promise<void> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data: existing, error: lookupError } = await supabase
    .from("approved_users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`승인 목록 조회 실패: ${lookupError.message}`);
  }

  if (existing) {
    const { error } = await supabase
      .from("approved_users")
      .update({
        is_active: approved,
        approved_by: actorEmail,
        approved_at: approved ? now : null,
        updated_at: now,
      })
      .eq("id", existing.id);

    if (error) throw new Error(`승인 상태 변경 실패: ${error.message}`);
  } else if (approved) {
    const { error } = await supabase.from("approved_users").insert({
      email,
      approved_by: actorEmail,
      is_active: true,
      approved_at: now,
    });

    if (error) throw new Error(`승인 사용자 추가 실패: ${error.message}`);
  }

  const { error: profileError } = await supabase
    .from("user_profiles")
    .update({
      is_approved: approved,
      approved_at: approved ? now : null,
      updated_at: now,
    })
    .eq("email", email);

  if (profileError) {
    throw new Error(`프로필 업데이트 실패: ${profileError.message}`);
  }
}
