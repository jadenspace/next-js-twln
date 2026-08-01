import { PatternFilter } from "@/features/lotto/services/pattern-filter";
import type { PatternFilterState } from "@/features/lotto/types/pattern-filter.types";
import { requireVerifiedUser } from "@/shared/lib/auth/guards";
import { adjustPoints, getBalance } from "@/shared/lib/points/point-ledger";
import { PAID_FEATURES, priceFor } from "@/shared/lib/points/pricing";
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
 * 이 라우트는 생성을 먼저 수행하고, 성공했을 때만 과금한다.
 */
export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser();
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const gameCount = (body as { gameCount?: unknown }).gameCount;
  const cost = priceFor(
    FEATURE,
    typeof gameCount === "number" ? gameCount : NaN,
  );

  if (cost === null || typeof gameCount !== "number") {
    return NextResponse.json(
      {
        error: `게임 수는 1~${PAID_FEATURES[FEATURE].maxQuantity} 사이의 정수여야 합니다.`,
      },
      { status: 400 },
    );
  }

  const filters = parseFilters((body as { filters?: unknown }).filters);
  if (!filters) {
    return NextResponse.json(
      { error: "필터 조건이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  // 생성 비용을 들이기 전에 잔액을 빠르게 확인한다. 실제 차감은 아래에서
  // compare-and-swap 으로 다시 검사하므로, 이건 조기 거절용일 뿐이다.
  try {
    if ((await getBalance(guard.user.id)) < cost) {
      return NextResponse.json(
        { error: "포인트가 부족합니다.", required: cost },
        { status: 402 },
      );
    }
  } catch (err) {
    console.error("[lotto/generate-pattern] 잔액 조회 실패", err);
    return NextResponse.json(
      { error: "포인트 정보를 확인할 수 없습니다." },
      { status: 500 },
    );
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

  const charge = await adjustPoints({
    userId: guard.user.id,
    delta: -cost,
    transactionType: "use",
    description: `패턴 조합 ${gameCount}게임 생성`,
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

function parseFilters(value: unknown): PatternFilterState | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;

  const fixedNumbers = parseNumbers(raw.fixedNumbers, 6);
  const excludedNumbers = parseNumbers(raw.excludedNumbers, 39);
  if (!fixedNumbers || !excludedNumbers) return null;

  // 고정수와 제외수가 겹치면 어떤 조합도 만들 수 없다.
  if (fixedNumbers.some((n) => excludedNumbers.includes(n))) return null;

  const sumRange = parseRange(raw.sumRange, 21, 255);
  const acRange = parseRange(raw.acRange, 0, 10);
  const primeCount = parseRange(raw.primeCount, 0, 6);
  const compositeCount = parseRange(raw.compositeCount, 0, 6);
  const multiplesOf3 = parseRange(raw.multiplesOf3, 0, 6);
  const multiplesOf5 = parseRange(raw.multiplesOf5, 0, 6);
  const squareCount = parseRange(raw.squareCount, 0, 6);

  if (
    !sumRange ||
    !acRange ||
    !primeCount ||
    !compositeCount ||
    !multiplesOf3 ||
    !multiplesOf5 ||
    !squareCount
  ) {
    return null;
  }

  const oddEvenRatios = parseStrings(raw.oddEvenRatios);
  const highLowRatios = parseStrings(raw.highLowRatios);
  if (!oddEvenRatios || !highLowRatios) return null;

  const sameEndDigit = parseCount(raw.sameEndDigit);
  const sameSection = parseCount(raw.sameSection);
  if (sameEndDigit === null || sameSection === null) return null;

  return {
    sumRange,
    oddEvenRatios,
    highLowRatios,
    acRange,
    consecutivePattern:
      (raw.consecutivePattern as PatternFilterState["consecutivePattern"]) ??
      "any",
    sameEndDigit,
    sameSection,
    primeCount,
    compositeCount,
    multiplesOf3,
    multiplesOf5,
    squareCount,
    fixedNumbers,
    excludedNumbers,
  };
}

function parseNumbers(value: unknown, maxLength: number): number[] | null {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > maxLength) return null;

  const unique = new Set<number>();
  for (const entry of value) {
    if (!Number.isInteger(entry) || entry < 1 || entry > 45) return null;
    unique.add(entry as number);
  }

  return [...unique];
}

function parseRange(
  value: unknown,
  min: number,
  max: number,
): [number, number] | null {
  if (!Array.isArray(value) || value.length !== 2) return null;

  const [low, high] = value;
  if (!Number.isInteger(low) || !Number.isInteger(high)) return null;
  if (low < min || high > max || low > high) return null;

  return [low as number, high as number];
}

function parseStrings(value: unknown): string[] | null {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) return null;
  if (value.some((entry) => typeof entry !== "string")) return null;

  return value as string[];
}

function parseCount(value: unknown): number | null {
  if (value === undefined || value === null) return 0;
  if (!Number.isInteger(value)) return null;
  if ((value as number) < 0 || (value as number) > 6) return null;

  return value as number;
}
