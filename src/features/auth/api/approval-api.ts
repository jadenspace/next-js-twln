import { createClient } from "@/shared/lib/supabase/client";
import {
  ApprovalStatus,
  ApprovedUser,
  PendingUser,
  UserProfile,
} from "@/shared/types/auth";

export const approvalApi = {
  // 사용자 승인 여부 확인
  async checkApprovalStatus(email: string): Promise<ApprovalStatus> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("user_profiles")
      .select("is_approved, approved_at")
      .eq("email", email)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      // PGRST116는 데이터가 없는 경우
      throw new Error(error.message);
    }

    return {
      is_approved: data?.is_approved || false,
      approved_at: data?.approved_at || null,
      approved_by: null, // user_profiles에는 approved_by가 없을 수 있음
    };
  },

  // 사용자 프로필 가져오기
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(error.message);
    }

    return data;
  },

  // 승인 대기 중인 사용자 목록 (관리자용)
  async getPendingUsers(): Promise<PendingUser[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("user_profiles")
      .select("id, email, full_name, created_at")
      .eq("is_approved", false)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  // 승인된 사용자 목록 (관리자용)
  async getApprovedUsers(): Promise<ApprovedUser[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("approved_users")
      .select("*")
      .eq("is_active", true)
      .order("approved_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  // 사용자 승인 (관리자용)
  async approveUser(email: string, approvedByEmail: string): Promise<void> {
    const supabase = createClient();

    try {
      // 먼저 함수로 시도
      const { error } = await supabase.rpc("approve_user", {
        user_email: email,
        approved_by_email: approvedByEmail,
      });

      if (error) {
        console.log("함수 호출 실패, 직접 처리:", error);
        // 함수가 실패하면 직접 처리
        await this.approveUserDirectly(email, approvedByEmail);
      }
    } catch (err) {
      console.log("함수 호출 중 오류, 직접 처리:", err);
      // 오류 발생 시 직접 처리
      await this.approveUserDirectly(email, approvedByEmail);
    }
  },

  // 직접 승인 처리 (백업 방법)
  async approveUserDirectly(
    email: string,
    approvedByEmail: string,
  ): Promise<void> {
    const supabase = createClient();

    // approved_users 테이블에 추가
    const { error: approvedError } = await supabase
      .from("approved_users")
      .upsert({
        email,
        approved_by: approvedByEmail,
        is_active: true,
        approved_at: new Date().toISOString(),
      });

    if (approvedError) {
      throw new Error(`승인 사용자 추가 실패: ${approvedError.message}`);
    }

    // user_profiles 테이블 업데이트
    const { error: profileError } = await supabase
      .from("user_profiles")
      .update({
        is_approved: true,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("email", email);

    if (profileError) {
      throw new Error(`프로필 업데이트 실패: ${profileError.message}`);
    }
  },

  // 사용자 승인 취소 (관리자용)
  async revokeApproval(email: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
      .from("approved_users")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("email", email);

    if (error) {
      throw new Error(error.message);
    }

    // 사용자 프로필도 업데이트
    const { error: profileError } = await supabase
      .from("user_profiles")
      .update({
        is_approved: false,
        approved_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("email", email);

    if (profileError) {
      throw new Error(profileError.message);
    }
  },
};
