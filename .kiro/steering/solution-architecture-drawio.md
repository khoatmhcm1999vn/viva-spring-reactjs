---
inclusion: manual
---

# Solution architecture, business analysis và draw.io từ source code

Áp dụng khi được yêu cầu phân tích source, viết tài liệu hệ thống/nghiệp vụ, requirements, user stories hoặc vẽ sơ đồ. Mục tiêu: người mới hiểu hệ thống phục vụ ai, giải quyết nghiệp vụ gì, thành phần nào chịu trách nhiệm, luồng chạy ra sao và bằng chứng ở đâu trong project. Tạo tài liệu và file `.drawio` có thể chỉnh sửa theo phạm vi; không chỉ mô tả sơ đồ bằng lời. Yêu cầu nghiệp vụ gốc không thể được xác nhận chỉ bằng reverse engineering source code.

## 1. Ngữ cảnh, phạm vi và nguồn

- Đọc hướng dẫn dự án áp dụng và steering liên quan trong `.kiro/steering/`, đặc biệt `product.md`, `tech.md`, `structure.md`, `deployment.md` nếu tồn tại. Đọc `tech-stack-version-policy.md` và `database-efficiency.md` khi nhiệm vụ tương ứng cần chúng. Không giả định một file manual đã được nạp hoặc tự tạo thông tin còn thiếu.
- Tôn trọng baseline framework/library/runtime; nhiệm vụ viết tài liệu không cho phép nâng version, sửa nghiệp vụ, cài plugin hoặc deploy.
- Tìm README, manifest/BOM/lockfile, entrypoints, cấu hình runtime/profiles, Dockerfile/Compose, CI và tài liệu/diagram đã có. Dùng tìm kiếm và đọc có mục tiêu; bỏ qua generated files, dependencies vendored, build output và log lớn trừ khi cần bằng chứng cụ thể.
- Chốt scope hợp lý từ yêu cầu: toàn hệ thống hay một module/use case; As-is hay To-be; môi trường nào; đối tượng đọc. Nếu thiếu chi tiết có thể giả định, ghi giả định và tiếp tục phần độc lập, không hỏi lại nền tảng đã biết.
- Source/config là bằng chứng triển khai; steering/docs là mô tả ý định và quy ước. Khi mâu thuẫn, ghi hai nguồn và phạm vi môi trường; không âm thầm coi tài liệu hoặc source không active là sự thật runtime.
- Không đưa mật khẩu, tokens, URI chứa credentials, thông tin khách hàng hoặc production endpoints nhạy cảm vào tài liệu/sơ đồ. Dùng tên service và placeholder có nghĩa.

## 2. Mapping sát project

- Lập bản đồ module/package/service theo repository thực tế. Một thư mục/module Java không tự chứng minh là microservice; cần bằng chứng entrypoint/build/deploy độc lập.
- Xác định giao diện vào: frontend routes/screens, HTTP endpoints, scheduled jobs, consumers hoặc CLI. Trace luồng chính tới service/use case, repository/query, data store và external adapter.
- Đối chiếu authentication/authorization, transaction boundary, validation và error handling khi liên quan. Chỉ nêu retry, queue, cache, gateway, load balancer hoặc HA nếu có nguồn hỗ trợ; thiếu thì ghi chưa xác minh.
- Xác định công nghệ/version từ manifest, lockfile, BOM, container và runtime evidence; phân biệt declared/resolved/running. Không gắn version trên diagram nếu chỉ đoán.
- Mỗi node và edge nghiệp vụ quan trọng cần evidence ID trong bảng mapping: ID | diagram/page | tên thành phần hoặc quan hệ | trách nhiệm | file + symbol/config key | trạng thái bằng chứng.
- Dẫn path tương đối repository để tài liệu dùng được trên máy khác; có symbol/route/config key. Chỉ ghi số dòng khi đã kiểm tra revision hiện tại; không bịa line number.
- Phân loại `Observed` (thấy trong source/config), `Runtime verified` (đã kiểm tra môi trường cụ thể), `Inferred` (suy luận có căn cứ), `Unknown`, `Proposed`. Không dùng confidence để biến suy luận thành fact.
- As-is và To-be nằm ở page/section riêng. Đề xuất kiến trúc phải ghi rõ, có mục tiêu và tradeoff; không vẽ một thành phần đề xuất như đã tồn tại.

## 3. Góc nhìn kiến trúc — chỉ tạo những gì cần

- **Context:** người dùng/hệ thống ngoài, system boundary và quan hệ chính; tránh class/table chi tiết.
- **Container/application:** các ứng dụng, API, worker và data stores cùng trách nhiệm, công nghệ, giao tiếp. “Container” trong C4 là đơn vị ứng dụng/data store, không mặc định là Docker container.
- **Component:** chỉ zoom vào một ứng dụng/module cần giải thích; map controller/service/repository/adapter thực tế. Không liệt kê mọi class như một sơ đồ kiến trúc.
- **Runtime/business flow:** chọn luồng tiêu biểu từ source, đánh số bước; chỉ rõ request, response, async/event và nhánh lỗi quan trọng. Dùng sequence hoặc flow với legend phù hợp.
- **Deployment:** host/container/network, ports, config, persistent volumes và ingress theo Docker/CI/deploy config đã thấy. Phân biệt mô hình khai báo với môi trường đã chạy; không mặc định cloud provider hay production topology.
- **Data/ERD:** chỉ tạo nếu nhiệm vụ cần; keys/cardinality theo migration/DDL/entity mapping đã kiểm tra. Quan hệ suy ra từ tên cột phải ghi logical/inferred, không vẽ thành FK đã xác nhận.
- Với task toàn hệ thống, bắt đầu Context + Container/application; thêm flow hoặc deployment nếu giúp trả lời yêu cầu. Không bắt buộc sinh toàn bộ loại diagram cho task nhỏ.
- Khi phạm vi thiên về nghiệp vụ, bắt đầu actor/capability/use case, functional requirements và user stories; bổ sung sequence của luồng chính. Không thay bộ tài liệu nghiệp vụ bằng C4 hoặc danh sách API.

## 4. Tài liệu dễ hiểu

- Viết tiếng Việt rõ ràng; giữ identifier, route và tên công nghệ đúng source. Giải thích viết tắt khi xuất hiện lần đầu.
- Trình bày: mục tiêu/phạm vi -> tổng quan nghiệp vụ -> tech stack -> trách nhiệm thành phần -> luồng chính -> data/deployment liên quan -> bằng chứng, giới hạn và vấn đề mở.
- Với mỗi diagram: tên, mục đích, scope/môi trường, cách đọc ngắn, legend và kết luận có ích. Không dùng hình thay cho giải thích hoặc bảng mapping.
- Mô tả trách nhiệm bằng động từ cụ thể: nhận yêu cầu, kiểm tra quyền, xử lý use case, ghi dữ liệu; tránh nhãn chung chung “xử lý logic” cho mọi node.
- Tài liệu As-is nêu vấn đề có bằng chứng; To-be mới nêu cải tiến và tradeoff. Không tự tạo SLA, capacity, security guarantee hoặc khả năng scale chưa được kiểm tra.
- Dùng Markdown làm mặc định. Giữ naming/style và vị trí docs/diagrams hiện có; không tự thêm HTML/PDF/Word nếu không được yêu cầu.

## 5. draw.io native và bố cục

- Ưu tiên file `.drawio` XML native, với shapes/connectors/text có thể chỉnh sửa riêng. Không giao ảnh raster nhúng hoặc Mermaid code như thay thế cho file draw.io được yêu cầu.
- Dùng cấu trúc `mxfile` -> `diagram` -> `mxGraphModel` -> `root`; XML không nén để dễ diff. Mỗi page có tên rõ, ID ổn định; IDs không trùng trong page, parent/source/target references hợp lệ; có geometry cho node và edge.
- Escape XML attributes và HTML labels đúng cách; giữ tiếng Việt UTF-8. Dùng shapes chuẩn, không phụ thuộc custom stencil/plugin/font/icon từ mạng để mở được sơ đồ.
- Với file hiện có, bảo toàn page/layout/ngôn ngữ và style có ích; sửa vùng liên quan. Không regenerate toàn bộ diagram khiến mất chỉnh sửa tay nếu không cần.
- Mỗi page một góc nhìn/độ chi tiết; nhắm khoảng 6–15 node chính cho overview. Nếu quá rối, chia page và dùng ID tham chiếu thay vì thu nhỏ chữ.
- Flow mặc định trái -> phải, hoặc trên -> dưới nếu use case phù hợp. Căn theo grid, cùng loại node cùng kích thước, khoảng cách đều; đủ padding cho nhãn và connector.
- Gợi ý thiết kế: nền trắng, text `#0F172A`; actor/external xám nhạt, application xanh nhạt, data store xanh lá nhạt, proposed/unknown vàng nhạt. Tối đa 4–5 màu vai trò; legend giải thích cả màu và nét, không chỉ dựa vào màu.
- Font thông dụng sans-serif, nội dung khoảng 14–16 px, tiêu đề khoảng 20–24 px; tăng box theo nội dung. Nhãn ngắn gồm tên + trách nhiệm hoặc công nghệ; chi tiết file/class để ở mapping, không nhồi vào box.
- Dùng boundary/group để phân biệt hệ thống, runtime hoặc network đúng góc nhìn. Boundary không được che node/edge hoặc bị hiểu nhầm thành một service.
- Dùng connector orthogonal, tránh chạy qua node/nhãn, giảm crossing; nhãn mô tả hành động và protocol khi đã xác minh. Mũi tên có chiều rõ, không dùng đường hai đầu cho request/response nếu làm mất ý nghĩa.
- Với application view, quy ước mặc định: nét liền cho call/dependency đã thấy, nét đứt cho async/event đã thấy. Proposed hoặc chưa xác minh có badge/text riêng; không dùng cùng một nét để vừa chỉ async vừa chỉ uncertainty.
- ERD/sequence dùng notation chuyên biệt và legend riêng; không áp máy móc quy ước application view. Không vẽ đường hai chiều chỉ để sơ đồ trông cân đối.
- Có title, scope/môi trường và legend; ngày/revision chỉ ghi khi đã biết. Khổ trang/export đủ lớn, không cắt nội dung. Đẹp phải đi cùng đọc được ở mức zoom thông thường.

## 6. Quy trình tạo và kiểm chứng

1. Inventory có mục tiêu; lập evidence map và danh sách unknowns trước khi chốt quan hệ.
2. Viết outline ngắn và chọn các góc nhìn đủ cho scope; không dừng chờ duyệt outline nếu task đã cho phép tạo tài liệu.
3. Tạo/update Markdown và `.drawio` từ cùng bộ node/edge IDs để tránh hai bản mô tả lệch nhau.
4. Parse XML: cấu trúc, IDs, references, geometry và labels; kiểm tra số page/node/edge, node ngoài canvas, overlap cơ bản. XML parse thành công chưa chứng minh hình đẹp hoặc nghiệp vụ đúng.
5. Đối chiếu các node/edge quan trọng với evidence map; trace ít nhất một luồng chính đủ sâu theo scope. Kiểm tra hướng mũi tên, sync/async, boundary và state Observed/Proposed.
6. Nếu có editor/exporter draw.io được phép sử dụng, mở/render từng page và xem trực quan: clipping, chữ bị tràn, connector chồng nhau, legend, khoảng trắng và tính dễ đọc; sửa rồi kiểm tra lại.
7. Nếu không có renderer/editor, giữ file native và báo `XML validated; visual rendering chưa kiểm chứng`. Không gọi layout hoàn hảo khi chỉ kiểm tra XML và không tự cài tool/plugin chỉ để che giới hạn.
8. Khi cập nhật source, ghi revision/date nếu có và cập nhật mapping liên quan; không đưa log tool hoặc secrets vào deliverable.

## 7. Output và kiểm soát phạm vi

- Ưu tiên vị trí docs/diagrams dự án đã có. Nếu chưa có quy ước, dùng `docs/architecture/architecture.md` và `docs/architecture/diagrams/system-architecture.drawio`; thêm file nhỏ riêng chỉ khi scope cần.
- Với tài liệu nhiều hình, `.drawio` có thể nhiều page; Markdown tham chiếu page names và mapping IDs. Nếu export PNG/SVG được yêu cầu và có công cụ, giữ `.drawio` làm bản chỉnh sửa gốc và nhúng preview phù hợp.
- Không giả định Markdown hiển thị trực tiếp `.drawio`. Nếu chưa có preview, cung cấp link mở/tải và hướng dẫn page cần xem; không tạo link ảnh không tồn tại.
- Không tự gọi database MCP để khám phá toàn schema. Chỉ dùng metadata cần thiết nếu nhiệm vụ và quyền cho phép; source-only analysis phải ghi rõ giới hạn.
- Không cần nhiều agent, đọc toàn repository hoặc tạo tài liệu dài mặc định. Tái sử dụng context/evidence; chỉ đào sâu phần cần giải thích.
- Báo cáo cuối: file đã tạo/sửa, scope, kết luận chính, kiểm chứng thực tế và unknowns còn lại. Không chỉ giao kế hoạch hoặc một đoạn XML để người dùng tự hoàn thành khi môi trường cho phép tạo file.

## 8. Functional requirements và quy tắc nghiệp vụ

- Phân biệt mục tiêu kinh doanh, hành vi hiện có, yêu cầu đã được stakeholder xác nhận và đề xuất. Code cho thấy implementation, không tự chứng minh business intent, mức ưu tiên hoặc approval của stakeholder.
- Lập glossary, actors/roles, capability list và phạm vi in-scope/out-of-scope từ tài liệu/ngữ cảnh đã có. Actor là vai trò bên ngoài system boundary; không mặc định mỗi table/service là actor hoặc một role có quyền chỉ vì xuất hiện trong UI.
- Mỗi FR có ID `FR-xxx`, tên, actor/mục tiêu, trigger, input/output, hành vi quan sát được, điều kiện/validation, nguồn, trạng thái triển khai và trạng thái xác nhận nghiệp vụ. Một requirement phải đủ cụ thể để kiểm tra.
- Với mỗi use case `UC-xxx`, ghi mục tiêu, actors, preconditions, trigger, main success flow đánh số, alternative/error flows trỏ về bước liên quan, postconditions thành công/thất bại, rules và related FR/story.
- Business rule có ID `BR-xxx`; ghi điều kiện, hành động/ràng buộc, dữ liệu áp dụng, nguồn và ngoại lệ. Không coi mọi if statement là một rule nghiệp vụ; tách validation kỹ thuật khỏi domain policy.
- Mô tả status/state transitions nếu domain có lifecycle: trạng thái trước, trigger, điều kiện, trạng thái sau, actor và side effects. Không bịa trạng thái từ tên endpoint hoặc enum không được sử dụng.
- Role/permission matrix map chức năng với quyền được enforce trong backend/config; UI visibility không đủ chứng minh authorization. Missing evidence khác với kết luận không có kiểm soát.
- Với nghiệp vụ banking, chỉ ghi maker/checker, hạn mức, value date, currency, rounding, accounting event, reversal, audit hoặc reconciliation khi có nguồn; phần hợp lý nhưng chưa thấy phải ở questions/proposals.
- Định dạng FR tối thiểu: `ID | actor/goal | hành vi & điều kiện | kết quả quan sát | nguồn | implementation evidence | business confirmation`.

## 9. User stories và acceptance criteria

- Organize theo business capability/epic -> user story, không máy móc một API/controller = một story. Story mô tả giá trị cho actor; technical enabler được gắn nhãn riêng khi cần.
- Mỗi story có ID `US-xxx`, epic, actor, câu chuyện “Là [vai trò], tôi muốn [khả năng], để [giá trị]”, scope, liên kết UC/FR/BR, dependencies và nguồn. Chỉ ghi priority/estimate/owner khi có dữ liệu; nếu đề xuất phải đánh dấu.
- Khi suy ra từ source, ghi `Reverse-engineered draft`; không trình bày như backlog đã duyệt hoặc yêu cầu gốc của người dùng.
- Acceptance criteria có ID `AC-xxx`, viết Given/When/Then hoặc checklist quan sát được; có happy path và negative/boundary cases phù hợp. Chỉ thêm idempotency/concurrency/rollback khi nghiệp vụ liên quan, không áp mặc định mọi story.
- Phân biệt expected requirement với actual implementation; nếu hành vi code có vẻ sai, ghi gap thay vì biến bug thành acceptance criterion đã được chấp thuận.
- Không ép mục tiêu NFR chưa xác nhận vào AC như một cam kết. Không coi acceptance criteria của một story là Definition of Done chung của toàn dự án.

Template story:

```markdown
### US-xxx — [Tên khả năng]
- Epic / Actor: [...]
- Story: Là [...], tôi muốn [...], để [...].
- Scope / Out of scope: [...]
- Related: UC-xxx, FR-xxx, BR-xxx
- Evidence / Business confirmation: [...]
- Implementation status: observed / partial / unknown / proposed

#### AC-xxx — [Kết quả kiểm tra được]
Given [điều kiện và dữ liệu]
When [actor thực hiện hành động]
Then [kết quả quan sát được và side effect cần kiểm tra]

#### Gaps / Questions
- [Điều chưa xác minh hoặc cần stakeholder quyết định]
```

## 10. Non-functional requirements (NFR)

- Tách functional behavior khỏi quality attributes và constraints. Security có cả chức năng kiểm soát lẫn chất lượng; không gom mọi yêu cầu bảo mật thành một nhãn NFR chung.
- Xem xét các khía cạnh phù hợp: performance/capacity, reliability/availability, recovery, security/privacy, usability/accessibility, compatibility, maintainability và operability/observability. Đây là checklist định hướng, không tuyên bố hệ thống đạt chứng nhận hoặc đáp ứng toàn bộ ISO.
- Mỗi `NFR-xxx` nêu scenario, scope/environment, metric, target, cách đo, nguồn, current evidence, gap và trạng thái xác nhận. Thiếu target thì ghi `TBD — cần xác nhận`; có thể đề xuất riêng với lý do, không bịa SLA hoặc số đo.
- Performance cần workload, dataset, concurrency, percentile và cửa sổ đo nếu áp dụng. Timeout trong config không chứng minh response-time SLA; build/test pass không chứng minh throughput.
- Recovery cần phân biệt RTO/RPO mục tiêu với kết quả drill thực tế; volume/backup config không tự chứng minh restore thành công hoặc HA. Transaction annotation không tự chứng minh toàn bộ flow atomic.
- Security/privacy cần scope quyền, dữ liệu, logging/masking, retention và verification phù hợp; mô tả implementation evidence thay vì bảo đảm chung chung “an toàn tuyệt đối”. Không tự suy ra nghĩa vụ pháp lý cụ thể.
- Ma trận tối thiểu: `NFR ID | scenario/scope | metric/target | source/confirmation | implementation evidence | verification method/result | gap`.

## 11. Use case và sequence diagram trong draw.io

- Dùng shapes và connectors native chỉnh sửa được; giữ design system ở mục 5 nhưng ưu tiên notation của diagram. Sequence có lifeline dọc; use case thể hiện actor/goal, không ép flow trái -> phải như một pipeline.
- **Use case diagram:** actor ngoài system boundary, use case bên trong với tên động từ + đối tượng nghiệp vụ; association không dùng như mũi tên thứ tự. Diagram phải đi kèm use case descriptions, không chỉ các oval nối nhau.
- Dùng `«include»` từ use case gọi tới use case được bao gồm; `«extend»` từ use case mở rộng tới use case nền, có điều kiện/extension point khi cần. Không dùng chúng để biểu diễn “bước tiếp theo”; không lạm dụng tách mọi validation thành use case.
- **Sequence diagram:** mỗi page tập trung một UC/scenario, ghi ID; participants/lifelines map actor, UI/API/service/repository/data store hoặc external system có thật. Message theo thứ tự trên -> dưới, dùng activation/return/sync/async nhất quán và có legend.
- Guard/alt/opt/loop/par chỉ thể hiện nhánh, lặp hoặc concurrency có bằng chứng hay được đánh dấu proposed. Không biến một async send thành lời gọi đồng bộ chờ response.
- Giữ notation UML: return/reply nét đứt; phân biệt sync/async bằng arrowhead/label đúng ý nghĩa. Không áp quy ước “nét đứt = async” của application view sang sequence.
- Với happy path và error flow dài, chia page/scenario; cùng participant giữ tên/ID nhất quán. Business sequence có thể coi system là black box; technical sequence mới đi sâu call chain, không trộn hai mức tùy tiện.
- Ưu tiên tên message dễ hiểu, thêm route/method hoặc symbol ở nhãn phụ/mapping. Không khẳng định commit/rollback hoặc transaction boundary nếu source/config chưa chứng minh.

## 12. Traceability, deliverables và kiểm chứng nghiệp vụ

- Dùng IDs ổn định xuyên tài liệu và diagram; quan hệ có thể nhiều-nhiều: `Goal -> Epic/US -> UC/FR/BR -> AC -> source/UI/API/config -> diagram/page -> test/evidence`. NFR liên kết các thành phần/scenario chịu ảnh hưởng. Không ép một-một.
- Nếu scope yêu cầu bộ tài liệu nghiệp vụ và chưa có quy ước, thêm `docs/business/requirements.md`, `docs/business/user-stories.md`, `docs/business/traceability.md` và `docs/business/diagrams/business-analysis.drawio`. Use case/sequence là pages có tên rõ; chia file khi cần. Không sinh mọi file cho một câu hỏi nhỏ.
- requirements.md gồm actors, glossary, scope, FR, use case descriptions, BR, NFR và questions theo nhu cầu. Traceability map tới tài liệu kiến trúc hiện có, tránh sao chép nội dung rồi lệch version.
- Xác minh consistency: actor/permissions, UC flow với sequence, story/AC với FR/BR, labels/IDs giữa diagram và Markdown; kiểm tra negative paths, state changes và output. Không coi một automated test tồn tại là bằng chứng test đã chạy/passed.
- Báo rõ gaps: documented but not found in source; observed but not specified; conflicting evidence; missing target; needs stakeholder validation. Chỉ gọi “không triển khai” khi phạm vi kiểm tra đủ để kết luận.
- Kiểm tra nội dung nghiệp vụ và layout là hai bước riêng; dùng quy trình render/visual QA ở mục 6 cho use case/sequence. Tài liệu reverse-engineered vẫn cần domain review; chưa được xác nhận thì giữ draft, không ngừng tạo deliverable chờ review.

## Nguồn phương pháp và định dạng

Đối chiếu 08/10/2026. Các nguồn này hướng dẫn phương pháp/format, không chứng minh kiến trúc project.

- C4 model, phân cấp góc nhìn: https://c4model.com/introduction
- draw.io, XML diagram source: https://www.drawio.com/docs/manual/advanced/diagram-source-edit/
- Kiro, steering inclusion: https://kiro.dev/docs/steering/
- OMG UML 2.5.1, tham chiếu chuẩn cho use case/interactions: https://www.omg.org/spec/UML/2.5.1
- Agile Alliance, user stories: https://agilealliance.org/glossary/user-stories/
- Agile Alliance, Given/When/Then: https://agilealliance.org/agile101/agile-glossary/
- ISO/IEC 25010:2023, tham chiếu mô hình chất lượng: https://committee.iso.org/standard/78176.html
