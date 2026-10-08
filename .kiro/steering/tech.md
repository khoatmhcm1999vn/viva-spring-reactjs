---
inclusion: always
---

# Công nghệ và ranh giới
- Monorepo pnpm workspaces; apps/web: Next.js App Router, React, TypeScript strict, Tailwind, shadcn/ui; TanStack Query cho server state; Zustand persist cho giỏ; React Hook Form + Zod cho form.
- apps/api: NestJS TypeScript, REST /v1, Swagger /docs, Prisma + PostgreSQL. DTO backend dùng class-validator/class-transformer và global ValidationPipe whitelist + forbidNonWhitelisted. Không triển khai hai tầng validation runtime cho cùng DTO nếu không cần.
- packages/contracts: DTO/schema công khai hoặc client types từ OpenAPI. Không import Prisma client/models, Node-only dependency hay secrets vào web. Backend là nguồn chuẩn của hợp đồng API.
- Supabase: managed Postgres, Auth, Storage. Frontend gửi Supabase access token bằng Authorization: Bearer. NestJS xác minh chữ ký, issuer, expiry và audience phù hợp cấu hình dự án qua SDK/thư viện; map sub sang profiles và tra quyền ở DB. Không tự viết crypto hoặc hệ auth thứ hai.
- Frontend Vercel; API Docker trên VM Linux, Caddy/Nginx HTTPS; Postgres trên Supabase. Dev có thể dùng Postgres Docker, integration tests dùng DB riêng; Auth vẫn dùng Supabase dev project hoặc local Supabase đã cấu hình.
- Chọn phiên bản stable tương thích khi bootstrap, kiểm tra docs thực tế, ghi versions trong docs/decisions.md và commit lockfile. Không dùng @latest trong production Dockerfile, không tự nâng major khi làm feature.
- Tracking MVP: polling 5–10 giây, dừng ở terminal state, tải lại khi focus. Không thêm Redis/Kafka/microservices cho MVP.
- Tiền là integer VND; thời gian timestamptz và ISO 8601, hiển thị Asia/Ho_Chi_Minh.
