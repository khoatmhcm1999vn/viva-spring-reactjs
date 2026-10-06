# Vivacon — Sổ theo dõi issue

Danh sách vấn đề **đang mở** của dự án, kèm bằng chứng đo được và hướng sửa.

Ba tài liệu, ba mục đích khác nhau — đừng nhầm:

| File | Trả lời câu hỏi |
|---|---|
| `.kiro/steering/deployment.md` | Đã đi qua những bước nào, vì sao từng bước như vậy |
| `docs/ARCHITECTURE.md` | Cái gì chạy ở đâu, nói chuyện với ai |
| `docs/ISSUES.md` (file này) | **Cái gì đang hỏng, và sửa thế nào** |

**Lần kiểm chứng gần nhất:** 2026-10-07
**Trên code:** `main` = `e12d3e0`, nhánh làm việc = `1149cf9` (hơn `main` 2 commit, chỉ tài liệu — nên code deploy đúng bằng working tree)

Quy ước trạng thái: 🔴 chặn · 🟠 cần sửa · 🟡 nợ kỹ thuật · ⚪ đã biết, chấp nhận tạm · ✅ đã sửa · ❌ báo động sai

---

## Tổng quan

| ID | Vấn đề | Mức | Trạng thái |
|---|---|---|---|
| [ISS-01](#iss-01) | Quick tunnel chết vĩnh viễn sau khi suspend VM | 🔴 | Mở — hoãn theo yêu cầu |
| [ISS-02](#iss-02) | Ba hostname tunnel lệch nhau ở ba nơi | 🔴 | Mở — hoãn theo yêu cầu |
| [ISS-03](#iss-03) | `REACT_APP_*` nung lúc build → đổi hostname phải redeploy | 🟠 | Mở (gốc của ISS-01/02) |
| [ISS-04](#iss-04) | Không có MCP server nào cho Oracle | 🟠 | **Chờ bạn** — cần credential + sửa `mcp.json` |
| [ISS-05](#iss-05) | MCP Postgres dùng `localhost` trong container | 🔴 | **Chờ bạn** — agent bị chặn ghi `.kiro/settings/` |
| [ISS-06](#iss-06) | Không có Postgres nào chạy trên máy dev | ✅ | **Đã sửa** 2026-10-07 |
| [ISS-07](#iss-07) | Container MCP mồ côi tích tụ | ✅ | **Đã dọn** 2026-10-07 |
| [ISS-08](#iss-08) | Password DB plaintext trong `mcp.json` được git track | ❌ | **Báo động sai** — xem bên dưới |
| [ISS-09](#iss-09) | Node 16 (Docker) vs Node 22 (Vercel) — hai môi trường build lệch nhau | ✅ | **Đã sửa + verify** 2026-10-07 |
| [ISS-10](#iss-10) | `ddl-auto: update` trỏ thẳng vào DB production | 🟠 | Mở |
| [ISS-11](#iss-11) | Không có migration; `schema.sql` chỉ tạo 11/19 bảng | 🟠 | Mở |
| [ISS-12](#iss-12) | `up -d` không rebuild vì có khoá `image:` | 🟡 | Mở (có chủ ý, cần biết) |
| [ISS-13](#iss-13) | Các issue kế thừa từ `deployment.md` | ⚪ | Mở |

Lịch sử thay đổi ở [cuối file](#changelog).

---

## A. Đang làm site công khai chết

Trạng thái đo được ngày 2026-10-07:

| Thành phần | Kết quả |
|---|---|
| Vercel `viva-spring-reactjs-five.vercel.app` | 🟢 200, phục vụ bình thường |
| VM `192.168.221.128` | 🟢 ping OK, 4 container `Up 2 days` |
| `http://192.168.221.128/api/v1/account/check?username=admin` | 🟢 **200**, 196 byte |
| Supabase pooler `aws-0-ap-south-1` | 🟢 DNS `3.111.105.85`, `65.0.195.55`; TCP 5432 OPEN |
| Cloudflare Tunnel | 🔴 **không hostname nào resolve được** |

Đọc bảng này cho đúng: **không có tầng nào hỏng.** Backend khỏe, Supabase khỏe, và
`account/check` trả 200 chứng minh cả ba tầng cùng hoạt động (endpoint đó đi qua
nginx → Spring Boot → Supabase). Chỉ riêng *đường vào công khai* bị đứt. Nên mở site
Vercel thì ra trang, mà login/newsfeed/chat đều chết.

<a id="iss-01"></a>
### ISS-01 🔴 Quick tunnel chết vĩnh viễn sau khi suspend VM

**Hiện tượng.** `vivacon-cloudflared` vẫn `Up 2 days`, process còn sống, nhưng log lặp
vô hạn:

```
ERR Register tunnel error from server side error="Unauthorized: Tunnel not found"
INF Retrying connection in up to 32s
```

**Nguyên nhân.** VM bị **suspend** (không phải shutdown), nên đồng hồ uptime của Docker
vẫn chạy và container *trông như* vẫn bình thường. Trong lúc suspend, Cloudflare thu hồi
quick tunnel ở phía server. Khi VM resume, cloudflared cố đăng ký lại bằng credential
cũ và bị từ chối — credential của quick tunnel gắn với lần đăng ký đó, không dùng lại
được.

**Vòng retry này sẽ không bao giờ tự khỏi.** Đây là điểm cần nhớ: `docker ps` nói
"Up", healthcheck không có, nên không gì báo động. Phải đọc log mới thấy.

**Cách sửa tạm:** `docker compose ... up -d --force-recreate cloudflared` → được hostname
**mới**, rồi kéo theo ISS-02 và ISS-03.

**Cách sửa thật:** named tunnel. Cần tài khoản Cloudflare + domain, rồi đặt trong `.env`:

```
TUNNEL_TOKEN=<token>
TUNNEL_COMMAND=tunnel run
```

`docker-compose.tunnel.yml` đã hỗ trợ sẵn cả hai chế độ. Hiện `TUNNEL_COMMAND=` đang
rỗng trong `.env` của VM, tức đang chạy mặc định `tunnel --url http://frontend:80` —
chế độ quick.

<a id="iss-02"></a>
### ISS-02 🔴 Ba hostname tunnel lệch nhau ở ba nơi

Quick tunnel đã cấp 3 hostname qua các lần restart, và **ba nơi đang giữ ba giá trị
khác nhau**:

| Nơi lưu | Hostname | Sửa bằng cách nào |
|---|---|---|
| `config/tunnel-url.txt` (bản copy tay sang Windows) | `span-arising-conjunction-administration` | sửa file |
| **Bundle Vercel đang live** (`main.fdd1f145.js`) | `span-arising-conjunction-administration` | **phải redeploy** |
| `FRONTEND_ALLOWED_ORIGINS` trong `.env` của VM | `use-teddy-website-away` | restart backend |
| cloudflared đăng ký lần cuối | `use-teddy-website-away` | — |

Đo trực tiếp trên bundle đang phục vụ:

```
baked URLs: https://span-arising-conjunction-administration.trycloudflare.com/api
            https://span-arising-conjunction-administration.trycloudflare.com/api/v1
            https://span-arising-conjunction-administration.trycloudflare.com/ws
```

**Điều này cho thấy một bất đối xứng quan trọng.** `config/vm-tunnel-origins.sh` đã chạy
và sync đúng phía backend sang `use-teddy-...`, nhưng Vercel chưa hề build lại. Script
đó chỉ sửa được **nửa rẻ** của vấn đề: danh sách origin đọc lúc khởi động nên restart là
xong, còn URL trong bundle bị nung lúc build nên bắt buộc redeploy.

Hệ quả: **ngay cả khi ISS-01 được sửa và tunnel sống lại ở `use-teddy-...`, site Vercel
vẫn chết**, vì bundle vẫn gọi vào `span-arising-...`. Hai issue phải sửa cùng nhau.

**Nguyên tắc rút ra:** đọc hostname từ **log của container đang chạy**, không bao giờ từ
`tunnel-url.txt`. `config/vm-tunnel-origins.sh` làm đúng vậy (`docker logs ... | tail
-1`) và ghi ra `~/tunnel-url.txt` *trong VM*; bản `config/tunnel-url.txt` trên Windows
là copy tay nên lạc hậu.

**Một cạm bẫy của chính script đó, trong đúng tình trạng hiện tại:** `tail -1` lấy
hostname cuối trong log, tức `use-teddy-...`. Nhưng tunnel **không** phục vụ hostname đó
nữa (ISS-01) — nó đang ở vòng retry `Unauthorized`. Chạy script bây giờ sẽ "thành công"
trong việc sync sang một hostname đã chết. Phải recreate `cloudflared` **trước**, xem
thứ tự ở runbook.

<a id="iss-03"></a>
### ISS-03 🟠 `REACT_APP_*` nung lúc build, không đọc được lúc chạy

Gốc rễ của ISS-01 và ISS-02. CRA thay thế `process.env.REACT_APP_*` thành chuỗi hằng
lúc webpack build, nên:

- Đổi biến môi trường trên Vercel là **chưa đủ** — phải redeploy.
- Mỗi lần hostname tunnel đổi là một lần build lại frontend.

Có một hệ quả phụ làm việc debug tốn thời gian: `frontend/vercel.json` rewrite
`/(.*)` → `/index.html`, nên `https://<site>.vercel.app/api/v1/post` trả **200 kèm
HTML**, không phải 404. Nếu biến môi trường bị thiếu, bundle lặng lẽ dùng `/api` tương
đối, axios nhận HTML, và lỗi hiện ra là `Unexpected token <` — chẳng trỏ vào nguyên
nhân thật.

**Hướng sửa.** Hai lựa chọn, khác nhau về bản chất:

1. **Named tunnel + domain cố định** — hostname không đổi nữa, vấn đề tự biến mất.
2. **Bỏ Vercel, phục vụ frontend từ nginx trên VM** — cùng origin cho tất cả, không
   CORS, không rebuild khi hostname đổi. App *đã* chạy đầy đủ theo cách này.
   Đánh đổi: mất CDN. Bundle 4.2 MB và Cloudflare trả `cf-cache-status: DYNAMIC` cho
   quick tunnel, nên mọi khách phải tải 4.2 MB từ đường mạng nhà.

---

## B. MCP (Model Context Protocol)

<a id="iss-04"></a>
### ISS-04 🟠 Không có MCP server nào cho Oracle — *chờ bạn*

`.kiro/settings/mcp.json` chỉ khai báo duy nhất `postgres-vivacon`. File cấp user
`~/.kiro/settings/mcp.json` **không tồn tại**. Nên không có đường nào để truy cập Oracle.

Bản thân Oracle thì đang chạy tốt trên máy:

```
OracleServiceXE                 Running
OracleOraDB21Home1TNSListener   Running   → port 1521 (tnslsnr, PID 5960)
Services READY:                 XE, xepdb1, XEXDB
ORACLE_HOME:                    C:\app\Admin\product\21c\dbhomeXE
```

**Đường đi chính thức: SQLcl.** Từ bản 25.2, SQLcl chạy được như MCP server bằng
`sql -mcp`, dùng các connection đã lưu trong connection store `~/.dbtools`, và mặc định
khởi động ở chế độ hạn chế. Nguồn:
[Oracle — Preparing Your Environment](https://docs.oracle.com/en/database/oracle/sql-developer-command-line/25.2/sqcug/preparing-your-environment.html),
[Oracle — Introducing MCP Server for Oracle Database](https://blogs.oracle.com/database/introducing-mcp-server-for-oracle-database).
*Nội dung đã được diễn giải lại cho phù hợp giấy phép.*

Đã kiểm trên máy này — có **hai** SQLcl, và chỉ một cái dùng được:

| Đường dẫn | Phiên bản | Dùng được? |
|---|---|---|
| `...\.vscode\extensions\oracle.sql-developer-26.3.0-win32-x64\dbtools\sqlcl\bin\sql.exe` | **26.3.0** | ✅ có `-mcp` |
| `C:\app\Admin\product\21c\dbhomeXE\bin\sql.exe` (cái đang trên PATH) | — | ❌ hỏng: `Could not find or load main class oracle.dbtools.raptor.scriptrunner.cmdline.SqlCli` |

Cái trên PATH hỏng classpath, nên **phải gọi bằng đường dẫn tuyệt đối tới bản của
extension**. Dễ mắc bẫy vì `sql -v` ở terminal sẽ chạy đúng cái hỏng.

**Vì sao chưa làm được.** Hai lý do, cả hai cần bạn:

1. `~/.dbtools` **không tồn tại** → chưa có saved connection nào, mà `sql -mcp` chỉ
   dùng connection trong store đó.
2. Không có credential Oracle. Mình chủ động **không** đi đọc connection store của
   SQL Developer desktop để moi password.

**Các bước cần làm.** Bước 1 chạy một lần, bạn tự nhập password:

```powershell
$sqlcl = "$env:USERPROFILE\.vscode\extensions\oracle.sql-developer-26.3.0-win32-x64\dbtools\sqlcl\bin\sql.exe"
& $sqlcl /nolog
```

Trong prompt SQLcl:

```
connect -save vivacon_xe -savepwd <user>@localhost:1521/xepdb1
conn -list
exit
```

`-save` ghi connection vào `~/.dbtools`; `-savepwd` lưu password vào secret store của
SQLcl để MCP server tự kết nối không cần hỏi lại.

Bước 2, thêm vào `.kiro/settings/mcp.json` — xem [ISS-05](#iss-05) cho file hoàn chỉnh
gồm cả hai server.

**Một lưu ý nếu sau này chuyển sang MCP server dạng container:** Oracle chạy *native
trên Windows*, không trong Docker. Container sẽ phải dùng
`host.docker.internal:1521`, không phải `localhost` — đúng cái bẫy của ISS-05. Với
`sql -mcp` thì không gặp, vì nó là tiến trình chạy trực tiếp trên host.

<a id="iss-05"></a>
### ISS-05 🔴 MCP Postgres dùng `localhost` trong container — *chờ bạn*

`mcp.json` đặt `DATABASE_URI=postgresql://postgres:***@localhost:5433/vivacon`, mà
server chạy bằng `docker run`. Trong container, `localhost` là **chính container đó**.

Log của server:

```
error connecting in 'pool-1': connection to server at "fdc4:f303:9324::254",
port 5433 failed: Network is unreachable
WARNING  Could not connect to database: ... couldn't get a connection after 30.00 sec
WARNING  The MCP server will start but database operations will fail
```

Dòng cuối là chỗ đánh lừa: server **vẫn khởi động thành công** và bắt tay MCP đúng
(`postgres-mcp 1.6.0`, protocol `2024-11-05`), chỉ có mọi tool liên quan DB là fail.
Nên nhìn từ Kiro thì server "đã kết nối".

Đã kiểm chứng DNS bên trong container:

```
localhost             → ::1                (chính container)
host.docker.internal  → 192.168.65.254     (host thật)
```

**Sửa:** đổi host thành `host.docker.internal:5433`.

**Agent không sửa được file này.** Kiro chặn ghi vào `.kiro/settings/` theo policy
(`deny fs_write matching ".kiro/settings/"`), nên bước này phải làm tay. Dán nội dung
dưới đây, thay `<password>` bằng giá trị đang có trong file, và `<user>` bằng user Oracle
bạn đã lưu ở [ISS-04](#iss-04):

```json
{
  "mcpServers": {
    "postgres-vivacon": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "DATABASE_URI",
        "crystaldba/postgres-mcp",
        "--access-mode=restricted"
      ],
      "env": {
        "DATABASE_URI": "postgresql://postgres:<password>@host.docker.internal:5433/vivacon"
      },
      "disabled": false,
      "autoApprove": [
        "list_schemas",
        "list_objects",
        "get_object_details",
        "explain_query",
        "analyze_db_health",
        "get_top_queries"
      ]
    },
    "oracle-xe": {
      "command": "C:\\Users\\Admin\\.vscode\\extensions\\oracle.sql-developer-26.3.0-win32-x64\\dbtools\\sqlcl\\bin\\sql.exe",
      "args": ["-mcp"],
      "disabled": false
    }
  }
}
```

Hai điểm về đoạn JSON này:

- **Password không nằm trên command line.** `-e DATABASE_URI` không kèm giá trị, nên
  Docker lấy từ environment của tiến trình mà Kiro dựng từ khối `env`. Nhờ vậy password
  không lọt vào danh sách process của host. Dạng này đã đúng từ đầu, giữ nguyên.
- **`oracle-xe` không có khối `env`.** SQLcl đọc credential từ secret store
  `~/.dbtools`, nên không có gì phải đặt ở đây. Nhớ dùng đường dẫn tuyệt đối tới bản
  26.3.0 của extension, không phải `sql` trên PATH (xem ISS-04).

Sau khi dán, reconnect MCP server từ panel Kiro (hoặc reload window) rồi thử một tool
chỉ đọc như `list_schemas`.

<a id="iss-06"></a>
### ISS-06 ✅ Không có Postgres nào chạy trên máy dev — *đã sửa 2026-10-07*

**Trạng thái cũ.** Cổng 5432 và 5433 đều CLOSED; `docker ps -a` chỉ thấy hai container
MCP, không có `vivacon-db`.

Đã kiểm chứng đây là lỗi *riêng biệt* với ISS-05: chạy lại đúng image đó với
`host.docker.internal:5433` thì thông báo lỗi đổi từ `Network is unreachable` thành
`connection failed: ... server closed the connection` — tức host đã tới được, nhưng đầu
bên kia trống.

**Đã làm.** `docker compose up -d db`. Volume `vivacon-db-data` còn nguyên nên dữ liệu
không mất gì:

```
vivacon-db | Up (healthy) | 0.0.0.0:5433->5432/tcp
19 base tables, 3 views, 14 functions, 54 accounts, 688 posts, 30552 comments
```

Khớp từng con số với `deployment.md`. 14 function quan trọng vì `dao/` gọi chúng theo
tên; 3 view là `month_year` / `quarter_year` / `list_year` do ISS-13 để lại.

Cổng là **5433 chứ không phải 5432**, vì 5432 do một project khác giữ —
`vivacon-services` ở `E:\JavaProj\Vivacon-Services`. Đừng mặc định Postgres nào ở 5432
cũng là của repo này.

<a id="iss-07"></a>
### ISS-07 ✅ Container MCP mồ côi tích tụ — *đã dọn 2026-10-07*

**Trạng thái cũ.** Có **3 container `crystaldba/postgres-mcp`** còn sống (hai cái chạy
41 và 53 phút, một cái sinh thêm trong lúc kiểm). Chúng được start với `--rm` nhưng
không tự thoát khi MCP client ngắt, nên mỗi lần Kiro thử khởi động lại là rò thêm một
cái — mỗi cái giữ một pool đang retry.

**Đã làm.** Xoá cả 3. Sau khi dọn chỉ còn `vivacon-db`.

```powershell
docker ps -aq --filter "ancestor=crystaldba/postgres-mcp" | ForEach-Object { docker rm -f $_ }
```

Nguyên nhân rò sẽ hết khi ISS-05 được sửa (server kết nối được thì không treo trong
vòng retry), nhưng vẫn nên kiểm định kỳ bằng lệnh trên.

<a id="iss-08"></a>
### ISS-08 ❌ ~~Password DB plaintext trong `mcp.json` được git track~~ — *báo động sai*

**Chẩn đoán ban đầu sai.** Mình nói file này được git track trên repo public. Không
đúng. `.gitignore` dòng 40 đã loại nó từ trước:

```
### Kiro ###
# mcp.json chứa connection string kèm password, không commit
.kiro/settings/mcp.json
```

Và đã kiểm cả history, không chỉ trạng thái hiện tại:

```
git ls-files --error-unmatch .kiro/settings/mcp.json  -> did not match any file
git log --all --oneline -- .kiro/settings/mcp.json    -> 0 commit
```

Password chưa từng vào git. Giữ nguyên mục này thay vì xoá, vì một sổ theo dõi issue
cũng nên ghi lại cả những lần chẩn đoán sai — chúng chỉ ra chỗ mình đã suy luận từ phỏng
đoán thay vì đo.

Phần duy nhất còn giá trị: dạng `"-e", "DATABASE_URI"` không kèm giá trị là **đúng** —
nó giữ password khỏi command line và khỏi danh sách process của host. Đừng đổi thành
`-e DATABASE_URI=...`.

---

## C. Build, schema và quy trình thay đổi

<a id="iss-09"></a>
### ISS-09 ✅ Hai môi trường build Node lệch 6 major version — *đã sửa 2026-10-07*

**Trạng thái cũ.** Cùng một source, hai toolchain khác nhau:

| Nơi build | Node |
|---|---|
| `frontend/Dockerfile` | `node:16-bullseye-slim` |
| Vercel | 22.23.3 |
| `frontend/package.json` → `engines.node` | `22.x` |

`npm install --force` bỏ qua cảnh báo `EBADENGINE` nên nó **không fail ngay** — nó fail
lệch nhau về sau, và bundle từ Docker không còn là cùng một thứ với bundle từ Vercel.

**Đã làm.** `frontend/Dockerfile` đổi sang `node:22-bookworm-slim`, kèm comment giải
thích vì sao con số đó phải khớp ba nơi.

**Đã verify bằng build thật**, không chỉ đọc file — đây là chỗ dễ vỡ vì `react-scripts`
5 cộng khối `overrides` ghim `react-konva`:

| Kiểm | Kết quả |
|---|---|
| `npm install --force` trên Node 22 | 1870 package, ~1 phút, không lỗi |
| `react-scripts build` | "Compiled with warnings", build thành công |
| Bundle sinh ra | `main.daa6196f.js`, 4.37 MB |
| **MD5 so với bản build Node 16** | `fe6f70a5f672e4089f79617f2427d68a` — **trùng khít** |
| Đường dẫn tương đối `/api/v1` trong bundle | có |
| `localhost:8090` / `vivacon.cf` / `trycloudflare` trong bundle | không có cái nào |
| Runtime: `GET /` | 200 |
| Runtime: `GET /newsfeed` (SPA fallback) | 200 |
| Runtime: `GET /healthz` | 200 |

Dòng MD5 là dòng đáng giá nhất: **output giống nhau từng byte**, nên nâng Node không
thay đổi hành vi gì cả. Rủi ro bằng không, và từ giờ Docker với Vercel build bằng cùng
một major version.

Image và log dùng để verify đã xoá sau khi đo.

<a id="iss-10"></a>
### ISS-10 🟠 `ddl-auto: update` trỏ thẳng vào DB production

`src/main/resources/application-prod.yml`:

```yaml
jpa:
  generate-ddl: true
  hibernate:
    ddl-auto: update
```

Có mặt tốt: thêm một `@Entity` thì Hibernate tự `CREATE TABLE` trên Supabase lúc backend
boot, không cần làm gì thêm. Chính cơ chế này đã tạo 8 trong 19 bảng.

Nhưng ba giới hạn cần biết trước khi dựa vào nó:

- **Chỉ thêm, không bao giờ sửa.** Đổi kiểu cột, rename, bỏ cột → Hibernate im lặng bỏ
  qua. Entity và DB lệch nhau mà không ai báo.
- **Không quản stored function.** 14 function mà `dao/` gọi theo tên do
  `container/prepare/functions/*.sql` nạp. Bảng mới cần function mới thì phải apply tay
  lên Supabase.
- **Một lần deploy nhánh sai là schema thật bị sửa.** `update` chạy với quyền ghi DDL
  trên database production.

**Hướng sửa:** Flyway hoặc Liquibase, rồi hạ `ddl-auto` xuống `validate`. Đây là việc
riêng có phạm vi rõ, không phải fix nhanh.

<a id="iss-11"></a>
### ISS-11 🟠 Không có migration; `schema.sql` chỉ tạo 11/19 bảng

Hai vấn đề cùng gốc: không có nguồn sự thật duy nhất cho schema.

**Không có sync giữa các database.** DB local (compose, 5433) và Supabase hoàn toàn độc
lập — không replication, không migration tool nào trong repo. Supabase được nạp **một
lần** bằng `config/supabase-restore.ps1` từ dump trong `container/data/`. Sửa DB local
sẽ **không** lên Supabase, và hai bên trôi xa nhau lặng lẽ.

**`schema.sql` đã lạc hậu.** Nó tạo 11 bảng: `role`, `account`, `participant`,
`following`, `liking`, `attachment`, `comment`, `conversation`, `message`, `post`,
`setting`. Tám bảng còn lại — `device_metadata`, `hashtag`, `hashtag_rel_post`,
`notification`, `account_report`, `post_report`, `comment_report`, `report_template` —
chỉ tồn tại nhờ ISS-10.

Hậu quả cụ thể đã ghi nhận: `getlastestloginlocationperaccount()` fail với
`relation "device_metadata" does not exist` trên schema dựng từ `schema.sql` đơn thuần.

Và `schema.sql` chỉ chạy khi volume Postgres còn trống (lần `up` đầu), nên thêm bảng
xong file đó vẫn cũ. **Dựng DB mới thì restore dump, đừng dùng `schema.sql`.**

<a id="iss-12"></a>
### ISS-12 🟡 `up -d` không rebuild vì có khoá `image:`

`docker-compose.yml` khai báo cả `build:` lẫn `image:` cho `backend` và `frontend`. Có
`image:` thì `up` **dùng lại image sẵn có thay vì build**. Cộng với việc VM deploy bằng
`up -d --no-build`, kết quả là **code mới bị bỏ qua trong im lặng**.

Đây là thiết kế có chủ ý — nó cho phép build ở máy khác rồi `docker save | docker load`
sang VM, cần thiết vì VM chỉ còn ~1.8 GB RAM khả dụng. Ghi vào đây vì nó dễ gây nhầm,
không vì nó sai.

Đổi code backend thì phải tường minh:

```powershell
docker compose build backend
docker compose -f docker-compose.yml up -d backend
```

**Và chỉ restart đúng service cần restart.** `up -d` trần sẽ recreate luôn
`cloudflared` → hostname đổi → kéo theo ISS-02 và một lần redeploy Vercel. `up -d
backend` thì không.

#### Bảng tra: đổi gì thì phải làm gì

| Đổi gì | Build lại? | Phải làm |
|---|---|---|
| Thêm `@Entity` / cột mới | Backend: **có** | Hibernate `update` tự tạo bảng lúc boot |
| Sửa/xoá cột, đổi kiểu | Backend: có | `update` **không** làm — viết SQL tay |
| Stored function (`dao/`) | Không | Apply SQL trực tiếp lên Supabase |
| Dữ liệu ở DB local | — | **Không** sync lên Supabase (ISS-11) |
| Code Java | **Có** | `docker compose build backend` rồi `up -d backend` |
| `application-*.yml`, biến môi trường | Không | Restart container |
| Code React | **Có** | Push `main` → Vercel tự build |
| URL backend (tunnel đổi) | **Có** | Sửa env **và redeploy** (ISS-03) |

<a id="iss-13"></a>
### ISS-13 ⚪ Issue kế thừa từ `deployment.md`

Các vấn đề đã biết từ trước, chi tiết đầy đủ ở `.kiro/steering/deployment.md`:

| Vấn đề | Ảnh hưởng |
|---|---|
| **Statistics function không an toàn khi gọi đồng thời** | Mỗi hàm drop/recreate view *vĩnh viễn* (`month_year`, `quarter_year`, `list_year`) trong `public`. Hai request dashboard cùng lúc sẽ đua nhau → lỗi "relation does not exist" không tái hiện được theo ý muốn. Sửa: inline thành CTE, xoá view |
| **Supabase thêm ~105 ms mỗi round trip** | Project ở `ap-south-1` (Mumbai). `account/check` qua proxy: 328 ms, so với 5 ms khi dùng Postgres local. Endpoint query 1 lần thì ổn; mapper enrich theo từng item sẽ rất chậm. Đổi vùng phải tạo project mới |
| **412 ESLint warning** | Vercel phải build với `CI=false`. 347 `no-unused-vars`, nhưng **20 `jsx-a11y/alt-text`** là lỗ hổng accessibility thật |
| **Credential còn trong git history, repo public** | Xoá khỏi file hiện tại không đủ. Phải **rotate** ở AWS, Cloudinary, mail provider, Postgres |
| **Email chưa gửi được** | Thiếu `MS_OAUTH_*`. Mailbox là tài khoản Microsoft cá nhân nên không dùng được `client_credentials`; phải lấy refresh token một lần qua consent trên browser |
| **Maven profile `prod` đã lạc hậu** | Build frontend từ `../Vivacon-UI`, thư mục không tồn tại. Docker build không dùng profile này |
| **Vercel tự inject 18 biến `REACT_APP_VERCEL_*`** | Lọt vào bundle công khai: tên tác giả commit, repo owner, project/deployment ID, commit SHA và message. Repo này public nên tác động nhỏ, nhưng tắt được ở *Project Settings → Environment Variables* |
| **`vivacon-db` thành đồ dư trong deploy** | Backend đã trỏ sang Supabase, service `db` vẫn còn trong compose. Bỏ đi là một quyết định, không phải fix |
| **Chưa có firewall trên VM** | `ufw` chưa chạm tới |
| **Chưa từng build from scratch trên máy sạch** | Image được ship sang VM, và image trên Windows build từ layer cache ấm |

---

## Runbook: hồi sinh deployment công khai

**Chưa chạy** — ghi lại để dùng khi cần. Thứ tự quan trọng: hostname tunnel phải tồn tại
**trước** khi build Vercel, vì `REACT_APP_*` nung lúc build (ISS-03).

```bash
# 1. Trong VM: cấp lại tunnel (ISS-01). Chỉ recreate cloudflared, không up -d trần.
cd ~/viva-spring-reactjs
docker compose -f docker-compose.yml -f docker-compose.tunnel.yml up -d --force-recreate cloudflared

# 2. Đọc hostname MỚI từ log container đang chạy — không đọc tunnel-url.txt (ISS-02)
docker logs vivacon-cloudflared 2>&1 | grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' | tail -1

# 3. Sync FRONTEND_ALLOWED_ORIGINS rồi restart backend
bash config/vm-tunnel-origins.sh
```

4. Cập nhật 2 biến trên Vercel → `REACT_APP_API_URL=https://<host-mới>/api`,
   `REACT_APP_SOCKET_URL=https://<host-mới>/ws`
5. **Redeploy Vercel** (bắt buộc, không chỉ sửa biến)
6. Verify bằng `config/vercel-verify.ps1` và `config/tunnel-verify.ps1`, kỳ vọng `FAIL=0`

**Việc này sẽ phải làm lại mỗi lần cloudflared restart.** Muốn dứt điểm thì chọn một
trong hai hướng ở ISS-03.

---

## Phụ lục: cách kiểm chứng lại

```powershell
# Trạng thái 3 tầng
ping -n 2 192.168.221.128
Invoke-WebRequest "http://192.168.221.128/api/v1/account/check?username=admin" -UseBasicParsing
Invoke-WebRequest "https://viva-spring-reactjs-five.vercel.app/" -Method Head -UseBasicParsing

# Container trong VM + hostname tunnel thật
powershell -File config/vmssh.ps1 "docker ps -a --format '{{.Names}} | {{.Status}}'"
powershell -File config/vmssh.ps1 "docker logs --tail 15 vivacon-cloudflared 2>&1"

# Hostname đang nung trong bundle Vercel (ISS-02)
$idx = (Invoke-WebRequest "https://viva-spring-reactjs-five.vercel.app/" -UseBasicParsing).Content
$js  = [regex]::Matches($idx,'/static/js/[^"]+\.js')[0].Value
$b   = (Invoke-WebRequest "https://viva-spring-reactjs-five.vercel.app$js" -UseBasicParsing).Content
[regex]::Matches($b,'https://[a-z0-9-]+\.trycloudflare\.com[^"]*') | % { $_.Value } | sort -Unique

# MCP Postgres (ISS-05/06/07)
docker ps -a --filter "ancestor=crystaldba/postgres-mcp"
docker logs --tail 30 <tên-container>
docker run --rm alpine sh -c "getent hosts host.docker.internal; getent hosts localhost"

# Oracle (ISS-04)
Get-Service -Name "Oracle*" | Select-Object Name,Status
& "C:\app\Admin\product\21c\dbhomeXE\bin\lsnrctl.exe" status
```

**Không echo giá trị secret.** Đọc `config/supabase.env` và `.env` thì lọc theo tên key
(`PGHOST`, `PGUSER`…) hoặc mask password, như các lệnh trong phụ lục này.

---

<a id="changelog"></a>
## Lịch sử thay đổi

### 2026-10-07 — lượt sửa đầu tiên

**Đã sửa**

- **ISS-09** — `frontend/Dockerfile`: `node:16-bullseye-slim` → `node:22-bookworm-slim`.
  Verify bằng build thật; bundle MD5 trùng khít bản cũ nên không đổi hành vi.
- **ISS-06** — `docker compose up -d db`. Volume cũ còn nguyên: 19 bảng, 14 function,
  54 account, 688 post, 30.552 comment.
- **ISS-07** — xoá 3 container `crystaldba/postgres-mcp` mồ côi.

**Sửa lại chẩn đoán**

- **ISS-08** — báo động sai. `.kiro/settings/mcp.json` đã nằm trong `.gitignore` và
  chưa từng có commit nào chạm vào nó. Password chưa bao giờ vào git.

**Chờ bạn làm tay**

- **ISS-05** và **ISS-04** — cả hai đều cần sửa `.kiro/settings/mcp.json`, mà Kiro chặn
  agent ghi vào `.kiro/settings/`. ISS-04 còn cần credential Oracle để lưu connection
  vào `~/.dbtools`. Nội dung JSON hoàn chỉnh nằm ở [ISS-05](#iss-05).

**Hoãn theo yêu cầu**

- **ISS-01**, **ISS-02** — runbook hồi sinh tunnel + Vercel chưa chạy.

### 2026-10-07 — lập sổ

Khởi tạo từ phiên kiểm thử MCP và rà soát deployment. 13 issue, trong đó ISS-01, ISS-02,
ISS-09 và phần "không có sync DB" của ISS-11 là phát hiện mới; ISS-13 gom các vấn đề đã
biết từ `deployment.md`.
