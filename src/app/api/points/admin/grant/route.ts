import { requireAdmin } from "@/shared/lib/auth/guards";
import { createAdminClient } from "@/shared/lib/supabase/admin";
import { unexpectedErrorResponse } from "@/shared/lib/api/route-error";
import { NextRequest, NextResponse } from "next/server";

/** 1회 지급 한도. 오타로 인한 대량 지급을 막는다. */
const MAX_GRANT_AMOUNT = 1_000_000;

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  // 다른 사용자를 조회하고 포인트를 지급하는 작업이므로 service_role 로 수행한다.
  // add_points 는 브라우저 롤에서 실행할 수 없도록 권한이 회수되어 있다
  // (supabase/migrations/20260801000000_revoke_privileged_function_grants.sql).
  const adminSupabase = createAdminClient();

  try {
    const body = await request.json();
    const { targetEmail, amount, description, transactionType } = body;

    if (typeof targetEmail !== "string" || !targetEmail.trim()) {
      return NextResponse.json(
        { error: "targetEmail is required" },
        { status: 400 },
      );
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "amount must be a positive integer" },
        { status: 400 },
      );
    }

    if (amount > MAX_GRANT_AMOUNT) {
      return NextResponse.json(
        { error: `1회 지급 한도(${MAX_GRANT_AMOUNT}P)를 초과했습니다.` },
        { status: 400 },
      );
    }

    const { data: targetUserProfile, error: userProfileError } =
      await adminSupabase
        .from("user_profiles")
        .select("id")
        .eq("email", targetEmail)
        .maybeSingle();

    if (userProfileError || !targetUserProfile) {
      return NextResponse.json(
        { error: "Target user not found in user_profiles" },
        { status: 404 },
      );
    }

    const { data: rpcData, error: rpcError } = await adminSupabase.rpc(
      "add_points",
      {
        user_uuid: targetUserProfile.id,
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

    console.info(
      `[points/admin/grant] ${guard.user.email} → ${targetEmail}: ${amount}P`,
    );

    return NextResponse.json(rpcData);
  } catch (err) {
    return unexpectedErrorResponse("api/points/admin/grant", err);
  }
}
