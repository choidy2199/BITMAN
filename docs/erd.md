# TOOLBOX ERD (15 tables)

> 마이그레이션 SQL: `packages/db/supabase/migrations/0001_init_schema.sql`

```mermaid
erDiagram
    USERS ||--o| SELLER_PROFILES : "role=seller"
    USERS ||--o{ BIDS : "판매 입찰"
    USERS ||--o{ BUYER_BIDS : "구매 입찰"
    USERS ||--o{ ORDERS : "buyer_id"
    USERS ||--o{ ORDERS : "seller_id"
    USERS ||--o{ BILLING_KEYS : ""
    USERS ||--o{ NOTIFICATIONS : ""
    USERS ||--o{ SETTLEMENTS : "seller_id"

    BRANDS ||--o{ PRODUCTS : ""
    CATEGORIES ||--o{ CATEGORIES : "parent"
    CATEGORIES ||--o{ PRODUCTS : ""

    PRODUCTS ||--o{ BIDS : ""
    PRODUCTS ||--o{ BUYER_BIDS : ""
    PRODUCTS ||--o{ ORDER_ITEMS : ""
    PRODUCTS ||--o{ PRICE_HISTORY : ""

    BIDS ||--o{ ORDER_ITEMS : "체결"
    BUYER_BIDS ||--o{ ORDER_ITEMS : "체결"
    BILLING_KEYS ||--o{ BUYER_BIDS : "사전등록"

    ORDERS ||--o{ ORDER_ITEMS : ""
    ORDERS ||--o{ SHIPMENTS : ""
    ORDERS ||--o{ PAYMENTS : ""

    USERS {
        uuid id PK
        enum role
        text phone
        text oauth_provider
    }
    SELLER_PROFILES {
        uuid user_id PK,FK
        text business_no
        int deposit_amount
        bool deposit_paid
        int credit_score
        enum status
    }
    BRANDS {
        uuid id PK
        text name_ko
        enum tier
        int monthly_fee
    }
    CATEGORIES {
        uuid id PK
        uuid parent_id FK
        text slug
    }
    PRODUCTS {
        uuid id PK
        uuid brand_id FK
        text model_no
        jsonb specs
        enum composition
        numeric commission_rate
    }
    BIDS {
        uuid id PK
        uuid product_id FK
        uuid seller_id FK
        int cost_price
        int sale_price
        int stock
        enum status
    }
    BUYER_BIDS {
        uuid id PK
        uuid product_id FK
        uuid buyer_id FK
        int desired_price
        uuid billing_key_id FK
        enum status
    }
    ORDERS {
        uuid id PK
        uuid buyer_id FK
        uuid seller_id FK
        int total_amount
        enum status
        enum escrow_state
    }
    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        uuid bid_id FK
        int unit_price
        int qty
        int commission_amount
    }
    SHIPMENTS {
        uuid id PK
        uuid order_id FK
        text tracking_no
        text courier
    }
    PAYMENTS {
        uuid id PK
        uuid order_id FK
        text pg_tx_id
        enum method
        enum status
    }
    BILLING_KEYS {
        uuid id PK
        uuid user_id FK
        text pg_billing_key
        text card_last4
    }
    SETTLEMENTS {
        uuid id PK
        uuid seller_id FK
        date period_start
        int amount
        enum state
    }
    PRICE_HISTORY {
        bigint id PK
        uuid product_id FK
        int price
        timestamptz traded_at
    }
    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        text template_code
        enum channel
        jsonb payload
    }
```

## 핵심 제약/인덱스

- `bids (product_id, seller_id) UNIQUE` — 같은 상품에 같은 판매자는 1행만.
- `bids (product_id, sale_price) WHERE active AND stock>0` 부분 인덱스 — 최저가 5개 조회용.
- `buyer_bids (product_id, desired_price DESC) WHERE open` — 판매자가 본인 상품의 구매 입찰을 가격순으로.
- `products (brand_id, model_no, composition) UNIQUE` — 같은 모델·구성 중복 등록 방지.
- `payments.pg_tx_id UNIQUE` — 토스페이먼츠 거래 멱등.
- `shipments (courier, tracking_no) UNIQUE` — 운송장 중복 방지.

## 마스킹

- 구매자 노출용 view `bids_public`: `seller_id`, `cost_price`, `shipping_cost` 숨김.
- `seller_profiles.bank_account` 등은 RLS로 본인+admin만.
