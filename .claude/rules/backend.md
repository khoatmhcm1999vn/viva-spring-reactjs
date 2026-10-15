---
paths:
  - "src/**"
  - "pom.xml"
---

# Backend conventions (`src/main/java/com/vivacon/`)

Layered by technical concern. Entry point `VivaconApplication.java`.

| Package | Contents |
|---|---|
| `controller/` | `@RestController` per resource; `controller/report/` for moderation |
| `service/` | interfaces; `service/impl/` holds `*Impl`. `service/report/`, `service/recommendation/` keep interface + impl together |
| `repository/` | Spring Data JPA (+ `repository/report/`) |
| `dao/` | hand-written reads; `dao/impl/` calls PostgreSQL stored functions via `EntityManager.createStoredProcedureQuery` |
| `entity/` | JPA entities, `entity/enum_type/`, `entity/report/` |
| `dto/` | `request/`, `response/`, `sorting_filtering/` (`PageDTO`, `PostFilter`, `PostSpecification`, `QueryCriteria`) |
| `mapper/` | `@Component` mappers over ModelMapper; enrich DTOs with counts and current-user flags |
| `event/` | `ApplicationEvent`s, `event/handler/`, `event/notification_provider/` (`EmailSender`, `WebsocketSender`) |
| `configuration/` | S3, Cloudinary, Swagger, STOMP broker, scheduling, geolocation, WebSocket security |
| `security/` | `HTTPSecurityConfiguration`, `JWTRequestFilter`, `UserDetailImpl`, `ResourceRestrictionService` |
| `exception/` | custom exceptions + `GlobalExceptionHandler` |
| `common/` | `constant/`, `enum_type/`, `utility/`, `validation/`, `data_generator/`, `relational_db/` |

## Conventions

- Constructor injection, no field `@Autowired`. Fields are plain `private` (not `final`).
- No Lombok: explicit getters/setters, no-arg + all-args constructors. No wildcard imports.
- Thin controllers: `@Valid`, delegate to a service, return the DTO directly (not
  `ResponseEntity`) unless there is no body. Annotate with Springfox `@Api` / `@ApiOperation`.
- Base path from `Constants.API_V1` (`/api/v1`):
  `@RequestMapping(value = Constants.API_V1 + "/post")`.
- Paging params `_sort`, `_order`, `limit`, `page`, optional filters as `Optional<...>`;
  build with `PageableBuilder`, return `PageDTO<T>` via `PageMapper.toPageDTO`.
- Entities extend `AuditableEntity` (`createdBy`, `createdAt`, `lastModifiedBy`,
  `lastModifiedAt`, `active`) and use explicit sequences
  (`@SequenceGenerator(name = "post_id_generator", sequenceName = "post_id_seq", allocationSize = 1)`).
  Deletes are soft: flip `active`.
- Missing records: `orElseThrow(RecordNotFoundException::new)`.
- User-facing strings, URL whitelists and STOMP destinations go in
  `common/constant/Constants.java`.
- Side effects (notifications, email, report follow-ups) go through
  `ApplicationEventPublisher` + a handler in `event/handler/`, not inline.
- Statistics belong in `dao/` against the stored functions, not JPA repositories.

## Things that bite

- Springfox 3 serves `/v3/api-docs` and `/swagger-resources*`; keep them in
  `Constants.URL_WHITELIST` or Swagger UI loads empty.
- `vivacon.frontend.allowed-origins` (`FRONTEND_ALLOWED_ORIGINS`) drives **both** CORS
  (`HTTPSecurityConfiguration.corsFilter`) and the SockJS handshake
  (`STOMPMessageBrokerConfiguration`). Entries with `*` must go through
  `setAllowedOriginPatterns`; plain `setAllowedOrigins` compares literally. A wrong list
  fails silently for chat/notifications.
- Auth is stateless: frontend copies the JWT from a client-side cookie into
  `Authorization: Bearer`; STOMP uses the `WS-Authorization` header. CSRF is disabled.
- STOMP: endpoint `/ws` (SockJS), app prefix `/app`, broker `/conversation`, `/user`, `/topic`.
- `vivacon.verification.bypass` is `true` in dev, `false` in prod. Never enable it on a
  deployed environment. When on, no flow needs an emailed code: registration creates
  `ACTIVE` accounts, `STILL_NOT_ACTIVE` logins self-activate, new-device logins are recorded
  and allowed (no `1003`), and `POST /account/verification_token` returns
  `{"verificationToken": ...}` so `FindAccountPage` skips `/verify`. That response lets anyone
  who knows an email reset its password, which is why it must stay dev-only.
- `vivacon.security.plaintext-passwords` (`true` in dev, `false` in prod) swaps the
  `PasswordEncoder` bean for `security/DevPlaintextPasswordEncoder`: new passwords are
  stored as plain text so they can be edited in `account.password`, while existing BCrypt
  hashes still match. All encode/match calls go through that one bean
  (`HTTPSecurityConfiguration.passwordEncoder()`); never hash or compare passwords elsewhere.
- Changing password while logged in (`PUT /account/password`) never sends email; it only
  checks the old password. The endpoint has no `@Valid`, so `ChangePasswordRequest`
  annotations are not enforced (frontend sends `confirmNewPassword`, not `matchingNewPassword`).
- Email goes through Microsoft Graph (`MS_OAUTH_*`), not SMTP; `spring-boot-starter-mail`
  is dead weight.
- The `prod` Maven profile builds a frontend from `../Vivacon-UI`, which does not exist.
  It is stale; the Docker build does not use it.
- Tests: only `VivaconApplicationTests` (context load), which needs a reachable database.
