# Phác thảo giao diện — Coffee Order (MVP)

Bước 02. Đây là **phác thảo thiết kế**, không phải UI đã chạy: repo chưa có `apps/web` code nào. Wireframe dùng ASCII; mockup HTML tĩnh kèm theo ở `docs/mockups/index.html`.

Nguồn: `docs/requirements.md` (REQ-001..REQ-705), `.kiro/steering/domain-rules.md`, `docs/api-contract.md`.

Quy ước trong tài liệu: `[Nút]` = button, `( )` = radio, `[ ]` = checkbox, `▾` = select, `···` = skeleton loading, chữ in nghiêng trong ngoặc vuông `[như này]` = ghi chú thiết kế chứ không phải text hiển thị.

**Mọi dữ liệu trong wireframe và mockup là dữ liệu giả cho demo** (tên món, giá, tên khách, mã đơn). Không phải menu hay giá của doanh nghiệp nào.

---

## 1. Nguyên tắc chung

| Nguyên tắc | Chi tiết |
|---|---|
| Mobile-first | Thiết kế gốc ở 360–430px cho khách. Breakpoint `md` (768px) lên 2 cột, `lg` (1024px) cho staff/admin. Staff board và admin table thiết kế cho ≥1024px nhưng vẫn dùng được ở mobile dạng card xếp dọc. |
| Tiền | Luôn hiển thị dạng `45.000 ₫` (integer VND, dấu chấm nhóm nghìn). Không bao giờ hiện số thập phân. (REQ-702) |
| Thời gian | Hiển thị theo `Asia/Ho_Chi_Minh`, dạng `14:32 · 09/10/2026`. Thời gian tương đối (`2 phút trước`) chỉ dùng kèm thời gian tuyệt đối. (REQ-702) |
| Giá là của server | UI **không** tự tính tổng để gửi lên. Tổng ở giỏ là con số ước tính hiển thị tại client, có nhãn "Tạm tính"; con số ràng buộc là tổng từ `POST /checkout/quote`. (REQ-200, REQ-705) |
| Nút gửi | Mọi nút gây mutation bị `disabled` + đổi nhãn (`Đang gửi…`) + `aria-busy="true"` trong lúc request đang chạy. Chống double-submit ở UI; chống trùng đơn thật nằm ở `Idempotency-Key`. (REQ-301, REQ-302) |
| Không lộ nội bộ | Khách không bao giờ thấy tên bảng, SQL, stack trace, tên biến môi trường, `requestId` dạng raw hay mã lỗi kỹ thuật. `requestId` chỉ hiện dưới dạng "Mã tham chiếu" trong màn lỗi 5xx để khách đọc cho nhân viên. (REQ-703) |
| Route theo role chỉ là UX | `/staff/*` và `/admin/*` được middleware che để đỡ nhầm, nhưng **không thay thế guard ở API**. Mọi màn hình staff/admin vẫn phải chịu kiểm quyền server-side mỗi request. (REQ-003, REQ-004) |
| Không hứa realtime | Tracking ghi rõ "Cập nhật lúc hh:mm" + nút "Làm mới". Không dùng từ "trực tiếp"/"realtime" ở bất cứ đâu trong MVP. (REQ-503) |
| Accessibility | Mọi input có `<label>` gắn `htmlFor`. Dialog bẫy focus, `Esc` đóng, trả focus về nút đã mở. Thứ tự tab theo thứ tự đọc. Lỗi validation gắn `aria-describedby`, đọc được bằng screen reader, viết bằng tiếng Việt dễ hiểu, không dùng thuật ngữ kỹ thuật. Vùng cập nhật trạng thái đơn là `aria-live="polite"`. Tương phản ≥ 4.5:1 cho text thường. |

Ghi chú: các điểm accessibility trên là mục tiêu thiết kế. Tuân thủ WCAG đầy đủ cần kiểm thủ công với trợ năng thật và rà soát bởi người có chuyên môn; wireframe không chứng minh được điều đó.

---

## 2. Bản đồ route → feature → REQ

### Khách (customer)

| Route | Màn hình | Feature | REQ chính |
|---|---|---|---|
| `/` | Menu (trang chủ) | Danh mục + món theo store | REQ-100, REQ-101, REQ-102 |
| `/` + dialog | Chi tiết món | Chọn size + modifier + note + quantity | REQ-203, REQ-204, REQ-202 |
| `/cart` | Giỏ hàng | Sửa số lượng, xóa dòng, tạm tính | REQ-204, REQ-202, REQ-705 |
| `/checkout` | Thanh toán | Quote từ API, thông tin người nhận, đặt đơn | REQ-200, REQ-201, REQ-205, REQ-206, REQ-300 |
| `/orders/[id]` | Xác nhận + theo dõi | Banner đặt thành công, timeline, polling | REQ-501, REQ-503, REQ-504 |
| `/orders` | Lịch sử đơn | Danh sách đơn của mình | REQ-500, REQ-502 |
| `/login`, `/signup` | Đăng nhập / đăng ký | Supabase Auth | REQ-001, REQ-002 |

### Nhân viên (staff)

| Route | Màn hình | Feature | REQ chính |
|---|---|---|---|
| `/staff/orders` | Bảng đơn theo store | Hàng đợi theo trạng thái | REQ-400, REQ-004 |
| `/staff/orders/[id]` | Chi tiết đơn | Transition hợp lệ, thu tiền, từ chối | REQ-401, REQ-402, REQ-403, REQ-404, REQ-405, REQ-406, REQ-407 |
| `/staff/menu` | Bật/tắt món tại store | Toggle `store_variants.is_available` | REQ-408, REQ-101 |

### Quản trị (admin)

| Route | Màn hình | Feature | REQ chính |
|---|---|---|---|
| `/admin/categories` | Danh mục | Tạo/sửa/ẩn category | REQ-600, REQ-603 |
| `/admin/products` | Danh sách món | Tạo/sửa/ẩn product | REQ-600, REQ-603 |
| `/admin/products/[id]` | Chi tiết món | Variant theo size + gán modifier group | REQ-601, REQ-602 |
| `/admin/modifiers` | Modifier | Group (min/max) + option (phụ phí) | REQ-602 |
| `/admin/staff` | Gán nhân viên | `store_staff` | UC-13, REQ-004 |

Admin truy cập được mọi màn hình staff (REQ-400, REQ-408).

---

## 3. Navigation

### Khách — mobile (mặc định)

```
┌──────────────────────────────┐
│ ☕ Coffee Order    [🛒 3]  ☰ │  ← header sticky; badge = số dòng trong giỏ
└──────────────────────────────┘
          (nội dung)
┌──────────────────────────────┐
│  Menu     Đơn của tôi   Tôi  │  ← bottom tab, 3 mục, icon + nhãn tiếng Việt
└──────────────────────────────┘
```

- Badge giỏ đọc từ Zustand persist nên đúng ngay sau reload (REQ-705).
- Tab "Đơn của tôi" khi chưa đăng nhập → đưa sang `/login` kèm `?next=/orders`.
- `☰` chứa: tên store đang chọn, Đăng nhập/Đăng xuất, và link `/staff/orders` hoặc `/admin/products` **chỉ khi** role trong `GET /me` là STAFF/ADMIN. Ẩn link không phải là cơ chế bảo mật (REQ-003).

### Khách — desktop (≥768px)

```
┌───────────────────────────────────────────────────────────────┐
│ ☕ Coffee Order   Menu  Đơn của tôi        [🛒 Giỏ · 3]  Minh▾│
└───────────────────────────────────────────────────────────────┘
```
Bỏ bottom tab, dùng top nav. Giỏ mở trang `/cart` (không dùng drawer để giữ một đường đi duy nhất).

### Staff / Admin (≥1024px)

```
┌────────────┬──────────────────────────────────────────────────┐
│ Coffee     │  Đơn hàng · Cửa hàng Quận 1      Hùng (STAFF) ▾  │
│ Order      ├──────────────────────────────────────────────────┤
│            │                                                  │
│ ▸ Đơn hàng │              (nội dung)                          │
│ ▸ Menu     │                                                  │
│            │                                                  │
│ ───────    │                                                  │
│ ▸ Danh mục │  ← nhóm Quản trị chỉ hiện với ADMIN              │
│ ▸ Món      │                                                  │
│ ▸ Modifier │                                                  │
│ ▸ Nhân viên│                                                  │
└────────────┴──────────────────────────────────────────────────┘
```

Header luôn hiện **tên store đang làm việc**. Staff được gán nhiều store thì có `▾` chọn store; mọi request kèm `storeId` đó và API vẫn kiểm lại qua `store_staff` (REQ-004).

---

## 4. Menu `/` (mobile-first)

```
┌──────────────────────────────┐
│ ☕ Coffee Order    [🛒 0]  ☰ │
├──────────────────────────────┤
│ 📍 Cửa hàng Quận 1        ▾ │  ← MVP chỉ 1 store seed nhưng vẫn là selector
├──────────────────────────────┤
│ [Cà phê][Trà][Đá xay][Bánh] │  ← chip category, scroll ngang, sticky
├──────────────────────────────┤
│ ┌──────┐ Cà phê sữa đá      │
│ │ ảnh  │ Đậm, ngọt vừa       │
│ │      │ từ 29.000 ₫    [+] │  ← "từ" = giá variant thấp nhất
│ └──────┘                     │
│ ┌──────┐ Bạc xỉu            │
│ │ ảnh  │ từ 35.000 ₫    [+] │
│ └──────┘                     │
│ ┌──────┐ Trà sen vàng       │
│ │ ảnh  │ HẾT HÀNG HÔM NAY   │  ← overlay mờ, [+] bị disabled
│ └──────┘ từ 45.000 ₫    [+]✕│
│ ┌──────┐ Bánh mì chả        │
│ │ ảnh  │ 25.000 ₫       [+] │  ← 1 variant: hiện giá chính xác, không "từ"
│ └──────┘                     │
├──────────────────────────────┤
│  Menu     Đơn của tôi   Tôi  │
└──────────────────────────────┘
```

Chi tiết:
- Dữ liệu từ `GET /v1/products?storeId=...`; cờ khả dụng tính theo `store_variants` của đúng store đang chọn (REQ-100).
- Món hết hàng: vẫn hiện để khách biết có món đó, nhưng `[+]` `disabled` + `aria-disabled` + text "Hết hàng hôm nay". Không ẩn món (REQ-101).
- Nếu **một phần** variant hết (ví dụ còn S, hết L): món vẫn chọn được, size hết hàng bị disabled trong dialog.
- Món bị `is_active = false` **không** xuất hiện (REQ-603).
- Chọn store `is_active = false`: hiện màn empty "Cửa hàng này đang tạm đóng" và không cho mở dialog (REQ-102).
- `[+]` mở dialog chi tiết. Không có "thêm nhanh vào giỏ" vì mọi món đều có thể có modifier bắt buộc.

### Trạng thái màn Menu

| Trạng thái | Hiển thị |
|---|---|
| Loading | 6 skeleton card (`···` ảnh + 2 dòng xám). Chip category cũng skeleton. Không hiện spinner toàn trang. |
| Empty (category rỗng) | "Danh mục này chưa có món nào." + `[Xem tất cả]` |
| Empty (store không có món khả dụng) | "Hôm nay cửa hàng chưa mở bán món nào." |
| Error (mạng/5xx) | "Không tải được menu. Kiểm tra kết nối rồi thử lại." + `[Thử lại]`. Không hiện mã lỗi kỹ thuật (REQ-703). |
| Store đóng | Banner vàng "Cửa hàng đang tạm đóng, chưa nhận đơn." Menu vẫn xem được, nút thêm disabled. |
| Unauthorized | Không áp dụng — menu là public (REQ-100). Khách chưa đăng nhập xem được toàn bộ menu. |

---

## 5. Dialog chi tiết món

Dialog (bottom sheet ở mobile, modal giữa ở desktop). Không dùng trang riêng để khách không mất vị trí scroll trong menu.

```
┌──────────────────────────────┐
│            ─────             │  ← drag handle
│ ┌──────────────────────────┐ │
│ │          ảnh             │ │
│ └──────────────────────────┘ │
│ Cà phê sữa đá            [✕]│
│ Đậm, ngọt vừa                │
│                              │
│ Size *                       │  ← * = bắt buộc
│ ( ) Nhỏ (S)        29.000 ₫ │
│ (•) Vừa (M)        35.000 ₫ │
│ ( ) Lớn (L)        45.000 ₫ │  ← nếu hết: disabled + "Hết hàng"
│                              │
│ Mức đá  · chọn 1             │  ← min=1 max=1 → radio
│ (•) Đá bình thường      +0 ₫│
│ ( ) Ít đá               +0 ₫│
│ ( ) Không đá            +0 ₫│
│                              │
│ Topping · chọn tối đa 2      │  ← min=0 max=2 → checkbox
│ [✓] Thạch cà phê    +10.000 ₫│
│ [ ] Kem phô mai     +15.000 ₫│
│ [ ] Trân châu       +10.000 ₫│  ← disabled khi đã chọn đủ 2
│                              │
│ Ghi chú cho quán             │
│ ┌──────────────────────────┐ │
│ │ ít ngọt giúp mình        │ │  ← textarea, tối đa 200 ký tự, hiện 23/200
│ └──────────────────────────┘ │
│                              │
│ Số lượng   [−]  2  [+]       │  ← 1..20, [−] disabled ở 1, [+] ở 20
├──────────────────────────────┤
│ [ Thêm vào giỏ · 90.000 ₫ ] │  ← (35.000 + 10.000) × 2
└──────────────────────────────┘
```

### Quy tắc chọn modifier theo min/max (REQ-203)

| `min_select` / `max_select` | Dạng điều khiển | Nhãn phụ | Hành vi |
|---|---|---|---|
| 1 / 1 | radio | `· chọn 1` | Bắt buộc, chọn sẵn option đầu tiên đang hoạt động |
| 0 / 1 | radio + option "Không chọn" | `· tuỳ chọn` | Bỏ chọn được |
| 0 / n (n>1) | checkbox | `· chọn tối đa n` | Khi đã chọn n, các checkbox còn lại `disabled` kèm tooltip "Đã chọn tối đa 2" |
| m / n (m>0) | checkbox | `· chọn từ m đến n` | Chưa đủ m thì nút thêm vào giỏ `disabled` và nhóm hiện lỗi "Chọn ít nhất 1 mục" |

- Không chọn trùng option trong cùng dòng; mỗi option `quantity = 1` (REQ-203). UI không có bộ đếm trên option.
- Option `is_active = false` không render. Option bị tắt **sau khi** khách mở dialog: lần quote sẽ trả `409 ITEM_UNAVAILABLE` và UI xử lý theo mục 7.4.

### Size — không ép sản phẩm không có size

Phần "Size" **chỉ render khi product có ≥2 variant**. Món một variant (bánh mì, bánh ngọt, nước đóng chai) thì:
- Ẩn hoàn toàn khối Size, không hiện "Size: ONE_SIZE".
- Hiện giá trực tiếp dưới tên món.
- Ở menu hiện giá chính xác, không có chữ "từ".

Nghĩa là UI suy ra từ số lượng variant, không hardcode danh sách S/M/L.

### Trạng thái dialog

| Trạng thái | Hiển thị |
|---|---|
| Loading chi tiết | Dialog mở ngay với tên + ảnh đã có từ list; khối size/modifier là skeleton. Nút thêm `disabled`. |
| Error tải chi tiết | Trong dialog: "Không tải được tuỳ chọn của món này." + `[Thử lại]` + `[Đóng]` |
| Validation chưa đủ | Nút `disabled`, nhóm thiếu có text đỏ `role="alert"`, focus nhảy tới nhóm đầu tiên bị lỗi khi khách bấm nút |
| Món vừa hết hàng | Banner đỏ trong dialog "Món này vừa hết hàng." Nút đổi thành `[Đóng]`. |
| Đang thêm vào giỏ | Thêm vào giỏ là thao tác **local** (Zustand), không có network, nên không có trạng thái pending. |

---

## 6. Giỏ hàng `/cart`

```
┌──────────────────────────────┐
│ ← Giỏ hàng                   │
├──────────────────────────────┤
│ 📍 Cửa hàng Quận 1           │
├──────────────────────────────┤
│ Cà phê sữa đá · Vừa (M)      │
│ Đá bình thường, Thạch cà phê │
│ "ít ngọt giúp mình"          │
│ 45.000 ₫   [−] 2 [+]    [🗑]│
│ ────────────────────────────  │
│ Cà phê sữa đá · Lớn (L)      │  ← cùng món, khác size → DÒNG RIÊNG
│ Ít đá                        │
│ 45.000 ₫   [−] 1 [+]    [🗑]│
│ ────────────────────────────  │
│ Bánh mì chả                  │  ← không hiện dòng size
│ 25.000 ₫   [−] 1 [+]    [🗑]│
├──────────────────────────────┤
│ Tạm tính (3 món)   160.000 ₫│  ← nhãn "Tạm tính", không phải "Tổng"
│ Phí giao hàng               — │  ← MVP = 0, hiện "—" kèm chú thích
│ Giảm giá                    — │
│                              │
│ ⓘ Giá cuối do cửa hàng xác   │
│   nhận ở bước tiếp theo.     │
├──────────────────────────────┤
│ [    Tiếp tục đặt món    ]  │
└──────────────────────────────┘
```

- Mỗi dòng là một tổ hợp (variant + tập modifier + note). Khác size, khác tập modifier hoặc khác note → **dòng riêng**, không gộp (REQ-204).
- `[−]`/`[+]` giới hạn 1..20; ở 20 thì `[+]` disabled kèm "Tối đa 20 mỗi món". Giỏ quá 50 dòng thì chặn thêm dòng mới kèm "Giỏ tối đa 50 dòng" (REQ-202).
- `[🗑]` xóa dòng, có undo bằng toast 5 giây.
- Sửa tổ hợp modifier: bấm vào nội dung dòng → mở lại dialog ở chế độ sửa (thay dòng cũ, không thêm dòng mới).
- Giỏ persist qua reload (REQ-705). Giỏ là của client, **không** gửi tới server tới khi quote.

### Trạng thái màn Giỏ

| Trạng thái | Hiển thị |
|---|---|
| Empty | Icon giỏ rỗng + "Giỏ hàng đang trống." + `[Xem menu]` |
| Loading | Không có — giỏ đọc từ local store. Chỉ có một nhịp hydrate ngắn, hiện skeleton 1 dòng để tránh nhảy layout. |
| Có món không còn khả dụng | Dòng đó bị gạch + badge "Hết hàng" + `[Xoá dòng này]`. Nút "Tiếp tục đặt món" `disabled` tới khi dòng đó bị xoá (phát hiện bằng lần refetch menu hoặc khi quote trả `409`). |
| Giỏ thuộc store khác store đang chọn | Banner "Giỏ của bạn thuộc Cửa hàng Quận 1." + `[Giữ cửa hàng cũ]` / `[Xoá giỏ và đổi cửa hàng]` |
| Unauthorized | Không áp dụng; xem giỏ không cần đăng nhập. Bấm "Tiếp tục đặt món" khi chưa đăng nhập → `/login?next=/checkout`. |

---

## 7. Thanh toán `/checkout`

Màn này là nơi quote xuất hiện. Vào màn → gọi `POST /v1/checkout/quote` ngay, hiện tổng **từ server**.

```
┌──────────────────────────────┐
│ ← Đặt món                    │
├──────────────────────────────┤
│ Nhận món                     │
│ (•) Tại quầy — Cửa hàng Q1   │  ← chỉ 1 lựa chọn PICKUP trong MVP
│     12 Nguyễn Huệ, Quận 1    │
│                              │
│ Người nhận                   │
│ Tên *                        │
│ ┌──────────────────────────┐ │
│ │ Nguyễn Văn Minh          │ │  ← prefill từ GET /me
│ └──────────────────────────┘ │
│ Số điện thoại *              │
│ ┌──────────────────────────┐ │
│ │ 0901234567               │ │
│ └──────────────────────────┘ │
│ Ghi chú khi đến lấy          │
│ ┌──────────────────────────┐ │
│ │                          │ │
│ └──────────────────────────┘ │
│                              │
│ Thanh toán                   │
│ (•) Trả tại quầy khi nhận món│  ← chỉ 1 lựa chọn, vẫn render radio
│     Chưa hỗ trợ trả trước.   │
├──────────────────────────────┤
│ Đơn của bạn                  │
│ 2× Cà phê sữa đá (M)  90.000₫│
│ 1× Cà phê sữa đá (L)  45.000₫│
│ 1× Bánh mì chả        25.000₫│
│ ────────────────────────────  │
│ Tổng tiền món        160.000₫│
│ Phí giao hàng              0₫│
│ Giảm giá                   0₫│
│ TỔNG THANH TOÁN      160.000₫│  ← từ quote, in đậm
│                              │
│ ⏱ Giá giữ đến 14:37 (còn 4:12)│  ← đếm ngược từ expiresAt
├──────────────────────────────┤
│ [       Đặt món         ]   │
│ Bấm Đặt món là bạn đồng ý    │
│ đến lấy và trả tại quầy.     │
└──────────────────────────────┘
```

### 7.1 Vòng đời quote trên UI

1. Vào màn → `POST /checkout/quote` với `{storeId, fulfillmentType:"PICKUP", paymentMethod:"PAY_AT_COUNTER", recipient, items[{variantId,quantity,modifierOptionIds,note}]}`. **Không gửi giá** (REQ-200).
2. Nhận `{quoteId, expiresAt, items, subtotalVnd, shippingFeeVnd, discountVnd, totalVnd}` → render tổng và đếm ngược tới `expiresAt` (REQ-205).
3. Khách sửa tên/điện thoại/ghi chú → **quote lại** (debounce 600ms) vì `request_hash` bao gồm recipient. Trong lúc quote lại: nút "Đặt món" `disabled`, khối tổng tiền mờ + skeleton.
4. Bấm "Đặt món" → `POST /v1/orders` với `quoteId` + **đúng payload đã quote** + header `Idempotency-Key` (UUID sinh 1 lần cho lần thử này, giữ nguyên khi retry).
5. `201` → chuyển sang `/orders/[id]?placed=1`. Xoá giỏ. Xoá `Idempotency-Key` đã dùng.

### 7.2 Đếm ngược và hết hạn

- Còn > 60s: `⏱ Giá giữ đến 14:37 (còn 4:12)` màu xám.
- Còn ≤ 60s: đổi màu cam, text "Giá chỉ còn giữ 48 giây".
- Về 0: nút "Đặt món" `disabled`, hiện banner (mục 7.4, case `QUOTE_EXPIRED`). Không tự động quote lại ngầm — khách phải thấy giá mới trước khi đặt.

### 7.3 Chống double-submit (REQ-301, REQ-302)

Nhấn "Đặt món":
```
[ Đặt món ]  →  [ ⟳ Đang gửi đơn… ]   (disabled, aria-busy)
```
- Nút disabled tới khi có kết quả.
- Lỗi mạng/timeout → hiện `[Thử lại]`; lần thử lại dùng **cùng** `Idempotency-Key` và cùng payload, nên server trả về đúng đơn cũ nếu lần đầu đã thành công (REQ-302). UI nhận `200` xử lý y như `201`: coi là đặt thành công, không báo lỗi, không tạo đơn thứ hai.
- `Idempotency-Key` chỉ sinh mới khi khách thay đổi nội dung đơn (tức khi có quote mới).

### 7.4 Bảng xử lý lỗi ở checkout

| Phản hồi API | Hiển thị cho khách | Hành động |
|---|---|---|
| `410 QUOTE_EXPIRED` | Banner cam: "Giá đã hết hiệu lực. Cập nhật lại để xem giá mới nhất." | `[Cập nhật giá]` → quote lại, sinh `Idempotency-Key` mới, nút Đặt món bật lại sau khi khách thấy tổng mới |
| `409 PRICE_CHANGED` | Banner cam: "Giá vừa thay đổi. Tổng mới là **165.000 ₫** (trước đó 160.000 ₫)." | `[Xem và xác nhận]` → render quote mới, nút đổi nhãn `[Đặt món · 165.000 ₫]`. **Buộc khách xác nhận lần nữa**, không tự đặt (REQ-206) |
| `409 ITEM_UNAVAILABLE` | Banner đỏ: "Trà sen vàng (L) vừa hết hàng." | `[Xoá món này và cập nhật giá]` → xoá dòng, quote lại. Nếu giỏ rỗng sau khi xoá → về `/` |
| `409 QUOTE_ALREADY_USED` | "Đơn này đã được đặt rồi." | `[Xem đơn của tôi]` → `/orders`. Không cho đặt lại (REQ-207) |
| `409 IDEMPOTENCY_CONFLICT` | "Nội dung đơn đã thay đổi. Hãy cập nhật giá rồi đặt lại." | Sinh `Idempotency-Key` mới + quote lại (REQ-303) |
| `400 VALIDATION_ERROR` | Lỗi gắn vào từng field: "Số điện thoại chưa đúng định dạng." Lỗi không map được field → banner chung "Thông tin đơn chưa hợp lệ, kiểm tra lại giúp mình." | Focus field lỗi đầu tiên |
| `401 UNAUTHENTICATED` | Dialog: "Phiên đăng nhập đã hết. Đăng nhập lại để đặt món." | `[Đăng nhập]` → `/login?next=/checkout`. **Giữ nguyên giỏ** và nội dung form (REQ-002, mục 11) |
| `403 FORBIDDEN` | "Tài khoản này không đặt được đơn." | `[Về menu]` |
| `429 RATE_LIMITED` | "Bạn thao tác hơi nhanh. Thử lại sau vài giây." | Nút disabled kèm đếm ngược ngắn |
| `5xx` | "Hệ thống đang lỗi, đơn của bạn **chưa** được tạo. Thử lại giúp mình." + "Mã tham chiếu: `a1b2c3`" | `[Thử lại]` dùng cùng `Idempotency-Key`. Không hiện stack/SQL (REQ-703) |

Nguyên tắc chung: **không bao giờ** nói "đặt thành công" khi chưa nhận được `201`/`200` có `orderId`.

### 7.5 Trạng thái màn Checkout

| Trạng thái | Hiển thị |
|---|---|
| Loading quote lần đầu | Form hiện đầy đủ; khối "Đơn của bạn" là skeleton; nút Đặt món `disabled` nhãn "Đang tính giá…" |
| Đang quote lại | Khối tổng mờ 50% + skeleton dòng tổng; nút `disabled` |
| Empty | Vào `/checkout` với giỏ rỗng → redirect `/cart` |
| Error quote | "Không tính được giá đơn hàng." + `[Thử lại]` |
| Unauthorized | Vào `/checkout` khi chưa đăng nhập → redirect `/login?next=/checkout` (kiểm cả server-side) |

---

## 8. Xác nhận + theo dõi `/orders/[id]`

Xác nhận và tracking là **một màn**, khác nhau bởi banner `?placed=1`. Lý do: khách đặt xong cần ngay mã đơn và trạng thái, không cần hai trang.

```
┌──────────────────────────────┐
│ ← Đơn CF-240109-0042         │
├──────────────────────────────┤
│ ✅ Đã gửi đơn tới cửa hàng!  │  ← chỉ khi ?placed=1, tự ẩn sau 8s
│    Chờ nhân viên xác nhận.   │
├──────────────────────────────┤
│        ĐANG PHA CHẾ          │  ← badge lớn, aria-live="polite"
│   Cửa hàng Quận 1 · Tại quầy │
│                              │
│ ●─────●─────●─────○─────○    │
│ Đặt  Xác   Pha   Sẵn  Hoàn   │
│      nhận  chế   sàng tất    │
│                              │
│ 🕐 Cập nhật lúc 14:35:12     │  ← KHÔNG hứa realtime
│    [⟳ Làm mới]               │
├──────────────────────────────┤
│ Thanh toán                   │
│ Trả tại quầy · CHƯA THU TIỀN │  ← badge xám
│ Số tiền cần trả: 160.000 ₫   │
├──────────────────────────────┤
│ Món đã đặt                   │
│ 2× Cà phê sữa đá (M)  90.000₫│
│    Đá bình thường,           │
│    Thạch cà phê              │
│    "ít ngọt giúp mình"       │
│ 1× Cà phê sữa đá (L)  45.000₫│
│ 1× Bánh mì chả        25.000₫│
│ ────────────────────────────  │
│ Tổng                 160.000₫│
├──────────────────────────────┤
│ Người nhận                   │
│ Nguyễn Văn Minh · 0901234567 │
├──────────────────────────────┤
│ Diễn biến đơn                │
│ 14:35  Đang pha chế          │
│ 14:33  Đã xác nhận           │
│ 14:32  Đã gửi đơn            │
└──────────────────────────────┘
```

### 8.1 Polling và "thời điểm cập nhật" (REQ-503)

- Chu kỳ **7 giây** (trong khoảng 5–10s theo rule). Chỉ polling khi đơn **chưa** terminal.
- Đơn vào `COMPLETED`/`CANCELLED`/`REJECTED` → **dừng polling**, ẩn dòng "Cập nhật lúc", đổi thành trạng thái kết thúc.
- Tab mất focus → tạm dừng polling; focus lại → refetch ngay rồi tiếp tục.
- Luôn hiện "Cập nhật lúc hh:mm:ss" + nút `[⟳ Làm mới]` thủ công.
- Nếu một lần polling lỗi: giữ dữ liệu cũ, đổi dòng thành "Chưa cập nhật được lúc 14:35 · [Thử lại]". Không xoá nội dung đang hiển thị, không hiện dialog lỗi che màn.
- Văn bản không dùng từ "trực tiếp", "realtime", "tức thời". Mô tả đúng: "Trang tự kiểm tra lại sau mỗi vài giây."

### 8.2 Nút hủy (REQ-504)

```
Khi status = PLACED:
┌──────────────────────────────┐
│ [     Hủy đơn này      ]     │  ← outline đỏ, không phải nút chính
└──────────────────────────────┘

Khi status ≠ PLACED: không render nút. Thay bằng dòng chú thích:
"Đơn đã được xác nhận nên không thể tự hủy. Liên hệ nhân viên tại quầy nếu cần."
```

Bấm hủy → dialog xác nhận:
```
┌──────────────────────────────┐
│ Hủy đơn CF-240109-0042?      │
│ Đơn sẽ không được pha chế.    │
│ Bạn chưa trả tiền nên không   │
│ phát sinh hoàn tiền.          │
│   [Không]  [Xác nhận hủy]    │
└──────────────────────────────┘
```
Gửi `POST /orders/:id/cancel` kèm `expectedVersion` của bản đang xem. Nếu `409 INVALID_TRANSITION` hoặc `409 VERSION_CONFLICT`:
> "Nhân viên vừa xác nhận đơn nên không hủy được nữa." → đóng dialog, refetch, ẩn nút hủy.

### 8.3 Trạng thái màn Tracking

| Trạng thái | Hiển thị |
|---|---|
| Loading lần đầu | Skeleton: badge trạng thái, 3 dòng món, timeline 3 dòng |
| Error lần đầu | "Không tải được đơn này." + `[Thử lại]` |
| `404` / không phải đơn của mình | "Không tìm thấy đơn này." + `[Xem đơn của tôi]`. **Không** hiện thông tin gì của đơn đó, kể cả tên hay tổng tiền (REQ-502) |
| Unauthorized (401) | Redirect `/login?next=/orders/<id>` |
| `CANCELLED` | Badge xám "ĐÃ HỦY" + "Bạn đã hủy lúc 14:40". Không có nút hành động. Dừng polling. |
| `REJECTED` | Badge đỏ "CỬA HÀNG TỪ CHỐI" + khối lý do: "Lý do: hết nguyên liệu trà sen". Dừng polling (REQ-404) |
| `READY` | Badge xanh "SẴN SÀNG — ĐẾN QUẦY LẤY MÓN" + nhắc "Đọc mã CF-240109-0042 và trả 160.000 ₫ tại quầy." |
| `COMPLETED` | Badge xanh đậm "ĐÃ HOÀN TẤT" + payment badge "ĐÃ THANH TOÁN · 14:52". Nút `[Đặt lại đơn này]` là **tuỳ chọn ngoài danh sách MVP**, cắt được nếu hụt thời gian (xem Q02-02); nếu làm thì chỉ nạp lại giỏ từ snapshot và **giá vẫn phải quote lại** |
| Payment `PAID` nhưng chưa `COMPLETED` | Badge xanh "ĐÃ THANH TOÁN" ở khối thanh toán, trạng thái đơn vẫn theo pha chế |

---

## 9. Lịch sử đơn `/orders`

```
┌──────────────────────────────┐
│ Đơn của tôi                  │
├──────────────────────────────┤
│ [Đang xử lý] [Tất cả]        │  ← tab lọc client-side trên dữ liệu đã tải
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ CF-240109-0042           │ │
│ │ ĐANG PHA CHẾ        🟡   │ │
│ │ 3 món · 160.000 ₫        │ │
│ │ 14:32 · 09/10/2026    →  │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ CF-240108-0031           │ │
│ │ ĐÃ HOÀN TẤT         🟢   │ │
│ │ 1 món · 45.000 ₫         │ │
│ │ 08:15 · 08/10/2026    →  │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ CF-240107-0019           │ │
│ │ ĐÃ HỦY              ⚪   │ │
│ │ 2 món · 70.000 ₫         │ │
│ └──────────────────────────┘ │
│                              │
│ [   Xem thêm   ]             │  ← phân trang theo {items,page,limit,total}
├──────────────────────────────┤
│  Menu     Đơn của tôi   Tôi  │
└──────────────────────────────┘
```

- Chỉ đơn của chính mình, từ `GET /v1/me/orders` (REQ-500).
- Mỗi card → `/orders/[id]`.
- Đơn chưa terminal: card có chấm nhấp nháy nhẹ; **không polling ở màn list** (chỉ refetch khi focus) để đỡ tải. Polling chỉ ở màn chi tiết.

| Trạng thái | Hiển thị |
|---|---|
| Loading | 3 skeleton card |
| Empty | "Bạn chưa có đơn nào." + `[Xem menu]` |
| Error | "Không tải được lịch sử đơn." + `[Thử lại]` |
| Unauthorized | Redirect `/login?next=/orders` |

---

## 10. Màn hình nhân viên

### 10.1 Bảng đơn `/staff/orders`

```
┌───────────────────────────────────────────────────────────────────────┐
│ Đơn hàng · Cửa hàng Quận 1 ▾          🕐 Cập nhật 14:35:12  [⟳]     │
├─────────────────┬─────────────────┬─────────────────┬────────────────┤
│ MỚI (2)         │ ĐÃ XÁC NHẬN (1) │ ĐANG PHA (3)    │ SẴN SÀNG (1)   │
├─────────────────┼─────────────────┼─────────────────┼────────────────┤
│ ┌─────────────┐ │ ┌─────────────┐ │ ┌─────────────┐ │┌─────────────┐ │
│ │CF-...-0045  │ │ │CF-...-0044  │ │ │CF-...-0042  │ ││CF-...-0040  │ │
│ │ 2 phút      │ │ │ 5 phút      │ │ │ 8 phút      │ ││ 12 phút ⚠   │ │
│ │ Minh        │ │ │ Lan         │ │ │ Minh        │ ││ Tuấn        │ │
│ │ 3 món       │ │ │ 1 món       │ │ │ 3 món       │ ││ 2 món       │ │
│ │ 160.000 ₫   │ │ │ 45.000 ₫    │ │ │ 160.000 ₫   │ ││ 70.000 ₫    │ │
│ │ CHƯA THU    │ │ │ CHƯA THU    │ │ │ ĐÃ THU 💰   │ ││ ĐÃ THU 💰   │ │
│ │[Xác nhận]   │ │ │[Pha chế]    │ │ │[Sẵn sàng]   │ ││[Hoàn tất]   │ │
│ │[Từ chối]    │ │ │             │ │ │             │ ││             │ │
│ └─────────────┘ │ └─────────────┘ │ └─────────────┘ │└─────────────┘ │
└─────────────────┴─────────────────┴─────────────────┴────────────────┘
```

- 4 cột = `PLACED`, `CONFIRMED`, `PREPARING`, `READY`. Đơn terminal rời bảng, xem ở tab "Hôm nay" riêng.
- Chỉ đơn của store được gán (REQ-400, REQ-004). Staff nhiều store dùng `▾` đổi store; API kiểm lại qua `store_staff`.
- Polling 7s như khách; có "Cập nhật lúc" + `[⟳]`. Không hứa realtime.
- `⚠` khi đơn ở `READY` quá 10 phút — chỉ là gợi ý thị giác, không phải trạng thái mới (xem Q01-01 còn mở).
- Mobile: 4 cột thành 4 section xếp dọc, cuộn dọc.

**Nút trên card chỉ là transition hợp lệ của đúng trạng thái đó** (REQ-402). Không có nút nhảy bước, không có nút lùi:

| Trạng thái đơn | Nút hiện trên card | Ghi chú |
|---|---|---|
| `PLACED` | `[Xác nhận]`, `[Từ chối]` | `[Từ chối]` bắt buộc mở dialog nhập lý do |
| `CONFIRMED` | `[Pha chế]` | Không còn nút Từ chối (rule chỉ cho reject ở `PLACED`) |
| `PREPARING` | `[Sẵn sàng]` | |
| `READY` + payment `UNPAID` | `[Thu tiền]` **(nút chính)**, `[Hoàn tất]` **disabled** | Hover/focus nút disabled: "Cần thu tiền trước khi hoàn tất." (REQ-407) |
| `READY` + payment `PAID` | `[Hoàn tất]` | |
| Terminal | Không có nút nào | Chỉ xem |

Nút `[Thu tiền]` cũng hiện ở `CONFIRMED`/`PREPARING` (thu trước lúc bàn giao được), nhưng **không** hiện ở `PLACED` (REQ-405, quyết định D01-04).

### 10.2 Chi tiết đơn `/staff/orders/[id]`

```
┌───────────────────────────────────────────────────────────────┐
│ ← CF-240109-0042            SẴN SÀNG     Cửa hàng Quận 1      │
├───────────────────────────────────────┬───────────────────────┤
│ Món                                   │ Thanh toán            │
│ 2× Cà phê sữa đá (M)         90.000 ₫│ Trả tại quầy          │
│    Đá bình thường, Thạch cà phê       │ CHƯA THU TIỀN         │
│    📝 "ít ngọt giúp mình"             │ Cần thu: 160.000 ₫    │
│ 1× Cà phê sữa đá (L)         45.000 ₫│                       │
│    Ít đá                              │ [ 💰 Thu tiền ]       │
│ 1× Bánh mì chả               25.000 ₫│                       │
│ ─────────────────────────────────────  │ ─────────────────────│
│ Tổng                        160.000 ₫│ Trạng thái đơn        │
│                                       │                       │
│ Người nhận                            │ [ Hoàn tất ]  ✕       │
│ Nguyễn Văn Minh · 0901234567          │ ⓘ Cần thu tiền trước  │
│ 📝 "mình đến khoảng 14:45"            │                       │
├───────────────────────────────────────┴───────────────────────┤
│ Diễn biến                                                     │
│ 14:35  Đang pha chế → Sẵn sàng      Hùng (STAFF)             │
│ 14:33  Đã xác nhận → Đang pha chế   Hùng (STAFF)             │
│ 14:32  Đã gửi đơn → Đã xác nhận     Hùng (STAFF)             │
│ 14:32  Tạo đơn                       Nguyễn Văn Minh          │
└───────────────────────────────────────────────────────────────┘
```

- Timeline hiện **actor** của mỗi lần chuyển (từ `order_status_history.actor_id`) — staff cần biết ai làm (REQ-401).
- Ghi chú của khách hiện nổi bật với icon 📝, không bị cắt chữ.

### 10.3 Dialog thu tiền (REQ-405, REQ-406)

```
┌──────────────────────────────────┐
│ Thu tiền đơn CF-240109-0042      │
│                                  │
│ Số tiền cần thu                  │
│       160.000 ₫                  │  ← chỉ đọc, từ payments.amount_vnd
│                                  │
│ Hình thức: Trả tại quầy          │
│                                  │
│ ⚠ Chỉ bấm sau khi đã nhận đủ    │
│   tiền. Thao tác này được ghi    │
│   lại kèm tên bạn và thời điểm.  │
│                                  │
│      [Huỷ]  [Đã nhận đủ tiền]   │
└──────────────────────────────────┘
```

- Số tiền **không cho sửa** — tránh lệch với `amount_vnd` của payment.
- Gửi kèm expected payment version. `409` → "Đơn này vừa được thu tiền bởi người khác." + refetch, dialog tự đóng, badge đổi sang `ĐÃ THU`.
- Sau khi `PAID`: khối thanh toán đổi thành `ĐÃ THU TIỀN · Hùng · 14:50`, nút `[Thu tiền]` biến mất, nút `[Hoàn tất]` bật lên.

### 10.4 Dialog từ chối đơn (REQ-404)

```
┌──────────────────────────────────┐
│ Từ chối đơn CF-240109-0045       │
│                                  │
│ Lý do từ chối *                  │
│ ▾ Hết nguyên liệu                │  ← select lý do có sẵn
│   Cửa hàng quá tải               │
│   Sai thông tin liên hệ          │
│   Khác (tự nhập)                 │
│                                  │
│ Chi tiết (khách sẽ đọc được)     │
│ ┌──────────────────────────────┐ │
│ │ Hết trà sen vàng hôm nay     │ │
│ └──────────────────────────────┘ │
│                                  │
│ ⚠ Khách sẽ thấy lý do này.      │
│   Đơn chưa thu tiền nên không   │
│   phát sinh hoàn tiền.           │
│                                  │
│      [Huỷ]  [Từ chối đơn]       │
└──────────────────────────────────┘
```

- `[Từ chối đơn]` `disabled` tới khi có lý do. Thiếu lý do mà vẫn gửi được → server trả `400` và UI hiện lỗi dưới field.
- Chỉ render dialog này cho đơn `PLACED`.

### 10.5 Bật/tắt món `/staff/menu` (REQ-408)

```
┌───────────────────────────────────────────────────────────────┐
│ Menu · Cửa hàng Quận 1 ▾        [Tìm món…]                   │
├───────────────────────────────────────────────────────────────┤
│ Cà phê                                                        │
│  Cà phê sữa đá    S  [ON ]   M  [ON ]   L  [ON ]            │
│  Bạc xỉu          M  [ON ]   L  [ON ]                        │
│ Trà                                                           │
│  Trà sen vàng     M  [ON ]   L  [OFF] ⟳                      │  ← đang gửi
│ Bánh                                                          │
│  Bánh mì chả          [ON ]                                   │  ← 1 variant: không nhãn size
└───────────────────────────────────────────────────────────────┘
```

- Toggle theo **variant**, không theo product, vì `store_variants` ở mức variant.
- Optimistic update + `⟳` nhỏ; lỗi thì bật lại giá trị cũ kèm toast "Không cập nhật được Trà sen vàng (L). Thử lại."
- Toggle này **không đổi giá** và không đổi dữ liệu catalog (REQ-408).
- Món 1 variant: chỉ một toggle, không hiện nhãn size.

### 10.6 Trạng thái màn staff

| Trạng thái | Hiển thị |
|---|---|
| Loading | Skeleton 2 card mỗi cột |
| Empty | Mỗi cột rỗng hiện "Chưa có đơn" nhạt. Cả bảng rỗng: "Chưa có đơn nào hôm nay." |
| Error | Banner trên bảng "Không tải được danh sách đơn." + `[Thử lại]`; dữ liệu cũ giữ nguyên nếu có |
| Unauthorized (401) | Redirect `/login?next=/staff/orders` |
| Forbidden (403 — CUSTOMER vào `/staff/*`) | Màn "Bạn không có quyền truy cập khu vực này." + `[Về menu]`. Không tiết lộ có bao nhiêu đơn hay store nào |
| Mở đơn của store khác (403/404) | "Không tìm thấy đơn này trong cửa hàng của bạn." Không hiện PII của đơn đó (REQ-004) |
| Transition `409 INVALID_TRANSITION` | Toast "Trạng thái đơn đã thay đổi." + refetch đơn, render lại đúng bộ nút |
| Transition `409 VERSION_CONFLICT` | Toast "Người khác vừa cập nhật đơn này." + refetch (REQ-403) |

---

## 11. Phiên hết hạn (session expired)

Áp dụng mọi màn (REQ-002). Khi bất kỳ request trả `401`:

| Ngữ cảnh | Hành vi |
|---|---|
| Đang xem màn chỉ đọc (menu, lịch sử, tracking) | Thử refresh session một lần qua Supabase client. Thành công → refetch im lặng. Thất bại → chuyển `/login?next=<đường dẫn hiện tại>` |
| Đang ở giữa một mutation (đặt đơn, hủy, transition, thu tiền) | **Không** tự chuyển trang. Hiện dialog: "Phiên đăng nhập đã hết. Đăng nhập lại để tiếp tục." với `[Đăng nhập]` / `[Để sau]`. Lý do: tránh mất dữ liệu form và tránh khách tưởng đơn đã gửi |
| Giỏ hàng | **Không bị xoá** khi hết phiên (lưu ở client, REQ-705) |
| Form checkout | Giữ nguyên nội dung; sau khi đăng nhập lại quay về `/checkout` và quote lại (`Idempotency-Key` sinh mới cùng quote mới) |
| Màn staff/admin | Chuyển `/login?next=...`; sau khi đăng nhập, nếu role không còn đủ quyền → màn 403 ở mục 10.6 |

Thông báo cho khách không nhắc token, JWT, issuer, audience hay tên provider (REQ-703).

---

## 12. Màn hình quản trị

### 12.1 Danh mục `/admin/categories`

```
┌───────────────────────────────────────────────────────────────┐
│ Danh mục                                   [+ Thêm danh mục] │
├────┬──────────────┬───────────────┬────────┬─────────┬───────┤
│ ⇅  │ Tên          │ Slug          │ Số món │ Hiển thị│       │
├────┼──────────────┼───────────────┼────────┼─────────┼───────┤
│ ⠿  │ Cà phê       │ ca-phe        │ 8      │ [ON ]   │ [Sửa] │
│ ⠿  │ Trà          │ tra           │ 6      │ [ON ]   │ [Sửa] │
│ ⠿  │ Đá xay       │ da-xay        │ 4      │ [ON ]   │ [Sửa] │
│ ⠿  │ Bánh         │ banh          │ 5      │ [OFF]   │ [Sửa] │
└────┴──────────────┴───────────────┴────────┴─────────┴───────┘
```

- `⠿` kéo thả đổi `sort_order`; có cả nút ↑/↓ cho bàn phím (không chỉ dựa vào drag).
- `Hiển thị` = `is_active`. **Không có nút Xoá** (REQ-603, REQ-307). Tooltip khi hover vùng đó: "Danh mục được ẩn thay vì xoá để giữ nguyên các đơn cũ."
- Slug trùng → lỗi dưới field: "Slug này đã được dùng." (REQ-600)

### 12.2 Món `/admin/products` và `/admin/products/[id]`

```
┌───────────────────────────────────────────────────────────────┐
│ Món                [Tìm…] [Danh mục: tất cả ▾]   [+ Thêm món]│
├─────────┬────────────────┬──────────┬────────────┬───────┬────┤
│ Ảnh     │ Tên            │ Danh mục │ Giá        │ Hiện  │    │
├─────────┼────────────────┼──────────┼────────────┼───────┼────┤
│ [img]   │ Cà phê sữa đá  │ Cà phê   │ 29–45.000₫ │ [ON ] │ →  │
│ [img]   │ Bạc xỉu        │ Cà phê   │ 35–45.000₫ │ [ON ] │ →  │
│ [img]   │ Bánh mì chả    │ Bánh     │ 25.000 ₫   │ [ON ] │ →  │
└─────────┴────────────────┴──────────┴────────────┴───────┴────┘
```

Chi tiết món — 3 khối:

```
┌───────────────────────────────────────────────────────────────┐
│ ← Cà phê sữa đá                               [Lưu thay đổi] │
├───────────────────────────────────────────────────────────────┤
│ ① Thông tin                                                   │
│ Tên *          [ Cà phê sữa đá            ]                   │
│ Slug *         [ ca-phe-sua-da            ]                   │
│ Danh mục *     [ Cà phê                 ▾ ]                   │
│ Mô tả          [ Đậm, ngọt vừa            ]                   │
│ Ảnh            [img]  [Tải ảnh lên]                           │
│ Hiển thị       [ON ]                                          │
├───────────────────────────────────────────────────────────────┤
│ ② Size và giá                                   [+ Thêm size] │
│ ┌──────┬───────────┬───────────┬───────┬─────────┬──────────┐ │
│ │ Size │ SKU       │ Giá (VND) │ Hiện  │         │          │ │
│ ├──────┼───────────┼───────────┼───────┼─────────┼──────────┤ │
│ │ S    │ CFSD-S    │    29000  │ [ON ] │ [Sửa]   │          │ │
│ │ M    │ CFSD-M    │    35000  │ [ON ] │ [Sửa]   │          │ │
│ │ L    │ CFSD-L    │    45000  │ [ON ] │ [Sửa]   │          │ │
│ └──────┴───────────┴───────────┴───────┴─────────┴──────────┘ │
│ ⓘ Giá là số nguyên VND, không nhập dấu chấm hay số thập phân. │
│ ⓘ Đổi giá chỉ áp cho đơn mới. Đơn cũ giữ nguyên giá đã chốt.  │
├───────────────────────────────────────────────────────────────┤
│ ③ Nhóm tuỳ chọn áp dụng cho món này                           │
│ [✓] Mức đá        chọn 1          (bắt buộc)                  │
│ [✓] Topping       chọn tối đa 2                               │
│ [ ] Độ ngọt       chọn 1                                      │
│ [ ] Loại sữa      chọn 1                                      │
│ ⓘ Nhóm tuỳ chọn áp dụng cho mọi size của món này.             │
└───────────────────────────────────────────────────────────────┘
```

- Khối ② cho phép **1 hoặc nhiều** size. Món bánh chỉ cần 1 dòng; UI không ép phải có S/M/L và không tự tạo sẵn 3 dòng.
- `UNIQUE(product_id,size)`: thêm size trùng → "Món này đã có size M." (REQ-601)
- Giá: input numeric, chặn nhập dấu chấm/phẩy/thập phân, hiện preview `35.000 ₫` bên cạnh. Giá < 0 → lỗi field.
- Khối ③ gửi `PUT /v1/admin/products/:id/modifier-groups` (replace cả tập). Có banner cảnh báo khi bỏ tick một nhóm đang có option được dùng: "Bỏ nhóm này sẽ làm khách không chọn được Topping cho món. Đơn cũ không bị ảnh hưởng." (REQ-602, REQ-306)

### 12.3 Modifier `/admin/modifiers`

```
┌───────────────────────────────────────────────────────────────┐
│ Nhóm tuỳ chọn                               [+ Thêm nhóm]    │
├───────────────────────────────────────────────────────────────┤
│ ▾ Mức đá            chọn 1 (min 1 · max 1)         [Sửa nhóm]│
│     Đá bình thường          +0 ₫        [ON ]      [Sửa]     │
│     Ít đá                   +0 ₫        [ON ]      [Sửa]     │
│     Không đá                +0 ₫        [ON ]      [Sửa]     │
│                                           [+ Thêm tuỳ chọn]  │
│ ▸ Topping           chọn 0–2                       [Sửa nhóm]│
│ ▸ Độ ngọt           chọn 1 (min 1 · max 1)         [Sửa nhóm]│
└───────────────────────────────────────────────────────────────┘
```

Form sửa nhóm:
```
Tên nhóm *        [ Topping              ]
Chọn tối thiểu *  [ 0 ]
Chọn tối đa *     [ 2 ]
ⓘ Chọn tối đa phải ≥ chọn tối thiểu.
ⓘ Tối thiểu > 0 nghĩa là khách buộc phải chọn.
```
- `max_select < min_select` → lỗi field ngay trên client **và** server trả `400` (REQ-602). Client validation chỉ để UX; server là nguồn chuẩn.
- Option trùng tên trong cùng nhóm → "Nhóm này đã có tuỳ chọn tên này."
- Phụ phí là integer VND ≥ 0, preview `+10.000 ₫`.

### 12.4 Nhân viên `/admin/staff`

```
┌───────────────────────────────────────────────────────────────┐
│ Nhân viên                                   [+ Gán nhân viên]│
├──────────────────┬──────────────┬──────────────────┬──────────┤
│ Người dùng       │ Vai trò      │ Cửa hàng được gán│          │
├──────────────────┼──────────────┼──────────────────┼──────────┤
│ Trần Văn Hùng    │ STAFF        │ Quận 1           │ [Bỏ gán] │
│ Lê Thị Mai       │ STAFF        │ Quận 1           │ [Bỏ gán] │
│ Admin Demo       │ ADMIN        │ (toàn hệ thống)  │     —    │
└──────────────────┴──────────────┴──────────────────┴──────────┘
```
- Gán staff = tạo bản ghi `store_staff`. Không có ô "tự chọn role" ở luồng đăng ký công khai; nâng role là thao tác của admin (REQ-001, REQ-004).
- Hiện rõ: "Nhân viên chỉ xử lý được đơn của cửa hàng được gán."

### 12.5 Trạng thái màn admin

| Trạng thái | Hiển thị |
|---|---|
| Loading | Skeleton 5 dòng bảng |
| Empty | "Chưa có món nào." + `[+ Thêm món]` |
| Error | Banner "Không tải được dữ liệu." + `[Thử lại]` |
| Unauthorized (401) | Redirect `/login?next=<path>` |
| Forbidden (403 — STAFF vào `/admin/*`) | "Khu vực này chỉ dành cho quản trị viên." + `[Về bảng đơn]` |
| Đang lưu | Nút `[Lưu thay đổi]` → `[Đang lưu…]` disabled; form fields readonly |
| Lưu lỗi validation | Lỗi gắn từng field, focus field đầu tiên, banner trên form đếm số lỗi: "Còn 2 mục chưa hợp lệ." |
| Lưu thành công | Toast xanh "Đã lưu." + dữ liệu refetch |

---

## 13. Walkthrough

### 13.1 Luồng chính — menu đến `COMPLETED`

| # | Màn / actor | Hành động | Kết quả quan sát được | REQ |
|---|---|---|---|---|
| 1 | `/` · khách | Mở trang, chọn store Quận 1 | Menu 4 danh mục; Trà sen vàng (L) hiện "Hết hàng", `[+]` disabled | REQ-100, REQ-101 |
| 2 | `/` · khách | Bấm `[+]` ở Cà phê sữa đá | Dialog mở; Size M chọn sẵn; nhóm "Mức đá" radio bắt buộc; "Topping" checkbox tối đa 2 | REQ-203 |
| 3 | dialog · khách | Chọn M + Đá bình thường + Thạch cà phê, note "ít ngọt giúp mình", số lượng 2 | Nút hiện `[Thêm vào giỏ · 90.000 ₫]` | REQ-201 |
| 4 | dialog · khách | Thêm tiếp Cà phê sữa đá size L, và Bánh mì chả (không có khối Size) | Giỏ 3 dòng riêng biệt, badge `[🛒 3]` | REQ-204 |
| 5 | reload trang | F5 | Giỏ còn nguyên 3 dòng | REQ-705 |
| 6 | `/cart` · khách | Bấm "Tiếp tục đặt món" (chưa đăng nhập) | Chuyển `/login?next=/checkout`; giỏ không mất | REQ-705 |
| 7 | `/login` · khách | Đăng nhập | Về `/checkout`; `GET /me` trả `role: CUSTOMER` | REQ-001 |
| 8 | `/checkout` · khách | Màn tự gọi quote | Tổng `160.000 ₫` từ server; đếm ngược "Giá giữ đến 14:37" | REQ-205 |
| 9 | `/checkout` · khách | Bấm `[Đặt món]` | Nút → `[⟳ Đang gửi đơn…]` disabled; `POST /orders` kèm `Idempotency-Key` | REQ-300, REQ-301 |
| 10 | `/orders/[id]` · khách | Nhận `201` | Banner "Đã gửi đơn tới cửa hàng!", mã `CF-240109-0042`, trạng thái `ĐÃ GỬI ĐƠN`, thanh toán `CHƯA THU TIỀN`; giỏ đã xoá | REQ-300 |
| 11 | `/staff/orders` · Hùng | Mở bảng đơn | Đơn nằm cột MỚI, có `[Xác nhận]` và `[Từ chối]`, **không** có `[Pha chế]` hay `[Thu tiền]` | REQ-400, REQ-402, REQ-405 |
| 12 | staff | Bấm `[Xác nhận]` | Đơn sang cột ĐÃ XÁC NHẬN; card hiện `[Pha chế]` + `[Thu tiền]`; nút `[Từ chối]` biến mất | REQ-401 |
| 13 | `/orders/[id]` · khách | Chờ ≤7s hoặc bấm `[⟳ Làm mới]` | Badge thành `ĐÃ XÁC NHẬN`; timeline thêm 1 dòng; nút `[Hủy đơn này]` **biến mất** kèm chú thích | REQ-503, REQ-504 |
| 14 | staff | `[Pha chế]` → `[Sẵn sàng]` | Đơn sang cột SẴN SÀNG; card hiện `[Thu tiền]` (chính) và `[Hoàn tất]` **disabled** | REQ-401, REQ-407 |
| 15 | staff | Hover `[Hoàn tất]` disabled | Tooltip "Cần thu tiền trước khi hoàn tất." | REQ-407 |
| 16 | staff | `[Thu tiền]` → `[Đã nhận đủ tiền]` | Khối thanh toán → `ĐÃ THU TIỀN · Hùng · 14:50`; `[Hoàn tất]` bật lên | REQ-405 |
| 17 | staff | `[Hoàn tất]` | Đơn rời bảng; trạng thái `COMPLETED` | REQ-407 |
| 18 | `/orders/[id]` · khách | Lần polling kế tiếp | Badge `ĐÃ HOÀN TẤT` + `ĐÃ THANH TOÁN · 14:52`; **polling dừng**; dòng "Cập nhật lúc" biến mất; hiện `[Đặt lại đơn này]` | REQ-503 |
| 19 | `/orders` · khách | Mở lịch sử | Đơn hiện `ĐÃ HOÀN TẤT`, `3 món · 160.000 ₫` | REQ-500 |

### 13.2 Nhánh hủy

| # | Màn / actor | Hành động | Kết quả | REQ |
|---|---|---|---|---|
| 1 | `/orders/[id]` · khách | Đơn đang `PLACED`, bấm `[Hủy đơn này]` | Dialog nêu rõ "Bạn chưa trả tiền nên không phát sinh hoàn tiền" | REQ-504 |
| 2 | dialog | `[Xác nhận hủy]` | Badge `ĐÃ HỦY`; polling dừng; không còn nút hành động; timeline ghi actor là khách | REQ-504 |
| 3 | `/staff/orders` | Staff refetch | Đơn rời cột MỚI | REQ-400 |
| 4 | **đua** — staff vừa `[Xác nhận]` trước khi khách bấm hủy | Khách `[Xác nhận hủy]` | `409` → "Nhân viên vừa xác nhận đơn nên không hủy được nữa."; refetch; nút hủy ẩn | REQ-504, REQ-403 |

### 13.3 Nhánh từ chối

| # | Màn / actor | Hành động | Kết quả | REQ |
|---|---|---|---|---|
| 1 | `/staff/orders` · Hùng | Đơn `PLACED`, bấm `[Từ chối]` | Dialog lý do mở; `[Từ chối đơn]` disabled vì chưa có lý do | REQ-404 |
| 2 | dialog | Chọn "Hết nguyên liệu", nhập chi tiết | Nút bật lên; cảnh báo "Khách sẽ thấy lý do này" | REQ-404 |
| 3 | dialog | `[Từ chối đơn]` | Đơn rời bảng; trạng thái `REJECTED` | REQ-404 |
| 4 | `/orders/[id]` · khách | Polling kế tiếp | Badge đỏ `CỬA HÀNG TỪ CHỐI` + khối "Lý do: hết trà sen vàng hôm nay"; polling dừng | REQ-404, REQ-503 |
| 5 | staff · đơn đã `CONFIRMED` | Tìm nút từ chối | **Không có nút** — reject chỉ ở `PLACED` | REQ-402, REQ-404 |

### 13.4 Nhánh giá đổi giữa lúc checkout

| # | Hành động | Kết quả | REQ |
|---|---|---|---|
| 1 | Khách đang ở `/checkout`, admin đổi giá size M từ 35.000 lên 40.000 | Màn checkout chưa biết; đếm ngược vẫn chạy | — |
| 2 | Khách bấm `[Đặt món]` | `409 PRICE_CHANGED` → banner "Giá vừa thay đổi. Tổng mới là **170.000 ₫** (trước đó 160.000 ₫)." Đơn **chưa** được tạo | REQ-206 |
| 3 | Khách bấm `[Xem và xác nhận]` | Quote mới, nút đổi nhãn `[Đặt món · 170.000 ₫]`, `Idempotency-Key` mới | REQ-206 |
| 4 | Khách bấm nút đó | Đơn tạo với tổng 170.000 ₫ | REQ-300 |
| 5 | Để quote quá 5 phút rồi bấm `[Đặt món]` | `410 QUOTE_EXPIRED` → "Giá đã hết hiệu lực." + `[Cập nhật giá]`; không tạo đơn | REQ-206 |
| 6 | Mất mạng lúc gửi, bấm `[Thử lại]` | Cùng `Idempotency-Key` → server trả `200` với đúng đơn đã tạo; UI vào tracking, **không** có đơn thứ hai | REQ-302 |

### 13.5 Nhánh phiên hết hạn

| # | Ngữ cảnh | Hành động | Kết quả | REQ |
|---|---|---|---|---|
| 1 | Khách để tab mở qua đêm, mở `/orders` | Request trả `401` | Thử refresh session 1 lần; thất bại → `/login?next=/orders` | REQ-002 |
| 2 | Khách đang ở `/checkout` đã điền form, bấm `[Đặt món]` | `401` | Dialog "Phiên đăng nhập đã hết..." — **không** chuyển trang, **không** mất form, **không** mất giỏ | REQ-002, REQ-705 |
| 3 | Khách bấm `[Đăng nhập]` trong dialog | Đăng nhập xong | Về `/checkout`, form còn nguyên, quote lại, `Idempotency-Key` mới | REQ-205 |
| 4 | Staff đang mở `/staff/orders`, token hết hạn | Lần polling kế tiếp `401` | `/login?next=/staff/orders` | REQ-002 |
| 5 | Admin hạ role Hùng xuống CUSTOMER, Hùng đăng nhập lại | Vào `/staff/orders` | Màn 403 "Bạn không có quyền truy cập khu vực này." Không hiện số đơn hay tên store | REQ-003, REQ-004 |
| 6 | Khách B dán link `/orders/<id>` của khách A | Mở link | "Không tìm thấy đơn này." Không hiện tên, món, tổng tiền của A | REQ-502 |

---

## 14. Kiểm tra: không lộ cấu hình kỹ thuật cho khách

Rà soát toàn bộ text hướng tới khách trong tài liệu này (REQ-703):

| Hạng mục | Kết luận |
|---|---|
| Mã lỗi kỹ thuật (`QUOTE_EXPIRED`, `VERSION_CONFLICT`, …) | Không hiện cho khách. Mỗi mã map sang một câu tiếng Việt ở mục 7.4 và 8.3 |
| HTTP status | Không hiện số (`409`, `500`) trong UI khách |
| `requestId` | Chỉ hiện ở màn lỗi 5xx, dưới nhãn "Mã tham chiếu", để khách đọc cho nhân viên |
| Tên bảng / cột / SQL | Không xuất hiện trong text UI |
| Tên biến môi trường, URL API, tên provider auth | Không xuất hiện trong text UI |
| Token / JWT / issuer / audience | Không nhắc trong thông báo phiên hết hạn |
| `storeId`, `variantId`, `quoteId`, UUID | Không hiện cho khách. Khách chỉ thấy `orders.code` dạng `CF-240109-0042` |
| Stack trace | Không bao giờ |
| Text staff/admin | Được phép dùng từ nghiệp vụ (trạng thái, version conflict diễn giải thành "Người khác vừa cập nhật đơn này") nhưng vẫn không hiện SQL/stack |

---

## 15. Dữ liệu mẫu dùng trong wireframe và mockup

Toàn bộ là **dữ liệu giả cho demo**, không phải menu/giá/khách hàng thật.

| Loại | Giá trị mẫu |
|---|---|
| Store | `Cửa hàng Quận 1` · `12 Nguyễn Huệ, Quận 1` (địa chỉ giả) |
| Danh mục | Cà phê, Trà, Đá xay, Bánh |
| Món nhiều size | Cà phê sữa đá (S 29.000 / M 35.000 / L 45.000), Bạc xỉu (M 35.000 / L 45.000), Trà sen vàng (M 45.000 / L 55.000) |
| Món một size | Bánh mì chả 25.000 |
| Nhóm modifier | Mức đá (min 1, max 1, phụ phí 0), Topping (min 0, max 2: Thạch cà phê +10.000, Kem phô mai +15.000, Trân châu +10.000), Độ ngọt (min 1, max 1) |
| Khách | Nguyễn Văn Minh · 0901234567 (giả) |
| Nhân viên | Trần Văn Hùng (STAFF), Lê Thị Mai (STAFF), Admin Demo (ADMIN) |
| Mã đơn | `CF-240109-0042` — định dạng mã đơn chốt ở bước 04 (Q01-04) |
| Tổng đơn mẫu | 160.000 ₫ = 2×45.000 + 45.000 + 25.000 |

---

## 16. Mockup HTML

`docs/mockups/index.html` — một file tĩnh, tự chứa, không dependency, mở trực tiếp bằng browser.

Nội dung: **11 panel**, mỗi panel có nhãn route và REQ liên quan:

1. Menu `/` — có món hết hàng bị khóa
2. Dialog chi tiết món — size, radio/checkbox theo min/max, note, quantity
3. Giỏ hàng `/cart` — 3 dòng riêng, nhãn "Tạm tính"
4. Checkout `/checkout` — quote, đếm ngược, tổng từ server
5. Checkout khi giá đổi — banner `PRICE_CHANGED`, nút "Đang gửi…" disabled, màn lỗi 5xx có mã tham chiếu
6. Xác nhận + tracking `/orders/[id]` — timeline, "Cập nhật lúc", nút hủy mờ
7. Lịch sử đơn `/orders` — 4 đơn ở 4 trạng thái
8. Dialog thu tiền + dialog từ chối (staff)
9. Bảng đơn `/staff/orders` — 4 cột, nút theo trạng thái, `[Hoàn tất]` disabled khi chưa thu tiền
10. Bật/tắt món `/staff/menu` — toggle theo variant, món một size hiện "—"
11. Admin chi tiết món `/admin/products/[id]` — 3 khối: thông tin, size và giá, nhóm tuỳ chọn

Giới hạn cần nói rõ:
- Mockup **không có JavaScript, không gọi API, không có state**. Nút không bấm được. Nó là ảnh tĩnh dựng bằng HTML/CSS để xem bố cục và khoảng cách, **không phải** bản demo chức năng.
- Mockup **không** nằm trong `apps/web`; nó là tài liệu, sẽ không được build hay deploy.
- Component thật ở bước sau dùng shadcn/ui + Tailwind, nên chi tiết thị giác (bán kính, màu, font) sẽ khác mockup.

---

## 17. Chưa thuộc bước này

Bước 02 không tạo code trong `apps/web`, không cài Tailwind/shadcn, không có component React nào. Không chạy được luồng nào trong mục 13 — đó là kịch bản kiểm thử sẽ hiện thực ở bước 06–09 và kiểm ở bước 10 (T11, T12).
