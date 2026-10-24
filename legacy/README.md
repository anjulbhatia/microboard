# Legacy — frozen reference

Everything here is pre-repurpose Microboard. Do not edit, import, build, or deploy it.

| Path | What it is |
|---|---|
| `app/` | Older UI snapshot (home/editor revamp reference) |
| `app-v2/` | Final pre-repurpose React/Vite app (editor, auth, mailing, showcase) |
| `convex/` | Final pre-repurpose Convex backend (boards, auth, mail, subscribers) |
| `tests/` | Old app/Convex tests |
| `docs/` | Old product docs (`logics.md`, `guide_webmcp.md`, bug log, widget specs) |
| `scripts/` | Old local dev runner |
| `public/`, `index.html`, `vite.config.ts`, `tsconfig.*`, `components.json`, `dither-kit.json` | Old frontend config |
| `AGENT.md`, `hackathon.md`, `platform.png` | Old product brief and demo assets |

Useful logic was ported to `packages/core` (board model, steps, ingest, inspect) and `mcp/` (tools, rendering). The old Dither Kit / Microcharts visual layer is intentionally not part of Phase 1.
