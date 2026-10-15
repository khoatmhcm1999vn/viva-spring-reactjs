# Vivacon

Instagram-style social network: Spring Boot 2.5.2 (Java 11) REST + STOMP/WebSocket
backend in `src/`, React 17 CRA SPA in `frontend/`, PostgreSQL 14. Academic/portfolio
project. Roles: `USER`, `ADMIN`, `SUPER_ADMIN` (frontend routes admins to the dashboard).

Features: JWT auth with refresh tokens and email verification, image posts (Cloudinary /
AWS S3), follow graph + newsfeed + friend recommendation, likes, nested comments,
STOMP chat and notifications, user reports with admin moderation, admin statistics
backed by PostgreSQL stored functions, i18n (en / vi).

## Ground rules

- **Read the source before stating anything about it.** Never invent tables, columns,
  endpoints, services, queues or infrastructure. If something cannot be verified from the
  repo, say so instead of guessing.
- **Ask first** before: deploying anything, running SQL that writes or changes schema
  (including `DROP SCHEMA`, dump restores, `ddl-auto` side effects against a shared DB),
  installing dependencies or toolchains (`npm install`, `brew install`, Maven downloads,
  `docker pull`), `docker compose up/down`, committing, or pushing.
- **Never commit secrets.** Real values live in the gitignored `.env` and `config/`. Note
  that `frontend/.env.development` is tracked and already contains third-party keys; do
  not add more. Credentials in git history still need rotating.
- `.kiro/` is preserved for Kiro users. Do not edit or delete it; Claude Code config is in
  this file and `.claude/`. If `.kiro/steering/*` and source disagree, the source wins.

## Layout

```
src/main/java/com/vivacon/   Spring Boot backend (layered: controller/service/repository/dao/entity/dto/...)
src/main/resources/          application.yml (selects profile), application-{dev,prod}.yml, logback-spring.xml
frontend/                    React SPA (CRA, not ejected), nginx image + vercel.json
container/prepare/           schema.sql, stored functions, init-db.sh
mock_data/                   data.sql + seed word lists for common/data_generator
postman_collection/          per-feature API collections
docker-compose*.yml          base (deploy-safe), override (dev ports + Adminer), tunnel (opt-in)
GeoLite2-City.mmdb           MaxMind DB, read relative to the process working directory
```

## Commands (macOS, from repo root)

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 11)   # JDK 11 required
sh mvnw spring-boot:run        # dev profile, :8090  (mvnw is not executable in git; use `sh`)
sh mvnw clean package          # jar -> target/Vivacon-0.0.1-SNAPSHOT.jar
sh mvnw test                   # only a context-load test; needs a reachable Postgres

cd frontend
npm install --force            # never --legacy-peer-deps
npm run start:dev              # :3000, loads .env.development (API at localhost:8090)
npm run build                  # CRA build; REACT_APP_* from the real environment

docker compose up -d           # dev stack: frontend :8081, backend :8091, db :5433, adminer :8901
```

Health: `curl localhost:8090/actuator/health`; Swagger: `http://localhost:8090/swagger-ui/index.html`.

## Rules index

Detailed, path-scoped guidance lives in `.claude/rules/`:

- `local-dev-macos.md`: Apple Silicon setup, ports, toolchain gaps on this Mac
- `backend.md`: Java/Spring conventions (loads for `src/**`, `pom.xml`)
- `frontend.md`: React conventions (loads for `frontend/**`)
- `database.md`: schema sources of truth, stored functions, DB safety
- `deployment.md`: Docker images, compose files, Supabase / Vercel / tunnel
- `diagrams.md`: ERD, Mermaid, C4 and draw.io rules. **Read it before producing any diagram.**

The long-form deployment history (what was measured, on which host) is
`.kiro/steering/deployment.md`; read it on demand, do not restate it.
