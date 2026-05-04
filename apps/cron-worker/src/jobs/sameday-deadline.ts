/**
 * 당일배송 마감 리마인더 (오후 2시 발송).
 * 노션 "프로젝트 개요": 오후 3시 주문 마감 → 당일배송 원칙
 */
export async function runSamedayDeadlineJob(): Promise<{ notified: number }> {
  return { notified: 0 };
}
