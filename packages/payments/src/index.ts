/**
 * 결제 인터페이스 — Phase 0 stub.
 * Phase 1에서 토스페이먼츠 실제 SDK 연동.
 *
 * 사용 시나리오 (노션 "공통 체크리스트" 참고):
 * - 즉시구매: charge() — 일반결제 + 에스크로
 * - 구매입찰 카드 사전등록: issueBillingKey()
 * - 판매자 수락 시 자동결제: autoCharge()
 * - 보증금 결제: charge() — escrow=false, 100만원
 */

import type {
  AutoChargeRequest,
  BillingKey,
  BillingKeyIssueRequest,
  ChargeRequest,
  ChargeResult,
} from './types';

export type * from './types';

export interface PaymentsClient {
  charge(req: ChargeRequest): Promise<ChargeResult>;
  cancel(pgTxId: string, reason: string, amount?: number): Promise<ChargeResult>;
  issueBillingKey(req: BillingKeyIssueRequest): Promise<BillingKey>;
  autoCharge(req: AutoChargeRequest): Promise<ChargeResult>;
}

class StubPayments implements PaymentsClient {
  async charge(_req: ChargeRequest): Promise<ChargeResult> {
    throw new Error('payments.charge: not implemented (Phase 1)');
  }
  async cancel(_pgTxId: string, _reason: string, _amount?: number): Promise<ChargeResult> {
    throw new Error('payments.cancel: not implemented (Phase 1)');
  }
  async issueBillingKey(_req: BillingKeyIssueRequest): Promise<BillingKey> {
    throw new Error('payments.issueBillingKey: not implemented (Phase 2)');
  }
  async autoCharge(_req: AutoChargeRequest): Promise<ChargeResult> {
    throw new Error('payments.autoCharge: not implemented (Phase 2)');
  }
}

export const payments: PaymentsClient = new StubPayments();
