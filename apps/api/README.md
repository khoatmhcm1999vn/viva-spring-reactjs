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
| `GET /v1/ready` | Readiness. **200** khi READY, **503** khi NOT_READY. Bước 03 chỉ kiểm `DATABASE_URL` đã đặt chưa; bước 04 đổi sang truy vấn thật qua Prisma. |
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
  modules/health/                    health + readiness + spec
```

Theo `.kiro/steering/structure.md`: controller nhận DTO và gọi service; service giữ nghiệp vụ; Prisma truy cập DB. `src/modules/` sẽ có thêm users, stores, catalog, checkout, orders, payments ở các bước sau.

## Chưa có
Prisma schema và migrations (bước 04). Xác thực Supabase và guard phân quyền (bước 05). Mọi module nghiệp vụ (bước 06–09).
