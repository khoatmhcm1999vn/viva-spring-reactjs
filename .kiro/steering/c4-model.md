---
inclusion: always
---

# C4 Model Guidelines

Use the C4 Model to document the **observed as-is architecture**:

1. **Level 1 / System Context:** Person, focal software system, external software systems and verified interactions. No implementation internals.
2. **Level 2 / Container:** Deployable/runnable applications and datastores (e.g. backend process, frontend app, database only if present). "Container" in C4 is **not synonymous with Docker container**.
3. **Level 3 / Component:** Significant components inside **one chosen container**, derived from packages/classes/modules; do not represent each class as a component.
4. **Level 4 / Code (optional):** Only on request or for a sufficiently important code path.

Conventions:
- Give every node a business/technical purpose, not merely a name.
- Label relations with meaningful interactions; add technologies only when supported by repo evidence.
- Mark unavailable evidence and external service ownership explicitly.
- Create separate `AS_IS` and `TO_BE` diagrams if proposing architecture changes.
- Store Mermaid sources for C4 levels under `docs/architecture/`.
- If Mermaid's C4 support in the installed version is missing or unstable, use regular Mermaid flowcharts preserving C4 semantics, and explain the fallback; never label it a verified C4 native render.

## Applying it in this repository

- **L1** `docs/architecture/system-context.mmd`, **L2** `container-diagram.mmd`,
  **L3** `component-diagram.mmd` (the Spring Boot API only). Hosting belongs in
  `deployment-topology.mmd`, never in the L2 view.
- Tag every node with its C4 element type in the label: `[Person]`,
  `[Software System]`, `[Container: technology]`, `[Component: technology]`,
  `[External System]`. Wrap the element in focus in a dashed boundary subgraph.
- An element is drawn only if `docs/architecture/architecture-inventory.md` has a row for
  it with a file or symbol. "Configured but never called" items (AWS S3, SMTP mail,
  Thymeleaf, GeoNames, Redux) stay in the inventory and out of the diagrams.
- Group external systems by who calls them. The browser-side calls (SightEngine, Google
  Maps) are real Vivacon dependencies, but the server never makes them; say so.
- Every diagram carries a legend whenever it uses more than one line style.
- The diagrams currently use the flowchart fallback, because Mermaid labels its native C4
  syntax experimental. Re-evaluate only if a native render is actually produced and
  inspected with the pinned CLI in `scripts/render-diagrams.mjs`.
