# Tech Stack & Commands

## Backend

- **Java 11**, **Spring Boot 2.5.2**, Maven (wrapper committed: `mvnw` / `mvnw.cmd`)
- Artifact: `com:Vivacon:0.0.1-SNAPSHOT` → `target/Vivacon-0.0.1-SNAPSHOT.jar`
- Starters: `web`, `data-jpa`, `security`, `websocket`, `validation`, `mail`, `thymeleaf` (email templates), `actuator`
- **PostgreSQL 14** + Hibernate (`ddl-auto: update`, `generate-ddl: true`), UTC JDBC timezone
- **JJWT 0.9.1** for access/refresh tokens; `spring-security-messaging` for WebSocket auth
- **ModelMapper 2.3.5** for entity ↔ DTO mapping
- **Springfox 3.0.0** (`springfox-boot-starter`) for Swagger — `/swagger-ui/`
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

Backend (from repo root):

```powershell
.\mvnw spring-boot:run          # run with the default `dev` profile
.\mvnw clean package            # build the jar
.\mvnw test                     # run tests
.\mvnw clean package -P prod    # prod profile (see caveat below)
```

Frontend (from `frontend/`):

```powershell
npm install
npm run start:dev    # CRA dev server on :3000, loads .env.development
npm run build:prod   # production build, loads .env.production
npm test             # watch mode; use `npm test -- --watchAll=false` for one-shot
```

Database:

```powershell
docker compose up -d   # postgres:14 on :5432, adminer on :8900
```

`container/prepare/` holds `schema/schema.sql`, the stored procedures in `functions/` (`message_functions.sql`, `statistic_function.sql`), and `sh/init-db.sh`. Statistics endpoints call those procedures by name, so they must be loaded into the database. `mock_data/` contains `data.sql` plus word/name/image seed lists used by `common/data_generator`.

Docker image: `Dockerfile` expects `target/Vivacon-0.0.1-SNAPSHOT.jar` to already be built, so run `mvnw clean package` before `docker build`.

## Configuration

- `src/main/resources/application.yml` selects the profile; real settings live in `application-dev.yml` and `application-prod.yml`. Custom keys sit under `vivacon.*` (jwt, verification_token, email) and `aws.*`.
- Frontend env vars are `REACT_APP_*` in `frontend/.env.development` / `.env.production`, loaded via `env-cmd` (not CRA's default `.env` resolution).
- `frontend/jsconfig.json` sets `baseUrl: ./src`, so imports are absolute from `src`: `import x from "components/common/Navbar"`, `"api/postService"`, `"utils/cookie"`, `"hooks/useSocket"`. Use these instead of long relative chains.

## Known config caveats

- Backend dev port is **8080**, but `.env.development` points the frontend at **8090**. Expect to reconcile one of them (or a proxy) when running locally.
- `Constants.FE_URL` is hardcoded to `http://localhost:3000` and is used for CORS/SockJS allowed origins and email links.
- The `prod` Maven profile builds the frontend from `../Vivacon-UI`, which does not exist in this repo (the frontend is `frontend/`). The profile is stale.
