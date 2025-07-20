// 승인 시스템 타입 정의

export interface ApprovedUser {
  id: string;
  email: string;
  approved_at: string;
  approved_by: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_approved: boolean;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: UserProfile | null;
  is_approved: boolean;
}

export interface ApprovalStatus {
  is_approved: boolean;
  approved_at: string | null;
  approved_by: string | null;
}

export interface PendingUser {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}
