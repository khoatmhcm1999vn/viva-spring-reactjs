# Vivacon Deployment Milestones

**Target:** Vercel frontend / Ubuntu VM Spring Boot backend / Supabase PostgreSQL.
**Tracking principle:** historical repository reports are not proof of current live health.

**Last checked:** 2026-10-11T09:10:44Z – 09:11:27Z UTC.

- **Workspace:** `feature/ai-assisted-dev-setup@76701cfec7a902a5d5454ffe819e5b5de3eba7da`.
- **Serving on Vercel:** `main@e12d3e0059b8d1d432661d36a38329bfb2d6cbee`.
- **Evidence:** every row cites an ID from [RELEASE_EVIDENCE.md](RELEASE_EVIDENCE.md), where E# is an evidence item and B# a blocker.
- **Vantage point:** a LAN workstation with unauthenticated `GET` only. There was no SSH and no database session, so anything that needs either stays UNVERIFIED.

## Current state at a glance

| Tier | Configured in repo | Historically reported | Observed now |
|---|---|---|---|
| Vercel SPA | yes (`frontend/vercel.json`) | live (`deployment.md` step 11) | **Serving**, built from `main@e12d3e0` (E3, E4, E6) |
| Public HTTPS/WSS entry (Cloudflare quick tunnel) | yes (`docker-compose.tunnel.yml`) | live, later broken (ISS-01/02) | Dead at 09:10Z (E8). **Recreated 09:25Z and serving** (E26); Vercel bundle rebuilt to match at ~10:08Z (E27) |
| VM nginx + Spring Boot | yes (`docker-compose.yml`, `Dockerfile`) | healthy | **Responding on the LAN**: 401 on protected API, `/ws/info` origin checks enforced (E10–E13) |
| Supabase PostgreSQL | configurable via env only | live via session pooler + TLS | Backend reads a DB (E14). Which DB is **not proven**; latency only suggests a remote one (E15) |

At 09:10Z the public site loaded but could not reach its backend. After the owner recreated `cloudflared` and redeployed Vercel, all three tiers are wired together again (E26, E27). A real browser login, chat and admin journey have **not** been observed yet (M8).

## Milestones

The first two columns and the "Runtime acceptance requirement" column are the original definitions and are unchanged. Status uses NOT_STARTED / IN_PROGRESS / BLOCKED / VERIFIED.

| ID | Gate / deliverable | Repository evidence | Classification (2026-10-11) | Status | Runtime acceptance requirement | Evidence | Next action |
|---|---|---|---|---|---|---|---|
| M0 | Baseline commit and branch | `.kiro/steering/deployment.md`; `git rev-parse HEAD` | RUNTIME_VERIFIED | **VERIFIED** | Record clean/dirty tree + SHA | §1 of RELEASE_EVIDENCE: HEAD `76701cf`. Tree dirty (untracked only). Deployed frontend `e12d3e0` is an ancestor, 5 commits behind | Record the deployed SHA per tier on every release |
| M1 | Frontend build on Vercel | `frontend/vercel.json`; `frontend/package.json` | RUNTIME_VERIFIED for `e12d3e0`. Node version UNVERIFIED | **VERIFIED** (for `main@e12d3e0`) | Production build URL, commit SHA, build success, reload deep route | E1, E3, E4, E6. E2 open | Read the Vercel build log for the Node version. HEAD has no Vercel-relevant changes, so no rebuild is needed for parity |
| M2 | Browser routes to backend | frontend API/socket config; Vercel env | RUNTIME_VERIFIED (10:09Z): redeployed bundle targets the live tunnel; CORS preflight from the Vercel origin OK. Real browser session not observed | **IN_PROGRESS** | Browser network requests go to actual HTTPS API, no mixed content/CORS errors | E27 (supersedes E7/E8 for the bundle), E26 | Owner logs in on the Vercel site and confirms in DevTools: API calls 2xx/401 as expected, no CORS/mixed-content errors, SockJS connects |
| M3 | Ubuntu backend container healthy | `Dockerfile`, `application-prod.yml`, Compose | RUNTIME_VERIFIED (responding). Image/digest/health UNVERIFIED | **IN_PROGRESS** | SSH to VM; show image digest, container status, fresh `/actuator/health` | E10, E11, E12, E13. E16 open | With approval, run the runbook §3 commands on the VM and record the image digest and actuator output (B3) |
| M4 | HTTPS/WSS proxy or tunnel | deployment notes; security/STOMP config | RUNTIME_VERIFIED (09:31Z): new quick tunnel, TLS 1.3, API + CORS + SockJS `/ws/info` OK. Full STOMP CONNECT not yet observed | **IN_PROGRESS** | TLS valid, API and SockJS/STOMP handshake externally succeed | E26 (supersedes E8 for the tunnel itself), E20 | Owner recreated only `cloudflared` at 09:25:55Z. Confirm STOMP CONNECT in the browser after the Vercel redeploy (M2). Still a quick tunnel: a named tunnel is needed to stop this recurring |
| M5 | Supabase DB connectivity | prod JDBC config and DAO | DB access RUNTIME_VERIFIED. "Is Supabase over TLS" UNVERIFIED | **IN_PROGRESS** | Backend confirms DB via non-sensitive, read-only query; SSL/pooler verified | E14, E15 | On the VM, read the datasource host and `sslmode` from the running container (non-secret parts only). Optionally, an approved read-only `select current_database(), version();` |
| M6 | Schema/functions parity | schema SQL, functions SQL, entities | SOURCE_VERIFIED drift. Live UNVERIFIED | **NOT_STARTED** | Compare expected tables/functions/indexes with live database; backup first | E18. Drift table: `BA Document/docs/diagrams/data-model.drawio` page 5. ISS-10/11 | Locate a backup first (E25). Then run a read-only catalog comparison. Review `ddl-auto: update` + `RECREATE_QUIETLY` before the next backend restart |
| M7 | Security / secrets | env placeholders, CORS and JWT config | SOURCE_VERIFIED + RUNTIME_VERIFIED partials. Blocker SOURCE_VERIFIED | **BLOCKED** (B2) | Secrets kept off Git, admin surface restricted, production verification bypass false | Pass: E12, E13 (origin 403). Fail: E22 (tracked keys), E24 (rule mismatches). Open: E17, E23 | Rotate the SightEngine and Maps keys and untrack them. Confirm rotation of the history credentials. Fix the security rule paths as a separate code change |
| M8 | User acceptance | Login, feed, posts, realtime, administration | UNVERIFIED | **NOT_STARTED** (unblocked by E26/E27) | Fresh smoke and authorized user journeys pass | Nothing tested on production (RELEASE_EVIDENCE §5). E21: moderation and maps are not configured in the production bundle | Run the runbook §5 matrix with an authorized test account on the Vercel site |
| M9 | Recovery / rollback | Docker images, database backup records | UNVERIFIED. Backup not found locally | **NOT_STARTED** | Tested image rollback and database restore process with separate environment | E25 | Locate the DB dump and image archive. Rehearse a restore into a non-production Supabase project or local compose |

### Changes from the previous version of this table

- M0, M1: moved to VERIFIED, on the timestamped evidence above. M1 is scoped to the commit actually serving.
- M2, M4: moved from "HISTORICALLY_REPORTED; runtime UNVERIFIED" to BLOCKED. The public endpoint was observed dead.
- M3, M5: moved to IN_PROGRESS. Partial runtime evidence; the acceptance criteria are not fully met.
- M7: BLOCKED. Tracked secrets were found.
- M8: BLOCKED by M2/M4.
- M6, M9: unchanged in substance, now NOT_STARTED with explicit prerequisites.
- Later on 2026-10-11 (09:25Z–10:09Z): after the owner recreated `cloudflared` and redeployed Vercel, M4 and M2 moved from BLOCKED to IN_PROGRESS, and M8 is no longer blocked (NOT_STARTED). B1 is resolved for this quick-tunnel instance; it recurs on the next VM suspend until a named tunnel exists.

### Discrepancies to keep in view

Full table: RELEASE_EVIDENCE §3.

- `deployment.md` says the roadmap is complete and the site live. The site is reachable, but the application path is broken.
- Base compose makes `backend` wait for a healthy local `db`, even when it uses Supabase (E19).
- Production lacks the SightEngine and Google Maps configuration (E21).

## How to update a milestone

For each ID record:
- `status`: NOT_STARTED / IN_PROGRESS / BLOCKED / VERIFIED.
- `code_sha`: actual full Git commit.
- `evidence`: relative path to sanitized log/screenshot or platform job URL.
- `checked_at_utc`: actual ISO 8601 time.
- `owner`: responsible operator.
- `result`: observed behavior; no imagined outcomes.
- `next_action`: actionable blocker or follow-up.

Milestone is **VERIFIED** only if all acceptance tests have actual timestamped evidence from the target environment. When a newer release invalidates old evidence, mark it **IN_PROGRESS** pending recheck.

## Release entry template

```text
Release ID:
Environment:
Git SHA:
Vercel deployment ID / URL:
Ubuntu image digest:
Supabase project reference (non-secret):
Tunnel / DNS endpoint (non-secret):
Runtime smoke test report:
Schema validation report:
Rollback image/version:
Date checked (UTC):
Approver:
```

## Release entries

```text
Release ID:               observation-2026-10-11 (status check, no release performed)
Environment:              production (Vercel) + VM on private LAN
Git SHA:                  frontend served = e12d3e0059b8d1d432661d36a38329bfb2d6cbee (main)
                          workspace       = 76701cfec7a902a5d5454ffe819e5b5de3eba7da (feature/ai-assisted-dev-setup)
                          backend image   = UNVERIFIED (needs docker inspect on the VM)
Vercel deployment ID / URL: https://viva-spring-reactjs-five.vercel.app (deployment ID not captured)
Ubuntu image digest:      UNVERIFIED
Supabase project reference (non-secret): not re-checked; see deployment.md (HISTORICALLY_REPORTED)
Tunnel / DNS endpoint (non-secret): quick tunnel host baked into bundle -> NXDOMAIN (BLOCKED)
Runtime smoke test report: docs/deployment/evidence/20261011T091044Z-runtime-probe.txt
                          docs/deployment/evidence/20261011T091125Z-vm-lan-probe.txt
Schema validation report: not performed
Rollback image/version:   unknown; no backup or image archive found in this workspace
Date checked (UTC):       2026-10-11T09:10:44Z - 2026-10-11T09:11:27Z
Approver:                 none (observation only, nothing deployed)
```

```text
Release ID:               tunnel-recovery-2026-10-11
Environment:              production (Vercel) + VM on private LAN
Git SHA:                  frontend served = e12d3e0059b8d1d432661d36a38329bfb2d6cbee (main), rebuilt, bundle main.34da39fd.js
                          backend image   = unchanged, not restarted; digest UNVERIFIED
Vercel deployment ID / URL: https://viva-spring-reactjs-five.vercel.app (deployment ID not captured)
Ubuntu image digest:      UNVERIFIED
Supabase project reference (non-secret): not re-checked (HISTORICALLY_REPORTED)
Tunnel / DNS endpoint (non-secret): new quick tunnel, registered 2026-10-11T09:25:55Z (host redacted)
Changes made by owner:    VM: compose up -d --no-deps --no-build --force-recreate cloudflared
                          Vercel: REACT_APP_API_URL / REACT_APP_SOCKET_URL set as Config type, production redeploy
Runtime smoke test report: docs/deployment/evidence/20261011T093141Z-tunnel-probe.txt
                          docs/deployment/evidence/20261011T100840Z-vercel-redeploy-probe.txt
Schema validation report: not performed
Rollback image/version:   previous bundle main.fdd1f145.js (pointed at a dead host, so not a useful rollback target)
Date checked (UTC):       2026-10-11T09:31:37Z - 2026-10-11T10:09:22Z
Approver:                 repository owner (performed the changes)
```
