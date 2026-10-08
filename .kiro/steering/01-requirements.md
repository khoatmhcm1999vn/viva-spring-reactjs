---
inclusion: manual
---

# Bước 01 — Chốt nghiệp vụ

Đọc product.md và domain-rules.md. Kiểm tra repo trước khi sửa. Tạo docs/requirements.md gồm personas, use cases, MVP/out-of-scope, acceptance criteria có mã REQ-xxx. Mỗi yêu cầu mô tả trigger và kết quả quan sát được. Ghi rõ pickup, pay-at-counter, một store seed nhưng schema hỗ trợ nhiều store.
Tạo docs/decisions.md với các lựa chọn đã chốt, câu hỏi còn mở và giả định. Không gán các quyết định thiết kế cho Highlands. Cập nhật sơ đồ order-lifecycle.drawio nếu policy đổi.
Acceptance bắt buộc: CUSTOMER đặt món tùy chỉnh; STAFF đúng store chuyển trạng thái; ADMIN quản lý menu; tiền do API tính; retry không trùng; lưu snapshot/history. Không thêm delivery/payment online chỉ vì sơ đồ có nhánh tương lai.
Kiểm tra: mỗi feature MVP có acceptance; các rule hủy/thu tiền/hoàn thành không mâu thuẫn. Bàn giao: yêu cầu + quyết định + checklist bước 1 trong progress. Chưa viết ứng dụng ở bước này.

## Kết thúc bước
Cập nhật docs/progress.md với bằng chứng; nêu bước tiếp theo, không tự đánh dấu bước khác hoàn thành.
