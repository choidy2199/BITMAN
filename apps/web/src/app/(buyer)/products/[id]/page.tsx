interface Props {
  params: { id: string };
}

export default function ProductDetailPage({ params }: Props) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-2 text-xl font-bold">제품 상세</h1>
      <p className="text-sm text-[var(--tl-text-muted)]">product id: {params.id}</p>
      <p className="mt-6 text-[var(--tl-text-muted)]">
        Phase 1 — 크림 스타일: 좌측 이미지 / 우측 정보 + 입찰 리스트 + 가격 차트 + 하단 고정 CTA(즉시구매/즉시판매).
      </p>
    </div>
  );
}
