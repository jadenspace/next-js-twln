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

  // 이메일 인증을 마친 본인을 승인 목록에 등록한다.
  // 대상 이메일은 서버가 세션에서 직접 읽으므로 여기서 넘기지 않는다.
  async approveSelf(): Promise<void> {
    await postApproval("/api/auth/approval/self");
  },

  // 사용자 승인 (관리자용). 권한 검사와 쓰기는 모두 서버에서 이뤄진다.
  async approveUser(email: string): Promise<void> {
    await postApproval("/api/auth/approval", { email, action: "approve" });
  },

  // 사용자 승인 취소 (관리자용)
  async revokeApproval(email: string): Promise<void> {
    await postApproval("/api/auth/approval", { email, action: "revoke" });
  },
};

async function postApproval(
  url: string,
  body?: Record<string, unknown>,
): Promise<void> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.error || "승인 처리에 실패했습니다.");
  }
}
