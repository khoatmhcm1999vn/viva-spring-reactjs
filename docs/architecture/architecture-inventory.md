# Architecture evidence inventory — Vivacon (as-is)

Every node and edge in `docs/architecture/*.mmd` traces back to a row here. Paths are
relative to the repository root; backend Java paths are abbreviated from
`src/main/java/com/vivacon/`.

Snapshot taken on branch `feature/ai-assisted-dev-setup`, October 2026, by reading the
source. Confidence values:

- **Observed**: read in source, config or build files.
- **Inferred**: follows from observed code, but the full path was not traced.
- **Documented only**: stated in `.kiro/steering/deployment.md` or `docs/ARCHITECTURE.md`,
  with no proof available in code. It describes what was deployed, not what the code
  enforces.

Out of scope: `apps/`, `packages/` and `coffee-shop/` sit untracked in the working tree
and belong to an unrelated project. Nothing from them is in any diagram.

## 1. Containers (C4 level 2)

| Component | Responsibility | Source files | Connections | Confidence |
|---|---|---|---|---|
| React SPA | UI for users and admins. Runs in the browser | `frontend/src/index.js`, `frontend/src/App.js`, `frontend/src/routes/routes.js`, `frontend/package.json` (React 17, react-scripts 5, react-router-dom 5) | REST through `api/axiosConfig.js`. STOMP through `hooks/useSocket.js`. Calls SightEngine and Google Maps directly | Observed |
| Web server (nginx) | Serves the built bundle, falls back to SPA routes, reverse-proxies `/api/` and `/ws/` | `frontend/Dockerfile` (stage 2 `nginx:1.27-alpine`), `frontend/nginx.conf.template` | `proxy_pass http://backend_upstream` (`${BACKEND_ORIGIN}`, default `backend:8080`), with WebSocket `Upgrade`/`Connection` on `/ws/` | Observed |
| API application (Spring Boot) | REST `/api/v1/**`, STOMP broker on `/ws`, JWT auth, business logic, the scheduled recommendation job | `pom.xml` (Spring Boot 2.5.2, Java 11), `VivaconApplication.java`, `Dockerfile` (`eclipse-temurin:11-jre`, `EXPOSE 8080`) | JDBC to PostgreSQL, Cloudinary SDK, Microsoft identity platform and Graph through `RestTemplate` | Observed |
| PostgreSQL database | Accounts, posts, social graph, chat, notifications, reports. Stored functions back the statistics and chat search | `application-*.yml` (`org.postgresql.Driver`), `container/prepare/schema/schema.sql`, `container/prepare/functions/*.sql`, `docker-compose.yml` service `db` (`postgres:14`) | Read and written by the API only | Observed |
| GeoLite2-City.mmdb | Offline IP-to-city lookup. A file inside the API image, not a network service | `configuration/GeolocationConfiguration.databaseReader()` (`new FileSystemResource("GeoLite2-City.mmdb")`), `Dockerfile` `COPY GeoLite2-City.mmdb` | Read by `DeviceServiceImpl` | Observed |

## 2. External systems (C4 level 1)

| System | Used for | Caller and evidence | Confidence |
|---|---|---|---|
| Cloudinary | Image storage for post attachments and avatars | `service/impl/CloudinaryServiceImpl.uploadFileToCloudinary` → `cloudinary.uploader().upload(...)`, returning `secure_url`. Bean from `configuration/CloudinaryConfiguration` | Observed |
| Microsoft identity platform | Exchanges a refresh token for a Graph access token | `common/utility/MicrosoftOAuth2TokenProvider` (`TOKEN_ENDPOINT` host `login.microsoftonline.com`) | Observed |
| Microsoft Graph | Sends verification and new-device emails | `event/notification_provider/EmailSender` (`SEND_MAIL_ENDPOINT` `graph.microsoft.com/v1.0/me/sendMail`). Skipped with a warning when OAuth is not configured | Observed |
| SightEngine | Moderates uploaded images. Called **from the browser**, after the upload | `frontend/src/api/imageModerationService.js` `detectImages`, called by `components/common/CreatePostModal` `handleNext` | Observed |
| Google Maps JavaScript API | Map of the user's login locations | `frontend/src/components/pages/LoginActivityPage` (`useJsApiLoader`, `REACT_APP_GOOGLE_MAP_KEY`), rendered by `SettingPage` | Observed |
| GitHub raw content | World TopoJSON for the admin user-location map | `components/dashboard/src/pages/UserActivity/index.js` `geoUrl`. Whether the Dashboard mounts this page was not traced | Inferred |

Present in code but **not drawn**, because no runtime call path reaches them:

| Item | Why it is excluded | Evidence |
|---|---|---|
| AWS S3 | The `AmazonS3` bean is built at startup, but nothing injects `AWSS3Service` outside its own interface and implementation | `configuration/S3Configuration`, `service/impl/AWSS3ServiceImpl`, grep for `AWSS3Service` |
| SMTP / `JavaMailSender` | `spring-boot-starter-mail` is declared, but no class uses it | `pom.xml` and grep |
| Thymeleaf views | The starter is declared and `HomeController` returns the view `"index"`, but there is no `templates/` folder | `controller/HomeController`, `src/main/resources` |
| GeoNames API | The only call site is commented out | `frontend/src/api/googleMapService.js` `getLocationInformation` |
| Redux | Installed, but there is no store and no `Provider` | grep for `createStore`, `react-redux` |
| `@stomp/stompjs` | Declared, but the client imports the legacy `stompjs` 2.3.3 | `frontend/src/hooks/useSocket.js` |

Confirmed absent from the backend: message queues (Kafka, RabbitMQ), Redis or any other
cache (`@Cacheable`, `@EnableCaching`), an external STOMP relay, and any AI or ML service.

## 3. Communication paths

| From → To | Protocol and semantics | Evidence | Sync/async |
|---|---|---|---|
| SPA → API (REST) | HTTPS JSON to `${REACT_APP_API_URL}/v1`, with `Authorization: Bearer <jwt>` from the `jwt-token` cookie. On a 401 it calls `POST /refresh-token` once, then retries | `api/axiosConfig.js`, `api/constants.js`, `utils/cookie.js` | Sync |
| SPA → API (realtime) | SockJS to `${REACT_APP_SOCKET_URL}`, STOMP 1.x, with native header `WS-Authorization: <jwt>` on CONNECT, SUBSCRIBE and SEND | `hooks/useSocket.js` `connect`, `chatInExistedConversation` | Async, server push |
| nginx → API | HTTP/1.1 reverse proxy on `/api/` and `/ws/`. The `/ws/` route forwards `Upgrade` and has a 3600 s timeout | `frontend/nginx.conf.template` | Sync |
| API → PostgreSQL | JDBC through Spring Data JPA (18 repositories) and `EntityManager.createStoredProcedureQuery` (DAO) | `repository/**`, `dao/impl/*DAOImpl`, `dao/impl/ConversationDaoImpl` | Sync |
| API → Cloudinary | HTTPS through the Cloudinary SDK | `CloudinaryServiceImpl` | Sync, inside the request |
| API → Microsoft identity / Graph | HTTPS through `new RestTemplate()` | `EmailSender.send`, `MicrosoftOAuth2TokenProvider.getAccessToken` | Async: runs in `@Async` event handlers |
| Browser → SightEngine | HTTPS GET with the uploaded image URL | `imageModerationService.detectImages` | Sync, client-side only |

## 4. Components inside the API application (C4 level 3)

| Component | Responsibility | Key symbols | Confidence |
|---|---|---|---|
| HTTP security chain | CORS from `vivacon.frontend.allowed-origins`, stateless JWT, role and resource rules | `security/HTTPSecurityConfiguration` (`configure`, `corsFilter`), `security/JWTRequestFilter`, `common/utility/JwtUtils` (JJWT, HS512) | Observed |
| STOMP endpoint and inbound auth | `/ws` with SockJS, origin allow-list, an in-memory simple broker (`/conversation`, `/user`, `/topic`), app prefix `/app` | `configuration/STOMPMessageBrokerConfiguration` and its inner `CustomInterceptor.preSend` (reads `WS-Authorization`), `configuration/WebSocketSecurityConfiguration` | Observed |
| REST controllers | 18 `@RestController`s under `/api/v1` (plus `HomeController`, a view controller with no template): auth, profile, setting, post, comment, like, following, newsfeed, hashtag, chat, notification, reports, admin, statistic, attachment | `controller/**` | Observed |
| STOMP message handlers | Handle `/app/chat`, `/app/conversation`, `/app/conversation/account/add` and `/app/conversation/typing` | `controller/ChatController` (`@MessageMapping`) | Observed |
| Domain services | Business rules. `*ServiceImpl` classes, some `@Transactional` | `service/**`, `service/impl/**`, `service/report/**` | Observed |
| Device verification | Parses the User-Agent and looks the IP up in GeoLite2 at login and verify time. Publishes `NewDeviceLocationLoginEvent` | `service/impl/DeviceServiceImpl.verifyDevice`, `GeolocationConfiguration` | Observed |
| Media upload | Takes multipart uploads and stores them in Cloudinary | `controller/AttachmentController`, `service/impl/CloudinaryServiceImpl` | Observed |
| Recommendation job | Runs every 5 minutes: mutual-friend scoring, kept in memory | `service/recommendation/RecommendationServiceImpl.performRecommendationProcessing` (`@Scheduled`), `configuration/ScheduledConfiguration` | Observed |
| Mappers | Entity-to-DTO mapping with ModelMapper. They add counts and current-user flags, which means extra queries | `mapper/**` | Observed |
| In-process event bus | Side effects of registration, login, likes, comments, follows, posts and reports | 11 classes in `event/*Event`. `event/handler/*Handler` (`@Async @EventListener`) on the `ListenerConfiguration` thread pool (core 4, max 12) | Observed |
| Notification providers | Push over STOMP, send email over Graph | `event/notification_provider/WebsocketSender` (`/user/{username}/notification`), `EmailSender` | Observed |
| Online presence | Tracks STOMP connect and disconnect and broadcasts to `/topic/account/online` | `event/handler/WebSocketSessionEventHandler`, `ActiveSessionManagerImpl` | Observed |
| JPA repositories | CRUD and derived queries | `repository/**` (15 top-level, 3 in `report/`) | Observed |
| Statistics and search DAO | Calls the stored functions by name | `dao/impl/PostDAOImpl`, `UserDAOImpl`, `HashTagDAOImpl`, `ConversationDaoImpl` | Observed |

## 5. Runtime path drawn in `runtime-sequence.mmd`: send a chat message

| Step | Code |
|---|---|
| Browser connects SockJS and STOMP with `WS-Authorization` | `frontend/src/hooks/useSocket.js` `connect`, called once from `App.js` |
| Origin is checked at the handshake | `STOMPMessageBrokerConfiguration.registerStompEndpoints` (`setAllowedOrigins` / `setAllowedOriginPatterns`) |
| Principal is set from the JWT on every inbound frame that carries the header | `STOMPMessageBrokerConfiguration.CustomInterceptor.preSend` → `JwtUtils.getUsername` → `UserDetailServiceImpl.loadUserByUsername` |
| Subscribes to each conversation | `useSocket.onConnected`: REST `GET /api/v1/conversation/id`, then `SUBSCRIBE /conversation/{id}/message` |
| User presses Enter | `components/pages/ChatPage` `sendMessage` → `useSocket.chatInExistedConversation` → `SEND /app/chat` |
| Handler | `ChatController.processChatMessage` |
| Participant check and persistence, in one transaction | `MessageServiceImpl.save` (`@Transactional`) → `checkAuthorizedConversation` (`AccountServiceImpl.getCurrentAccount`, `ParticipantRepository.findByConversationIdAndAccountId`) → `MessageRepository.save` → `ConversationRepository.updateLastModifiedAtById` |
| Fan-out | `SimpMessagingTemplate.convertAndSend("/conversation/{id}/message", MessageResponse)` → simple broker → `useSocket.onMessageReceived` → reducer `GET_RECEIVE_MESSAGE` |
| Error branch | `UnauthorizedWebSocketException`. The codebase has no `@MessageExceptionHandler`, so under Spring's default the sender gets no reply (Inferred) |

## 6. Deployment evidence

| Item | Evidence | Confidence |
|---|---|---|
| Compose project `vivacon` with `db`, `backend`, `frontend`. Only `frontend` publishes a port | `docker-compose.yml` | Observed |
| Dev-only extras: Adminer and published `db` and `backend` ports | `docker-compose.override.yml` | Observed |
| Opt-in Cloudflare Tunnel pointed at `http://frontend:80` | `docker-compose.tunnel.yml` | Observed |
| Static hosting on Vercel (CRA preset, rewrite to `index.html`, no API rewrite) | `frontend/vercel.json` | Observed (config), Documented only (that it is live) |
| Production database is Supabase through the session pooler, and the local `db` container is unused | `.kiro/steering/deployment.md`. The code only makes the URL and username configurable (`SPRING_DATASOURCE_URL`, `DB_USERNAME` in `docker-compose.yml`) | Documented only |

## 7. Observations made while gathering evidence

These came up while reading code. They are recorded here so the diagrams do not imply
protection that is not there. No code was changed.

1. **Message history is readable by any authenticated user.** The security rule targets
   `/api/v1/conversation/{id}/messages` (plural), but the endpoint is
   `/conversation/{id}/message` (singular). `MessageServiceImpl.findAllByConversationId`
   also does no participant check.
2. **The post-delete rule never matches.** The rule protects `DELETE /api/v1/post/{id}`,
   but the endpoint is `DELETE /api/v1/post/comment/{id}` (`PostController.deleteComment`,
   which calls `deactivatePost`). So any authenticated user passes the URL rule.
   Ownership is enforced only if the service checks it, and that was not verified.
3. **`/api/v1/statistic/**` is not admin-only.** Only `/api/v1/admin/**` requires
   ADMIN or SUPER_ADMIN.
4. **STOMP subscriptions are not authorized.** `WebSocketSecurityConfiguration` allows
   every message, and `CustomInterceptor` only sets a principal. A client can
   `SUBSCRIBE /conversation/{anyId}/message` without being a participant. Sends are
   checked in `MessageServiceImpl`; subscriptions are not.
5. **`/actuator/**` is `permitAll` in Spring.** It is unreachable from outside only
   because nginx proxies nothing but `/api/` and `/ws/`.
6. **Browser-side secrets.** SightEngine and Google Maps credentials are `REACT_APP_*`
   variables, so they are inlined into the public bundle. `frontend/.env.development`
   contains values for them; they are not reproduced here.
7. **Moderation runs after storage.** Images go to Cloudinary through the backend first.
   SightEngine checks them afterwards, in the browser, and the backend never checks again.
