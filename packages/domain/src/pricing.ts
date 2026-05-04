/**
 * 수수료/마진 계산 공식.
 * 노션 "수수료 책정" 문서의 공식 그대로:
 *
 *   수수료 금액   = 판매가 × 수수료율
 *   정산 예정액   = 판매가 - 수수료
 *   예상 마진     = 정산액 - 매입가 - 택배비
 *   마진율(%)     = 예상 마진 / 판매가 × 100
 */

export const DEFAULT_COMMISSION_RATE = 0.015; // 1.5% (MVP 잠정값, 추후 확정)

export interface MarginInput {
  /** 판매가 (택배비 포함, 소비자가 결제하는 금액) */
  salePrice: number;
  /** 매입 원가 (판매자만 보임) */
  costPrice: number;
  /** 택배비 (실제 판매자 부담) */
  shippingCost: number;
  /** 수수료율 (소수, 예: 0.015 = 1.5%) */
  commissionRate?: number;
}

export interface MarginResult {
  salePrice: number;
  commissionAmount: number;
  settlementAmount: number;
  marginAmount: number;
  marginRate: number;
}

export function calcMargin(input: MarginInput): MarginResult {
  const rate = input.commissionRate ?? DEFAULT_COMMISSION_RATE;
  const commissionAmount = Math.floor(input.salePrice * rate);
  const settlementAmount = input.salePrice - commissionAmount;
  const marginAmount = settlementAmount - input.costPrice - input.shippingCost;
  const marginRate = input.salePrice > 0 ? (marginAmount / input.salePrice) * 100 : 0;

  return {
    salePrice: input.salePrice,
    commissionAmount,
    settlementAmount,
    marginAmount,
    marginRate: Math.round(marginRate * 10) / 10,
  };
}
