# Deployment roadmap

Where the project is on the path from a local checkout to a deployed stack, and what
is known to block each remaining step. Git history is the record of *what changed*;
this file is the record of *where we are going and what is in the way*.

## Done

1. **Clone and open locally** — Windows, Kiro IDE.
2. **PostgreSQL in Docker** — container `postgres_14` on `:5432`, Adminer on `:8900`.
   Database `vivacon`: 19 tables, 14 stored functions, seeded with 54 accounts and
   688 posts.
3. **Backend on the host** — `:8090`, dev profile, JDK 11.
4. **Frontend on the host** — `:3000`, CRA dev server, talks to `:8090`.
5. **Backend as a Docker image** — multi-stage `Dockerfile`, verified end to end.
6. **Frontend as a Docker image** — CRA build served by nginx, API and WebSocket
   proxied, verified end to end.
7. **Database backup** — plain-SQL dump in `container/data/` (gitignored), proven
   restorable.
8. **Full stack in compose** — `db`, `backend`, `frontend`, `adminer`, verified
   through the frontend proxy, with data surviving a container recreate.
9. **Deployed to a real Ubuntu VM** — VMware guest at `192.168.221.128`, Ubuntu
   26.04, its own Docker daemon. Port 80 only, dump restored, verified from Windows.
10. **Postgres moved to Supabase** — the VM backend runs against the Supabase session
    pooler, proven by stopping the local database container and watching the API keep
    serving.
11. **Frontend on Vercel, backend exposed over HTTPS** — live at
    `https://viva-spring-reactjs-five.vercel.app`, API and WebSocket reaching the VM
    through a Cloudflare Tunnel. Verified from outside with `FAIL=0`.

The roadmap is complete. What remains are the standing issues under
*Known blockers*, chiefly TLS ownership, the ephemeral tunnel hostname, and the
credentials still sitting in public git history.

## Backend image

`docker build -t vivacon-backend:local .` builds from source; no prior `mvnw package`
is needed. Verified: `/actuator/health` returns UP, `/v3/api-docs` returns the spec, a
request with no token returns 401, and a registration written from the container
landed in the host database.

Three things about that image worth knowing before changing it:

- **The default profile is `prod`, deliberately.** An image is a deployment artifact,
  and the dev profile has `vivacon.verification.bypass=true`, which skips email
  verification. Defaulting to dev would mean one careless deploy opens registration
  with addresses the user does not own. Override with `-e SPRING_PROFILES_ACTIVE=dev`
  for local runs.
- **`GeoLite2-City.mmdb` must sit in the working directory.** `GeolocationConfiguration`
  reads it through `new FileSystemResource("GeoLite2-City.mmdb")`, a path relative to
  the process working directory, so it has to be in `WORKDIR`, not anywhere else.
- **`/app/logs` is created and chowned in the image.** `logback-spring.xml` writes to
  `./logs`; the container runs as a non-root user, so without that the app dies at
  startup with "Failed to create parent directories". The path can now be overridden
  with the `LOGS_PATH` environment variable.

`.dockerignore` matters more than it looks: the build context drops from about 1.1 GB
to 61 MB, almost all of the difference being `frontend/node_modules`.

No secret is baked into the image. Everything is passed at run time:

```
SPRING_DATASOURCE_URL  DB_PASSWORD  JWT_SECRET_SALT  MAIL_FROM_ADDRESS
MS_OAUTH_CLIENT_ID  MS_OAUTH_CLIENT_SECRET  MS_OAUTH_REFRESH_TOKEN
CLOUDINARY_CLOUD_NAME  CLOUDINARY_API_KEY  CLOUDINARY_API_SECRET
AWS_ACCESS_KEY_ID  AWS_SECRET_ACCESS_KEY
```

## Frontend image

`docker build -t vivacon-frontend:local ./frontend`. Node build stage, nginx runtime.
Verified: index.html is served, unknown paths fall back to it so react-router works,
`/api/v1` requests reach the backend through the proxy, and `/ws/info` negotiates.

The reason a single image works for every environment: the build bakes
`REACT_APP_API_URL=/api` and `REACT_APP_SOCKET_URL=/ws`, so the bundle only ever asks
for **relative** paths and nginx decides where they go. Confirmed by searching the
built bundle: it contains `/api/v1` and contains neither `localhost:8090` nor
`vivacon.cf`. If those were absolute, the image would have to be rebuilt per domain,
because `REACT_APP_*` is substituted at build time and cannot be read at runtime.

`BACKEND_ORIGIN` chooses the upstream. It defaults to `backend:8080`, the compose
service name; for a local run against the host backend, pass
`-e BACKEND_ORIGIN=host.docker.internal:8090`. The nginx config is a template and the
official image runs `envsubst` over it at startup, so nginx's own `$uri`-style
variables survive untouched because they are not environment variables.

The build uses `npm install --force`, not `--legacy-peer-deps`, for the reason noted
in `tech.md`.

`frontend/.env.production` still points at `http://vivacon.cf`, a dead domain. The
Docker build does not read it, so it only matters for `npm run build:prod`.

## The compose stack

There are two files and the difference matters.

`docker-compose.yml` is the base and is safe to deploy: **only the frontend publishes
a port.** The database and backend talk over the compose network and are not reachable
from outside, and there is no Adminer.

`docker-compose.override.yml` adds the development conveniences: it publishes the
database and backend ports and adds Adminer. Compose loads it automatically, so these
two commands differ:

```bash
docker compose up -d                      # dev: override is loaded
docker compose -f docker-compose.yml up -d # deploy: override is skipped
```

Naming a file explicitly with `-f` is what stops the override from being picked up.
Everything the override adds is something that should not exist on a public host: an
open database port, an open backend port, and a database admin UI with no
authentication.

Copy `.env.example` to `.env` and fill in `DB_PASSWORD` and `JWT_SECRET_SALT`.
Compose declares them with `${VAR:?}`, so a missing value stops the stack immediately
rather than starting it half-configured.

| Service    | Dev host port | Deploy | Notes |
|------------|---------------|--------|-------|
| `frontend` | 8081          | 80     | nginx, the address to open |
| `backend`  | 8091          | none   | Swagger and debugging in dev only |
| `db`       | 5433          | none   | Postgres 14 |
| `adminer`  | 8901          | absent | database browser, server `db` |

Measured in deploy mode: only the frontend port is open, the other three are closed,
and the application still fully works through the proxy.

Every service also declares `mem_limit`, defaulting to 640m for `db`, 1200m for
`backend` and 128m for `frontend`, all overridable in `.env`. The one on `backend` is
not a nicety: the JVM is started with `-XX:MaxRAMPercentage=75.0`, and that percentage
is read off the cgroup limit, so with no limit set it means 75% of the entire machine.

The two services built from source also declare `image:`. That lets `up` reuse an
image that is already present instead of building, which is how the VM deployment
works — build on a machine with RAM to spare, `docker save | docker load` across, and
`up -d --no-build`.

**There is a second, unrelated Postgres on this machine.** The container `postgres_14`
belongs to a different compose project, `vivacon-services`, defined at
`E:\JavaProj\Vivacon-Services\docker-compose.yml`, and it holds port 5432 and 8900.
That is why `docker compose down` in this repo does nothing to it, and why this stack
deliberately uses 5433 and 8901. Do not assume a Postgres on 5432 is ours.

A consequence worth remembering: the Postgres MCP server in `.kiro/settings/mcp.json`
points at `localhost:5432`, which is the **other** project's database, not the compose
one. Both currently hold the same restored data, so they look identical and will
silently drift apart. Change the port to 5433 in that file to inspect the compose
database instead.

What the old compose file got wrong, for the record: no named volume, so the seeded
data sat in an anonymous volume that a single recreate would orphan; no `POSTGRES_DB`,
so a fresh container created only the `postgres` database while the app connects to
`vivacon`; the password committed in plain text; and `init-db.sh` loaded only
`schema.sql`, never the stored functions that `dao/` calls by name. The functions are
now mounted directly into `/docker-entrypoint-initdb.d` with numeric prefixes so they
load in order on a first `up`.

Verified: the frontend serves and falls back to `index.html`, `/api` and `/ws` reach
the backend through the proxy, the origin whitelist accepts `localhost:8081` and still
rejects an unlisted domain, the seeded `admin` account is readable through the proxy,
and a `down` followed by `up -d` leaves all 54 accounts, 688 posts and 30,552 comments
in place.

### Restoring a dump into this stack

The init scripts and a dump restore conflict: restoring over the schema the init
scripts just created produced 852 errors. Reset the schema first, then restore:

```sql
DROP SCHEMA public CASCADE; CREATE SCHEMA public;
```

The dump carries its own schema, functions and data, so it supersedes the init
scripts entirely. Filter out the `\connect`, `CREATE DATABASE`, `DROP DATABASE` and
`ALTER DATABASE` lines, because the dump is taken with `--create --clean` and would
otherwise try to drop the database it is connected to. Do that filtering from a script
file, not with `grep` inside `sh -c`, where the escaping is easy to get wrong.

If you are driving this over SSH, mind that `docker compose exec -T` reads stdin; see
the Ubuntu VM section for how that silently truncates a piped script.

## The Ubuntu VM deployment

Done, on a real VMware guest. Earlier this step was attempted on WSL2 and that attempt
is kept below, because the reason it did not count is the useful part.

### The target

| | |
|---|---|
| vmx | `E:\ubuntu\Ubuntu 64-bit.vmx` |
| Address | `192.168.221.128`, VMnet8 NAT, gateway `.2` |
| OS | Ubuntu 26.04.1 LTS, kernel 7.0.0 |
| CPU / RAM | 2 cores, 3.3 GB, of which ~1.3 GB free (the desktop session takes the rest) |
| Swap | 3.8 GB swapfile |
| Disk | 40 G root, 25 G free after the images |
| Docker | 29.1.3 from the Ubuntu repos, `docker-compose-v2` 2.40.3, cgroup v2, overlayfs |

**This one is genuinely a separate host**, which the WSL attempt was not. The daemon
IDs differ (`38226a89…` in the VM against `d05c0962…` on Windows), the engine versions
differ (29.1.3 against 29.8.1), `docker info` reports Ubuntu against Docker Desktop,
and the VM's daemon sees only the three containers of this stack. The containers in
the VM also carry the same names as the ones on Windows, `vivacon-db` and friends,
which could not both exist on one daemon.

Access is by SSH key, not by password: a key was generated into `config/` and the
public half added to the VM. Nothing in `config/` is committed.

### What was run

```bash
git clone -b feature/ai-assisted-dev-setup <repo> ~/viva-spring-reactjs
cd ~/viva-spring-reactjs
cp .env.example .env            # secrets generated in the VM, see below
docker compose -f docker-compose.yml up -d --no-build
```

`FRONTEND_PORT=80` and `FRONTEND_ALLOWED_ORIGINS=http://192.168.221.128`. The whole
stack came up with the backend healthy in 15 seconds.

The clean clone correctly contained no `config/` and no `.env`, and the SQL files
mounted into Postgres had LF endings, so the CRLF worry does not apply on Linux.

**Secrets were generated inside the VM**, with `openssl rand -base64` writing straight
into `.env`, rather than being passed in from Windows. A value typed into a command on
the host would sit in the shell history and in the host's process list, and would end
up in the transcript of whoever ran it. Generating in place avoids all three. `.env`
is then `chmod 600`.

### Why the images were not built on the VM

They were built on Windows and shipped: `docker save` of both images is 488 MB, `scp`
to `/tmp`, `docker load` in the VM. SHA-256 matched on both sides. `postgres:14` was
pulled from Docker Hub by the VM itself rather than shipped, since it is public and the
VM has a working network.

The reason is the 1.3 GB of free RAM. A CRA webpack build routinely wants 2-4 GB; on
this box it would thrash the swapfile or get OOM-killed. Shipping a built image skips
the problem and is what a real deployment should do anyway.

This is what the `image:` keys in `docker-compose.yml` are for. With them, `up` reuses
a loaded image instead of building, and `--no-build` makes that a guarantee rather than
a hope. `BACKEND_IMAGE` / `FRONTEND_IMAGE` in `.env` are the hook for switching to a
registry tag later.

### Restoring the dump into the VM

Followed the recipe in *Restoring a dump into this stack* above, and it behaved exactly
as documented: `DROP SCHEMA public CASCADE` first (dropping 49 objects the init scripts
had created), then the filtered dump. **0 errors.** Afterwards: 19 base tables, 14
functions, 54 accounts, 688 posts, 30,552 comments, 1,073 attachments — identical to
the Windows stack. The backend was restarted so Hibernate met the new schema.

A correction to an earlier number here: this used to say "22 tables". The query behind
it counted `information_schema.tables` without filtering `table_type`, so it was
counting three **views** as tables. There are 19 base tables and 3 views. The views are
`month_year`, `quarter_year` and `list_year`, left behind by the statistics functions —
see the concurrency note under *Known blockers*. They persist well enough to be
captured in `pg_dump` output, which is the clearest evidence that they are not
temporary.

One trap worth recording, because it fails silently. The SSH helper used to run
`bash -s`, which reads the script itself from stdin. `docker compose exec -T` also reads
stdin, so the first `psql` call swallowed the remainder of the script and the run
stopped halfway with exit code 0 and no error. The fix is to write the script to a file
in the VM and run `bash <file> < /dev/null`, so nothing competes for stdin. Any remote
script containing `exec -T`, `psql` or `ssh` has this problem.

### Measured from Windows, against `http://192.168.221.128`

Every check below passed, and passed again after a `down` / `up -d` cycle.

| Check | Result |
|---|---|
| `GET /` | 200, index.html |
| `GET /newsfeed`, `GET /<nonsense>` | 200 index.html, so react-router works |
| `GET /api/v1/post` with no token | 401 |
| `GET /api/v1/account/check?username=admin` | 200, the restored `admin` account, id 54 |
| `GET /ws/info` with `Origin: http://192.168.221.128` | 200 |
| `GET /ws/info` with an unlisted origin | 403 |
| `GET /actuator/health` from outside | index.html, **not** actuator JSON |
| Ports 8091, 5433, 8901, 8080, 5432 | all closed |
| Port 80 | open |
| Built bundle | contains `/api/v1`, contains no `localhost:8090`, no `vivacon.cf`, and not even the VM's own address |

Two of those are worth spelling out. `/actuator/health` returning the SPA fallback
proves actuator is not exposed: nginx proxies only `/api` and `/ws`, so health is
reachable to the container's own healthcheck and to nobody outside. And
`account/check` returning the admin account is the only check that exercises all three
tiers at once; a healthy backend only tells you the datasource answered.

Data survived `down` then `up -d` unchanged at 54/688/30,552, because the volume is
named. The 14 stored functions survived too, which matters because `dao/` calls them
by name.

### Memory limits, which this step forced

Before this, no service declared a limit. The `Dockerfile` sets
`-XX:MaxRAMPercentage=75.0`, and that percentage is measured against the **cgroup
limit**; with no limit it means 75% of the whole machine. Unnoticeable on a 32 GB
laptop, fatal on a 3.3 GB VM, where the backend would claim ~2.5 GB and crowd out
Postgres.

`db`, `backend` and `frontend` now carry `mem_limit`, defaulting to 640m / 1200m / 128m
and overridable in `.env`. Measured in the VM under idle load: frontend 4.9 MB,
backend 307 MB, db 117 MB. Comfortable.

### Still open for a deployment on the public internet

- **TLS.** Nothing in this stack terminates HTTPS, and the VM run was plain HTTP.
  Either put a reverse proxy in front of the frontend container or add a certificate to
  its nginx. Step 10 makes this mandatory, though not for the reason this document
  used to give: see *The cross-origin cookie worry was wrong*. The real reasons are
  mixed content and `wss`.
- **A from-scratch build on a clean machine is still unproven.** Images were shipped,
  not built on the VM, and the Windows images came from a warm layer cache.
- **No firewall was configured** in the VM, and nothing was tested from outside a NAT
  network. `ufw` is untouched.
- **Backups.** `container/data/` is a developer convenience, not a backup strategy.
- **Rotate the committed credentials first.** They are in git history on a public
  repository; a deployed instance using them is a deployed instance with known
  passwords.
- `sudo` in the VM needs a password, which is correct, but it means the Docker install
  had to be run by hand once. Nothing automated here can install packages.

### The earlier WSL2 attempt, and why it did not count

**The WSL2 Ubuntu on this machine is not a separate host.** `docker ps` inside it lists
the same containers as Windows, same engine version and build: it uses the Docker
Desktop daemon through WSL integration, and the distro list shows Docker Desktop's own
`docker-desktop` distro alongside `Ubuntu`. Deploying "to the VM" there redeploys to the
same daemon, and proves nothing about a remote host, firewalls, SSH, or a separately
installed engine.

It did establish that a clean clone plus a copied `.env` is enough to bring the stack
up, that only the frontend port was open, and that the named volume survived the project
moving directory. All of that has since been re-established on the real VM.

## 10. Vercel + Supabase + the VM backend — live

**Live at `https://viva-spring-reactjs-five.vercel.app`**, with Postgres on Supabase
and Spring Boot on the Ubuntu VM behind a Cloudflare Tunnel. Verified end to end from
outside: `FAIL=0`.

The final topology:

```
browser
  -> https://viva-spring-reactjs-five.vercel.app     (Vercel CDN, static only)
  -> https://<name>.trycloudflare.com/api  and  /ws  (Cloudflare edge)
       -> cloudflared in the VM -> nginx -> Spring Boot
            -> Supabase session pooler (ap-south-1)
```

Two things about the deployment that are worth keeping.

**Vercel renamed the project.** `viva-spring-reactjs` was taken, so the actual host is
`viva-spring-reactjs-**five**.vercel.app`. The origin allow-list was already
`https://*.vercel.app`, so nothing broke. Had the backend been configured with the
specific name chosen in the dashboard, it would have been wrong before the first
deploy finished — an argument for the pattern that only showed up by accident.

**`main` had to be merged first.** The Vercel import defaults to the repository's
default branch, and at that point `main` was 22 commits behind: no `vercel.json`, no
`build` script, no `engines.node`, and an `.env.production` still pointing at the dead
`vivacon.cf`. Deploying from it would have failed three separate ways. Merged via PR
(`e12d3e0`), which was a fast-forward.

#### The thing that blocks it, stated plainly

**Vercel is HTTPS-only and the VM is on a private address.** That combination breaks
the obvious arrangement in three separate ways:

1. A page served from `https://<project>.vercel.app` cannot call
   `http://192.168.221.128`. The browser blocks it as mixed content.
2. Vercel's edge cannot reach `192.168.221.128` either, so proxying `/api` through a
   Vercel rewrite does not help.
3. **Vercel cannot carry the WebSocket at all.** Its functions do not hold WebSocket
   connections, so `/ws` can never be proxied through Vercel. SockJS has to reach the
   backend directly, which means the backend needs its own valid `https` / `wss`
   endpoint regardless of what happens to `/api`.

So the backend needs a public HTTPS hostname with a trusted certificate. An IP on a
NAT network cannot have one. The practical answer is a **tunnel out of the VM** —
Cloudflare Tunnel (`cloudflared`) is the right tool: free, no port forwarding, no
public IP, a valid certificate, and it carries WebSocket. ngrok's free tier serves an
interstitial page that breaks XHR, and port forwarding is awkward here because the VM
sits behind both VMware NAT and the household router.

Nothing about this is a limitation of the application. It is what happens when one
half of a system is on the public internet and the other half is not.

#### Supabase: done, and the backend is running on it

Project `rmdkwpzqrdwikjutmwtz`, region **ap-south-1** (Mumbai), Postgres **17.11** —
the same version the SQL was pre-tested against. The dump restored in 49 seconds with
**0 errors**, giving 19 base tables, 14 functions, 54 accounts, 688 posts, 30,552
comments, 1,073 attachments and the `admin` account at id 54. All nine stored functions
that `dao/` calls by name were invoked and all nine returned rows, including
`getlastestloginlocationperaccount()`, which is precisely the one that fails on a
`schema.sql`-only schema. That is the dump-versus-schema.sql argument settled by
experiment.

The VM backend now points at it. `docker compose` still defines the local `db` service,
but the backend no longer uses it — **proven by stopping `vivacon-db` and watching
`/api/v1/account/check?username=admin` keep returning the admin account with a 200.**
Configuration can claim anything; a dead database container cannot serve rows. The
container was started again afterwards. It is now dead weight in the deploy and could
be dropped from the compose file, which is a decision rather than a fix.

Full re-verification after the switch: every check in the table above still passes,
`FAIL=0`.

Two things about TLS that are easy to get backwards:

- **`pg_stat_ssl` reports `ssl = false`, and that is not alarming.** It describes the
  hop *Supavisor → Postgres* inside Supabase's network, not the hop from here.
  `psql \conninfo` confirms our own leg is **TLSv1.3, TLS_AES_256_GCM_SHA384**.
- **`sslmode=require` is load-bearing.** Measured: the pooler happily accepts
  `sslmode=disable` as well. The endpoint does not enforce encryption, so leaving the
  parameter off means a misconfiguration can run in plaintext across the public
  internet with nothing complaining.

Credentials are supplied as discrete libpq variables in the gitignored
`config/supabase.env`, not as a URI. That is deliberate: a password holding `@`, `:`,
`/`, `?` or `#` needs no URL-encoding this way, and passing the file to Docker with
`--env-file` keeps the password off every command line and out of the host process
list.

##### The latency is the real cost, and it is large

| Measured against ap-south-1 | |
|---|---|
| Opening a fresh session (TLS + auth via the pooler) | ~790 ms |
| 20 queries inside one session | 2810 ms, so **~105 ms per round trip** |
| `count(*)` over 30,552 comments | 726 ms, nearly all of it session setup |
| `/api/v1/account/check` through the proxy | **328 ms** (≈ 3 round trips) |
| The same endpoint against the local Postgres | **5 ms** |

So the database itself is not slow; the distance is. Every round trip costs about
105 ms, and HikariPool keeps connections open so requests avoid the 790 ms handshake.
But the arithmetic is unforgiving for anything chatty: a mapper that enriches each item
in a page with its own counts turns a 10-item newsfeed into dozens of round trips and
several seconds of wall time. That part is a projection from the 105 ms figure, not a
measurement — the paginated endpoints need a token and no login credential was
available.

**ap-south-1 is Mumbai, which is the wrong side of the Bay of Bengal from Vietnam.**
`ap-southeast-1` (Singapore) would cut the round trip substantially. The region cannot
be changed on an existing Supabase project, so improving this means creating a new one
and restoring the dump again — about a minute of work, given the script already exists.

#### Supabase connection details, for reference

**Measured: this VM has no IPv6 at all.** No global address, no default route,
`curl -6` returns nothing on the host and inside a container, and Docker's bridge has
IPv6 disabled. Supabase's direct connection host resolves to AAAA only, unless the
paid IPv4 add-on is enabled, so **the direct connection string cannot work here.**
DNS does return the AAAA record, so the failure looks like a hang, not a DNS error.

Confirmed in practice: the pooler host resolves to the IPv4 address `65.0.195.55`,
which is exactly why it works from a machine with no IPv6.

Use the **session** pooler, port 5432:

```
SPRING_DATASOURCE_URL=jdbc:postgresql://aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require
DB_USERNAME=postgres.<project-ref>
DB_PASSWORD=<the database password>
```

Three details that each cause a different failure:

- **Session mode (5432), not transaction mode (6543).** Transaction pooling multiplexes
  connections and breaks server-side prepared statements, which Hibernate leans on
  heavily. If you must use 6543, add `prepareThreshold=0`.
- **`DB_USERNAME` is now a real knob.** The pooler wants `postgres.<project-ref>`, not
  `postgres`. Before this step `application-prod.yml` hardcoded the username, so this
  was simply not expressible.
- **`sslmode=require`.** The old URL carried `useSSL=false&useUnicode=true`, which are
  *MySQL* driver parameters. The Postgres driver ignores them, so the file read as
  though SSL were disabled while it was doing something else entirely. Both are gone.

#### What to load into Supabase, and a correction

Earlier this document said to load `schema.sql` and the two function files. That is
**not sufficient**, and the test proved it.

`schema.sql` creates only **11 tables**: `role`, `account`, `participant`, `following`,
`liking`, `attachment`, `comment`, `conversation`, `message`, `post`, `setting`. The
other eight — `device_metadata`, `hashtag`, `hashtag_rel_post`, `notification`,
`account_report`, `post_report`, `comment_report`, `report_template` — exist only
because Hibernate's `ddl-auto: update` creates them at boot. That is why the VM showed
19 base tables after the init scripts plus one backend start.

The visible consequence: `getlastestloginlocationperaccount()` fails with
`relation "device_metadata" does not exist` on a schema built from `schema.sql` alone.

**So restore the dump instead** — `container/data/*.sql` carries all 19 base tables, all
14 functions and the data. Follow *Restoring a dump into this stack* above; on a fresh
Supabase project there is no init-script schema to clear first.

Version compatibility was checked rather than assumed: all three SQL files load into
**Postgres 17.11 with 0 errors**, and no file contains anything Supabase would refuse
(no `CREATE DATABASE`, no `\connect`, no `OWNER TO`, no role or grant statements, no
extensions, no `search_path`).

#### Vercel: what was wrong and is now fixed

`frontend/vercel.json` now exists. Set the project's **Root Directory to `frontend`**,
because the repository root is the Spring Boot project.

Three things would each have broken the first deployment:

- **The default build fails.** Vercel sets `CI=1`, and Create React App treats every
  warning as an error when `CI` is set. This project has **412 ESLint warnings** (347
  `no-unused-vars`, 38 `react-hooks/exhaustive-deps`, 20 `jsx-a11y/alt-text`, 6
  `array-callback-return`, 1 `no-dupe-keys`). Measured: `CI=true` exits 1 with
  "Treating warnings as errors" and leaves no usable bundle; `CI=false` exits 0 and
  produces 20 MB. Hence `"buildCommand": "CI=false npm run build"`. Clearing 412
  warnings is a real cleanup, not a deployment step.
- **There was no `build` script.** `package.json` had only `build:prod`, which is bound
  to `env-cmd` and the dead `.env.production`. Vercel's CRA preset wants `npm run
  build`. The standard script has been added.
- **`npm install` is not enough.** It has to be `npm install --force`, for the
  `react-konva` reason in `tech.md`. Hence `"installCommand"`.

Also pinned `engines.node` to `22.x`. Vercel disabled Node 20 on 1 October 2026 and
Node 18 before that, so 22 is the lowest usable LTS. Verified: `react-scripts` 5 builds
cleanly on Node 22.23.3.

Set these in **Project Settings → Environment Variables**, as absolute URLs:

```
REACT_APP_API_URL=https://<tunnel-host>/api
REACT_APP_SOCKET_URL=https://<tunnel-host>/ws
```

`.env.production` is committed and still holds the relative `/api` and `/ws`, which is
correct for `npm run build:prod` behind nginx. Real environment variables win over it,
because dotenv never overwrites an existing `process.env` entry — verified by searching
the built bundle, which contained the absolute URLs and neither `vivacon.cf` nor
`localhost:8090`. The trap is forgetting to set them: the build then quietly uses `/api`
and the deployed site calls `https://<project>.vercel.app/api/v1/...`, which 404s.

#### On the backend, once the frontend is on Vercel

```
FRONTEND_ALLOWED_ORIGINS=https://<project>.vercel.app,https://*.vercel.app
```

The second entry covers Vercel's per-deployment preview URLs. One property drives both
CORS and the WebSocket handshake, so getting it wrong fails loudly in both places
rather than half-working.

**CORS used to accept everything.** `corsFilter` called
`addAllowedOriginPattern("*")` together with `setAllowCredentials(true)`, which reflects
whatever `Origin` arrives and adds `Access-Control-Allow-Credentials: true` — meaning
any site on the internet could call this API from a visitor's browser and read the
reply. It is now restricted to the configured list; entries containing `*` are
registered as patterns so `https://*.vercel.app` works. Measured: the configured origin
gets a 200 preflight with the right headers, while `evil.example.com`,
`attacker.vercel.app` and an unlisted `localhost:3000` all get 403 and no
`Access-Control-Allow-Origin`.

One consequence to remember: running the CRA dev server on `:3000` against a
prod-profile backend now requires adding `http://localhost:3000` to that list.

#### The cross-origin cookie worry was wrong

An earlier version of this document said the JWT cookie would need `Secure` and
`SameSite=None` once the frontend and backend were on different origins. **That is not
how this application authenticates.**

`utils/cookie.js` stores the token with `js-cookie` under `sameSite: 'Lax'`, on the
*frontend's* origin, and the axios request interceptor copies it into an
`Authorization: Bearer` header. The backend is `SessionCreationPolicy.STATELESS` with
CSRF disabled and `JWTRequestFilter` reads that header. The cookie is client-side
storage that never crosses an origin, so `SameSite=None` is irrelevant to whether login
works cross-origin.

`withCredentials: true` is set on the axios instance but earns nothing here, since the
backend origin has no cookies to send. It does have one real effect: it forces the
preflight to demand `Access-Control-Allow-Credentials: true` and a specific, non-wildcard
`Access-Control-Allow-Origin`, which is exactly why the origin list has to be right.

HTTPS is still required, for the mixed-content and `wss` reasons above. Just not for
this reason.

#### The tunnel is up

`docker-compose.tunnel.yml` adds a `cloudflared` service. It is a **separate file on
purpose** and has to be named explicitly:

```bash
docker compose -f docker-compose.yml -f docker-compose.tunnel.yml up -d
```

Exposing a stack to the internet should be a deliberate act, not something the default
`up` does.

**No `sudo` was needed.** `cloudflare/cloudflared` is an official image and the VM user
is already in the `docker` group, so unlike the Docker install itself this needed
nothing by hand.

The tunnel points at **`http://frontend:80`**, the nginx container, not at the backend.
nginx already proxies `/api` and `/ws`, so a single hostname serves static files, the
API and the WebSocket with no additional configuration.

Measured, from Windows over public HTTPS through Cloudflare's edge: `/` and `/newsfeed`
return index.html, `/api/v1/post` returns 401, `/api/v1/account/check?username=admin`
returns the admin account, and the certificate is a valid TLS 1.3 cert from Google
Trust Services for `trycloudflare.com`. The edge connection negotiated QUIC to
`sin07`, and cloudflared's own precheck confirmed both UDP and HTTP/2 paths work, so
VMware's NAT does not block UDP 7844.

##### Two traps, both already paid for

**`cloudflared` has no shell.** The image is distroless with
`ENTRYPOINT ["cloudflared", "--no-autoupdate"]`. The first version of the compose file
wrapped the command in `sh -c '...'`, which meant the entire string was handed to
*cloudflared as arguments*. It replied "You did not specify any valid additional
argument to the cloudflared tunnel command" and restarted forever — `--url` was right
there in the file and never reached the program. Pass plain argv instead; the command
now comes from `TUNNEL_COMMAND`, defaulting to `tunnel --url http://frontend:80`.

**A quick tunnel's hostname changes every time the container is recreated.** This bit
immediately: a `docker compose up -d` recreated `cloudflared`, and `.env` was left
pointing at `department-providence-lay-talked...` while the tunnel was actually serving
`span-arising-conjunction-administration...`. Two rules follow:

- Read the hostname from the **running container's logs**, never from a saved file.
- Restart only what needs restarting — `up -d backend`, not `up -d`. Recreating
  `cloudflared` changes the hostname, which invalidates the origin list *and* forces a
  Vercel rebuild, since `REACT_APP_*` is baked in at build time.

##### The WebSocket needed the same pattern fix as CORS

Allowing `https://*.vercel.app` for CORS was not enough. Spring's
`setAllowedOrigins` compares the `Origin` header **literally**, so an entry containing
`*` simply never matches; patterns have to go through `setAllowedOriginPatterns`.
Left alone, Vercel would have produced the worst kind of bug: the API works, the page
loads, and only chat and notifications are dead.

`STOMPMessageBrokerConfiguration` now splits the list the same way `corsFilter` does.
Measured through the tunnel:

| `Origin` | `/ws/info` | CORS preflight |
|---|---|---|
| the tunnel hostname itself | 200 | — |
| `https://vivacon-demo.vercel.app` | 200 | allowed |
| `https://abc-git-main-x.vercel.app` (preview shape) | 200 | — |
| `https://evil.example.com` | 403 | refused |
| `https://vercel.app.evil.com` | **403** | **refused** |

That last row is the one worth keeping. A naive implementation that merely looked for
the substring `vercel.app` would have accepted an attacker-controlled domain.

##### Vercel is optional, and here is the honest trade-off

The app is **already fully working on HTTPS** at the tunnel hostname, served by nginx:
same origin for everything, no CORS involved, nothing to rebuild when anything moves.

What Vercel actually buys is static delivery. Measured: the bundle is **4.2 MB** and
Cloudflare returns `cf-cache-status: DYNAMIC` for it, meaning a quick tunnel caches
nothing and every visitor pulls those 4.2 MB from the VM over a home connection.
Vercel's CDN would cache and serve that from an edge near the user.

What it costs is the thing this whole section has been working around: the frontend
moves to a different origin, so the bundle needs absolute URLs, the backend needs an
accurate origin list, the WebSocket cannot be proxied, and a changing tunnel hostname
means a rebuild. Worth it for a real audience; not worth it to prove the stack works.

#### Measured against the live deployment

| Check | Result |
|---|---|
| `/`, `/newsfeed`, any other path | 200 index.html, so react-router works |
| `REACT_APP_API_URL` baked into the bundle | the tunnel host + `/api` |
| `REACT_APP_SOCKET_URL` | the tunnel host + `/ws` |
| Any trace of `vivacon.cf` | none |
| `/api/v1/account/check` with `Origin:` the Vercel host | 200 JSON, correct `Allow-Origin` |
| `/api/v1/post` without a token | 401 |
| `/ws/info` with `Origin:` the Vercel host | 200 |
| CORS preflight from the Vercel host | 200, `Allow-Origin` exact, `Allow-Credentials: true` |
| `/ws/info` with `Origin: https://evil.example.com` | 403 |

Two findings came out of checking rather than assuming.

**Vercel injects its own variables into the bundle, 18 of them.** With the CRA preset
it prefixes them `REACT_APP_`, and CRA inlines anything with that prefix, so the
public bundle now contains `REACT_APP_VERCEL_GIT_COMMIT_AUTHOR_NAME`,
`..._AUTHOR_LOGIN`, `..._REPO_OWNER`, `..._PROJECT_ID`, `..._DEPLOYMENT_ID`, the commit
SHA and the full commit message. No credentials, and this repository is public anyway,
so the practical impact here is small — but it is a real author-name-and-internal-id
disclosure that would matter on a private repo. It can be turned off under
*Project Settings → Environment Variables → Automatically expose System Environment
Variables*.

This also caused a false alarm in my own verification: the first version asserted "the
Vercel host must not appear anywhere in the bundle", which failed on
`REACT_APP_VERCEL_PROJECT_PRODUCTION_URL`. The assertion was wrong, not the
deployment. The check now reads the **actual value** of `REACT_APP_API_URL` instead of
grepping for a substring — a reminder that a test asserting the wrong thing is worse
than no test, because it costs time and credibility.

**`https://<site>.vercel.app/api/v1/post` returns 200 with HTML, not 404.** The
catch-all rewrite to `index.html` sees to that. So if the `REACT_APP_*` variables are
ever missing, axios receives HTML and fails with `Unexpected token <` rather than
anything that points at the real cause. Worth knowing before it costs an afternoon.

#### Operational notes for this deployment

- **The tunnel hostname is ephemeral.** It is a quick tunnel, so a `cloudflared`
  restart issues a new hostname, and then the two Vercel variables are stale.
  Updating them is **not enough** — `REACT_APP_*` is baked in at build time, so a
  **redeploy** is required. A named tunnel (`TUNNEL_TOKEN` plus
  `TUNNEL_COMMAND=tunnel run`) with a real domain is the fix, and needs a Cloudflare
  account.
- `main` is now the production branch, so every push to it triggers a Vercel deploy.
- Three origins are allowed: the VM's LAN address for debugging, the tunnel hostname,
  and `https://*.vercel.app`. The last one covers preview deployments as well as
  production.

#### Reproducing this from scratch

1. **Supabase project** — create it, restore the dump with
   `config/supabase-restore.ps1`, and put the session pooler host,
   `postgres.<project-ref>` username and password in `config/supabase.env`.
2. **Cloudflare Tunnel** — `docker compose -f docker-compose.yml -f
   docker-compose.tunnel.yml up -d`. No account and no `sudo`, because `cloudflared`
   runs as a container. Then `config/vm-tunnel-origins.sh` reads the assigned hostname
   from the running container and syncs `FRONTEND_ALLOWED_ORIGINS`.
3. **Vercel project** — import the repository, Root Directory `frontend`, and add the
   two `REACT_APP_*` variables pointing at the tunnel hostname.

**Order matters.** The tunnel hostname has to exist *before* the Vercel build, because
`REACT_APP_*` is baked into the bundle and cannot be read at runtime. The backend's
origin list, by contrast, is read at startup and needs only a restart.

## Known blockers unrelated to any single step

- Email cannot be sent until `MS_OAUTH_*` is filled in. The mailbox is a personal
  Microsoft account, so the client-credentials flow is unavailable and a refresh token
  has to be obtained once through an interactive browser consent. See the comments in
  `config/application-dev.yml`.
- The `prod` Maven profile builds the frontend from `../Vivacon-UI`, a directory that
  does not exist here. It is stale and unused by the Docker build.
- **The statistics stored functions are not safe to call concurrently.** Each of
  `postQuantityStatisticInRecentMonths`, `postQuantityStatisticInQuarters`,
  `userQuantityStatisticInRecentMonths` and their siblings begins by dropping and
  recreating a *permanent* view in `public` — `month_year`, `quarter_year` or
  `list_year`. Two dashboard requests arriving together on different connections race
  on the same view, which shows up as an intermittent "relation does not exist" or a
  dependency error, never reproducible on demand. The views only generate a 12, 4 or 2
  row calendar from a `VALUES` list, so the fix is to inline them as CTEs and delete the
  views. Pre-existing, unrelated to Supabase, and not yet fixed. Confirmed that the
  leaked views outlive the call and are captured by `pg_dump`: they arrived in Supabase
  along with the restored data.
- **Supabase adds roughly 105 ms to every database round trip** from here, because the
  project sits in `ap-south-1`. Endpoints that query once are fine; anything that
  queries per list item will feel it. Moving to `ap-southeast-1` needs a new project.
- 412 ESLint warnings in the frontend, which is why the Vercel build has to run with
  `CI=false`. Mostly `no-unused-vars`, but 20 are `jsx-a11y/alt-text`, so there is a
  genuine accessibility gap behind that number.
- Credentials committed before this work started remain in git history on a public
  repository. Removing them from the current files does not undo that; they need
  rotating at AWS, Cloudinary, the mail provider, and Postgres.
