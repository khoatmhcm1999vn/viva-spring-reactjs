# Prompt thực hiện từng bước
Dán từng prompt vào chat Kiro sau khi mở đúng project root. Có thể chọn manual steering bằng menu `/` hoặc tham chiếu `#tên-file`; nếu phiên bản Kiro không hỗ trợ, thêm file trực tiếp vào context. Các bước phụ thuộc kết quả thực tế của bước trước.

## Bước 01 — Chốt nghiệp vụ
```text
#01-requirements
Đọc product, tech, structure, domain-rules và docs/progress.md. Thực hiện bước 01 (Chốt nghiệp vụ) cho repository hiện tại. Đọc toàn bộ .kiro/steering/01-requirements.md nếu file chưa được nạp. Kiểm tra dependency bước trước; triển khai phần cần thiết trong phạm vi đã chốt, giữ code hiện có. Chạy các kiểm tra thực sự khả dụng, báo pass/fail/skip và cập nhật progress bằng bằng chứng. Không coi tài liệu thiết kế là chức năng đã chạy. Khi xong, tóm tắt file đổi, cách kiểm tra và bước tiếp theo.
```

## Bước 02 — Phác thảo giao diện
```text
#02-wireframes
Đọc product, tech, structure, domain-rules và docs/progress.md. Thực hiện bước 02 (Phác thảo giao diện) cho repository hiện tại. Đọc toàn bộ .kiro/steering/02-wireframes.md nếu file chưa được nạp. Kiểm tra dependency bước trước; triển khai phần cần thiết trong phạm vi đã chốt, giữ code hiện có. Chạy các kiểm tra thực sự khả dụng, báo pass/fail/skip và cập nhật progress bằng bằng chứng. Không coi tài liệu thiết kế là chức năng đã chạy. Khi xong, tóm tắt file đổi, cách kiểm tra và bước tiếp theo.
```

## Bước 03 — Khởi tạo monorepo
```text
#03-bootstrap
Đọc product, tech, structure, domain-rules và docs/progress.md. Thực hiện bước 03 (Khởi tạo monorepo) cho repository hiện tại. Đọc toàn bộ .kiro/steering/03-bootstrap.md nếu file chưa được nạp. Kiểm tra dependency bước trước; triển khai phần cần thiết trong phạm vi đã chốt, giữ code hiện có. Chạy các kiểm tra thực sự khả dụng, báo pass/fail/skip và cập nhật progress bằng bằng chứng. Không coi tài liệu thiết kế là chức năng đã chạy. Khi xong, tóm tắt file đổi, cách kiểm tra và bước tiếp theo.
```

## Bước 04 — Schema, migration và seed
```text
#04-database
Đọc product, tech, structure, domain-rules và docs/progress.md. Thực hiện bước 04 (Schema, migration và seed) cho repository hiện tại. Đọc toàn bộ .kiro/steering/04-database.md nếu file chưa được nạp. Kiểm tra dependency bước trước; triển khai phần cần thiết trong phạm vi đã chốt, giữ code hiện có. Chạy các kiểm tra thực sự khả dụng, báo pass/fail/skip và cập nhật progress bằng bằng chứng. Không coi tài liệu thiết kế là chức năng đã chạy. Khi xong, tóm tắt file đổi, cách kiểm tra và bước tiếp theo.
```

## Bước 05 — Xác thực và quyền
```text
#05-auth-rbac
Đọc product, tech, structure, domain-rules và docs/progress.md. Thực hiện bước 05 (Xác thực và quyền) cho repository hiện tại. Đọc toàn bộ .kiro/steering/05-auth-rbac.md nếu file chưa được nạp. Kiểm tra dependency bước trước; triển khai phần cần thiết trong phạm vi đã chốt, giữ code hiện có. Chạy các kiểm tra thực sự khả dụng, báo pass/fail/skip và cập nhật progress bằng bằng chứng. Không coi tài liệu thiết kế là chức năng đã chạy. Khi xong, tóm tắt file đổi, cách kiểm tra và bước tiếp theo.
```

## Bước 06 — Quản lý danh mục và món
```text
#06-catalog
Đọc product, tech, structure, domain-rules và docs/progress.md. Thực hiện bước 06 (Quản lý danh mục và món) cho repository hiện tại. Đọc toàn bộ .kiro/steering/06-catalog.md nếu file chưa được nạp. Kiểm tra dependency bước trước; triển khai phần cần thiết trong phạm vi đã chốt, giữ code hiện có. Chạy các kiểm tra thực sự khả dụng, báo pass/fail/skip và cập nhật progress bằng bằng chứng. Không coi tài liệu thiết kế là chức năng đã chạy. Khi xong, tóm tắt file đổi, cách kiểm tra và bước tiếp theo.
```

## Bước 07 — Giỏ hàng và báo giá
```text
#07-cart-quote
Đọc product, tech, structure, domain-rules và docs/progress.md. Thực hiện bước 07 (Giỏ hàng và báo giá) cho repository hiện tại. Đọc toàn bộ .kiro/steering/07-cart-quote.md nếu file chưa được nạp. Kiểm tra dependency bước trước; triển khai phần cần thiết trong phạm vi đã chốt, giữ code hiện có. Chạy các kiểm tra thực sự khả dụng, báo pass/fail/skip và cập nhật progress bằng bằng chứng. Không coi tài liệu thiết kế là chức năng đã chạy. Khi xong, tóm tắt file đổi, cách kiểm tra và bước tiếp theo.
```

## Bước 08 — Tạo đơn an toàn
```text
#08-create-order
Đọc product, tech, structure, domain-rules và docs/progress.md. Thực hiện bước 08 (Tạo đơn an toàn) cho repository hiện tại. Đọc toàn bộ .kiro/steering/08-create-order.md nếu file chưa được nạp. Kiểm tra dependency bước trước; triển khai phần cần thiết trong phạm vi đã chốt, giữ code hiện có. Chạy các kiểm tra thực sự khả dụng, báo pass/fail/skip và cập nhật progress bằng bằng chứng. Không coi tài liệu thiết kế là chức năng đã chạy. Khi xong, tóm tắt file đổi, cách kiểm tra và bước tiếp theo.
```

## Bước 09 — Xử lý đơn và tracking
```text
#09-tracking
Đọc product, tech, structure, domain-rules và docs/progress.md. Thực hiện bước 09 (Xử lý đơn và tracking) cho repository hiện tại. Đọc toàn bộ .kiro/steering/09-tracking.md nếu file chưa được nạp. Kiểm tra dependency bước trước; triển khai phần cần thiết trong phạm vi đã chốt, giữ code hiện có. Chạy các kiểm tra thực sự khả dụng, báo pass/fail/skip và cập nhật progress bằng bằng chứng. Không coi tài liệu thiết kế là chức năng đã chạy. Khi xong, tóm tắt file đổi, cách kiểm tra và bước tiếp theo.
```

## Bước 10 — Kiểm thử theo rủi ro
```text
#10-testing
Đọc product, tech, structure, domain-rules và docs/progress.md. Thực hiện bước 10 (Kiểm thử theo rủi ro) cho repository hiện tại. Đọc toàn bộ .kiro/steering/10-testing.md nếu file chưa được nạp. Kiểm tra dependency bước trước; triển khai phần cần thiết trong phạm vi đã chốt, giữ code hiện có. Chạy các kiểm tra thực sự khả dụng, báo pass/fail/skip và cập nhật progress bằng bằng chứng. Không coi tài liệu thiết kế là chức năng đã chạy. Khi xong, tóm tắt file đổi, cách kiểm tra và bước tiếp theo.
```

## Bước 11 — Triển khai
```text
#11-deployment
Đọc product, tech, structure, domain-rules và docs/progress.md. Thực hiện bước 11 (Triển khai) cho repository hiện tại. Đọc toàn bộ .kiro/steering/11-deployment.md nếu file chưa được nạp. Kiểm tra dependency bước trước; triển khai phần cần thiết trong phạm vi đã chốt, giữ code hiện có. Chạy các kiểm tra thực sự khả dụng, báo pass/fail/skip và cập nhật progress bằng bằng chứng. Không coi tài liệu thiết kế là chức năng đã chạy. Khi xong, tóm tắt file đổi, cách kiểm tra và bước tiếp theo.
```

## Bước 12 — Bàn giao và trình bày
```text
#12-demo-handover
Đọc product, tech, structure, domain-rules và docs/progress.md. Thực hiện bước 12 (Bàn giao và trình bày) cho repository hiện tại. Đọc toàn bộ .kiro/steering/12-demo-handover.md nếu file chưa được nạp. Kiểm tra dependency bước trước; triển khai phần cần thiết trong phạm vi đã chốt, giữ code hiện có. Chạy các kiểm tra thực sự khả dụng, báo pass/fail/skip và cập nhật progress bằng bằng chứng. Không coi tài liệu thiết kế là chức năng đã chạy. Khi xong, tóm tắt file đổi, cách kiểm tra và bước tiếp theo.
```
