import { Card } from '@toolbox/ui';

export default function SellerDashboardPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">판매자 대시보드</h1>
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>오늘 주문 — Phase 1</Card>
        <Card>이번 달 매출 — Phase 1</Card>
        <Card>최저가 제품 — Phase 1</Card>
        <Card>미발송 주문 — Phase 1</Card>
      </div>
    </div>
  );
}
