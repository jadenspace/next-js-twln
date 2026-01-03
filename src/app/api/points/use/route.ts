import { createClient } from "@/shared/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // 1. Authenticate
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { amount, featureType, description } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // 2. Check Balance
    const { data: userPoints, error: fetchError } = await supabase
      .from("user_points")
      .select("balance, total_spent")
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError || !userPoints) {
      // If no points record, they imply 0 balance usually, or error
      return NextResponse.json(
        { error: "Insufficient funds" },
        { status: 402 },
      );
    }

    if (userPoints.balance < amount) {
      return NextResponse.json(
        { error: "Insufficient funds" },
        { status: 402 },
      );
    }

    // 3. Deduct Points (Update Balance)
    const newBalance = userPoints.balance - amount;
    const newTotalSpent = (userPoints.total_spent || 0) + amount;

    const { error: updateError } = await supabase
      .from("user_points")
      .update({
        balance: newBalance,
        total_spent: newTotalSpent,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) throw updateError;

    // 4. Insert Transaction
    const { error: transactionError } = await supabase
      .from("point_transactions")
      .insert({
        user_id: user.id,
        transaction_type: "use",
        amount: -amount,
        balance_after: newBalance,
        description: description || "Points used",
        feature_type: featureType,
        created_at: new Date().toISOString(),
      });

    if (transactionError) {
      // Critical: Point deducted but transaction failed.
      // ideally we should rollback.
      // For now log it (or rely on robust backend if we had SQL functions).
      console.error(
        "Transaction insertion failed after deduction",
        transactionError,
      );
      return NextResponse.json(
        { error: "Transaction record failed" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, balance: newBalance });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
