---
inclusion: manual
---

# Bước 03 — Khởi tạo monorepo

Kiểm tra package/config hiện có, không scaffold đè repo. Nếu repo mới: pnpm workspaces gồm apps/* và packages/*; tạo Next App Router TS strict và NestJS TS; cấu hình contracts package exports/build đúng kiểu module. Kiểm tra stable versions tương thích, ghi decisions và commit lockfile. Không hardcode version lấy từ trí nhớ.
Thêm scripts dev:web, dev:api, lint, typecheck, build, test; root scripts phải thực sự gọi đúng workspace. Tạo /v1/health liveness không lộ secrets và /v1/ready readiness có kiểm tra DB ở bước 4. Swagger /docs, validation/filter requestId, CORS allowlist từ env. API chạy 3001, web 3000 ở dev.
Tạo .env.example riêng web/api, .gitignore env/keys/build; xác định env nào browser-visible. Không đặt DATABASE_URL/service-role trong NEXT_PUBLIC_. Tạo trang smoke gọi health.
Kiểm tra: install frozen lockfile ở lần sau, lint, typecheck, build, web→API health; ghi kết quả thật. Nếu chưa có credential cloud, health vẫn chạy, readiness thể hiện chưa sẵn sàng; không báo integration hoàn tất.

## Kết thúc bước
Cập nhật docs/progress.md với bằng chứng; nêu bước tiếp theo, không tự đánh dấu bước khác hoàn thành.
