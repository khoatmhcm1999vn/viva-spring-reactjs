# Runbook mục tiêu — chưa có hạ tầng được tạo
1. Chọn compatible Node/package versions, build API và contracts trên local, xác định output path. Ghi image tag/digest.
2. Supabase dev/demo project: Auth redirect allowlist, Storage bucket/policies, business schema exposure/RLS, DB role backend. Không paste credentials vào chat/Git.
3. Copy Dashboard connection string; persistent VM dùng direct khi hỗ trợ IPv6 hoặc session pooler cho IPv4; TLS certificate validation. Theo Prisma version đã khóa để cấu hình migrations/client/adapter; không copy cấu hình phiên bản khác.
4. VM Linux cài Docker/Compose; backend và proxy network nội bộ, chỉ public HTTPS/HTTP cần thiết; secrets truyền runtime. API config gồm DATABASE_URL, SUPABASE_URL, trusted JWT config, CORS_ORIGINS, PORT, NODE_ENV và Storage server credential nếu cần.
5. CI build immutable image, tests; backup trước migration; chạy migrate deploy duy nhất một job; không migrate dev/reset production. Rollout API, health/ready và smoke; rollback image khi cần, DB dùng kế hoạch forward/restore đã kiểm chứng.
6. Vercel build apps/web có workspace dependencies; browser config NEXT_PUBLIC_API_BASE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Public key không cấp quyền admin; RLS/API authorization vẫn bắt buộc. Credential DB/secret key không browser.
7. CORS origins explicit cho domains thật; Auth redirects cho dev và demo. Xử lý Vercel previews bằng allowlist quản lý, không mở toàn internet.
8. Test HTTPS, auth refresh, Storage image, quote/order, staff/payment/tracking; restart VM/container, kiểm tra DB persisted, logs requestId và secrets redaction. Readiness fail trả lỗi nhưng không expose internal details.
9. Record actual URLs, versions, backup retention/restore evidence and known limits. Check current provider plan limits before selecting paid resources. No cost promises in starter.

Dockerfile.api và compose.prod.yml phải được tạo từ build đã xác minh ở bước 11; bộ steering không cung cấp stub giả có vẻ chạy được.
