# Chạy demo Vivacon trên máy Mac mới

Hướng dẫn dựng lại toàn bộ demo (frontend, backend, database có dữ liệu mẫu) trên một
máy Mac khác bằng Docker. Không cần cài Java, Maven hay Node: mọi thứ build trong Docker.

Chạy trên **Windows**: làm theo file này kèm các chỗ khác ghi trong [WINDOWS.md](WINDOWS.md)
(bắt buộc sửa `COMPOSE_FILE` trong `.env`).

## 0. Cần cài sẵn

- **Docker Desktop** (bản cho chip Apple hoặc Intel, tuỳ máy), đã mở và đang chạy.
- **Git**: gõ `git --version` trong Terminal; nếu chưa có, macOS sẽ gợi ý cài.

## 1. Lấy code

```bash
cd ~
git clone https://github.com/khoatmhcm1999vn/viva-spring-reactjs.git
cd viva-spring-reactjs
git checkout featur_viavacon_ver1
```

## 2. Tạo file `.env`

File `.env` chứa mật khẩu và key thật nên **không có trên GitHub**.

**Cách A (nhanh nhất):** AirDrop file `.env` từ máy cũ, đặt vào `~/viva-spring-reactjs/`.

**Cách B:** tạo mới từ file mẫu:

```bash
cp .env.example .env
echo "DB_PASSWORD=$(openssl rand -hex 16)"
echo "JWT_SECRET_SALT=$(openssl rand -hex 32)"
```

Mở `.env`, dán hai giá trị vừa in ra vào `DB_PASSWORD=` và `JWT_SECRET_SALT=`, rồi điền
`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (Cloudinary Console >
Dashboard). Lưu file.

`.env.example` đã đặt sẵn `SPRING_PROFILES_ACTIVE=dev` và `COMPOSE_FILE=...`, không cần sửa.

## 3. Nạp dữ liệu demo

Dữ liệu mẫu (khoảng 55 tài khoản, 770 bài viết, comment, like, follow) nằm trong file
`vivacon-demo.sql`.

**Trên máy cũ**, xuất DB ra file:

```bash
docker exec vivacon-db pg_dump -U postgres -d vivacon --no-owner --no-privileges --clean --if-exists > ~/Desktop/vivacon-demo.sql
```

AirDrop file đó sang máy mới. Nếu file đã được commit vào thư mục `demo/` thì bỏ qua bước
này và dùng `demo/vivacon-demo.sql`.

**Trên máy mới**, chỉ bật database trước rồi nạp dữ liệu:

```bash
cd ~/viva-spring-reactjs
docker compose up -d db
sleep 15
docker exec -i vivacon-db psql -U postgres -d vivacon < ~/Downloads/vivacon-demo.sql
```

Thay `~/Downloads/vivacon-demo.sql` bằng đường dẫn thật của file. Vài dòng `NOTICE` hoặc
`does not exist, skipping` là bình thường.

## 4. Chạy toàn bộ

```bash
docker compose up -d --build
docker ps
```

Lần đầu mất khoảng 5 đến 10 phút để build. Khi `vivacon-backend` hiện `(healthy)` là dùng được.

## 5. Link demo

| Mục | Link |
|---|---|
| Frontend | http://localhost:8081 |
| Swagger | http://localhost:8091/swagger-ui/index.html |
| Adminer (xem DB) | http://localhost:8901 (server `db`, user `postgres`, mật khẩu là `DB_PASSWORD` trong `.env`) |

Tài khoản (khi đã nạp dữ liệu ở bước 3), mật khẩu chung `Vivacon@123`:

| Vai trò | Username | Vào được |
|---|---|---|
| User thường | `alejandrinamougenel1` (hoặc user mẫu khác) | Newsfeed, đăng bài, like, comment, chat, report |
| Admin | `thanhthuy`, `hanpham`, `xuanthuy` | Dashboard |
| Super admin | `admin` | Dashboard và quản lý admin |

## 6. Luồng demo gợi ý

1. **User đăng bài:** đăng nhập user thường, bấm Tạo bài, chọn ảnh, viết caption (có thể
   thêm `#hashtag`), bấm Đăng. Ảnh được lưu trên Cloudinary.
2. **Admin:** mở cửa sổ ẩn danh, đăng nhập `admin`, giao diện tự chuyển vào Dashboard.
   Giao diện không có màn tạo bài cho admin.
3. **Admin đăng bài qua Swagger:**
   1. `POST /api/v1/login` với `{"username":"admin","password":"Vivacon@123"}`, copy `accessToken`.
   2. Bấm **Authorize**, dán `Bearer <accessToken>` (có chữ `Bearer` và dấu cách).
   3. `POST /api/v1/attachments`, chọn file ảnh.
   4. `POST /api/v1/post` với
      `{"privacy":"PUBLIC","caption":"...","attachments":[<kết quả bước 3>]}`.

## Tips

- **`docker: command not found`**: mở Docker Desktop, hoặc chạy
  `export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"` rồi thử lại.
- **Tắt demo:** `docker compose down`. Dữ liệu vẫn giữ. **Đừng thêm `-v`**, vì `-v` xoá
  luôn database.
- **Upload ảnh lỗi:** kiểm tra 3 dòng `CLOUDINARY_*` trong `.env`, rồi chạy
  `docker compose up -d backend` để backend nhận giá trị mới. Sửa `.env` xong luôn phải
  chạy lại lệnh này.
- **Không đăng nhập được:** DB trống vì chưa làm bước 3.
- **Đổi mật khẩu một tài khoản:** profile dev lưu mật khẩu dạng chữ thường, nên sửa thẳng:
  `docker exec vivacon-db psql -U postgres -d vivacon -c "UPDATE account SET password='MatKhauMoi' WHERE username='admin';"`
- **Biểu đồ Dashboard toàn số 0:** dữ liệu mẫu có ngày trong 2021 đến 2022, còn biểu đồ chỉ
  tính 12 tháng gần nhất. Bài đăng mới trong lúc demo vẫn được tính.
- **Trang không cập nhật sau khi build lại:** bấm Cmd+Shift+R để tải lại trang không dùng cache.
- **Cổng bị chiếm** (8081, 8091, 5433, 8901): đổi `FRONTEND_PORT`, `BACKEND_PORT`, `DB_PORT`,
  `ADMINER_PORT` trong `.env`. Nếu đổi `FRONTEND_PORT`, sửa cả `FRONTEND_ALLOWED_ORIGINS` cho
  khớp, nếu không chat và thông báo sẽ không chạy.
- **Xem log khi có lỗi:** `docker logs -f vivacon-backend` hoặc `docker logs -f vivacon-frontend`.
- **Làm lại từ đầu với DB trống:** `docker compose down -v`, rồi làm lại bước 3 và 4.
- **Khi deploy thật (không phải demo):** đặt `SPRING_PROFILES_ACTIVE=prod`, xoá dòng
  `COMPOSE_FILE` trong `.env` và chạy `docker compose -f docker-compose.yml up -d`.
