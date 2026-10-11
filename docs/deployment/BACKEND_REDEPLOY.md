# Redeploy backend lên VM Ubuntu (Supabase) — dựng lại cấu hình đã mất

Tài liệu này dành cho tình huống: bạn sửa source backend và cần đưa bản mới lên VM,
nhưng cấu hình cũ đã mất. Cấu hình đó gồm `config/supabase.env`, SSH key,
`config/vm-tunnel-origins.sh`, `config/supabase-restore.ps1`, và có thể cả `.env` trên VM.

Toàn bộ công cụ ở đây **được git track và không chứa secret**. Secret chỉ nằm trong
`.env` trên VM và trong `config/` (đã gitignore) trên máy build.

| File | Vai trò |
|---|---|
| `docker-compose.supabase.yml` | Overlay topology production: backend **không còn phụ thuộc** service `db` cục bộ; `db` chuyển vào profile `local-db`. Bắt buộc có `SPRING_DATASOURCE_URL`, `DB_USERNAME`, `FRONTEND_ALLOWED_ORIGINS` |
| `.env.vm.example` | Khuôn mẫu `.env` cho VM, chỉ có placeholder |
| `scripts/deploy/vm-backend-up.sh` | Chạy **trên VM**: kiểm tra `.env` (không in secret), `docker load`, đổi `BACKEND_IMAGE`, recreate **chỉ** backend, chờ healthy, rollback |
| `scripts/deploy/deploy-backend.ps1` | Chạy **trên máy build** (Windows PowerShell 5.1 hoặc `pwsh` trên Mac): build image bất biến `vivacon-backend:git-<sha>`, `scp`, gọi script trên VM, probe và ghi evidence |

## 0. Hiện trạng đo được (2026-10-11T10:34Z, chỉ đọc)

| Điều | Kết quả | Phân loại |
|---|---|---|
| Backend đang chạy vẫn trả tài khoản `admin` qua tunnel và qua LAN | 200, có `id` | RUNTIME_VERIFIED: backend vẫn đọc được DB có dữ liệu thật. **Dữ liệu chưa mất** |
| Supabase pooler `aws-0-ap-south-1.pooler.supabase.com:5432` | DNS có 2 bản ghi A, TCP mở | RUNTIME_VERIFIED: chỉ ở mức mạng, chưa xác thực |
| `config/` trên máy Windows này | không tồn tại | Mất SSH key, `supabase.env` và các script cũ |
| `.env` trên VM | **chưa kiểm** (không có SSH) | Bước 0b bên dưới |

Như vậy thứ mất là **cấu hình và quyền truy cập**, không phải database. Đừng restore hay
dựng lại schema trên Supabase.

## 0b. Kiểm tra `.env` trên VM còn dùng được không

Mở terminal trên VM:

```bash
cd ~/viva-spring-reactjs
git pull --ff-only                          # lấy compose overlay + script mới
scripts/deploy/vm-backend-up.sh --check-only
```

Script chỉ in tên khoá, độ dài, host và cổng; không in mật khẩu hay salt.

- **0 lỗi:** bỏ qua bước 1.
- **Còn `[FAIL]`:** sửa đúng các mục đó theo bước 1.

Nếu `.env` còn nguyên nhưng thiếu ba khoá mới (`SPRING_DATASOURCE_URL`, `DB_USERNAME`,
`FRONTEND_ALLOWED_ORIGINS`), giá trị cũ có thể đang nằm trong một file khác, ví dụ
`config/supabase.env` trên VM. Chép sang `.env`, đừng tạo mới.

## 1. Dựng lại `.env` trên VM (chỉ khi bước 0b báo lỗi)

```bash
cd ~/viva-spring-reactjs
[ -f .env ] && cp .env ".env.bak.$(date -u +%Y%m%dT%H%M%SZ)"   # giữ bản cũ nếu có
cp .env.vm.example .env
chmod 600 .env
nano .env
```

Lấy từng giá trị ở đâu:

| Khoá | Nguồn | Lưu ý |
|---|---|---|
| `SPRING_DATASOURCE_URL` | Supabase Dashboard → **Connect** → **Session pooler** (cổng **5432**) → bản JDBC, thêm `?sslmode=require` | Không dùng *Direct connection*: VM không có IPv6, mà host direct chỉ có bản ghi AAAA. Không dùng cổng 6543 (transaction mode làm vỡ prepared statement của Hibernate) |
| `DB_USERNAME` | cùng trang Connect: `postgres.<project-ref>` | Không phải `postgres` |
| `DB_PASSWORD` | Mật khẩu database Supabase. Dashboard **không** cho xem lại | Mất thì vào Project Settings → Database → **Reset database password**. Đây là thay đổi credential production: mọi thứ khác dùng mật khẩu cũ (MCP, script cũ) sẽ hỏng. Có `$` trong mật khẩu thì bọc nhháy đơn: `DB_PASSWORD='…'` |
| `JWT_SECRET_SALT` | Giữ giá trị cũ nếu còn. Mất thì `openssl rand -base64 48` | Đổi salt làm mọi **access token** cũ không còn hợp lệ. **Refresh token** là UUID lưu trong DB (`RefreshTokenServiceImpl.createRefreshToken`), nên frontend tự xin token mới khi gặp 401 (`axiosConfig.js`). Người dùng thường không phải đăng nhập lại; refresh token hết hạn sau 100 giờ thì vẫn phải |
| `FRONTEND_ALLOWED_ORIGINS` | `http://192.168.221.128,https://*.vercel.app,https://<tunnel-host>` | Lấy tunnel host: `docker logs vivacon-cloudflared 2>&1 \| grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' \| tail -1`. `*.vercel.app` đã đủ cho site Vercel |
| `CLOUDINARY_*`, `MS_OAUTH_*`, `MAIL_FROM_ADDRESS` | Dashboard của Cloudinary / Azure app registration | Để trống thì app vẫn chạy, nhưng upload ảnh lỗi và email không gửi |
| `BACKEND_IMAGE` | Để `vivacon-backend:latest` | Script tự cập nhật mỗi lần deploy |

Chạy lại `scripts/deploy/vm-backend-up.sh --check-only` cho tới khi không còn `[FAIL]`.

## 2. Cấp lại SSH từ máy build

`config/` đã được gitignore, nên key nằm trong đó không bao giờ lên git.

```powershell
# Windows (PowerShell), từ thư mục gốc repo
New-Item -ItemType Directory -Force config | Out-Null
ssh-keygen -t ed25519 -f config\vm_ed25519 -N '""' -C "vivacon-deploy"
type config\vm_ed25519.pub | ssh minh-khoa@192.168.221.128 "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
ssh -i config\vm_ed25519 -o BatchMode=yes minh-khoa@192.168.221.128 "uname -m"     # in ra x86_64 là xong
```

Lệnh `type … | ssh` hỏi mật khẩu VM **một lần**. Trên Mac thì dùng `cat` thay cho `type`,
và `config/vm_ed25519` thay cho `config\vm_ed25519`.

## 3. Sửa source và thử ở local trước

**Không** thử thay đổi entity trên Supabase trước. Chạy local theo `docs/SETUP_MACOS.md`
(cách A dùng `docker-compose.local.yml`, chạy được cả trên Windows), rồi:

```powershell
docker compose -f docker-compose.yml -f docker-compose.local.yml build backend
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d backend
```

Đổi entity thì xem Supabase sẽ chịu ảnh hưởng gì:

| Thay đổi trong entity | `ddl-auto: update` làm gì trên Supabase lúc backend khởi động |
|---|---|
| Thêm `@Entity`, thêm cột | **Tạo** bảng/cột (cột mới cho phép NULL dù có `nullable = false`) |
| Đổi tên cột, đổi kiểu, xoá cột | **Không làm gì.** Entity và DB lệch nhau, lỗi chỉ hiện lúc chạy. Phải viết SQL tay, có backup |
| Đổi `@UniqueConstraint` | `RECREATE_QUIETLY`: unique constraint bị **xoá và tạo lại** |
| Đổi stored function (`dao/`) | Không làm gì. Phải apply SQL từ `container/prepare/functions/` |

## 4. Backup Supabase trước khi deploy thay đổi entity

**Chưa chạy thử.** Lệnh dưới chạy trên VM: pg_dump đi qua session pooler, dùng image
`postgres:17` vì server là Postgres 17 (`deployment.md`). File ra nằm ngoài repo.

```bash
cd ~/viva-spring-reactjs && mkdir -p ~/backups && chmod 700 ~/backups
PGPASSWORD="$(grep '^DB_PASSWORD=' .env | cut -d= -f2- | sed "s/^'//;s/'$//")" \
URL="$(grep '^SPRING_DATASOURCE_URL=' .env | cut -d= -f2-)"; HOSTPORT="${URL#jdbc:postgresql://}"; HOSTPORT="${HOSTPORT%%/*}"
docker run --rm -e PGPASSWORD -v ~/backups:/out postgres:17 \
  pg_dump "host=${HOSTPORT%:*} port=${HOSTPORT#*:} dbname=postgres user=$(grep '^DB_USERNAME=' .env | cut -d= -f2-) sslmode=require" \
  --schema=public -Fc -f "/out/supabase-$(date -u +%Y%m%dT%H%M%SZ).dump"
ls -lh ~/backups
```

Bản backup do Supabase tự làm, nếu có, nằm ở Dashboard → Database → Backups, tuỳ gói. Mục
này chưa được kiểm.

## 5. Deploy

```powershell
git add -A src pom.xml            # chỉ những gì bạn sửa
git commit -m "..."
git push                          # VM sẽ git pull để lấy compose + script cùng commit

.\scripts\deploy\deploy-backend.ps1 -DryRun   # xem trước từng lệnh, không chạy gì
.\scripts\deploy\deploy-backend.ps1           # chạy thật, hỏi "yes" trước khi recreate
```

Script dừng nếu:

- còn thay đổi chưa commit ở `src/`, `pom.xml`, `Dockerfile`;
- HEAD chưa có trên `origin`;
- `.env` trên VM còn `[FAIL]`;
- SHA-256 của file image trên VM lệch với bản trên máy build;
- backend không healthy trong 240 giây. Khi đó script in 50 dòng log cuối và gợi ý rollback.

Script **không** đụng tới `frontend`, `cloudflared` hay `db` (luôn dùng `--no-deps`).
Recreate `cloudflared` sẽ đổi hostname tunnel và buộc phải redeploy Vercel.

Build trên Mac Apple Silicon: script đọc `uname -m` của VM và build
`--platform linux/amd64`. Docker Desktop phải giả lập để build kiểu này, nên sẽ chậm hơn
nhiều. Chạy bằng `pwsh` (`brew install --cask powershell`).

Sau khi deploy, script ghi `docs/deployment/evidence/<utc>-backend-redeploy.txt`. File
gồm SHA, tag image, SHA-256 của tar và mã trả về của 4 probe; không có secret. Cập nhật
M3 trong `MILESTONES.md` từ file đó.

## 6. Rollback

```powershell
.\scripts\deploy\deploy-backend.ps1 -Rollback
```

Lệnh này quay `BACKEND_IMAGE` về `PREVIOUS_BACKEND_IMAGE`. Image cũ phải **còn** trên VM,
nên đừng `docker image prune -a` trên VM. Rollback chỉ đổi image, **không** hoàn tác các
thay đổi schema mà Hibernate đã làm. Muốn hoàn tác schema thì phải dùng backup ở bước 4.

## 7. Lần đầu chuyển sang overlay (một lần duy nhất)

Backend trên VM hiện được khởi động bằng `docker-compose.yml` + `docker-compose.tunnel.yml`
(phụ thuộc `db`). Lần deploy đầu bằng script sẽ recreate backend theo overlay mới. Sau đó
container `vivacon-db` (nếu còn) không được ai dùng nữa, nhưng vẫn chạy. Dừng hay xoá nó
là một quyết định riêng: trước hết hãy kiểm tra nó có giữ dữ liệu nào mà bạn cần không.

## Đã kiểm chứng gì (2026-10-11, trên máy Windows, không phải VM)

- **Overlay:**
  - Thiếu một trong ba biến bắt buộc → compose dừng với thông báo rõ ràng.
  - Service đang hoạt động là `backend, frontend, cloudflared`; `db` chỉ xuất hiện khi
    thêm `--profile local-db`.
  - Backend chạy một mình (`--no-deps`), healthy, nối vào một Postgres "bên ngoài" và
    Hibernate tạo đủ 19 bảng.
- **`vm-backend-up.sh`** chạy trong WSL Ubuntu, với Postgres bật TLS đóng vai Supabase:
  - `--check-only` báo đúng 6 lỗi với một `.env` sai cố ý: DB cục bộ, thiếu `sslmode`,
    origin rỗng, profile `dev`, bypass bật, mật khẩu rỗng. Ở chế độ deploy, các lỗi đó
    chặn việc deploy.
  - Deploy từ tar: load image, đổi `BACKEND_IMAGE`, backend healthy sau 15 giây. Phía DB
    xác nhận kết nối dùng TLS (`pg_stat_ssl`). Không service nào khác được khởi động.
  - Rollback: quay về image trước, healthy sau 10 giây.
- **`deploy-backend.ps1`:** đã chạy `-DryRun`; parse không lỗi.

**Chưa kiểm:** chạy thật trên VM, kết nối tới Supabase thật, `scp` thật, lệnh pg_dump ở
bước 4, và `pwsh` trên Mac.
