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

## Chưa có
Xác thực Supabase và guard phân quyền (bước 05). Module nghiệp vụ catalog/checkout/orders/payments (bước 06–09). Profile staff/admin **không** được seed — phải tạo qua Supabase Auth thật ở bước 05.
