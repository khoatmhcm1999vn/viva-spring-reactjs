# Backend — @coffee-order/api

NestJS 11 (CommonJS), REST dưới tiền tố `/v1`, Swagger ở `/docs`. Khởi tạo ở bước 03.

## Chạy
```powershell
pnpm --filter @coffee-order/api run start:dev   # watch, cổng 3001
pnpm --filter @coffee-order/api run build
pnpm --filter @coffee-order/api run start       # chạy dist/main.js
```
Từ root: `pnpm dev:api`.

Copy `.env.example` thành `.env` trước khi chạy local. API **fail fast** khi `NODE_ENV`, `PORT` hoặc `CORS_ORIGINS` sai định dạng, và từ chối `CORS_ORIGINS=*` vì API nhận `Authorization` header.

## Endpoint hiện có
| Route | Mô tả |
|---|---|
| `GET /v1/health` | Liveness. Không đọc DB, không trả secret hay giá trị biến môi trường. |
| `GET /v1/ready` | Readiness. **200** khi READY, **503** khi NOT_READY. Từ bước 04 chạy `SELECT 1` thật qua Prisma: `OK` khi query thành công, `NOT_CONFIGURED` khi chưa có `DATABASE_URL`, `ERROR` khi có URL nhưng kết nối/truy vấn lỗi. |
| `GET /docs` | Swagger UI. `GET /docs-json` là OpenAPI spec. |

## Cấu trúc
```
src/
  main.ts                            bootstrap: prefix /v1, ValidationPipe, CORS, Swagger
  app.module.ts
  common/config/app-config.ts        đọc + kiểm env một lần, không lưu giá trị secret
  common/config/app-config.module.ts provider @Global
  common/filters/                    filter lỗi toàn cục, body {code,message,details,requestId}
  common/middleware/                 request-id
  prisma/prisma.service.ts           PrismaClient + driver adapter (@prisma/adapter-pg)
  prisma/prisma.module.ts            @Global, cung cấp PrismaService
  generated/prisma/                  client Prisma sinh ra (gitignored, chạy prisma generate)
  modules/health/                    health + readiness + spec
prisma/
  schema.prisma                      schema theo docs/data-model.md
  migrations/                        2 migration: init + check-constraints
  seed.ts                            seed idempotent (1 store, 4 category, 12 món, 3 modifier group)
prisma.config.ts                     Prisma 7: DATABASE_URL + đường dẫn migration/seed
```

Theo `.kiro/steering/structure.md`: controller nhận DTO và gọi service; service giữ nghiệp vụ; Prisma truy cập DB. `src/modules/` sẽ có thêm users, stores, catalog, checkout, orders, payments ở các bước sau.

## Database (dev/local)
```powershell
# Khởi động Postgres dev (5434) + test (5435)
docker compose -f ../../infra/compose.dev.yml up -d

# Áp migration lên DB dev
pnpm --filter @coffee-order/api exec prisma migrate dev
# Sinh client (sau khi đổi schema hoặc clone mới)
pnpm --filter @coffee-order/api run prisma:generate
# Seed dữ liệu demo (idempotent)
pnpm --filter @coffee-order/api run db:seed
```
`DATABASE_URL` đặt trong `apps/api/.env` (gitignored). Production dùng `prisma migrate deploy`, **không** dùng `db push` hay `migrate reset`.

## Test tích hợp DB
```powershell
$env:TEST_DATABASE_URL="postgresql://coffee:coffee_test_pw@localhost:5435/coffee_order_test?schema=public"
pnpm --filter @coffee-order/api run test:int
```
Suite tự **skip** nếu `TEST_DATABASE_URL` chưa đặt, nên `pnpm test` mặc định không chạm DB. Có guard từ chối chạy nếu URL trỏ production hoặc trùng DB dev (vì test gọi `migrate reset`).

## Xác thực và phân quyền (bước 05)
- `GET /v1/me` — hồ sơ người dùng đang đăng nhập (cần Bearer token).
- `AuthGuard` + `RolesGuard` đăng ký **global** (APP_GUARD). Mọi route cần token trừ route gắn `@Public()` (health, và catalog ở bước 06).
- Token verify server-side bằng `jose`: chữ ký (JWKS ES256/RS256 qua `SUPABASE_URL`, hoặc HS256 qua `SUPABASE_JWT_SECRET`) + issuer + audience + expiry. Không chỉ decode.
- `sub` → `profiles` (auto-provision role CUSTOMER lần đầu). Role luôn đọc từ DB, không từ token/metadata.
- Quyền theo cửa hàng kiểm ở service (`StoreAccessService.assertCanActForStore`), không chỉ ở guard, để internal call không bypass được.

Decorators: `@Public()`, `@Roles(...)`, `@CurrentUser()` ở `src/modules/auth/auth.decorators.ts`.

### Cấu hình Supabase cần làm khi có project thật
- Đặt `SUPABASE_URL` (ưu tiên JWKS) hoặc `SUPABASE_JWT_SECRET` (HS256 legacy) trong `apps/api/.env`.
- Trong Supabase: **tắt Data API cho các bảng nghiệp vụ** (orders, payments, order_status_history, ...) hoặc đặt chúng ngoài schema expose — browser không được ghi trực tiếp qua Data API. Mọi thay đổi đơn chỉ qua API NestJS. Prisma dùng role riêng ở backend, không dựa vào RLS để bảo vệ.
- Nâng role (STAFF/ADMIN) chỉ qua flow admin trong DB, không qua `user_metadata` của signup.

## Catalog (bước 06)
Công khai (`@Public`):
| Route | Mô tả |
|---|---|
| `GET /v1/categories` | Danh mục đang hoạt động (`?includeInactive` chưa dùng ở UI khách). |
| `GET /v1/products?storeId=&categoryId=&q=&page=&limit=` | Danh sách món, phân trang (limit ≤ 100). Có `storeId` thì mỗi variant có `available` theo `store_variants`, và `fromPriceVnd` chỉ tính variant còn bán. |
| `GET /v1/products/:id?storeId=` | Chi tiết món kèm variants + `modifierGroups` (luật min/max). |

Admin (`@Roles("ADMIN")`): `POST/PATCH /v1/admin/categories`, `/v1/admin/products`, `/v1/admin/products/:productId/variants`, `/v1/admin/modifier-groups`, `/v1/admin/modifier-groups/:groupId/options`, và `PUT /v1/admin/products/:productId/modifier-groups` (thay cả tập nhóm). Không có xóa vật lý — dùng `isActive` để ẩn.

Staff/admin (`@Roles("STAFF","ADMIN")`): `PATCH /v1/staff/stores/:storeId/variants/:variantId` bật/tắt bán tại cửa hàng. Quyền store kiểm ở `StoreAccessService` (service layer).

Lỗi: slug/SKU trùng, size trùng, `maxSelect < minSelect`, giá âm → **400 VALIDATION_ERROR**. Món/danh mục ẩn hoặc không tồn tại → **404**. Cửa hàng tạm đóng → **409 ITEM_UNAVAILABLE**.

## Chưa có
Giỏ hàng + quote (bước 07), đặt đơn (bước 08), xử lý đơn + thanh toán (bước 09). **Upload ảnh món**: hiện `imagePath` nhận string path do admin gửi; endpoint signed upload qua Supabase Storage chưa làm (chưa có project) — xem Q06. Profile staff/admin **không** được seed. FK `profiles.id → auth.users.id` (Q04-01) chưa hiện thực.
