# Local development on macOS (Apple Silicon, arm64)

Primary dev machine: MacBook Air, Apple Silicon (`uname -m` = `arm64`). The Kiro steering
was written on Windows (PowerShell, `E:\` paths, a second Postgres on 5432); none of that
applies here.

## Toolchain state (checked 2026-10-14; re-check, do not assume)

| Tool | Project needs | Found on this Mac |
|---|---|---|
| JDK | 11 (`pom.xml` `java.version`) | Temurin 11.0.32.1 arm64 (`/Library/Java/JavaVirtualMachines/temurin-11.jdk`) |
| Maven | wrapper 3.8.3 via `mvnw` | no global `mvn`; use `sh mvnw` |
| Node | `engines.node` = `22.x` | v24 (npm warns; not enforced) |
| Docker | Compose v2 | Docker Desktop 29.8.2, Compose v5.6.0; CLI at `/Applications/Docker.app/Contents/Resources/bin` (may not be on `PATH`) |
| psql | optional | not on host; use `docker exec vivacon-db psql -U postgres -d vivacon` |

Installing anything else needs the user's approval. Brew casks that run a `.pkg` need
`sudo`, which Claude's shell cannot answer; ask the user to run those themselves.
Select JDK 11 per shell: `export JAVA_HOME=$(/usr/libexec/java_home -v 11)`.

## Full stack in Docker (how it is bootstrapped on this Mac)

- `.env` (gitignored, mode 600) was generated from `.env.example` with random
  `DB_PASSWORD` / `JWT_SECRET_SALT`, and sets
  `COMPOSE_FILE=docker-compose.yml:docker-compose.override.yml:docker-compose.local.yml`.
- `docker-compose.local.yml` is local-only (listed in `.git/info/exclude`): runs the backend
  with profile `dev` (verification bypass, since no mail is configured) and
  `SERVER_PORT=8080` so the healthcheck, nginx and port mapping still match.
- A fresh volume has an empty `role` table; registration needs
  `INSERT INTO role (id, name) VALUES (1,'ADMIN'),(2,'USER'),(3,'SUPER_ADMIN');`.
- `mock_data/data.sql` does not advance sequences, so loading it causes ID collisions on
  the next insert. Do not load it as-is.
- On an empty database the recommendation `@Scheduled` task logs
  `NumberFormatException: ""` every 5 minutes (pre-existing; harmless until follows exist).
- `frontend/Dockerfile` builds on full `node:16-bullseye` because arm64 needs node-gyp
  for `websocket` → `utf-8-validate` (no linux-arm64 prebuilds), and bullseye `apt-get`
  no longer works (security repo returns 404).

## Running things

- `mvnw` is committed with mode 644, so run it as `sh mvnw ...`. Do not `chmod` it without
  asking: that changes the file mode in git.
- Run the backend **from the repo root**: `GeolocationConfiguration` opens
  `GeoLite2-City.mmdb` relative to the working directory, and logback writes `./logs`
  (override with `LOGS_PATH`).
- Dev profile (`application-dev.yml`): port 8090, datasource
  `jdbc:postgresql://localhost:5432/vivacon`, user `postgres`, password from
  `DB_PASSWORD`, `vivacon.verification.bypass: true`, allowed origins
  `http://localhost:3000,http://localhost:8081`. A fresh clone will not boot without
  `DB_PASSWORD` and `JWT_SECRET_SALT` (env vars or gitignored `config/application-dev.yml`).
- Images used (`postgres:14`, `maven:3.9-eclipse-temurin-11`, `eclipse-temurin:11-jre`,
  `node:16-bullseye-slim`, `nginx:1.27-alpine`, `adminer:4`) are multi-arch upstream; confirm
  on first pull rather than assuming.

## Port mismatch to know about

`docker-compose.override.yml` publishes Postgres on **5433** (chosen to dodge another
stack on the old Windows box), but the dev profile connects to **5432**. On this Mac,
pick one, without editing tracked files:

- set `DB_PORT=5432` in `.env` so compose publishes the DB where the dev profile looks, or
- keep 5433 and start the backend with
  `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/vivacon`.

Dev compose ports: frontend 8081, backend 8091 (Swagger at
`localhost:8091/swagger-ui/index.html`), db 5433, Adminer 8901 (server `db`).
Host-run: backend 8090, CRA dev server 3000.

## Frontend on the host

`npm install --force` (not `--legacy-peer-deps`: it leaves `ajv`/`ajv-keywords` on
incompatible majors). `package-lock.json` is gitignored by choice, so resolution is not
reproducible; the `overrides` block pinning `react-konva` `17.0.2-6` is what holds the tree
together. Do not relax it.
