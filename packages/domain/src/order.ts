/**
 * 주문/배송/정산 상태 머신.
 *
 * 노션 "구매자 Page" 주문 상태:
 *   결제완료 → 배송준비 → 배송중 → 배송완료 → 구매확정
 *
 * 자동 구매확정: 배송완료 후 N일 (정확한 일수는 정책 결정 필요).
 */

export type OrderStatus =
  | 'paid'
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'confirmed'
  | 'canceled'
  | 'disputed';

export type EscrowState = 'held' | 'released' | 'refunded';

export type SettlementState = 'pending' | 'approved' | 'paid_out';

/** 자동 구매확정 일수 (정책 미확정 — 노션 "공통 체크리스트 — 핵심 정책" 참고) */
export const AUTO_CONFIRM_DAYS = 7;

/** 당일배송 마감 시각 (노션 "프로젝트 개요": 오후 3시 마감) */
export const SAMEDAY_CUTOFF_HOUR = 15;

export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  paid: ['preparing', 'canceled'],
  preparing: ['shipped', 'canceled'],
  shipped: ['delivered', 'disputed'],
  delivered: ['confirmed', 'disputed'],
  confirmed: [],
  canceled: [],
  disputed: ['confirmed', 'canceled'],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}
