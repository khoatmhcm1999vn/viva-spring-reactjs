---
inclusion: always
---

# Tech stack versions, migration and Docker deployment

Mục tiêu: tech stack tương thích, build lặp lại có kiểm soát và chạy ổn định khi deploy bằng Docker. Giữ baseline mặc định; cho phép nâng framework/library/runtime có căn cứ khi người dùng yêu cầu migration hoặc ổn định Docker deployment. Không nâng/hạ chỉ vì có nhãn latest, stable, LTS hoặc recommended. Áp dụng cho Java, Spring Boot/Spring, Maven/Gradle, Node.js, package manager, React, TypeScript, PostgreSQL, Oracle, Docker images, Kiro, MCP servers và plugins.

## 1. Baseline của dự án

- Trước khi thay đổi dependency/runtime, xác định version đang khai báo và version thực tế nếu cần. Dùng metadata đã có; chỉ đọc file liên quan còn thiếu.
- Nguồn baseline gồm manifest/BOM/parent, lockfile, Maven/Gradle wrapper, toolchain, `.nvmrc`/`.node-version`/`engines`, Dockerfile/Compose, CI và tài liệu deployment. Không đoán version từ kiến thức model.
- Phân biệt version được khai báo, resolved trong lockfile/dependency tree và runtime đang chạy. Nếu mâu thuẫn, báo rõ; không âm thầm chọn bản mới nhất để giải quyết.
- Giữ package manager và lockfile hiện có; không tự chuyển npm/yarn/pnpm hoặc Maven/Gradle. Không regenerate lockfile toàn bộ cho một thay đổi nhỏ.

## 2. Quy tắc mặc định: giữ version

- Khi sửa bug, thêm feature, viết query hoặc tài liệu, dùng API/cú pháp tương thích baseline. Không tự migration framework, runtime, database hoặc build tools.
- Không chạy lệnh update/upgrade diện rộng hoặc tự động sửa dependencies như `npm update`, `npm audit fix`, `npm audit fix --force`, `npx ...@latest`, `pnpm up --latest` hay công cụ tương đương, trừ khi yêu cầu đã cho phép phạm vi đó.
- Không tự cài hoặc nâng cấp Kiro, SQLcl, MCP server, plugin hay tool trên máy người dùng. Không thêm cơ chế auto-update hoặc dùng floating version mới vào cấu hình dự án.
- Không thay dependency ranges, BOM, parent version, wrapper hoặc image tag chỉ để “đồng bộ stable”. Không tự ép toàn bộ ranges hiện có thành exact versions trong một task khác.
- Dependency mới chỉ thêm khi cần cho nhiệm vụ. Kiểm tra lựa chọn sẵn có; chọn release cụ thể tương thích baseline, tránh `latest`, `*`, snapshot hoặc tag trôi. Ghi lý do và giữ quy ước manifest/lockfile của dự án.
- Cài lại dependencies phải tôn trọng lockfile và cách build hiện có, như `npm ci` hoặc frozen/immutable install khi phù hợp. Không dùng install như một cách nâng version ngoài ý muốn.
- Gặp API không tương thích, build lỗi hoặc cảnh báo deprecated: tìm cách sửa trong baseline trước. Không coi đó là quyền tự nâng version.
- Gặp security advisory/EOL: xác minh nguồn chính thức, nêu ảnh hưởng và đề xuất cụ thể; chưa tự thay version ngoài phạm vi được yêu cầu. Vẫn tiếp tục phần công việc độc lập có thể làm được.

## 3. Migration khi đã được yêu cầu

- Yêu cầu nâng cấp rõ ràng của người dùng là authorization cho phạm vi tương ứng; không hỏi lại những gì đã được cho phép.
- Khi người dùng yêu cầu chuẩn hóa/nâng tech stack để Docker deploy ổn định, được chỉnh source/config và nâng các dependency/runtime liên quan nếu có bằng chứng baseline không đáp ứng compatibility, support hoặc yêu cầu vận hành. Nêu lý do và source -> target; ưu tiên thay đổi nhỏ nhất giải quyết được vấn đề. Không hiểu yêu cầu này thành nâng mọi thành phần lên bản mới nhất.
- Nếu người dùng chỉ yêu cầu “lên stable/LTS”, tra release/support chính thức tại thời điểm làm việc, xác định target cụ thể và ghi rõ lựa chọn. Không dựa vào nhãn mutable hoặc trí nhớ để chọn version.
- Xác định source -> target, mục tiêu và phạm vi: patch/minor/major, runtime, framework, dependencies, build, CI, container và deployment bị ảnh hưởng.
- Kiểm tra release notes, migration guide, support matrix, security advisory và compatibility từ nhà cung cấp chính thức. Gắn link/version/ngày khi báo cáo; phân biệt breaking change với khuyến nghị tùy chọn.
- Nâng theo thứ tự tương thích; dùng bước trung gian nếu guide yêu cầu. Không mở rộng nâng cấp sang các thành phần độc lập chỉ để cùng mới.
- Chỉ sửa version/config/code cần cho target; giữ diff dễ review và lockfile changes có giải thích. Không chạy formatter hoặc rewrite diện rộng ngoài nhu cầu migration.
- Xác định cách khôi phục trước khi thay đổi môi trường/dữ liệu. Migration source code không mặc định cho phép deploy, nâng database server hoặc chạy destructive schema migration.

## 4. Ràng buộc theo stack

- **Spring Boot/Java:** giữ parent/BOM và dependency management đang dùng; không override version Spring components riêng lẻ nếu chưa có lý do compatibility. Khi migration, kiểm tra Java baseline, build tool, plugins, Spring ecosystem và thay đổi namespace/API nếu có theo guide target.
- **Node.js:** kiểm tra runtime của local, CI và container; package manager và native modules phải tương thích. Không nâng Node chỉ vì một lệnh cài báo engine warning.
- **React/TypeScript:** giữ bộ React/React DOM và type packages tương thích; kiểm tra framework/bundler, router và test tooling liên quan. Không tự đổi kiến trúc rendering hoặc framework để giải quyết upgrade.
- **PostgreSQL/Oracle:** phân biệt driver/client, ORM, server version và schema migration. Upgrade driver không đồng nghĩa upgrade server. Major server upgrade cần quy trình riêng về extension, backup/restore hoặc công cụ upgrade phù hợp; chưa có authorization thì không thực hiện.
- **Kiro/MCP/SQLcl:** xác định version/config được task sử dụng; giữ nguyên ngoài phạm vi migration. Với Docker MCP images, đề xuất tag/digest đã kiểm chứng thay cho tag trôi; không bịa tag và không tự repin trong task không liên quan.

## 5. Docker build và deployment

- Trước khi thiết kế deploy, xác định target OS/CPU architecture, Docker/Compose version, services, ports, environment, storage và baseline hiện có. Dùng mặc định ghi rõ cho phần có thể chuẩn bị; chỉ hỏi dữ kiện chặn bước phụ thuộc.
- Chọn bộ version tương thích từ tài liệu chính thức: framework/runtime, build tool, package manager, driver/server và base image. Một version mang nhãn stable/LTS không tự chứng minh cả stack tương thích.
- Dùng image từ nguồn được tin cậy; version tag cụ thể, pin digest đã xác minh khi cần artifact bất biến. Tag version vẫn có thể thay đổi; không bịa digest/tag. Cập nhật pin có kiểm soát và kiểm chứng lại, không đóng băng image vô thời hạn.
- Dùng multi-stage build khi có lợi; build bằng wrapper/lockfile của dự án; runtime image chỉ chứa artifact và dependencies cần chạy. Khớp Java bytecode/runtime, Node native modules/libc và CPU architecture; không mặc định Alpine luôn phù hợp.
- Tạo `.dockerignore` phù hợp; không đưa secrets, Git history hoặc build artifacts local không cần thiết vào build context. Không COPY node_modules của host vào Linux image hoặc nhúng credentials qua ARG/ENV/layer.
- Giữ cấu hình theo môi trường; cung cấp `.env.example` không có secret. Dùng runtime secret/config mechanism phù hợp; ứng dụng phải hỗ trợ cách đọc secret đó. Compose secrets không tự thay mọi biến môi trường và không thay thế bảo vệ secret file trên host.
- Kết nối service qua DNS service name và container port; không dùng localhost cho database ở container khác. Chỉ publish port cần truy cập từ host/bên ngoài; cấu hình binding theo target.
- Tách frontend build-time config với backend runtime config. Với React static build, không giả định đổi environment lúc container start sẽ thay bundle; secrets không được đưa vào client bundle.
- Thiết kế healthcheck kiểm tra đúng readiness, dùng command thực sự có trong runtime image. Với Compose, dùng depends_on condition: service_healthy khi cần chờ dependency; thứ tự start không bảo đảm readiness. Ứng dụng vẫn cần retry/reconnect khi dependency gián đoạn sau startup.
- Chạy non-root nếu image/app hỗ trợ; thiết lập writable paths, resource limits, graceful shutdown và restart policy phù hợp. Healthcheck thất bại không tự bảo đảm container được restart; restart policy không thay cơ chế phục hồi readiness.
- Dữ liệu PostgreSQL/Oracle phải ở persistent storage phù hợp; không xóa volume để “fix” deploy. Không chạy down -v, prune volumes, reset database hoặc ghi đè dữ liệu ngoài yêu cầu rõ ràng.
- Schema migration phải versioned, có thứ tự và kiểm soát concurrent execution; không bật ORM drop/create cho môi trường có dữ liệu cần giữ. Upgrade image database qua major version không được coi là migration data directory an toàn.
- Phân biệt chuẩn bị Dockerfile/Compose, kiểm thử local, push registry và deploy môi trường thật. Chỉ thực hiện phần đã được yêu cầu; không tự deploy production hoặc thay secrets/traffic ngoài phạm vi.
- Giữ image/artifact release trước và cấu hình rollback. Rollback app chỉ hợp lệ khi schema/data còn tương thích; database migration cần kế hoạch khôi phục riêng.

## 6. Kiểm chứng và báo cáo

- Chạy các kiểm tra hiện có phù hợp: dependency resolution, build, typecheck, tests và smoke/integration liên quan. Không tự tạo hàng loạt test chỉ kiểm tra chuỗi version.
- Kiểm tra version thực tế sau thay đổi nếu môi trường cho phép; không kết luận migration thành công chỉ vì manifest đã đổi.
- Với Docker: validate Compose/config mà không để lộ secret; build image; khởi động stack test trong phạm vi được phép; kiểm tra logs, health/readiness, app -> database, API smoke test và restart/persistence phù hợp. Chỉ dùng dữ liệu test; không chạy thử destructive recovery trên dữ liệu thật.
- Image build thành công chưa chứng minh deploy chạy đúng; container running chưa chứng minh app ready. Ghi rõ bước đã chạy, kết quả và bước chưa thể xác minh.
- Không gọi một version là tương thích/được hỗ trợ nếu chưa có bằng chứng. Không tuyên bố đã chạy test khi chỉ review tĩnh; nói rõ kiểm tra chưa chạy hoặc môi trường còn thiếu.
- Nếu cần thay đổi version ngoài phạm vi mới hoàn thành được nhiệm vụ, trình bày chỗ bị chặn, source -> target đề xuất và lý do; tiếp tục phần độc lập, xin quyết định chỉ cho thay đổi ngoài phạm vi đó.
- Báo cáo ngắn: version trước/sau, lý do, compatibility/breaking changes chính, kiểm chứng và giới hạn còn lại. Chỉ đưa nâng cấp vào diff khi thuộc phạm vi migration hoặc ổn định deployment đã được yêu cầu.

## 7. Nguồn Docker chính thức

Đối chiếu 08/10/2026; khi chọn version thực tế phải kiểm tra thêm release/support matrix của từng nhà cung cấp.

- Image/build/pinning: https://docs.docker.com/build/building/best-practices/
- Compose startup/readiness: https://docs.docker.com/compose/how-tos/startup-order/
- Compose secrets: https://docs.docker.com/compose/how-tos/use-secrets/
- Compose production: https://docs.docker.com/compose/how-tos/production/
