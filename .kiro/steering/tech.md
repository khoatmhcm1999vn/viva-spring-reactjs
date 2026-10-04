# Tech Stack & Commands

## Backend

- **Java 11**, **Spring Boot 2.5.2**, Maven (wrapper committed: `mvnw` / `mvnw.cmd`)
- Artifact: `com:Vivacon:0.0.1-SNAPSHOT` → `target/Vivacon-0.0.1-SNAPSHOT.jar`
- Starters: `web`, `data-jpa`, `security`, `websocket`, `validation`, `mail`, `thymeleaf`, `actuator`. Note `mail` is now dead weight: email goes through the Microsoft Graph REST API, not SMTP, so no `JavaMailSender` is built any more.
- **PostgreSQL 14** + Hibernate (`ddl-auto: update`, `generate-ddl: true`), UTC JDBC timezone
- **JJWT 0.9.1** for access/refresh tokens; `spring-security-messaging` for WebSocket auth
- **ModelMapper 2.3.5** for entity ↔ DTO mapping
- **Springfox 3.0.0** (`springfox-boot-starter`) for Swagger. With the dev profile the UI is at **http://localhost:8090/swagger-ui/index.html** and the spec at `/v3/api-docs` (80 paths). Springfox 3 serves `/v3/api-docs`, not the `/v2/api-docs` that older setups used, and the UI reads `/swagger-resources*`; all of those must stay in `Constants.URL_WHITELIST` or the page loads with an empty operation list.
- **Cloudinary** (`cloudinary-http44`) and **AWS S3 SDK 1.11.163** for image storage
- **uap-java** (user-agent parsing) + **MaxMind GeoIP2 2.15.0** with `GeoLite2-City.mmdb` at the repo root
- Custom Hibernate `metadata_builder_contributor` (`SQLFunctionsMetadataBuilderContributor`) registers SQL functions used by statistics queries

## Frontend (`frontend/`)

- **React 17** + **react-scripts 5** (Create React App, not ejected), JavaScript only (no TypeScript)
- **react-router-dom 5** (`Switch` / `Route` / `Redirect`, not v6 APIs)
- **MUI 5** (`@mui/material`, `@mui/icons-material`, emotion) + **SCSS** (`sass`)
- **axios 0.26** with a shared configured instance
- **@stomp/stompjs** + **sockjs-client** for realtime
- **react-i18next** / **i18next** with JSON locale files
- Charts/maps: **apexcharts**, **chart.js**, **react-simple-maps**, **@react-google-maps/api**
- Image editing: **filerobot-image-editor**, **react-avatar-editor**, **@toast-ui/react-image-editor**
- `redux`, `react-redux`, `redux-saga`, `redux-persist` are installed but the app actually uses **React Context + `useReducer`** (see `globalSocketState/` and the contexts in `App.js`). Prefer Context; don't introduce Redux.
- `lodash` and `moment` are imported in components but `lodash` is **not** declared in `package.json`. Avoid adding new `lodash` usage; declare it if you must.

## Commands

Backend (from repo root). Point `JAVA_HOME` at JDK 11 first; the machine default may be newer:

```powershell
$env:JAVA_HOME="C:\Program Files\Java\jdk-11"
.\mvnw spring-boot:run          # dev profile, serves on :8090
.\mvnw clean package            # build the jar
.\mvnw test                     # run tests
.\mvnw clean package -P prod    # prod profile (see caveat below)
```

Frontend (from `frontend/`). Use `--force`, not `--legacy-peer-deps`: the latter skips peer resolution and leaves `ajv` and `ajv-keywords` on incompatible majors, which breaks the dev server with `Cannot find module 'ajv/dist/compile/codegen'`:

```powershell
npm install --force
npm run start:dev    # CRA dev server on :3000, loads .env.development
npm run build:prod   # production build, loads .env.production
npm test             # watch mode; use `npm test -- --watchAll=false` for one-shot
```

Quick check that the stack is alive:

```powershell
# backend
curl http://localhost:8090/actuator/health      # {"status":"UP"}
# API docs
start http://localhost:8090/swagger-ui/index.html
# frontend
start http://localhost:3000
```

Database:

```powershell
docker compose up -d   # postgres:14 on :5432, adminer on :8900
```

`container/prepare/` holds `schema/schema.sql`, the stored procedures in `functions/` (`message_functions.sql`, `statistic_function.sql`), and `sh/init-db.sh`. Statistics endpoints call those procedures by name, so they must be loaded into the database. `mock_data/` contains `data.sql` plus word/name/image seed lists used by `common/data_generator`.

Docker image: `Dockerfile` expects `target/Vivacon-0.0.1-SNAPSHOT.jar` to already be built, so run `mvnw clean package` before `docker build`.

## Configuration

- `src/main/resources/application.yml` selects the profile; real settings live in `application-dev.yml` and `application-prod.yml`. Custom keys sit under `vivacon.*` (verification, jwt, verification_token, email) and `aws.*`.
- **Secrets are not in the tracked YAML.** Every credential there is an empty-defaulted placeholder such as `${DB_PASSWORD:}`. Real values go in `./config/application-{profile}.yml`, which is gitignored and which Spring Boot reads at higher precedence than the classpath, or in environment variables: `DB_PASSWORD`, `JWT_SECRET_SALT`, `MAIL_FROM_ADDRESS`, `MS_OAUTH_CLIENT_ID`, `MS_OAUTH_CLIENT_SECRET`, `MS_OAUTH_REFRESH_TOKEN`, `CLOUDINARY_*`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`. A fresh clone will not boot until those exist, since an empty datasource password fails at startup.
- `vivacon.verification.bypass` skips email verification: new accounts are created `ACTIVE`, an account stuck at `STILL_NOT_ACTIVE` is activated on login, and the six-digit code is logged instead of generated silently. It is `true` in the dev profile and explicitly `false` in prod. It relaxes an authentication control, so never enable it on a deployed environment.
- Frontend env vars are `REACT_APP_*` in `frontend/.env.development` / `.env.production`, loaded via `env-cmd` (not CRA's default `.env` resolution).
- `frontend/jsconfig.json` sets `baseUrl: ./src`, so imports are absolute from `src`: `import x from "components/common/Navbar"`, `"api/postService"`, `"utils/cookie"`, `"hooks/useSocket"`. Use these instead of long relative chains.

## Known config caveats

- Backend dev port is **8090**, matching `REACT_APP_API_URL` in `.env.development`. The prod profile still uses 8080.
- `Constants.FE_URL` is hardcoded to `http://localhost:3000` and is used for the CORS/SockJS allowed origins and email links. It has to become configurable before the app is served from any other host, or the SockJS handshake will be rejected and chat plus notifications will fail silently.
- Email cannot actually be sent until `MS_OAUTH_*` is filled in. The mailbox is a personal Microsoft account, so `client_credentials` is unavailable and a refresh token has to be obtained once through an interactive browser consent. Basic SMTP auth is dead: a direct test returns `535 5.7.3`.
- `frontend/package.json` pins `react-konva` to the exact prerelease `17.0.2-6` through `overrides`, because a transitive open range (`>=17.0.0`) otherwise resolves to a React 19 build that fails against React 17. Do not relax that to a caret range; the React 17 line has no plain releases.
- `package-lock.json` is gitignored by project choice, so dependency resolution is not reproducible across machines. The `overrides` block is the only thing holding the tree together.
- The `prod` Maven profile builds the frontend from `../Vivacon-UI`, which does not exist in this repo (the frontend is `frontend/`). The profile is stale.
- `application-prod.yml` still points at an AWS RDS endpoint that is almost certainly gone.
