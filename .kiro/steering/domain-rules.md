---
inclusion: always
---

# Invariants áp dụng mọi bước
## Trạng thái
Pickup: PLACED → CONFIRMED → PREPARING → READY → COMPLETED.
PLACED → CANCELLED bởi chủ đơn; PLACED → REJECTED bởi staff đúng store hoặc admin, phải có lý do. Terminal: COMPLETED/CANCELLED/REJECTED. Không cập nhật lùi hoặc bỏ bước. Khách không tự hủy sau CONFIRMED trong MVP.
Delivery tương lai: READY → OUT_FOR_DELIVERY → COMPLETED. Khi bật delivery phải bổ sung chính sách giao thất bại/hoàn tiền và tests trước.
Payment tách riêng: UNPAID/PENDING/PAID/FAILED/REFUND_PENDING/REFUNDED. MVP chỉ PAY_AT_COUNTER, một payment record UNPAID; thu tiền thành PAID bởi staff/admin, có actor/time. COMPLETED chỉ khi READY và PAID. Không hoàn thành đơn chưa thu tiền. PLACED chưa được thu tiền trong MVP nên hủy/từ chối không phát sinh hoàn tiền. Khi hỗ trợ prepay, bổ sung policy bồi hoàn riêng.

## Đơn và giá
Client chỉ gửi ID, quantity, modifier IDs, ghi chú và dữ liệu nhận hàng; không gửi giá làm nguồn chuẩn. Backend xác thực store hoạt động, món/variant/store availability, modifier membership và min/max. Tùy chọn trùng bị từ chối; MVP mỗi option có quantity=1. Quy tắc modifier áp dụng theo product cho mọi size.
line_total = (variant_price + sum(modifier_extra_price)) * quantity. MVP shipping=discount=0, total=subtotal. Validate integer, quantity 1..20 mỗi dòng, tối đa 50 dòng; kiểm tra giới hạn tiền hợp lệ cho PostgreSQL integer. Size khác hoặc tập modifiers/note khác không gộp dòng.
Lưu snapshot tên món, size, giá, tùy chọn và thông tin người nhận/cửa hàng. Đổi menu không đổi hóa đơn cũ. FK sản phẩm không cascade-delete đơn; dùng is_active, hạn chế xóa vật lý.

## Quote và đồng thời
Quote được lưu server: user/store, normalized request hash, price snapshot, expires_at (đề xuất 5 phút). Tạo đơn nhận quoteId và cùng cart payload. Nếu expired hoặc giá/availability/options đổi, trả QUOTE_EXPIRED/PRICE_CHANGED/ITEM_UNAVAILABLE và yêu cầu xác nhận quote mới. Kiểm tra/khóa các dòng catalog cần thiết trong transaction ngắn theo thứ tự ID cố định; thay đổi catalog đồng thời phải tuân thủ cùng thứ tự khóa. Giá đơn lấy từ DB tại checkout hợp lệ.
POST /orders bắt buộc Idempotency-Key. Unique(user_id,key), hash nội dung yêu cầu đã normalize. Retry key+hash trả cùng order; khác hash trả 409. Cạnh tranh insert unique phải được xử lý sau rollback bằng đọc kết quả đã commit (retry hữu hạn nếu cần). Ghi idempotency mapping, order, items, modifiers, payment và initial history trong cùng transaction. Không lưu raw access token vào DB/log.
Mỗi lần chuyển trạng thái kiểm tra role/store, trạng thái cũ và version; CAS update theo id/status/version rồi history cùng transaction. Thất bại trả 409. Thu tiền cũng phải có concurrency guard và audit actor/time để không ghi thu tiền hai lần.

## Quyền và truy cập
Role do server quản lý trong profiles; không tin user-editable auth metadata. Mọi public signup mặc định CUSTOMER. STAFF chỉ được store_staff gán; ADMIN quản lý toàn hệ thống. Chủ đơn xem/hủy đơn mình; order code không phải secret cấp quyền. Forbidden resource không trả PII.
Không ghi trực tiếp đơn/payment/status từ browser qua Supabase Data API. Business tables đặt trong schema không expose hoặc tắt Data API nếu không dùng; nếu expose phải cấu hình RLS/policies. Prisma role chỉ backend, không kỳ vọng RLS tự bảo vệ khi role bypass RLS; authorization vẫn bắt buộc ở service.
