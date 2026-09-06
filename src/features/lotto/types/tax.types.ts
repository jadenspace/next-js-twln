export interface TaxCalculationResult {
  /** 원 당첨금 */
  grossPrize: number;
  /** 복권 구입 비용 (원) - 기본 1,000원 공제 */
  ticketCost: number;
  /** 과세 대상 금액 (grossPrize - ticketCost) */
  taxableBase: number;
  /** 비과세 구간 금액 (200만 원 이하) */
  taxFreeAmount: number;
  /** 22% 구간 과세표준 (200만 원 초과 ~ 3억 원 이하) */
  bracket22Base: number;
  /** 22% 구간 세금 (기타소득세 20% + 지방소득세 2%) */
  bracket22Tax: number;
  /** 33% 구간 과세표준 (3억 원 초과분) */
  bracket33Base: number;
  /** 33% 구간 세금 (기타소득세 30% + 지방소득세 3%) */
  bracket33Tax: number;
  /** 총 국세 (소득세) */
  incomeTax: number;
  /** 총 지방소득세 (주민세 10%) */
  localIncomeTax: number;
  /** 총 납부 세금 */
  totalTax: number;
  /** 실제 통장 입금액 (실수령액) */
  netPrize: number;
  /** 실효 세율 (%) */
  effectiveTaxRate: number;
}

export interface FunFactItem {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  description: string;
  iconName: string;
}
