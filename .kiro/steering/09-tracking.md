---
inclusion: manual
---

# Bước 09 — Xử lý đơn và tracking

GET /v1/me/orders phân trang; GET /v1/orders/:id và /history chỉ chủ đơn, staff đúng store hoặc admin. GET /v1/staff/orders filter trạng thái có scope server, không tin storeId từ client. POST /v1/staff/orders/:id/transitions nhận toStatus, expectedVersion, reason; cancel endpoint riêng cho customer.
CAS update theo id/status/version; history trong cùng transaction. Initial history from_status=null. REJECTED có lý do; CANCELLED chỉ chủ đơn từ PLACED. Payment endpoint /v1/staff/orders/:id/payments dùng payment expectedVersion, kiểm tra READY, PAY_AT_COUNTER và UNPAID; ghi PAID + collected_by/paid_at cùng transaction. COMPLETED yêu cầu READY+PAID. Không dùng PATCH arbitrary order fields.
TanStack Query polling 5–10 giây khi visible, refetch focus, dừng terminal; no-store/private cho chi tiết và list đơn. Sau mutation invalidate đúng query. UI dùng timestamps server, không tự giả lập tiến trình hoàn thành.
Kiểm tra transition sai trả 409, store scope, hai staff đua cập nhật, thu tiền lặp, unpaid completion, history order, terminal polling. Delivery/WebSocket chưa bật. Ghi contract, lifecycle diagram và progress.

## Kết thúc bước
Cập nhật docs/progress.md với bằng chứng; nêu bước tiếp theo, không tự đánh dấu bước khác hoàn thành.
