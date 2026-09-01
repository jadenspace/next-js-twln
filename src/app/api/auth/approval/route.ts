import { setApprovalStatus } from "@/shared/lib/auth/approval";
import { requireAdmin } from "@/shared/lib/auth/guards";
import { unexpectedErrorResponse } from "@/shared/lib/api/route-error";
import { NextRequest, NextResponse } from "next/server";

/** 관리자가 다른 회원의 승인 상태를 변경한다. */
export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json();
    const { email, action } = body;

    if (typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    if (action !== "approve" && action !== "revoke") {
      return NextResponse.json(
        { error: 'action must be "approve" or "revoke"' },
        { status: 400 },
      );
    }

    await setApprovalStatus(
      email,
      action === "approve",
      guard.user.email ?? "admin",
    );

    console.info("[auth/approval]", {
      email,
      action,
      actor: guard.user.email,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return unexpectedErrorResponse("api/auth/approval", err);
  }
}
