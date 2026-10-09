-- Rang buoc Prisma schema khong bieu dien duoc, bo sung bang SQL.
-- Nguon: docs/data-model.md va docs/requirements.md (REQ-201, REQ-202).
-- Tat ca la rang buoc toan ven o tang DB, khong thay the validation o service.

-- ----- Tien >= 0 -----
ALTER TABLE "product_variants"      ADD CONSTRAINT "chk_variant_price_nonneg"   CHECK ("price_vnd" >= 0);
ALTER TABLE "modifier_options"      ADD CONSTRAINT "chk_option_extra_nonneg"    CHECK ("extra_price_vnd" >= 0);
ALTER TABLE "checkout_quotes"       ADD CONSTRAINT "chk_quote_total_nonneg"     CHECK ("total_vnd" >= 0);
ALTER TABLE "payments"              ADD CONSTRAINT "chk_payment_amount_nonneg"  CHECK ("amount_vnd" >= 0);

-- ----- modifier group: max >= min, min >= 0 -----
ALTER TABLE "modifier_groups"
  ADD CONSTRAINT "chk_group_select_range" CHECK ("min_select" >= 0 AND "max_select" >= "min_select");

-- ----- order_items: tien >= 0, quantity 1..20, cong thuc line_total -----
-- Gioi han quantity 1..20 moi dong khop REQ-202.
ALTER TABLE "order_items"
  ADD CONSTRAINT "chk_item_prices_nonneg"
    CHECK ("base_price_vnd" >= 0 AND "unit_price_vnd" >= 0 AND "line_total_vnd" >= 0),
  ADD CONSTRAINT "chk_item_quantity_range"
    CHECK ("quantity" >= 1 AND "quantity" <= 20),
  ADD CONSTRAINT "chk_item_line_total"
    CHECK ("line_total_vnd" = "unit_price_vnd" * "quantity");

ALTER TABLE "order_item_modifiers"
  ADD CONSTRAINT "chk_item_modifier_extra_nonneg" CHECK ("extra_price_vnd" >= 0);

-- ----- orders: tien >= 0 va total = subtotal + shipping - discount -----
ALTER TABLE "orders"
  ADD CONSTRAINT "chk_order_amounts_nonneg"
    CHECK ("subtotal_vnd" >= 0 AND "shipping_fee_vnd" >= 0 AND "discount_vnd" >= 0 AND "total_vnd" >= 0),
  ADD CONSTRAINT "chk_order_total_formula"
    CHECK ("total_vnd" = "subtotal_vnd" + "shipping_fee_vnd" - "discount_vnd"),
  ADD CONSTRAINT "chk_order_version_nonneg"
    CHECK ("version" >= 0);

ALTER TABLE "payments"
  ADD CONSTRAINT "chk_payment_version_nonneg" CHECK ("version" >= 0);

-- ----- MVP: dung MOT payment PAY_AT_COUNTER moi don -----
-- Partial unique index: tai moi thoi diem chi mot payment PAY_AT_COUNTER / order.
-- Khi them prepay nhieu lan trong tuong lai, migration rieng se noi long dieu nay.
CREATE UNIQUE INDEX "uq_payment_counter_per_order"
  ON "payments" ("order_id")
  WHERE "method" = 'PAY_AT_COUNTER';

-- ----- MVP: chan DELIVERY o tang DB cho den khi bat delivery -----
-- Nhanh delivery chi la thiet ke tuong lai; khong cho tao don DELIVERY o ban nay.
ALTER TABLE "orders"
  ADD CONSTRAINT "chk_order_pickup_only" CHECK ("fulfillment_type" = 'PICKUP');

-- ----- quote: expires_at phai sau created_at -----
ALTER TABLE "checkout_quotes"
  ADD CONSTRAINT "chk_quote_expiry_after_created" CHECK ("expires_at" > "created_at");
