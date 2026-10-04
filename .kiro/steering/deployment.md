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
had created), then the filtered dump. **0 errors.** Afterwards: 22 tables, 14 functions,
54 accounts, 688 posts, 30,552 comments, 1,073 attachments — identical to the Windows
stack. The backend was restarted so Hibernate met the new schema.

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
  its nginx. Not optional once step 10 splits frontend and backend across origins,
  because the JWT cookie will then need `Secure` and `SameSite=None`.
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

## Remaining

### 10. Supabase and Vercel

- **Supabase** for Postgres: load `container/prepare/schema/schema.sql` and both files
  in `container/prepare/functions/`. The statistics and chat endpoints call those
  functions by name and break without them. Supabase requires SSL, so the URL needs
  `sslmode=require`; also drop `useSSL=false&useUnicode=true`, which are MySQL
  parameters the Postgres driver ignores.
- **Vercel cannot run this backend.** It hosts static output and serverless functions,
  not a long-lived JVM, and it does not hold WebSocket connections. Frontend on Vercel
  is fine; the backend needs the VM from step 9, or Render, Railway or Fly.
- Once the two are on different origins: JWTs are kept in cookies and axios sends
  `withCredentials`, so the cookie needs `Secure` and `SameSite=None`, which means
  HTTPS on both ends and `wss` for the socket.

## Known blockers unrelated to any single step

- Email cannot be sent until `MS_OAUTH_*` is filled in. The mailbox is a personal
  Microsoft account, so the client-credentials flow is unavailable and a refresh token
  has to be obtained once through an interactive browser consent. See the comments in
  `config/application-dev.yml`.
- `application-prod.yml` still points at an AWS RDS endpoint that is almost certainly
  retired.
- The `prod` Maven profile builds the frontend from `../Vivacon-UI`, a directory that
  does not exist here. It is stale and unused by the Docker build.
- Credentials committed before this work started remain in git history on a public
  repository. Removing them from the current files does not undo that; they need
  rotating at AWS, Cloudinary, the mail provider, and Postgres.
