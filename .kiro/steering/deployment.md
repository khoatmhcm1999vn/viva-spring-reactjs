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

## Remaining

### 6. Frontend image

No Dockerfile yet. A static CRA build served by nginx, with nginx proxying `/api` and
`/ws` to the backend. The catch: `REACT_APP_*` values are baked in at build time, so
either the image is rebuilt per environment or the frontend calls relative paths and
lets nginx decide the target. The second option is preferable. The WebSocket proxy
needs the `Upgrade` and `Connection` headers or SockJS will not connect.

`.env.production` currently points at `http://vivacon.cf`, a domain that is gone.

### 7. Full stack in compose

Three services: `db`, `backend`, `frontend`.

Two blockers, both real:

- **`Constants.FE_URL` is hardcoded** to `http://localhost:3000` and is handed to
  `registerStompEndpoints(...).setAllowedOrigins(FE_URL)`. Served from any other
  host, the SockJS handshake is rejected and chat plus notifications fail silently.
  It has to become configuration before this step.
- **The current `docker-compose.yml` would destroy the database.** It declares no
  named volume, so the seeded data lives in an anonymous volume, and it sets no
  `POSTGRES_DB`, so a fresh container would not even create `vivacon`. Dump the
  database before touching that file.

### 8. Ubuntu VM

Mostly a copy of step 7. Secrets must come from the environment, not from
`./config/`, which is gitignored and machine-local.

### 9. Supabase and Vercel

- **Supabase** for Postgres: load `container/prepare/schema/schema.sql` and both files
  in `container/prepare/functions/`. The statistics and chat endpoints call those
  functions by name and break without them. Supabase requires SSL, so the URL needs
  `sslmode=require`; also drop `useSSL=false&useUnicode=true`, which are MySQL
  parameters the Postgres driver ignores.
- **Vercel cannot run this backend.** It hosts static output and serverless functions,
  not a long-lived JVM, and it does not hold WebSocket connections. Frontend on Vercel
  is fine; the backend needs the VM from step 8, or Render, Railway or Fly.
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
