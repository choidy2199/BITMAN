import { Card } from '@toolbox/ui';

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">관리자 대시보드</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>매출 KPI — Phase 1</Card>
        <Card>주문 건수 — Phase 1</Card>
        <Card>신규 회원 — Phase 1</Card>
        <Card>미승인 판매자 — Phase 1</Card>
        <Card>미발송 주문 — Phase 1</Card>
        <Card>당일배송 마감 — Phase 1</Card>
      </div>
    </div>
  );
}
