---
inclusion: always
---

# Coffee Shop — tech stack và quy ước

Đây là tech stack duy nhất của nhánh này. Trước đây file ở chế độ `fileMatch` vì nhánh
còn chứa một ứng dụng Spring Boot thứ hai; ứng dụng đó đã được xoá khỏi nhánh này, nên
không còn gì để tránh xung đột và file chuyển về `always`.

Ba steering khác cùng áp dụng: `sql-query-style.md` (cách viết SQL),
`database-efficiency.md` (phạm vi truy cập DB) và `tech-stack-version-policy.md` (chính
sách chọn/giữ version). Query trong `coffee-shop/server/` tuân theo
`sql-query-style.md`.

## Stack

Version lấy từ npm registry ngày 2026-10-08. Đây là ảnh chụp thời điểm đó, không phải
cam kết là bản mới nhất mãi mãi.

| Tầng | Chọn | Version |
|---|---|---|
| Runtime | Node.js | **24.x** (Active LTS) |
| Backend | Express | 5.2.1 |
| Driver DB | `pg` | 8.23.1 |
| Validate | `zod` | 4.6.5 |
| Bảo mật header | `helmet` | 8.3.0 |
| CORS | `cors` | 2.8.6 |
| Config | `dotenv` | 18.0.6 |
| Frontend | React | 19.3.0 |
| Build tool | Vite | 8.3.3 |
| Plugin | `@vitejs/plugin-react` | 6.1.2 |
| Routing | `react-router-dom` | 7.18.4 |
| Database | PostgreSQL | **18** |

**Node 24, không phải 22.** Node 22 chuyển sang Maintenance LTS và hết hạn khoảng
20/10/2026; Node 20 và 25 đã EOL. Node 26 là Current, chưa LTS.

**Express 5, không phải 4.** Từ 3/2025 v5 là bản `latest` trên npm. Khác biệt đáng chú ý
với v4: handler `async` ném lỗi được Express tự chuyển sang error middleware, nên không
cần bọc `try/catch` rồi gọi `next(err)` thủ công.

**Vite, không phải Create React App.** CRA đã ngừng bảo trì, nên không dùng toolchain
của nó.

## Cổng

| Service | Cổng |
|---|---|
| PostgreSQL | **5434** |
| API Express | **4000** |
| Vite dev | **5173** |

Ba cổng này chọn lệch khỏi mặc định phổ biến (5432, 8080, 3000) vì máy dev có thể đang
chạy service khác. Trên máy đã dựng boilerplate này, 1521 thuộc Oracle XE và 5432 thuộc
một stack Postgres khác — kiểm `netstat` trước khi thêm service mới.

## Cấu trúc

```
coffee-shop/
├── docker-compose.yml      postgres:18, cổng 5434
├── package.json            script gộp, chạy cả hai bằng concurrently
├── db/
│   ├── schema.sql          schema "coffee", 4 bảng
│   └── seed.sql            dữ liệu mẫu
├── server/                 Express 5 + pg
│   └── src/
│       ├── index.js        bootstrap app
│       ├── db.js           pg Pool, chỉ một instance
│       ├── routes/         một file mỗi resource
│       └── middleware/
└── client/                 React 19 + Vite
    └── src/
        ├── api/            wrapper fetch, không gọi fetch trong component
        ├── pages/          component cấp route
        └── components/
```

## Quy ước backend

- **ES modules**, không CommonJS. `"type": "module"` trong `package.json`; dùng
  `import`, không `require`.
- **Một `pg.Pool` duy nhất** cho cả process, export từ `src/db.js`. Không tạo `Client`
  mới mỗi request — mỗi lần kết nối Postgres tốn một handshake, và pool sinh sôi sẽ ăn
  hết `max_connections`.
- **Luôn dùng bind parameter `$1`, `$2`.** `pg` gửi chúng như prepared statement nên giá
  trị không bao giờ bị parse thành SQL. Không template string, không nối chuỗi — kể cả
  với giá trị trông vô hại như số trang.
- **SQL theo `sql-query-style.md`**: inner join kiểu cũ (bảng ngăn bằng dấu phẩy trong
  `FROM`, điều kiện liên kết trong `WHERE`), keyword UPPERCASE, chỉ `SELECT` cột cần
  thiết, `ORDER BY` trên khóa duy nhất khi phân trang.
- **Route mỏng**: validate bằng `zod`, gọi query, trả JSON. Không nhúng SQL dài vào
  trong handler nếu nó cần tái dùng.
- **Lỗi đi qua một error middleware** ở `src/middleware/errorHandler.js`. Express 5 tự
  bắt lỗi từ handler `async`, nên không viết `try/catch` chỉ để gọi `next(err)`.
- **Tiền là `NUMERIC`, không phải `float`.** `pg` trả `NUMERIC` về JavaScript dưới dạng
  **string** để không mất chính xác. Đừng `parseFloat` rồi cộng; giữ string và tính tổng
  ở phía SQL.
- **`pg` cũng trả `BIGINT` về dạng string**, không chỉ `NUMERIC` — cùng lý do, tránh mất
  chính xác khi vượt `Number.MAX_SAFE_INTEGER`. Hệ quả rất dễ sập bẫy: `GET /api/products`
  trả `"id":"2"`, nên client làm đúng bài bản (`productId: product.id`) sẽ gửi lên một
  **string**. Vì vậy mọi schema `zod` nhận id phải dùng **`z.coerce.number()`**, không
  phải `z.number()`.

  Đã đo trên boilerplate này: với `z.number()` thì `productId: 1` trả 201 còn
  `productId: "1"` trả 400. Lỗi chỉ lộ ra khi smoke test, đọc code không thấy.
- Không ORM. Dự án nhỏ, SQL viết tay đọc rõ hơn và khớp với steering SQL của repo.

## Quy ước frontend

- **Function component + hooks.** Không class component.
- **Mọi HTTP call nằm trong `src/api/`**, là hàm `async` mỏng bọc `fetch`. Component
  không gọi `fetch` trực tiếp.
- **Base URL từ `import.meta.env.VITE_API_URL`**, không hardcode. Vite chỉ phơi biến có
  tiền tố `VITE_`; tiền tố của các build tool khác không có tác dụng ở đây.
- Biến `VITE_*` bị **nung vào bundle lúc build** và không đọc được lúc chạy.
  Đổi URL API thì phải build lại. Đừng đặt secret vào đó — nó nằm trong file tĩnh công
  khai.
- Dev server proxy `/api` sang `localhost:4000` (xem `vite.config.js`), nên lúc dev
  không cần CORS.

## Database

- **Volume của `postgres:18` mount vào `/var/lib/postgresql`, KHÔNG phải
  `/var/lib/postgresql/data`.** Đây là breaking change của image chính thức từ bản 18:
  data nằm trong thư mục con theo major version để `pg_upgrade --link` không vướng ranh
  giới mount point. Mount sai thì image coi volume là "unused mount/volume" và **từ chối
  khởi động**, container restart vô hạn với thông báo *"in 18+, these Docker images are
  configured to store database data in a format which is compatible with
  pg_ctlcluster"*. Chi tiết: [docker-library/postgres#1259](https://github.com/docker-library/postgres/pull/1259).

  Đã gặp thật khi dựng boilerplate này. Lưu ý khi đọc tài liệu hoặc compose file cũ:
  `/var/lib/postgresql/data` là **đúng** cho `postgres:17` trở xuống, nên đừng copy
  đường dẫn đó sang đây.
- Schema tên **`coffee`**, không phải `public`. Qualify tên bảng: `coffee.product`.
- Bảng đặt tên **số ít**: `product`, `category`, `order_item`.
- Đơn hàng là bảng **`customer_order`**, không phải `order` — `ORDER` là reserved word,
  dùng được nhưng phải quote mọi lần.
- Khóa chính `BIGINT GENERATED ALWAYS AS IDENTITY`, không `SERIAL`. `SERIAL` là cú pháp
  cũ tiền-chuẩn và để lại sequence có owner rời rạc.
- Timestamp dùng **`TIMESTAMPTZ`**, không `TIMESTAMP`. Dùng `TIMESTAMP` không timezone
  sẽ phải bù bằng cấu hình UTC ở tầng driver, và sai lệch chỉ lộ ra khi đổi múi giờ.
- Tiền: `NUMERIC(12, 2)` cộng cột `currency_code`. Không cộng tiền khác currency.

## Trạng thái và giới hạn đã biết

- **API không có authentication.** Mọi endpoint đều mở, kể cả `POST /api/orders`. Đây là
  boilerplate nên chủ ý giữ đơn giản, nhưng nó có nghĩa là **không được expose ra
  Internet như hiện tại**. Thêm auth trước khi deploy.
- Chưa có migration tool. `db/schema.sql` chạy một lần khi container Postgres khởi tạo
  lần đầu. Khi schema bắt đầu đổi thì cần một công cụ migration thật.
- Chưa có test.
- `docker-compose.yml` chỉ dựng database. Server và client chạy trên host bằng
  `npm run dev`.
