import { createClient } from "@/shared/lib/supabase/client";
import { PointPackage, PointTransaction, UserPoints } from "../types";

export const pointsApi = {
  // 사용자 포인트 잔액 조회
  async getUserPoints(userId: string): Promise<UserPoints | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_points")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  },

  // 포인트 거래 내역 조회
  async getPointTransactions(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{ data: PointTransaction[]; count: number }> {
    const supabase = createClient();
    const { data, error, count } = await supabase
      .from("point_transactions")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      data: data as PointTransaction[],
      count: count || 0,
    };
  },

  // 포인트 패키지 목록 조회
  async getPointPackages(): Promise<PointPackage[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("point_packages")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) throw error;

    return data as PointPackage[];
  },

  // 포인트 소멸 예정 내역 조회 (옵션)
  async getExpiringPoints(userId: string): Promise<PointTransaction[]> {
    const supabase = createClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("point_transactions")
      .select("*")
      .eq("user_id", userId)
      .eq("transaction_type", "bonus") // 보너스 포인트만 만료된다고 가정
      .gt("expires_at", now)
      .order("expires_at", { ascending: true });

    if (error) throw error;

    return data as PointTransaction[];
  },
};
