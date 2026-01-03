export interface UserPoints {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

export interface PointTransaction {
  id: string;
  user_id: string;
  transaction_type: "charge" | "use" | "refund" | "bonus" | "expire";
  amount: number;
  balance_after: number;
  description: string;
  feature_type?: string;
  reference_id?: string;
  expires_at?: string;
  created_at: string;
}

export interface PointPackage {
  id: string;
  name: string;
  points: number;
  price: number;
  bonus_points: number;
  is_active: boolean;
  display_order: number;
}
