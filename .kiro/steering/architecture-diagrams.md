---
inclusion: always
---

# Architecture Diagrams — Project Standards

- Read the repository source and existing steering before drawing.
- Use Mermaid as diagram-as-code for flowcharts, sequence, C4 when supported, ERD and dependency views.
- Use `.drawio` only when editable graphical layouts are needed and the available draw.io tool/editor can actually produce a valid file.
- For Mermaid, ensure source is renderable with the installed Mermaid CLI; do not mix arbitrary draw.io XML with Mermaid.
- Prefer `flowchart LR` for architecture layers, `sequenceDiagram` for runtime calls, `erDiagram` for verified data models, `C4Context`/`C4Container` where the installed Mermaid version supports them.
- Use predictable IDs (letters/numbers/underscores), short labels, visible system boundaries, minimal line crossings.
- Layer order: Users/External Systems -> Entry/UI -> Application/API -> Data/Infrastructure. Draw actual runtime behavior; don't force missing layers.
- Prefer distinct fill/stroke styles: client `#E0F2FE / #0284C7`, service `#DBEAFE / #2563EB`, integration `#FFEDD5 / #EA580C`, storage `#DCFCE7 / #16A34A`, external `#F1F5F9 / #64748B`, AI/processing `#F3E8FF / #9333EA`. Ensure readable dark text and export backgrounds.
- Label edges only with verified protocol/data semantics (HTTP, async event, JDBC, etc.). Dashed arrows indicate inferred / not yet verified relationships only when a legend explains them.
- Separate deployment topology from logical components; separate current-state from proposed-state.
- No passwords, keys, tokens, personal data, internal endpoints or connection strings in generated documentation.
- Source files: `docs/architecture/*.mmd`; output: `docs/diagrams/svg/*.svg` and `docs/diagrams/png/*.png`.
- Validate diagrams by rendering; fix parser errors; keep editable `.mmd` authoritative.
- Always include evidence/source references and an assumptions list.

## Project-specific notes (learned while building the first set)

- Render with `node scripts/render-diagrams.mjs [filter]`. It runs a pinned
  `@mermaid-js/mermaid-cli` through npx and applies `docs/architecture/mermaid.config.json`.
  There is deliberately no root `package.json`, and Mermaid CLI must not go into
  `frontend/package.json`: that file is the Vercel build input, and Puppeteer would
  download Chromium on every deploy.
- Node IDs must not be Mermaid keywords. `graph`, `end`, `subgraph`, `class`, `style`
  and `click` break the flowchart parser; for example, use `msgraph` rather than `graph`
  for Microsoft Graph.
- Evidence lives in `docs/architecture/architecture-inventory.md`. When code changes an
  edge or node, update the inventory row in the same change.
- Ignore the untracked `apps/`, `packages/` and `coffee-shop/` folders. They belong to an
  unrelated project and must never appear in Vivacon diagrams.
- Deployment facts that exist only in `.kiro/steering/deployment.md` (for example,
  Supabase as the live database) are drawn dashed and labelled "documented". The code
  only makes them configurable.
