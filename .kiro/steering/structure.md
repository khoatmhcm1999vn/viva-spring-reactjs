---
inclusion: fileMatch
fileMatchPattern:
  - "src/**/*"
  - "frontend/**/*"
  - "pom.xml"
  - "container/**/*"
  - "mock_data/**/*"
  - "postman_collection/**/*"
  - "docs/**/*"
---

# Project Structure — Vivacon

> Chỉ áp dụng cho **Vivacon**. Cấu trúc của `coffee-shop/` nằm ở
> `coffee-shop-stack.md`.

```
/
├── pom.xml, mvnw(.cmd), .mvn/      Maven build + wrapper
├── Dockerfile, docker-compose.yml  Backend image; postgres + adminer
├── GeoLite2-City.mmdb              MaxMind geo DB, loaded from the working dir
├── src/                            Spring Boot backend
├── frontend/                       React SPA (CRA)
├── container/prepare/              schema.sql, stored procedures, init-db.sh
├── mock_data/                      data.sql + txt seed lists for data generators
└── postman_collection/             per-feature API collections
```

## Backend — `src/main/java/com/vivacon/`

Layered by technical concern, not by feature. Entry point: `VivaconApplication.java`.

| Package | Contents |
|---|---|
| `controller/` | `@RestController`s, one per resource; `controller/report/` for the moderation endpoints |
| `service/` | Interfaces; `service/impl/` holds the `*Impl` classes. `service/report/` and `service/recommendation/` keep interface + impl together |
| `repository/` | Spring Data JPA repositories (+ `repository/report/`) |
| `dao/` | Hand-written data access for statistics and complex reads; `dao/impl/` calls PostgreSQL stored procedures via `EntityManager` |
| `entity/` | JPA entities, `entity/enum_type/`, `entity/report/` |
| `dto/` | `dto/request/`, `dto/response/`, `dto/sorting_filtering/` (`PageDTO`, `PostFilter`, `PostSpecification`, `QueryCriteria`) |
| `mapper/` | `@Component` mappers wrapping ModelMapper; also enrich DTOs with counts and current-user flags |
| `event/` | Spring `ApplicationEvent`s; `event/handler/` listeners; `event/notification_provider/` (`EmailSender`, `WebsocketSender`) |
| `configuration/` | `@Configuration` beans (S3, Cloudinary, email, Swagger, STOMP broker, scheduling, geolocation) |
| `security/` | `HTTPSecurityConfiguration`, `JWTRequestFilter`, `UserDetailImpl`, `ResourceRestrictionService` |
| `exception/` | Custom exceptions + `GlobalExceptionHandler` |
| `common/` | `constant/`, `enum_type/`, `utility/`, `validation/` (custom constraint annotations + validators), `data_generator/`, `relational_db/` |

Tests live in `src/test/java/com/vivacon/` and are currently just the context-load smoke test.

### Backend conventions

- **Constructor injection**, no field `@Autowired`. Fields are plain `private` (not `final`) — match the existing style.
- Controllers are thin: validate with `@Valid`, delegate to a service, return the DTO directly (not `ResponseEntity`) unless there is no body.
- Every endpoint is annotated with Springfox `@Api` / `@ApiOperation`.
- Base path comes from `Constants.API_V1` (`/api/v1`): `@RequestMapping(value = Constants.API_V1 + "/post")`.
- Paging/sorting query params are the conventional set: `_sort`, `_order`, `limit`, `page`, with optional filters wrapped in `Optional<...>`. Build pageables through `PageableBuilder`; return `PageDTO<T>` via `PageMapper.toPageDTO`.
- Entities extend `AuditableEntity` (`createdBy`, `createdAt`, `lastModifiedBy`, `lastModifiedAt`, `active`) and use explicit sequence generators (`@SequenceGenerator(name = "post_id_generator", sequenceName = "post_id_seq", allocationSize = 1)`). Deletes are soft — flip `active`.
- Entities are hand-written POJOs with explicit getters/setters and both a no-arg and an all-args constructor. No Lombok in this project.
- Imports are listed individually, never wildcarded.
- Missing records throw `RecordNotFoundException` via `orElseThrow(RecordNotFoundException::new)`.
- All user-facing strings, URL whitelists, and STOMP destinations belong in `common/constant/Constants.java`.
- Side effects (notifications, emails, report follow-ups) go through `ApplicationEventPublisher` + a handler in `event/handler/`, not inline in the service.
- Statistics work belongs in `dao/` against the stored procedures in `container/prepare/functions/`, not in JPA repositories.

## Frontend — `frontend/src/`

```
api/              one service module per domain + axiosConfig.js + constants.js
components/
  common/         shared UI, one folder per component
  pages/          route-level pages (LoginPage, ProfilePage, ChatPage, ...)
  dashboard/      admin area: dashboard/src/ (incl. pages/) and dashboard/charts/
constant/         static data, emoji list, enum-like `types.js`
globalSocketState/ Context + reducer + actions for WebSocket state
hooks/            useSocket, useInfiniteList, useLoading, useSnackbar, ...
locales/en|vi/    translation.json
translation/      i18n.js setup + helpers
styles/           shared SCSS (colors.scss)
utils/            cookie, jwtToken, calcDateTime, checkValidInput, resolveData, emoji
assets/, images/, audio/
App.js            app shell; declares AuthUser / Loading / Snackbar / UpdateProfile contexts
routes/routes.js  Switch-based routing with the PrivateRoute wrapper
```

### Frontend conventions

- **One folder per component**, containing `index.js` plus a colocated `style.scss` imported as `import "./style.scss";`. Component folders are `PascalCase`.
- Function components with hooks only. Named arrow components (`const CommentItem = ({ ... }) => {}`) or `function App()`; default export at the bottom.
- Absolute imports from `src` (`components/...`, `api/...`, `hooks/...`, `utils/...`). Relative imports appear in older files but prefer absolute for new code.
- All HTTP calls live in `api/*Service.js` as thin `async` wrappers over the shared `axiosConfig` instance; paths are composed from `API_ENDPOINT_KEYS` in `api/constants.js`. Never call `axios` directly from a component.
- `axiosConfig` already handles the `Bearer` header and the 401 → refresh-token retry. Don't re-implement auth per request.
- Cross-cutting state goes through Context: the providers in `App.js` and `globalSocketState/`. Consume via the `hooks/` wrappers (`useLoading`, `useSnackbar`, `useSocket`) rather than `useContext` ad hoc where a hook exists.
- User-facing text goes through `useTranslation()` and both `locales/en/translation.json` and `locales/vi/translation.json` — add keys to both.
- MUI components for controls and layout; SCSS for custom styling; `classnames` for conditional class names.
- Lists that scroll use `react-infinite-scroll-component` plus the `useInfiniteList` / `useInfiniteReverseList` / `useNewsfeedInfiniteList` hooks, which expect the backend's `PageDTO` shape.
