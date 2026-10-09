# Tiến độ

Bộ hướng dẫn đã được tạo. Ứng dụng, migrations, tests và deployment chưa được triển khai.

| Bước | Trạng thái | Bằng chứng / hạn chế |
|---|---|---|
| 01 Chốt nghiệp vụ | DONE (tài liệu) | `docs/requirements.md` (50 REQ), `docs/decisions.md` (D01-01..D01-15, Q01-01..Q01-07), `docs/test-plan.md` map REQ. Chi tiết ở mục “Bước 01” bên dưới. Chưa có code/app. |
| 02 Phác thảo giao diện | DONE (tài liệu) | `docs/wireframes.md` (11 màn, map route→feature→REQ, walkthrough), `docs/mockups/index.html` (11 panel tĩnh), `docs/decisions.md` D02-01..D02-15 / Q02-01..Q02-07. Chi tiết ở mục “Bước 02”. Chưa có component React nào. |
| 03 Khởi tạo monorepo | **DONE (đã chạy)** | pnpm workspaces 4 project. `install --frozen-lockfile`, `lint`, `typecheck`, `build`, `test` đều exit 0; 7/7 jest pass; 24/24 smoke HTTP pass; web gọi được `/v1/health` thật. Phiên bản chốt ở `docs/decisions.md`. Chi tiết ở mục “Bước 03”. |
| 04 Schema, migration và seed | **DONE (đã chạy)** | Prisma 7.10 schema theo data-model; 2 migration áp lên PostgreSQL thật; seed idempotent (1 store, 4 cat, 12 món, 19 variant, 3 group, 9 option); 7/7 integration test pass (CHECK/FK/UNIQUE/rollback); `/v1/ready` trả READY qua `SELECT 1`. Chi tiết ở mục “Bước 04”. |
| 05 Xác thực và quyền | TODO | Chưa thực hiện trong repository ứng dụng |
| 06 Quản lý danh mục và món | TODO | Chưa thực hiện trong repository ứng dụng |
| 07 Giỏ hàng và báo giá | TODO | Chưa thực hiện trong repository ứng dụng |
| 08 Tạo đơn an toàn | TODO | Chưa thực hiện trong repository ứng dụng |
| 09 Xử lý đơn và tracking | TODO | Chưa thực hiện trong repository ứng dụng |
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
