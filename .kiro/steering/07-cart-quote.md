---
inclusion: manual
---

# Bước 07 — Giỏ hàng và báo giá

Zustand persist lưu ID, size, sorted modifier IDs, quantity, normalized note, schemaVersion; không lưu token hay PII trong cart. Cart key gồm variant + modifiers + note, khác cấu hình không gộp; có migration hoặc reset cart an toàn khi format đổi. Rehydrate có loading, tránh hydration mismatch.
API POST /v1/checkout/quote nhận storeId, PICKUP, PAY_AT_COUNTER, items, recipient. Validate theo domain; lấy giá server, lưu checkout_quotes với user/store/request_hash/price_snapshot/expires_at và trả quoteId, totals, expiresAt. Giới hạn request, note length và quantities. MVP một cart chỉ thuộc một store; đổi store phải xác nhận bỏ cart hoặc revalidate toàn bộ.
Quote không giữ tồn kho và không bảo đảm availability tới lúc đặt. FE hiển thị breakdown, disable submit khi hết hạn hoặc cart đổi; payload gửi order phải khớp quote. Đổi cart phải quote mới. API lỗi chuẩn code/message/details/requestId.
Kiểm tra cùng món khác note/topping, persisted cart version cũ, món inactive, option không thuộc món, quote expiry, server totals. Ghi contracts có ví dụ và progress bước 7.

## Kết thúc bước
Cập nhật docs/progress.md với bằng chứng; nêu bước tiếp theo, không tự đánh dấu bước khác hoàn thành.
