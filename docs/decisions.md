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

---

## Bước 03 — Tra phiên bản từ registry (2026-10-09)

Số liệu dưới đây **đọc trực tiếp từ npm registry** bằng `npm view <pkg> version` và `npm view <pkg> engines`, không lấy từ trí nhớ. Chưa cài được gói nào nên đây là **ứng viên đã xác minh ở mức metadata**, chưa xác minh bằng install/build.

### Yêu cầu Node của từng dòng gói

| Gói | Bản stable mới nhất | `engines.node` |
|---|---|---|
| `next` | 16.4.0 | `>=20.9.0` |
| `next` (dòng trước) | 15.5.27 | `^18.18.0 \|\| ^19.8.0 \|\| >= 20.0.0` |
| `react` | 19.3.0 | `>=0.10.0` |
| `@nestjs/core` | 12.1.2 | `>= 20` |
| `@nestjs/cli` | 12.0.8 | `>= 20.11` |
| `@nestjs/cli` (dòng trước) | 11.0.24 | `>= 20.11` |
| `prisma` | **8.0.0-rc.22 là pre-release** | — |
| `prisma` (stable, dist-tag `prev`) | 7.10.0 | `^20.19 \|\| ^22.12 \|\| >=24.0` |
| `typescript` | **7.0.2 (dòng compiler mới)** | `>=16.20.0` |
| `typescript` (dòng 5.x) | 5.9.3 | — |
| `tailwindcss` | 4.3.3 | không khai báo |
| `pnpm` | 12.10.1 | `>=18.*` |

### Môi trường hiện tại

| Thành phần | Phiên bản trên máy |
|---|---|
| Node | **16.20.1** (đã EOL từ 2023-09) |
| npm | 8.19.4 |
| pnpm | chưa cài |
| corepack | 0.17.0 |
| Version manager (nvm/fnm/volta/nvs) | không có |

### Kết luận

Node 16.20.1 **không đáp ứng** bất kỳ lựa chọn nào của stack đã chốt ở `tech.md`:
- `pnpm` cần `>=18` → không chạy được package manager của monorepo.
- `next` 15 cần `>=18.18`, `next` 16 cần `>=20.9` → không cài được frontend.
- `@nestjs/cli` cả dòng 11 và 12 đều cần `>=20.11` → không scaffold được backend.
- `prisma` 7.10.0 cần `^20.19 || ^22.12 || >=24` → bước 04 cũng sẽ bị chặn.

Hạ xuống Next 13 / Nest 9 để chạy trên Node 16 **không** được chọn: các dòng đó đã hết hỗ trợ bảo mật, không tương thích Tailwind 4 / shadcn hiện tại, và đi ngược quy tắc "chọn phiên bản stable tương thích" trong `tech.md`.

### Phiên bản đề xuất (chốt sau khi install thành công)

| Thành phần | Phiên bản đề xuất | Lý do |
|---|---|---|
| Node | **22 LTS** | Thoả đồng thời `next` ≥20.9, `@nestjs/cli` ≥20.11 và `prisma` `^22.12`. Node 20.19+ cũng đủ nhưng 22 LTS có thời gian hỗ trợ dài hơn |
| pnpm | 12.10.1 qua corepack | Theo `tech.md`; bật bằng corepack đi kèm Node để không cài global thủ công |
| TypeScript | **5.9.3**, không dùng 7.0.2 | NestJS phụ thuộc decorator + `emitDecoratorMetadata`; dòng compiler 7 là thay đổi lớn, chưa xác minh với Nest 12 |
| Prisma | **7.10.0**, không dùng tag `latest` | `latest` đang trỏ `8.0.0-rc.22` là pre-release; không đưa RC vào bài cuối khóa |
| Next.js | 16.4.0 (dự phòng 15.5.27) | Lấy stable mới nhất; nếu gặp xung đột với Tailwind 4 / shadcn thì lùi về dòng 15 và ghi lại lý do |
| NestJS | 12.1.2 | Stable mới nhất, khớp Node 22 |
| Tailwind | 4.3.3 | Stable mới nhất |

Các số này sẽ được **ghim chính xác** trong `package.json` và cố định bằng lockfile commit vào repo, đúng yêu cầu `tech.md` (không dùng `@latest` trong Dockerfile production, không tự nâng major khi làm feature).

> **Cập nhật — mục này đã bị thay thế.** Người dùng đã cài **Node 24.20.0**, chặn được mở. Khi cài thật, hai đề xuất trong bảng trên tỏ ra sai và đã bị sửa: dòng **NestJS 12 là ESM-only** nên chốt NestJS 11 + CommonJS, và **toàn bộ ESLint 9.x đã deprecated** nên nâng lên ESLint 10. Bảng phiên bản có hiệu lực nằm ở mục **“Bước 03 — Phiên bản đã chốt”** bên dưới. Giữ lại mục này làm hồ sơ vì nó ghi `engines.node` thật của từng dòng gói và lý do không hạ cấp xuống Next 13 / Nest 9.

---

## Bước 03 — Phiên bản đã chốt (2026-10-09)

Toàn bộ số dưới đây **đã cài và chạy được**: `pnpm install --frozen-lockfile`, `lint`, `typecheck`, `build`, `test` đều exit 0, và web gọi được `/v1/health` thật. `pnpm-lock.yaml` được commit.

### Toolchain

| Thành phần | Phiên bản | Ghi chú |
|---|---|---|
| Node | **24.20.0** | Thoả engines của mọi gói dưới đây. `corepack enable pnpm` thất bại vì `EPERM` trên `C:\Program Files\nodejs` (phiên không có quyền admin), nên pnpm được cài bằng `npm i -g pnpm@12.10.1` vào prefix của user. |
| pnpm | **12.10.1** | Ghi trong `packageManager` của root `package.json`. |
| TypeScript | **5.9.3** | Dùng chung cho cả 3 workspace. |

### apps/api

| Gói | Phiên bản |
|---|---|
| `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/testing` | 11.2.7 |
| `@nestjs/config` | 4.0.4 |
| `@nestjs/swagger` | 11.4.7 |
| `@nestjs/cli` | 11.0.24 |
| `@nestjs/schematics` | 11.1.0 |
| `class-validator` / `class-transformer` | 0.15.1 / 0.5.1 |
| `reflect-metadata` / `rxjs` | 0.2.2 / 7.8.2 |
| `jest` / `ts-jest` / `supertest` | 30.5.2 / 29.4.14 / 7.3.1 |
| `eslint` / `typescript-eslint` | 10.12.0 / 8.71.1 |

### apps/web

| Gói | Phiên bản |
|---|---|
| `next` / `react` / `react-dom` | 16.4.0 / 19.3.0 / 19.3.0 |
| `tailwindcss` / `@tailwindcss/turbopack` | 4.3.3 / 4.3.3 |
| `@tanstack/react-query` | 5.104.1 |
| `clsx` / `tailwind-merge` | 2.1.1 / 3.7.0 |
| `eslint` / `eslint-config-next` | 10.12.0 / 16.4.0 |

### Ba phát hiện làm đổi lựa chọn ban đầu

| # | Phát hiện (có bằng chứng) | Hệ quả |
|---|---|---|
| F03-01 | **Dòng NestJS 12 là ESM-only.** `@nestjs/common@12.1.2` có `"type": "module"` và `exports` không có điều kiện `require`; `@nestjs/cli@12.0.8` phụ thuộc `typescript ~6.0.2` và `@nestjs/schematics ^12`. Thử Nest 12 + CommonJS cho `error TS1479` ở mọi import. Dòng 11 (`@nestjs/common@11.2.7`) là `commonjs`. | **Chốt NestJS 11.2.7 + CommonJS + TypeScript 5.9.3.** Đi ESM sẽ kéo theo rewrite import có đuôi `.js`, cấu hình jest ESM (`--experimental-vm-modules`) và rủi ro với Prisma ở bước 04 — không đáng đổi trong lúc bootstrap. Nâng lên Nest 12 + ESM là một thay đổi riêng, phải có test kèm. |
| F03-02 | **Toàn bộ ESLint 9.x đã deprecated** (0/58 bản còn được hỗ trợ; registry trả thông báo "no longer supported"). Template của `create-next-app@16.4.0` vẫn ghim `eslint: ^9`. | **Nâng lên ESLint 10.12.0** ở cả hai app. Peer của `eslint-config-next@16.4.0` là `eslint >=9.0.0` và của `typescript-eslint@8.71.1` là `^8.57 \|\| ^9 \|\| ^10`, nên hợp lệ. `pnpm peers check` vẫn báo `eslint-plugin-import/jsx-a11y/react` muốn `^9` — **lint thực tế chạy exit 0**, nên giữ 10 và theo dõi khi Next cập nhật chuỗi plugin. |
| F03-03 | **`prisma@latest` đang trỏ `8.0.0-rc.22`** (pre-release) và **`typescript@latest` là `7.0.2`** (dòng compiler mới). | Bước 04 ghim `prisma`/`@prisma/client` **7.10.0** (dist-tag `prev`). TypeScript giữ 5.9.3. Không dùng `latest` ở đâu. |

### Quyết định cấu hình

| # | Quyết định | Lý do |
|---|---|---|
| D03-01 | `apps/api` dùng `module`/`moduleResolution` = **`node16`** thay vì `node10` | TS 6+ deprecate `node10` và `baseUrl`; `node16` vẫn emit CommonJS vì `package.json` không có `"type": "module"`. Đồng thời bỏ `baseUrl`, dùng `paths` tương đối. |
| D03-02 | `packages/contracts` build ra **CommonJS + `.d.ts`**, khai báo qua `exports` map | Một output đọc được từ cả NestJS (CJS) và bundler của Next, không cần dual build. Đã kiểm `dist/index.js` không chứa `require(` nào → browser-safe. |
| D03-03 | Dùng `const object` + union type thay vì `enum` trong contracts | Tương thích `isolatedModules`, tree-shake được ở web. |
| D03-04 | Tắt `cacheComponents` và `partialPrefetching` mà `create-next-app@16` bật sẵn | Hai cờ này đổi cách fetch dữ liệu phía server, trong khi dự án dùng TanStack Query ở client gọi API NestJS. Bật lại là quyết định riêng, cần test kèm. |
| D03-05 | `layout.tsx` khai báo props tường minh thay vì dùng global `LayoutProps` của Next | Global đó chỉ tồn tại sau khi Next sinh `.next/types`, nên `pnpm typecheck` chạy độc lập sẽ lỗi. Gate phải chạy được mà không cần build trước. |
| D03-06 | `/v1/ready` trả **503** khi `DATABASE_URL` chưa đặt | Readiness phải phản ánh đúng trạng thái. Bước 03 chưa có DB nên NOT_READY là kết quả đúng, không phải lỗi. Bước 04 đổi sang truy vấn thật. |
| D03-07 | **Không** gọi `.addServer("/v1")` trong Swagger | `setGlobalPrefix("v1")` đã đưa `/v1` vào từng path; thêm server `/v1` làm "Try it out" gọi `/v1/v1/...`. Đây là lỗi thật đã phát hiện qua smoke và đã sửa. |
| D03-08 | `CORS_ORIGINS=*` bị **từ chối khi khởi động** | API nhận `Authorization` header nên cần allowlist cụ thể. |
| D03-09 | `AppConfig` chỉ lưu `databaseConfigured: boolean`, **không** lưu giá trị `DATABASE_URL` | Giảm nguy cơ lộ connection string qua log hay response. Có test khẳng định điều này. |
| D03-10 | `allowBuilds` trong `pnpm-workspace.yaml` khai báo tường minh 4 gói | pnpm 12 chặn install script theo mặc định. `@scarf/scarf` là telemetry → chặn hẳn. `sharp`, `unrs-resolver`, `@parcel/watcher` dùng prebuilt nên không cần build từ nguồn. |
| D03-11 | Giữ `next-env.d.ts` trong `.gitignore` | Next sinh lại file này mỗi lần build; đây cũng là mặc định của Next. |

### Câu hỏi còn mở sau bước 03

| # | Câu hỏi | Trạng thái |
|---|---|---|
| Q03-01 | `packages/contracts` tiếp tục viết tay, hay sinh client types từ OpenAPI của Swagger kèm check drift? | Chưa chốt. Hiện viết tay. Cân nhắc lại ở bước 06 khi hợp đồng catalog ổn định. |
| Q03-02 | Khi nào nâng NestJS 11 → 12 (ESM)? | Chưa chốt. Chỉ làm sau khi có test tích hợp ở bước 10, như một thay đổi riêng. |
| Q03-03 | `pnpm` đang cài global qua npm vì `corepack enable` thiếu quyền admin. Có chuẩn hoá lại bằng corepack trong CI/Docker không? | Chốt ở bước 11 cùng Dockerfile. |
| Q03-04 | `eslint-plugin-*` của `eslint-config-next` chưa khai báo hỗ trợ ESLint 10. | Theo dõi; lint hiện chạy exit 0. Nếu vỡ thì lùi `apps/web` về ESLint 9 và ghi lại. |
| Q03-05 | Chưa có CI chạy các gate này tự động. | Chốt ở bước 11. |

---

## Bước 04 — Schema, migration, seed (2026-10-09)

Toàn bộ đã **chạy thật** trên PostgreSQL 16 (Docker): 2 migration áp dụng lên DB trống, seed idempotent, 7/7 integration test pass, `/v1/ready` trả READY qua `SELECT 1` thật.

### Phiên bản chốt (đã cài, lockfile commit)

| Gói | Phiên bản | Ghi chú |
|---|---|---|
| `prisma` / `@prisma/client` | **7.10.0** | Dùng dist-tag `prev` (stable). `latest` đang là `8.0.0-rc.22` (RC) — không dùng. |
| `@prisma/adapter-pg` | 7.10.0 | Prisma 7 **bắt buộc** driver adapter; postgres dùng adapter này. |
| `pg` / `@types/pg` | 8.23.1 | Driver mà adapter chạy trên đó. |
| `dotenv` | 18.0.6 | `prisma.config.ts` nạp `.env` khi chạy CLI local. |
| `tsx` | 4.23.15 | Chạy `seed.ts` (TypeScript) trực tiếp. |
| `cross-env` | 10.1.0 | Đặt `NODE_OPTIONS` cross-platform cho `test:int`. |
| Postgres (dev/test) | `postgres:16-alpine` | Docker, cổng 5434 (dev) / 5435 (test). |

### Prisma 7 là thay đổi lớn — 4 điều khác hẳn Prisma 6

| # | Khác biệt (xác nhận từ docs prisma.io v7 + lỗi thực tế) | Hệ quả |
|---|---|---|
| F04-01 | **`url` không còn trong datasource của schema.** Connection URL khai ở `prisma.config.ts` qua `defineConfig` + `env()`. | Thêm `apps/api/prisma.config.ts`; datasource chỉ còn `provider = "postgresql"`. |
| F04-02 | **PrismaClient bắt buộc driver adapter.** `new PrismaClient()` không adapter sẽ lỗi. | `PrismaService` dựng `new PrismaPg({connectionString})` và truyền `adapter`. |
| F04-03 | **Client sinh vào source**, không còn `node_modules/.prisma` mặc định; `output` là bắt buộc. | Generator `provider = "prisma-client"`, `output = "../src/generated/prisma"`; gitignore `apps/api/src/generated/`; CI/Docker phải `prisma generate` trước build. |
| F04-04 | Client sinh ra dùng **ESM import có đuôi `.js`**; ts-jest dưới `node16`/CommonJS không resolve được, và adapter cần dynamic import. | jest thêm `moduleNameMapper` bỏ `.js`; `test:int` chạy với `NODE_OPTIONS=--experimental-vm-modules`. |

### Quyết định schema/migration

| # | Quyết định | Lý do |
|---|---|---|
| D04-01 | Hai migration tách biệt: `init` (Prisma sinh) + `add_check_constraints` (SQL tay) | Prisma không biểu diễn được CHECK, partial unique, biểu thức. Tách để migration gốc tái sinh được từ schema. |
| D04-02 | CHECK ở tầng DB cho mọi bất biến tiền/quantity/công thức | Toàn vẹn ở DB là lớp phòng thủ cuối; **không thay thế** validation ở service (bước 07–08). |
| D04-03 | Partial unique `payments(order_id) WHERE method='PAY_AT_COUNTER'` thay vì UNIQUE(order_id) toàn cục | Đúng khuyến cáo `data-model.md`: MVP một payment/đơn nhưng không khóa cứng nhánh prepay nhiều lần sau này. |
| D04-04 | CHECK `fulfillment_type = 'PICKUP'` ở tầng DB | MVP chỉ pickup; chặn tạo đơn DELIVERY ngay cả khi code lỡ gửi. Gỡ bằng migration riêng khi bật delivery. |
| D04-05 | FK tới catalog/profile/store mà order/history tham chiếu là **Restrict**; `order_items`/`modifiers`/`history`/`payments` **Cascade** theo order | Giữ snapshot hóa đơn (REQ-306/307): không cho xóa món đang được đơn tham chiếu, nhưng xóa đơn thì dọn con. |
| D04-06 | Seed **không** tạo profile staff/admin | Theo steering: tài khoản có role phải từ Supabase Auth thật (bước 05). Seed chỉ catalog + 1 store. Tránh ghi password/token vào Git. |
| D04-07 | Seed idempotent theo natural key (store.code, slug, sku, (group,name)) | Chạy lại không nhân bản — đã kiểm: lần 2 mọi count giữ nguyên. |
| D04-08 | DB dev (5434) và DB test (5435) tách biệt, volume riêng | `test:int` gọi `migrate reset` (xóa sạch) nên phải là DB riêng; có guard từ chối nếu URL trùng DB dev hoặc trỏ production. |
| D04-09 | `PrismaService` không làm sập process khi kết nối DB lỗi lúc khởi động | `/v1/health` (liveness) vẫn chạy khi DB chưa sẵn sàng; readiness phản ánh trạng thái. |
| D04-10 | `test:int` tách khỏi `pnpm test` (jest config riêng, tự skip khi thiếu `TEST_DATABASE_URL`) | `pnpm test` trên máy/CI chưa có DB vẫn pass; integration chỉ chạy khi có DB thật. |

### Câu hỏi còn mở

| # | Câu hỏi | Trạng thái |
|---|---|---|
| Q04-01 | FK `profiles.id → auth.users.id` của Supabase hiện thực ở đâu? Schema Prisma để `profiles.id` là UUID độc lập. | Chốt ở bước 05 (SQL riêng của Supabase hoặc trigger). Integration test hiện tạo profile với UUID tùy ý. |
| Q04-02 | Định dạng `orders.code` (Q01-04) | Chưa chốt; sinh ở bước 08 khi tạo đơn. |
| Q04-03 | `migrate deploy` trong CI/Docker và chuẩn hóa `prisma generate` bước build | Chốt ở bước 11. |
| Q04-04 | Readiness có nên kiểm cả độ trễ query / pool, hay chỉ `SELECT 1`? | Hiện chỉ `SELECT 1`; đủ cho MVP. |

---

## Bước 05 — Xác thực và quyền (2026-10-09)

Đã **chạy thật**: 25/25 unit test + 11/11 auth integration test (DB thật) + 11/11 HTTP smoke với API chạy trên DB dev, dùng token HS256 tự ký cục bộ (chưa có Supabase project).

### Phiên bản chốt
| Gói | Phiên bản | Ghi chú |
|---|---|---|
| `jose` (api) | **5.10.0** | Verify JWT (chữ ký/issuer/audience/expiry). Bản 6.x là ESM-only, không import được từ NestJS CommonJS (giống F03-01); 5.10.0 là bản cuối còn `exports.require`. |
| `@supabase/supabase-js` (web) | 2.117.3 | |
| `@supabase/ssr` (web) | 0.12.7 | Browser client + tự refresh session cho Next App Router. |

### Phát hiện kỹ thuật
| # | Phát hiện | Hệ quả |
|---|---|---|
| F05-01 | Supabase hỗ trợ **hai hệ ký**: ES256/RS256 (signing keys mới, verify qua JWKS endpoint `/auth/v1/.well-known/jwks.json`) và HS256 (JWT secret legacy). | `TokenVerifierService` hỗ trợ cả hai: ưu tiên JWKS khi có `SUPABASE_URL`, fallback HS256 khi chỉ có `SUPABASE_JWT_SECRET`. Verify đầy đủ chữ ký + issuer + audience + expiry bằng `jose`, không tự viết crypto, không chỉ decode. |
| F05-02 | `jose` 6 ESM-only. | Dùng `jose` 5.10.0 (CommonJS) để khớp NestJS 11 CJS. |

### Quyết định
| # | Quyết định | Lý do |
|---|---|---|
| D05-01 | `AuthGuard` + `RolesGuard` đăng ký **global** qua `APP_GUARD`; opt-out bằng `@Public()` | Mặc định an toàn: quên gắn guard thì route vẫn được bảo vệ, thay vì quên thì hở. |
| D05-02 | Role đọc từ `profiles.role` trong DB mỗi request (auto-provision CUSTOMER lần đầu), **không** từ token/metadata | REQ-001/REQ-003; admin đổi role có hiệu lực ngay (đã test). |
| D05-03 | Secret (`SUPABASE_JWT_SECRET`, `SUPABASE_SECRET_KEY`) theo pattern cờ boolean trong config, đọc `process.env` tại chỗ dùng | Không lưu giá trị secret vào `AppConfig` (có test khẳng định); giống cách `PrismaService` đọc `DATABASE_URL`. `SUPABASE_URL`/issuer/audience không bí mật nên lưu trực tiếp. |
| D05-04 | Quyền theo cửa hàng kiểm ở **service** (`StoreAccessService.assertCanActForStore`), không chỉ guard | Steering + domain-rules: internal call giữa service không được bypass qua việc không đi qua route guard. |
| D05-05 | FE: 401 → refresh phiên **đúng một lần** rồi gọi lại; không vòng lặp retry | Steering yêu cầu refresh có giới hạn; tránh bão request khi phiên hỏng. |
| D05-06 | Auto-provision profile bằng `upsert` theo `id = sub`, `update: {}` | Chạy đồng thời không tạo trùng; không ghi đè role đã có của user cũ. |
| D05-07 | Profile `isActive = false` → 403 ngay ở `AuthService.resolveUser` | Vô hiệu hóa tài khoản chặn được mọi route bảo vệ. |

### Chưa làm / cần cấu hình khi có Supabase thật
- Chưa có Supabase project → test dùng HS256 secret cục bộ. Khi có project: đặt `SUPABASE_URL` để dùng JWKS (an toàn hơn secret).
- **Phải tắt Data API cho bảng nghiệp vụ** (orders/payments/history) trong Supabase, hoặc để ngoài schema expose — browser không ghi trực tiếp. Chưa kiểm được vì chưa có project (ghi vào README + progress như việc cần làm).
- FK `profiles.id → auth.users.id` (Q04-01) vẫn mở: hiện profile auto-provision theo `sub`, chưa ràng buộc cứng với `auth.users` của Supabase.
- Trang đăng nhập/đăng ký UI để bước 06+.

### Câu hỏi còn mở
| # | Câu hỏi | Trạng thái |
|---|---|---|
| Q05-01 | Dùng JWKS (ES256) hay HS256 ở production? | Khuyến nghị JWKS; chốt khi tạo Supabase project. |
| Q05-02 | Verify + tắt Data API trên Supabase thật | Chưa kiểm được, cần project. Ghi là việc bắt buộc trước deploy (bước 11). |
| Q05-03 | Có cần cache kết quả verify/profile để giảm query mỗi request? | Chưa; MVP query profile mỗi request cho đúng role. Cân nhắc ở bước 10/11 nếu cần. |

---

## Bước 06 — Quản lý danh mục và món (2026-10-09)

Đã **chạy thật**: 25 unit + 42 integration (DB thật, trong đó 24 catalog) pass; HTTP smoke đọc catalog từ seed thật (4 category, 12 món, availability theo store, search, phân trang).

### Quyết định
| # | Quyết định | Lý do |
|---|---|---|
| D06-01 | Response contract (`CategoryDto`, `ProductListItemDto`, `ProductDetailDto`, `VariantDto`, `ModifierGroupDto`) khai trong `packages/contracts`; viết tay (chưa sinh từ OpenAPI) | Backend là nguồn chuẩn; web dùng chung type. Tiếp tục Q03-01 (chưa sinh từ OpenAPI). |
| D06-02 | `VariantDto.available`: `null` khi query không kèm `storeId`, `true/false` khi có | Phân biệt rõ "không xét theo store" với "hết hàng tại store". UI khách luôn truyền `storeId`. |
| D06-03 | Chưa có `store_variants` cho một variant tại store → coi là **không bán** (`available=false`) tại store đó | An toàn: món chỉ hiện bán khi admin/staff chủ động bật. Khớp REQ-101. |
| D06-04 | `fromPriceVnd` = giá variant rẻ nhất **còn bán** (lọc theo store nếu có); `null` khi không có variant khả dụng | Menu hiển thị "từ X đ"; món hết sạch tại store không có giá "từ". |
| D06-05 | slug/SKU trùng, size trùng, `maxSelect<minSelect`, giá âm → **400 VALIDATION_ERROR** (không phải 409) | 409 trong dự án dành cho xung đột trạng thái/đồng thời (VERSION_CONFLICT...). Lỗi nhập liệu là 400. Bắt `P2002` của Prisma → 400. |
| D06-06 | Cửa hàng `isActive=false` khi truy vấn catalog theo store → **409 ITEM_UNAVAILABLE** | REQ-102; phân biệt với 404 (store không tồn tại). |
| D06-07 | `PUT /admin/products/:id/modifier-groups` thay **cả tập** nhóm trong transaction (deleteMany + createMany) | Idempotent, khớp wireframe (admin tick/bỏ tick cả nhóm). Kiểm mọi groupId tồn tại trước. |
| D06-08 | Không có endpoint **xóa vật lý** category/product/variant/option | REQ-603/307: ẩn bằng `isActive` để giữ snapshot đơn cũ. FK RESTRICT ở DB cũng chặn xóa khi có tham chiếu. |
| D06-09 | Staff toggle gọi `StoreAccessService.assertCanActForStore` trong **service** trước khi ghi `store_variants` | Chống cross-store ngay cả khi internal call; không chỉ dựa `@Roles`. |
| D06-10 | Toggle availability dùng `upsert` theo `storeId_variantId` | Lần đầu tạo bản ghi, lần sau cập nhật; idempotent. |
| D06-11 | Query DTO dùng `@Type(() => Number)` cho page/limit | `ValidationPipe` có `enableImplicitConversion=false` (chốt bước 03), nên phải ép kiểu tường minh. |

### Chưa làm trong phạm vi (ghi rõ)
- **Upload ảnh món**: steering nhắc signed upload qua Storage. **Chưa có Supabase project** nên chưa làm được signed URL/kiểm mime/size thật. Hiện `imagePath` là string path admin tự cung cấp (validate độ dài). Không lưu ảnh vào filesystem container. → Q06-01.
- **Phối hợp khóa catalog ↔ checkout** để chống giá đổi giữa lúc kiểm và lưu đơn: thuộc bước 07–08 (quote + tạo đơn), chưa thuộc đọc catalog. Catalog đọc không cache ở server nên không có nguy cơ "checkout tin giá cũ" từ phía API; client invalidate query là phần của bước 07+.
- `includeInactive` cho category/admin listing đầy đủ: hiện danh sách công khai chỉ trả active; màn admin xem cả inactive sẽ hoàn thiện khi làm UI (bước sau).

### Câu hỏi còn mở
| # | Câu hỏi | Trạng thái |
|---|---|---|
| Q06-01 | Upload ảnh: signed upload Supabase Storage + public read hay signed URL? | Chưa chốt; cần project. Hiện nhận `imagePath` string. Nối tiếp Q01-07. |
| Q06-02 | Có cần endpoint admin liệt kê product/category gồm cả inactive (có phân trang riêng)? | Chưa; thêm khi dựng UI admin. |
| Q06-03 | Chuẩn hóa tiếng Việt khi search (bỏ dấu) — hiện dùng `contains insensitive` của Postgres | Đủ cho MVP; cân nhắc `unaccent` nếu cần. |

---

## Bước 07 — Giỏ hàng và báo giá (2026-10-09)

Đã **chạy thật**: 33 unit (8 canonical) + 61 integration (19 quote) pass; HTTP smoke tính giá từ seed thật và persist quote.

### Phiên bản chốt
| Gói | Phiên bản | Ghi chú |
|---|---|---|
| `zustand` (web) | 5.0.15 | Giỏ hàng persist localStorage. |

### Quyết định
| # | Quyết định | Lý do |
|---|---|---|
| D07-01 | `canonicalizeQuote` + `normalizeNote` đặt trong `packages/contracts` (browser-safe, không crypto) | Client và server dùng **cùng** hàm canonical để `request_hash` khớp. Hash SHA-256 làm ở server (`createHash` của Node); contracts chỉ trả chuỗi canonical. |
| D07-02 | Canonical: sort `modifierOptionIds`, sort `items` theo khóa (variantId+modifiers+note), trim recipient, normalize note; **không** gom transport/requestId/thời gian | Thứ tự chọn/thứ tự dòng không đổi hash; nội dung đổi thì đổi hash. Khớp docs/api-contract. |
| D07-03 | `POST /checkout/quote` trả **200** (không 201) | Quote là tài nguyên tạm có hạn, không phải resource bền vững. |
| D07-04 | Tách `QuotePricingService` (tính giá thuần từ catalog, nhận `Tx`) khỏi `CheckoutService` (persist) | Bước 08 gọi lại `priceQuote` trong transaction tạo đơn với cùng logic + khóa dòng catalog. Nhận `Tx` (Pick delegate) nên chạy được cả với `this.prisma` lẫn transaction client. |
| D07-05 | Lỗi nhập liệu modifier (không thuộc món, min/max, trùng) → **400 VALIDATION_ERROR**; món/variant/store không còn bán → **409 ITEM_UNAVAILABLE** | Nhất quán với bước 06 (D06-05/06). Phân biệt rõ "nhập sai" với "hết hàng". |
| D07-06 | Kiểm min/max cho **mọi nhóm gắn product**, kể cả nhóm bắt buộc chưa chọn | Nhóm `minSelect≥1` không chọn gì phải báo thiếu, không chỉ kiểm option đã gửi. |
| D07-07 | `price_snapshot` lưu đủ dòng + giá qua JSON round-trip (`Prisma.InputJsonValue`) | Bước 08 so khớp snapshot để phát hiện PRICE_CHANGED. Round-trip để khớp kiểu Json của Prisma (loại `undefined`). |
| D07-08 | Giỏ client Zustand persist, `version:1`, `migrate` reset giỏ rỗng khi đổi format | Steering: migration hoặc reset an toàn. Reset rỗng đơn giản và không có nguy cơ đọc cấu trúc cũ sai. |
| D07-09 | Một giỏ một store; thêm món store khác → `storeConflict`, UI xác nhận trước khi `switchStore` | Steering + domain (một đơn một store). Không tự xóa giỏ của khách. |
| D07-10 | `lineKey` = variantId + modifier đã sort + note đã normalize | Khác size/modifier/note là dòng riêng (REQ-204); cùng cấu hình thì cộng dồn quantity. |

### Chưa làm / ghi rõ
- **Quote không giữ availability**: đúng steering — bước 08 kiểm lại khi tạo đơn và so snapshot (PRICE_CHANGED/ITEM_UNAVAILABLE/QUOTE_EXPIRED). Chưa có logic đó ở bước 07.
- Rate limit cho `POST /quote` (steering nhắc "giới hạn request"): chưa thêm throttler; chốt cùng rate limit tổng ở bước 08/11 (Q01-06).
- UI checkout (hiển thị breakdown, đếm ngược, disable khi hết hạn): chưa có màn web; chỉ có store + hook. Dựng khi làm màn ở bước sau.

### Câu hỏi còn mở
| # | Câu hỏi | Trạng thái |
|---|---|---|
| Q07-01 | Rate limit cho endpoint quote (ngưỡng/cửa sổ) | Chưa; nối Q01-06, chốt bước 08/11. |
| Q07-02 | Có cho phép quote lại tự động khi giá đổi, hay luôn buộc khách xác nhận? | Thiết kế (wireframe D02): buộc xác nhận. Logic ở bước 08. |
