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

  // Check if user is admin (using app_metadata or specific table lookup)
  // For now, assuming detailed admin check is handled or we check email/metadata
  // Implementing a basic check based on public.approved_users or metadata if available
  // Adjust logic based on actual admin implementation.
  // Here relying on "approved_users" table check or service role key if this was a protected route?
  // But this runs on server with user's context.

  // Checking admin status from 'approved_users' if that's the design
  // Or check specific email list

  // NOTE: This logic needs to be robust. For MVP, I'll check if the user is in 'approved_users' table AND is active.
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
    const { targetUserId, amount, description, transactionType } = body;

    if (!targetUserId || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // 2. Get Target User Current Balance
    const { data: userPoints, error: fetchError } = await supabase
      .from("user_points")
      .select("balance, total_earned")
      .eq("user_id", targetUserId)
      .single();

    let currentBalance = 0;
    let currentTotalEarned = 0;

    if (fetchError && fetchError.code === "PGRST116") {
      // Create if not exists
      const { error: insertError } = await supabase
        .from("user_points")
        .insert({ user_id: targetUserId, balance: 0 });
      if (insertError) throw insertError;
    } else if (userPoints) {
      currentBalance = userPoints.balance;
      currentTotalEarned = userPoints.total_earned;
    }

    // 3. Update Balance
    const newBalance = currentBalance + amount;
    const newTotalEarned =
      amount > 0 ? currentTotalEarned + amount : currentTotalEarned;

    const { error: updateError } = await supabase
      .from("user_points")
      .update({
        balance: newBalance,
        total_earned: newTotalEarned,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", targetUserId);

    if (updateError) throw updateError;

    // 4. Record Transaction
    const { error: transactionError } = await supabase
      .from("point_transactions")
      .insert({
        user_id: targetUserId,
        transaction_type: transactionType || "bonus",
        amount: amount,
        balance_after: newBalance,
        description: description || "Admin grant",
        feature_type: "admin_grant",
        created_at: new Date().toISOString(),
      });

    if (transactionError) throw transactionError;

    return NextResponse.json({ success: true, balance: newBalance });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
