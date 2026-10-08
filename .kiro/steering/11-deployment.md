---
inclusion: manual
---

# Bước 11 — Triển khai

Dùng docs/deployment.md. Tạo Dockerfile.api multi-stage dựa workspace hiện có, pin image/version, pnpm frozen lockfile, generate Prisma, build contracts/API, runtime non-root, listen 0.0.0.0, graceful shutdown. Không giả định đường dẫn dist; kiểm tra build thực tế trước CMD.
Tạo infra/compose.prod.yml chạy API + reverse proxy HTTPS, restart policy và healthcheck công cụ thực có trong image; secrets từ env bên ngoài Git. DB ở Supabase, không thêm container Postgres production. Đặt API trong Docker network, public 80/443; SSH giới hạn; không public DB credentials/3001 khi không cần. Persistent volume cho certificate nếu proxy cần.
Supabase direct nếu network hỗ trợ; VM IPv4 dùng session pooler theo Dashboard; Prisma config/migration URL theo docs phiên bản đang dùng, TLS verify. Tắt Data API nếu không dùng hoặc schema/RLS đúng. Auth redirect allowlist và Storage policies.
Migrate deploy một job trước rollout; backup/restore và migration rollback/forward plan; tránh destructive migration. Vercel root apps/web, workspace contracts build theo dependency. CORS allowlist domain thực, preview origins được quản lý rõ. Không dùng wildcard credential.
Kiểm tra deploy URL, HTTPS, auth refresh, ảnh, full order flow, health/ready, logs redacted, restart persistence, rollback image. Người dùng cung cấp VM/project/domain mới thực hiện cloud actions; không tự mua/tạo tài nguyên có phí.

## Kết thúc bước
Cập nhật docs/progress.md với bằng chứng; nêu bước tiếp theo, không tự đánh dấu bước khác hoàn thành.
