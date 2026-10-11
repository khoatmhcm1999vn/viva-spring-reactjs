# Dựng Vivacon trên macOS (Apple Silicon, ví dụ MacBook Air M5)

Tài liệu này hướng dẫn chạy Vivacon trên một máy Mac mới, **tách biệt hẳn với
deployment thật** (Vercel + VM Ubuntu + Supabase). Có hai cách:

| Cách | Chạy gì ở đâu | Khi nào dùng |
|---|---|---|
| **A. Toàn bộ trong Docker** | db + backend + nginx/frontend + adminer, file `docker-compose.local.yml` | Lần đầu, demo, kiểm tra đường đi giống production |
| **B. Chạy trên máy (host)** | db trong Docker; backend bằng `./mvnw`; frontend bằng `npm run start:dev` | Viết code, debug, hot reload |

Cả hai cách dùng **chung một database local** (`vivacon-local-db`). Không cách nào nối
vào Supabase hay VM.

### Mức kiểm chứng của tài liệu này

- **Đã chạy thật** (ngày 2026-10-11 trên máy Windows x86_64, không phải Mac):
  - Build image từ source.
  - Dựng DB mới, nạp `mock_data/data.sql`, rồi đăng ký → đăng nhập → newsfeed.
  - Backend chạy trên host bằng JDK 11 trỏ vào DB 5433.
  - Kết quả: [`docs/deployment/evidence/20261011T095556Z-local-isolated-stack.txt`](deployment/evidence/20261011T095556Z-local-isolated-stack.txt).
- **Đã kiểm manifest:** cả 7 base image đều có bản `linux/arm64`, nên Mac Apple Silicon
  không cần Rosetta để chạy container. Danh sách image:
  `maven:3.9-eclipse-temurin-11`, `eclipse-temurin:11-jre`, `node:22-bookworm-slim`,
  `nginx:1.27-alpine`, `postgres:14`, `adminer:4`, `cloudflare/cloudflared`.
- **Chưa chạy trên một máy Mac thật.**
- **Chưa chạy thử trong lần kiểm tra này:**
  - CRA dev server (`npm run start:dev`).
  - Cách cấu hình bằng `config/application-dev.yml`. Chỉ cách dùng biến môi trường đã
    được thử.
  - Restore dump dữ liệu thật.

---

## 1. Cài công cụ

So với máy Windows đang dùng:

| Công cụ | Trên Windows | Trên macOS | Dùng cho |
|---|---|---|---|
| Xcode Command Line Tools | — | `xcode-select --install` | git, trình biên dịch cho Homebrew |
| Homebrew | — | xem bên dưới | cài mọi thứ còn lại |
| Git | Git for Windows | có sẵn trong Command Line Tools (hoặc `brew install git`) | clone source |
| Docker | Docker Desktop (Windows) | **Docker Desktop for Mac, bản Apple Silicon** | cách A và DB của cách B |
| JDK **11** | `C:\Program Files\Java\jdk-11` | `brew install --cask temurin@11` | chỉ cách B. `pom.xml` đặt `java.version` 11 |
| Maven | không cần | **không cần**: `./mvnw` tự tải Maven 3.8.3 | chỉ cách B |
| Node **22** + npm | Node 22 | `fnm` (bên dưới) | chỉ cách B. `frontend/package.json` ghim `engines.node: 22.x` |
| psql (tuỳ chọn) | — | `brew install libpq` | truy vấn DB từ terminal |
| openssl | — | có sẵn trên macOS | sinh mật khẩu và secret |
| Kiro IDE (tuỳ chọn) | Kiro for Windows | Kiro for macOS | steering trong `.kiro/steering/` đi theo repo |

### 1.1 Homebrew và Command Line Tools

```bash
xcode-select --install
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
# Apple Silicon: Homebrew nằm ở /opt/homebrew. Thêm vào PATH theo đúng lệnh trình cài in ra, thường là:
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

### 1.2 Docker Desktop

```bash
brew install --cask docker
open -a Docker
```

Vào **Settings → Resources** và đặt Memory **≥ 6 GB**. Lý do: bước build frontend chạy
webpack của CRA bên trong container, và theo `deployment.md` bước này thường cần 2–4 GB.
Chỉ riêng backend đã có `mem_limit` 1200m.

### 1.3 JDK 11 (chỉ cho cách B)

```bash
brew install --cask temurin@11
/usr/libexec/java_home -V          # liệt kê các JDK đã cài
export JAVA_HOME=$(/usr/libexec/java_home -v 11)
java -version                      # phải là 11.x
```

Muốn cố định cho mọi terminal thì thêm dòng `export JAVA_HOME=...` vào `~/.zshrc`.
**Đừng dùng JDK 17/21 làm mặc định cho dự án này.** Project khai báo Java 11 và chưa từng
được kiểm trên bản khác.

### 1.4 Node 22 (chỉ cho cách B)

```bash
brew install fnm
echo 'eval "$(fnm env --use-on-cd --shell zsh)"' >> ~/.zshrc
source ~/.zshrc
fnm install 22
fnm default 22
node -v                            # v22.x
```

### 1.5 Kiểm tra nhanh

```bash
git --version; docker version --format '{{.Server.Arch}}'   # mong đợi: arm64
docker compose version
java -version; node -v; npm -v                              # chỉ cần cho cách B
```

---

## 2. Lấy source

```bash
git config --global core.autocrlf input     # macOS: giữ LF, không đổi sang CRLF
git clone -b feature/ai-assisted-dev-setup https://github.com/khoatmhcm1999vn/viva-spring-reactjs.git
cd viva-spring-reactjs
ls -lh GeoLite2-City.mmdb                   # ~58 MB, có trong repo, backend cần file này
```

Git lưu mọi file ở dạng LF (đã kiểm bằng `git ls-files --eol`), nên clone trên Mac không
gặp lỗi `^M`. `mvnw` đã được đặt quyền chạy (`100755`) trong commit cùng tài liệu này.
Nếu bạn clone một commit cũ hơn thì chạy `chmod +x mvnw`.

**Đừng mang từ máy Windows hay VM sang:**

| Thứ | Lý do |
|---|---|
| `.env` | Có thể chứa secret production. Tạo mới từ `.env.example` ở bước 4.1 |
| `config/` (ví dụ `supabase.env`, SSH key) | Credential Supabase và quyền vào VM. Local không cần |
| `.kiro/settings/mcp.json` | Chứa connection string. Đã gitignore. Tạo lại (mục 7) |
| `node_modules/`, `target/` | Build lại trên Mac; có thể có binary riêng cho Windows |

---

## 3. Cô lập với deployment

Bảng dưới đây là phần quan trọng nhất của tài liệu: những gì production dùng, và cách
local tránh đụng vào chúng.

| Tài nguyên | Production | Local | Cơ chế cô lập |
|---|---|---|---|
| Database | Supabase (theo `deployment.md`) | container `vivacon-local-db`, volume `vivacon-local-db-data` | `docker-compose.local.yml` **ghim cứng** `SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/vivacon`, không nội suy từ `.env`. Đã thử: một `.env` cố tình trỏ sang DB ở xa vẫn bị bỏ qua |
| Thay đổi schema | `ddl-auto: update` + `RECREATE_QUIETLY` chạy mỗi lần backend khởi động | như vậy, nhưng chỉ trên DB local | Đây là lý do **tuyệt đối không** trỏ backend local vào Supabase: mỗi lần khởi động nó sẽ sửa schema production |
| `JWT_SECRET_SALT` | giá trị riêng trên VM | **sinh mới** ở bước 4.1 | Dùng chung salt thì token ký ở local cũng hợp lệ trên production, kể cả token ADMIN |
| Origin được phép | Vercel, hostname tunnel | chỉ `localhost:8081`, `localhost:3000` | Đã thử: `/ws/info` với origin Vercel production bị local trả 403 |
| Đường vào công khai | `cloudflared` | **không có** | Local không bao giờ dùng `docker-compose.tunnel.yml` |
| Tên Docker | project `vivacon`, `vivacon-*`, image `:latest` | project `vivacon-local`, `vivacon-local-*`, image `:local` | Không đè lên image `:latest` dùng để `docker save` sang VM. Không trùng container nếu cùng một daemon |
| Xác thực email | `bypass: false` | `VIVACON_VERIFICATION_BYPASS=true` (trong file local) | Local không gửi được mail, nên tài khoản mới phải được kích hoạt ngay |
| Vercel | build production từ nhánh `main` | không liên quan | Push lên `main` = deploy production (`deployment.md`). Vercel cũng có thể tự build *preview* cho các nhánh khác; preview dùng biến môi trường Preview, không phải Production |
| Cloudinary, mailbox Microsoft | tài khoản thật | **dùng chung nếu bạn điền cùng credential** | Nên tạo một tài khoản Cloudinary miễn phí riêng cho local. Để trống thì app vẫn chạy, nhưng upload ảnh (và đăng bài kèm ảnh) sẽ lỗi. `MS_OAUTH_*` để trống: email chỉ log cảnh báo rồi bỏ qua |
| Key SightEngine / Google Maps | không có trong bundle production | **có giá trị thật** trong `frontend/.env.development` (file được git track) | Cách B sẽ gọi tài khoản SightEngine thật. Các key này cần được rotate (blocker B2 trong `docs/deployment/RELEASE_EVIDENCE.md`) |

Năm điều không làm:

1. Không chạy `docker-compose.tunnel.yml` trên Mac.
2. Không dùng `docker-compose.local.yml` trên VM: nó bật bypass xác thực email.
3. Không chép `.env` của VM hay `config/supabase.env` sang Mac.
4. Không đặt URL Supabase vào `config/application-dev.yml` hay vào biến môi trường khi chạy cách B.
5. Không push lên `main` nếu chưa định deploy production.

---

## 4. Cách A — toàn bộ trong Docker

### 4.1 Tạo `.env` local

```bash
cp .env.example .env
sed -i '' "s|^DB_PASSWORD=.*|DB_PASSWORD=$(openssl rand -hex 24)|" .env
sed -i '' "s|^JWT_SECRET_SALT=.*|JWT_SECRET_SALT=$(openssl rand -hex 48)|" .env
chmod 600 .env
grep -E '^(DB_PASSWORD|JWT_SECRET_SALT)=.+' .env | cut -d= -f1   # phải in ra đủ 2 tên
```

`.env` đã được gitignore. Các khoá `SPRING_DATASOURCE_URL`, `DB_USERNAME`,
`FRONTEND_ALLOWED_ORIGINS`, `SPRING_PROFILES_ACTIVE` và `*_IMAGE` trong `.env` đều
**không** có tác dụng với cách A, vì `docker-compose.local.yml` ghi đè chúng.

### 4.2 Build và chạy

Lệnh dài nên đặt alias:

```bash
alias vlocal='docker compose -f docker-compose.yml -f docker-compose.local.yml'
vlocal config --services        # db, adminer, backend, frontend (không có cloudflared)
vlocal build                    # lần đầu tải image và dependency; trên Windows bản có cache mất ~2 phút
vlocal up -d
vlocal ps                       # chờ backend chuyển sang (healthy)
```

Không thêm `docker-compose.override.yml` vào lệnh này. File local đã tự mở các cổng dev
(5433, 8091, 8901) và tự khai báo adminer, nên override là thừa. Tổ hợp hai file đó cũng
chưa được thử.

### 4.3 Nạp dữ liệu mẫu (bắt buộc với DB mới)

Chạy **sau khi backend đã healthy ít nhất một lần**, để Hibernate tạo nốt 8 bảng mà
`schema.sql` không có. Phải chạy **trước khi đăng ký tài khoản đầu tiên**, vì
`mock_data/data.sql` chèn id cố định bắt đầu từ 1 rồi mới `setval` các sequence.

```bash
docker exec -i vivacon-local-db psql -U postgres -d vivacon -v ON_ERROR_STOP=1 < mock_data/data.sql
docker exec vivacon-local-db psql -U postgres -d vivacon -tAc "select count(*) from role"   # 3
```

Vì sao bắt buộc: đăng ký tài khoản lấy role `USER` từ bảng `role`
(`AccountServiceImpl.registerNewAccount`). Bảng rỗng thì tài khoản tạo ra không có role,
và đăng nhập sẽ lỗi.

Kết quả đo được trên DB mới: 19 bảng và 14 hàm sau lần boot đầu. `data.sql` nạp 0 lỗi
và tạo ra 3 role, 6 tài khoản, 27 bài đăng.

Mật khẩu của các tài khoản mẫu chỉ có ở dạng băm BCrypt, nên tài liệu này không ghi.
Hãy **đăng ký tài khoản của riêng bạn** ở bước sau.

### 4.4 Dùng thử

| Địa chỉ | Mục đích |
|---|---|
| http://localhost:8081 | App (nginx phục vụ bundle, proxy `/api` và `/ws`) |
| http://localhost:8091/swagger-ui/index.html | Swagger, gọi thẳng backend |
| http://localhost:8901 | Adminer. Hệ: PostgreSQL. Server: `db`. User: `postgres`. Mật khẩu: `DB_PASSWORD` trong `.env`. DB: `vivacon` |
| `localhost:5433` | Postgres cho psql / DBeaver |

Kiểm tra nhanh từ terminal:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8081/healthz                    # 200
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8081/api/v1/post                # 401 (chưa đăng nhập)
curl -s -o /dev/null -w '%{http_code}\n' -H 'Origin: http://localhost:8081' http://localhost:8081/ws/info   # 200
```

Đăng ký trên giao diện. Ở cách A, bypass đang bật nên tài khoản dùng được ngay, không cần
mã email.

### 4.5 Dừng, xoá, build lại

```bash
vlocal stop                  # tạm dừng
vlocal down                  # xoá container, GIỮ dữ liệu
vlocal down -v               # xoá luôn volume vivacon-local-db-data (dữ liệu local)
```

Có khoá `image:` nên `up` **không tự build lại** khi code đổi (ISS-12 trong
`docs/ISSUES.md`). Sau khi sửa code:

```bash
vlocal build backend && vlocal up -d backend      # sửa Java
vlocal build frontend && vlocal up -d frontend    # sửa React
```

---

## 5. Cách B — chạy trên máy (host)

### 5.1 Chỉ bật database

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d db
```

Nếu DB còn mới, nạp `mock_data/data.sql` theo **4.3** sau lần đầu backend khởi động
(bước 5.2).

### 5.2 Backend (profile `dev`, cổng 8090)

`src/main/resources/application-dev.yml` ghi cứng `localhost:5432`. Biến môi trường được
ưu tiên hơn file YAML, nên chỉ cần ghi đè URL sang cổng 5433:

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 11)
# Chỉ lấy đúng 2 biến cần thiết. KHÔNG `source .env`: file đó có SPRING_PROFILES_ACTIVE=prod
# và sẽ đổi backend sang profile prod (cổng 8080, tắt bypass).
export DB_PASSWORD="$(grep '^DB_PASSWORD=' .env | cut -d= -f2-)"
export JWT_SECRET_SALT="$(grep '^JWT_SECRET_SALT=' .env | cut -d= -f2-)"
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/vivacon
./mvnw spring-boot:run
```

Phải chạy từ **thư mục gốc repo**, vì backend đọc `./GeoLite2-City.mmdb` và ghi `./logs`
theo thư mục làm việc. Lần đầu `mvnw` sẽ tải Maven và toàn bộ dependency.

Kiểm tra (đã đo được trên Windows với đúng cấu hình này):

```bash
curl -s http://localhost:8090/actuator/health        # {"status":"UP"}
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8090/api/v1/post                                   # 401
curl -s -o /dev/null -w '%{http_code}\n' -H 'Origin: http://localhost:3000' http://localhost:8090/ws/info     # 200
```

**Cách thay thế** theo quy ước của dự án (`tech.md`) là tạo `config/application-dev.yml`.
Thư mục này đã được gitignore, và Spring Boot đọc nó với độ ưu tiên cao hơn classpath.
Cách này **chưa được chạy thử** trong lần kiểm tra trên:

```yaml
# config/application-dev.yml  — CHỈ giá trị local. Không bao giờ để URL Supabase ở đây.
spring:
  datasource:
    url: jdbc:postgresql://localhost:5433/vivacon
    password: <giá trị DB_PASSWORD trong .env>
vivacon:
  jwt:
    secret_salt: <giá trị JWT_SECRET_SALT trong .env>
```

### 5.3 Frontend (CRA dev server, cổng 3000)

```bash
cd frontend
node -v                       # v22.x
npm install --force           # dùng --force, KHÔNG dùng --legacy-peer-deps (xem tech.md)
npm run start:dev             # nạp frontend/.env.development → API http://localhost:8090/api
```

Mở http://localhost:3000. Profile `dev` đã có sẵn `http://localhost:3000` trong danh sách
origin, nên CORS và WebSocket hoạt động mà không phải cấu hình gì thêm.

Lưu ý:

- `package-lock.json` bị gitignore theo chủ ý của dự án. Vì vậy cây dependency trên Mac
  có thể khác Windows. Khối `overrides` (ghim `react-konva` vào `17.0.2-6`) là thứ giữ cho
  nó không vỡ; đừng nới lỏng nó.
- Lỗi `Cannot find module 'ajv/dist/compile/codegen'` có nghĩa là đã cài bằng
  `--legacy-peer-deps`. Xoá `node_modules` và cài lại bằng `--force`.

### 5.4 Dừng

`Ctrl+C` ở cả hai terminal, rồi chạy
`docker compose -f docker-compose.yml -f docker-compose.local.yml stop db`.

---

## 6. Dữ liệu thật (tuỳ chọn, chỉ khi bạn có dump)

Bộ dữ liệu 54 tài khoản / 688 bài đăng **không có trong git**. `container/data/` đã bị
gitignore, và thư mục này cũng không có trong workspace Windows hiện tại. Dump chứa dữ
liệu người dùng thật (email, mật khẩu đã băm), nên:

- chuyển sang Mac bằng kênh an toàn (USB, AirDrop), **không bao giờ commit**;
- chỉ restore vào DB local.

Công thức dưới đây theo `deployment.md` ("Restoring a dump into this stack") và **chưa
chạy lại trên Mac**:

```bash
docker exec -i vivacon-local-db psql -U postgres -d vivacon -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
grep -vE '^\\connect|^(CREATE|DROP|ALTER) DATABASE' /đường/dẫn/dump.sql \
  | docker exec -i vivacon-local-db psql -U postgres -d vivacon -v ON_ERROR_STOP=1
docker compose -f docker-compose.yml -f docker-compose.local.yml restart backend
```

Khi đã restore dump thì **không** nạp `mock_data/data.sql` nữa.

---

## 7. Kiro trên Mac

- `.kiro/steering/*.md` đi theo repo, nên không phải làm gì.
- `.kiro/settings/mcp.json` bị gitignore, nên phải tạo lại:
  - Postgres MCP trỏ vào DB local là `localhost:5433`, database `vivacon`.
  - Nếu MCP server chạy **trong container**, `localhost` là chính container đó. Khi đó
    dùng `host.docker.internal:5433` (ISS-05 trong `docs/ISSUES.md`).
  - Không đặt credential Supabase vào đây.
- Kiểm tra sơ đồ draw.io bằng `pwsh -File "BA Document/docs/diagrams/_validate.ps1"`.
  Lệnh này cần PowerShell 7: `brew install --cask powershell`.
- Render Mermaid: `node scripts/render-diagrams.mjs`.

---

## 8. Xử lý sự cố

| Hiện tượng | Nguyên nhân / cách sửa |
|---|---|
| `./mvnw: Permission denied` | Clone từ commit cũ: `chmod +x mvnw` |
| `/bin/sh^M: bad interpreter` | Checkout bị đổi sang CRLF. Chạy `git config core.autocrlf input`, rồi `git rm --cached -r . && git reset --hard` (chỉ khi không có thay đổi chưa commit) |
| Backend không healthy | `docker logs vivacon-local-backend`. Thường do `DB_PASSWORD` rỗng: Hikari không kết nối được và app chết khi khởi động |
| Đăng ký được nhưng đăng nhập lỗi 500 | Bảng `role` rỗng. Nạp `mock_data/data.sql` (4.3) |
| `duplicate key` khi nạp `data.sql` | Đã đăng ký tài khoản trước khi nạp. Chạy `vlocal down -v` rồi làm lại theo đúng thứ tự |
| Đăng nhập trả 403, body `1002` | Bypass chưa bật. Ở cách A kiểm tra `docker exec vivacon-local-backend printenv VIVACON_VERIFICATION_BYPASS`; ở cách B kiểm tra lại profile `dev` |
| Chat, thông báo im lặng không chạy | Origin không có trong danh sách: cách A dùng `localhost:8081`, cách B dùng `localhost:3000`. Mở trang bằng `127.0.0.1` sẽ bị từ chối |
| Upload ảnh lỗi | `CLOUDINARY_*` để trống (mục 3) |
| Cổng bị chiếm | Đổi `DB_PORT`, `BACKEND_PORT`, `FRONTEND_PORT` hoặc `ADMINER_PORT` trong `.env` |
| Build frontend trong Docker bị kill hoặc rất chậm | Tăng Memory của Docker Desktop (1.2) |
| Log build có `Can't resolve './locale' in .../moment` | Chỉ là cảnh báo; build vẫn thành công (thấy trong lần build kiểm chứng) |
| Không chắc đang chạy stack nào | `docker compose ls`: stack local tên là `vivacon-local` |
