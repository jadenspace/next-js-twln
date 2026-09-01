import { setApprovalStatus } from "@/shared/lib/auth/approval";
import { requireVerifiedUser } from "@/shared/lib/auth/guards";
import { unexpectedErrorResponse } from "@/shared/lib/api/route-error";
import { NextResponse } from "next/server";

/**
 * 이메일 인증을 마친 본인을 승인 목록에 등록한다.
 *
 * 대상 이메일은 검증된 세션에서만 가져온다. 요청 본문은 읽지 않으므로
 * 다른 사람의 이메일을 승인시킬 수 없다.
 */
export async function POST() {
  const guard = await requireVerifiedUser();
  if (!guard.ok) return guard.response;

  const email = guard.user.email;
  if (!email) {
    return NextResponse.json(
      { error: "계정에 이메일이 없습니다." },
      { status: 400 },
    );
  }

  try {
    await setApprovalStatus(email, true, "system");
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[auth/approval/self] 자동 승인 실패", { email, message });
    return unexpectedErrorResponse("api/auth/approval/self", err);
  }
}
