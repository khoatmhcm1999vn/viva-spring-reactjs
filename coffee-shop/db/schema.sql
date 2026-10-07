-- Coffee Shop - schema
--
-- Chay mot lan khi container Postgres khoi tao lan dau (xem docker-compose.yml).
-- Postgres chi chay /docker-entrypoint-initdb.d khi data directory con trong.
--
-- Schema rieng "coffee" chu khong dung "public": neu sau nay cung mot Postgres
-- phuc vu nhieu app thi khong ai do len ai.

CREATE SCHEMA IF NOT EXISTS coffee;

SET search_path TO coffee;


-- ---------------------------------------------------------------------------
-- Danh muc san pham
-- ---------------------------------------------------------------------------
CREATE TABLE coffee.category (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug        VARCHAR(50)  NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    sort_order  INTEGER      NOT NULL DEFAULT 0,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE
);


-- ---------------------------------------------------------------------------
-- San pham
--
-- price la NUMERIC chu khong phai float: float lam tron nhi phan nen 0.1 + 0.2
-- khong bang 0.3, va voi tien thi sai so do khong chap nhan duoc.
-- Driver pg tra NUMERIC ve JavaScript duoi dang STRING de khong mat chinh xac.
-- ---------------------------------------------------------------------------
CREATE TABLE coffee.product (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_id    BIGINT         NOT NULL REFERENCES coffee.category (id),
    sku            VARCHAR(30)    NOT NULL UNIQUE,
    name           VARCHAR(150)   NOT NULL,
    description    TEXT,
    price          NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    currency_code  CHAR(3)        NOT NULL DEFAULT 'VND',
    is_available   BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- Trang menu loc theo is_available roi join sang category, nen index theo
-- category_id co ich. Khong them index theo cam tinh cho cac cot khac.
CREATE INDEX idx_product_category ON coffee.product (category_id);


-- ---------------------------------------------------------------------------
-- Don hang
--
-- Ten bang la "customer_order" chu khong phai "order": ORDER la reserved word,
-- dung duoc nhung phai quote moi lan xuat hien.
--
-- total_amount la gia tri CHOT luc dat hang. Khong tinh lai tu order_item moi
-- lan doc, vi gia san pham co the doi sau do - hoa don phai giu gia cu.
-- ---------------------------------------------------------------------------
CREATE TABLE coffee.customer_order (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_code     VARCHAR(20)    NOT NULL UNIQUE,
    customer_name  VARCHAR(150)   NOT NULL,
    status         VARCHAR(20)    NOT NULL DEFAULT 'NEW'
                   CHECK (status IN ('NEW', 'PAID', 'PREPARING', 'DONE', 'CANCELLED')),
    total_amount   NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    currency_code  CHAR(3)        NOT NULL DEFAULT 'VND',
    created_at     TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_created_at ON coffee.customer_order (created_at);


-- ---------------------------------------------------------------------------
-- Dong chi tiet don hang
--
-- unit_price duoc COPY tu product.price luc dat hang, khong phai khoa ngoai tro
-- den gia hien tai. Day la ly do bang nay co cot gia rieng.
--
-- line_amount la GENERATED: Postgres tu tinh, khong the ghi gia tri lech voi
-- quantity * unit_price.
-- ---------------------------------------------------------------------------
CREATE TABLE coffee.order_item (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id    BIGINT         NOT NULL REFERENCES coffee.customer_order (id) ON DELETE CASCADE,
    product_id  BIGINT         NOT NULL REFERENCES coffee.product (id),
    quantity    INTEGER        NOT NULL CHECK (quantity > 0),
    unit_price  NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    line_amount NUMERIC(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    CONSTRAINT uq_order_item UNIQUE (order_id, product_id)
);

CREATE INDEX idx_order_item_order ON coffee.order_item (order_id);
