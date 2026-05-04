import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types.gen';

let singleton: ReturnType<typeof createBrowserClient<Database>> | null = null;

/** 브라우저(클라이언트 컴포넌트)에서 사용. 싱글턴. */
export function createSupabaseBrowserClient() {
  if (singleton) return singleton;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  singleton = createBrowserClient<Database>(url, anonKey);
  return singleton;
}
