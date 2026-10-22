-- 001: viet lai 6 ham thong ke khong con tao VIEW vinh vien.
--
-- Truoc day moi ham bat dau bang "DROP VIEW month_year / quarter_year / list_year"
-- roi CREATE lai view do trong schema public. Hai request dashboard den cung luc tren
-- hai ket noi khac nhau se tranh nhau cung mot view (loi ngau nhien "relation does
-- not exist"), va OverallDashboard goi song song nhieu ham ngay khi mo trang. View
-- con bi bo lai sau moi lan goi va lot vao pg_dump.
--
-- Ban moi dua lich thang/quy/nam vao CTE ben trong cau query: khong co DDL nao khi
-- goi ham, khong co doi tuong dung chung. Ten, tham so, kieu va thu tu cot tra ve
-- GIU NGUYEN vi dao/impl/PostDAOImpl va UserDAOImpl goi ham theo ten va doc cot theo
-- vi tri. Ngu nghia giu nguyen (dem ca ban ghi active = false, nhu ban cu).
--
-- Chay lai nhieu lan an toan (CREATE OR REPLACE, DROP VIEW IF EXISTS).
-- Ap dung: psql -1 -v ON_ERROR_STOP=1 -f 001_stats_functions_without_views.sql
-- container/prepare/functions/statistic_function.sql da duoc cap nhat giong het, de
-- volume moi tao cung co ban nay.

CREATE OR REPLACE FUNCTION postQuantityStatisticInRecentMonths()
RETURNS TABLE (month integer, year integer, count bigint)
LANGUAGE sql STABLE
AS $$
WITH month_year AS (
    SELECT extract(MONTH FROM CURRENT_DATE - (val * INTERVAL '1 month'))::integer AS month,
           extract(YEAR FROM CURRENT_DATE - (val * INTERVAL '1 month'))::integer AS year
    FROM (VALUES (0), (1), (2), (3), (4), (5), (6), (7), (8), (9), (10), (11)) AS tempValues(val)
)
SELECT m.month, m.year, count(i.id)
FROM post i
    RIGHT JOIN month_year m
    ON extract(MONTH FROM i.created_at) = m.month AND extract(YEAR FROM i.created_at) = m.year
GROUP BY m.month, m.year
ORDER BY m.year ASC, m.month ASC;
$$;

CREATE OR REPLACE FUNCTION postQuantityStatisticInQuarters()
RETURNS TABLE (quarter integer, year integer, count bigint)
LANGUAGE sql STABLE
AS $$
WITH quarter_year AS (
    SELECT extract(QUARTER FROM CURRENT_DATE - (val * INTERVAL '3 month'))::integer AS quarter,
           extract(YEAR FROM CURRENT_DATE - (val * INTERVAL '3 month'))::integer AS year
    FROM (VALUES (0), (1), (2), (3)) AS tempValues(val)
)
SELECT m.quarter, m.year, count(i.id)
FROM post i
    RIGHT JOIN quarter_year m
    ON extract(QUARTER FROM i.created_at) = m.quarter AND extract(YEAR FROM i.created_at) = m.year
GROUP BY m.quarter, m.year
ORDER BY m.year ASC, m.quarter ASC;
$$;

CREATE OR REPLACE FUNCTION postQuantityStatisticInYears()
RETURNS TABLE (month integer, year integer, count bigint)
LANGUAGE sql STABLE
AS $$
WITH list_year AS (
    SELECT extract(YEAR FROM CURRENT_DATE - (val * INTERVAL '12 month'))::integer AS year
    FROM (VALUES (0), (1)) AS tempValues(val)
)
SELECT 0, m.year, count(i.id)
FROM post i
    RIGHT JOIN list_year m
    ON extract(YEAR FROM i.created_at) = m.year
GROUP BY m.year
ORDER BY m.year ASC;
$$;

CREATE OR REPLACE FUNCTION userQuantityStatisticInRecentMonths()
RETURNS TABLE (month integer, year integer, count bigint)
LANGUAGE sql STABLE
AS $$
WITH month_year AS (
    SELECT extract(MONTH FROM CURRENT_DATE - (val * INTERVAL '1 month'))::integer AS month,
           extract(YEAR FROM CURRENT_DATE - (val * INTERVAL '1 month'))::integer AS year
    FROM (VALUES (0), (1), (2), (3), (4), (5), (6), (7), (8), (9), (10), (11)) AS tempValues(val)
)
SELECT m.month, m.year, count(i.id)
FROM account i
    RIGHT JOIN month_year m
    ON extract(MONTH FROM i.created_at) = m.month AND extract(YEAR FROM i.created_at) = m.year
GROUP BY m.month, m.year
ORDER BY m.year ASC, m.month ASC;
$$;

CREATE OR REPLACE FUNCTION userQuantityStatisticInQuarters()
RETURNS TABLE (quarter integer, year integer, count bigint)
LANGUAGE sql STABLE
AS $$
WITH quarter_year AS (
    SELECT extract(QUARTER FROM CURRENT_DATE - (val * INTERVAL '3 month'))::integer AS quarter,
           extract(YEAR FROM CURRENT_DATE - (val * INTERVAL '3 month'))::integer AS year
    FROM (VALUES (0), (1), (2), (3)) AS tempValues(val)
)
SELECT m.quarter, m.year, count(i.id)
FROM account i
    RIGHT JOIN quarter_year m
    ON extract(QUARTER FROM i.created_at) = m.quarter AND extract(YEAR FROM i.created_at) = m.year
GROUP BY m.quarter, m.year
ORDER BY m.year ASC, m.quarter ASC;
$$;

CREATE OR REPLACE FUNCTION userQuantityStatisticInYears()
RETURNS TABLE (month integer, year integer, count bigint)
LANGUAGE sql STABLE
AS $$
WITH list_year AS (
    SELECT extract(YEAR FROM CURRENT_DATE - (val * INTERVAL '12 month'))::integer AS year
    FROM (VALUES (0), (1)) AS tempValues(val)
)
SELECT 0, m.year, count(i.id)
FROM account i
    RIGHT JOIN list_year m
    ON extract(YEAR FROM i.created_at) = m.year
GROUP BY m.year
ORDER BY m.year ASC;
$$;

-- Sau khi 6 ham da thay, khong con gi tao lai cac view nay. Xoa phan con sot lai.
DROP VIEW IF EXISTS month_year;
DROP VIEW IF EXISTS quarter_year;
DROP VIEW IF EXISTS list_year;
