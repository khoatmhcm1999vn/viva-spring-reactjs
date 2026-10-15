---
paths:
  - "Dockerfile"
  - ".dockerignore"
  - "docker-compose*.yml"
  - ".env.example"
  - "frontend/Dockerfile"
  - "frontend/.dockerignore"
  - "frontend/nginx.conf.template"
  - "frontend/vercel.json"
  - "frontend/.env.production"
---

# Deployment and containers

Nothing here may be run against a remote host, Supabase, Vercel or Cloudflare without
explicit approval. The detailed, measured history is `.kiro/steering/deployment.md`.

## Current state (from `.kiro/steering/deployment.md`)

Compose stack deployed on an Ubuntu VMware VM; backend there uses Supabase
(`ap-south-1`, ~105 ms per round trip) via the session pooler; an optional Cloudflare quick
tunnel gives HTTPS. Vercel for the frontend is prepared but not live.

## Images

- `Dockerfile` is multi-stage (`maven:3.9-eclipse-temurin-11` → `eclipse-temurin:11-jre`),
  builds from source (no prior `mvnw package`), runs as non-root uid 10001, defaults to
  **`SPRING_PROFILES_ACTIVE=prod` on purpose** (dev enables verification bypass), copies
  `GeoLite2-City.mmdb` into `WORKDIR`, and pre-creates `/app/logs`. `JAVA_OPTS` uses
  `-XX:MaxRAMPercentage=75.0`, which is relative to the container memory limit.
- `frontend/Dockerfile` bakes relative `REACT_APP_API_URL=/api` and
  `REACT_APP_SOCKET_URL=/ws`; nginx (`nginx.conf.template`, `envsubst` on `BACKEND_ORIGIN`,
  default `backend:8080`) proxies `/api/` and `/ws/` (with Upgrade headers). One image works
  for every domain.
- No secret is baked into either image.

## Compose files

| File | Loaded | Adds |
|---|---|---|
| `docker-compose.yml` | always | `db`, `backend`, `frontend`; only frontend publishes a port |
| `docker-compose.override.yml` | automatically by bare `docker compose up` | db/backend ports, Adminer |
| `docker-compose.tunnel.yml` | only with explicit `-f` | `cloudflared` |

- Deploy with `docker compose -f docker-compose.yml up -d` so the override is skipped.
- `DB_PASSWORD` and `JWT_SECRET_SALT` use `${VAR:?}`; compose refuses to start without them.
- Every service has `mem_limit`; the backend one is required (see `MaxRAMPercentage`).
- `image:` keys let a host reuse a `docker load`-ed image (`up -d --no-build`).
- `cloudflared` image is distroless: never wrap its command in `sh -c`. A quick tunnel's
  hostname changes on every recreate; read it from container logs and restart only the
  service that changed.

## Cross-origin deployment

- Vercel: Root Directory `frontend`, `npm install --force`, `CI=false npm run build`,
  and absolute `REACT_APP_API_URL` / `REACT_APP_SOCKET_URL` set in project env (baked at build).
- Backend `FRONTEND_ALLOWED_ORIGINS` must list the real frontend origin(s); patterns like
  `https://*.vercel.app` are supported for both CORS and SockJS.
- Vercel cannot proxy WebSockets, so the backend needs its own HTTPS/WSS endpoint.

## Open items

TLS for a public host, firewall, real backups, rotating credentials leaked in git history,
the statistics-view race, the stale `prod` Maven profile.
