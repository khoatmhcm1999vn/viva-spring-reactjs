# Coffee Order — Kiro steering starter
Đây là bộ steering và tài liệu thiết kế cho Kiro, chưa phải app runnable. Không có package.json/lockfile/Prisma schema hay Docker image đã build. Các file runtime sẽ được Kiro tạo và kiểm tra theo từng bước. Không có thao tác cài vào dự án Kiro đang mở trên máy bạn.

## Nhập vào dự án
1. Giải nén gói; nếu repo mới, mở thư mục coffee-order làm workspace root trong Kiro.
2. Nếu đã có boilerplate, copy .kiro/steering và docs/ vào repo, so sánh/merge README và env examples; giữ code/config/.kiro hiện có. Không chọn Replace All. Nếu repo có steering trùng tên, merge có chủ đích.
3. Kiểm tra Kiro Steering panel: product.md, tech.md, structure.md, domain-rules.md dùng inclusion: always; 12 file bước dùng inclusion: manual. Không cần model-specific configuration.
4. Mở START-HERE.md, gửi prompt bước 1; lần lượt bước 2–12 dựa trên progress và kiểm tra thực tế. Manual files có thể chọn bằng #name hoặc slash menu tùy Kiro version. Không yêu cầu agent chạy cả 12 bước trong một lần.
5. Với Kiro custom agent, tài liệu chính thức yêu cầu khai báo steering trong resources. Merge vào agent hiện có; ví dụ resources: ["file://.kiro/steering/product.md", "file://.kiro/steering/tech.md", "file://.kiro/steering/structure.md", "file://.kiro/steering/domain-rules.md"], rồi thêm file bước đang làm. Không ghi đè cấu hình tools/model/permissions. Đọc docs Kiro của phiên bản đang dùng.

## Sơ đồ có thể chỉnh sửa
- docs/diagrams/architecture.drawio: web, API, Auth, Postgres, Storage và deploy boundaries.
- docs/diagrams/erd.drawio: hai trang Catalog và Orders; các bảng xám là cùng entity được lặp để đọc FK, không phải bảng mới.
- docs/diagrams/order-lifecycle.drawio: pickup states và điều kiện payment; delivery chỉ là nhánh tương lai trong tài liệu.
- docs/diagrams/*.mmd: bản Mermaid dễ diff.
Mở diagrams.net, chọn File → Open From → Device và chọn .drawio. Không cần cài MCP để chỉnh các file XML này. Không có live integration Kiro↔Draw.io được cấu hình trong gói.

## Cấu trúc
apps/web và apps/api, packages/contracts là thư mục đích cho code; infra/ là vị trí tạo Dockerfile.api và compose.prod.yml ở bước 11. README trong từng thư mục ghi mục đích. docs/data-model.md và docs/api-contract.md là thiết kế chi tiết.

## Lưu ý
Không có secrets trong gói. Env examples chỉ chứa tên biến, cần giá trị từ project của bạn. Dữ liệu/giá dùng cho demo phải ghi rõ giả lập. Các nguồn và giới hạn xác minh nằm trong docs/sources.md. Bộ tài liệu không xác minh tên/khả năng model trong tài khoản Kiro của bạn.
