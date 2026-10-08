# Tiến độ

Bộ hướng dẫn đã được tạo. Ứng dụng, migrations, tests và deployment chưa được triển khai.

| Bước | Trạng thái | Bằng chứng / hạn chế |
|---|---|---|
| 01 Chốt nghiệp vụ | DONE (tài liệu) | `docs/requirements.md` (50 REQ), `docs/decisions.md` (D01-01..D01-15, Q01-01..Q01-07), `docs/test-plan.md` map REQ. Chi tiết ở mục “Bước 01” bên dưới. Chưa có code/app. |
| 02 Phác thảo giao diện | DONE (tài liệu) | `docs/wireframes.md` (11 màn, map route→feature→REQ, walkthrough), `docs/mockups/index.html` (11 panel tĩnh), `docs/decisions.md` D02-01..D02-15 / Q02-01..Q02-07. Chi tiết ở mục “Bước 02”. Chưa có component React nào. |
| 03 Khởi tạo monorepo | TODO | Chưa thực hiện trong repository ứng dụng |
| 04 Schema, migration và seed | TODO | Chưa thực hiện trong repository ứng dụng |
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
