import { parsePatternFilters } from "@/features/lotto/lib/pattern-input";
import { PatternFilter } from "@/features/lotto/services/pattern-filter";
import { requireVerifiedUser } from "@/shared/lib/auth/guards";
import { adjustPoints, getBalance } from "@/shared/lib/points/point-ledger";
import { PAID_FEATURES, priceFor } from "@/shared/lib/points/pricing";
import { unexpectedErrorResponse } from "@/shared/lib/api/route-error";
import { NextRequest, NextResponse } from "next/server";

const FEATURE = "manual_pattern_gen" as const;
const MAX_ATTEMPTS = 100_000;

/**
 * 패턴 조합 생성 (유료).
 *
 * 이전에는 클라이언트가 포인트를 차감시킨 뒤 브라우저에서 직접 조합을
 * 생성했다. 차감 요청을 건너뛰면 결제 없이 그대로 쓸 수 있었고, 반대로
 * 조건이 너무 좁아 생성에 실패하면 포인트만 사라졌다.
 *
 * 이 라우트는 생성을 먼저 수행하고, 성공했을 때만 과금한다. 과금 단위는
 * 요청한 게임 수가 아니라 실제로 돌려준 조합 수다 — 고정수 6개를 지정하면
 * 조합은 1개뿐인데 20게임 값을 받던 문제를 막는다.
 */
export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser();
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const gameCount = (body as { gameCount?: unknown }).gameCount;
  const requestedCost = priceFor(
    FEATURE,
    typeof gameCount === "number" ? gameCount : NaN,
  );

  if (requestedCost === null || typeof gameCount !== "number") {
    return NextResponse.json(
      {
        error: `게임 수는 1~${PAID_FEATURES[FEATURE].maxQuantity} 사이의 정수여야 합니다.`,
      },
      { status: 400 },
    );
  }

  const filters = parsePatternFilters((body as { filters?: unknown }).filters);
  if (!filters) {
    return NextResponse.json(
      { error: "필터 조건이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  // 생성 비용을 들이기 전에 잔액을 빠르게 확인한다. 실제 차감은 아래에서
  // compare-and-swap 으로 다시 검사하므로, 이건 조기 거절용일 뿐이다.
  try {
    if ((await getBalance(guard.user.id)) < requestedCost) {
      return NextResponse.json(
        { error: "포인트가 부족합니다.", required: requestedCost },
        { status: 402 },
      );
    }
  } catch (err) {
    return unexpectedErrorResponse("api/lotto/generate-pattern", err);
  }

  let combinations;
  try {
    combinations = new PatternFilter().generateFilteredCombinations(
      filters,
      gameCount,
      MAX_ATTEMPTS,
      null,
    );
  } catch (err) {
    // 조건이 지나치게 좁아 생성하지 못한 경우. 과금하지 않는다.
    const message =
      err instanceof Error
        ? err.message
        : "조건에 맞는 조합을 생성하지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  const deliveredGames = combinations.length;
  const cost = priceFor(FEATURE, deliveredGames) ?? requestedCost;

  const charge = await adjustPoints({
    userId: guard.user.id,
    delta: -cost,
    transactionType: "use",
    description: `패턴 조합 ${deliveredGames}게임 생성`,
    featureType: FEATURE,
  });

  if (!charge.ok) {
    return NextResponse.json(
      { error: charge.message },
      { status: charge.reason === "insufficient" ? 402 : 409 },
    );
  }

  return NextResponse.json({
    data: combinations,
    cost,
    balance: charge.balance,
  });
}
