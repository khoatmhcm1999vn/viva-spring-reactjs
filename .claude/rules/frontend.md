---
paths:
  - "frontend/**"
---

# Frontend conventions (`frontend/src/`)

React 17, react-scripts 5 (CRA, not ejected), JavaScript only. react-router-dom **5**
(`Switch`/`Route`/`Redirect`; no v6 APIs). MUI 5 + SCSS. axios 0.26. `@stomp/stompjs` +
`sockjs-client`. react-i18next.

```
api/               one *Service.js per domain + axiosConfig.js + constants.js
components/common/ shared UI, one folder per component
components/pages/  route-level pages
components/dashboard/  admin area (src/, charts/)
globalSocketState/ Context + reducer + actions for WebSocket state
hooks/             useSocket, useInfiniteList, useLoading, useSnackbar, ...
locales/en|vi/     translation.json
routes/routes.js   Switch-based routing with PrivateRoute
utils/             cookie, jwtToken, calcDateTime, ...
App.js             AuthUser / Loading / Snackbar / UpdateProfile contexts
```

## Conventions

- One `PascalCase` folder per component: `index.js` + colocated `style.scss`
  (`import "./style.scss";`). Function components with hooks; default export at the bottom.
- Absolute imports from `src` (`jsconfig.json` `baseUrl: ./src`): `components/...`,
  `api/...`, `hooks/...`, `utils/...`.
- All HTTP goes through `api/*Service.js` over the shared `axiosConfig` instance, with paths
  from `API_ENDPOINT_KEYS` in `api/constants.js`. Never call `axios` from a component.
  `axiosConfig` already adds `Bearer` and retries on 401 via refresh token.
- Cross-cutting state: React Context + `useReducer` (`App.js`, `globalSocketState/`), consumed
  via the `hooks/` wrappers. `redux`/`redux-saga`/`redux-persist` are installed but unused;
  do not introduce Redux.
- User-facing text via `useTranslation()`; add keys to **both** `locales/en` and `locales/vi`.
- Infinite lists: `react-infinite-scroll-component` + `useInfiniteList` /
  `useInfiniteReverseList` / `useNewsfeedInfiniteList`, which expect the backend `PageDTO`.
- `lodash` is imported but not declared in `package.json`; avoid new usage.

## Build and environment

- `npm install --force` only. Keep the `react-konva` / `konva` `overrides` pins.
- `REACT_APP_*` is baked in at build time. `.env.development` → `http://localhost:8090/api`
  and `/ws`; `.env.production` and the Docker image use relative `/api` and `/ws` behind nginx.
- 412 ESLint warnings exist, so any build with `CI` set fails; `vercel.json` uses
  `CI=false npm run build`. 20 are `jsx-a11y/alt-text` (real a11y gap).
- `frontend/Dockerfile` builds on full `node:16-bullseye` (not `-slim`: arm64 needs
  python3/make/g++ for `websocket`'s native deps) while `engines.node` is `22.x`; treat that
  mismatch as known, do not "fix" it silently.
- Build warning `Can't resolve './locale' in .../moment/min` is pre-existing and harmless.
