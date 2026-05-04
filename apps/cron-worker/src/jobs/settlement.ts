/**
 * 정산 집계 잡.
 * 정산 주기는 추후 결정 (주 1회 or 월 2회).
 * Phase 1 — 확정된 주문에 대한 settlement row 생성.
 */
export async function runSettlementJob(): Promise<{ settled: number }> {
  return { settled: 0 };
}
