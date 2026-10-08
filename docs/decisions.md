# Quyết định ban đầu
| Quyết định | Lý do |
|---|---|
| Pickup + pay-at-counter MVP | Hoàn thành trọn luồng với scope cá nhân |
| Next.js + NestJS separate API | React frontend và API Node.js rõ ràng |
| Supabase Auth/Postgres/Storage | Dùng managed services, order logic vẫn thuộc NestJS |
| Prisma migrations | Có lịch sử schema tái lập |
| Polling | Đủ demo, không cần broker/realtime infrastructure |
| Persisted expiring quote | Phát hiện giá thay đổi, ràng buộc nội dung checkout |
| Snapshot + history + idempotency + CAS | Hóa đơn ổn định và chống race/retry |

Chưa chốt: phiên bản Node/Next/Nest/Prisma/pnpm, VM/domain, Supabase plan/region, image Storage policy, limits thực tế. Kiro kiểm tra ở bước tương ứng rồi ghi quyết định có bằng chứng. Không giả định model được người dùng gọi là “Claude Opus 5” có capability đặc thù; steering độc lập model.

---

## Quyết định chốt ở bước 01 (nghiệp vụ)

Các quyết định dưới đây là lựa chọn của dự án học tập này. Không gán cho bất kỳ doanh nghiệp hay chuỗi cà phê nào.

| # | Quyết định | Lý do | Ảnh hưởng |
|---|---|---|---|
| D01-01 | MVP chỉ `PICKUP` + `PAY_AT_COUNTER` | Đủ để chứng minh trọn luồng đặt → pha → bàn giao mà không cần tích hợp bên thứ ba | Không có API/UI delivery hay cổng thanh toán ở bản đầu |
| D01-02 | Một store được seed, nhưng mọi bảng/endpoint/quyền đều mang `store_id` | Tránh refactor khi mở nhiều store; cho phép test scope staff theo store ngay từ đầu | REQ-700; staff scope kiểm qua `store_staff` chứ không qua cờ global |
| D01-03 | Hạn quote 5 phút | Đủ cho khách hoàn tất checkout, đủ ngắn để giá không lệch lâu | REQ-205, REQ-206 |
| D01-04 | **Thu tiền chỉ cho phép ở `CONFIRMED`, `PREPARING`, `READY`** | `PLACED` chưa được thu tiền theo domain-rules nên hủy/từ chối không sinh hoàn tiền; terminal thì đã chốt sổ | REQ-405; loại bỏ hoàn toàn nhu cầu refund trong MVP |
| D01-05 | Khách chỉ hủy được khi đơn còn `PLACED` | Sau `CONFIRMED` nguyên liệu đã dùng; tránh tranh chấp mà MVP chưa có policy bồi thường | REQ-504 |
| D01-06 | Từ chối đơn bắt buộc có `reason`, lưu trong history | Khách cần biết lý do; audit được actor | REQ-404 |
| D01-07 | `COMPLETED` yêu cầu đồng thời `READY` và payment `PAID` | Không bàn giao hàng khi chưa thu tiền | REQ-407 |
| D01-08 | MVP mỗi modifier option có `quantity = 1`, option trùng bị từ chối | Giữ công thức giá đơn giản và kiểm được bằng unit test | REQ-203 |
| D01-09 | Giới hạn: quantity 1..20 mỗi dòng, tối đa 50 dòng | Chặn payload lạm dụng và tránh tràn integer VND | REQ-202 |
| D01-10 | Không gộp dòng khi khác size / khác tập modifier / khác note | Giữ đúng ý khách và giữ snapshot rõ ràng | REQ-204 |
| D01-11 | Vô hiệu hóa (`is_active = false`) thay cho xóa vật lý catalog | Giữ nguyên hóa đơn và history cũ | REQ-307, REQ-603 |
| D01-12 | Enum payment giữ đủ `UNPAID/PENDING/PAID/FAILED/REFUND_PENDING/REFUNDED` nhưng MVP chỉ dùng `UNPAID → PAID` | Không phải migrate enum khi thêm prepay | Không có endpoint nào tạo ra các giá trị còn lại ở MVP |
| D01-13 | Role chỉ đọc từ `profiles` trong DB; public signup luôn `CUSTOMER` | Auth metadata là user-editable, không tin được | REQ-001, REQ-003 |
| D01-14 | Polling 5–10 giây, dừng ở terminal, refetch khi focus | Đủ cho demo, không thêm hạ tầng realtime | REQ-503 |
| D01-15 | Giỏ hàng persist ở client chỉ là tiện lợi UI; giá luôn xác nhận lại bằng quote | Tránh client trở thành nguồn giá | REQ-200, REQ-705 |

Chính sách vòng đời đơn **không thay đổi** so với `docs/diagrams/order-lifecycle.*` nên các sơ đồ giữ nguyên ở bước 01.

## Câu hỏi còn mở (nghiệp vụ)

| # | Câu hỏi | Trạng thái |
|---|---|---|
| Q01-01 | Đơn `READY` mà khách không đến lấy thì xử lý thế nào? MVP để đơn nằm ở `READY`, chưa có trạng thái abandoned/expired. | Chưa chốt; nếu thêm thì phải bổ sung transition + lý do + test trước khi code |
| Q01-02 | Staff có được sửa số lượng/món của đơn `PLACED` theo yêu cầu khách tại quầy? MVP: **không**, khách phải hủy và đặt lại. | Tạm chốt là không; ghi lại nếu đổi |
| Q01-03 | Giờ mở/đóng cửa của store có chặn đặt đơn? MVP chỉ dùng `stores.is_active`, chưa có lịch hoạt động. | Chưa chốt |
| Q01-04 | Sinh `orders.code` theo định dạng nào (độ dài, charset, chống đoán)? | Chốt ở bước 04 cùng schema |
| Q01-05 | Một user vừa là `STAFF` ở store A vừa là `CUSTOMER` đặt đơn store A — có cho phép tự xử lý đơn của mình? | Chưa chốt; đề xuất chặn self-transition, cần test nếu bật |
| Q01-06 | Rate limit cụ thể cho quote/order (ngưỡng, cửa sổ) | Chốt ở bước 08 hoặc 11 với số đo thực tế |
| Q01-07 | Ảnh món lưu ở Storage với policy nào (public read hay signed URL)? | Chốt ở bước 06 |

## Giả định

- Mỗi đơn thuộc đúng một store; không có đơn trải nhiều store.
- Khách đặt cho chính mình; `recipient{name,phone}` là để gọi tên tại quầy, không phải đặt hộ có quyền riêng.
- Tiền VND luôn là số nguyên không âm và nằm trong phạm vi integer của PostgreSQL ở mọi tổng.
- Dữ liệu menu, giá và ảnh dùng trong demo là **dữ liệu giả**, không phải giá hay menu thật của doanh nghiệp nào.
- Thiết bị khách chủ yếu là mobile; staff dùng màn hình lớn hơn tại quầy.
- Môi trường dev có thể dùng Postgres trong Docker, nhưng Auth vẫn dùng Supabase dev project hoặc Supabase local đã cấu hình.
- `tools/check-no-vivacon.js` là script kiểm chứng việc dọn code của dự án trước trên nhánh này, không phải gate chất lượng của Coffee Order. Gate thật (lint/typecheck/build/test) được dựng từ bước 03 trở đi.

---

## Quyết định chốt ở bước 02 (giao diện)

Chi tiết wireframe ở `docs/wireframes.md`. Đây là quyết định thiết kế UI, chưa có component nào được viết.

| # | Quyết định | Lý do | Ảnh hưởng |
|---|---|---|---|
| D02-01 | Chi tiết món là **dialog / bottom sheet**, không phải trang riêng | Khách không mất vị trí scroll trong menu; đỡ một lần điều hướng | Cần bẫy focus + `Esc` + trả focus về nút đã mở |
| D02-02 | Xác nhận đơn và tracking là **cùng một màn** `/orders/[id]`, phân biệt bằng `?placed=1` | Sau khi đặt, khách cần ngay mã đơn và trạng thái; hai trang là thừa | Banner thành công tự ẩn sau 8s |
| D02-03 | Polling **7 giây** ở màn chi tiết đơn; dừng ở terminal; tạm dừng khi mất focus; **không** polling ở màn danh sách | Nằm trong khoảng 5–10s của rule, giảm tải mà vẫn đủ nhanh cho quầy | REQ-503 |
| D02-04 | Khối chọn Size **chỉ render khi product có ≥2 variant** | Không ép bánh/nước đóng chai phải có S/M/L; UI suy ra từ dữ liệu | Món một size hiện giá chính xác, menu không có chữ "từ" |
| D02-05 | Giỏ ghi nhãn **"Tạm tính"**; con số ràng buộc chỉ đến từ quote của API | Client không được là nguồn giá | REQ-200, REQ-705 |
| D02-06 | Staff board là **4 cột theo trạng thái** (`PLACED`/`CONFIRMED`/`PREPARING`/`READY`); đơn terminal rời bảng | Khớp đúng vòng đời, nhìn ra việc cần làm ngay | Mobile xếp thành 4 section dọc |
| D02-07 | Nút `[Thu tiền]` hiện từ `CONFIRMED` trở đi, **không** hiện ở `PLACED` | Theo D01-04; giữ đơn `PLACED` luôn chưa thu tiền | REQ-405 |
| D02-08 | `401` xảy ra **giữa một mutation** thì hiện dialog, **không** tự chuyển trang | Tránh mất form checkout và tránh khách tưởng đơn đã gửi | Giỏ và form được giữ nguyên |
| D02-09 | `requestId` chỉ hiện ở màn lỗi 5xx, dưới nhãn "Mã tham chiếu" | Khách cần đọc cho nhân viên khi báo lỗi, nhưng không nên thấy mã lỗi kỹ thuật | REQ-703 |
| D02-10 | Admin **không có nút Xoá**, chỉ có toggle "Hiển thị" | Khớp REQ-603/REQ-307: ẩn thay vì xoá để giữ đơn cũ | Có tooltip giải thích tại chỗ |
| D02-11 | Mockup là **HTML/CSS tĩnh, không JavaScript**, đặt ở `docs/mockups/`, không build/deploy | Xem được bố cục ngay bằng browser mà không kéo theo toolchain; không lẫn với code thật | Nút không bấm được; phải nói rõ đây không phải demo chức năng |
| D02-12 | Lý do từ chối = select lý do có sẵn + ô chi tiết, và **khách đọc được** | Nhanh cho quầy, minh bạch cho khách | REQ-404 |
| D02-13 | Toggle khả dụng ở **mức variant**, không phải mức product | `store_variants` được định nghĩa ở mức variant | Món một size chỉ có một toggle, không hiện nhãn size |
| D02-14 | Giỏ thuộc store khác store đang chọn → hỏi "giữ cửa hàng cũ" hay "xoá giỏ và đổi" | Một đơn chỉ thuộc một store; không tự xoá dữ liệu của khách | Banner ở màn giỏ |
| D02-15 | Mọi nút mutation `disabled` + đổi nhãn + `aria-busy` khi đang gửi | Giảm double-submit do bấm nhiều lần; **không** thay thế `Idempotency-Key` | REQ-301, REQ-302 |

## Câu hỏi còn mở (giao diện)

| # | Câu hỏi | Trạng thái |
|---|---|---|
| Q02-01 | Quầy dùng thiết bị gì để mở staff board (máy tính, tablet ngang)? Ảnh hưởng tới việc có cần tối ưu bố cục 4 cột cho tablet. | Chưa chốt; hiện thiết kế cho ≥1024px và fallback dọc |
| Q02-02 | Nút "Đặt lại đơn này" ở đơn `COMPLETED` — có làm trong MVP? Không nằm trong danh sách MVP của `product.md`. | **Tuỳ chọn, cắt được.** Nếu làm thì chỉ nạp lại giỏ, giá vẫn quote lại |
| Q02-03 | Staff có cần màn chi tiết đơn tối ưu cho mobile, hay chỉ cần card trên board? | Chưa chốt |
| Q02-04 | Validate số điện thoại ở mức nào (chỉ độ dài, hay theo đầu số VN)? | Chưa chốt; chốt cùng DTO ở bước 07/08 |
| Q02-05 | Ngưỡng badge "⚠ chờ lâu" trên card đơn (hiện đặt tạm 10 phút ở `READY`) | Chưa chốt; chỉ là gợi ý thị giác, không phải trạng thái mới. Liên quan Q01-01 |
| Q02-06 | Upload ảnh món: dialog trong trang hay trang riêng, và dùng public read hay signed URL | Chưa chốt; phụ thuộc Q01-07, chốt ở bước 06 |
| Q02-07 | Bộ icon và font: dùng lucide + font hệ thống, hay thêm font Việt riêng? | Chưa chốt; chốt ở bước 03 khi cài Tailwind/shadcn |
