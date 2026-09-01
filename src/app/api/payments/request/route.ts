import { createClient } from "@/shared/lib/supabase/server";
import { unexpectedErrorResponse } from "@/shared/lib/api/route-error";
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
    // is_active 를 함께 확인한다. 상점 목록은 활성 패키지만 보여주지만
    // (features/points/api/points-api.ts), 이 라우트에 ID 를 직접 넣으면
    // 비활성화된 테스트·프로모션 패키지도 그대로 구매할 수 있었다.
    const { data: packageInfo, error: pkgError } = await supabase
      .from("point_packages")
      .select("*")
      .eq("id", packageId)
      .eq("is_active", true)
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
  } catch (err) {
    return unexpectedErrorResponse("api/payments/request", err);
  }
}
