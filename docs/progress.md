# Tiến độ

Bộ hướng dẫn đã được tạo. Ứng dụng, migrations, tests và deployment chưa được triển khai.

| Bước | Trạng thái | Bằng chứng / hạn chế |
|---|---|---|
| 01 Chốt nghiệp vụ | DONE (tài liệu) | `docs/requirements.md` (50 REQ), `docs/decisions.md` (D01-01..D01-15, Q01-01..Q01-07), `docs/test-plan.md` map REQ. Chi tiết ở mục “Bước 01” bên dưới. Chưa có code/app. |
| 02 Phác thảo giao diện | TODO | Chưa thực hiện trong repository ứng dụng |
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
