# Mô hình dữ liệu thiết kế

> **Cập nhật bước 04 (2026-10-09):** mô hình này **đã được hiện thực** bằng Prisma schema (`apps/api/prisma/schema.prisma`) và 2 migration đã áp dụng lên PostgreSQL thật. Nguồn chuẩn thực thi giờ là **Prisma migrations**; tài liệu này là mô tả thiết kế đi kèm. Chi tiết các constraint đã chạy và bằng chứng test ở `docs/progress.md` mục “Bước 04”.

UUID PK mặc định trừ bảng liên kết; tiền integer VND >=0, quantity integer >0; timestamp dùng timestamptz. Các trường updated_at và created_at dùng cho entity mutable, đã lược bớt trong ERD cho dễ đọc.

**Ràng buộc tầng DB đã hiện thực** (migration `20261009140000_add_check_constraints`, phần Prisma không biểu diễn được):
- CHECK tiền ≥ 0: `product_variants.price_vnd`, `modifier_options.extra_price_vnd`, `checkout_quotes.total_vnd`, `payments.amount_vnd`, các cột tiền của `orders` và `order_items`.
- CHECK `modifier_groups`: `min_select >= 0 AND max_select >= min_select`.
- CHECK `order_items`: `quantity` trong 1..20 (REQ-202), `line_total_vnd = unit_price_vnd * quantity` (REQ-201).
- CHECK `orders`: `total_vnd = subtotal_vnd + shipping_fee_vnd - discount_vnd`; `version >= 0`.
- CHECK `payments.version >= 0`.
- **Partial unique** `uq_payment_counter_per_order` trên `payments(order_id) WHERE method='PAY_AT_COUNTER'`: MVP đúng một payment pay-at-counter mỗi đơn, nới được khi thêm prepay bằng migration riêng.
- CHECK `orders.fulfillment_type = 'PICKUP'`: chặn tạo đơn DELIVERY ở tầng DB cho tới khi bật delivery (có migration riêng).
- CHECK `checkout_quotes.expires_at > created_at`.

| Bảng | Cột và ràng buộc |
|---|---|
| profiles | id UUID PK = auth.users.id (FK chỉ Supabase migration tương ứng); full_name; phone; role CUSTOMER/STAFF/ADMIN default CUSTOMER; is_active |
| stores | id PK; code UNIQUE; name; address; is_active |
| store_staff | store_id FK stores; user_id FK profiles; PK(store_id,user_id) |
| categories | id PK; name; slug UNIQUE; sort_order; is_active |
| products | id PK; category_id FK categories; name; slug UNIQUE; description; image_path; is_active |
| product_variants | id PK; product_id FK products; sku UNIQUE; size; price_vnd >=0; is_active; UNIQUE(product_id,size) |
| modifier_groups | id PK; name; min_select >=0; max_select >= min_select |
| modifier_options | id PK; group_id FK modifier_groups; name; extra_price_vnd >=0; is_active; UNIQUE(group_id,name) |
| product_modifier_groups | product_id FK products; group_id FK modifier_groups; PK(product_id,group_id) |
| store_variants | store_id FK stores; variant_id FK product_variants; is_available; PK(store_id,variant_id) |
| checkout_quotes | id PK; user_id FK profiles; store_id FK stores; request_hash; normalized_payload JSONB; price_snapshot JSONB; total_vnd; expires_at; created_at |
| orders | id PK; code UNIQUE; user_id FK profiles; store_id FK stores; quote_id FK checkout_quotes UNIQUE; fulfillment_type PICKUP/DELIVERY (DELIVERY disabled MVP); status; subtotal_vnd; shipping_fee_vnd; discount_vnd; total_vnd; recipient_name/phone; pickup_note; store_name/address_snapshot; delivery_address_snapshot nullable future; version default 0; created_at; updated_at |
| order_items | id PK; order_id FK orders; variant_id FK product_variants; product_name_snapshot; size_snapshot; base_price_vnd; unit_price_vnd (base+modifiers); quantity; line_total_vnd; note |
| order_item_modifiers | id PK; order_item_id FK order_items; option_id FK modifier_options; group_name_snapshot; option_name_snapshot; extra_price_vnd; UNIQUE(order_item_id,option_id) |
| order_status_history | id PK; order_id FK orders; from_status nullable initial; to_status; actor_id FK profiles; reason nullable; created_at; append-only |
| payments | id PK; order_id FK orders; method; status; amount_vnd; provider_reference nullable UNIQUE; collected_by nullable FK profiles; paid_at nullable; version default 0; created_at; updated_at |
| idempotency_keys | id PK; user_id FK profiles; key; request_hash; order_id FK orders UNIQUE; created_at; UNIQUE(user_id,key); transaction may insert order_id null temporarily, committed successful record must be linked |

Payment relationship is 1:N for future attempts; MVP creates exactly one pay-at-counter record per order and should enforce this using a suitable unique/partial constraint. Do not add UNIQUE(order_id) globally if future payment attempts are implemented without a migration plan.

FK parent catalog/profile/store referenced by history is RESTRICT/NO ACTION. Deactivate catalog instead of deleting; do not cascade-delete business history. Supabase Auth user deletion needs an explicit retention/anonymization policy; MVP disables deletion and deactivates profile. SQL check total=subtotal+shipping-discount and line_total=unit_price*quantity; cross-row sums verified service-side inside transaction.

Indexes: products(category_id,is_active), variants(product_id), options(group_id), store_staff(user_id), store_variants(variant_id), orders(user_id,created_at), orders(store_id,status,created_at), items(order_id), selected_modifiers(order_item_id), history(order_id,created_at,id), payments(order_id), quotes(user_id,expires_at). Unique indexes cover their exact prefixes; avoid duplicate indexes.

Integration tests on vanilla PostgreSQL cannot assume auth.users exists: document test bootstrap schema or keep the auth FK in Supabase-specific SQL while application profiles.id mapping is verified at Auth boundary. Never change production schema merely to simplify tests.
