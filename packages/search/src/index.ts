/**
 * 검색 인터페이스 — Phase 0에서는 Supabase ilike fallback에 위임.
 * Phase 3에서 Algolia (또는 Meilisearch)로 교체. 호출부 변화 없음.
 */

export interface ProductSearchHit {
  id: string;
  modelNo: string;
  name: string;
  brandId: string;
  thumbnailUrl: string | null;
}

export interface SearchClient {
  searchProducts(query: string, opts?: SearchOptions): Promise<ProductSearchHit[]>;
  indexProduct(product: ProductSearchHit): Promise<void>;
  removeProduct(id: string): Promise<void>;
}

export interface SearchOptions {
  limit?: number;
  brandId?: string;
  categoryId?: string;
}

class FallbackSearch implements SearchClient {
  async searchProducts(_query: string, _opts?: SearchOptions): Promise<ProductSearchHit[]> {
    // Phase 1: apps/web의 API에서 Supabase ilike로 직접 구현.
    // 여기서는 빈 결과 반환. 호출부는 try/catch 없이 안전.
    return [];
  }

  async indexProduct(_product: ProductSearchHit): Promise<void> {
    // Phase 3 Algolia 도입 전까지 no-op.
  }

  async removeProduct(_id: string): Promise<void> {
    // no-op
  }
}

export const search: SearchClient = new FallbackSearch();
