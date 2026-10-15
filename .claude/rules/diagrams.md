---
paths:
  - "docs/**"
  - "**/*.mmd"
  - "**/*.drawio"
  - "**/*.drawio.svg"
  - "**/*.drawio.png"
---

# Diagrams: ERD, Mermaid, C4, draw.io

Every element in a diagram must trace to a file in this repo. Before drawing, list the
files read; after drawing, state anything left out or uncertain. Do not draw "typical"
components (caches, queues, gateways, microservices, Kubernetes) that do not exist here.

## ERD

- Build from the JPA entities (`src/main/java/com/vivacon/entity/**`), cross-checked with
  `container/prepare/schema/schema.sql`. Table names come from `@Table(name=...)`; where
  absent (`Setting`, report entities), state the name is Hibernate-derived and verify it
  against a live DB or dump if one is available.
- Relationships from `@ManyToOne` / `@OneToMany` / `@OneToOne` / `@ManyToMany` and
  `@JoinColumn`; cardinality from those annotations and `nullable`, not from intuition.
- Audit columns come from `AuditableEntity` (`created_by_account_id`, `created_at`,
  `last_modified_by_account_id`, `last_modified_at`, `active`); show them once or note them.
- Reports use `@Inheritance(strategy = JOINED)` on `ReportTemplate`: draw a parent table plus
  `AccountReport` / `PostReport` / `CommentReport` subtype tables.
- Mark the 11 tables present in `schema.sql` vs. those created only by Hibernate.
- The three views `month_year`, `quarter_year`, `list_year` are side effects of stored
  functions, not part of the model; exclude them or label them as such.

## Mermaid

- `erDiagram` for ERDs, `sequenceDiagram` for request/STOMP flows, `flowchart` for
  deployment. Use real identifiers (class, table, endpoint, destination names).
- Endpoints come from controller mappings under `Constants.API_V1` (`/api/v1`); STOMP from
  `STOMPMessageBrokerConfiguration` (`/ws`, `/app`, `/conversation`, `/user`, `/topic`) and
  destination constants in `Constants.java`.
- Keep diagrams renderable: no unsupported syntax, quote labels containing special characters.

## C4

Level 1–2 are grounded in these files; go no further than they support.

- **Person**: user, admin (roles `USER`, `ADMIN`, `SUPER_ADMIN`).
- **Containers**: React SPA (nginx image or CRA dev server), Spring Boot API + STOMP
  (`/api/v1`, `/ws`), PostgreSQL (`db` service, or Supabase in the VM deployment),
  Adminer (dev only), `cloudflared` (opt-in).
- **External systems** (verify the calling class before drawing): Cloudinary and AWS S3
  (`configuration/CloudinaryConfiguration`, `S3Configuration`), Microsoft Graph mail
  (`common/utility/MicrosoftOAuth2TokenProvider`, `event/notification_provider/EmailSender`),
  MaxMind GeoLite2 as a **local file**, not a service. Frontend-only: SightEngine image
  moderation and Google Maps (`frontend/src/api/imageModerationService.js`,
  `googleMapService.js`).
- Level 3 components: one per backend package from `.claude/rules/backend.md`; only add finer
  detail after reading the classes.
- Label environments explicitly (local dev / compose / VM + Supabase / planned Vercel);
  never merge planned and live state in one picture without a legend.

## draw.io

- Store sources next to docs as `*.drawio` (or `*.drawio.svg` for embeddable output).
- A project MCP server `drawio` (`@drawio/mcp`, jgraph's official package) is declared in
  `.mcp.json`. It opens diagrams (XML, CSV, Mermaid) in the draw.io editor; it does not write
  repo files. It is only usable after the user approves it in Claude Code; check
  `/mcp` before claiming it is connected. Without it, write draw.io XML or Mermaid directly.
