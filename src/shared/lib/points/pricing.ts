/**
 * 유료 기능 가격표 (서버 기준).
 *
 * 이전에는 클라이언트가 차감할 금액을 직접 계산해 `/api/points/use` 로 보냈고
 * 서버는 `amount > 0` 만 확인했다. 요청 본문을 고쳐 100P 짜리 기능을 1P 에
 * 사용할 수 있었다. 가격은 반드시 이 표에서만 나온다.
 */
export const PAID_FEATURES = {
  manual_pattern_gen: {
    unitPrice: 100,
    maxQuantity: 20,
    label: "패턴 조합 생성",
  },
} as const;

export type PaidFeature = keyof typeof PAID_FEATURES;

export function isPaidFeature(value: unknown): value is PaidFeature {
  return typeof value === "string" && value in PAID_FEATURES;
}

/**
 * 기능과 수량으로 가격을 계산한다. 수량이 허용 범위를 벗어나면 null.
 */
export function priceFor(
  feature: PaidFeature,
  quantity: number,
): number | null {
  const spec = PAID_FEATURES[feature];

  if (!Number.isInteger(quantity) || quantity < 1) return null;
  if (quantity > spec.maxQuantity) return null;

  return spec.unitPrice * quantity;
}
