import { requireAdmin } from "@/shared/lib/auth/guards";
import { adjustPoints } from "@/shared/lib/points/point-ledger";
import { createAdminClient } from "@/shared/lib/supabase/admin";
import {
  supabaseErrorResponse,
  unexpectedErrorResponse,
} from "@/shared/lib/api/route-error";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // 이전 구현은 관리자 판별에 approved_users(일반 회원 승인 목록)를 사용했다.
  // 이메일 인증만 마치면 누구나 통과해 자기 결제를 스스로 승인할 수 있었다.
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const supabase = createAdminClient();

  try {
    const body = await request.json();
    const { paymentId } = body;

    if (typeof paymentId !== "string" || !paymentId) {
      return NextResponse.json(
        { error: "PaymentId is required" },
        { status: 400 },
      );
    }

    // pending -> completed 전이를 조건부 UPDATE 한 번으로 처리한다.
    // "조회 후 상태 확인 → 갱신" 이었던 이전 구현은 동시 승인 요청이 모두
    // 통과해 포인트가 중복 지급될 수 있었다. 여기서는 실제로 상태를 바꾼
    // 요청만 행을 돌려받으므로, 승인 처리는 정확히 한 번만 일어난다.
    const { data: claimed, error: claimError } = await supabase
      .from("payments")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", paymentId)
      .eq("status", "pending")
      .select("id, user_id, order_id, points_amount")
      .maybeSingle();

    if (claimError) {
      return supabaseErrorResponse(claimError);
    }

    if (!claimed) {
      // 존재하지 않거나, 이미 처리됐거나(completed/cancelled/refunded) 다른
      // 요청이 먼저 가져간 경우. 취소·환불된 결제의 재승인도 여기서 막힌다.
      const { data: existing } = await supabase
        .from("payments")
        .select("status")
        .eq("id", paymentId)
        .maybeSingle();

      if (!existing) {
        return NextResponse.json(
          { error: "Payment not found" },
          { status: 404 },
        );
      }

      return NextResponse.json(
        { error: `승인할 수 없는 상태입니다. (현재: ${existing.status})` },
        { status: 409 },
      );
    }

    const credit = await adjustPoints({
      userId: claimed.user_id,
      delta: claimed.points_amount,
      transactionType: "charge",
      description: `포인트 충전 (주문번호: ${claimed.order_id})`,
      featureType: "charge",
      referenceId: claimed.id,
    });

    if (!credit.ok) {
      // 포인트 지급에 실패했으므로 결제를 다시 대기 상태로 되돌려
      // 관리자가 재시도할 수 있게 한다. 되돌리지 않으면 입금은 됐는데
      // 포인트는 없는 상태로 고착된다.
      await supabase
        .from("payments")
        .update({ status: "pending", completed_at: null })
        .eq("id", claimed.id)
        .eq("status", "completed");

      console.error("[payments/admin/approve] 포인트 지급 실패, 승인 롤백", {
        paymentId: claimed.id,
        userId: claimed.user_id,
        reason: credit.reason,
        message: credit.message,
      });

      return NextResponse.json(
        { error: "포인트 지급에 실패했습니다. 다시 시도해 주세요." },
        { status: 500 },
      );
    }

    console.info("[payments/admin/approve]", {
      paymentId: claimed.id,
      orderId: claimed.order_id,
      pointsGranted: claimed.points_amount,
      approvedBy: guard.user.email,
    });

    return NextResponse.json({ success: true, balance: credit.balance });
  } catch (err) {
    return unexpectedErrorResponse("api/payments/admin/approve", err);
  }
}
