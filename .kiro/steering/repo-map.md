---
inclusion: always
---

# Bản đồ repo — hai dự án độc lập

Repo chứa **hai ứng dụng không liên quan nhau**. File này chỉ làm một việc: định tuyến.
Quy ước Git/build/deploy giữa hai app nằm ở `git-multi-app-isolation.md`; chi tiết từng
stack nằm ở các file `fileMatch` bên dưới.

| | **Vivacon** | **Coffee Shop** |
|---|---|---|
| Vị trí | gốc repo | `coffee-shop/` |
| Nghiệp vụ | mạng xã hội kiểu Instagram | web bán cà phê |
| Backend | Spring Boot 2.5, Java 11, Maven | Express 5, Node 24 |
| Frontend | React 17, Create React App | React 19, Vite 8 |
| Database | PostgreSQL 14 / Supabase | PostgreSQL 18 |
| Build | `.\mvnw`, `npm --prefix frontend` | `npm --prefix coffee-shop/...` |

## Bốn chỗ hai app khác nhau có lý do

Giống nhau đủ để nhầm, và khác nhau đủ để nhầm thì vỡ. Đừng "đồng bộ" bốn cặp này:

- **React Router.** Vivacon dùng `react-router-dom` 5 (`Switch`, `component={...}`);
  coffee-shop dùng v7 (`Routes`, `element={...}`). Không copy pattern qua lại.
- **Tiền tố biến môi trường frontend.** Vivacon là `REACT_APP_*` (CRA); coffee-shop là
  `VITE_*`. Cả hai đều nung vào bundle lúc build.
- **Node version.** Vivacon ghim `engines.node: 22.x` cho Vercel; coffee-shop cần `>=24`.
- **Đường dẫn volume Postgres.** `postgres:14` mount `/var/lib/postgresql/data`;
  `postgres:18` mount `/var/lib/postgresql`. Breaking change của image từ bản 18.

## Cổng đã phân chia

| Cổng | Thuộc |
|---|---|
| 1521 | Oracle XE (native trên Windows, ngoài repo) |
| 3000 / 8081 | frontend Vivacon (CRA dev / nginx container) |
| 4000 | API coffee-shop |
| 5173 | Vite dev coffee-shop |
| 5432 | project khác: `vivacon-services` ở `E:\JavaProj\Vivacon-Services` |
| 5433 | PostgreSQL 14 Vivacon (compose) |
| 5434 | PostgreSQL 18 coffee-shop |
| 8090 / 8091 | backend Vivacon (dev host / compose) |
| 8900 / 8901 | Adminer |

Thêm service mới thì tránh toàn bộ danh sách trên.

## Steering nào áp dụng ở đâu

Steering được **merge chứ không override** — không file nào loại trừ được file khác, nên
phân tách làm bằng `inclusion`:

| File | Mode | Phạm vi |
|---|---|---|
| `repo-map.md` | `always` | file này |
| `git-multi-app-isolation.md` | `always` | cả hai |
| `tech-stack-version-policy.md` | `always` | cả hai |
| `sql-query-style.md` | `always` | cả hai |
| `database-efficiency.md` | `always` | cả hai |
| `tech.md` · `structure.md` · `product.md` | `fileMatch` | Vivacon |
| `deployment.md` | `fileMatch` | Vivacon, chỉ file deployment |
| `coffee-shop-stack.md` | `fileMatch` | `coffee-shop/**` |
| `solution-architecture-drawio.md` | `manual` | gọi bằng `#` |

## Khi steering dự án chưa được nạp

`fileMatch` chỉ bật khi đang làm việc với file khớp pattern. Tài liệu Kiro định nghĩa
điều kiện này là "working with files that match" và **không nói rõ** đó là file mở trong
editor, file đã vào context, hay file agent đọc bằng tool.

Hệ quả: một câu hỏi chung không mở file nào — ví dụ *"chạy backend thế nào?"* — có thể
không kích hoạt được gì. Khi đó `read_file` thẳng steering file thay vì trả lời bằng
phỏng đoán:

- Vivacon: `.kiro/steering/tech.md`, `structure.md`, `product.md`, `deployment.md`
- Coffee Shop: `.kiro/steering/coffee-shop-stack.md`, `coffee-shop/README.md`
