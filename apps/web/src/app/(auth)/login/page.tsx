import { Button, Card } from '@toolbox/ui';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--tl-bg-muted)] p-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-xl font-bold">TOOLBOX 로그인</h1>
        <div className="flex flex-col gap-3">
          <Button variant="outline">네이버로 시작하기</Button>
          <Button variant="outline">Google로 시작하기</Button>
          <Button variant="outline">Apple로 시작하기</Button>
        </div>
        <p className="mt-6 text-center text-xs text-[var(--tl-text-muted)]">
          Phase 1에서 OAuth 실연결. 가입 시 휴대폰 번호 등록 (카카오 알림톡용).
        </p>
      </Card>
    </div>
  );
}
