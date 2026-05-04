import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types.gen';

interface CookieStore {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, options: CookieOptions): void;
}

/** RSC / route handler 등 서버 컴포넌트에서 사용. 사용자 세션 유지. */
export function createSupabaseServerClient(cookies: CookieStore) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      get: (name) => cookies.get(name)?.value,
      set: (name, value, options) => cookies.set(name, value, options),
      remove: (name, options) => cookies.set(name, '', { ...options, maxAge: 0 }),
    },
  });
}

/** service_role 키로 RLS 우회. 서버 사이드 작업 (관리자 작업, cron) 전용. */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
