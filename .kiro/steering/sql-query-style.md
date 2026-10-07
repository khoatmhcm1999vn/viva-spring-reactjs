---
inclusion: always
---

# PostgreSQL / Oracle SQL generation

Áp dụng khi tạo, sửa hoặc review SQL. Không truy cập database chỉ vì steering này được nạp. Mục tiêu: đúng nghiệp vụ, dễ đọc, dễ bảo trì; ưu tiên inner join kiểu cũ theo quy ước dự án. Không coi kiểu join là bảo đảm hiệu năng hoặc execution plan ổn định.

## 1. Xác định dialect và dữ liệu

- Dùng database/version đã biết trong context; không trộn PostgreSQL và Oracle trong một query. Nếu chưa biết, ghi rõ giả định; chỉ hỏi khi khác biệt dialect chặn việc viết đúng.
- Dùng schema, bảng, cột và khóa đã xác nhận. Tái sử dụng metadata hiện có; chỉ đọc metadata liên quan còn thiếu. Không đoán tên thật từ ví dụ dưới đây.
- Trước khi join/aggregate, xác định grain kết quả, khóa đơn/ghép, cardinality 1:1 hoặc 1:N, nullable keys, branch/tenant/currency và date scope nếu có.
- Dùng bind parameters cho giá trị runtime; không nối chuỗi từ input người dùng. PostgreSQL server-side prepared SQL dùng $1, $2; Oracle dùng :p_name. Nếu driver/framework có cú pháp riêng, theo đúng driver/framework đã xác định.

## 2. Inner join kiểu cũ — mặc định

- Viết bảng ngăn bằng dấu phẩy trong FROM; điều kiện liên kết nằm trong WHERE.
- Mỗi bảng một dòng; alias ngắn có nghĩa như acc, cust, ent. Qualify các cột bằng alias khi query nhiều bảng.
- Không dùng AS cho table alias để giữ convention dùng được với Oracle 19c. Có thể dùng AS cho column alias.
- Nhóm join predicates trước, business filters sau; comment nhóm khi query đủ dài để cần phân biệt. Không dùng WHERE 1 = 1 trong SQL tĩnh.
- Mỗi bảng bổ sung phải có quan hệ join hợp lệ, trừ tích Descartes có chủ đích được giải thích. Không chỉ đếm số predicate để kết luận đã đủ khóa join.
- Không trộn comma join và ANSI JOIN trong cùng query block. Nếu cần outer join phức tạp, dùng ANSI cho toàn block đó.
- Viết SQL keyword UPPERCASE; dùng indentation 4 spaces; mỗi selected column và predicate một dòng. Theo tên identifier thực tế, không tự thêm double quotes.

Ví dụ PostgreSQL — tên bảng chỉ minh họa:

```sql
SELECT
    acc.account_id,
    cust.customer_name,
    acc.currency_code,
    acc.balance
FROM banking.accounts acc,
     banking.customers cust
WHERE acc.customer_id = cust.customer_id
  AND acc.branch_code = cust.branch_code
  AND acc.status = $1
ORDER BY acc.account_id
LIMIT 20;
```

Ví dụ Oracle 12c+ — chỉ dùng tên/cột thực tế sau khi kiểm tra:

```sql
SELECT
    acc.account_id,
    cust.customer_name,
    acc.currency_code,
    acc.balance
FROM banking.accounts acc,
     banking.customers cust
WHERE acc.customer_id = cust.customer_id
  AND acc.branch_code = cust.branch_code
  AND acc.status = :p_status
ORDER BY acc.account_id
FETCH FIRST 20 ROWS ONLY;
```

ORDER BY phải có khóa phân biệt duy nhất trong tập kết quả nếu cần top-N lặp lại ổn định. account_id trong ví dụ chỉ đủ nếu đã xác nhận uniqueness; nếu không, bổ sung khóa cần thiết.

## 3. Outer join — bảo toàn ý nghĩa

- PostgreSQL: dùng LEFT/RIGHT/FULL JOIN ... ON; không sinh Oracle (+).
- Oracle legacy: dùng (+) cho outer join đơn giản khi giữ convention cũ; đặt (+) trên phía tùy chọn trong mọi join predicate liên quan. Không trộn (+) với ANSI JOIN cùng block.
- Oracle khuyến nghị ANSI outer join. Dùng ANSI khi logic phức tạp, cần FULL OUTER JOIN hoặc gặp hạn chế (+); giải thích ngắn ngoại lệ.
- Phân biệt điều kiện chọn bản ghi khớp với điều kiện lọc kết quả cuối; không di chuyển predicate giữa ON/WHERE máy móc.

Oracle legacy: giữ mọi account, chỉ ghép customer ACTIVE cùng branch:

```sql
SELECT
    acc.account_id,
    cust.customer_name
FROM banking.accounts acc,
     banking.customers cust
WHERE acc.customer_id = cust.customer_id(+)
  AND acc.branch_code = cust.branch_code(+)
  AND cust.status(+) = :p_customer_status;
```

PostgreSQL với cùng mục đích:

```sql
SELECT
    acc.account_id,
    cust.customer_name
FROM banking.accounts acc
LEFT JOIN banking.customers cust
    ON acc.customer_id = cust.customer_id
   AND acc.branch_code = cust.branch_code
   AND cust.status = $1;
```

## 4. Dễ bảo trì, đúng kết quả

- SELECT cột cần thiết; không SELECT * mặc định. Ngoại lệ: EXISTS (SELECT 1 ...), COUNT(*) có ý nghĩa riêng và được dùng bình thường.
- Không dùng DISTINCT để che join sai hoặc dữ liệu bị nhân. Với 1:N, xác định có cần nhiều dòng không; pre-aggregate phía N về đúng grain trước khi tính tổng phía 1.
- Dùng EXISTS/NOT EXISTS nếu chỉ cần kiểm tra có/không; tránh join để rồi DISTINCT. Với NOT IN, kiểm tra tác động NULL trước khi chọn.
- Dùng IS NULL/IS NOT NULL; không viết = NULL. Chỉ COALESCE/NVL khi nghiệp vụ xác nhận NULL tương đương giá trị thay thế; không mặc định balance NULL = 0.
- Giữ parentheses rõ ràng cho AND/OR; không tự đổi INNER thành OUTER hoặc thay UNION ALL bằng UNION.
- Dùng CTE/inline view khi tách bước nghiệp vụ giúp đọc dễ hơn; không thêm nhiều lớp không cần thiết hoặc mặc định CTE luôn nhanh hơn/materialized.
- Dùng numeric/decimal phù hợp cho tiền; không cộng các currency khác nhau. Không cộng snapshots balance qua nhiều as-of date như movement.
- Với khoảng thời gian, ưu tiên column >= from_value AND column < to_value_exclusive; bind đúng datatype và timezone theo nghiệp vụ. Không bọc indexed column trong TRUNC/DATE/cast chỉ để lọc ngày nếu có thể dùng range tương đương.
- Không dựa vào implicit conversion của số/ngày hoặc NLS. PostgreSQL DATE không có giờ; Oracle DATE có thành phần thời gian. Không giả định hai kiểu có cùng semantics.
- Không dùng hint/index rewrite theo cảm tính; chỉ tối ưu sau khi có bằng chứng phù hợp. Không tự chạy EXPLAIN ANALYZE vì nó thực thi statement.
- Oracle trước 12c: nếu cần top-N, sort trong inline view rồi lọc ROWNUM ngoài. Không đặt ROWNUM <= n trước ORDER BY rồi gọi đó là top-N đã sort.

## 5. Kiểm chứng và tiết kiệm credits

- Khi chỉ được yêu cầu viết/review query, không tự thực thi hoặc thay đổi dữ liệu.
- Trước khi giao: kiểm tra dialect/bind, tên cột, đủ khóa join, grain, NULL, outer-filter placement, duplicate rows và date bounds. Với query chuyển đổi, so sánh cả số lần xuất hiện của từng dòng, không chỉ tập DISTINCT hoặc row count.
- Khi được phép chạy: dùng scope nhỏ, dữ liệu mẫu gồm trường hợp khớp/không khớp, NULL, khóa ghép và 1:N; kiểm tra aggregate riêng. Mẫu mặc định tối đa 20 dòng, không cắt input cần tính aggregate.
- Nếu chỉ kiểm tra tĩnh hoặc trên engine khác, nói rõ; không tuyên bố đã chạy PostgreSQL/Oracle hoặc xác nhận execution plan.
- Không lặp metadata/tool call, quét mọi schema hoặc chạy health/index analysis ngoài nhiệm vụ. Dừng khi đủ bằng chứng.
- Trả query hoàn chỉnh và giải thích ngắn các giả định/ngoại lệ. Query thay đổi dữ liệu cần phạm vi, authorization và transaction plan theo quy trình dự án.

## Nguồn chính thức

Đối chiếu ngày 08/10/2026; áp dụng theo version đích, không mặc định môi trường đã được kiểm thử.

- PostgreSQL 18 — FROM, JOIN, ON/WHERE: https://www.postgresql.org/docs/18/queries-table-expressions.html
- PostgreSQL 18 — LIMIT và thứ tự: https://www.postgresql.org/docs/18/queries-limit.html
- Oracle 19c — joins và (+): https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Joins.html
- Oracle 19c — SELECT, row limiting: https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/SELECT.html
