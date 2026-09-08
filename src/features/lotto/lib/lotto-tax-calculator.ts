import { TaxCalculationResult, FunFactItem } from "../types/tax.types";

/**
 * 2023년 개정 소득세법을 반영한 로또 당첨금 세금 및 실수령액 계산기
 *
 * [세법 기준]
 * - 비과세 한도: 200만 원 이하 (2023년 1월 1일 이후)
 * - 복권 구입비용: 1,000원 필요경비 공제
 * - 200만 원 초과 ~ 3억 원 이하: 22% (소득세 20% + 지방소득세 2%)
 * - 3억 원 초과분: 33% (소득세 30% + 지방소득세 3%)
 */
export function calculateLottoTax(
  grossPrize: number,
  ticketCost = 1000,
): TaxCalculationResult {
  const safeGross = Math.max(0, Math.floor(grossPrize));
  const safeTicket = Math.min(safeGross, Math.max(0, ticketCost));

  // 과세 대상 기본 금액
  const taxableBase = Math.max(0, safeGross - safeTicket);

  // 1. 비과세 판정 (200만 원 이하)
  if (taxableBase <= 2000000) {
    return {
      grossPrize: safeGross,
      ticketCost: safeTicket,
      taxableBase,
      taxFreeAmount: taxableBase,
      bracket22Base: 0,
      bracket22Tax: 0,
      bracket33Base: 0,
      bracket33Tax: 0,
      incomeTax: 0,
      localIncomeTax: 0,
      totalTax: 0,
      netPrize: safeGross,
      effectiveTaxRate: 0,
    };
  }

  // 2. 200만 원 초과 ~ 3억 원 이하 구간 계산
  const taxFreeAmount = 2000000;
  let bracket22Base = 0;
  let bracket33Base = 0;

  if (taxableBase <= 300000000) {
    bracket22Base = taxableBase - taxFreeAmount;
    bracket33Base = 0;
  } else {
    bracket22Base = 300000000 - taxFreeAmount; // 2억 9,800만 원
    bracket33Base = taxableBase - 300000000;
  }

  // 22% 세율 적용 (소득세 20% + 지방세 2%)
  const bracket22IncomeTax = Math.floor(bracket22Base * 0.2);
  const bracket22LocalTax = Math.floor(bracket22IncomeTax * 0.1);
  const bracket22Tax = bracket22IncomeTax + bracket22LocalTax;

  // 33% 세율 적용 (소득세 30% + 지방세 3%)
  const bracket33IncomeTax = Math.floor(bracket33Base * 0.3);
  const bracket33LocalTax = Math.floor(bracket33IncomeTax * 0.1);
  const bracket33Tax = bracket33IncomeTax + bracket33LocalTax;

  // 총 세금 계산
  const incomeTax = bracket22IncomeTax + bracket33IncomeTax;
  const localIncomeTax = bracket22LocalTax + bracket33LocalTax;
  const totalTax = incomeTax + localIncomeTax;

  const netPrize = safeGross - totalTax;
  const effectiveTaxRate =
    safeGross > 0 ? Math.round((totalTax / safeGross) * 10000) / 100 : 0;

  return {
    grossPrize: safeGross,
    ticketCost: safeTicket,
    taxableBase,
    taxFreeAmount,
    bracket22Base,
    bracket22Tax,
    bracket33Base,
    bracket33Tax,
    incomeTax,
    localIncomeTax,
    totalTax,
    netPrize,
    effectiveTaxRate,
  };
}

/**
 * 숫자를 한국어 금액 단위(억, 만, 원)로 읽기 쉽게 포맷팅합니다.
 * 만 원 미만 단위는 버리는 근사값이므로 "≈" 와 함께 쓴다.
 * 예: 2543210000 -> "25억 4,321만 원"
 */
export function formatKoreanCurrency(amount: number): string {
  if (amount === 0) return "0원";
  if (isNaN(amount)) return "0원";

  const isNegative = amount < 0;
  const absAmount = Math.abs(Math.floor(amount));

  if (absAmount < 10000) {
    return isNegative
      ? `-${absAmount.toLocaleString()}원`
      : `${absAmount.toLocaleString()}원`;
  }

  const eok = Math.floor(absAmount / 100000000);
  const man = Math.floor((absAmount % 100000000) / 10000);

  const parts: string[] = [];

  if (eok > 0) {
    parts.push(`${eok.toLocaleString()}억`);
  }
  if (man > 0) {
    parts.push(`${man.toLocaleString()}만`);
  }

  const result = `${parts.join(" ")} 원`;
  return isNegative ? `-${result}` : result;
}

/**
 * 실수령액으로 살 수 있는 위트 있는 비교 아이템 목록 생성
 */
export function calculateFunFacts(netPrize: number): FunFactItem[] {
  if (netPrize <= 0) return [];

  const items: FunFactItem[] = [
    {
      id: "coffee",
      name: "아메리카노",
      unitPrice: 4500,
      quantity: Math.floor(netPrize / 4500),
      unit: "잔",
      description: "매일 1잔씩 마시면",
      iconName: "coffee",
    },
    {
      id: "chicken",
      name: "황금올리브 치킨",
      unitPrice: 23000,
      quantity: Math.floor(netPrize / 23000),
      unit: "마리",
      description: "1일 1닭으로",
      iconName: "utensils",
    },
    {
      id: "iphone",
      name: "아이폰 Pro 최신형",
      unitPrice: 1700000,
      quantity: Math.floor(netPrize / 1700000),
      unit: "대",
      description: "주변 지인들에게 전부 선물해도",
      iconName: "smartphone",
    },
    {
      id: "salary",
      name: "직장인 평균 연봉",
      unitPrice: 43000000,
      quantity: Math.floor((netPrize / 43000000) * 10) / 10,
      unit: "년치",
      description: "일하지 않고 숨만 쉬어도",
      iconName: "briefcase",
    },
    {
      id: "car",
      name: "제네시스 G90 풀옵션",
      unitPrice: 130000000,
      quantity: Math.floor(netPrize / 130000000),
      unit: "대",
      description: "럭셔리 플래그십 세단",
      iconName: "car",
    },
    {
      id: "apartment",
      name: "서울 평균 아파트",
      unitPrice: 1100000000,
      quantity: Math.floor((netPrize / 1100000000) * 10) / 10,
      unit: "채",
      description: "서울 시내 내 집 마련",
      iconName: "home",
    },
  ];

  return items.filter((item) => item.quantity >= 1);
}
