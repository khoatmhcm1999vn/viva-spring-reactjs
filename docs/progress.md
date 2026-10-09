# Tiến độ

Bộ hướng dẫn đã được tạo. Ứng dụng, migrations, tests và deployment chưa được triển khai.

| Bước | Trạng thái | Bằng chứng / hạn chế |
|---|---|---|
| 01 Chốt nghiệp vụ | DONE (tài liệu) | `docs/requirements.md` (50 REQ), `docs/decisions.md` (D01-01..D01-15, Q01-01..Q01-07), `docs/test-plan.md` map REQ. Chi tiết ở mục “Bước 01” bên dưới. Chưa có code/app. |
| 02 Phác thảo giao diện | DONE (tài liệu) | `docs/wireframes.md` (11 màn, map route→feature→REQ, walkthrough), `docs/mockups/index.html` (11 panel tĩnh), `docs/decisions.md` D02-01..D02-15 / Q02-01..Q02-07. Chi tiết ở mục “Bước 02”. Chưa có component React nào. |
| 03 Khởi tạo monorepo | **DONE (đã chạy)** | pnpm workspaces 4 project. `install --frozen-lockfile`, `lint`, `typecheck`, `build`, `test` đều exit 0; 7/7 jest pass; 24/24 smoke HTTP pass; web gọi được `/v1/health` thật. Phiên bản chốt ở `docs/decisions.md`. Chi tiết ở mục “Bước 03”. |
| 04 Schema, migration và seed | **DONE (đã chạy)** | Prisma 7.10 schema theo data-model; 2 migration áp lên PostgreSQL thật; seed idempotent (1 store, 4 cat, 12 món, 19 variant, 3 group, 9 option); 7/7 integration test pass (CHECK/FK/UNIQUE/rollback); `/v1/ready` trả READY qua `SELECT 1`. Chi tiết ở mục “Bước 04”. |
| 05 Xác thực và quyền | **DONE (đã chạy)** | Verify Supabase token (jose: chữ ký JWKS/HS256 + issuer + audience + expiry); map sub→profiles auto-provision CUSTOMER; AuthGuard+RolesGuard global; StoreAccessService ở service layer; `/v1/me`; FE bearer + 401 refresh một lần. 25/25 unit + 11/11 auth integration + 11/11 HTTP smoke pass. Chi tiết mục “Bước 05”. |
| 06 Quản lý danh mục và món | **DONE (đã chạy)** | Catalog công khai (categories/products/products/:id, store availability, phân trang, search) + admin CRUD (category/product/variant/modifier) + staff toggle availability theo store (StoreAccessService). 25 unit + 42 integration pass; HTTP smoke đọc seed thật (4 cat, 12 món). Chi tiết mục “Bước 06”. |
| 07 Giỏ hàng và báo giá | **DONE (đã chạy)** | `POST /v1/checkout/quote` tính giá server-side từ catalog (base+modifiers×qty), validate store/availability/modifier min-max-membership, lưu checkout_quotes (request_hash SHA-256, price_snapshot, expires_at 5′). Giỏ Zustand persist (lineKey, một store, migrate reset). 33 unit + 61 integration pass; HTTP smoke tính giá seed thật + persist. Chi tiết mục “Bước 07”. |
| 08 Tạo đơn an toàn | **DONE (đã chạy)** | `POST /v1/orders` + `Idempotency-Key`: replay trước expiry, transaction claim key → FOR UPDATE catalog theo thứ tự ID → tính lại giá → so snapshot → insert order+items+modifiers+payment UNPAID+history+mapping. PRICE_CHANGED/QUOTE_EXPIRED/ITEM_UNAVAILABLE/IDEMPOTENCY_CONFLICT/QUOTE_ALREADY_USED. 37 unit + 77 integration pass; smoke 17/17 gồm concurrent thật. Chi tiết mục “Bước 08”. |
| 09 Xử lý đơn và tracking | **DONE (đã chạy)** | `/me/orders`, `/orders/:id`, `/orders/:id/history`, `/orders/:id/cancel`, `/staff/orders`, `/staff/orders/:id/transitions`, `/staff/orders/:id/payments`. CAS theo version + history cùng transaction; thu tiền chỉ ở READY có audit; COMPLETED cần PAID; store scope server-side. 47 unit + 104 integration pass; smoke 21/21 trọn vòng đời. Chi tiết mục “Bước 09”. |
| 10 Kiểm thử theo rủi ro | TODO | Chưa thực hiện trong repository ứng dụng |
| 11 Triển khai | TODO | Chưa thực hiện trong repository ứng dụng |
| 12 Bàn giao và trình bày | TODO | Chưa thực hiện trong repository ứng dụng |

Mỗi lần hoàn thành ghi: file đổi, commands thực chạy, kết quả, pass/fail/skip, quyết định và next step.

---

## Bước 01 — Chốt nghiệp vụ (2026-10-09)

### Dependency bước trước
Không có. Bước 01 là bước đầu. Đã kiểm repo trước khi sửa: `.kiro/steering/` có 4 file nền + 12 file bước; `docs/` đã có `api-contract.md`, `data-model.md`, `decisions.md`, `test-plan.md`, `sources.md`, `deployment.md`, `package-validation.md`, `diagrams/`; `apps/api`, `apps/web`, `packages/contracts`, `infra/` chỉ có README. **Không có** `package.json`, lockfile, Prisma schema hay source code — đúng như README mô tả. Không file nào bị ghi đè ngoài danh sách dưới.

### File đổi
| File | Thay đổi |
|---|---|
| `docs/requirements.md` | **Mới.** Personas (VISITOR/CUSTOMER/STAFF/ADMIN), 13 use case UC-01..UC-13, phạm vi MVP/out-of-scope, 50 acceptance criteria REQ-001..REQ-705 mỗi mục có Trigger + Kết quả quan sát được, ma trận phủ feature→REQ, mục kiểm tra nhất quán hủy/thu tiền/hoàn thành, truy vết sang test plan. |
| `docs/decisions.md` | **Bổ sung** (giữ nguyên bảng quyết định cũ): 15 quyết định chốt D01-01..D01-15, 7 câu hỏi còn mở Q01-01..Q01-07, mục giả định. |
| `docs/test-plan.md` | **Sửa**: thêm cột REQ cho T01–T13, thêm danh sách REQ chưa có test chuyên biệt, bỏ dòng “Map actual requirements IDs when step 1 creates them” vì đã map. |
| `docs/progress.md` | **Sửa**: bản ghi này. |

Không sửa `docs/diagrams/*`: chính sách vòng đời đơn không đổi so với `order-lifecycle.drawio`/`.mmd` (pickup 5 trạng thái + CANCELLED/REJECTED từ `PLACED`, `COMPLETED` yêu cầu `PAID`). Không tạo code, migration hay cấu hình runtime nào.

### Quyết định đáng chú ý
- **D01-04**: thu tiền chỉ ở `CONFIRMED`/`PREPARING`/`READY`. Kết hợp với D01-05 (khách chỉ hủy ở `PLACED`) và D01-06 (từ chối chỉ ở `PLACED`) thì MVP **không tồn tại đường đi nào** dẫn tới đơn đã `PAID` bị hủy, nên không cần policy hoàn tiền ở bản này.
- **D01-12**: giữ đủ enum payment nhưng MVP chỉ dùng `UNPAID → PAID`, tránh migrate enum khi thêm prepay.
- **D01-02**: một store seed nhưng `store_id` có mặt ở mọi bảng/endpoint/kiểm quyền.

### Commands đã chạy và kết quả

1. Kiểm tra tính nhất quán REQ (định nghĩa trùng, tham chiếu treo, REQ không được phủ):
   ```powershell
   $defined = (Select-String -Path docs/requirements.md -Pattern '^\*\*(REQ-\d{3})' -AllMatches).Matches | % { $_.Groups[1].Value }
   # so sánh với mọi tham chiếu REQ-xxx trong requirements.md, test-plan.md, decisions.md
   ```
   Kết quả thực tế: `Defined REQ count: 50`, `Duplicates:` (rỗng), `Referenced but undefined:` (rỗng), `Defined but never cross-referenced:` (rỗng). → **PASS**

2. Script dọn code dự án trước còn sót trên nhánh:
   ```powershell
   node tools/check-no-vivacon.js   # EXIT=0
   ```
   Kết quả: `File dang duoc git track: 35` / `SACH...`. → **PASS tại thời điểm chạy**.
   **Cập nhật sau đó**: thư mục `tools/` đã bị xóa khỏi working tree (`git status` cho `D tools/check-no-vivacon.js`), nên kiểm tra này không còn chạy lại được và không còn là gate của repo.

3. `git status --short` để xác nhận chỉ `docs/` thay đổi trong bước này. → **PASS**

### Pass / Fail / Skip
- PASS: 3 kiểm tra trên.
- SKIP: lint, typecheck, build, unit test, integration test, E2E. **Lý do: chưa tồn tại** — repo chưa có `package.json`, toolchain hay test runner nào. Các gate này được dựng từ bước 03 trở đi.
- FAIL: không có.

### Hạn chế
- Bước 01 chỉ sinh **tài liệu**. Không có chức năng nào đã chạy; không được coi acceptance criteria là bằng chứng hoạt động.
- `tools/check-no-vivacon.js` đã **lỗi thời** so với cấu trúc hiện tại (coi `docs/` và `.kiro/steering/{tech,structure,product}.md` là đường dẫn cấm, đòi các file `coffee-shop/**` đã bị xóa) và nay đã bị xóa khỏi working tree. Repo **không còn gate tự động nào**; lint/typecheck/build/test được dựng từ bước 03.
- Working tree còn các deletion chưa commit của boilerplate `coffee-shop/**`, 5 steering file cũ và `tools/`. Chưa commit gì trong bước này.
- Q01-01..Q01-07 còn mở; Q01-01 (đơn `READY` khách không đến) và Q01-05 (staff tự xử lý đơn của mình) có thể làm phát sinh transition mới nếu chốt khác.

### Bước tiếp theo
Bước 02 — Phác thảo giao diện (`.kiro/steering/02-wireframes.md`), dựa trên UC-01..UC-13 và các REQ liên quan tới UI (REQ-101, REQ-206, REQ-503, REQ-705). Chưa đánh dấu bước nào khác hoàn thành.

---

## Bước 02 — Phác thảo giao diện (2026-10-09)

### Dependency bước trước
Bước 01 đã xong ở mức tài liệu (`docs/requirements.md` với REQ-001..REQ-705). Bước 02 dùng trực tiếp các REQ đó làm acceptance cho từng màn. Đã kiểm repo: `apps/web` vẫn chỉ có `README.md` và `.env.example`, **chưa có** `package.json`, Tailwind, shadcn/ui hay component nào. Không ghi đè file nào đang có.

### File đổi
| File | Thay đổi |
|---|---|
| `docs/wireframes.md` | **Mới**, 969 dòng. Nguyên tắc chung (mobile-first, tiền/thời gian, giá là của server, nút disabled khi gửi, không hứa realtime, a11y); bản đồ route→feature→REQ cho 3 role; navigation mobile/desktop/staff; 10 màn hình bắt buộc kèm wireframe ASCII; bảng trạng thái loading/empty/error/unauthorized cho **từng** màn; bảng xử lý 10 loại lỗi ở checkout; quy tắc chọn modifier theo min/max; chính sách session expired theo ngữ cảnh; 5 walkthrough; mục kiểm tra không lộ cấu hình kỹ thuật; bảng dữ liệu mẫu. |
| `docs/mockups/index.html` | **Mới**, 11 panel HTML/CSS tĩnh, tự chứa, không JavaScript. Mở trực tiếp bằng browser. |
| `docs/decisions.md` | **Bổ sung**: D02-01..D02-15, Q02-01..Q02-07. |
| `docs/progress.md` | **Sửa**: bản ghi này + đánh dấu bước 02. |

Không sửa `docs/requirements.md`, `docs/api-contract.md`, `docs/data-model.md`, `docs/diagrams/*` — bước 02 không làm đổi hợp đồng API, schema hay vòng đời đơn.

### Quyết định đáng chú ý
- **D02-04**: khối chọn Size chỉ render khi product có ≥2 variant, nên bánh/nước đóng chai không bị ép S/M/L. UI suy ra từ số lượng variant thay vì hardcode danh sách size.
- **D02-02**: xác nhận đơn và tracking là cùng một màn `/orders/[id]?placed=1`.
- **D02-03**: polling 7 giây ở màn chi tiết, dừng ở terminal, tạm dừng khi mất focus; màn danh sách không polling.
- **D02-07**: nút `[Thu tiền]` không hiện ở `PLACED`, khớp D01-04 nên MVP không có đường nào cần hoàn tiền.
- **Q02-02**: nút "Đặt lại đơn này" được đánh dấu **tuỳ chọn ngoài MVP**, cắt được — không tự thêm feature ngoài phạm vi `product.md`.

### Commands đã chạy và kết quả

1. Kiểm tra tham chiếu REQ trong tài liệu mới không bị treo:
   ```powershell
   # so moi REQ-xxx trong wireframes.md va mockup voi 50 REQ dinh nghia o requirements.md
   ```
   Kết quả thực tế: `REQ dinh nghia: 50`; `docs/wireframes.md : 42 REQ duy nhat, undefined:` (rỗng); `docs/mockups/index.html : 27 REQ duy nhat, undefined:` (rỗng). → **PASS**

2. Kiểm tra cấu trúc mockup HTML (script tạm, đã xoá sau khi chạy):
   ```powershell
   node check-html.tmp.js   # EXIT=0
   ```
   Kết quả: `so panel: 11`, `so label[for]: 13, so id: 13`, `OK: HTML can bang, label hop le, khong co script.`
   Script kiểm: cân bằng tag (bỏ qua void element), mọi `label[for]` trỏ tới `id` có thật, có `lang="vi"` + charset + viewport + title, có ghi chú dữ liệu giả, và **không** chứa `<script>`. → **PASS**

3. Kiểm tra `docs/wireframes.md` phủ hết yêu cầu của `.kiro/steering/02-wireframes.md` (script tạm, đã xoá):
   ```powershell
   node check-wireframes.tmp.js   # EXIT=0
   ```
   Kết quả: `man hinh bat buoc: 10 · rang buoc steering: 18 · route: 9` → `OK: phu het yeu cau cua 02-wireframes.md.`
   Script kiểm 10 màn bắt buộc (navigation, menu, dialog món, cart, checkout, confirmation, tracking, history, staff board, admin catalog); 4 trạng thái loading/empty/error/unauthorized mỗi loại xuất hiện ≥4 lần trong các bảng trạng thái; 18 ràng buộc riêng của steering (nút disabled, `PRICE_CHANGED`, `QUOTE_EXPIRED`, min/max modifier, không ép size, "Cập nhật lúc", không hứa realtime, staff board chỉ transition hợp lệ, thu tiền trước hoàn tất, route theo role không thay guard API, label/a11y, 4 walkthrough, mục không lộ cấu hình kỹ thuật, map route→feature, ghi rõ dữ liệu giả); và 9 route đều xuất hiện ≥2 lần. → **PASS**

4. Mở `docs/mockups/index.html` bằng browser để xem bố cục. → **SKIP**: tôi không render được trang trong môi trường này; chỉ kiểm được cấu trúc HTML bằng script ở mục 2. Cần người kiểm bằng mắt.

### Pass / Fail / Skip
- PASS: 3 kiểm tra tự động ở trên.
- SKIP: xem mockup bằng mắt trong browser (không render được ở đây); lint/typecheck/build/unit/E2E (**chưa tồn tại** toolchain, dựng từ bước 03); kiểm trợ năng thật bằng screen reader (cần người và thiết bị).
- FAIL: không có.

### Hạn chế
- Bước 02 chỉ sinh **tài liệu và mockup tĩnh**. Không có màn hình nào chạy được; không một bước nào trong 5 walkthrough ở mục 13 của `wireframes.md` đã được thực thi. Chúng là kịch bản sẽ hiện thực ở bước 06–09 và kiểm ở bước 10 (T11, T12).
- Mockup không có JavaScript nên không minh hoạ được chuyển trạng thái, đếm ngược quote hay polling — các thứ đó chỉ được mô tả bằng chữ trong `wireframes.md`.
- Các điểm accessibility là **mục tiêu thiết kế**. Tuân thủ WCAG đầy đủ cần kiểm thủ công với trợ năng thật và rà soát bởi người có chuyên môn; wireframe không chứng minh được điều đó.
- Chi tiết thị giác trong mockup (màu, bán kính, font) **sẽ khác** UI thật vì bước 03 mới chốt Tailwind + shadcn/ui.
- Hai script kiểm (`check-html.tmp.js`, `check-wireframes.tmp.js`) là script dùng một lần, đã xoá sau khi chạy. Repo vẫn **không có gate tự động nào**; gate thật dựng từ bước 03.
- Q02-01..Q02-07 còn mở. Q02-02 (nút đặt lại đơn) nằm ngoài MVP và cắt được.

### Bước tiếp theo
Bước 03 — Khởi tạo monorepo (`.kiro/steering/03-bootstrap.md`): pnpm workspaces, `apps/web` (Next.js + Tailwind + shadcn/ui), `apps/api` (NestJS + Swagger), `packages/contracts`, và dựng gate thật (lint, typecheck, build). Khi đó mới chốt và ghi lại versions vào `docs/decisions.md`. Chưa đánh dấu bước nào khác hoàn thành.

---

## Bước 03 — Khởi tạo monorepo (2026-10-09) — **DONE**

### Dependency bước trước
Bước 01 và 02 đã xong ở mức tài liệu. Bước 03 là bước đầu tiên tạo code chạy được.

Lần thực hiện đầu bị **BLOCKED**: Node trên máy là 16.20.1 (EOL), không đáp ứng `engines` của pnpm (`>=18`), Next (`>=20.9`), `@nestjs/cli` (`>=20.11`) hay Prisma (`^20.19 || ^22.12 || >=24`). Tôi chủ ý **không scaffold** khi chưa cài được gì, vì config chưa từng chạy `tsc`/`build` không phải bằng chứng. Người dùng sau đó cài **Node 24.20.0 / npm 11.19.0**, và bước này được thực hiện trọn vẹn.

### Đã kiểm repo trước khi sửa
`apps/web`, `apps/api`, `packages/contracts`, `infra/` chỉ có `README.md` và `.env.example`. Không có `package.json`, `pnpm-workspace.yaml`, lockfile hay `tsconfig`. `README.md` của cả 4 thư mục được **cập nhật nội dung**, không bị xoá; `.env.example` của web/api được mở rộng chú thích, giữ nguyên tên biến đã có và không thêm giá trị nào.

### File đổi

**Gốc repo**
| File | Thay đổi |
|---|---|
| `package.json` | **Mới**. Root private, `packageManager: pnpm@12.10.1`, `engines.node >=22.12`, scripts `dev:web` `dev:api` `lint` `typecheck` `build` `test` — tất cả gọi qua `pnpm --filter`/`pnpm -r`, không có script giả. |
| `pnpm-workspace.yaml` | **Mới**. `apps/*` + `packages/*`, và `allowBuilds` khai báo tường minh 4 gói (pnpm 12 chặn install script theo mặc định). |
| `tsconfig.base.json` | **Mới**. Strict + `noUncheckedIndexedAccess`, `noImplicitOverride`, `noUnusedLocals/Parameters`, `noFallthroughCasesInSwitch`. |
| `pnpm-lock.yaml` | **Mới**, 301 KB, được commit. |
| `.gitignore` | **Sửa**: thêm `out/`, `.turbo/`, `*.tsbuildinfo`, `next-env.d.ts`, `.vercel`, `.pnpm-store/`. Giữ nguyên toàn bộ phần bảo vệ secret. |

**packages/contracts** (mới)
`package.json` (exports map, build CJS + `.d.ts`), `tsconfig.json`, `src/index.ts`: enum nghiệp vụ (`UserRole`, `FulfillmentType`, `PaymentMethod`, `OrderStatus`, `PaymentStatus`), `TERMINAL_ORDER_STATUSES` + `isTerminalOrderStatus`, envelope lỗi (`ApiErrorCode`, `ApiErrorBody`), `Paginated<T>`, `HealthResponse`/`ReadyResponse`, hằng số `CART_LIMITS`/`QUOTE_TTL_SECONDS`/`MAX_SIGNED_INT32`. Dùng `const object` + union type thay `enum`.

**apps/api** (mới)
`package.json`, `tsconfig.json`, `nest-cli.json`, `eslint.config.mjs`, `jest.config.js`, và:
| File | Nội dung |
|---|---|
| `src/main.ts` | prefix `/v1`, `ValidationPipe` whitelist + forbidNonWhitelisted, filter lỗi toàn cục, CORS allowlist từ env, Swagger `/docs` + bearer scheme, log chỉ ghi **tên** biến và trạng thái cấu hình. |
| `src/app.module.ts` | `ConfigModule` global, `AppConfigModule`, `HealthModule`, middleware request-id cho mọi route. |
| `src/common/config/app-config.ts` | Đọc + kiểm env một lần, fail fast. Chỉ lưu `databaseConfigured: boolean`, **không** lưu giá trị `DATABASE_URL`. Từ chối `CORS_ORIGINS=*`. |
| `src/common/config/app-config.module.ts` | Provider `@Global`. |
| `src/common/middleware/request-id.middleware.ts` | Sinh `requestId`, trả qua header `x-request-id`; chỉ nhận header của client khi đúng định dạng UUID (chống log injection). |
| `src/common/filters/all-exceptions.filter.ts` | Body lỗi `{code,message,details,requestId}`. 5xx trả message chung, chi tiết chỉ nằm trong log server. |
| `src/modules/health/` | `health.controller.ts` (`/v1/health`, `/v1/ready`), `health.service.ts`, `health.module.ts`, `health.spec.ts`. |
| `.env.example` | **Sửa**: giữ nguyên tên biến cũ, thêm chú thích về `CORS_ORIGINS` không được là `*` và việc `DATABASE_URL` rỗng làm `/v1/ready` trả 503. |
| `README.md` | **Sửa**: ghi endpoint thật, cấu trúc thư mục, cách chạy, và những gì chưa có. |

**apps/web** (mới)
Scaffold bằng `create-next-app@16.4.0` (`--ts --tailwind --eslint --app --src-dir`) vào thư mục tạm rồi **merge có chọn lọc** để không ghi đè `README.md` và `.env.example` đang có. Thư mục tạm đã xoá.
| File | Nội dung |
|---|---|
| `package.json` | Tên `@coffee-order/web`, scripts `dev`/`build`/`start`/`lint`/`typecheck`, cổng 3000. |
| `next.config.ts` | Tailwind 4 qua turbopack loader; tắt `cacheComponents` + `partialPrefetching`; `typescript.ignoreBuildErrors: false`. |
| `tsconfig.json` | Giữ cấu hình đã được verify của template, thêm `noUnusedLocals/Parameters`, `noFallthroughCasesInSwitch`, `noImplicitOverride`. |
| `src/app/layout.tsx` | `lang="vi"`, bọc `Providers`. Props khai báo tường minh thay vì global `LayoutProps`. |
| `src/app/providers.tsx` | `QueryClientProvider`, QueryClient tạo trong `useState` để mỗi request SSR có instance riêng. |
| `src/app/page.tsx` | Trang chủ tạm + link sang `/smoke`. |
| `src/app/smoke/page.tsx` | **Trang smoke**: gọi `GET /health` và `GET /ready` qua TanStack Query, xử lý đúng trường hợp `/ready` trả 503. |
| `src/app/globals.css` | Tailwind 4 + token màu tạm. |
| `src/lib/env.ts` | Chỉ đọc `NEXT_PUBLIC_*`, kèm cảnh báo không đặt secret vào tiền tố này. |
| `src/lib/api.ts` | Client fetch, giữ nguyên body lỗi, hỗ trợ `Idempotency-Key`. |
| `src/lib/utils.ts` | `cn()`, `formatVnd()` (integer VND), `formatDateTimeHcm()` (Asia/Ho_Chi_Minh). |
| `components.json` | Cấu hình shadcn/ui sẵn cho bước 06. |
| `.env.example`, `README.md` | **Sửa**, giữ tên biến cũ. |

**docs**
`docs/decisions.md` bổ sung mục “Bước 03 — Phiên bản đã chốt” (toolchain, bảng version của từng app, 3 phát hiện F03-01..F03-03, 11 quyết định D03-01..D03-11, 5 câu hỏi mở Q03-01..Q03-05) và đánh dấu mục tra registry trước đó là đã bị thay thế. `packages/contracts/README.md` được viết lại.

### Ba phát hiện làm đổi lựa chọn ban đầu

1. **NestJS 12 là ESM-only.** `@nestjs/common@12.1.2` có `"type": "module"`, `exports` không có điều kiện `require`; `@nestjs/cli@12.0.8` phụ thuộc `typescript ~6.0.2`. Thử Nest 12 + CommonJS cho `error TS1479` ở mọi import. → Chốt **NestJS 11.2.7 + CommonJS + TypeScript 5.9.3**.
2. **Toàn bộ ESLint 9.x đã deprecated** (0/58 bản còn hỗ trợ), nhưng template `create-next-app@16.4.0` vẫn ghim `^9`. → Nâng **ESLint 10.12.0**; peer của `eslint-config-next` là `>=9.0.0` nên hợp lệ, và lint chạy exit 0.
3. **`prisma@latest` là `8.0.0-rc.22` (pre-release)** và **`typescript@latest` là `7.0.2`** (dòng compiler mới). → Bước 04 ghim Prisma **7.10.0**; TypeScript giữ 5.9.3. Không dùng `latest` ở đâu.

### Commands đã chạy và kết quả thật

```powershell
node -v                        # v24.20.0
npm -v                         # 11.19.0
corepack enable pnpm           # EPERM tren C:\Program Files\nodejs (khong co quyen admin)
npm i -g pnpm@12.10.1          # thay the; pnpm -v => 12.10.1
pnpm install                   # 4 workspace project
pnpm install --frozen-lockfile # "Lockfile is up to date" -> EXIT 0
pnpm run lint                  # EXIT 0
pnpm run typecheck             # EXIT 0  (3/3 project)
pnpm run build                 # EXIT 0  (contracts tsc -> api nest build -> web next build)
pnpm run test                  # EXIT 0
```

- `pnpm run build` của web in ra 3 route: `/`, `/_not-found`, `/smoke` (tất cả static).
- `pnpm run test`: **7/7 pass**, 1 suite. Gồm: default `PORT=3001` + CORS `localhost:3000`; từ chối `CORS_ORIGINS=*`; từ chối `PORT` không hợp lệ; **config không lưu giá trị `DATABASE_URL`**; `GET /v1/health` trả 200 và không chứa secret; `GET /v1/ready` trả **503 / NOT_READY / NOT_CONFIGURED**; route lạ trả body `{code,message,requestId}` không có stack.
- `pnpm install` lần đầu fail `ERR_PNPM_IGNORED_BUILDS` với `@parcel/watcher` và `@scarf/scarf`; đã xử lý bằng cách khai báo tường minh trong `allowBuilds` thay vì bỏ qua cảnh báo.

### Smoke HTTP thật (API 3001 + web 3000 cùng chạy)

Chạy bằng một script Node tạm (đã xoá sau khi chạy), gọi HTTP thật. **24/24 PASS**:

| Nhóm | Kết quả |
|---|---|
| `GET /v1/health` | 200; body `{"status":"ok","service":"coffee-order-api","version":"0.1.0","timestamp":"..."}`; có header `x-request-id`; không chứa `DATABASE_URL`/`SUPABASE`/`SECRET`/`password`/`CORS_ORIGINS` |
| `GET /v1/ready` | **503**; `{"status":"NOT_READY","checks":{"database":"NOT_CONFIGURED"}}` |
| `GET /docs` | 200, trả Swagger UI |
| `GET /docs-json` | liệt kê `/v1/health`, `/v1/ready`; có scheme `supabase-access-token`; `servers=[]` |
| Route lạ | 404 với `{"code":"NOT_FOUND","message":"...","requestId":"..."}`, không có stack trace |
| CORS | origin trong allowlist nhận `access-control-allow-origin: http://localhost:3000`; `http://evil.example` **không** nhận header nào |
| Web `/` | 200, render `Coffee Order`, `lang="vi"` |
| Web `/smoke` | 200, nhúng base URL `localhost:3001/v1`; HTML client **không** chứa `DATABASE_URL`, `SUPABASE_SECRET_KEY` hay `postgresql://` |

Smoke phát hiện **một lỗi thật đã sửa**: Swagger vừa có `setGlobalPrefix("v1")` vừa có `.addServer("/v1")`, nên "Try it out" sẽ gọi `/v1/v1/health`. Đã bỏ `addServer` và kiểm lại `servers=[]`.

### Pass / Fail / Skip
- **PASS**: `install --frozen-lockfile`, `lint`, `typecheck`, `build`, `test` (7/7), smoke HTTP (24/24), web→API health thật.
- **FAIL**: không còn. Trong quá trình làm có 5 lỗi thật đã sửa: `@types/react-dom@19.3.1` không tồn tại; TS 6 báo deprecated `moduleResolution=node10` + `baseUrl`; Nest 12 ESM không import được từ CJS; `next.config.ts` không còn khoá `eslint`; global `LayoutProps` chưa tồn tại lúc typecheck. Thêm lỗi Swagger `addServer` ở trên.
- **SKIP**: kiểm tra DB trong `/v1/ready` (bước 04 — hiện trả 503 đúng như yêu cầu của steering khi chưa có credential); xác thực Supabase (bước 05); test tích hợp PostgreSQL và Playwright (bước 10); CI tự động (bước 11); xem `/docs` và `/smoke` bằng mắt trên browser (tôi chỉ kiểm được bằng HTTP + so khớp nội dung HTML).

### Hạn chế
- **Chưa có tính năng nghiệp vụ nào.** Không có schema, không có auth, không có menu/giỏ/đơn. Trang `/` chỉ là chỗ đặt.
- `/v1/ready` hiện **chỉ kiểm biến môi trường**, chưa truy vấn DB. Không được coi đây là readiness hoàn chỉnh.
- Không có integration với Supabase. Chưa tạo tài nguyên cloud nào.
- `pnpm peers check` vẫn báo `eslint-plugin-import`/`jsx-a11y`/`react` muốn ESLint `^9` trong khi đang dùng 10. Lint chạy exit 0 nên giữ nguyên; nếu vỡ thì lùi `apps/web` về ESLint 9 (Q03-04).
- `pnpm` được cài global qua npm vì `corepack enable` thiếu quyền admin. Cần chuẩn hoá lại trong Docker/CI ở bước 11 (Q03-03).
- Chưa có CI chạy các gate này tự động; hiện phải chạy tay (Q03-05).
- `packages/contracts` đang viết tay, chưa sinh từ OpenAPI và chưa có check drift (Q03-01).
- Script smoke là script dùng một lần, đã xoá. Phần đã được phủ bởi jest thì giữ lại trong `health.spec.ts`; phần CORS và web→API hiện **chưa có test tự động** — cần đưa vào bước 10.

### Bước tiếp theo
Bước 04 — Schema, migration và seed (`.kiro/steering/04-database.md`): Prisma **7.10.0** (không dùng tag `latest` vì đang là RC 8), schema theo `docs/data-model.md`, migration đầu tiên, seed một store demo, và đổi `/v1/ready` sang truy vấn DB thật. Không đánh dấu bước nào khác hoàn thành.

---

## Bước 04 — Schema, migration và seed (2026-10-09) — **DONE**

### Dependency bước trước
Bước 03 đã xong (monorepo chạy được, `/v1/ready` trả 503 khi chưa có DB). Bước 04 cần một PostgreSQL thật.

### Môi trường DB
Máy có Docker đang chạy, không có `psql`/Postgres cài sẵn. `tech.md` cho phép Postgres Docker ở dev. Tôi dựng `infra/compose.dev.yml`: **db-dev** cổng 5434 và **db-test** cổng 5435 (tránh 5432 theo quy ước repo), hai volume + database riêng. Cả hai `postgres:16-alpine`, healthcheck `pg_isready`. `apps/api/.env` (gitignored) trỏ `DATABASE_URL` tới db-dev.

### Đã kiểm repo trước khi sửa
`apps/api` đã có code bước 03. Không có `prisma/` nào. Không ghi đè file bước 03; chỉ **thêm** Prisma và sửa `health.*` để ping DB thật.

### File đổi

| File | Thay đổi |
|---|---|
| `apps/api/prisma/schema.prisma` | **Mới**. 16 model theo `docs/data-model.md` + 5 enum. Generator `prisma-client` output `src/generated/prisma`; datasource chỉ `provider` (Prisma 7). |
| `apps/api/prisma.config.ts` | **Mới**. Prisma 7: `DATABASE_URL` qua `env()`, đường dẫn migration + seed. |
| `apps/api/prisma/migrations/20261009135935_init/` | **Mới**. Migration gốc Prisma sinh: enum, 16 bảng, FK, unique, index. |
| `apps/api/prisma/migrations/20261009140000_add_check_constraints/` | **Mới**. SQL tay: CHECK tiền/quantity/công thức, partial unique payment, chặn DELIVERY, quote expiry. |
| `apps/api/prisma/seed.ts` | **Mới**. Seed idempotent theo natural key; **không** seed staff/admin; guard từ chối DB production. |
| `apps/api/src/prisma/prisma.service.ts` | **Mới**. PrismaClient + `@prisma/adapter-pg`; không sập khi DB lỗi; `pingDatabase()` cho readiness. |
| `apps/api/src/prisma/prisma.module.ts` | **Mới**. `@Global`. |
| `apps/api/src/modules/health/health.service.ts` | **Sửa**. Readiness gọi `SELECT 1` qua Prisma (OK/NOT_CONFIGURED/ERROR). |
| `apps/api/src/modules/health/health.controller.ts` | **Sửa**. `getReady` thành async. |
| `apps/api/src/modules/health/health.module.ts` | **Sửa**. Import `PrismaModule` để resolve độc lập khi test. |
| `apps/api/src/modules/health/health.spec.ts` | **Sửa**. Stub `PrismaService` qua `overrideProvider`; vẫn 7/7 pass. |
| `apps/api/src/app.module.ts` | **Sửa**. Thêm `PrismaModule`. |
| `apps/api/test/db-schema.int-spec.ts` | **Mới**. 7 integration test; tự skip khi thiếu `TEST_DATABASE_URL`; guard chống chạy trên dev/prod. |
| `apps/api/jest.int.config.js`, `tsconfig.spec.json` | **Mới**. Config test tích hợp + typecheck test dir. |
| `apps/api/jest.config.js` | **Sửa**. `moduleNameMapper` bỏ `.js` cho client Prisma; loại `generated/**` khỏi coverage. |
| `apps/api/package.json` | **Sửa**. Thêm Prisma/pg/dotenv/tsx/cross-env; scripts `prisma:*`, `db:seed`, `test:int`. |
| `infra/compose.dev.yml` | **Mới**. Postgres dev + test. |
| `.gitignore` | **Sửa**. Thêm `apps/api/src/generated/`. |
| `pnpm-workspace.yaml` | **Sửa**. `allowBuilds`: `prisma`/`@prisma/engines`/`@prisma/client`/`esbuild` = true (cần postinstall). |
| `docs/data-model.md`, `docs/decisions.md` | **Sửa**. Ghi constraint đã hiện thực + mục “Bước 04” (F04-01..04, D04-01..10, Q04-01..04). |

### Commands đã chạy và kết quả thật

```powershell
docker compose -f infra/compose.dev.yml up -d        # db-dev(5434) + db-test(5435) healthy
prisma validate                                       # "The schema is valid"
prisma migrate dev --name init                        # tao + ap migration 1
prisma migrate dev                                    # ap migration 2 (check constraints)
prisma generate                                       # sinh client vao src/generated/prisma
node --import tsx prisma/seed.ts                       # seed lan 1
node --import tsx prisma/seed.ts                       # seed lan 2 -> counts KHONG doi (idempotent)
pnpm run lint / typecheck / build / test              # tat ca EXIT 0; unit 7/7 pass
pnpm --filter @coffee-order/api run test:int          # 7/7 integration pass (TEST_DATABASE_URL -> 5435)
```

- **Migrate trên DB trống**: `migrate reset --force` trên db-test áp cả 2 migration từ đầu, không lỗi; integration test đầu khẳng định bảng rỗng (count=0).
- **Seed idempotent**: lần 1 và lần 2 cho cùng con số — stores=1, categories=4, products=12, product_variants=19, modifier_groups=3, modifier_options=9. Query trực tiếp sau restart container xác nhận persisted (thêm product_modifier_groups=23).
- **Integration 7/7 pass**: migrate-trống; CHECK price âm bị từ chối; CHECK group max<min bị từ chối; UNIQUE(product,size) bị từ chối; FK RESTRICT xóa category có món bị từ chối; CHECK order total sai công thức bị từ chối; **rollback transaction** — lỗi inject giữa transaction không để lại dữ liệu mồ côi.
- **Readiness thật**: khởi động API với DATABASE_URL trỏ db-dev → log "Da ket noi database"; `GET /v1/ready` trả **HTTP 200 `{"status":"READY","checks":{"database":"OK"}}`** (bước 03 trả 503, giờ là query `SELECT 1` thật).

### Pass / Fail / Skip
- **PASS**: migrate (2), validate, generate, seed idempotent (×2), lint, typecheck, build, unit test (7/7), integration test (7/7), readiness READY thật, seed persist sau restart.
- **FAIL**: không còn. Trong quá trình có các lỗi thật đã sửa: Prisma 7 bỏ `url` khỏi schema (phải tạo `prisma.config.ts`); client sinh ra ESM `.js` làm ts-jest/Nest không resolve (thêm `moduleNameMapper` + import PrismaModule vào HealthModule); `migrate reset` Prisma 7 không có `--skip-seed`; adapter cần `--experimental-vm-modules` dưới jest.
- **SKIP**: FK `profiles.id → auth.users.id` của Supabase (Q04-01, bước 05); `migrate deploy` trong CI/Docker (bước 11). Không có test nào bị skip ngoài ý muốn — integration suite **đã chạy** vì tôi dựng được DB test.

### Hạn chế
- Chưa có xác thực/phân quyền; chưa có module nghiệp vụ nào. Chưa có endpoint đọc/ghi catalog.
- Profile staff/admin **chưa tồn tại** (chủ ý — bước 05 tạo qua Supabase Auth). Integration test tạo profile bằng UUID tùy ý, không qua Auth.
- DB chạy bằng Docker local; **chưa** có Supabase/cloud. Chưa tạo tài nguyên trả phí nào.
- Client Prisma gitignored; mọi lần clone/CI phải chạy `prisma generate` trước build (đã ghi trong README).
- `apps/api/.env` chứa mật khẩu DB **dev** (của container local), đã gitignore, không phải secret production.

### Bước tiếp theo
Bước 05 — Xác thực và quyền (`.kiro/steering/05-auth-rbac.md`): xác minh Supabase access token (chữ ký/issuer/expiry/audience), map `sub → profiles`, guard theo role và store, và quyết định FK `profiles.id → auth.users.id` (Q04-01). Không đánh dấu bước nào khác hoàn thành.

---

## Bước 05 — Xác thực và quyền (2026-10-09) — **DONE**

### Dependency bước trước
Bước 04 xong (schema + Prisma + 2 DB Docker). Bước 05 dùng `profiles`/`store_staff` và `PrismaService` đã có.

### Môi trường
**Chưa có Supabase project** (không có `SUPABASE_URL`/key trong env). Giống bước 03/04, tôi triển khai đầy đủ phần verify/RBAC **chạy và test được không cần Supabase**, bằng token HS256 tự ký với secret cục bộ. Khi có project thật chỉ cần đặt `SUPABASE_URL` (JWKS) hoặc `SUPABASE_JWT_SECRET`.

### File đổi
| File | Thay đổi |
|---|---|
| `packages/contracts/src/index.ts` | **Sửa**: thêm `AuthenticatedUser`, `MeResponse`. |
| `apps/api/src/common/config/app-config.ts` | **Sửa**: thêm `auth` (configured/supabaseUrl/jwtIssuer/jwtAudience/jwtSecretConfigured); parser suy ra issuer từ URL; **không** lưu giá trị secret. |
| `apps/api/src/modules/auth/token-verifier.service.ts` | **Mới**: verify token bằng `jose` — JWKS (ES256/RS256) hoặc HS256, kiểm chữ ký + issuer + audience + expiry. |
| `apps/api/src/modules/auth/auth.service.ts` | **Mới**: map `sub → profiles`, auto-provision CUSTOMER (`upsert`), chặn tài khoản `isActive=false`. |
| `apps/api/src/modules/auth/auth.guard.ts` | **Mới**: global AuthGuard, đọc Bearer, verify, gắn `req.user`; `@Public()` bỏ qua. |
| `apps/api/src/modules/auth/roles.guard.ts` | **Mới**: kiểm `@Roles(...)`; 403 FORBIDDEN không lộ PII. |
| `apps/api/src/modules/auth/store-access.service.ts` | **Mới**: `canActForStore`/`assertCanActForStore`/`staffStoreIds` — kiểm quyền store ở service layer. |
| `apps/api/src/modules/auth/auth.decorators.ts` | **Mới**: `@Public`, `@Roles`, `@CurrentUser`, token `AUTH_USER_KEY`. |
| `apps/api/src/modules/auth/auth.module.ts` | **Mới**: `@Global`, đăng ký APP_GUARD (AuthGuard rồi RolesGuard). |
| `apps/api/src/modules/me/*` | **Mới**: `GET /v1/me` (controller + service). |
| `apps/api/src/modules/health/health.controller.ts` | **Sửa**: `@Public()` cho health/ready. |
| `apps/api/src/app.module.ts` | **Sửa**: import `AuthModule`, `MeModule`. |
| `apps/api/src/modules/auth/auth.spec.ts`, `store-access.spec.ts` | **Mới**: unit test config/verifier/RolesGuard/StoreAccess. |
| `apps/api/test/auth.int-spec.ts` | **Mới**: integration RBAC qua HTTP + DB thật. |
| `apps/web/src/lib/supabase.ts` | **Mới**: browser client + `getAccessToken`/`refreshSessionOnce`. |
| `apps/web/src/lib/api.ts` | **Sửa**: gắn Bearer; 401 → refresh một lần rồi gọi lại, không vòng lặp. |
| `apps/web/src/lib/env.ts` | **Sửa**: `SUPABASE_URL`/`PUBLISHABLE_KEY`/`isSupabaseConfigured`. |
| `apps/web/src/app/smoke/page.tsx` | **Sửa**: health/ready gọi với `auth: false`. |
| `apps/api/package.json`, `apps/web/package.json` | **Sửa**: thêm `jose@5.10.0` / `@supabase/{supabase-js,ssr}`. |
| `apps/api/.env` (gitignored), `.env.example`, 2 README | **Sửa**: biến auth + hướng dẫn + việc cần làm trên Supabase thật. |
| `docs/decisions.md` | **Sửa**: mục “Bước 05” (F05-01..02, D05-01..07, Q05-01..03). |

### Commands đã chạy và kết quả thật
```powershell
pnpm run lint / typecheck / build / test        # tat ca EXIT 0; unit 25/25 pass (3 suite)
pnpm --filter @coffee-order/web run typecheck/build  # EXIT 0
# Integration (DB test 5435):
pnpm --filter @coffee-order/api run test:int    # 18/18 pass (7 schema + 11 auth/rbac)
# HTTP smoke (API 3001 + DB dev, HS256 cuc bo): 11/11 PASS
```

**Unit (25/25)**: config suy ra issuer từ URL / không lưu secret; verifier chấp nhận token hợp lệ, từ chối hết hạn / sai chữ ký / sai audience / sai issuer / không phải JWT; RolesGuard cho ADMIN qua, CUSTOMER→admin ném 403; StoreAccess cho STAFF store A, từ chối store B, ADMIN mọi store, CUSTOMER không quyền staff.

**Integration auth (11)** qua HTTP + DB thật: `@Public` không cần token; thiếu token→401 UNAUTHENTICATED; token rác→401; token hợp lệ lần đầu→auto-provision CUSTOMER, `/me` trả role CUSTOMER; CUSTOMER→admin 403; ADMIN→admin 200; STAFF store A→200; **STAFF store A đụng store B→403 (cross-store)**; CUSTOMER store-scope→403; `/me` của STAFF liệt kê đúng store; **đổi role trong DB có hiệu lực ngay** ở lần gọi sau.

**HTTP smoke (11)** với API chạy thật: health public 200; `/me` thiếu/rác/hết hạn/sai chữ ký/sai issuer đều 401; token hợp lệ→200 auto-provision CUSTOMER; body lỗi và `/me` **không lộ secret**. Query DB xác nhận profile được tạo; đã xóa row test sau đó.

### Pass / Fail / Skip
- **PASS**: lint, typecheck (api+web), build (api+web), unit 25/25, integration 18/18, HTTP smoke 11/11, provision profile thật.
- **FAIL**: không còn. Lỗi thật đã sửa trong lúc làm: `jose@6` ESM không import được từ CJS → hạ `jose@5.10.0`; import thừa trong auth.spec; bỏ biến global trong int test (dùng header `x-test-store`).
- **SKIP / chưa kiểm được**: xác minh với **Supabase project thật** (JWKS ES256) — chưa có project, dùng HS256 cục bộ thay thế; **tắt Data API cho bảng nghiệp vụ** trên Supabase (Q05-02) — cần project, ghi là việc bắt buộc trước deploy; trang login/signup UI (bước 06+).

### Hạn chế
- Chưa chạy với Supabase thật; luồng JWKS ES256 chưa được verify end-to-end (code có nhánh JWKS nhưng test chạy nhánh HS256). Cần kiểm lại khi có project.
- FK `profiles.id → auth.users.id` (Q04-01) vẫn chưa ràng buộc cứng; profile auto-provision theo `sub`.
- Chống ghi trực tiếp qua Supabase Data API (REQ-005) là **cấu hình phía Supabase**, chưa thực hiện được vì chưa có project — đã ghi rõ trong README + decisions.
- `apps/api/.env` nay có thêm HS256 secret **dev cục bộ** (đã gitignore), không phải secret production.

### Bước tiếp theo
Bước 06 — Quản lý danh mục và món (`.kiro/steering/06-catalog.md`): endpoint catalog công khai (`@Public`) + admin CRUD (`@Roles("ADMIN")`) + staff toggle availability theo store (dùng `StoreAccessService`), kèm DTO class-validator và test. Không đánh dấu bước nào khác hoàn thành.

---

## Bước 06 — Quản lý danh mục và món (2026-10-09) — **DONE**

### Dependency bước trước
Bước 04 (schema catalog + seed) và bước 05 (AuthGuard/RolesGuard/StoreAccessService) đã xong. Bước 06 dùng lại toàn bộ: `@Public/@Roles/@CurrentUser`, `StoreAccessService`, `PrismaService`, filter lỗi, DB dev (5434) + test (5435).

### Đã kiểm repo trước khi sửa
Chưa có module catalog. Không ghi đè file bước trước; chỉ **thêm** module `catalog` và nối vào `app.module.ts` + thêm contract types.

### File đổi
| File | Thay đổi |
|---|---|
| `packages/contracts/src/index.ts` | **Sửa**: thêm `CategoryDto`, `VariantDto`, `ModifierOptionDto`, `ModifierGroupDto`, `ProductListItemDto`, `ProductDetailDto`, hằng `PAGINATION`. |
| `apps/api/src/modules/catalog/dto/query.dto.ts` | **Mới**: `ProductQueryDto` (storeId/categoryId/q/page/limit), `ProductDetailQueryDto`, `CategoryQueryDto`. |
| `apps/api/src/modules/catalog/dto/admin.dto.ts` | **Mới**: DTO create/update cho category/product/variant/modifier-group/option, `SetProductModifierGroupsDto`, `SetVariantAvailabilityDto`. |
| `apps/api/src/modules/catalog/catalog.service.ts` | **Mới**: đọc công khai (availability theo store, fromPrice, phân trang, search) + admin CRUD + staff toggle. |
| `apps/api/src/modules/catalog/catalog.controller.ts` | **Mới**: 3 route công khai `@Public`. |
| `apps/api/src/modules/catalog/catalog-admin.controller.ts` | **Mới**: CRUD `@Roles("ADMIN")`. |
| `apps/api/src/modules/catalog/catalog-staff.controller.ts` | **Mới**: toggle `@Roles("STAFF","ADMIN")`. |
| `apps/api/src/modules/catalog/catalog.module.ts` | **Mới**. |
| `apps/api/src/app.module.ts` | **Sửa**: import `CatalogModule`. |
| `apps/api/test/catalog.int-spec.ts` | **Mới**: 24 integration test. |
| `apps/api/README.md`, `docs/api-contract.md`, `docs/decisions.md` | **Sửa**: ghi endpoint + quyết định D06-01..11 + Q06. |

### Quyết định đáng chú ý
- slug/SKU trùng, size trùng, `maxSelect<minSelect`, giá âm → **400 VALIDATION_ERROR** (bắt `P2002` Prisma); 409 chỉ dành cho xung đột trạng thái. Cửa hàng tạm đóng → **409 ITEM_UNAVAILABLE** (D06-05, D06-06).
- `available` = `null` khi không có `storeId`, `true/false` khi có; chưa có `store_variants` → coi là không bán tại store (D06-02, D06-03).
- Không có xóa vật lý — ẩn bằng `isActive`, giữ snapshot đơn cũ + FK RESTRICT (D06-08).
- Staff toggle kiểm quyền store ở **service** (D06-09).

### Commands đã chạy và kết quả thật
```powershell
pnpm run lint / typecheck / build / test        # tat ca EXIT 0; unit 25/25
pnpm --filter @coffee-order/api run test:int     # 42/42 pass (24 catalog + 11 auth + 7 schema)
# HTTP smoke (API 3001 + DB dev da seed buoc 04):
#   GET /categories -> 4 (ca-phe,tra,da-xay,banh)
#   GET /products   -> total 12, available=null khi khong store
#   GET /products?storeId=<seed> -> 12 mon available=true, fromPriceVnd dung
#   GET /products?categoryId=banh -> 3 mon; ?q=tra -> 3 mon (Tra dao cam sa, Tra sen vang, Tra vai)
#   GET /products/:id -> modifierGroups = 3
#   POST /admin/categories khong token -> 401 UNAUTHENTICATED
```

**Integration catalog (24)** phủ: admin tạo category/product/variant/modifier + gán nhóm; slug trùng→400; SKU trùng→400; size trùng→400; giá âm→400 (DTO); `maxSelect<minSelect`→400; option trùng tên trong nhóm→400; gán group không tồn tại→404; CUSTOMER gọi admin→403; **STAFF store A toggle store B→403 (cross-store)**; CUSTOMER toggle→403; đọc công khai categories/products không token; `available=null` khi không store; `available=true/false` theo store; `fromPriceVnd` đúng; chi tiết trả modifier rules; tắt availability→`false`; **ẩn product→biến mất khỏi catalog + /products/:id trả 404**; ẩn category→product ẩn theo; limit>max→400; storeId sai UUID→400; product id lạ→404.

### Pass / Fail / Skip
- **PASS**: lint, typecheck, build (api+web), unit 25/25, integration 42/42, HTTP smoke đọc seed thật.
- **FAIL**: không còn. Lỗi thật đã sửa: ban đầu trả 409 cho slug/SKU trùng và max<min, test mong 400 → chốt 400 VALIDATION_ERROR (sửa `conflict()`→`invalid()` dùng `BadRequestException`); kiểu Prisma payload cho `storeVariants` include có điều kiện → tách interface `ProductRow`; dọn import thừa.
- **SKIP / chưa làm**: **upload ảnh signed URL qua Supabase Storage** (Q06-01) — chưa có project, hiện `imagePath` nhận string; màn admin liệt kê cả inactive (Q06-02); chuẩn hóa dấu khi search (Q06-03). Phối hợp khóa catalog↔checkout thuộc bước 07–08.

### Hạn chế
- Chưa có upload ảnh thật; `imagePath` là path do admin cung cấp, chưa validate tồn tại trên Storage.
- Catalog đọc **không cache ở server** — mỗi request query DB; đủ cho MVP, chống "checkout tin giá cũ" từ phía API (giá checkout lấy ở bước 07–08). Invalidate query phía web là phần của bước sau.
- Chưa có UI web cho catalog/admin (bước này chỉ API). Trang web vẫn là `/` + `/smoke` của bước 03.

### Bước tiếp theo
Bước 07 — Giỏ hàng và báo giá (`.kiro/steering/07-cart-quote.md`): giỏ client (Zustand), `POST /v1/checkout/quote` tính giá server-side từ catalog + lưu quote có hạn, luật modifier min/max/membership, chống giá đổi giữa kiểm và lưu. Không đánh dấu bước nào khác hoàn thành.

---

## Bước 07 — Giỏ hàng và báo giá (2026-10-09) — **DONE**

### Dependency bước trước
Bước 06 (catalog: variant, store_variants, modifier groups/options, product_modifier_groups) và bước 05 (auth, `@Roles`, `CurrentUser`). Bước 07 đọc giá/availability/modifier từ catalog để tính quote.

### Đã kiểm repo trước khi sửa
Chưa có module checkout. Không ghi đè file bước trước; chỉ **thêm** module `checkout`, feature `cart` ở web, và contract types/hàm canonical.

### File đổi
| File | Thay đổi |
|---|---|
| `packages/contracts/src/index.ts` | **Sửa**: thêm `QuoteItemInput/RecipientInput/QuoteRequest/QuoteLine/QuoteLineModifier/QuoteResponse`, `NOTE_MAX_LENGTH`, `normalizeNote`, `canonicalizeQuote` + `CanonicalQuoteInput`. |
| `apps/api/src/modules/checkout/dto/quote.dto.ts` | **Mới**: `QuoteRequestDto` + `RecipientDto` + `QuoteItemDto` (class-validator: PICKUP/PAY_AT_COUNTER, quantity 1..20, ≤50 dòng, note ≤200, option UUID không trùng). |
| `apps/api/src/modules/checkout/quote-pricing.service.ts` | **Mới**: `QuotePricingService.priceQuote(tx, req)` — tính giá + validate domain, nhận `Tx` để bước 08 dùng lại. |
| `apps/api/src/modules/checkout/checkout.service.ts` | **Mới**: `createQuote` — hash canonical SHA-256, lưu `checkout_quotes` + snapshot + expires_at. |
| `apps/api/src/modules/checkout/checkout.controller.ts` | **Mới**: `POST /v1/checkout/quote` `@Roles("CUSTOMER")`, trả 200. |
| `apps/api/src/modules/checkout/checkout.module.ts` | **Mới**: export `QuotePricingService`/`CheckoutService` cho bước 08. |
| `apps/api/src/app.module.ts` | **Sửa**: import `CheckoutModule`. |
| `apps/api/src/modules/checkout/canonical.spec.ts` | **Mới**: 8 unit test cho `normalizeNote`/`canonicalizeQuote`. |
| `apps/api/test/checkout-quote.int-spec.ts` | **Mới**: 19 integration test. |
| `apps/web/src/features/cart/cart-store.ts` | **Mới**: Zustand persist giỏ. |
| `apps/web/src/features/cart/use-cart-hydrated.ts` | **Mới**: chờ rehydrate. |
| `apps/web/src/features/cart/quote.ts` | **Mới**: `buildQuoteRequest` + `requestQuote`. |
| `apps/web/src/lib/api.ts` | **Sửa**: bỏ `auth` khỏi options trước khi fetch (sửa lint). |
| `apps/web/package.json` | **Sửa**: thêm `zustand@5.0.15`. |
| `apps/api/README.md`, `apps/web/README.md`, `docs/decisions.md` | **Sửa**: ghi endpoint/giỏ + D07-01..10 + Q07. |

### Commands đã chạy và kết quả thật
```powershell
pnpm run lint / typecheck / build / test        # tat ca EXIT 0; unit 33/33 (4 suite)
pnpm --filter @coffee-order/web typecheck/build  # EXIT 0
pnpm --filter @coffee-order/api run test:int     # 61/61 pass (19 quote + 24 catalog + 11 auth + 7 schema)
# HTTP smoke (API 3001 + DB dev seed buoc 04): 10/10 PASS
```

**Unit canonical (8)**: normalize note (trim/gom khoảng trắng/xuống dòng/rỗng→null); canonical bất biến theo thứ tự option và thứ tự dòng; note khác→hash khác; note chỉ khác khoảng trắng→hash giống; recipient được trim.

**Integration quote (19)**: thiếu token→401; giá server base+modifier×qty + note normalize + total=subtotal; persist `checkout_quotes` (requestHash 64 hex, expires_at>created_at); cùng món khác topping→2 dòng giá khác; option không thuộc món→400; thiếu nhóm bắt buộc→400; vượt max topping→400; 2 option cùng nhóm max1→400; variant inactive→409 ITEM_UNAVAILABLE; variant không available tại store→409; cửa hàng đóng→409; quantity 0/21→400; items rỗng→400; option trùng DTO→400; note>200→400; fulfillmentType=DELIVERY→400; trường giá lạ trong body→400; variant L đúng giá.

**HTTP smoke (10)**: thiếu token→401; quote hợp lệ→unitPrice=base+modifiers, lineTotal=unit×qty, total=subtotal, note normalize, quoteId+expiresAt tương lai, không lộ secret; trường giá lạ→400; option lạ→400. Query DB xác nhận `checkout_quotes` có 1 row; đã xóa row + profile smoke sau đó.

### Pass / Fail / Skip
- **PASS**: lint, typecheck (api+web), build (api+web), unit 33/33, integration 61/61, HTTP smoke 10/10, persist quote thật.
- **FAIL**: không còn. Lỗi thật đã sửa: kiểu `Prisma.InputJsonValue` cho snapshot (JSON round-trip); lint Next báo `setState` đồng bộ trong effect của `use-cart-hydrated` (dùng `queueMicrotask`) và `_auth` unused (dùng `delete`).
- **SKIP / chưa làm**: rate limit cho `/quote` (Q07-01, nối Q01-06, bước 08/11); UI checkout (breakdown/đếm ngược/disable khi hết hạn) — chưa có màn web; so-khớp-snapshot khi đặt đơn (PRICE_CHANGED) thuộc **bước 08**.

### Hạn chế
- Quote **không giữ availability/tồn kho** tới lúc đặt — đúng thiết kế; bước 08 kiểm lại và so snapshot.
- Chưa có rate limit; chưa có màn web checkout. Giỏ Zustand đã có store + hook nhưng chưa có UI dùng (menu/dialog chưa dựng).
- `price_snapshot` và `normalizedPayload` lưu JSON; bước 08 sẽ đọc lại để xác thực khi tạo đơn.

### Bước tiếp theo
Bước 08 — Tạo đơn an toàn (`.kiro/steering/08-create-order.md`): `POST /v1/orders` với `Idempotency-Key`, dùng lại `QuotePricingService` trong transaction, so khớp snapshot (QUOTE_EXPIRED/PRICE_CHANGED/ITEM_UNAVAILABLE), ghi order+items+modifiers+payment+history+idempotency trong một transaction, chống retry/đua. Không đánh dấu bước nào khác hoàn thành.

---

## Bước 08 — Tạo đơn an toàn (2026-10-09) — **DONE**

### Dependency bước trước
Bước 07 (`QuotePricingService`, `checkout_quotes`, canonical hash) và bước 04 (schema orders/items/modifiers/payments/history/idempotency_keys + partial unique payment + CHECK công thức tiền). Bước 08 dùng lại **nguyên** logic tính giá của bước 07 nhưng chạy trong transaction tạo đơn.

### Đã kiểm repo trước khi sửa
Chưa có module orders. Không ghi đè file bước trước; chỉ **thêm** module `orders`, feature `place-order` ở web, và contract types cho order.

### File đổi
| File | Thay đổi |
|---|---|
| `packages/contracts/src/index.ts` | **Sửa**: thêm `CreateOrderRequest`, `OrderItemDto`, `OrderItemModifierDto`, `OrderPaymentDto`, `OrderTotalsDto`, `OrderResponse`. |
| `apps/api/src/modules/orders/orders.service.ts` | **Mới**: `createOrder` (replay → kiểm quote → transaction → xử lý xung đột sau rollback), `getOrderForOwner`, `loadOrder`, `uniqueIndexOf`, `insertItems` (protected), `lockCatalogRows`. |
| `apps/api/src/modules/orders/order-code.ts` | **Mới**: `generateOrderCode` — `CF-YYMMDD-XXXX`, ngày theo Asia/Ho_Chi_Minh, base32 bỏ I/L/O/U, `crypto.randomInt`. |
| `apps/api/src/modules/orders/dto/create-order.dto.ts` | **Mới**: kế thừa `QuoteRequestDto` + `quoteId`. |
| `apps/api/src/modules/orders/orders.controller.ts` | **Mới**: `POST /v1/orders` (Idempotency-Key bắt buộc, 201/200, `Cache-Control: no-store`), `GET /v1/orders/:id`. |
| `apps/api/src/modules/orders/orders.module.ts` | **Mới**: import `CheckoutModule` để dùng `QuotePricingService`. |
| `apps/api/src/app.module.ts` | **Sửa**: import `OrdersModule`. |
| `apps/api/src/modules/orders/order-code.spec.ts` | **Mới**: 4 unit test. |
| `apps/api/test/orders.int-spec.ts` | **Mới**: 16 integration test (gồm subclass `FailingOrdersService` để test rollback). |
| `apps/web/src/features/cart/place-order.ts` | **Mới**: session giữ `Idempotency-Key` qua retry; không xóa giỏ trước khi thành công. |
| `apps/api/README.md`, `apps/web/README.md`, `docs/api-contract.md`, `docs/decisions.md` | **Sửa**: ghi endpoint + F08-01..03, D08-01..12, Q08. |

### Hai bug thật đã phát hiện và sửa (có probe làm bằng chứng)
1. **Prisma 7 + adapter-pg không điền `meta.target`** cho P2002 — tên constraint ở `meta.driverAdapterError.cause.constraint.index`. Bản đầu đọc `meta.target` (undefined) → trả `""`, mà `"".includes("code")` là `true`, nên **mọi** unique violation bị hiểu sai thành trùng order code. Hệ quả quan sát được: quote-reuse trả **500** thay vì 409. Đã viết `uniqueIndexOf()` đọc đúng chỗ + fallback, và khớp **chính xác** tên index (vì `orders_quote_id_key` chứa `"key"`, `orders_code_key` chứa `"code"`).
2. **CHECK trả P2039, không phải P2002**, và `chk_quote_expiry_after_created` (bước 04) chặn việc chỉ set `expires_at` về quá khứ. Test ban đầu sai — phải lùi **cả** `created_at` và `expires_at`. Constraint hoạt động đúng.

### Commands đã chạy và kết quả thật
```powershell
pnpm run lint / typecheck / build / test        # tat ca EXIT 0; unit 37/37 (5 suite)
pnpm --filter @coffee-order/web typecheck/build  # EXIT 0
pnpm --filter @coffee-order/api run test:int     # 77/77 pass (16 orders + 19 quote + 24 catalog + 11 auth + 7 schema)
# HTTP smoke end-to-end (API 3001 + DB dev seed): 17/17 PASS
```

**Integration orders (16)** phủ đúng checklist steering: thiếu Idempotency-Key→400; tạo đơn 201 + kiểm **atomic trong DB** (1 item, 2 modifiers, 1 payment UNPAID, 1 history `from_status=null`/`actorId`, mapping có orderId); **double-click** cùng key→200 cùng đơn, DB chỉ 1 đơn; **concurrent** 2 request song song→đúng 1 đơn commit, một 201 một 200, cùng id; **timeout retry**→trả đơn cũ; **replay vẫn trả đơn cũ kể cả khi quote đã hết hạn**; cùng key khác payload→409 IDEMPOTENCY_CONFLICT; **quote reuse** key khác→409 QUOTE_ALREADY_USED; quote hết hạn→410 QUOTE_EXPIRED; **giá đổi sau báo giá**→409 PRICE_CHANGED + không tạo đơn; tắt availability sau báo giá→409 ITEM_UNAVAILABLE + không tạo đơn; payload không khớp quote→400; quote người khác→404; **lỗi giữa chuỗi insert item→rollback sạch** (không còn đơn/mapping) và đặt lại cùng quote vẫn thành công; **đổi menu sau khi đặt→snapshot đơn cũ không đổi** (tên món, giá, tên+giá option đều giữ nguyên); chủ đơn đọc được, người khác→404 không lộ PII.

**HTTP smoke (17)** với API chạy thật trên seed: quote→order 201 (mã `CF-261009-0ZTX`), PLACED, payment UNPAID pay-at-counter, total khớp quote, `Cache-Control: no-store`; double-submit→200 cùng đơn; **concurrent thật→201/200 cùng id**; quote reuse→409 QUOTE_ALREADY_USED; cùng key khác payload→409 IDEMPOTENCY_CONFLICT; chủ đơn đọc 200; người khác 404 không lộ PII. Query DB xác nhận atomic (2 orders ↔ 2 items ↔ 4 modifiers ↔ 2 payments ↔ 2 history ↔ 2 keys); đã dọn dữ liệu smoke, seed catalog còn nguyên.

### Pass / Fail / Skip
- **PASS**: lint, typecheck (api+web), build (api+web), unit 37/37, integration 77/77, HTTP smoke 17/17, atomicity + rollback + snapshot bất biến đều kiểm trên PostgreSQL thật.
- **FAIL**: không còn. Hai bug thật ở trên đã sửa và kiểm lại.
- **SKIP / chưa làm**: rate limit `POST /orders` (Q07-01/Q01-06, bước 11); hủy đơn / `GET /me/orders` / timeline — **bước 09**; UI checkout + confirmation (chưa có màn web); dọn quote/key hết hạn (Q08-01/02).

### Hạn chế
- Chưa có UI: luồng đặt đơn chỉ chạy qua API (đã chứng minh bằng smoke + integration), chưa có màn checkout cho khách.
- Chưa có rate limit nên chưa chống được lạm dụng tạo quote/đơn ở mức hạ tầng.
- `GET /orders/:id` hiện **chỉ** cho chủ đơn; quyền staff/admin xem đơn theo store sẽ thêm ở bước 09.
- Transaction dùng isolation mặc định (Read Committed) + `FOR UPDATE` trên `product_variants`. Đủ cho bất biến giá của MVP; chưa khóa `modifier_options` (giá option đổi giữa lúc kiểm vẫn được bắt bằng so tổng với quote, nhưng không bị khóa).

### Bước tiếp theo
Bước 09 — Xử lý đơn và tracking (`.kiro/steering/09-tracking.md`): chuyển trạng thái với CAS theo `version`, staff đúng store, thu tiền PAY_AT_COUNTER có audit, `COMPLETED` chỉ khi READY và PAID, hủy/từ chối có lý do, `GET /me/orders` + `GET /orders/:id/history`, polling phía web. Không đánh dấu bước nào khác hoàn thành.

---

## Bước 09 — Xử lý đơn và tracking (2026-10-09) — **DONE**

### Dependency bước trước
Bước 08 (`OrdersService.loadOrder`, orders/payments/history đã có), bước 05 (`StoreAccessService`, `@Roles`), bước 04 (`version` trên orders/payments + CHECK `version >= 0`).

### Xung đột tài liệu đã xử lý
Steering bước 09 yêu cầu endpoint thu tiền "kiểm tra **READY**", trong khi **D01-04** (bước 01) cho thu tiền ở `CONFIRMED`/`PREPARING`/`READY`. Tôi **theo steering bước 09 (chỉ `READY`)** vì nó là chỉ thị cho bước này, **chặt hơn** nên vẫn giữ bất biến "không có đường hoàn tiền", và khớp nghiệp vụ trả-tại-quầy-khi-nhận-món. **Tác động đã cập nhật**: D01-04, D02-07 (nút `[Thu tiền]` chỉ hiện ở `READY`), `docs/diagrams/order-lifecycle.mmd`, `docs/api-contract.md`. Ghi thành **D09-02**.

### File đổi
| File | Thay đổi |
|---|---|
| `packages/contracts/src/index.ts` | **Sửa**: `ORDER_TRANSITIONS`, `canTransition`, `PAYMENT_COLLECTABLE_STATUSES`, `canCollectPayment`, `REASON_MAX_LENGTH`, `TRACKING_POLL_INTERVAL_MS`, `OrderListItemDto`, `OrderHistoryEntryDto`, `TransitionRequest`, `CancelOrderRequest`, `CollectPaymentRequest`. |
| `apps/api/src/modules/orders/order-tracking.service.ts` | **Mới**: quyền xem (owner/staff-store/admin → khác 404), `listOwnOrders`, `listStaffOrders` (scope server-side), `getOrder`, `getHistory`, `transition`, `cancel`, `casTransition`, `collectPayment`. |
| `apps/api/src/modules/orders/dto/tracking.dto.ts` | **Mới**: `OrderListQueryDto`, `StaffOrderListQueryDto`, `TransitionDto`, `CancelOrderDto`, `CollectPaymentDto`. |
| `apps/api/src/modules/orders/orders.controller.ts` | **Sửa**: thêm `GET /me/orders`, `GET /orders/:id` (mở cho staff/admin), `GET /orders/:id/history`, `POST /orders/:id/cancel`; header `no-store, private`. |
| `apps/api/src/modules/orders/orders-staff.controller.ts` | **Mới**: `GET /staff/orders`, `POST /staff/orders/:id/transitions`, `POST /staff/orders/:id/payments`. |
| `apps/api/src/modules/orders/orders.module.ts` | **Sửa**: thêm controller staff + `OrderTrackingService`. |
| `apps/api/src/modules/orders/state-machine.spec.ts` | **Mới**: 10 unit test đồ thị trạng thái + điều kiện thu tiền. |
| `apps/api/test/tracking.int-spec.ts` | **Mới**: 27 integration test. |
| `apps/api/test/orders.int-spec.ts` | **Sửa**: assertion `Cache-Control` cũ (`"no-store"`) không còn khớp sau khi thêm `private`. |
| `apps/web/src/features/orders/use-order-tracking.ts` | **Mới**: polling 7s chỉ khi tab hiện, dừng ở terminal, refetch focus, `useInvalidateOrder`. |
| `apps/web/src/features/orders/orders-api.ts` | **Mới**: client cho 5 endpoint tracking. |
| `docs/diagrams/order-lifecycle.mmd` | **Sửa**: ghi rõ thu tiền chỉ ở READY + ghi chú bất biến không-hoàn-tiền. |
| `docs/api-contract.md`, `docs/decisions.md`, 2 README | **Sửa**: đánh dấu đã hiện thực + D09-01..12 + Q09. |

### Commands đã chạy và kết quả thật
```powershell
pnpm run lint / typecheck / build / test        # tat ca EXIT 0; unit 47/47 (6 suite)
pnpm --filter @coffee-order/web typecheck/build  # EXIT 0
pnpm --filter @coffee-order/api run test:int     # 104/104 pass (27 tracking + 16 orders + 19 quote + 24 catalog + 11 auth + 7 schema)
# HTTP smoke tron vong doi (API 3001 + DB dev seed): 21/21 PASS
```

**Integration tracking (27)** phủ đúng checklist steering: vòng đời đầy đủ PLACED→CONFIRMED→PREPARING→READY→thu tiền→COMPLETED với `version` tăng đúng từng bước; **bỏ bước** (PLACED→READY) → 409 INVALID_TRANSITION; **lùi bước** (PREPARING→CONFIRMED) → 409; `expectedVersion` sai → 409 VERSION_CONFLICT; **hai staff đua cùng transition** → một 200 một 409 và **chỉ một dòng history**, version = 1; từ chối không lý do → 400, có lý do → 200 + lưu `reason`/`actorId`; từ chối khi đã CONFIRMED → 409; **STAFF store B không chuyển trạng thái/thu tiền đơn store A** → 403; bảng đơn staff **chỉ** chứa store được gán; **`storeId` client không mở rộng scope** (staff A lọc store B → rỗng); ADMIN thấy mọi store; CUSTOMER gọi board → 403; lọc theo status; **thu tiền khi chưa READY** (PLACED và CONFIRMED) → 409; **thu tiền lặp** → 409 + payment chỉ `version=1` + một `collected_by`; **hai staff đua thu tiền** → đúng một 200; **unpaid completion** → 409; chủ đơn hủy ở PLACED → CANCELLED + history actor là khách; hủy sau CONFIRMED → 409; người khác hủy → 404 không lộ PII; STAFF gọi cancel của khách → 403; `/me/orders` chỉ đơn của mình + phân trang + `no-store`; **history đúng thứ tự thời gian, `from_status` đầu = null**; khách **không** thấy `actorName`, staff thấy; staff đúng store đọc được chi tiết, staff store khác → 404; **không có endpoint PATCH tùy ý** (cả hai route trả 404).

**HTTP smoke (21)** trên seed thật: trọn vòng đời với `version` 0→4; COMPLETED khi chưa PAID → 409; thu tiền ở READY → PAID có `paidAt`; thu tiền lặp → 409; terminal không chuyển tiếp → 409; history `PLACED → CONFIRMED → PREPARING → READY → COMPLETED` đúng thứ tự, `from_status` đầu null; khách không thấy `actorName`, staff thấy; hủy ở PLACED được, sau CONFIRMED → 409; từ chối không lý do → 400, có lý do → REJECTED; `/me/orders` phân trang + `no-store`; staff board đúng scope; CUSTOMER → 403.

**Bằng chứng bất biến không-hoàn-tiền** (query DB sau smoke): đơn `COMPLETED` có payment `PAID` version 1 với cả `collected_by` và `paid_at`; đơn `CANCELLED` và `REJECTED` đều có payment **`UNPAID`** — không tồn tại đơn đã thu tiền bị hủy.

### Pass / Fail / Skip
- **PASS**: lint, typecheck (api+web), build (api+web), unit 47/47, integration 104/104, HTTP smoke 21/21, audit `collected_by`/`paid_at`, bất biến không-hoàn-tiền.
- **FAIL**: không còn. Một lỗi thật đã sửa: assertion `Cache-Control` trong test bước 08 mong đúng `"no-store"` nhưng bước 09 đổi thành `"no-store, private"` → đổi sang `toContain`.
- **SKIP / chưa làm**: **UI** tracking + staff board (đã có hook polling + API client, chưa dựng màn); rate limit (Q07-01, bước 11); trạng thái abandoned cho đơn READY bị bỏ (Q09-01/Q01-01); chặn staff tự xử lý đơn của mình (Q09-02/Q01-05); **delivery và WebSocket chưa bật** (ngoài MVP).

### Hạn chế
- Chưa có màn web nào cho tracking/staff board — toàn bộ luồng chứng minh qua API (integration + smoke). Hook polling đã viết nhưng chưa có component dùng.
- `transition` kiểm điều kiện (graph, payment PAID) **trước** CAS rồi mới CAS; giữa hai bước có cửa sổ nhỏ, nhưng CAS theo `(id, status, version)` đảm bảo không ghi sai trạng thái — bên thua nhận 409.
- Chưa chặn self-transition (staff tự xử lý đơn của chính mình) — Q09-02.
- Đơn `READY` khách không đến lấy vẫn nằm ở `READY`, chưa có cơ chế xử lý — Q09-01.

### Bước tiếp theo
Bước 10 — Kiểm thử theo rủi ro (`.kiro/steering/10-testing.md`): rà lại ma trận T01–T13 trong `docs/test-plan.md` so với test đã có, bổ sung các khoảng trống đã ghi (REQ-005/006/100/101/205/301/308/400/408/500/601/603/700/704), dựng CI gate và báo cáo passed/failed/skipped riêng. Không đánh dấu bước nào khác hoàn thành.
