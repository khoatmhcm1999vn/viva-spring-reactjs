---
inclusion: manual
---

# Bước 08 — Tạo đơn an toàn

POST /v1/orders nhận quoteId và cart payload; header Idempotency-Key. Thực hiện toàn bộ invariants trong domain-rules. Normalize payload có schema version và canonical sort an toàn, tính hash server. Idempotency scoped user+key; replay trước kiểm tra quote expiry để request đã thành công luôn trả lại đơn cũ.
Trong transaction ngắn: claim unique key, validate/lock quote và catalog theo thứ tự ID ổn định, validate price/options/store, so sánh quote, insert order + snapshot items/modifiers + UNPAID payment + initial history + key mapping. Không gọi network trong transaction. Unique quote_id ở orders tránh một quote sinh hai đơn với hai keys. Retry cùng quote/order cùng nội dung có thể trả existing order; khác nội dung 409. Retry unique conflict sau rollback, không query trong transaction PostgreSQL đã aborted.
Order code unique dễ đọc; UUID internal. Không xóa cart trước response thành công; khi timeout retry cùng key/payload. New quote hoặc nội dung checkout mới dùng key mới. Error codes PRICE_CHANGED/QUOTE_EXPIRED/ITEM_UNAVAILABLE/IDEMPOTENCY_CONFLICT.
Kiểm tra integration với PostgreSQL: double-click, concurrent requests, timeout retry, cùng key khác payload, quote reuse, price change, rollback lỗi giữa item inserts. Chứng minh order/items/payment/history đều atomic và snapshots không đổi khi menu đổi.

## Kết thúc bước
Cập nhật docs/progress.md với bằng chứng; nêu bước tiếp theo, không tự đánh dấu bước khác hoàn thành.
