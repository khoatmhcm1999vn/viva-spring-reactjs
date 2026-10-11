# Vivacon architecture: diagrams as code

These diagrams show the **current state (AS-IS)** of Vivacon. They were drawn from the
source code on branch `feature/ai-assisted-dev-setup` in October 2026. The evidence for
every node and edge is in [architecture-inventory.md](architecture-inventory.md).
`docs/ARCHITECTURE.md` is the longer narrative document, and it covers deployment
history and the measured latencies.

## Summary of the current state

Vivacon is an Instagram-style social network. It has four logical containers:

- **React 17 SPA**: runs in the browser.
- **nginx**: serves the bundle and proxies `/api/` and `/ws/`.
- **Spring Boot 2.5 API**: REST under `/api/v1`, plus a STOMP broker on `/ws` using
  Spring's in-memory simple broker.
- **PostgreSQL**: JPA, plus stored functions for statistics and chat search.

The API calls Cloudinary to store images. It calls the Microsoft identity platform and
Microsoft Graph to send email, from `@Async` event handlers. The browser itself calls
SightEngine for image moderation and Google Maps for the login-location map.

Side effects such as notifications, emails and hashtag extraction go through Spring
application events handled on a thread pool. There is no message queue, cache, external
broker or AI service.

## Diagram index

| Diagram | Source | SVG | PNG |
|---|---|---|---|
| C4 L1: System context | [system-context.mmd](system-context.mmd) | [svg](../diagrams/svg/system-context.svg) | [png](../diagrams/png/system-context.png) |
| C4 L2: Containers | [container-diagram.mmd](container-diagram.mmd) | [svg](../diagrams/svg/container-diagram.svg) | [png](../diagrams/png/container-diagram.png) |
| C4 L3: Components of the API | [component-diagram.mmd](component-diagram.mmd) | [svg](../diagrams/svg/component-diagram.svg) | [png](../diagrams/png/component-diagram.png) |
| Runtime: send a chat message | [runtime-sequence.mmd](runtime-sequence.mmd) | [svg](../diagrams/svg/runtime-sequence.svg) | [png](../diagrams/png/runtime-sequence.png) |
| Deployment topology (Docker Compose) | [deployment-topology.mmd](deployment-topology.mmd) | [svg](../diagrams/svg/deployment-topology.svg) | [png](../diagrams/png/deployment-topology.png) |

The `.mmd` files are authoritative. The SVG and PNG files are generated from them; do not
edit those by hand.

## C4 notation: flowchart fallback

The rules are in `.kiro/steering/c4-model.md`. Mermaid's native `C4Context` and
`C4Container` syntax is marked experimental. A native L1 was rendered once with the pinned
CLI (12.0.0) and inspected:

- Relationship labels landed on top of the boxes.
- Edges ran straight through other systems.
- The browser-side calls could not be grouped apart from the server-side ones.

The probe was rejected and deleted. The C4 diagrams here are therefore
**Mermaid flowcharts that keep C4 semantics**:

- `[Person]`, `[Software System]`, `[Container: tech]` and `[External System]` tags on
  the nodes.
- Dashed boundaries for the system or container in focus.
- Labelled relationships.

They are not native C4 renders.

## Assumptions and missing evidence

- **Production database.** The code only makes the datasource configurable
  (`SPRING_DATASOURCE_URL`, `DB_USERNAME`). That production runs on Supabase is
  documented in `.kiro/steering/deployment.md`, not proven by code, which is why it is
  dashed in the deployment diagram.
- **Vercel and the Cloudflare Tunnel.** Their configuration is tracked
  (`frontend/vercel.json`, `docker-compose.tunnel.yml`). Whether they are live right now
  was not checked; no network calls were made.
- **The nginx path.** nginx is on the path only in Docker deployments. With the CRA dev
  server, the SPA calls the API directly on `:8090`.
- **Whether the admin dashboard actually mounts the user-location map** (GitHub raw
  TopoJSON) was not traced, so that page is left out of the diagrams.
- **The not-a-participant error branch.** The sequence diagram's claim that the sender
  gets no reply relies on Spring's default behaviour. No test was run.
- **What is deliberately excluded.** AWS S3, SMTP mail, Thymeleaf, GeoNames and Redux are
  configured or present but have no runtime caller. See inventory section 2.
- **Security gaps.** Section 7 of the inventory lists the ones found while reading the
  code. The diagrams draw the rules as they are, not as they were meant to be.

## Rendering

You need Node.js 18 or newer and network access the first time. The first run downloads
`@mermaid-js/mermaid-cli` and a headless Chromium into the npx cache.

```powershell
node scripts/render-diagrams.mjs                # all diagrams -> docs/diagrams/{svg,png}
node scripts/render-diagrams.mjs sequence       # only files whose name contains "sequence"
```

How the script works:

- It pins the Mermaid CLI version (`MERMAID_CLI_VERSION`).
- It passes arguments as argv, without a shell. On Windows it launches npm's
  `npx-cli.js` through `node`, which avoids the `EINVAL` that Node raises when spawning
  `npx.cmd` without a shell.
- It exits non-zero if any render fails.
- To use a local install instead, set `MMDC_BIN`:

  ```powershell
  npm install --no-save @mermaid-js/mermaid-cli@12.0.0
  $env:MMDC_BIN = "node_modules\.bin\mmdc.cmd"
  ```

To render one file by hand:

```powershell
npx --yes --package @mermaid-js/mermaid-cli@12.0.0 mmdc -i docs/architecture/system-context.mmd -o docs/diagrams/svg/system-context.svg -b white -c docs/architecture/mermaid.config.json
```

### Previewing, background and parser errors

- **Preview.** Open the SVG or PNG directly, or paste the `.mmd` source into
  https://mermaid.live. In VS Code or Kiro, a Mermaid preview extension renders `.mmd`
  files. GitHub renders Mermaid in Markdown code fences, but not in standalone `.mmd`
  files.
- **Background.** The script passes `-b white` so the exports read well in dark-mode
  viewers. Use `-b transparent` when embedding in slides. Theme, font and spacing live in
  `mermaid.config.json`.
- **Parser errors.** The CLI prints the line and the token it expected.
  - The most common cause here is a node ID that is a Mermaid keyword: `graph`, `end`,
    `subgraph`, `class`, `style` or `click`. Rename the ID and keep the label.
  - Quote any label that contains `()`, `{}`, `:`, `/` or `|`.
  - Use `<br/>` for line breaks.

### draw.io

The repository has no `.drawio` files. If an editable layout is needed later, open the
Mermaid source in draw.io (*Arrange → Insert → Advanced → Mermaid*) and save it as
`docs/diagrams/<name>.drawio`. Keep the `.mmd` file authoritative, or retire it
explicitly, so that two sources do not drift apart.
