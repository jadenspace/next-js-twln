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
    const { packageId, depositorName } = body;

    // 2. Validate Package
    const { data: packageInfo, error: pkgError } = await supabase
      .from("point_packages")
      .select("*")
      .eq("id", packageId)
      .maybeSingle();

    if (pkgError || !packageInfo) {
      return NextResponse.json({ error: "Invalid package" }, { status: 400 });
    }

    // 3. Generate Order ID
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderId = `ORD-${dateStr}-${randomStr}`;

    // 4. Create Payment Record (Pending)
    const { error: insertError } = await supabase.from("payments").insert({
      user_id: user.id,
      order_id: orderId,
      amount: packageInfo.price,
      points_amount: packageInfo.points + packageInfo.bonus_points,
      payment_method: "bank_transfer",
      depositor_name: depositorName,
      status: "pending",
      created_at: new Date().toISOString(),
    });

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, orderId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
