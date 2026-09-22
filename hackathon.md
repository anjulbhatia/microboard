# Hackathon log

- **Project:** Microboard
- **Event:** Convex All Gas Hackathon
- **What it does:** Collaborative data-to-dashboard workspace where a human and an agent clean data and build microchart dashboards on one shared, versioned board.
- **Live app:** https://microboard-three.vercel.app
- **Repo:** https://github.com/anjulbhatia/microboard
- **Frontend:** Vercel
- **Convex deployment:** not deployed
- **Components:** @convex-dev/auth
- **Convex features:** schema, tables, indexes, mutations
- **Auth:** Convex Auth
- **AI models:** none
- **Started:** 2026-09-03T22:20:34Z
- **Last updated:** 2026-09-22T15:00:00Z

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

### 2026-09-21 - working tree
Correction: removed the uncommitted sponsor scaffolding (AI Gateway suggest, Firecrawl scrape, AgentMail inbox, static hosting) and reset `convex/` to app tables plus Convex Auth v2. Registered auth core, password, and username components in `convex/convex.config.ts`; public sign-up/sign-in/change-password in `convex/auth.ts` with user rows in `convex/users.ts`. Convex features: schema, tables, indexes, mutations. Pending: `npx convex dev` codegen, `AUTH_PRIVATE_KEY`/`AUTH_JWKS` env, `ConvexAuthProvider` wiring, first deploy.

### 2026-09-22 - routes, shells, home
Flattened `app/app` to `app`, then built the route map: canonical `/share/:id` with `/b/:id` redirect, `/new` canvas behind a login gate, `/home` SPA, public `/u/:username`, legacy `/create` and `/dashboard` redirects. Dropped the global header/footer for per-route chrome (landing island, bare share, sidebar home). Home gained an island sidebar (brand header, icon nav, theme toggle, profile footer) with a phone layout: top bar, section tabs, bottom main nav. Session is demo-grade with stable ids and editable usernames; email OTP via AgentMail slots into the same modal.

### 2026-09-22 - board schema and features
Schema-first widget grid: `col`/`row` position plus `dataX`/`dataY` bindings with legacy `x`/`y` compat, flow placement, 16-column clamp, 160-cell capacity. Then vertical slices, each tested: library cards with local persistence and cloud slot (`loadBoard`); data-source registry with API endpoint, JSON coercion, auto-refresh polling that swaps rows in place; `/new` template picker (blank 16:10, blank 3:4, sample data); mailing list with validation and a Convex `subscribers` mirror; history snapshots (cap 10) with restore; analytics views/shares counters. Convex additions: `boards.ownerId` with `by_owner`, `users.by_name` plus `getByUsername`, board save/get/list/showcase functions. 40 bun tests green (`bun test tests/`), `tsc -b` clean. Full detail in `docs/convex.md`.

### 2026-09-22 - backend live, engagement, agent, charts
Local Convex backend live (`127.0.0.1:3210`) with generated auth keys; app wired through a lazy offline-safe shell. Fixed auth key format (base64-of-PEM, `--from-file` for JWKS) and verified signup/sign-in live. Schema uplift: counters, likes/saves/comments tables, mail inboxes. Functions for showcase feed, board detail, like/save toggles, comments, owner delete — all exercised via CLI. UI: live showcase with engagement, share detail with comments, AgentMail board drops (`@agentmail/convex`), WebMCP manifest plus canvas chat. Charts: 25 micro widgets column-bound (X/Y/Y2 + labels), StatusDot abstract, dither line and pie kinds. Home rebuilt per tab with previews, modals, tables; december-grade theme pass. Canvas simplified to one fluid 8×5 grid, no pickers or gates; board and session persist across reloads. 75 bun tests green. Convex features: schema, tables, indexes, queries, mutations, actions, auth, components.
