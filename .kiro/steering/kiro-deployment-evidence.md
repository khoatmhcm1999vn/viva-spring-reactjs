---
inclusion: always
---
# Vivacon — Source-grounded Deployment & Milestone Rules

## Scope and deployment target
Repository: `khoatmhcm1999vn/viva-spring-reactjs`
Branch: `feature/ai-assisted-dev-setup`
Target: Vercel (React SPA) -> HTTPS/WebSocket endpoint (Cloudflare Tunnel or validated alternative) -> Ubuntu VM (Spring Boot Docker) -> Supabase PostgreSQL via session pooler / TLS.

## Non-negotiable evidence policy
- NEVER claim **deployed**, **healthy**, **tested**, **completed** or **production-ready** from source presence alone.
- Classify every claim as:
  - `SOURCE_VERIFIED`: confirmed by inspected repository path plus line/config reference.
  - `HISTORICALLY_REPORTED`: described in existing deployment.md or historical logs; not a fresh live test.
  - `RUNTIME_VERIFIED`: directly observed from a command, log, CI job, HTTP probe or platform panel with timestamp.
  - `UNVERIFIED`: no adequate evidence.
  - `BLOCKED`: a demonstrated blocker exists.
- Record git commit SHA, branch, environment, UTC timestamp, command/test, sanitized output, evidence path, owner and next action.
- Do not infer VM availability, public URL health, Supabase connectivity or successful authentication without runtime proof.
- Distinguish **planned architecture**, **configuration in repo**, **past deployment**, and **current live state**.
- Do not fabricate logs, test outcomes, schema object counts or endpoint responses.
- Never expose `.env`, secrets, JWTs, passwords or connection strings in evidence.
- Existing `.kiro/steering/deployment.md` reports completed deployment historically; verify it instead of overwriting it.

## Authoritative inspection order
1. `git status`, `git rev-parse HEAD`, branch; read `.kiro/steering/{product,tech,structure,deployment}.md`.
2. Frontend: `frontend/package.json`, `frontend/vercel.json`, `frontend/.env.production`, `frontend/src/api/axiosConfig.js`, socket-related hooks and services; verify actual paths.
3. Backend: `Dockerfile`, `docker-compose.yml`, `docker-compose.override.yml`, `src/main/resources/application-prod.yml`, security/CORS/WebSocket config, controllers, `/actuator/health`.
4. Database: `container/prepare/schema/schema.sql`, `container/prepare/functions/*.sql`, JPA entities, DAO calls; compare with Supabase live metadata only with authorized read-only access.
5. Infrastructure/runtime: Vercel dashboard/build logs, VM `docker compose ps`, `docker logs`, health checks, tunnel/DNS/TLS, PostgreSQL safe connection test.
6. Write findings into `docs/deployment/MILESTONES.md` and `docs/deployment/RELEASE_EVIDENCE.md` citing exact artifact/commit and timestamp.

## Repo-specific facts to VERIFY for current commit
- Spring Boot 2.5.2 / Java 11 backend; React 17 frontend; Vercel config uses CRA output `build`.
- Frontend `package.json` currently specifies Node `22.x` for Vercel.
- `application-prod.yml` has `ddl-auto: update`: flag as production schema-change risk; do not auto-migrate without backup/approval.
- Prod JDBC supports Supabase session pooler using `sslmode=require`, but ENV overrides decide real connection.
- `FRONTEND_ALLOWED_ORIGINS` gates CORS/SockJS; verify real Vercel origin.
- Base Compose still declares `db` and `frontend`; do not mistake it for a backend-only production deployment.
- Deployment notes report Vercel + VM + Supabase via Cloudflare Tunnel; consider this **historically reported** until rechecked.

## Mandatory stop conditions
Stop and request confirmation before changing DNS, Vercel settings, Supabase schema, production secrets, firewall rules or deployment state.
Do not automatically execute destructive SQL, recreate volumes, alter `ddl-auto`, rotate credentials, or deploy images.
Never run `docker compose up` against production using `docker-compose.override.yml`.

## Diagram and release sync
When deployment topology changes, update source-grounded draw.io diagrams, deployment docs, milestone statuses, and rollback plan together.
Include deployment evidence in a Markdown table with source ref and runtime ref as separate columns.
