import { createClient as createSsrClient } from "@/shared/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createSsrClient();

  // 1. Authenticate & Check Admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: adminCheck, error: adminError } = await supabase
    .from("admin_users")
    .select("id")
    .eq("email", user.email)
    .eq("is_active", true)
    .single();

  if (adminError || !adminCheck) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { targetEmail, amount, description, transactionType } = body;

    if (!targetEmail || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // 2. Get Target User ID from email using user_profiles table
    // 관리자는 user_profiles 테이블의 모든 데이터를 조회할 수 있는 RLS 정책이 있으므로,
    // service_role 키 없이도 이메일로 사용자 ID를 조회할 수 있습니다.
    const { data: targetUserProfile, error: userProfileError } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("email", targetEmail)
      .single();

    if (userProfileError || !targetUserProfile) {
      return NextResponse.json(
        { error: "Target user not found in user_profiles" },
        { status: 404 },
      );
    }
    const targetUserId = targetUserProfile.id;

    // 3. Call 'add_points' RPC function
    // add_points 함수는 SECURITY DEFINER로 정의되어 있어 RLS를 우회하므로,
    // 일반 supabase 클라이언트로 호출해도 권한 문제가 발생하지 않습니다.
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "add_points",
      {
        user_uuid: targetUserId,
        amount_to_add: amount,
        transaction_type: transactionType || "bonus",
        description_text: description || "Admin grant",
        feat_type: "admin_grant",
      },
    );

    if (rpcError) {
      console.error("RPC Error:", rpcError);
      throw new Error(rpcError.message);
    }

    return NextResponse.json(rpcData);
  } catch (err: any) {
    console.error("Grant Points Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
