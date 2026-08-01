import { createClient } from "@/shared/lib/supabase/client";

export interface AdminUser {
  email: string;
  role: string;
  created_at: string;
}

export const adminApi = {
  // 관리자 목록 조회
  async getAdminUsers(): Promise<AdminUser[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("admin_users")
      .select("email, role, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (
      data?.map((user) => ({
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      })) || []
    );
  },

  // 특정 사용자가 관리자인지 확인
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
