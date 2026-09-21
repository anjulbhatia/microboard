# Hackathon log

- **Project:** Microboard
- **Event:** Convex All Gas Hackathon
- **What it does:** Collaborative data-to-dashboard workspace where a human and an agent clean data and build microchart dashboards on one shared, versioned board.
- **Live app:** https://microboard-three.vercel.app
- **Repo:** https://github.com/anjulbhatia/microboard
- **Frontend:** Vercel
- **Convex deployment:** not deployed
- **Components:** none
- **Convex features:** schema, tables, indexes, queries, mutations
- **Auth:** none
- **AI models:** none
- **Started:** 2026-09-03T22:20:34Z
- **Last updated:** 2026-09-21T17:47:03Z

## Log

### 2026-09-04 - 4605a1e
Scaffolded the React 19 + Vite + Tailwind v4 + shadcn shell with theme provider, then built the first landing page, board editor mockup, and chart widgets (dithered, micro, textbox) on a mock data provider (`package.json`, `app/` routes and features).

### 2026-09-04 - 4305463
Built the editor loop: landing page with transitions, tool docks and organized pages, clipboard data provider, deterministic transform library with docs, load/transform windows, and sidebar plus secondary toolbar with early WebMCP and Share features (`app/features/board`, `app/features/data`, `docs/`).

### 2026-09-04 - fd50301
Added micro charts, README, and an improved landing hero, integrated WebMCP tools, then fixed the device mockup and removed the early webmcp draft.

### 2026-09-06 - ff5983c
Fixed alias and import bugs and renamed files; no behavior change.

### 2026-09-19 - e9eab1e
Set up the feature architecture for the application.

### 2026-09-19 - 74f1d88
Renamed src to app, hardened the feature layout, and scaffolded the Convex backend: draft schema with boards + links tables and by_publicId/by_slug indexes, boards save/get mutation and query, showcase list query (`convex/schema.ts`, `convex/boards.ts`, `convex/showcase.ts`, `.env.example` with empty `VITE_CONVEX_URL`). Convex features: schema, tables, indexes, queries, mutations. The frontend share seam stays local until a Convex URL is set.

### 2026-09-21 - working tree
Uncommitted rework of the board editor, dashboard, share menu, and widget components, plus this first hackathon log and the installed Convex hackathon skill (`.agents/skills/convex-hackathon-skill/`). No Convex deployment, components, auth, or model wiring yet.
