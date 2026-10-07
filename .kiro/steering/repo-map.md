---
inclusion: always
---

# Bản đồ repo — hai dự án độc lập

Repo này chứa **hai ứng dụng không liên quan nhau**. File này cố ý ngắn vì nó là steering
duy nhất mang tính dự án còn `always`; mọi chi tiết nằm ở các file `fileMatch` bên dưới.

| | **Vivacon** | **Coffee Shop** |
|---|---|---|
| Vị trí | gốc repo | `coffee-shop/` |
| Nghiệp vụ | mạng xã hội kiểu Instagram | web bán cà phê |
| Backend | Spring Boot 2.5, Java 11, Maven | Express 5, Node 24 |
| Frontend | React 17, Create React App | React 19, Vite 8 |
| Database | PostgreSQL 14 / Supabase | PostgreSQL 18 |
| Build | `.\mvnw`, `npm --prefix frontend` | `npm --prefix coffee-shop/...` |

## Quy tắc: không trộn hai dự án

Hai stack giống nhau đủ để nhầm và khác nhau đủ để nhầm thì vỡ. Những lỗi cụ thể cần
tránh:

- Không gợi ý `mvnw`, `pom.xml` hay `application.yml` cho `coffee-shop/`.
- Không gợi ý `npm`, `package.json` hay Vite cho backend Vivacon.
- **React 17 (Vivacon) và React 19 (coffee-shop) không dùng chung API.** Vivacon dùng
  `react-router-dom` 5 (`Switch`, `component={...}`); coffee-shop dùng v7 (`Routes`,
  `element={...}`). Đừng copy pattern qua lại.
- **Biến môi trường frontend khác tiền tố.** Vivacon là `REACT_APP_*` (CRA);
  coffee-shop là `VITE_*`. Cả hai đều nung vào bundle lúc build.
- **Node version khác nhau có lý do.** Vivacon ghim `engines.node: 22.x` cho Vercel;
  coffee-shop cần `>=24`. Đừng "đồng bộ" hai con số.
- **Đường dẫn volume Postgres khác nhau có lý do.** `postgres:14` của Vivacon mount
  `/var/lib/postgresql/data`; `postgres:18` của coffee-shop mount
  `/var/lib/postgresql`. Đây là breaking change của image từ bản 18, không phải lỗi
  thiếu đồng bộ.

## Cổng — đã phân chia để không đụng nhau

| Cổng | Thuộc |
|---|---|
| 1521 | Oracle XE (native trên Windows, không thuộc repo) |
| 3000 / 8081 | frontend Vivacon (CRA dev / nginx container) |
| 5432 | project khác: `vivacon-services` ở `E:\JavaProj\Vivacon-Services` |
| 5433 | PostgreSQL 14 của Vivacon (compose) |
| 5434 | PostgreSQL 18 của coffee-shop |
| 8090 / 8091 | backend Vivacon (dev host / compose) |
| 8900 / 8901 | Adminer |
| 4000 | API coffee-shop |
| 5173 | Vite dev của coffee-shop |

Thêm service mới thì tránh toàn bộ danh sách trên.

## Steering nào áp dụng ở đâu

Steering được **merge chứ không override** — không có cơ chế nào cho một file loại trừ
file khác. Nên việc phân tách làm bằng `inclusion` trên từng file:

| File | Mode | Phạm vi |
|---|---|---|
| `repo-map.md` | `always` | file này |
| `tech-stack-version-policy.md` | `always` | cả hai dự án |
| `sql-query-style.md` | `always` | cả hai dự án |
| `database-efficiency.md` | `always` | cả hai dự án |
| `tech.md` | `fileMatch` | Vivacon |
| `structure.md` | `fileMatch` | Vivacon |
| `product.md` | `fileMatch` | Vivacon |
| `deployment.md` | `fileMatch` | Vivacon, chỉ file deployment |
| `coffee-shop-stack.md` | `fileMatch` | `coffee-shop/**` |
| `solution-architecture-drawio.md` | `manual` | gọi bằng `#` khi cần |

Ba file `always` còn lại là **chính sách**, không phải mô tả dự án: cách chọn version,
cách viết SQL, cách giới hạn truy cập database. Chúng đúng cho cả hai nên giữ `always`.

## Khi steering của dự án chưa được nạp

`fileMatch` chỉ bật khi đang làm việc với file khớp pattern. Tài liệu Kiro định nghĩa
điều kiện này bằng cụm "working with files that match" và **không nói rõ** đó là file mở
trong editor, file đã vào context, hay file agent đọc bằng tool.

Hệ quả thực tế: một câu hỏi chung không mở file nào — ví dụ *"chạy backend thế nào?"* —
có thể không kích hoạt được file nào cả.

Khi đó **đọc thẳng steering file**, đừng trả lời bằng phỏng đoán:

- Vivacon: `.kiro/steering/tech.md`, `structure.md`, `product.md`, `deployment.md`
- Coffee Shop: `.kiro/steering/coffee-shop-stack.md`, `coffee-shop/README.md`

Chúng là file thường, `read_file` được như mọi file khác.
