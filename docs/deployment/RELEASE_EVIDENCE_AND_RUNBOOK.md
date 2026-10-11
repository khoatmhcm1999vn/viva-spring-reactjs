# Vivacon — Deployment Evidence, Smoke Tests & Rollback

> Template only. **No live checks have been executed by this file.**
> Store sanitized outputs under `docs/deployment/evidence/` or link to restricted CI artifacts.

## 1. Before deployment (read-only)
```bash
git status --short
git branch --show-current
git rev-parse HEAD
docker compose -f docker-compose.yml config --services
```
Check that base Compose contains `db`, `backend`, `frontend`, while override exposes development-only services/ports. For a Vercel + Supabase architecture, identify the **actual VM deployment manifest** before starting any service. Do not deploy the base Compose unmodified by assumption.

## 2. Verify Vercel
- Confirm project root directory `frontend`, framework Create React App, output `build`.
- Confirm production build used the intended SHA and the intended Node version.
- Check production `REACT_APP_API_URL` and `REACT_APP_SOCKET_URL` in Vercel environment (record only origins, not secrets).
- Open main URL and a direct nested SPA route after reload.
- Inspect network tab: API must use HTTPS; socket must reach the correct endpoint and connect.
- Record: Vercel deployment ID, SHA, timestamp, screenshots or sanitized logs, result.

## 3. Verify Ubuntu backend (SSH with operator approval)
```bash
uname -a
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
docker logs --tail 100 vivacon-backend
curl -fsS http://127.0.0.1:8080/actuator/health
```
The last curl works only if the service is actually bound on the VM loopback; if the backend is Docker-network-only, run a read-only health probe from the appropriate network/container instead. Avoid reporting `UP` unless observed. Capture image digest and current profile without exposing secrets.

## 4. Verify Supabase safely
- Confirm runtime connects to Supabase session pooler over TLS, not stale local `db` by accident.
- Use approved database access for `select current_database(), current_user, version();`.
- Compare schema tables, functions and required constraints against `container/prepare/schema/schema.sql` and `container/prepare/functions/*.sql`.
- Check application DAO calls for stored function dependencies.
- Keep actual password, full JDBC URL with credentials and connection secrets out of evidence.
- Production `ddl-auto: update` requires a dedicated schema-risk review and tested backup before schema-changing releases.

## 5. End-to-end acceptance matrix
| Test | Expected | Observed | Evidence | UTC |
|---|---|---|---|---|
| Vercel SPA deep link | Loads app, no server 404 | PENDING | — | — |
| API preflight/CORS | Approved origin works | PENDING | — | — |
| Unauthorized endpoint | Protected response as designed | PENDING | — | — |
| Login and refresh | Authorized test account succeeds | PENDING | — | — |
| Posts / newsfeed | Reads backend data | PENDING | — | — |
| WebSocket/STOMP | Handshake + event exchange works | PENDING | — | — |
| Supabase persistence | Controlled test transaction persists | PENDING | — | — |
| Admin authorization | Non-admin rejected from admin functions | PENDING | — | — |

## 6. Rollback and recovery
- Before change: note last good image digest, deployment ID, database backup time and schema version; verify recoverability.
- For frontend: revert to a previously verified Vercel deployment using approved platform controls.
- For backend: redeploy last good immutable image tag/digest with reviewed environment.
- For schema changes: do not blindly reverse SQL or delete Supabase data; use an approved restore/migration rollback procedure, assess data loss, and notify stakeholders.
- After rollback: repeat core smoke checks and record observed results.

## 7. Claude / Kiro task prompt

```text
Read .kiro/steering/* and inspect this Vivacon workspace at the CURRENT commit.
Update docs/deployment/MILESTONES.md and RELEASE_EVIDENCE.md.
Cross-check frontend/vercel.json, frontend/package.json, frontend API and socket clients,
Dockerfile, Docker Compose files, production YAML, JPA entities and PostgreSQL functions.
Distinguish source-verified, historically reported and runtime-verified states.
Ask permission before connecting to production systems or making changes.
Do not invent logs, URLs, environment values, successful checks or migration results.
Report every conclusion with exact code path, evidence reference, git SHA and UTC timestamp.
Do not deploy, modify secrets, commit or push.
```
