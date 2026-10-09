# Public contracts — @coffee-order/contracts

Hợp đồng công khai dùng chung giữa `apps/web` và `apps/api`. Tạo ở bước 03.

## Ranh giới
- **Browser-safe**: không import Prisma client/model, không dùng API chỉ có trên Node, không chứa secret hay connection string.
- **Backend là nguồn chuẩn của hợp đồng API.** Gói này chỉ khai báo những gì cả hai bên đều đọc; nghiệp vụ nằm ở service của NestJS.
- Build ra **CommonJS** + `.d.ts` nên NestJS (CJS) và bundler của Next đều đọc được.

## Nội dung hiện có
Enum nghiệp vụ (`UserRole`, `FulfillmentType`, `PaymentMethod`, `OrderStatus`, `PaymentStatus`), tập trạng thái terminal, envelope lỗi (`ApiErrorCode`, `ApiErrorBody`), `Paginated<T>`, kiểu health/readiness, và hằng số dùng chung (`CART_LIMITS`, `QUOTE_TTL_SECONDS`, `MAX_SIGNED_INT32`).

Dùng `const object` + union type thay vì `enum` để tương thích `isolatedModules` và tree-shake được ở phía web.

## Build
```powershell
pnpm --filter @coffee-order/contracts run build
```
Phải build trước `apps/api` và `apps/web`; script `pnpm build` ở root đã xếp đúng thứ tự.

## Quyết định còn mở
Bước 03 dùng DTO/type viết tay. Việc chuyển sang sinh client types từ OpenAPI của Swagger (kèm check drift) chưa chốt — xem `docs/decisions.md`.
