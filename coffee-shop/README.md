# Coffee Shop

Boilerplate web bán cà phê: **React 19 + Vite** (client), **Express 5** (server),
**PostgreSQL 18** (database).

Quy ước và lý do chọn từng version nằm ở `.kiro/steering/coffee-shop-stack.md`.

## Chạy

Cần **Node 24+** và Docker.

```bash
cd coffee-shop
cp .env.example .env        # rồi điền DB_PASSWORD và PGPASSWORD (cùng giá trị)
npm run install:all         # cài cả root, server, client
npm run db:up               # Postgres trên :5434, tự nạp schema + seed
npm run dev                 # server :4000 và client :5173
```

Mở http://localhost:5173.

Schema và seed **chỉ chạy lần `up` đầu tiên** — Postgres bỏ qua
`/docker-entrypoint-initdb.d` khi data directory đã có dữ liệu. Muốn nạp lại:

```bash
npm run db:reset            # down -v (xoá volume) rồi up lại
```

## Cổng

| Service | Cổng |
|---|---|
| Client (Vite dev) | 5173 |
| Server (Express) | 4000 |
| PostgreSQL | 5434 |

Ba cổng này chọn lệch khỏi mặc định phổ biến (5432 cho Postgres, 8080 cho API, 3000 cho
dev server) để không tranh cổng với service khác trên máy dev. Trên máy đã dựng
boilerplate này, 1521 thuộc Oracle XE và 5432 thuộc một stack Postgres khác — kiểm
`netstat -ano | findstr LISTENING` trước khi thêm service mới.

## API

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/api/health` | Query thật vào DB, không chỉ trả 200 |
| GET | `/api/products` | `?category=espresso&limit=20&offset=0` |
| GET | `/api/products/:id` | |
| GET | `/api/products/meta/categories` | Đếm sản phẩm theo danh mục |
| GET | `/api/orders/:id` | Kèm các dòng chi tiết |
| POST | `/api/orders` | `{ customerName, items: [{ productId, quantity }] }` |

Đường dẫn danh mục là `/products/meta/categories` chứ không phải `/products/categories`:
route `/:id` khai báo trước nó sẽ bắt mất một path chỉ có một segment.

## Cấu trúc

```
coffee-shop/
├── docker-compose.yml       postgres:18
├── db/
│   ├── schema.sql           schema "coffee": category, product, customer_order, order_item
│   └── seed.sql             4 danh mục, 12 sản phẩm, 2 đơn hàng mẫu
├── server/src/
│   ├── index.js             bootstrap, helmet, cors, graceful shutdown
│   ├── db.js                pg Pool + withTransaction
│   ├── routes/              products.js, orders.js
│   └── middleware/          errorHandler.js
└── client/src/
    ├── api/client.js        mọi fetch đi qua đây
    ├── pages/MenuPage.jsx
    ├── utils/money.js
    └── App.jsx
```

## Vài quyết định đáng giải thích

**Tiền là `NUMERIC`, và `pg` trả nó về dưới dạng string.** Không phải bug — driver làm
vậy để không mất chính xác. Hệ quả thực tế: đừng `parseFloat` rồi cộng ở JavaScript. Mọi
phép tính tiền nằm trong SQL; `client/src/utils/money.js` chỉ định dạng để hiển thị.

**`POST /api/orders` đọc giá từ database, không tin giá client gửi lên.** Request chỉ
chứa `productId` và `quantity`. Nếu lấy `unit_price` từ body thì người dùng tự đặt giá
cho mình.

**`order_item.unit_price` là bản copy, không phải khoá ngoại tới giá hiện tại.** Giá sản
phẩm đổi thì hoá đơn cũ phải giữ giá cũ.

**`GET /api/orders/:id` dùng hai query, không phải một join.** Đơn hàng với dòng chi tiết
là quan hệ 1:N, join một lần sẽ nhân thông tin đơn hàng lên theo số dòng. Chữa bằng
`DISTINCT` là che lỗi, đúng thứ `sql-query-style.md` cấm.

**Tổng đơn hàng tính bằng pre-aggregate phía N.** `GROUP BY order_id` trong subquery rồi
mới `UPDATE` phía 1 — không join trực tiếp rồi `SUM`, vì như vậy dòng bị nhân.

**SQL dùng inner join kiểu cũ** (bảng ngăn bằng dấu phẩy trong `FROM`, điều kiện liên kết
trong `WHERE`) theo `sql-query-style.md` của repo. Mọi giá trị runtime đi qua bind
parameter `$1`, không nối chuỗi — kể cả `limit` và `offset`.

**`= ANY($1::BIGINT[])` thay cho `IN (...)`.** Số phần tử không cố định, mà ghép chuỗi
placeholder động là đường dễ lọt SQL injection. `ANY` nhận cả mảng qua một tham số.

**Lúc dev không có CORS.** Vite proxy `/api` sang `localhost:4000` nên trình duyệt thấy
cùng một origin. Nghĩa là cấu hình CORS **chưa được kiểm thử** chỉ bằng việc chạy dev
server — nó chỉ có tác dụng khi client được build và phục vụ từ domain khác.

## Hai cái bẫy đã gặp thật khi dựng cái này

**`postgres:18` đổi chỗ data directory.** Volume phải mount vào `/var/lib/postgresql`,
không phải `/var/lib/postgresql/data` như quy ước ≤17. Mount sai thì container restart vô
hạn và báo *"in 18+, these Docker images are configured to store database data in a format
which is compatible with pg_ctlcluster"*. Chi tiết:
[docker-library/postgres#1259](https://github.com/docker-library/postgres/pull/1259).

**`pg` trả `BIGINT` về dạng string, không chỉ `NUMERIC`.** Nên `GET /api/products` trả
`"id":"2"`, và client gửi `productId: product.id` sẽ gửi lên một string. Schema `zod` vì
vậy dùng `z.coerce.number()`. Với `z.number()` thì `productId: 1` trả 201 còn
`productId: "1"` trả 400 — bug chỉ lộ khi smoke test.

## Giới hạn đã biết

- **Không có authentication.** Mọi endpoint đều mở, kể cả `POST /api/orders`. Boilerplate
  nên chủ ý giữ đơn giản, nhưng **không được expose ra Internet như hiện tại**.
- **Không có migration tool.** `db/schema.sql` chỉ chạy một lần lúc khởi tạo container.
  Khi schema bắt đầu đổi thì cần Flyway, Liquibase hoặc tương đương.
- **Không có test.**
- **Không có giỏ hàng ở client.** Trang menu chỉ đọc; `createOrder` đã có trong
  `api/client.js` nhưng chưa có UI gọi nó.
- `docker-compose.yml` chỉ dựng database. Server và client chạy trên host.
