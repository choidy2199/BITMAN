/**
 * 입찰 도메인 타입.
 *
 * 두 종류의 입찰:
 *  1. 판매 입찰 (Sell Bid)  — 판매자가 가격 게시. (product_id, seller_id) UNIQUE.
 *  2. 구매 입찰 (Buy Bid)   — 구매자가 희망가 등록. 판매자 수락 시 빌링키 자동결제.
 *
 * 매칭 규칙:
 *  - 즉시구매: 구매자가 판매 입찰 리스트에서 선택 → 즉시 체결
 *  - 즉시판매: 판매자가 구매 입찰 수락 → 즉시 체결 (선착순)
 */

export type SellBidStatus = 'active' | 'paused' | 'sold_out' | 'withdrawn';
export type BuyBidStatus = 'open' | 'matched' | 'expired' | 'canceled';

export interface SellBid {
  id: string;
  productId: string;
  sellerId: string;
  costPrice: number;
  salePrice: number; // 택배비 포함가 (소비자 노출)
  shippingCost: number;
  courier: string;
  stock: number;
  status: SellBidStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BuyBid {
  id: string;
  productId: string;
  buyerId: string;
  desiredPrice: number;
  qty: number;
  billingKeyId: string;
  expiresAt: string;
  status: BuyBidStatus;
  createdAt: string;
}

/** 노션 UI관련: "최저가순 최대 5개 노출, 판매자명 비공개" */
export const MAX_VISIBLE_SELL_BIDS = 5;

/** 판매 입찰 정렬: 최저가순. 동가는 먼저 등록된 순 (FIFO). */
export function sortSellBidsForBuyer(bids: SellBid[]): SellBid[] {
  return [...bids]
    .filter((b) => b.status === 'active' && b.stock > 0)
    .sort((a, b) => a.salePrice - b.salePrice || a.createdAt.localeCompare(b.createdAt))
    .slice(0, MAX_VISIBLE_SELL_BIDS);
}

/** 자동 최저가 입찰 (Phase 2) — 경쟁자 가격보다 1단위 낮게, minSalePrice는 침범 X. */
export function nextAutoBidPrice(
  competitorPrice: number,
  minSalePrice: number,
  decrement: number,
): number | null {
  const candidate = competitorPrice - decrement;
  return candidate < minSalePrice ? null : candidate;
}
