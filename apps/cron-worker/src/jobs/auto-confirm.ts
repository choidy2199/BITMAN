/**
 * 자동 구매확정.
 * 노션 "구매자 Page": "배송완료 후 N일 자동 구매확정" (정확한 일수는 정책 결정 필요)
 *
 * Phase 1에서 실제 구현. 지금은 인터페이스 자리만.
 */
import { AUTO_CONFIRM_DAYS } from '@toolbox/domain';

export async function runAutoConfirmJob(): Promise<{ confirmed: number }> {
  // TODO Phase 1:
  //   1. orders where status='delivered' and auto_confirm_at <= now()
  //   2. status → 'confirmed', escrow_state → 'released'
  //   3. settlements 생성 (해당 판매자 정산 예정 row)
  //   4. notify.sendKakao(PURCHASE_CONFIRM_REMIND)
  void AUTO_CONFIRM_DAYS;
  return { confirmed: 0 };
}
