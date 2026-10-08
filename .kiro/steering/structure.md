---
inclusion: always
---

# Cấu trúc và cách làm
```
coffee-order/
  .kiro/steering/                 # Foundation + 12 bước manual
  apps/web/src/app/               # Routes, customer và admin/staff
  apps/web/src/features/          # catalog, cart, checkout, orders
  apps/web/src/lib/               # API client, auth, query
  apps/api/src/modules/           # users, stores, catalog, checkout, orders, payments
  apps/api/src/common/            # guards, filters, validation
  apps/api/prisma/                # schema, migrations, seed
  packages/contracts/src/         # Hợp đồng công khai
  infra/                         # Dockerfile.api, compose.prod.yml tạo ở bước 11
  docs/diagrams/                  # Draw.io + Mermaid
  docs/progress.md                # Bằng chứng hoàn thành theo bước
```

Controller nhận DTO và gọi service; service giữ nghiệp vụ; Prisma truy cập DB. Dùng transaction client xuyên các thao tác trong cùng transaction. Không thực hiện gọi cổng thanh toán/Storage trong DB transaction.

Đọc quy tắc nền, domain-rules.md và steering bước đang làm. Trước bootstrap, kiểm tra repo hiện có và giữ code/config đang dùng; bộ này chỉ là khung tài liệu. Không ghi đè file hiện có khi nhập bộ hướng dẫn vào repo khác.

Đọc docs/progress.md để tiếp tục; chưa có bằng chứng thì chưa coi bước đã xong. Ghi file đổi, lệnh kiểm tra, kết quả thực tế, hạn chế và bước tiếp theo. Không báo test pass nếu chưa chạy. Chỉ triển khai bước được yêu cầu và dependency cần thiết; không tự tạo tài nguyên cloud trả phí.

Khi thay đổi schema/API/trạng thái, cập nhật docs/data-model.md, docs/api-contract.md, diagrams và test liên quan. Chỉnh Draw.io XML bằng công cụ hoặc trực tiếp được phép; giữ ID duy nhất, FK/cardinality và nhãn công nghệ đúng. Source chuẩn nghiệp vụ là domain-rules.md; schema chuẩn thực thi là Prisma migrations sau khi được tạo.
