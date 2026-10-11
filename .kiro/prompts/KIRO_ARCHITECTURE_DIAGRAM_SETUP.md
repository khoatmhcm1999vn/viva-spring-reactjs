# Kiro Architecture Diagram Setup — Mermaid, C4 & Code-Driven Solution Architecture

> **Dùng như thế nào:** Mở repository `khoatmhcm1999vn/viva-spring-reactjs`, checkout branch `feature/ai-assisted-dev-setup` trong Kiro. Mở Kiro Chat với Claude Opus 5.5, đính kèm file Markdown này (hoặc copy toàn bộ phần **PROMPT CHO KIRO**). Yêu cầu Kiro thực hiện ngay trong workspace; review `git diff` trước khi commit.
>
> **Phạm vi:** (1) chuẩn Mermaid và C4 Model, (2) hướng dẫn render SVG/PNG, (3) prompt để Kiro đọc code thực tế rồi vẽ Solution Architecture. **Không tự ý sửa logic nghiệp vụ, không push/commit nếu chưa được yêu cầu.**

## Bối cảnh repository đã xác minh

- GitHub: https://github.com/khoatmhcm1999vn/viva-spring-reactjs/tree/feature/ai-assisted-dev-setup
- Branch: `feature/ai-assisted-dev-setup`.
- Đã thấy `.kiro/steering/` với các file: `database-efficiency.md`, `deployment.md`, `product.md`, `sql-query-style.md`, `structure.md`, `tech.md`.
- Lần kiểm tra trước chưa thấy `.kiro/settings/mcp.json`. Đây **không** phải xác nhận về trạng thái hiện tại của máy local: Kiro phải kiểm tra lại.
- **Giữ nguyên các file có sẵn**; đọc chúng trước khi bổ sung để tránh xung đột.

---

# PROMPT CHO KIRO — COPY TỪ ĐÂY

Bạn đang làm việc trong Kiro IDE với vai trò **Senior Solution Architect, Senior Java/Spring Boot Engineer, React Engineer và Technical BA**. Hãy trực tiếp đọc code trong workspace của repository `viva-spring-reactjs`, branch `feature/ai-assisted-dev-setup`, và triển khai **Diagram as Code**. Không suy diễn kiến trúc từ tên repository hoặc từ prompt này. Mỗi thành phần trong sơ đồ phải có bằng chứng trong source code, config hoặc tài liệu của project. Những gì chưa xác minh phải ghi `Assumption` / `Not verified` và tách khỏi kiến trúc thực tế.

## A. Khảo sát workspace trước khi thay đổi

1. Xác nhận `git status`, current branch, root structure, runtime/tool versions (`node`, `npm`, `npx`) và các package/CLI đã có.
2. Đọc `.kiro/steering/{product,structure,tech,deployment,database-efficiency,sql-query-style}.md` nếu tồn tại. **Không ghi đè hoặc xóa**.
3. Tìm build files `pom.xml`, `build.gradle*`, `package.json`, `docker-compose*.yml`, `Dockerfile`, `.env.example`, manifests, router configs, controllers, services, repositories, database schema/migrations, security filters, event/message handlers, external HTTP clients, frontend API clients.
4. Dùng kết quả từ các file thực tế để dựng bảng chứng cứ `Component | Responsibility | Source files | Connections | Confidence`. Phân biệt observed vs inferred. Không đưa secrets, credentials, hostname nội bộ nhạy cảm vào sơ đồ.
5. Dừng việc tự suy đoán nếu chưa thấy bằng chứng. Khi có nhiều modules, lần theo entry points và quan hệ gọi giữa chúng; không khẳng định tất cả đều được runtime sử dụng chỉ vì có file trong repo.

## B. Những file cần tạo / cập nhật

Chỉ tạo những file chưa tồn tại; nếu đã có thì merge cẩn thận, tuyệt đối không overwrite nội dung do người dùng viết:

```text
.kiro/
  steering/
    architecture-diagrams.md
    c4-model.md
  prompts/
    generate-solution-architecture.md

docs/
  architecture/
    README.md
    architecture-inventory.md
    system-context.mmd
    container-diagram.mmd
    component-diagram.mmd          # Chỉ nếu có đủ bằng chứng
    runtime-sequence.mmd           # Chỉ nếu tìm được luồng thực
  diagrams/
    svg/                        # Generated; optional Git tracking
    png/                        # Generated; optional Git tracking
scripts/
  render-diagrams.mjs
```

**Không tạo sơ đồ minh họa giả rồi trình bày như kiến trúc thực tế của repo.** Nếu chưa đủ dữ liệu, tạo inventory và một skeleton có chú thích rõ `UNVERIFIED` thay vì tự thêm database, queue, AI, microservices hoặc cloud provider.

## C. Steering: `.kiro/steering/architecture-diagrams.md`

Tạo file với front matter của Kiro:

```md
---
inclusion: always
---

# Architecture Diagrams — Project Standards

- Read the repository source and existing steering before drawing.
- Use Mermaid as diagram-as-code for flowcharts, sequence, C4 when supported, ERD and dependency views.
- Use `.drawio` only when editable graphical layouts are needed and the available draw.io tool/editor can actually produce a valid file.
- For Mermaid, ensure source is renderable with the installed Mermaid CLI; do not mix arbitrary draw.io XML with Mermaid.
- Prefer `flowchart LR` for architecture layers, `sequenceDiagram` for runtime calls, `erDiagram` for verified data models, `C4Context`/`C4Container` where the installed Mermaid version supports them.
- Use predictable IDs (letters/numbers/underscores), short labels, visible system boundaries, minimal line crossings.
- Layer order: Users/External Systems -> Entry/UI -> Application/API -> Data/Infrastructure. Draw actual runtime behavior; don't force missing layers.
- Prefer distinct fill/stroke styles: client `#E0F2FE / #0284C7`, service `#DBEAFE / #2563EB`, integration `#FFEDD5 / #EA580C`, storage `#DCFCE7 / #16A34A`, external `#F1F5F9 / #64748B`, AI/processing `#F3E8FF / #9333EA`. Ensure readable dark text and export backgrounds.
- Label edges only with verified protocol/data semantics (HTTP, async event, JDBC, etc.). Dashed arrows indicate inferred / not yet verified relationships only when a legend explains them.
- Separate deployment topology from logical components; separate current-state from proposed-state.
- No passwords, keys, tokens, personal data, internal endpoints or connection strings in generated documentation.
- Source files: `docs/architecture/*.mmd`; output: `docs/diagrams/svg/*.svg` and `docs/diagrams/png/*.png`.
- Validate diagrams by rendering; fix parser errors; keep editable `.mmd` authoritative.
- Always include evidence/source references and an assumptions list.
```

## D. Steering: `.kiro/steering/c4-model.md`

Tạo file:

```md
---
inclusion: always
---

# C4 Model Guidelines

Use the C4 Model to document the **observed as-is architecture**:

1. **Level 1 / System Context:** Person, focal software system, external software systems and verified interactions. No implementation internals.
2. **Level 2 / Container:** Deployable/runnable applications and datastores (e.g. backend process, frontend app, database only if present). "Container" in C4 is **not synonymous with Docker container**.
3. **Level 3 / Component:** Significant components inside **one chosen container**, derived from packages/classes/modules; do not represent each class as a component.
4. **Level 4 / Code (optional):** Only on request or for a sufficiently important code path.

Conventions:
- Give every node a business/technical purpose, not merely a name.
- Label relations with meaningful interactions; add technologies only when supported by repo evidence.
- Mark unavailable evidence and external service ownership explicitly.
- Create separate `AS_IS` and `TO_BE` diagrams if proposing architecture changes.
- Store Mermaid sources for C4 levels under `docs/architecture/`.
- If Mermaid's C4 support in the installed version is missing or unstable, use regular Mermaid flowcharts preserving C4 semantics, and explain the fallback; never label it a verified C4 native render.
```

## E. Prompt: `.kiro/prompts/generate-solution-architecture.md`

Tạo file dưới đây (prompt tái sử dụng trong Kiro Chat):

```md
# Generate Solution Architecture from Code

Analyze this workspace and generate evidence-based architecture documentation. Do not invent a technology or connection. Read existing `.kiro/steering` rules, backend/frontend build files, application entry points, routing, controllers, services, repositories, frontend API clients, docker configuration, database config/migrations, third-party integrations, and security.

Deliver:
1. An evidence inventory: component, role, verified files/symbols, communication path, confidence.
2. `docs/architecture/system-context.mmd` (C4 L1).
3. `docs/architecture/container-diagram.mmd` (C4 L2).
4. `docs/architecture/component-diagram.mmd` (C4 L3 for the best-evidenced core container, if justified).
5. `docs/architecture/runtime-sequence.mmd` for ONE actual end-to-end user/business path with links to code that prove the path (if justified).
6. `docs/architecture/README.md`: current-state summary, diagram index, assumptions, missing evidence, render instructions.
7. Run the Mermaid render script for all diagrams, report PASS/FAIL and repair syntax failures.

Requirements: current state only; no speculative queue/database/cloud/AI; distinguish sync from async; no secret values; clean consistent styling; C4 semantics; avoid connector crossings; no business logic modifications. Explain each relationship with code path evidence. Show `git diff --stat` and changed files. Do not commit or push without confirmation.
```

## F. Hướng dẫn render SVG / PNG

Tạo `scripts/render-diagrams.mjs` sử dụng **Node.js** và package `@mermaid-js/mermaid-cli` qua `npx`, tránh phụ thuộc cài đặt global. Dùng `child_process.spawnSync` (không ghép command string của shell), `readdirSync`, `mkdirSync`, `path.join`; quét tất cả `.mmd` trong `docs/architecture`, xuất 2 định dạng, gom lỗi và exit non-zero nếu bất kỳ file render fail.

**Reference implementation** (Kiro có thể chép hoặc điều chỉnh để phù hợp scripts có sẵn):

```js
import { spawnSync } from 'node:child_process';
import { readdirSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const sourceDir = path.resolve('docs/architecture');
if (!existsSync(sourceDir)) {
  console.error(`Missing directory: ${sourceDir}`);
  process.exit(1);
}
const inputs = readdirSync(sourceDir).filter((f) => f.endsWith('.mmd'));
if (!inputs.length) {
  console.error('No .mmd diagrams found.');
  process.exit(1);
}

const outputs = [
  { ext: 'svg', dir: path.resolve('docs/diagrams/svg') },
  { ext: 'png', dir: path.resolve('docs/diagrams/png') },
];
for (const item of outputs) mkdirSync(item.dir, { recursive: true });

let failed = false;
for (const file of inputs) {
  const src = path.join(sourceDir, file);
  for (const { ext, dir } of outputs) {
    const dest = path.join(dir, file.replace(/\.mmd$/, `.${ext}`));
    // `npx` on Windows is usually npx.cmd.
    const executable = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const args = ['--yes', '--package', '@mermaid-js/mermaid-cli', 'mmdc', '-i', src, '-o', dest, '-b', 'white'];
    const result = spawnSync(executable, args, { stdio: 'inherit', shell: process.platform === 'win32' });
    if (result.status !== 0) {
      console.error(`FAIL ${file} -> ${ext}`);
      failed = true;
    } else {
      console.log(`OK ${dest}`);
    }
  }
}
process.exit(failed ? 1 : 0);
```

**Chú ý:** `npx` có thể cần tải package và Mermaid CLI có thể cần Chromium/Puppeteer khi render. Đảm bảo máy có kết nối mạng lúc cài lần đầu. Trên Windows, kiểm tra thực tế cách `npx.cmd` thực thi; nếu gặp `EINVAL` hãy dùng bản cài local và chạy qua `npm run`, sửa script theo môi trường thay vì khẳng định đã thành công.

Khuyến nghị Kiro bổ sung vào `package.json` **phù hợp** (root hoặc package con hiện hữu) một script `diagram:render` chạy `node scripts/render-diagrams.mjs`, chỉ sau khi đã xác nhận vị trí root chính xác. Không tạo thêm package.json root nếu có cách phù hợp hơn.

Manual CLI:

```bash
npm install --save-dev @mermaid-js/mermaid-cli
npx mmdc -i docs/architecture/system-context.mmd -o docs/diagrams/svg/system-context.svg -b white
npx mmdc -i docs/architecture/system-context.mmd -o docs/diagrams/png/system-context.png -b white
node scripts/render-diagrams.mjs
```

Trong `docs/architecture/README.md`, trình bày cách preview `.mmd` trong editor hoặc mở ảnh SVG/PNG, cách sửa lỗi parser, cách đổi background và cách dùng file `.drawio` nếu dự án có tích hợp.

## G. Kiểm định / Acceptance criteria

- Các Steering hiện có còn nguyên hoặc chỉ thay đổi nếu người dùng đã cho phép.
- Mermaid và C4 có quy tắc rõ ràng, gồm current-state vs proposed-state.
- Mọi sơ đồ vẽ từ code có bảng chứng cứ trỏ tới file/symbol thực tế.
- Tồn tại ít nhất C4 L1 và L2 **nếu code đủ chứng cứ**; L3/sequence tùy mức xác thực.
- `node scripts/render-diagrams.mjs` thực thi thành công với file `.mmd` có thể render; báo lỗi cụ thể khi không thể render.
- Không có passwords/tokens/PII lọt vào output.
- Kiểm tra `git diff`, xuất danh sách file tạo mới, file chỉnh sửa, kết quả validation, phần chưa chắc chắn.
- **Không commit/push** nếu chưa được yêu cầu.

## H. Thứ tự thao tác Kiro cần thực hiện

1. Discover/inspect → 2. Evidence inventory → 3. New Steering → 4. Reusable prompt → 5. Diagram sources → 6. Render CLI/script → 7. Fix diagrams → 8. Document & report diff.

# KẾT THÚC PROMPT CHO KIRO

---

## Cách chạy nhanh (cho người dùng)

1. Mở Kiro IDE tại root project và đảm bảo đang ở `feature/ai-assisted-dev-setup`.
2. Mở file Markdown này, dán từ **PROMPT CHO KIRO — COPY TỪ ĐÂY** đến **KẾT THÚC PROMPT CHO KIRO** vào Kiro Chat / Claude Opus 5.5.
3. Bật quyền đọc file và quyền tạo/sửa file workspace theo nhu cầu; xem kỹ các thay đổi trước khi chấp nhận.
4. Yêu cầu Kiro: **“Execute the complete instructions above, inspect the real source, generate diagrams, render SVG/PNG, then show git diff. Do not commit.”**
5. Khi Kiro chạy xong, mở `docs/architecture/README.md` và các file `.mmd`, `.svg`, `.png` để kiểm tra.

### Nguồn tham khảo

- Kiro Steering: https://kiro.dev/docs/steering/
- Kiro MCP: https://kiro.dev/docs/mcp/
- Mermaid syntax: https://mermaid.js.org/intro/syntax-reference.html
- Mermaid CLI: https://github.com/mermaid-js/mermaid-cli
- C4 Model: https://c4model.com/
- draw.io MCP: https://www.drawio.com/docs/manual/generate/drawio-mcp-server/
