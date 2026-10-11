# Generate Solution Architecture from Code

Analyze this workspace and generate evidence-based architecture documentation. Do not invent a technology or connection. Read existing `.kiro/steering` rules, backend/frontend build files, application entry points, routing, controllers, services, repositories, frontend API clients, docker configuration, database config/migrations, third-party integrations, and security.

Deliver:
1. An evidence inventory: component, role, verified files/symbols, communication path, confidence.
2. `docs/architecture/system-context.mmd` (C4 L1).
3. `docs/architecture/container-diagram.mmd` (C4 L2).
4. `docs/architecture/component-diagram.mmd` (C4 L3 for the best-evidenced core container, if justified).
5. `docs/architecture/runtime-sequence.mmd` for ONE actual end-to-end user/business path with links to code that prove the path (if justified).
6. `docs/architecture/README.md`: current-state summary, diagram index, assumptions, missing evidence, render instructions.
7. Run the Mermaid render script for all diagrams, report PASS/FAIL and repair syntax failures.

Requirements: current state only; no speculative queue/database/cloud/AI; distinguish sync from async; no secret values; clean consistent styling; C4 semantics; avoid connector crossings; no business logic modifications. Explain each relationship with code path evidence. Show `git diff --stat` and changed files. Do not commit or push without confirmation.

## When updating an existing set (this repository already has one)

- Start from `docs/architecture/architecture-inventory.md`. Re-verify only the rows the
  code change touches, then update the affected `.mmd` files and re-render.
- Keep `deployment-topology.mmd` separate from the logical C4 views.
- Render with `node scripts/render-diagrams.mjs`; inspect the PNGs, not only the exit code.
