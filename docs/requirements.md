# Yêu cầu nghiệp vụ — Coffee Order (MVP)

Tài liệu này là bản chốt nghiệp vụ của bước 01. Đây là đặc tả, **chưa phải chức năng đã chạy**: ở thời điểm viết, repository chưa có app code, migration hay test nào được thực thi.

Nguồn nghiệp vụ: `.kiro/steering/product.md` và `.kiro/steering/domain-rules.md`. Mô hình đặt món tại quầy tham khảo cách vận hành chuỗi cà phê phổ biến tại Việt Nam được công bố công khai; thương hiệu dùng trong sản phẩm là **Coffee Order** với dữ liệu giả. Các quyết định thiết kế trong tài liệu này là lựa chọn của dự án học tập này, **không thuộc và không đại diện cho bất kỳ doanh nghiệp nào**.

Quy ước: tên code/enum bằng tiếng Anh; tiền là integer VND; thời gian lưu `timestamptz`/ISO 8601, hiển thị theo `Asia/Ho_Chi_Minh`.

---

## 1. Bối cảnh và giới hạn đã chốt

| Khía cạnh | Chốt cho MVP |
|---|---|
| Hình thức nhận hàng | Chỉ `PICKUP` (khách tự đến quầy lấy). Không có delivery. |
| Thanh toán | Chỉ `PAY_AT_COUNTER`. Không cổng thanh toán online, không prepay. |
| Cửa hàng | **Một store được seed**, nhưng mọi bảng/API/quyền đều mang `store_id` để hỗ trợ nhiều store về sau. Không hardcode store duy nhất. |
| Nguồn tính tiền | Backend. Client chỉ gửi ID/quantity/option/note. |
| Realtime | Polling 5–10 giây, dừng ở terminal state. Không WebSocket/broker. |
| Xác thực | Supabase Auth; role do server quản lý trong `profiles`. |

### Vòng đời đơn (pickup)
`PLACED → CONFIRMED → PREPARING → READY → COMPLETED`
Nhánh kết thúc sớm: `PLACED → CANCELLED` (chủ đơn), `PLACED → REJECTED` (staff đúng store hoặc admin, bắt buộc có lý do).
Terminal: `COMPLETED`, `CANCELLED`, `REJECTED`.

### Vòng đời thanh toán (tách khỏi order status)
Enum đầy đủ: `UNPAID/PENDING/PAID/FAILED/REFUND_PENDING/REFUNDED`.
MVP chỉ dùng `UNPAID → PAID`. `PENDING/FAILED/REFUND_*` là chỗ dành cho prepay tương lai, không có API nào tạo ra chúng ở bản này.

---

## 2. Personas

| Persona | Mô tả | Cách có quyền |
|---|---|---|
| `VISITOR` | Khách chưa đăng nhập. Xem menu, không đặt được món. | Không cần tài khoản |
| `CUSTOMER` | Khách đã đăng nhập, đặt món cho chính mình, theo dõi đơn của mình. | Mặc định cho mọi public signup |
| `STAFF` | Nhân viên quầy của **một hoặc nhiều store được gán**. Xử lý đơn và thu tiền trong store được gán. | Chỉ qua bản ghi `store_staff` do admin tạo |
| `ADMIN` | Quản trị toàn hệ thống: danh mục, món, variant, modifier, gán staff, xem mọi đơn. | Do admin/seed cấp, không qua signup |

Không có persona nào tự nâng quyền. Auth metadata do user sửa được **không** được dùng để phân quyền.

---

## 3. Use cases

| ID | Use case | Actor chính |
|---|---|---|
| UC-01 | Xem menu theo store, thấy món hết hàng bị khóa chọn | VISITOR, CUSTOMER |
| UC-02 | Đăng ký / đăng nhập / đăng xuất | VISITOR, CUSTOMER |
| UC-03 | Thêm món vào giỏ với size và modifier | CUSTOMER |
| UC-04 | Lấy báo giá (quote) từ API trước khi đặt | CUSTOMER |
| UC-05 | Đặt đơn pickup, trả tại quầy | CUSTOMER |
| UC-06 | Theo dõi trạng thái đơn và timeline | CUSTOMER |
| UC-07 | Hủy đơn khi còn `PLACED` | CUSTOMER |
| UC-08 | Xem hàng đợi đơn của store được gán | STAFF |
| UC-09 | Xác nhận / từ chối đơn, chuyển pha chế, báo sẵn sàng, bàn giao | STAFF |
| UC-10 | Thu tiền tại quầy và ghi nhận `PAID` | STAFF |
| UC-11 | Bật/tắt món (variant) tại store | STAFF, ADMIN |
| UC-12 | Quản lý category / product / variant / modifier | ADMIN |
| UC-13 | Gán staff vào store | ADMIN |

---

## 4. Phạm vi

### Trong MVP
Đăng nhập Supabase Auth; 3 role; một store seed có `store_id`; category, product, variant theo size, modifier group/option; xem menu; giỏ hàng; quote lưu server có hạn; đặt đơn pickup trả tại quầy với `Idempotency-Key`; staff xác nhận/pha chế/sẵn sàng/bàn giao/từ chối; thu tiền tại quầy; lịch sử đơn và timeline cho chủ đơn; bật/tắt món tại store.

### Ngoài MVP (không triển khai ở bản này)
Delivery và `OUT_FOR_DELIVERY`; cổng thanh toán online/sandbox và webhook; hoàn tiền; voucher/khuyến mãi; điểm thưởng; tồn nguyên liệu; WebSocket/realtime push; nhiều store vận hành thật; đặt hộ người khác; đặt theo giờ hẹn; đánh giá món; thông báo email/SMS/push.

`OUT_FOR_DELIVERY` chỉ tồn tại như nhánh thiết kế tương lai trong `docs/diagrams/order-lifecycle.*`. Bản MVP **không** có API hay UI delivery. Khi bật delivery phải bổ sung chính sách giao thất bại/hoàn tiền và test trước.

---

## 5. Acceptance criteria

Mỗi yêu cầu có **Trigger** (điều kiện/hành động khởi phát) và **Kết quả** (kết quả quan sát được: HTTP status, dữ liệu trả về, trạng thái DB hoặc giao diện). Mã lỗi theo `docs/api-contract.md`.

### 5.1 Xác thực và phân quyền

**REQ-001 — Public signup luôn là CUSTOMER**
Trigger: người dùng mới đăng ký qua Supabase Auth rồi gọi `GET /v1/me`.
Kết quả: tồn tại `profiles` với `id = sub` của token, `role = CUSTOMER`, `is_active = true`. Response `role` là `CUSTOMER` bất kể auth metadata client gửi kèm.

**REQ-002 — Token không hợp lệ bị từ chối**
Trigger: gọi endpoint cần auth với token thiếu/sai chữ ký/hết hạn/sai issuer hoặc audience.
Kết quả: `401 UNAUTHENTICATED`. Không có thay đổi dữ liệu. Response không chứa token, SQL hay stack trace.

**REQ-003 — Role lấy từ DB, không từ client**
Trigger: `CUSTOMER` gửi request tới endpoint `/v1/admin/*` kèm claim/metadata tự khai `role=ADMIN`.
Kết quả: `403 FORBIDDEN` (hoặc `404 NOT_FOUND` khi cần che tồn tại resource). Không thực thi nghiệp vụ admin.

**REQ-004 — STAFF chỉ thao tác store được gán**
Trigger: `STAFF` của store A gọi endpoint staff trên đơn thuộc store B.
Kết quả: từ chối (`403`/`404` theo chính sách), không trả PII của đơn store B, trạng thái đơn không đổi, không có bản ghi history mới.

**REQ-005 — Không ghi nghiệp vụ trực tiếp từ browser**
Trigger: client cố ghi `orders`/`payments`/`order_status_history` qua Data API của Supabase bằng access token người dùng.
Kết quả: thao tác thất bại. Bảng nghiệp vụ không expose qua Data API (hoặc bị chặn bởi policy). Mọi thay đổi đơn chỉ đi qua API NestJS. Authorization được kiểm ở service, không dựa vào RLS vì Prisma role có thể bypass RLS.

**REQ-006 — Không lưu raw access token**
Trigger: hoàn tất một luồng đặt đơn và đọc log/DB.
Kết quả: không có raw access token trong bảng nào hoặc trong log. Chỉ lưu `user_id` đã map từ `sub`.

### 5.2 Menu và catalog (khách)

**REQ-100 — Menu theo store**
Trigger: `GET /v1/products?storeId=<id>` cho store đang `is_active`.
Kết quả: `200` với danh sách `{items,page,limit,total}`; chỉ chứa category/product/variant `is_active`; mỗi variant có cờ khả dụng tính theo `store_variants` của đúng store đó.

**REQ-101 — Món bị tắt tại store không đặt được**
Trigger: admin/staff tắt `store_variants.is_available`, khách đang mở trang vẫn bấm thêm vào giỏ rồi quote/đặt.
Kết quả: UI đánh dấu hết hàng và chặn chọn sau khi refetch; nếu request vẫn tới API thì trả `409 ITEM_UNAVAILABLE`. Không tạo quote/đơn.

**REQ-102 — Store không hoạt động**
Trigger: quote hoặc order tới store có `is_active = false`.
Kết quả: từ chối với lỗi validation/`409` tương ứng. Không tạo quote/đơn.

### 5.3 Giỏ hàng và báo giá

**REQ-200 — Client không gửi giá**
Trigger: client gửi quote request kèm trường giá/tổng tiền tự tính.
Kết quả: trường lạ bị `ValidationPipe` whitelist + `forbidNonWhitelisted` chặn (`400 VALIDATION_ERROR`), hoặc bị bỏ qua hoàn toàn. Giá trong quote lấy từ DB.

**REQ-201 — Công thức giá**
Trigger: quote một dòng gồm variant + các modifier option, quantity n.
Kết quả: `unit_price = variant_price + Σ modifier_extra_price`; `line_total = unit_price * n`; `subtotal = Σ line_total`; `shippingFeeVnd = 0`; `discountVnd = 0`; `total = subtotal`. Mọi số là integer VND ≥ 0.

**REQ-202 — Giới hạn giỏ**
Trigger: quote/order có `quantity < 1`, `quantity > 20`, số dòng > 50, hoặc tổng tiền vượt giới hạn integer PostgreSQL.
Kết quả: `400 VALIDATION_ERROR` nêu rõ field vi phạm. Không tạo quote/đơn.

**REQ-203 — Luật modifier**
Trigger: quote có option không thuộc group được gán cho product, hoặc số option chọn ngoài `min_select..max_select`, hoặc option trùng trong cùng dòng.
Kết quả: `400 VALIDATION_ERROR` (hoặc `409 ITEM_UNAVAILABLE` nếu option bị tắt). Luật modifier áp theo product nên giống nhau cho mọi size. MVP mỗi option có `quantity = 1`.

**REQ-204 — Không gộp dòng khác cấu hình**
Trigger: thêm cùng product nhưng khác size, khác tập modifier, hoặc khác note.
Kết quả: giỏ và quote giữ các dòng riêng biệt, mỗi dòng có `line_total` riêng.

**REQ-205 — Quote được lưu server và có hạn**
Trigger: `POST /v1/checkout/quote` hợp lệ.
Kết quả: `200` với `{quoteId, expiresAt, items, subtotalVnd, shippingFeeVnd, discountVnd, totalVnd}`. DB có bản ghi `checkout_quotes` gắn `user_id`, `store_id`, `request_hash` đã normalize, `price_snapshot`, `expires_at` = thời điểm tạo + 5 phút.

**REQ-206 — Quote hết hạn hoặc lệch giá**
Trigger: đặt đơn với `quoteId` đã quá `expires_at`; hoặc giá/khả dụng/option thay đổi so với snapshot.
Kết quả: `410 QUOTE_EXPIRED`, hoặc `409 PRICE_CHANGED`, hoặc `409 ITEM_UNAVAILABLE`. Không tạo đơn. UI yêu cầu khách xác nhận lại quote mới trước khi đặt.

**REQ-207 — Quote không dùng lại**
Trigger: dùng lại một `quoteId` đã tạo đơn thành công, với `Idempotency-Key` khác.
Kết quả: `409 QUOTE_ALREADY_USED`. Không tạo đơn thứ hai. `orders.quote_id` là UNIQUE.

### 5.4 Đặt đơn

**REQ-300 — Đặt đơn pickup trả tại quầy**
Trigger: `CUSTOMER` gọi `POST /v1/orders` với `quoteId`, cùng cart payload, `fulfillmentType = PICKUP`, `paymentMethod = PAY_AT_COUNTER`, `recipient{name,phone}` và header `Idempotency-Key`.
Kết quả: `201` với `{id, code, status: "PLACED", version, payment, items, totals, createdAt}`. Trong cùng một transaction đã commit: `orders`, `order_items`, `order_item_modifiers`, một `payments` `method=PAY_AT_COUNTER`/`status=UNPAID`/`amount_vnd = total`, bản ghi `order_status_history` đầu tiên (`from_status = null`, `to_status = PLACED`), và mapping `idempotency_keys`.

**REQ-301 — Idempotency-Key bắt buộc**
Trigger: `POST /v1/orders` không có header `Idempotency-Key`.
Kết quả: `400 VALIDATION_ERROR`. Không tạo đơn.

**REQ-302 — Retry cùng key và cùng nội dung**
Trigger: gửi lại đúng request đã thành công (cùng user, cùng key, cùng canonical hash).
Kết quả: `200` trả về **đúng order cũ** (cùng `id`, cùng `code`). Số đơn trong DB không tăng. Replay vẫn phải qua xác thực/authorization.

**REQ-303 — Cùng key khác nội dung**
Trigger: cùng user + cùng `Idempotency-Key` nhưng canonical hash khác.
Kết quả: `409 IDEMPOTENCY_CONFLICT`. Không tạo đơn mới, không sửa đơn cũ.

**REQ-304 — Hai request đồng thời cùng key**
Trigger: hai request song song cùng user + cùng key + cùng hash.
Kết quả: đúng **một** order được commit; request còn lại trả về cùng order đó (`200`) sau khi rollback và đọc bản ghi đã commit (retry hữu hạn nếu cần). Không có đơn trùng, không có `500` để lộ lỗi unique violation.

**REQ-305 — Rollback toàn phần khi lỗi giữa transaction**
Trigger: lỗi được inject sau khi insert `order_items` nhưng trước khi commit.
Kết quả: không tồn tại order, item, modifier, payment hay history mồ côi. Mapping idempotency không trỏ tới order không commit.

**REQ-306 — Snapshot hóa đơn**
Trigger: tạo đơn xong, admin đổi tên/giá/size của món và tắt option.
Kết quả: đơn cũ giữ nguyên `product_name_snapshot`, `size_snapshot`, `base_price_vnd`, `unit_price_vnd`, `line_total_vnd`, snapshot tên group/option và `extra_price_vnd`, cùng `store_name`/`address_snapshot` và thông tin người nhận. Tổng tiền đơn cũ không đổi.

**REQ-307 — Không cascade-delete lịch sử**
Trigger: cố xóa category/product/variant/option đang được đơn tham chiếu.
Kết quả: bị chặn bởi RESTRICT/NO ACTION. Cách hợp lệ là đặt `is_active = false`. Đơn và history vẫn còn đủ.

**REQ-308 — Lỗi khóa đồng thời khi checkout**
Trigger: hai luồng checkout cùng lúc trên các dòng catalog chồng nhau, và một luồng sửa catalog song song.
Kết quả: không deadlock. Mọi luồng khóa các dòng catalog cần thiết theo cùng một thứ tự ID cố định trong transaction ngắn; không gọi Storage hay cổng thanh toán bên trong transaction.

### 5.5 Xử lý đơn và thanh toán (staff/admin)

**REQ-400 — Hàng đợi theo store**
Trigger: `STAFF` gọi `GET /v1/staff/orders`.
Kết quả: `200` chỉ chứa đơn của store được gán qua `store_staff`, sắp xếp được theo trạng thái/thời gian. `ADMIN` thấy được đơn của mọi store.

**REQ-401 — Chuyển trạng thái tiến dần**
Trigger: `POST /v1/staff/orders/:id/transitions` với `toStatus` kế tiếp hợp lệ và `expectedVersion` đúng.
Kết quả: `200` với `status` mới và `version` tăng; thêm một dòng `order_status_history` ghi `from_status`, `to_status`, `actor_id`, `created_at` trong cùng transaction.

**REQ-402 — Chặn chuyển trạng thái sai**
Trigger: nhảy bước (`PLACED → READY`), lùi (`PREPARING → CONFIRMED`), hoặc chuyển từ trạng thái terminal.
Kết quả: `409 INVALID_TRANSITION`. Trạng thái và version không đổi, không có history mới.

**REQ-403 — CAS chống đua giữa hai staff**
Trigger: hai staff cùng store gửi cùng transition với cùng `expectedVersion`.
Kết quả: đúng một request `200`; request còn lại `409 VERSION_CONFLICT`. Chỉ một dòng history được thêm. Update dùng CAS theo `id + status + version`.

**REQ-404 — Từ chối đơn phải có lý do**
Trigger: staff đúng store hoặc admin gọi transition `PLACED → REJECTED`.
Kết quả: thiếu `reason` thì `400 VALIDATION_ERROR`; có `reason` thì `200`, trạng thái `REJECTED`, history lưu `reason` và `actor_id`. Không phát sinh hoàn tiền vì đơn `PLACED` chưa được thu tiền.

**REQ-405 — Thu tiền tại quầy**
Trigger: staff đúng store hoặc admin gọi `POST /v1/staff/orders/:id/payments` cho đơn `PAY_AT_COUNTER` ở trạng thái `CONFIRMED`, `PREPARING` hoặc `READY`, kèm expected payment version.
Kết quả: `200`; `payments.status = PAID`, `collected_by = actor`, `paid_at` được ghi, `version` tăng. Không thu tiền khi đơn còn `PLACED` hoặc đã terminal.

**REQ-406 — Không thu tiền hai lần**
Trigger: hai request thu tiền đồng thời, hoặc thu tiền lại trên payment đã `PAID`.
Kết quả: đúng một lần chuyển sang `PAID` với một `collected_by`/`paid_at`; request còn lại `409 VERSION_CONFLICT` hoặc `409 INVALID_TRANSITION`. `amount_vnd` không đổi.

**REQ-407 — Hoàn thành chỉ khi READY và PAID**
Trigger: transition `READY → COMPLETED`.
Kết quả: nếu payment chưa `PAID` thì `409 INVALID_TRANSITION` và đơn vẫn `READY`; nếu đã `PAID` thì `200` và đơn `COMPLETED`. Không có đường nào hoàn thành đơn chưa thu tiền.

**REQ-408 — Bật/tắt món tại store**
Trigger: `PATCH /v1/staff/stores/:storeId/variants/:variantId` bởi staff được gán store đó hoặc admin.
Kết quả: `200`; chỉ `store_variants.is_available` đổi; giá và dữ liệu catalog không đổi; menu khách phản ánh sau lần fetch kế tiếp. Staff store khác bị từ chối.

### 5.6 Theo dõi đơn (khách)

**REQ-500 — Lịch sử đơn của chính mình**
Trigger: `CUSTOMER` gọi `GET /v1/me/orders`.
Kết quả: `200` chỉ chứa đơn của user đó, có `code`, `status`, `totalVnd`, `createdAt`, phân trang.

**REQ-501 — Chi tiết và timeline**
Trigger: chủ đơn gọi `GET /v1/orders/:id` và `GET /v1/orders/:id/history`.
Kết quả: `200` với dòng món kèm snapshot, tổng tiền, trạng thái thanh toán, và timeline theo thứ tự thời gian. Staff được gán store và admin cũng xem được.

**REQ-502 — Không xem đơn người khác**
Trigger: user B gọi chi tiết đơn của user A, kể cả khi biết `code` đơn.
Kết quả: từ chối, không trả PII của đơn đó. `code` đơn không phải secret cấp quyền.

**REQ-503 — Polling dừng ở terminal state**
Trigger: khách mở trang tracking một đơn đang chạy, rồi đơn tới `COMPLETED`/`CANCELLED`/`REJECTED`.
Kết quả: trang refetch mỗi 5–10 giây khi đơn chưa terminal; dừng polling khi terminal; refetch lại khi tab focus trở lại.

**REQ-504 — Khách hủy khi còn PLACED**
Trigger: chủ đơn gọi `POST /v1/orders/:id/cancel` với `expectedVersion` đúng.
Kết quả: đơn `PLACED` → `200`, status `CANCELLED`, history ghi actor là chủ đơn. Đơn đã `CONFIRMED` hoặc muộn hơn → `409 INVALID_TRANSITION` và trạng thái không đổi. Không phát sinh hoàn tiền vì chưa thu tiền.

### 5.7 Quản trị menu

**REQ-600 — Admin quản lý category và product**
Trigger: `ADMIN` tạo/sửa category, product qua `/v1/admin/*`.
Kết quả: `2xx`; dữ liệu mới xuất hiện trong menu khách sau khi `is_active = true`; `slug` trùng bị từ chối. `STAFF` và `CUSTOMER` gọi các endpoint này bị `403`.

**REQ-601 — Admin quản lý variant theo size**
Trigger: `ADMIN` tạo/sửa variant của một product.
Kết quả: `2xx`; `UNIQUE(product_id,size)` và `sku` UNIQUE được tôn trọng; `price_vnd` là integer ≥ 0; giá mới chỉ áp cho quote/đơn mới, không đổi đơn cũ (xem REQ-306).

**REQ-602 — Admin quản lý modifier và gán vào product**
Trigger: `ADMIN` tạo/sửa modifier group/option và gọi `PUT /v1/admin/products/:id/modifier-groups`.
Kết quả: `2xx`; `max_select >= min_select`; gán group không tồn tại bị từ chối; sau khi gán, quote áp đúng luật min/max/membership cho product đó ở mọi size (xem REQ-203).

**REQ-603 — Vô hiệu hóa thay cho xóa**
Trigger: `ADMIN` muốn bỏ một món khỏi menu.
Kết quả: đặt `is_active = false`; món biến mất khỏi menu khách nhưng đơn cũ và history vẫn đọc được đầy đủ (xem REQ-307).

### 5.8 Dữ liệu và phi chức năng

**REQ-700 — Một store seed, schema nhiều store**
Trigger: chạy seed rồi kiểm tra schema.
Kết quả: có đúng một store demo; `orders`, `store_staff`, `store_variants`, `checkout_quotes` đều có `store_id`; không có API/service nào giả định store duy nhất hay hardcode ID store.

**REQ-701 — Dữ liệu tồn tại sau restart**
Trigger: restart API container / reload app rồi mở lại đơn đã tạo.
Kết quả: đơn, item, payment và history vẫn còn với cùng `code` và tổng tiền. Không có state nghiệp vụ nào chỉ nằm trong memory.

**REQ-702 — Tiền và thời gian đúng định dạng**
Trigger: đọc bất kỳ response có tiền hoặc thời gian.
Kết quả: tiền là integer VND (không thập phân, không string), thời gian là ISO 8601; UI hiển thị theo `Asia/Ho_Chi_Minh` và định dạng tiền VND.

**REQ-703 — Lỗi không lộ nội bộ**
Trigger: gây lỗi validation, lỗi quyền và lỗi 5xx.
Kết quả: body theo dạng `{code,message,details,requestId}`; không có SQL, stack trace, biến môi trường hay token trong response.

**REQ-704 — Hợp đồng API là nguồn chuẩn một chiều**
Trigger: build web và api.
Kết quả: Swagger `/docs` sinh từ code backend; `packages/contracts` chỉ chứa DTO/schema công khai hoặc type sinh từ OpenAPI; web không import Prisma client/model, dependency Node-only hay secret.

**REQ-705 — Giỏ hàng client bền qua reload**
Trigger: khách thêm món rồi reload trang.
Kết quả: giỏ còn nguyên (Zustand persist). Giỏ chỉ là tiện lợi UI; giá hiển thị phải được xác nhận lại bằng quote từ API trước khi đặt.

---

## 6. Ma trận phủ: feature MVP → REQ

| Feature MVP | REQ |
|---|---|
| Đăng nhập Supabase Auth | REQ-001, REQ-002 |
| Ba role CUSTOMER/STAFF/ADMIN | REQ-001, REQ-003, REQ-004, REQ-005 |
| Một store seed có store_id | REQ-700, REQ-100, REQ-102 |
| Category/product/variant size/modifier | REQ-100, REQ-601, REQ-602, REQ-600 |
| Menu | REQ-100, REQ-101, REQ-102 |
| Giỏ hàng | REQ-204, REQ-705 |
| Quote | REQ-200, REQ-201, REQ-202, REQ-203, REQ-205, REQ-206, REQ-207 |
| Pickup + trả tại quầy | REQ-300, REQ-405, REQ-407 |
| Đặt đơn an toàn (retry/đồng thời) | REQ-301, REQ-302, REQ-303, REQ-304, REQ-305, REQ-308 |
| Staff xác nhận/pha chế/sẵn sàng/bàn giao | REQ-400, REQ-401, REQ-402, REQ-403, REQ-404 |
| Thu tiền | REQ-405, REQ-406 |
| Lịch sử đơn và timeline | REQ-500, REQ-501, REQ-502, REQ-503, REQ-306 |
| Khách hủy đơn | REQ-504 |
| Bật/tắt món tại store | REQ-408, REQ-101 |
| Snapshot và history | REQ-306, REQ-307, REQ-603, REQ-701 |

Acceptance bắt buộc của bước 01 được phủ như sau: CUSTOMER đặt món tùy chỉnh → REQ-203/REQ-204/REQ-300; STAFF đúng store chuyển trạng thái → REQ-004/REQ-401; ADMIN quản lý menu → REQ-600..REQ-603; tiền do API tính → REQ-200/REQ-201; retry không trùng → REQ-302/REQ-304; snapshot và history → REQ-306/REQ-401.

Tiêu chí thành công trong `product.md` map như sau: một đơn chạy xuyên suốt trên URL deploy → REQ-300/REQ-401/REQ-405/REQ-407; tính giá tại API → REQ-200/REQ-201; retry không sinh đơn trùng → REQ-302/REQ-304; chủ đơn xem được tracking → REQ-501/REQ-503; nhân viên chỉ xử lý store được gán → REQ-004/REQ-400; dữ liệu tồn tại sau restart → REQ-701.

---

## 7. Kiểm tra nhất quán các rule hủy / thu tiền / hoàn thành

| Câu hỏi | Kết luận | Căn cứ |
|---|---|---|
| Khách hủy được ở đâu? | Chỉ `PLACED`. Từ `CONFIRMED` trở đi khách không tự hủy trong MVP. | REQ-504 |
| Staff từ chối được ở đâu? | Chỉ `PLACED`, bắt buộc `reason`. | REQ-404 |
| Thu tiền được ở trạng thái nào? | `CONFIRMED`, `PREPARING`, `READY`. Không thu khi `PLACED` hoặc terminal. | REQ-405 |
| Có thể hủy/từ chối một đơn đã `PAID`? | Không. Hủy/từ chối chỉ xảy ra ở `PLACED`, mà `PLACED` không được thu tiền. | REQ-404, REQ-405, REQ-504 |
| Vậy MVP có cần hoàn tiền? | Không. Không có đường đi nào tạo ra đơn đã thu tiền rồi bị hủy/từ chối. | suy ra từ ba dòng trên |
| Hoàn thành đơn chưa thu tiền? | Không. `COMPLETED` cần `READY` **và** `PAID`. | REQ-407 |
| Đơn `READY` mà khách không đến thì sao? | **Câu hỏi còn mở** — xem `docs/decisions.md`. MVP không có trạng thái abandoned; đơn nằm ở `READY`. | — |

Không phát hiện mâu thuẫn giữa các rule hủy, thu tiền và hoàn thành trong phạm vi MVP.

---

## 8. Truy vết sang test plan

`docs/test-plan.md` đã map ID test T01–T13 sang các REQ trong tài liệu này. Việc map là thiết kế test; **chưa có test nào được viết hoặc chạy** ở bước 01.

---

## 9. Chưa thuộc bước này

Bước 01 không tạo app code, không tạo migration, không chạy test. Wireframe thuộc bước 02, bootstrap monorepo thuộc bước 03.
