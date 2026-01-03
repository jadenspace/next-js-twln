import { createClient } from "@/shared/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // 1. Authenticate & Check Admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Admin Check logic (using approved_users table as established in Phase 1)
  const { data: adminCheck, error: adminError } = await supabase
    .from("approved_users")
    .select("id")
    .eq("email", user.email)
    .eq("is_active", true)
    .single();

  if (adminError || !adminCheck) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "OrderId is required" },
        { status: 400 },
      );
    }

    // 2. Get Payment Info
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.status === "completed") {
      return NextResponse.json({ error: "Already completed" }, { status: 400 });
    }

    // 3. Start Transaction (Manual simulation via sequence of calls)
    // A. Update Payment Status to completed
    const { error: updatePaymentError } = await supabase
      .from("payments")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    if (updatePaymentError) throw updatePaymentError;

    // B. Grant Points (Call internal logic or duplicate logic here)
    // Using direct DB manipulation for atomicity (ideally should use RPC/Function)

    // Get user points record
    const { data: userPoints } = await supabase
      .from("user_points")
      .select("balance, total_earned")
      .eq("user_id", payment.user_id)
      .single();

    const currentBalance = userPoints?.balance || 0;
    const currentTotalEarned = userPoints?.total_earned || 0;

    // Upsert user_points
    const { error: pointsError } = await supabase.from("user_points").upsert(
      {
        user_id: payment.user_id,
        balance: currentBalance + payment.points_amount,
        total_earned: currentTotalEarned + payment.points_amount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (pointsError) {
      // Critical error: Payment marked completed but points not given.
      // In real app, we need rollback or transaction.
      console.error("Points grant failed", pointsError);
      return NextResponse.json(
        { error: "Points grant failed" },
        { status: 500 },
      );
    }

    // C. Record Point Transaction
    await supabase.from("point_transactions").insert({
      user_id: payment.user_id,
      transaction_type: "charge",
      amount: payment.points_amount,
      balance_after: currentBalance + payment.points_amount,
      description: `포인트 충전 (주문번호: ${orderId})`,
      reference_id: payment.id,
      feature_type: "charge",
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
