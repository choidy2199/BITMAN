/** 토스페이먼츠 도메인 타입. Phase 1에서 실제 SDK 연동. */

export type PaymentMethod = 'CARD' | 'TOSS_PAY' | 'TRANSFER' | 'NAVER_PAY' | 'KAKAO_PAY';

export type PaymentStatus =
  | 'READY'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_DEPOSIT'
  | 'DONE'
  | 'CANCELED'
  | 'PARTIAL_CANCELED'
  | 'ABORTED'
  | 'EXPIRED';

export interface ChargeRequest {
  orderId: string;
  amount: number;
  customerKey: string;
  method: PaymentMethod;
  /** 에스크로 여부. 구매확정 전까지 플랫폼 보관. */
  escrow?: boolean;
}

export interface ChargeResult {
  pgTxId: string;
  status: PaymentStatus;
  approvedAt: string | null;
}

export interface BillingKeyIssueRequest {
  customerKey: string;
  cardNumber: string;
  cardExpiry: string;
  cardPassword: string;
  customerIdentityNumber: string;
}

export interface BillingKey {
  billingKey: string;
  cardLast4: string;
  cardBrand: string;
}

export interface AutoChargeRequest {
  billingKey: string;
  orderId: string;
  amount: number;
  customerKey: string;
}
