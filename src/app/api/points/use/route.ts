import { requireVerifiedUser } from "@/shared/lib/auth/guards";
import { adjustPoints } from "@/shared/lib/points/point-ledger";
import { isPaidFeature, priceFor } from "@/shared/lib/points/pricing";
import { unexpectedErrorResponse } from "@/shared/lib/api/route-error";
import { NextRequest, NextResponse } from "next/server";

/**
 * 포인트 차감.
 *
 * 차감 금액은 요청 본문이 아니라 서버 가격표(shared/lib/points/pricing.ts)에서
 * 결정한다. 클라이언트는 어떤 기능을 몇 개 쓰는지만 알려준다.
 *
 * 주의: 이 라우트는 포인트만 차감하고 서비스를 제공하지 않는다. 유료 기능은
 * 결제와 제공을 한 라우트에서 함께 처리해야 결제 후 실패나 무료 이용을 막을 수
 * 있다(예: /api/lotto/generate-pattern).
 */
export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser();
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json();
    const { featureType, quantity = 1 } = body;

    if (!isPaidFeature(featureType)) {
      return NextResponse.json({ error: "Unknown feature" }, { status: 400 });
    }

    const cost = priceFor(featureType, quantity);
    if (cost === null) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }

    const result = await adjustPoints({
      userId: guard.user.id,
      delta: -cost,
      transactionType: "use",
      description:
        typeof body.description === "string" && body.description.trim()
          ? body.description.slice(0, 200)
          : featureType,
      featureType,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.message },
        { status: result.reason === "insufficient" ? 402 : 409 },
      );
    }

    return NextResponse.json({
      success: true,
      cost,
      balance: result.balance,
    });
  } catch (err) {
    return unexpectedErrorResponse("api/points/use", err);
  }
}
