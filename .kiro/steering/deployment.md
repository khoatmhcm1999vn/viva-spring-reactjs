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

`docker compose up -d --build` brings up four services. Run it from the repo root
with a `.env` file present; copy `.env.example` and fill in `DB_PASSWORD` and
`JWT_SECRET_SALT`, which compose requires with `${VAR:?}` so a missing value fails
immediately instead of starting half-configured.

| Service    | Host port | Notes |
|------------|-----------|-------|
| `frontend` | 8081      | nginx, this is the address to open |
| `backend`  | 8091      | direct access for Swagger and debugging |
| `db`       | 5433      | Postgres 14 |
| `adminer`  | 8901      | database browser, server `db` |

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

The compose stack is portable as-is. What changes on a server:

- `FRONTEND_ALLOWED_ORIGINS` must list the real origin, or realtime dies silently.
- Ports: the 5433/8901 offsets exist only to avoid the other local project. On a
  clean host, 5432 and 8900 are free again, and `db` need not publish a port at all
  since only the backend talks to it.
- `.env` has to be created on the server. `./config/` is not used by the containers.
- The frontend image needs no rebuild for a new domain, because the bundle only uses
  relative paths.

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
