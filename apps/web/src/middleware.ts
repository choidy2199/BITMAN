import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * 역할 기반 라우트 보호.
 * - /admin/*  → role=admin
 * - /seller/* → role=seller AND seller_profiles.status='approved' (DB 조회는 layout/page에서)
 * - 기타       → 누구나 (가격 블러는 클라이언트에서 처리)
 *
 * 노션 "공통 체크리스트 — 인증":
 *   "역할별 라우트 보호 (Next.js 미들웨어)"
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = pathname.startsWith('/admin') || pathname.startsWith('/seller');
  const isAuthRoute = pathname.startsWith('/login');

  // 환경변수 미설정 시 미들웨어 우회 (Phase 0 개발 편의)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      get: (name) => request.cookies.get(name)?.value,
      set: (name, value, options) => response.cookies.set({ name, value, ...options }),
      remove: (name, options) => response.cookies.set({ name, value: '', ...options, maxAge: 0 }),
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (!isProtected) {
    return response;
  }

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role;

  if (pathname.startsWith('/admin') && role !== 'admin') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  if (pathname.startsWith('/seller') && role !== 'seller' && role !== 'admin') {
    return NextResponse.redirect(new URL('/seller/register', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/seller/:path*', '/login'],
};
