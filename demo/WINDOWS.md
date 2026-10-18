# Chạy demo Vivacon trên Windows

Bổ sung cho [README.md](README.md) (viết cho Mac). Các bước giống hệt, file này chỉ ghi
những chỗ **khác trên Windows** và lệnh tương ứng cho PowerShell. Đã chạy thử trên
Windows 11, Docker Desktop 29.8 (Compose v5.6, WSL2, x86_64).

## 0. Cần cài sẵn

- **Docker Desktop for Windows** (backend WSL2), đã mở và đang chạy. Kiểm tra:
  `docker --version` và `docker compose version`.
- **Git for Windows**.

Không cần cài Java, Maven hay Node: mọi thứ build trong Docker.

## 1. Lấy code

```powershell
git clone https://github.com/khoatmhcm1999vn/viva-spring-reactjs.git
cd viva-spring-reactjs
git checkout featur_viavacon_ver1
```

## 2. Tạo file `.env`

```powershell
Copy-Item .env.example .env
```

Windows không có sẵn `openssl`, dùng PowerShell để sinh giá trị ngẫu nhiên:

```powershell
"DB_PASSWORD=" + [guid]::NewGuid().ToString('N')
"JWT_SECRET_SALT=" + [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
```

Dán vào `.env`, điền 3 dòng `CLOUDINARY_*` như README.

### Bắt buộc: sửa dấu ngăn cách trong `COMPOSE_FILE`

`.env.example` viết cho Mac, dùng dấu `:`. Trên Windows Compose ngăn cách bằng `;`, nên
để nguyên thì mọi lệnh `docker compose` đều báo:

```
compose file "docker-compose.yml:docker-compose.override.yml:docker-compose.local.yml"
set by COMPOSE_FILE environment variable is invalid: ... The filename, directory name,
or volume label syntax is incorrect.
```

Sửa dòng đó trong `.env` thành:

```
COMPOSE_FILE=docker-compose.yml;docker-compose.override.yml;docker-compose.local.yml
```

Không muốn sửa `.env` thì truyền `-f` tường minh cho mọi lệnh compose:

```powershell
docker compose -f docker-compose.yml -f docker-compose.override.yml -f docker-compose.local.yml up -d
```

Các lệnh bên dưới viết dạng ngắn `docker compose ...`, giả định đã sửa `.env`.

## 3. Database: kiểm tra volume cũ trước

```powershell
docker volume ls
```

Nếu đã có volume `vivacon-db-data` (từng chạy project trên máy này), Postgres sẽ **dùng
lại dữ liệu cũ** và bỏ qua `schema.sql` (log ghi `Skipping initialization`). Khi đó:

- `DB_PASSWORD` trong `.env` phải trùng mật khẩu lúc tạo volume, nếu không backend không
  kết nối được. Kiểm tra:
  ```powershell
  docker compose up -d db
  docker exec vivacon-db sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U postgres -d vivacon -tAc "select 1"'
  ```
  In ra `1` là khớp.
- Xem đã có dữ liệu chưa:
  ```powershell
  docker exec vivacon-db psql -U postgres -d vivacon -tAc "select (select count(*) from account), (select count(*) from post), (select count(*) from role)"
  ```
  Có tài khoản và đủ 3 role thì bỏ qua bước nạp dữ liệu.

### Nạp file dump (nếu DB trống)

PowerShell **không hỗ trợ** `<` để chuyển file vào lệnh như trên Mac. Copy file vào
container rồi chạy:

```powershell
docker compose up -d db
Start-Sleep 15
docker cp C:\duong\dan\vivacon-demo.sql vivacon-db:/tmp/vivacon-demo.sql
docker exec vivacon-db psql -U postgres -d vivacon -f /tmp/vivacon-demo.sql
```

## 4. Chạy toàn bộ

```powershell
docker compose up -d --build
docker ps
```

Lần đầu mất khoảng 5 đến 10 phút. Muốn xem log build dạng text thì `--progress` là flag
của `docker compose`, phải đặt **trước** `up`:
`docker compose --progress plain up -d --build` (đặt sau `up` sẽ báo `unknown flag`).

## 5. Không đăng nhập được với `Vivacon@123`

Profile `dev` so sánh mật khẩu dạng chữ thường. Dữ liệu cũ (sinh từ `DataGenerator`) lưu
hash BCrypt `$2a$...`, nên mọi tài khoản trả `401` dù đúng mật khẩu. Kiểm tra:

```powershell
docker exec vivacon-db psql -U postgres -d vivacon -tAc "select left(password,4), count(*) from account group by 1"
```

Thấy `$2a$` thì đặt lại mật khẩu chung (chỉ làm trên DB local):

```powershell
docker exec vivacon-db psql -U postgres -d vivacon -c "UPDATE account SET password='Vivacon@123';"
```

Username user thường khác nhau tuỳ bộ dữ liệu (`alejandrinamougenel1` trong README có thể
không có). Lấy vài cái:

```powershell
docker exec vivacon-db psql -U postgres -d vivacon -tAc "select a.username from account a join role r on r.id=a.role_id where r.name='USER' order by a.id limit 3"
```

## 6. Kiểm tra backend nhận đủ biến từ `.env`

Không in giá trị bí mật, chỉ báo đã điền hay trống:

```powershell
docker exec vivacon-backend env | ForEach-Object { if ($_ -match '^(CLOUDINARY_\w+|DB_PASSWORD|JWT_SECRET_SALT|SPRING_PROFILES_ACTIVE|FRONTEND_ALLOWED_ORIGINS)=(.*)$') { "$($matches[1]) = " + $(if ($matches[2]) {'da dien'} else {'TRONG'}) } }
```

Sửa `.env` xong phải chạy `docker compose up -d backend` thì backend mới nhận giá trị mới.

## 7. Link demo và kiểm tra nhanh

| Mục | Link |
|---|---|
| Frontend | http://localhost:8081 |
| Swagger | http://localhost:8091/swagger-ui/index.html |
| Health backend | http://localhost:8091/actuator/health |
| Adminer (xem DB) | http://localhost:8901 (server `db`, user `postgres`, mật khẩu `DB_PASSWORD`) |
| Postgres từ host | `localhost:5433` |

Thử đăng nhập qua frontend từ PowerShell:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:8081/api/v1/login -ContentType 'application/json' -Body '{"username":"admin","password":"Vivacon@123"}'
```

Trả về `accessToken` là chạy được. Tài khoản admin và luồng demo xem README mục 5 và 6.

## Mẹo PowerShell

- `sleep 15` của Mac thay bằng `Start-Sleep 15`; `cp` thay bằng `Copy-Item`.
- Trong Windows PowerShell 5.1, `2>&1` sau lệnh `docker` biến từng dòng stderr thành
  lỗi đỏ `NativeCommandError` dù lệnh vẫn chạy đúng. Bỏ `2>&1` hoặc chỉ nhìn exit code
  (`$LASTEXITCODE`).
- Cổng bị chiếm: `Get-NetTCPConnection -State Listen -LocalPort 8081,8091,5433,8901`. Đổi
  `*_PORT` trong `.env` như README.
- Tải lại trang không dùng cache: **Ctrl+Shift+R**.
- Tắt demo: `docker compose down`. **Đừng thêm `-v`**, vì `-v` xoá luôn database.
