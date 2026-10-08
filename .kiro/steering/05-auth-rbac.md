---
inclusion: manual
---

# Bước 05 — Xác thực và quyền

Tích hợp Supabase Auth email/password, session refresh bằng SDK theo Next.js current docs; không dựng password table hay JWT issuer khác. Xác minh access token server-side với signature/issuer/audience/expiry; không chỉ decode JWT. FE API client attach bearer và xử lý 401 bằng refresh có giới hạn, không vòng lặp retry.
Map auth sub→profiles; provision profile CUSTOMER an toàn sau verify, unique ID, role không nhận từ request. Role changes chỉ admin flow, audit. Store assignment trong store_staff. Quyền domain kiểm tra ở service ngoài route guard để không bị bypass qua internal call.
Cho anonymous đọc catalog/health, protected quote/order/me, staff own-store, admin menu. Signup không cấp STAFF/ADMIN từ user_metadata. Server reads current role để đổi quyền có hiệu lực.
Kiểm tra thật và test: thiếu/expired/invalid token, CUSTOMER gọi admin, STAFF store A sửa store B, chủ đơn khác đọc/hủy. Thiết lập API/Storage không expose ghi business tables. Log redaction cho token, PII. Bàn giao auth flow, role matrix và progress.

## Kết thúc bước
Cập nhật docs/progress.md với bằng chứng; nêu bước tiếp theo, không tự đánh dấu bước khác hoàn thành.
