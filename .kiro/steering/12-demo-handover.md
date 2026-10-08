---
inclusion: manual
---

# Bước 12 — Bàn giao và trình bày

Hoàn thiện README runnable: prerequisites/versions, install/env/migrate/seed/start/test/build/deploy và known limitations đúng thực trạng. Ghi demo users theo cách lấy từ secret manager/dev setup, không public mật khẩu. Link ERD/architecture/lifecycle .drawio và Mermaid; đảm bảo diagrams đồng bộ schema thực tế.
Tạo docs/demo-script.md 5–7 phút: giới thiệu MVP, architecture; admin tạo category/món; customer đặt pickup; staff confirm/prepare/ready/thu tiền/complete; customer tracking; giải thích snapshot/history/idempotency; demo một lỗi bị chặn. Có dữ liệu giả và reset demo an toàn chỉ trên demo DB.
Tạo docs/handover.md map REQ→implementation→test, URL môi trường nếu có, hạn chế, vận hành, bước mở rộng delivery/payment/refund. Nêu Supabase Auth là dịch vụ ngoài nhưng nghiệp vụ order/API do dự án xây.
Kiểm tra clean checkout theo README, fresh DB migrations+seed, frozen lockfile, tests/build và full flow deployed. Nếu chỉ tạo tài liệu chưa build app, ghi rõ chưa có ứng dụng chạy. Không đổi task checklist sang done chỉ vì có tài liệu hoặc hình.
Bàn giao báo cáo kết quả thật, file/URL, rủi ro còn lại và progress bước 12.

## Kết thúc bước
Cập nhật docs/progress.md với bằng chứng; nêu bước tiếp theo, không tự đánh dấu bước khác hoàn thành.
