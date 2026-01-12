export type PaymentStatus = "pending" | "completed" | "cancelled" | "refunded";

export interface Payment {
  id: string;
  user_id: string;
  order_id: string;
  amount: number;
  points_amount: number;
  payment_method: string;
  depositor_name?: string;
  bank_name?: string;
  account_number?: string;
  status: PaymentStatus;
  completed_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
}

export const BANK_INFO = {
  bankName: "토스뱅크",
  accountNumber: "1000-0000-0000",
  accountHolder: "로또탐정 서비스",
};
