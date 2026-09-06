import { createClient } from "@/shared/lib/supabase/client";

export const adminApi = {
  // getAdminUsers(관리자 전체 목록을 브라우저에서 조회)는 제거했다.
  // 유일한 호출처였던 문의 상세 페이지가 답변 작성자 배지를 위해 쓰고 있었는데,
  // 답변은 서버가 관리자에게만 허용하므로 목록이 필요 없고, 비로그인 방문자에게까지
  // 관리자 이메일 명단이 내려가는 문제가 있었다.

  // 특정 사용자가 관리자인지 확인 (본인 행만 조회)
  async isUserAdmin(userEmail: string): Promise<boolean> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("admin_users")
      .select("email, role")
      .eq("email", userEmail)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) {
      return false;
    }

    // admin_users 테이블에 있는 사용자만 관리자
    return true;
  },
};

// addAdmin / removeAdmin 은 제거했다.
// 호출하는 곳이 없는데다 이름과 달리 admin_users 가 아니라 approved_users(일반
// 회원 승인 목록)를 수정하고 있었다. 관리자 권한 부여는 브라우저에서 할 일이
// 아니므로, 필요해지면 requireAdmin 가드를 쓰는 서버 라우트로 만들 것.
// 참고: src/shared/lib/auth/guards.ts
