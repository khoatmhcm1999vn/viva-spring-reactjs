---
inclusion: manual
---

# Bước 04 — Schema, migration và seed

Đọc docs/data-model.md và erd.drawio. Tạo Prisma schema theo model, enums, FK, unique, checks/indexes. Dùng SQL migration bổ sung constraint Prisma chưa biểu diễn. Bao gồm checkout_quotes vì bước 8 dùng quote persisted; không dùng quote giả unsigned từ browser.
Migration là nguồn triển khai; không dùng db push thay lịch sử migration production. Dev migrate dev; production migrate deploy sau kiểm tra. Không chạy reset/seed xóa dữ liệu trên shared/production DB. Có separate dev/test DB và môi trường guard.
Seed idempotent theo natural key/slug/SKU: một store, 4 category, 10–15 món giả, variants và modifier groups. Profiles của staff/admin phải dựa trên Supabase Auth user thật tạo qua quy trình server; seed không ghi password/token vào Git.
FK catalog RESTRICT; snapshots giữ hóa đơn; indexes theo user/date, store/status/date, history. Unique composite store_variants, store_staff, product_modifier_groups và idempotency user/key. Update ERD nếu schema đổi.
Kiểm tra migrate trên DB trống, rerun seed không nhân bản, FK/check/unique hoạt động, rollback transaction bằng integration test. Schema validate/generate và readiness DB. Chưa có DB thì chỉ ghi những check đã chạy, không đánh dấu bước xong.

## Kết thúc bước
Cập nhật docs/progress.md với bằng chứng; nêu bước tiếp theo, không tự đánh dấu bước khác hoàn thành.
