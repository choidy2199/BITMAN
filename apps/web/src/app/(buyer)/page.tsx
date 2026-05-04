import { Card } from '@toolbox/ui';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">TOOLBOX</h1>
      <p className="mb-8 text-[var(--tl-text-muted)]">
        판매자가 가격을 입찰하고, 소비자가 최저가로 구매하는 공구 마켓
      </p>

      <Card className="mb-4">
        <h2 className="mb-2 font-semibold">Phase 0 — 뼈대 구축 완료</h2>
        <p className="text-sm text-[var(--tl-text-muted)]">
          모노레포, 디자인 토큰, DB 마이그레이션, 3채널 라우트 그룹, 인프라 스텁(cache/queue/search/payments/notify) 자리잡음.
        </p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <h3 className="font-medium">구매자</h3>
          <p className="mt-1 text-sm text-[var(--tl-text-muted)]">/products</p>
        </Card>
        <Card>
          <h3 className="font-medium">판매자</h3>
          <p className="mt-1 text-sm text-[var(--tl-text-muted)]">/seller</p>
        </Card>
        <Card>
          <h3 className="font-medium">관리자</h3>
          <p className="mt-1 text-sm text-[var(--tl-text-muted)]">/admin</p>
        </Card>
      </div>
    </div>
  );
}
