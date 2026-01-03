import { createClient } from "@/shared/lib/supabase/client";
import { Payment } from "../types";

export const paymentsApi = {
  // 결제 요청 (무통장 입금)
  async requestBankTransfer(params: {
    packageId: string;
    depositorName: string;
  }): Promise<{ success: boolean; orderId: string }> {
    const response = await fetch("/api/payments/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Payment request failed");
    }

    return await response.json();
  },

  // 결제 내역 조회
  async getPaymentHistory(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{ data: Payment[]; count: number }> {
    const supabase = createClient();
    const { data, error, count } = await supabase
      .from("payments")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      data: data as Payment[],
      count: count || 0,
    };
  },

  // (관리자용) 입금 승인
  async approvePayment(orderId: string): Promise<void> {
    const response = await fetch("/api/payments/admin/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Approval failed");
    }
  },
};
