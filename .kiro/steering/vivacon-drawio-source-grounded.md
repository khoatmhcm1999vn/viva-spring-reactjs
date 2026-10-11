---
inclusion: always
---

# Vivacon — Source-grounded diagrams and draw.io steering

> Kiro Steering for repository `khoatmhcm1999vn/viva-spring-reactjs`, branch `feature/ai-assisted-dev-setup`. This document supplements existing `.kiro/steering/{product,structure,tech,deployment,database-efficiency,sql-query-style}.md`; **do not overwrite** them. Use the current checked-out source as the ultimate authority, not this snapshot.

## Mission

When asked to generate, revise, explain, or export diagrams, produce **native, editable `.drawio` / diagrams.net XML** (not a raster image pasted into a diagram) and make every technical assertion traceable to real files. Existing diagram assets must be maintained, not casually regenerated or replaced. Diagrams must be readable, well laid out, and useful for engineering + BA reviews.

## Confirmed repository orientation (checked on branch `feature/ai-assisted-dev-setup`)

- Backend: Java 11, Spring Boot 2.5.2, Maven, application root `src/main/java/com/vivacon/`; packages `controller/`, `service/` and `service/impl/`, `repository/`, `dao/` and `dao/impl/`, `entity/`, `dto/`, `mapper/`, `event/`, `security/`, `configuration/`.
- Frontend: React 17 application under `frontend/src/`, with `api/`, `components/`, `hooks/`, `globalSocketState/`, `routes/`, `App.js`. Consult current source before naming concrete modules.
- Database: PostgreSQL 14; JPA mappings under `src/main/java/com/vivacon/entity/`; schema SQL `container/prepare/schema/schema.sql`; procedure sources `container/prepare/functions/`; local environment may evolve under Hibernate schema updates. **Do not treat JPA or schema SQL alone as proof of the currently deployed physical database.**
- Existing editable diagrams: `BA Document/docs/diagrams/business-flow.drawio`, `data-model.drawio`, `main-sequence.drawio`, `system-architecture.drawio`.
- Existing diagram validator: `BA Document/docs/diagrams/_validate.ps1`.
- Entity Java files observed include `Account`, `Attachment`, `Comment`, `Conversation`, `DeviceMetadata`, `Following`, `HashTag`, `HashTagRelPost`, `Like`, `Message`, `Notification`, `Participant`, `Post`, `Role`, `Setting`, plus other subpackages. **Entity class names are not verified SQL table names**; inspect each `@Table`, `@Column`, `@JoinColumn`, `@ManyToOne`, `@OneToMany`, `@ManyToMany`, etc.
- Features noted in project Steering: accounts + JWT, posts, follow graph, likes/comments, WebSocket conversations, notifications, moderation, admin statistics, Cloudinary / S3 media, external integrations. Verify concrete edges before drawing them.

## Non-negotiable evidence policy

1. Before drawing, inspect the currently checked-out branch and relevant files. Start with `.kiro/steering/*.md`, `pom.xml`, relevant Java/JS classes, Spring config (redact secrets), schema and procedure SQL, deployment YAML/Compose, and existing `.drawio` files. Never silently substitute assumptions for missing evidence.
2. Classify evidence for **each node and connection**:
   - **Verified**: explicit declaration or usage in source, DDL, config or real inspected database metadata. Record precise path and symbol/line if feasible.
   - **Inferred**: suggested by source usages (e.g. SQL JOIN) but absent as a declared FK or runtime proof. Draw **dashed** and label `INFERRED`.
   - **Proposed**: future-state recommendation; put on a separate `Proposed` page, not inside an as-is system view.
3. If `schema.sql`, JPA annotations and runtime DB disagree, produce a **discrepancy report** showing each source. For actual physical schema, prefer an explicitly approved/current database metadata dump over assumptions; never access production data without authorization.
4. Never invent schema names, SQL table/column names, PK/FK, column types, sequences, index definitions, API URLs, port numbers, deployment nodes, queues, brokers, WebSocket destinations, or service dependencies. Do not assume React → database direct access; show the actual API pathway.
5. Do not include secrets, access tokens, credentials, database passwords, PII, or connection strings with secrets in diagram labels, comments or exports.
6. Preserve existing diagram layouts/pages/IDs as much as possible on update. Back up or use Git diff; ask before destructive replacements. Do not commit/push unless explicitly requested.

## Select diagram by request

| Request | Required output | Ground from |
|---|---|---|
| ERD logical | `data-model.drawio` (logical page) | JPA entities, relationships, domain concepts |
| Physical database / database diagram | `data-model.drawio` (physical page), or `database-physical.drawio` if preserving old file | DDL, JPA mappings, procedures, confirmed DB metadata |
| Solution architecture | `system-architecture.drawio` | React API calls, controllers/services/repos, config, integrations, deployment |
| Business process | `business-flow.drawio` | Frontend flows, controllers/services/events and documented rules |
| Sequence | `main-sequence.drawio` | React service → endpoint → service → repo/event → DB, verified actual methods |
| Focused feature | `docs/diagrams/<feature-name>.drawio` within existing docs location | Narrow source slice, cited |

**Canonical diagram directory:** `BA Document/docs/diagrams/` (note the space in `BA Document`). Reuse current convention. Do not create an unrelated `docs/architecture/` for draw.io without user request. Mermaid `.mmd` may coexist as source for simpler diagrams but must not replace editable draw.io output when draw.io was requested.

## ERD and database-specific rules

- Examine `@Entity`, `@Table`, `@Id`, `@GeneratedValue`, `@SequenceGenerator`, `@Column`, `@JoinColumn`, `@JoinTable`, `mappedBy`, nullable/unique declarations; compare with SQL `CREATE TABLE`, `ALTER TABLE`, constraints and indexes. For every table, show **actual table name**, columns, SQL type (if known), PK, FK, nullability, relevant unique/index constraints. Unconfirmed properties go to notes, not invented labels.
- Resolve Java-to-SQL name mapping explicitly, including Hibernate naming strategies; do not assume class name equals table name. Highlight mismatches between JPA and SQL.
- Use crow's-foot connectors for verified cardinality and optionality; many-to-many requires join entity/table when confirmed. A `@ManyToOne` does not alone prove DB-level foreign key constraint exists.
- Logical ERD and physical schema belong on **separate pages**: one readable domain overview, one detail view split by domain (`Account/Auth`, `Posts/Engagement`, `Messaging/Notifications`, `Moderation`, as evidenced). Avoid showing 50 columns on a system-level architecture page.
- PostgreSQL procedures under `container/prepare/functions/` may create read dependencies not modeled as FK. Show these on an optional `Data Access / Stored Procedures` page, **not** as relational FK arrows.
- Mark soft-delete/audit fields when verified in inherited entity mapping; do not claim database cascade from application soft-delete behavior.
- When only static source is available, caption the physical diagram `DDL/JPA-derived (not live DB verified)`.

## Architecture and sequence rules

- Partition by UI (React), transport (HTTP/REST, WebSocket/STOMP), Spring MVC/security/controller, service/business rules, persistence (JPA repositories / DAOs), PostgreSQL, events/notifications, external providers and runtime infrastructure.
- Show *only actual* documented/authenticated JWT/refresh, CORS, WebSocket routing, media providers, and external APIs from source/config. Mark conditional providers and environment-specific integrations as such.
- For a flow, select a real frontend `frontend/src/api/*Service.js` method and trace to its corresponding `@RequestMapping`/method-level mapping, service impl, DAO/repository/entity, and event listener if any. If mapping cannot be resolved, label it `Unresolved`, never create a fictional endpoint.
- Distinguish synchronous request/response arrows (solid) from asynchronous event/WebSocket arrows (dashed) and storage links (clearly labeled). Annotate protocol/event name when verified.
- Create one overview and smaller feature views, rather than a single gigantic unreadable diagram.

## draw.io native XML contract

- Deliver an uncompressed `mxfile` with one or more named `<diagram>` nodes containing `mxGraphModel/root/mxCell` structure. Native shapes and native `mxCell` edges must be separately editable in app.diagrams.net. Do not embed an SVG or PNG as the only content.
- Every cell must have a unique ID. Root cells (`id="0"`, layer `id="1"`), valid `parent`, `source`/`target` references, and `mxGeometry` elements must be consistent. Escape XML entities (`&`, `<`, `>`, quotes) correctly.
- Use table/entity-style shapes where appropriate. Prefer stable IDs for existing cells to minimize noisy diffs. Label crow's-foot relationships and FK column references as verified.
- Prefer 4–7 thematic colors with strong contrast: UI blue, application cyan, persistence green, messaging orange, external purple, supporting context neutral gray; do not use color as the only signal of uncertainty.
- Grid-aligned layout, consistent padding, unclipped text, minimal edge crossings, orthogonal routing when practical. Group by logical domains using swimlanes/containers. Keep diagrams readable at 100% zoom; split into pages where necessary.
- Add a small legend and provenance note: `Source: branch/commit, generated date, verified/inferred/proposed semantics, main files inspected`. Never claim freshness beyond the files actually examined.

## MCP workflow: source-grounded, editable, validated

1. Determine requested diagram type + feature scope. Read sources and existing `.drawio` XML first.
2. Produce a concise **evidence inventory** (`element | mapped source | verified/inferred | notes`) and a diagram plan. Identify unresolved facts rather than guessing.
3. If draw.io MCP is connected, use the available tools to construct and edit native diagrams. MCP tool availability and abilities vary; **do not assume that opening a diagram in browser automatically saves a local `.drawio` file**. When needed, write valid editable XML to the intended workspace path using Kiro file-writing tools.
4. Use the preexisting files in `BA Document/docs/diagrams/`; preserve user manual edits. For major restructures make a new page/file and propose a review before replacement.
5. Validate XML and references with the existing validator, then open the `.drawio` file in https://app.diagrams.net/ or compatible IDE editor and verify the geometry + editability visually.
6. If validator raises overlaps because intentional nested shape containment was used, investigate manually; do not disable or bypass the check silently.
7. Report generated files, source paths consulted, unknowns, validator result, and a concise Git diff summary. Do not commit or push without request.

### Validation on Windows / PowerShell

```powershell
# From repository root (PowerShell 7+ when using pwsh)
pwsh -File "BA Document/docs/diagrams/_validate.ps1"

# Inspect changes before accepting
git diff -- "BA Document/docs/diagrams"
```

If `pwsh` is unavailable but Windows PowerShell exists, use `powershell -File "BA Document/docs/diagrams/_validate.ps1"` if compatible. If validation returns errors, fix them before announcing completion.

## Sharing and round-trip editing

1. Open https://app.diagrams.net/ → **File → Open from → Device** → select the actual `.drawio` file, or select the supported cloud storage provider.
2. Confirm table columns, shapes, lines, page names and connections can be individually selected/edited; a flattened image is not acceptable.
3. To collaborate, save the *native* `.drawio` to an appropriately permissioned shared location (e.g. Google Drive), and share access there. A local file/URL alone does not create shared editing permissions. If storing a revised file in Git, use a pull request for version review and manage simultaneous edits carefully.
4. When returning from diagrams.net to Kiro, save the updated `.drawio` back under `BA Document/docs/diagrams/`, re-read its current XML before making any new changes.

## Kiro prompt template: architecture and schema generation

> Read `.kiro/steering/vivacon-drawio-source-grounded.md` and all existing project steering. Inspect the **current checked-out Vivacon repository**, including frontend requests, controller mapping, service implementations, repositories/DAOs, JPA entities, `container/prepare/schema/schema.sql`, stored procedures and currently existing diagrams. Generate or update **native editable draw.io XML** in `BA Document/docs/diagrams/` for: **[DIAGRAM TYPE]**, scope **[FEATURE / MODULE]**. For each node, table, field and edge, require a concrete source reference. Separate verified, inferred and proposed relationships; never invent missing details. Preserve existing user-edited shapes unless changes are necessary. Create logical and physical ERD pages separately where relevant. Validate with `_validate.ps1`, confirm diagrams.net editability, and report evidence, uncertainties, changed files and Git diff. **Do not commit or push.**

### Example requests

- `Generate a source-grounded logical + physical ERD for Vivacon post/like/comment/hashtag models, with physical types and FKs only when supported by schema/annotations. Update the draw.io file without destroying existing diagrams.`
- `Trace login and JWT refresh from React service to Spring security + DB; draw an as-is native draw.io sequence with real endpoints and method names.`
- `Update system-architecture.drawio using actual React, REST, STOMP, Spring services, PostgreSQL and verified third-party integrations, with an evidence legend.`

## Acceptance checklist

- [ ] Current branch/source examined; relevant existing diagrams opened before modifications.
- [ ] Actual editable `.drawio` XML exists at the correct repository location.
- [ ] No invented entities, columns, FK, endpoints, integrations, or deploy nodes.
- [ ] Verified vs inferred vs proposed visually differentiated and documented.
- [ ] Logical vs physical data models clearly distinguished.
- [ ] XML/cell references valid and `_validate.ps1` reports no unresolved errors.
- [ ] Viewed in diagrams.net/editor; shapes/text/edges individually editable.
- [ ] Existing manual edits preserved, evidence/uncertainty/diff reported, no secrets or unexpected commits.
