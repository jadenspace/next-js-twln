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

  // 관리자 추가
  async addAdmin(email: string, addedBy: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase.from("approved_users").upsert({
      email,
      approved_by: addedBy,
      is_active: true,
      approved_at: new Date().toISOString(),
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  // 관리자 제거
  async removeAdmin(email: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
      .from("approved_users")
      .update({ is_active: false })
      .eq("email", email);

    if (error) {
      throw new Error(error.message);
    }
  },
};
