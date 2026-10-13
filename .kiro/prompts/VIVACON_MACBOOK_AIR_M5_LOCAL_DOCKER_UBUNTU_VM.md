# Vivacon — MacBook Air M5 13-inch (2026): local Docker + Ubuntu VM

> **Phạm vi:** Chạy source và phát triển LOCAL trên macOS Apple Silicon ARM64. **Không triển khai Vercel / Ubuntu production / Supabase production.**
>
> Repo: `https://github.com/khoatmhcm1999vn/viva-spring-reactjs`, branch `feature/ai-assisted-dev-setup`. Hướng dẫn căn cứ vào các file repo đã đọc, **chưa chạy kiểm thử trên máy Mac**.

## 1. Những gì đã xác nhận từ GitHub

| File | Thực tế |
|---|---|
| `Dockerfile` | Maven `3.9-eclipse-temurin-11` build, JRE Java 11 chạy ứng dụng; image mặc định Spring profile `prod`; cần `GeoLite2-City.mmdb` ở thư mục làm việc. |
| `frontend/Dockerfile` | `node:22-bookworm-slim` build React, `nginx:1.27-alpine` phục vụ; `/api` và `/ws` đi qua nginx reverse proxy đến backend. |
| `docker-compose.yml` | Dịch vụ `db` (Postgres 14), `backend`, `frontend`; có volume `vivacon-db-data`. |
| `docker-compose.override.yml` | Được tự nạp khi `docker compose up`; công bố DB `5433`, backend `8091`, Adminer `8901`; frontend `8081`. |
| `.env.example` | Bắt buộc `DB_PASSWORD`, `JWT_SECRET_SALT`; `.env` không được commit. |
| `container/prepare/schema/schema.sql`, `container/prepare/functions/*.sql` | Schema, stored functions được nạp ở **lần khởi tạo volume Postgres trống**. |
| `frontend/package.json` | React 17, Node engine `22.x`; Dockerfile dùng `npm install --force`. |

Trước khi chạy, phải kiểm tra các file tại **commit hiện tại**, vì nội dung có thể được cập nhật sau thời điểm viết tài liệu.

## 2. Cài đặt cho MacBook Air M5 Apple Silicon

**Xác định môi trường:**

```bash
uname -m              # mong đợi arm64
sw_vers
sysctl -n hw.memsize  # tổng RAM (bytes)
```

1. Cài Git / Xcode Command Line Tools khi macOS yêu cầu: `git --version`.
2. Cài **Docker Desktop for Mac — Apple silicon** tại https://docs.docker.com/desktop/setup/install/mac-install/ rồi khởi chạy Docker Desktop.
3. Cài Kiro for macOS, mở workspace đã clone.
4. Không bắt buộc cài Java và Node trên macOS nếu chỉ chạy bằng Docker. Nếu chạy trực tiếp ngoài Docker, dùng **JDK 11** và **Node 22** cho source hiện tại.
5. Rosetta 2 không phải điều kiện bắt buộc của Docker Desktop; chỉ cài nếu công cụ x86 chuyên biệt cần.

```bash
docker version
docker compose version
docker info --format '{{.Architecture}}'
```

**RAM:** với máy 16 GB thử cấp Docker Desktop 6 GB; máy 24 GB trở lên thử 8 GB. Điều chỉnh theo RAM thực tế, số container và việc dùng thêm Ubuntu VM. Không chạy hai môi trường Docker nặng đồng thời trên máy ít RAM.

## 3. Clone source và thiết lập cấu hình LOCAL

```bash
git clone -b feature/ai-assisted-dev-setup https://github.com/khoatmhcm1999vn/viva-spring-reactjs.git
cd viva-spring-reactjs
git branch --show-current
git rev-parse HEAD
git status --short
cp .env.example .env
```

Mở `.env` trong Kiro và đặt **giá trị riêng cho local**:

```dotenv
DB_PASSWORD=<local-strong-password>
JWT_SECRET_SALT=<local-random-secret>
DB_PORT=5433
BACKEND_PORT=8091
FRONTEND_PORT=8081
ADMINER_PORT=8901
FRONTEND_ALLOWED_ORIGINS=http://localhost:8081
SPRING_PROFILES_ACTIVE=prod
```

Tạo chuỗi ngẫu nhiên bằng `openssl rand -hex 32`. Không lưu secrets thật trong Markdown/Git/screenshot. Profile `prod` của image được đặt có chủ ý; profile `dev` có bypass email verification, chỉ dùng local cô lập.

## 4. Chạy full stack bằng Docker

```bash
# Đảm bảo Docker Desktop đang chạy
# KHÔNG chia sẻ output `docker compose config` vì có thể lộ secret
docker compose config --services

docker compose up -d --build

docker compose ps
docker compose logs --tail=100 db
docker compose logs --tail=100 backend
docker compose logs --tail=100 frontend
```

**Địa chỉ LOCAL dự kiến (kiểm tra lại `.env` và Compose):**

| Phần | Địa chỉ |
|---|---|
| React/nginx | http://localhost:8081 |
| Backend health | http://localhost:8091/actuator/health |
| Swagger UI | http://localhost:8091/swagger-ui/index.html |
| Adminer | http://localhost:8901 (server `db`) |
| PostgreSQL cho DBeaver | `localhost:5433`, DB `vivacon` |

**Kiểm tra:**

```bash
curl -i http://localhost:8091/actuator/health
curl -I http://localhost:8081/
docker compose ps
```

Cần nhìn thấy kết quả thực tế rồi mới kết luận thành công. Email, upload Cloudinary/S3 và dịch vụ ngoài có thể chưa dùng được nếu chưa cấp credentials phù hợp.

### Dừng, khởi động lại và giữ dữ liệu

```bash
docker compose stop
docker compose start
docker compose down  # không xóa named volume
```

**Không dùng `docker compose down -v`** khi chưa có backup: lệnh đó xóa volume dữ liệu. Các script khởi tạo Postgres chỉ chạy khi thư mục dữ liệu ban đầu rỗng; không thể kỳ vọng tự cập nhật schema sau mỗi lần restart.

### Nếu build lỗi ARM64

```bash
docker image inspect vivacon-backend:latest --format '{{.Architecture}}'
docker image inspect vivacon-frontend:latest --format '{{.Architecture}}'
docker compose logs --tail=200 backend
```

Ưu tiên ARM64 native. Chỉ cân nhắc `platform: linux/amd64` để giả lập x86 **cho image gặp lỗi cụ thể** sau khi xác định nguyên nhân; giả lập thường tốn CPU/RAM hơn. Không tự sửa tất cả Compose sang AMD64.

### Nếu React lên nhưng API/chat lỗi

Kiểm tra nginx proxy `/api`/`/ws`, backend health, `FRONTEND_ALLOWED_ORIGINS`, cấu hình JWT, WebSocket STOMP handshake, log backend. Nếu frontend đổi cổng, phải cập nhật allowed origins theo địa chỉ trình duyệt thực tế. Nếu DB không kết nối, đối chiếu URL JDBC, biến môi trường, `docker compose ps` và logs.

## 5. Phát triển code có hot reload (tùy chọn)

Dockerfile hiện tại chủ yếu build image và chạy tích hợp, **không tự hot reload code**. Nếu cần sửa code thấy thay đổi nhanh:

- Chỉ chạy DB container qua Docker Compose (kiểm tra dependencies trước), hoặc dùng stack Docker và dừng backend/frontend tương ứng.
- Trên macOS cài Java 11, dùng `./mvnw spring-boot:run`; xem `application-dev.yml` và dùng PostgreSQL host port `5433` trong cấu hình local.
- Trên macOS cài Node 22: `cd frontend && npm install --force && npm run start:dev`; kiểm tra `.env.development` để khớp backend `8090`.
- Đừng trộn nhầm database instance hoặc profile dev/prod giữa host và container.

## 6. Ubuntu VM trên Mac M5 (để học Linux và thử nghiệm)

Docker Desktop đã có Linux VM nội bộ. **Ubuntu VM riêng không bắt buộc** nếu mục tiêu chỉ là chạy Vivacon bằng Docker. Nếu muốn dùng Ubuntu Linux độc lập, hãy dùng **UTM với Ubuntu ARM64**:

1. Tải UTM tại https://mac.getutm.app/ và xem https://docs.getutm.app/guides/ubuntu/.
2. Tải bản ISO **Ubuntu Server ARM64** (khuyên Ubuntu 24.04 LTS ARM64) từ Ubuntu chính thức: https://ubuntu.com/download/server/arm . Nếu cần GUI thì lấy Ubuntu Desktop **ARM64**, không phải AMD64.
3. UTM → **Create New Virtual Machine** → **Virtualize** → **Linux** → chọn ISO ARM64.
4. RAM/CPU tham khảo: Mac 16 GB → VM 3–4 GB, 2 cores, disk 30–40 GB; Mac ≥24 GB → VM 6 GB, 4 cores, disk 40–60 GB. Điều chỉnh theo RAM/SSD thực tế. Không cấp hết RAM Mac cho VM.
5. Dùng networking shared/NAT mặc định, cài Ubuntu, tạo user thường; chọn OpenSSH nếu installer hỗ trợ.
6. Trong Ubuntu:

```bash
uname -m          # aarch64
lsb_release -a
ip -br a
sudo apt update
sudo apt install -y git curl openssh-server
sudo systemctl enable --now ssh
hostname -I
```

7. Kết nối SSH từ Mac bằng `ssh <ubuntu-user>@<vm-ip>` **nếu IP guest có thể được host truy cập**. Nếu cấu hình UTM NAT không cho truy cập trực tiếp, cấu hình chuyển tiếp TCP host `2222` → guest `22`, sau đó `ssh -p 2222 <ubuntu-user>@127.0.0.1`.
8. Để chạy Vivacon trong Ubuntu VM: cài **Docker Engine + Compose plugin** theo https://docs.docker.com/engine/install/ubuntu/ ; clone cùng branch và chạy lại bước 3–4 **bên trong VM**. Docker daemon Ubuntu là hệ thống riêng, không phải Docker Desktop trên Mac.
9. Snapshot/backup VM trước khi thử thay đổi hệ thống hoặc database. Không dùng file ISO AMD64 ở chế độ Virtualize trên Apple Silicon.

## 7. Kiro Steering cần thêm

**Tạo file:** `.kiro/steering/vivacon-macos-local-development.md`

```markdown
---
inclusion: always
---
# Vivacon local development: MacBook Air M5 (2026)
- Host: Apple Silicon ARM64; target is LOCAL development, not production deployment.
- Inspect current branch, Git SHA, Dockerfiles, Compose base/override, env and actual logs before recommending changes.
- Preserve all existing steering rules and source structure.
- Prefer native ARM64 Docker images and Docker Compose V2; do not assume AMD64 emulation is required.
- Use macOS/bash syntax, relative paths, `./mvnw` and Node 22 for direct host builds.
- Default local Compose ports are frontend 8081, backend 8091, db 5433 and Adminer 8901; always verify config.
- Never expose or commit `.env`, passwords, JWT, cloud service keys or other secrets.
- Never delete Docker named volumes or execute destructive SQL without approval and backup.
- Ubuntu VM on UTM is OPTIONAL, requires ARM64 ISO, has its own Docker daemon and independent resources.
- Distinguish source-supported expectations from runtime-verified results. Never invent successful tests.
- Do not change Vercel, Supabase production, tunnel/DNS or deployment tracking unless explicitly requested.
```

## 8. Prompt dán vào Kiro Claude

```text
Read .kiro/steering/ and this Markdown guide for MacBook Air M5 (ARM64).
Our task is to run the existing Vivacon code LOCALLY using Docker Desktop.
Do not make any production deployment changes.
Check the real Git SHA, Dockerfiles, Compose base/override, .env.example, application profiles and dependencies.
Guide me step-by-step through Docker setup and verification, showing commands and interpreting ACTUAL output.
Never invent test results; preserve existing named volumes, secrets, diagrams and steering.
If I ask for Ubuntu, use UTM + Ubuntu ARM64 and keep that VM separate from Docker Desktop.
Do not commit or push.
```

## Tài liệu gốc

- Docker Desktop Apple silicon: https://docs.docker.com/desktop/setup/install/mac-install/
- UTM Ubuntu: https://docs.getutm.app/guides/ubuntu/
- Ubuntu ARM: https://ubuntu.com/download/server/arm
- Docker Engine for Ubuntu: https://docs.docker.com/engine/install/ubuntu/
