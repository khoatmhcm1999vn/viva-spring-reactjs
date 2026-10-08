---
inclusion: manual
---

# Bước 10 — Kiểm thử theo rủi ro

Đọc docs/test-plan.md và map test→REQ. Unit: pricing integer, modifier rules, transition policy, canonical payload. Integration: PostgreSQL thật riêng cho test, migrations, transaction rollback, unique idempotency, quote race, CAS status/payment và quyền theo store. Mocks chỉ dùng ở boundary ngoài DB; tests transaction không thay bằng mock Prisma.
E2E Playwright: customer login→menu→config→cart→quote→order; staff login ở context khác→confirm→prepare→ready→paid→complete; khách thấy timeline. Có case cancel/reject, PRICE_CHANGED và 401. Auth E2E dùng test project/users hoặc local Supabase, không ghi credentials vào repo.
Chạy lint/typecheck/build, tests có giá trị, kiểm tra mobile/keyboard/loading/error. Không thêm test chỉ assert implementation detail. CI không có credential phải báo skip rõ, không đánh dấu integration/E2E pass.
Security regression: sửa role request, sửa price, đọc đơn khác, modifier invalid, CORS, log secrets, service key browser bundle. Checklist restart data persistence thuộc bước deploy.
Bàn giao: lệnh tái lập, summary pass/fail/skip, bug còn lại và progress. Chưa sửa lỗi nghiêm trọng thì không đánh dấu MVP sẵn sàng.

## Kết thúc bước
Cập nhật docs/progress.md với bằng chứng; nêu bước tiếp theo, không tự đánh dấu bước khác hoàn thành.
