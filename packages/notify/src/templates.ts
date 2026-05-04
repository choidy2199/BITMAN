/**
 * 카카오 알림톡 템플릿 코드.
 * 노션 "공통 체크리스트 — 카카오톡 알림 연동"의 9개 시나리오.
 *
 * 실제 발신은 Phase 1에서 NHN Cloud 또는 카카오 i 비즈메시지 API로 연동.
 * 발신 프로필 등록 + 메시지 템플릿 검수가 선행되어야 함.
 */
export const KakaoTemplate = {
  ORDER_RECEIVED_TO_SELLER: 'TOOLBOX_ORDER_RECEIVED_001',
  SHIPPED_TO_BUYER: 'TOOLBOX_SHIPPED_002',
  LOWEST_PRICE_BEATEN: 'TOOLBOX_LOWEST_BEATEN_003',
  BUYER_BID_REGISTERED: 'TOOLBOX_BUYER_BID_004',
  BUYER_BID_MATCHED: 'TOOLBOX_BID_MATCHED_005',
  SAMEDAY_DEADLINE_REMIND: 'TOOLBOX_DEADLINE_006',
  SELLER_APPROVED: 'TOOLBOX_SELLER_APPROVED_007',
  PURCHASE_CONFIRM_REMIND: 'TOOLBOX_CONFIRM_008',
  SETTLEMENT_DONE: 'TOOLBOX_SETTLEMENT_009',
} as const;

export type KakaoTemplateCode = (typeof KakaoTemplate)[keyof typeof KakaoTemplate];

/** 템플릿별 변수 타입. 발송 시 컴파일 타임에 검증. */
export interface KakaoTemplateVars {
  TOOLBOX_ORDER_RECEIVED_001: { productName: string; quantity: number; orderId: string };
  TOOLBOX_SHIPPED_002: { sellerName: string; trackingNo: string; courier: string };
  TOOLBOX_LOWEST_BEATEN_003: { productName: string; myPrice: number; newLowestPrice: number };
  TOOLBOX_BUYER_BID_004: { productName: string; desiredPrice: number };
  TOOLBOX_BID_MATCHED_005: { productName: string; price: number };
  TOOLBOX_DEADLINE_006: { pendingOrderCount: number };
  TOOLBOX_SELLER_APPROVED_007: { sellerName: string };
  TOOLBOX_CONFIRM_008: { orderId: string; deliveredAt: string };
  TOOLBOX_SETTLEMENT_009: { amount: number; period: string };
}
