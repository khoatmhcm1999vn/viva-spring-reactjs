-- Coffee Shop - du lieu mau
--
-- Chay sau schema.sql (ten file co tien to so nen Postgres nap theo thu tu).
-- Du de trang menu co thu hien va de kiem chung join 1:N tren don hang.

SET search_path TO coffee;

INSERT INTO coffee.category (slug, name, sort_order) VALUES
    ('espresso',   'Ca phe espresso', 1),
    ('vietnamese', 'Ca phe Viet',     2),
    ('tea',        'Tra',             3),
    ('pastry',     'Banh ngot',       4);


-- Gia theo VND. Lay category_id bang truy van theo slug thay vi viet so cung,
-- vi IDENTITY khong bao dam bat dau tu 1 sau nay.
INSERT INTO coffee.product (category_id, sku, name, description, price) VALUES
    ((SELECT id FROM coffee.category WHERE slug = 'espresso'),   'ESP-01', 'Espresso',          'Mot shot 30ml',                  35000),
    ((SELECT id FROM coffee.category WHERE slug = 'espresso'),   'ESP-02', 'Americano',         'Espresso pha loang voi nuoc nong', 40000),
    ((SELECT id FROM coffee.category WHERE slug = 'espresso'),   'ESP-03', 'Cappuccino',        'Espresso, sua nong, bot sua day',  50000),
    ((SELECT id FROM coffee.category WHERE slug = 'espresso'),   'ESP-04', 'Latte',             'Espresso va nhieu sua nong',       52000),
    ((SELECT id FROM coffee.category WHERE slug = 'vietnamese'), 'VN-01',  'Ca phe sua da',     'Phin truyen thong, sua dac',       32000),
    ((SELECT id FROM coffee.category WHERE slug = 'vietnamese'), 'VN-02',  'Ca phe den da',     'Phin truyen thong, khong sua',     28000),
    ((SELECT id FROM coffee.category WHERE slug = 'vietnamese'), 'VN-03',  'Ca phe trung',      'Long do trung danh bong',          55000),
    ((SELECT id FROM coffee.category WHERE slug = 'vietnamese'), 'VN-04',  'Bac xiu',           'Nhieu sua, it ca phe',             36000),
    ((SELECT id FROM coffee.category WHERE slug = 'tea'),        'TEA-01', 'Tra dao cam sa',    'Tra den, dao, cam, sa',            45000),
    ((SELECT id FROM coffee.category WHERE slug = 'tea'),        'TEA-02', 'Tra sen vang',      'Tra xanh, hat sen, nhan',          48000),
    ((SELECT id FROM coffee.category WHERE slug = 'pastry'),     'PAS-01', 'Croissant bo',      'Nuong trong ngay',                 35000),
    ((SELECT id FROM coffee.category WHERE slug = 'pastry'),     'PAS-02', 'Banh mi que pate',  'Gion, nhan pate',                  25000);


-- Mot san pham het hang, de endpoint menu co gi ma loc.
UPDATE coffee.product
   SET is_available = FALSE
 WHERE sku = 'VN-03';


-- Hai don hang mau, moi don nhieu dong - du de kiem chung join 1:N va
-- viec tinh tong phia N truoc khi gan vao phia 1.
INSERT INTO coffee.customer_order (order_code, customer_name, status, total_amount) VALUES
    ('ORD-20261008-001', 'Nguyen Van A', 'PAID', 0),
    ('ORD-20261008-002', 'Tran Thi B',   'NEW',  0);

INSERT INTO coffee.order_item (order_id, product_id, quantity, unit_price)
SELECT
    ord.id,
    prod.id,
    2,
    prod.price
FROM coffee.customer_order ord,
     coffee.product prod
WHERE ord.order_code = 'ORD-20261008-001'
  AND prod.sku = 'VN-01';

INSERT INTO coffee.order_item (order_id, product_id, quantity, unit_price)
SELECT
    ord.id,
    prod.id,
    1,
    prod.price
FROM coffee.customer_order ord,
     coffee.product prod
WHERE ord.order_code = 'ORD-20261008-001'
  AND prod.sku = 'PAS-01';

INSERT INTO coffee.order_item (order_id, product_id, quantity, unit_price)
SELECT
    ord.id,
    prod.id,
    3,
    prod.price
FROM coffee.customer_order ord,
     coffee.product prod
WHERE ord.order_code = 'ORD-20261008-002'
  AND prod.sku = 'ESP-03';


-- Chot lai total_amount tu cac dong chi tiet. Pre-aggregate phia N ve dung grain
-- roi moi cap nhat phia 1 - khong join truc tiep roi SUM, vi nhu vay se nhan dong.
UPDATE coffee.customer_order ord
   SET total_amount = agg.order_total
  FROM (
           SELECT
               item.order_id,
               SUM(item.line_amount) AS order_total
           FROM coffee.order_item item
           GROUP BY item.order_id
       ) agg
 WHERE ord.id = agg.order_id;
