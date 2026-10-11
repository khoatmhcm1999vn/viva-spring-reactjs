# Vivacon — Release Evidence Register

This is the evidence log behind [MILESTONES.md](MILESTONES.md). The procedures and
templates are in [RELEASE_EVIDENCE_AND_RUNBOOK.md](RELEASE_EVIDENCE_AND_RUNBOOK.md);
that file is unchanged.

Classification follows `.kiro/steering/kiro-deployment-evidence.md`:

- **SOURCE_VERIFIED**: confirmed by a repository path and line.
- **HISTORICALLY_REPORTED**: stated in `deployment.md` or `docs/ISSUES.md`, not re-tested here.
- **RUNTIME_VERIFIED**: observed in this session; the timestamp and the sanitized output file are given.
- **UNVERIFIED**: no adequate evidence.
- **BLOCKED**: a blocker has been demonstrated.

## 1. Check context

| Field | Value |
|---|---|
| Repository | `khoatmhcm1999vn/viva-spring-reactjs` |
| Branch checked | `feature/ai-assisted-dev-setup` |
| Workspace HEAD | `76701cfec7a902a5d5454ffe819e5b5de3eba7da` (same as `origin/feature/ai-assisted-dev-setup`) |
| Working tree | Dirty, untracked only: `.kiro/steering/kiro-deployment-evidence.md`, `docs/deployment/`, `packages/` (an unrelated project) |
| Commit serving on Vercel | `e12d3e0059b8d1d432661d36a38329bfb2d6cbee`, ref `main`, env `production`. Read from the live bundle |
| Distance HEAD ↔ deployed | `e12d3e0` is an ancestor of HEAD. HEAD is 5 commits ahead. Under `frontend/` only `frontend/Dockerfile` changed (Node 16 → 22 base image), and Vercel does not use that file. Under `src/`, root `Dockerfile` and compose there are no changes |
| Probe origin | Windows dev workstation on the same LAN as the VM. This is not the VM itself and not a public vantage point |
| Probe window (UTC) | 2026-10-11T09:10:44Z – 09:11:27Z |
| Probe method | Unauthenticated `GET` only. No credentials, tokens or request bodies sent. No SSH. No database connection |
| Operator | Kiro agent, at the repository owner's request. Owner: repository maintainer |

Raw sanitized outputs:

- [`evidence/20261011T091044Z-runtime-probe.txt`](evidence/20261011T091044Z-runtime-probe.txt): Vercel, the live bundle, tunnel DNS, VM reachability.
- [`evidence/20261011T091125Z-vm-lan-probe.txt`](evidence/20261011T091125Z-vm-lan-probe.txt): VM API, WebSocket origin checks, a DB-backed endpoint.

In both files the ephemeral tunnel hostname is redacted to `<tunnel-host>`, and the
workstation name to `<dev-workstation>`.

## 2. Evidence table

Source ref and runtime ref are separate columns. A blank runtime ref means it was not observed in this session.

| # | Claim | Classification | Source ref | Runtime ref (UTC) | Observed |
|---|---|---|---|---|---|
| E1 | Vercel builds the CRA app with `npm install --force`, `CI=false npm run build`, output `build`, SPA rewrite | SOURCE_VERIFIED | `frontend/vercel.json:4-9` | — | — |
| E2 | Node 22.x is pinned for Vercel | SOURCE_VERIFIED; runtime UNVERIFIED | `frontend/package.json:80-81` | — | The Node version used by the live build is not visible from the bundle. Needs the Vercel build log |
| E3 | Production frontend is served | RUNTIME_VERIFIED | `frontend/vercel.json` | probe `[1]` 09:10:44Z | `GET /` → 200 `text/html`, `x-vercel-cache: HIT` |
| E4 | Deep SPA route loads after reload | RUNTIME_VERIFIED | `frontend/vercel.json:9` (rewrite) | probe `[2]` | `GET /newsfeed` → 200, serves `index.html` |
| E5 | `/api/*` on the Vercel origin is not a backend | RUNTIME_VERIFIED | `frontend/vercel.json:9` | probe `[3]` | `GET /api/v1/post` → **200 HTML**. This is the rewrite, not an API response |
| E6 | Live bundle was built from `main@e12d3e0` | RUNTIME_VERIFIED | — | probe `[4]` | `REACT_APP_VERCEL_GIT_COMMIT_SHA=e12d3e0…`, `…_REF=main`, `…_ENV=production` |
| E7 | Live bundle targets an absolute tunnel URL for both API and socket | RUNTIME_VERIFIED | `frontend/src/api/constants.js:1-2`, `frontend/src/api/axiosConfig.js:21`, `frontend/src/hooks/useSocket.js:90` | probe `[4]` | `REACT_APP_API_URL=https://<tunnel-host>/api`, `REACT_APP_SOCKET_URL=https://<tunnel-host>/ws`. No `vivacon.cf` and no `localhost:8090` in the bundle |
| E8 | **The tunnel host baked into the live bundle does not exist** | **BLOCKED** (RUNTIME_VERIFIED) | `docker-compose.tunnel.yml:51` (quick tunnel by default) | probe `[5]` 09:10:4xZ | DNS A lookup: *name does not exist*. Every API and socket call from the public site therefore fails. Tunnel API, `/ws` and actuator probes `[6-9]` were skipped |
| E9 | Cause of E8 is a quick tunnel revoked after a VM suspend, plus hostnames drifting between bundle, `.env` and `cloudflared` | HISTORICALLY_REPORTED | `docs/ISSUES.md` ISS-01, ISS-02 | — | Not rechecked: it needs `docker logs vivacon-cloudflared` on the VM |
| E10 | VM nginx is up on the LAN | RUNTIME_VERIFIED | `frontend/nginx.conf.template:73` (`/healthz`) | probe `[10]`, `[12]` | TCP :80 open, `GET /healthz` → 200 |
| E11 | Spring Boot answers behind nginx, with stateless JWT enforced | RUNTIME_VERIFIED | `HTTPSecurityConfiguration.java:133`, `frontend/nginx.conf.template:46-47` | probe `[13]`, `[A]` 09:11:25Z | `GET /api/v1/post` with no token → **401** `application/json` (a Spring response, not nginx) |
| E12 | Actuator is not reachable through nginx | RUNTIME_VERIFIED | `HTTPSecurityConfiguration.java:137` (`permitAll` in Spring), nginx proxies only `/api/` and `/ws/` | probe `[B]` | `GET /actuator/health` → 200 **SPA HTML**, not actuator JSON |
| E13 | SockJS endpoint is up with the origin allow-list enforced | RUNTIME_VERIFIED | `STOMPMessageBrokerConfiguration.java:121-126`, `application-prod.yml:53` | probe `[C]`, `[D]`, `[E]` | LAN origin → 200 (`websocket: true`). `https://evil.example.com` → **403**. The Vercel origin → 200 |
| E14 | Backend reads from *a* database | RUNTIME_VERIFIED | `AuthenticationController.checkUniqueUsername` | probe `[F]` | `GET /api/v1/account/check?username=admin` → 200 with an `id` field. The body was not recorded |
| E15 | That database is Supabase over the session pooler with TLS | UNVERIFIED; latency is consistent with HISTORICALLY_REPORTED | `application-prod.yml:17-22`, `docker-compose.yml:78,81` (env decides) | probe `[G]` | Median 285 ms over 5 calls (529/285/350/283/282). `deployment.md` reports ~328 ms on Supabase versus 5 ms locally. This is an **indication, not proof**: it needs `SPRING_DATASOURCE_URL` host and `sslmode` read from the running container on the VM |
| E16 | Backend container image, digest, profile and uptime | UNVERIFIED | `Dockerfile:53` (`SPRING_PROFILES_ACTIVE=prod`), `docker-compose.yml:62` | — | Needs `docker ps` / `docker inspect` on the VM (SSH, operator approval) |
| E17 | Production verification bypass is off | SOURCE_VERIFIED; runtime UNVERIFIED | `application-prod.yml:58` | — | The env override in the VM `.env` was not inspected |
| E18 | `ddl-auto: update` runs against production, and unique constraints are dropped and recreated quietly on each boot | SOURCE_VERIFIED (risk) | `application-prod.yml:27-29`, `:35-36` (`unique_constraint_strategy: RECREATE_QUIETLY`) | — | Schema-change risk on every backend start. Not exercised |
| E19 | Base compose cannot start a backend-only deployment | SOURCE_VERIFIED | `docker-compose.yml:67-72` (`backend` depends on `db` with `condition: service_healthy`), `:20` | — | Even when the backend points at Supabase, the local `db` container must be healthy, or the backend will not start |
| E20 | `cloudflared` image is unpinned | SOURCE_VERIFIED | `docker-compose.tunnel.yml:21` (`:latest`) | — | A recreate can pull a different version |
| E21 | Production bundle has no SightEngine credentials and no Google Maps key | RUNTIME_VERIFIED | `frontend/src/api/imageModerationService.js:4-10`, `frontend/.env.production:19-20` (only the API and socket URLs) | probe `[4]` | `REACT_APP_DETECT_IMAGES_SECRET` and `REACT_APP_GOOGLE_MAP_KEY` are not present with a value. The moderation step and the login-location map are therefore not functional on Vercel. The UI effect is inferred, not clicked through |
| E22 | Real third-party credentials are in a tracked file | **BLOCKED** (SOURCE_VERIFIED) | `frontend/.env.development:4` and `:8` (tracked; `git ls-files` lists it) | — | SightEngine secret and Google Maps key. Values not reproduced. Public repo: these must be rotated, not just deleted |
| E23 | Older credentials remain in git history | HISTORICALLY_REPORTED | `.kiro/steering/deployment.md`, `docs/ISSUES.md` ISS-13 | — | Rotation status unknown |
| E24 | Security rules that do not match real endpoints | SOURCE_VERIFIED | `HTTPSecurityConfiguration.java:141-142` versus `ChatController.java:145` and `PostController.java:78`. `WebSocketSecurityConfiguration.java:17` | — | Message history is readable by any authenticated user. The post-delete rule never matches. STOMP subscribe is unrestricted. Not exploited or tested |
| E25 | DB backup and helper scripts exist | UNVERIFIED / not found on this workstation | `deployment.md` cites `container/data/*.sql`, `config/supabase-restore.ps1`, `config/vm-tunnel-origins.sh` and the SSH key in `config/` | local check 09:1xZ | `container/data/` and `config/` **do not exist** in this workspace. Recovery tooling and VM access are not available from here |

### Update 2026-10-11T09:31Z — tunnel recreated

On the VM the owner ran `up -d --no-deps --no-build --force-recreate cloudflared`. The
backend, frontend and db were not touched. `cloudflared` logged `Registered tunnel
connection` at 09:25:55Z with a new quick-tunnel host.

| # | Claim | Classification | Source ref | Runtime ref (UTC) | Observed |
|---|---|---|---|---|---|
| E26 | The new tunnel serves the stack over public HTTPS | RUNTIME_VERIFIED | `docker-compose.tunnel.yml:51`, `frontend/nginx.conf.template:46-61`, `HTTPSecurityConfiguration.java:171-190`, `STOMPMessageBrokerConfiguration.java:121-126` | [`evidence/20261011T093141Z-tunnel-probe.txt`](evidence/20261011T093141Z-tunnel-probe.txt), 09:31:37–41Z | DNS resolves. TLS 1.3 with a valid cert. `/` → SPA. `/api/v1/post` → 401 with ACAO = the Vercel origin. Preflight from Vercel → 200, from evil → 403. `/ws/info` from Vercel → 200 (`websocket: true`), from evil → 403. Actuator not exposed. A DB-backed endpoint → 200 in 617 ms |

No backend restart was done: `FRONTEND_ALLOWED_ORIGINS` already admits the Vercel origin
(T3, T4, T6).

### Update 2026-10-11T10:09Z — Vercel redeployed

The owner set `REACT_APP_API_URL` and `REACT_APP_SOCKET_URL` as **Config**-type variables
(Vercel warns when a public-prefixed variable is marked Secret, because the value is
inlined into the browser bundle either way) and redeployed production.

| # | Claim | Classification | Source ref | Runtime ref (UTC) | Observed |
|---|---|---|---|---|---|
| E27 | The live bundle targets the recreated tunnel | RUNTIME_VERIFIED | `frontend/src/api/constants.js:1-2` | [`evidence/20261011T100840Z-vercel-redeploy-probe.txt`](evidence/20261011T100840Z-vercel-redeploy-probe.txt), 10:09:22Z | New bundle `main.34da39fd.js` (was `main.fdd1f145.js`). Both `REACT_APP_*` values point at the host registered at 09:25:55Z. Build SHA still `e12d3e0`. Preflight from the Vercel origin → 200 with the exact ACAO |

Still not observed: a real browser session (login, newsfeed, STOMP CONNECT, chat). Keep
M2 at IN_PROGRESS and M8 at NOT_STARTED until it is.

### Separate: local isolated stack (not a deployment check)

[`evidence/20261011T095556Z-local-isolated-stack.txt`](evidence/20261011T095556Z-local-isolated-stack.txt)
records a test of `docker-compose.local.yml` on the Windows dev workstation. It was
built from source, on a fresh volume, using an env file deliberately pointing at a
remote DB. The backend stayed on the local `db`. The fresh DB had 19 tables and 14
functions after the first boot. `mock_data/data.sql` loaded with 0 errors. Register →
login → newsfeed all passed, and the production Vercel origin was refused (403). This
says nothing about production; it backs up `docs/SETUP_MACOS.md`.

## 3. Discrepancies between historical reports and what was observed

| Topic | Historical report | Observed now | Effect |
|---|---|---|---|
| Public site works end to end | `deployment.md` step 11: "live … verified from outside with `FAIL=0`" | The Vercel UI loads, but its baked backend host returns NXDOMAIN (E8) | Login, newsfeed, chat and notifications cannot work from the public URL. Step 11 is no longer current |
| Deployed commit | Implied: the current branch | Vercel serves `main@e12d3e0`; the workspace is `feature/ai-assisted-dev-setup@76701cf` | Not harmful today, because no Vercel-relevant files changed (§1). It must be recorded on every release |
| Only frontend publishes a port, so the deploy is "safe" | `deployment.md`, compose comments | True for the base file. But a backend-only Supabase deployment is not expressible: `db` is a hard dependency (E19) | `vivacon-db` is described as "dead weight", yet it is still required for boot |
| Supabase as the live DB | `deployment.md` step 10: proven by stopping `vivacon-db` | Only latency was observed (E15) | Keep as HISTORICALLY_REPORTED until re-proved on the VM |
| Image moderation and maps | `ARCHITECTURE.md` treats SightEngine as part of the deployed flow | Keys absent from the production bundle (E21) | The feature is silently off in production |
| Backup exists | `deployment.md` step 7 | Not present in this workspace (E25) | A restore cannot be performed from this workstation |

## 4. Blockers

| ID | Blocker | Evidence | Unblock action | Needs approval |
|---|---|---|---|---|
| B1 | Public API/WSS endpoint is dead. **Resolved 2026-10-11T10:09Z for this quick-tunnel instance** (E26, E27); recurs on the next VM suspend | E8, E9 | On the VM: recreate **only** `cloudflared`, read the new host from its running log, update `FRONTEND_ALLOWED_ORIGINS`, restart `backend` only. Then set both `REACT_APP_*` on Vercel and **redeploy**. The lasting fix is a named tunnel with a fixed domain (ISS-01/02/03) | Yes: changes deployment state, Vercel settings, and possibly DNS |
| B2 | Tracked third-party secrets | E22, E23 | Rotate the SightEngine and Google Maps keys at the provider, remove them from tracked files, and move them to Vercel env (or a server-side proxy for SightEngine) | Yes: credential rotation |
| B3 | No VM access or recovery tooling from this workstation | E16, E25 | Provide approved SSH access (or run the read-only commands in the runbook §3 on the VM) and locate the DB dump | Yes: access to production systems |

## 5. Not tested in this session (do not report as passing)

- Login, refresh token, posting, newsfeed, chat send and receive, notifications, admin authorization. These need an authorized test account and a working public endpoint (B1).
- Supabase TLS, pooler mode, live schema parity (19 tables / 14 functions), and backups.
- Vercel build log, project settings and the Node version actually used.
- Rollback of either tier.

The acceptance matrix in `RELEASE_EVIDENCE_AND_RUNBOOK.md` §5 stays `PENDING` for those rows.

## 6. Reproducing these checks

```powershell
# From the repo root, read-only. Writes a sanitized log under docs/deployment/evidence/.
# The probe scripts used for this run were temporary; equivalent manual checks:
curl.exe -s -o NUL -w "%{http_code}\n" https://viva-spring-reactjs-five.vercel.app/newsfeed
Resolve-DnsName <host-from-live-bundle> -Type A
curl.exe -s -o NUL -w "%{http_code}\n" http://192.168.221.128/api/v1/post        # expect 401
curl.exe -s -o NUL -w "%{http_code}\n" -H "Origin: https://evil.example.com" http://192.168.221.128/ws/info   # expect 403
```

To read the baked backend host and the build SHA, fetch `index.html`, follow the
`/static/js/main.<hash>.js` link, and search for `REACT_APP_API_URL:"` and
`REACT_APP_VERCEL_GIT_COMMIT_SHA:"`. Record only origins and SHAs; never record other
`REACT_APP_*` values.
