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
| `frontend` | 8081          | 8081   | nginx, the address to open |
| `backend`  | 8091          | none   | Swagger and debugging in dev only |
| `db`       | 5433          | none   | Postgres 14 |
| `adminer`  | 8901          | absent | database browser, server `db` |

Measured in deploy mode: port 8081 open, ports 8091, 5433 and 8901 all closed, and the
application still fully works through the proxy.

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
otherwise try to drop the database it is connected to. Do that filtering on the host,
not with `grep` inside `sh -c`, where the escaping is easy to get wrong.

## Remaining

### 9. Ubuntu VM

Partly exercised, on WSL2 rather than a real server. The procedure below has been run
end to end and works:

```bash
git clone -b <branch> <repo> && cd viva-spring-reactjs
cp .env.example .env            # then fill it in
docker compose -f docker-compose.yml up -d --build
```

**The WSL2 Ubuntu on this machine is not a separate host.** `docker ps` inside it
lists the same containers as Windows, same engine version and build: it uses the
Docker Desktop daemon through WSL integration, and the distro list shows Docker
Desktop's own `docker-desktop` distro alongside `Ubuntu`. Deploying "to the VM" there
redeploys to the same daemon. It proves nothing about a remote host, firewalls, SSH,
or a separately installed engine.

What it did prove, which is worth having: cloning this branch from GitHub into the
WSL filesystem, adding only a `.env` copied from `.env.example`, and running the
deploy-mode command brought the whole stack up with the backend healthy in 15 seconds.
Only port 8081 was open; 8091, 5433 and 8901 were closed. The application worked
through the proxy, the origin whitelist still rejected an unlisted domain, and the
clean clone saw the existing data, `admin / admin@gmail.com`, because the named volume
survived the project moving to a different directory entirely. The checked-out tree
correctly had no `config/` and no `.env`, and the SQL files mounted into Postgres had
LF endings, so there is no CRLF problem on Linux.

One limitation to be honest about: the images came from the daemon's existing layer
cache, so this did **not** demonstrate a from-scratch build on a clean machine. The
first build on a real server will download the full Maven and npm dependency sets.

Four things change relative to a laptop:

1. **`FRONTEND_ALLOWED_ORIGINS` must be the real origin**, for example
   `https://vivacon.example.com`. Verified that this knob works end to end: setting
   it to a domain flipped `/ws/info` to 200 for that domain and to 403 for
   `localhost:8081`, and reverting flipped it back. Get it wrong and the failure is
   silent, because the page still loads and only chat and notifications are dead.
2. **`FRONTEND_PORT=80`**. The 5433 and 8901 offsets in the override exist only to
   dodge the other local project; a clean host does not need them, and in deploy mode
   the database and backend publish nothing anyway.
3. **`.env` has to be created on the server.** `./config/` is a developer-machine
   mechanism and the containers never read it.
4. **The frontend image does not need rebuilding for a new domain**, because the
   bundle only ever uses relative paths.

Still open for a real deployment, none of it verifiable here:

- **TLS.** Nothing in this stack terminates HTTPS. Either put a reverse proxy in front
  of the frontend container, or add a certificate to its nginx. This is not optional
  once step 10 splits the frontend and backend across origins, because the JWT cookie
  will need `Secure` and `SameSite=None`.
- **Image delivery.** The compose file builds from source on the host, which needs the
  full toolchain and about a gigabyte of npm downloads on the VM. Building elsewhere
  and pulling a tagged image is the better arrangement.
- **Backups.** `container/data/` is a developer convenience, not a backup strategy.
- **Rotate the committed credentials first.** They are in git history on a public
  repository; a deployed instance using them is a deployed instance with known
  passwords.

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
