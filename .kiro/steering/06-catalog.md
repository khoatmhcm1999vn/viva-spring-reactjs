---
inclusion: manual
---

# Bước 06 — Quản lý danh mục và món

Tạo module catalog, stores và media cần thiết; REST /v1/categories, /v1/products?storeId=&categoryId=&q=&page=&limit=, /v1/products/:id?storeId=. Response có variants/modifier rules/availability, integer VND. Admin CRUD category/product/variant/modifier; staff chỉ bật tắt availability ở assigned store. Limit pagination, allowlist sort, validate IDs.
Upload ảnh bằng server hoặc signed upload chỉ cho admin, kiểm tra mime thực tế/size, object path không trùng và không chứa PII; không dùng service role browser. Lưu object path; define public read cho ảnh menu hoặc signed URL policy. Không lưu ảnh container filesystem.
Món có ít nhất một variant; size default cho bánh; category có thể deactivate. Giữ giao dịch catalog nhất quán và phối hợp khóa với checkout để chống giá đổi giữa kiểm tra và lưu đơn. Soft deactivate thay xóa reference đang có trong order.
Kiểm tra: tạo/sửa/ẩn món, modifier membership/min/max, duplicate slug/SKU, giá âm, pagination, ảnh lỗi. UI khách thấy thay đổi sau invalidate query; catalog cache không làm checkout tin giá cũ. Ghi API contract và progress.

## Kết thúc bước
Cập nhật docs/progress.md với bằng chứng; nêu bước tiếp theo, không tự đánh dấu bước khác hoàn thành.
