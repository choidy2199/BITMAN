/**
 * 인증 도메인 타입 + 역할 가드.
 * Supabase Auth 세션을 래핑. OAuth provider는 Supabase 콘솔에서 설정.
 *
 * 노션 "공통 체크리스트 — 인증 시스템":
 * - Supabase Auth + 네이버/구글/애플 OAuth
 * - 역할 분리: buyer / seller / admin
 * - 역할별 라우트 보호 (Next.js 미들웨어)
 */

export type Role = 'buyer' | 'seller' | 'admin';

export type OAuthProvider = 'naver' | 'google' | 'apple';

export interface SessionUser {
  id: string;
  email: string | null;
  phone: string | null;
  role: Role;
  /** 판매자 한정. seller_profiles.status. */
  sellerStatus?: 'pending' | 'approved' | 'suspended';
}

export const REDIRECT_BY_ROLE: Record<Role, string> = {
  buyer: '/',
  seller: '/seller',
  admin: '/admin',
};

export function canAccessAdmin(user: SessionUser | null): boolean {
  return user?.role === 'admin';
}

export function canAccessSeller(user: SessionUser | null): boolean {
  return user?.role === 'seller' && user.sellerStatus === 'approved';
}

export function isAuthenticated(user: SessionUser | null): user is SessionUser {
  return user !== null;
}
