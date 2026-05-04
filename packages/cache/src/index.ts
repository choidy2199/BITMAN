/**
 * 캐시 인터페이스 — Phase 0에서는 in-memory stub.
 * 트래픽이 늘면 내부 구현만 Upstash Redis로 교체. 호출부는 그대로.
 *
 * 노션 "동시접속 1만 명 아키텍처 설계":
 *   "packages/cache와 packages/queue를 처음부터 빈 껍데기라도 만들어두는 것이 핵심"
 */

export interface CacheClient {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T = unknown>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
}

interface Entry {
  value: unknown;
  expiresAt: number | null;
}

class InMemoryCache implements CacheClient {
  private store = new Map<string, Entry>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

export const cache: CacheClient = new InMemoryCache();
