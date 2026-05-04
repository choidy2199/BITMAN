/**
 * 합배송 묶음 로직.
 * 노션 "구매자 Page": 같은 판매자 상품은 택배비 1회만 부과, 다른 판매자는 각각.
 *
 * 판매가는 이미 택배비를 포함하지만(노션 정책), 같은 판매자 합배송 시
 * "두 번째 이후 상품의 택배비 부분"을 차감해줘야 한다.
 *
 * 차감 처리는 결제 직전 calcConsolidatedShipping()에서 수행.
 */

export interface CartLine {
  bidId: string;
  productId: string;
  sellerId: string;
  /** 단가 (택배비 포함, salePrice) */
  unitPrice: number;
  /** 이 입찰의 내부 택배비 (관리용, salePrice에 이미 포함됨) */
  shippingCost: number;
  qty: number;
}

export interface ShippingGroup {
  sellerId: string;
  lines: CartLine[];
  /** 그룹 단일 택배비 (해당 그룹의 첫 입찰의 shippingCost 사용) */
  shippingCost: number;
  /** 합배송으로 절감된 금액 */
  savedShipping: number;
  /** 그룹 결제 총액 (절감 반영) */
  groupTotal: number;
}

export function groupForCheckout(cart: CartLine[]): ShippingGroup[] {
  const bySeller = new Map<string, CartLine[]>();
  for (const line of cart) {
    const list = bySeller.get(line.sellerId) ?? [];
    list.push(line);
    bySeller.set(line.sellerId, list);
  }

  const groups: ShippingGroup[] = [];
  for (const [sellerId, lines] of bySeller) {
    const groupShipping = lines[0]?.shippingCost ?? 0;
    const itemsTotal = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);

    // 두 번째 이후 라인의 shippingCost를 합배송 절감으로 차감.
    // 단, salePrice는 이미 택배비 포함이라 단순 합산이 아니라 절감액만 차감.
    const savedShipping = lines
      .slice(1)
      .reduce((sum, l) => sum + l.shippingCost, 0);

    groups.push({
      sellerId,
      lines,
      shippingCost: groupShipping,
      savedShipping,
      groupTotal: itemsTotal - savedShipping,
    });
  }

  return groups;
}
