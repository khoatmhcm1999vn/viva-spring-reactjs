# Coffee Shop

Web bán cà phê: **React 19 + Vite** (client), **Express 5** (server),
**PostgreSQL 18** (database).

Tài liệu đầy đủ: [`coffee-shop/README.md`](coffee-shop/README.md).
Quy ước cho agent: [`.kiro/steering/coffee-shop-stack.md`](.kiro/steering/coffee-shop-stack.md).

```bash
cd coffee-shop
cp .env.example .env        # điền DB_PASSWORD và PGPASSWORD
npm run install:all
npm run db:up               # Postgres :5434
npm run dev                 # server :4000, client :5173
```

Cần **Node 24+** và Docker.

---

## ⛔ KHÔNG MERGE NHÁNH NÀY VÀO `main`

Nhánh `feature/coffee-shop-boilerplate` đã **xoá toàn bộ ứng dụng Vivacon** (Spring Boot
+ React 17) — 622 file, gồm `src/`, `frontend/`, `pom.xml`, `mvnw`, `Dockerfile`, cả ba
`docker-compose*.yml` ở gốc, và 4 steering file của Vivacon.

`main` là **tổ tiên** của nhánh này. Nên merge nó vào `main` sẽ **xoá Vivacon khỏi
`main`**, không phải chỉ thêm app cà phê vào. Diff sẽ gồm 622 dòng `D`.

Vivacon còn nguyên ở hai nơi, đã push:

| Nhánh | Commit |
|---|---|
| `main` | `e12d3e0` |
| `feature/ai-assisted-dev-setup` | `ca46696` |

Lấy lại một file hoặc cả cây:

```bash
git checkout main -- src frontend pom.xml        # một phần
git checkout main                                 # toàn bộ
```

### Nếu muốn coffee-shop tách hẳn

Xoá file trên nhánh này **không** làm sạch history: 14 commit trong history vẫn chạm
`pom.xml` và `src/`, nên `git log`, `git show` hay checkout commit cũ vẫn ra đủ Vivacon.
Muốn isolation thật thì cần nhánh orphan hoặc repository riêng:

```bash
git subtree split --prefix=coffee-shop -b coffee-shop-only
```

### Kiểm tra isolation

```bash
node tools/check-no-vivacon.js
```

Script assert không còn source, config Docker, cổng hay chuỗi nào của Vivacon trong các
file đang được track. Exit 0 là sạch.
