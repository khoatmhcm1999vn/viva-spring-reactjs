# Kiểm thử mục tiêu
Chưa có test nào chạy cho ứng dụng; bộ bàn giao hiện chỉ có tài liệu và diagram sources.

Cột REQ trỏ sang `docs/requirements.md` (tạo ở bước 01). Đây là map thiết kế, không phải bằng chứng đã chạy.

| ID | Test có giá trị | Tầng | REQ |
|---|---|---|---|
| T01 | price+modifiers × quantity, integer boundaries | unit | REQ-201, REQ-202, REQ-702 |
| T02 | min/max/membership/duplicate modifiers | unit+integration | REQ-203, REQ-204, REQ-602 |
| T03 | state graph, unpaid completion, cancel rules | unit+integration | REQ-401, REQ-402, REQ-404, REQ-407, REQ-504 |
| T04 | invalid/expired JWT, customer admin, cross-store and cross-owner | integration | REQ-002, REQ-003, REQ-004, REQ-502, REQ-600 |
| T05 | simultaneous same idempotency key→one committed order | PostgreSQL integration | REQ-304, REQ-300 |
| T06 | same key different hash, same quote different key | PostgreSQL integration | REQ-302, REQ-303, REQ-207 |
| T07 | injected failure after items→full rollback | PostgreSQL integration | REQ-305 |
| T08 | catalog edit preserves snapshots, stale/expired quote | PostgreSQL integration | REQ-306, REQ-206, REQ-307 |
| T09 | two staff CAS transition→one success, one conflict | PostgreSQL integration | REQ-403 |
| T10 | payment collection race→one paid record/audit | PostgreSQL integration | REQ-405, REQ-406 |
| T11 | customer + staff complete pickup across two browser contexts | Playwright | REQ-300, REQ-401, REQ-405, REQ-407, REQ-501 |
| T12 | mobile keyboard/loading/error, lost network retry | Playwright/manual | REQ-503, REQ-703, REQ-705 |
| T13 | restart containers preserves order and image | deployed smoke | REQ-701 |

Chưa có test chuyên biệt cho: REQ-005 (chặn ghi qua Data API), REQ-006 (không lưu raw token), REQ-100/REQ-101/REQ-102 (menu + availability theo store), REQ-205 (quote persisted), REQ-301 (thiếu Idempotency-Key), REQ-308 (thứ tự khóa), REQ-400 (hàng đợi theo store), REQ-408 (toggle availability), REQ-500, REQ-601, REQ-603, REQ-700, REQ-704. Bổ sung hoặc mở rộng T0x khi tới bước 10; khoảng trống này phải được nêu lại ở bước 10 thay vì bỏ im.

CI gates after bootstrap: lint, typecheck, build, unit; DB integration with isolated DB and migrations; Auth E2E only when configured. Report passed/failed/skipped separately. Test DB guard prevents accidental production reset.
