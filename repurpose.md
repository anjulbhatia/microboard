# Microboard → MCP Project: Full Repurpose Plan

> **Goal**: Turn the existing Microboard (hackathon AI-native dashboard canvas) into a **lightweight, bloat-free MCP server + optional static landing/showcase** that lives inside Claude, ChatGPT, Cursor, VS Code, Gemini, and other MCP hosts.  
> No SaaS accounts, no “my dashboards” lists, no heavy editor. The board is a portable, auditable **recipe** (data + transform steps + widgets) that can be rendered, shared, and exported.

---

## 1. Positioning & Naming

### One-sentence pitch
**MCP that turns data into auditable, shareable chart recipes which render interactively inside any MCP-compatible AI client.**

### Core differentiator
- Versioned board document (`raw` → ordered `steps[]` → `cleaned` + widgets)
- Human-in-the-loop propose → approve → apply (optional but recommended)
- Math/data-science friendly transforms and chart types
- Zero ongoing ops: `npx microboard` or a remote URL

### Human-editable window
**Include a thin one.**  
- Inside the MCP App iframe (Claude / ChatGPT / Cursor etc.)
- On the public `/share/:id` page  
No full drag-resize Canva editor, no profile system, no bulk “my boards” list.  
Users can inspect data, approve/reject proposals, lock widgets, and make minor layout tweaks.  
This preserves the original differentiator at almost zero extra cost once the board model exists.

---

## 2. What We Keep vs. What We Kill

### Keep / Evolve
- Board document schema (versioned JSON)
- Transform pipeline idea (`steps[]` that are fully replayable)
- Propose → Approve → Apply loop
- Export philosophy (PNG, PDF, interactive HTML, etc.)
- Distinctive visual direction (re-introduce dither / micro-chart aesthetic later as a theme)

### Kill immediately
- Convex Auth + users + mailing + subscribers
- Full editor canvas (`/create`) with heavy Zustand store, AG Grid lock/drag hell
- Showcase gallery that requires auth
- AgentMail integration
- Dither Kit + Microcharts (temporarily — move to `legacy/` or `experimental/`)
- Any “my dashboards / profile / settings” surface

### Later (Phase 2+)
- Dither / Microcharts theme
- PPTX export
- Optional Pyodide / Julia escape hatches
- Live polling of external data sources

---

## 3. Target Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  MCP Hosts (Claude, ChatGPT, Cursor, VS Code, Gemini…)     │
│  • stdio (local npx)  or  Streamable HTTP / SSE (remote)   │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  Microboard MCP Server (TypeScript)                         │
│  • Official @modelcontextprotocol/sdk                       │
│  • Tools: inspect, propose/apply transform, propose/add     │
│    widget, get_board_state, export_board, lock_widget       │
│  • MCP Apps (ui://) → interactive board iframe              │
│  • Board model = pure JSON recipe                           │
└────────────────────────────┬────────────────────────────────┘
                             │
          ┌──────────────────┴──────────────────┐
          ▼                                     ▼
┌─────────────────────┐               ┌─────────────────────┐
│  Chart renderer     │               │  Optional static    │
│  (Vega-Lite /       │               │  site (Hono)        │
│   Plotly / Recharts)│               │  /  /showcase       │
│  → PNG / HTML / PDF │               │  /share/:id         │
└─────────────────────┘               └─────────────────────┘
```

### Ideal Folder structure
microboard/
├── README.md
├── LICENSE
├── package.json                 # root workspace (or just for scripts)
├── tsconfig.json                # shared
├── bun.lockb / pnpm-lock.yaml
│
├── mcp/                         # the actual MCP server (core product)
│   ├── package.json
│   ├── src/
│   │   ├── index.ts             # entry (stdio + optional HTTP)
│   │   ├── server.ts
│   │   ├── tools/               # one file per tool or small groups
│   │   ├── board/               # Board model + transforms
│   │   ├── charts/              # Vega-Lite renderer + export helpers
│   │   └── ui/                  # MCP App (ui://) HTML/JS bundle
│   ├── dist/
│   └── tests/
│
├── web/                         # public landing + showcase + share
│   ├── package.json
│   ├── src/
│   │   ├── index.ts             # Hono app
│   │   ├── routes/
│   │   │   ├── landing.ts
│   │   │   ├── showcase.ts
│   │   │   └── share.ts
│   │   └── views/               # simple HTML templates or tiny Vue
│   ├── public/
│   └── tests/
│
├── python/                      # optional heavy analysis (later)
│   ├── pyproject.toml
│   ├── src/
│   └── README.md                # “when to use Pyodide / external”
│
├── wasm/                        # DuckDB-WASM, Pyodide wrappers, etc.
│   ├── package.json
│   └── src/
│
├── examples/                    # ready-to-run prompts + sample boards
│   ├── boards/                  # .json recipes
│   ├── prompts.md
│   └── screenshots/
│
├── scripts/                     # one-off helpers
│   ├── build.ts
│   ├── release.ts
│   └── seed-showcase.ts
│
├── .github/
│   └── workflows/
│       ├── ci.yml               # test + typecheck + build
│       ├── release.yml          # npm publish mcp package
│       └── deploy-web.yml       # deploy web/ to Cloudflare / Vercel
│
├── docs/                        # optional, keep thin
│   ├── architecture.md
│   └── repurpose.md             # the plan we already wrote
│
└── legacy/                      # old dither / microcharts / convex code
    └── ...
    
### Board Document (canonical artifact)
```ts
interface Board {
  id: string;
  title: string;
  version: number;               // bumped on every mutation
  data: {
    source: "inline" | "url" | "upload";
    raw: any[] | null;
    cleaned: any[] | null;
    columns: ColumnMeta[];
  };
  steps: Step[];                 // ordered, replayable transform history
  layout: LayoutItem[];
  widgets: Record<string, Widget>;
  locks: string[];               // widget IDs the agent may not touch
  meta?: {
    createdAt: string;
    updatedAt: string;
    author?: string;
  };
}
```

`steps` is the load-bearing part. Replaying them on `raw` always produces `cleaned`. A shared board is a **recipe**, not a pixel snapshot.

---

## 4. Tech Stack Decisions

| Layer              | Choice                                      | Rationale |
|--------------------|---------------------------------------------|-----------|
| Language           | **TypeScript**                              | Existing codebase, excellent MCP SDK, `npx` distribution, fast cold start |
| MCP SDK            | `@modelcontextprotocol/sdk` + `ext-apps`    | Official, supports MCP Apps (interactive UI) |
| Charting (Phase 1) | **Vega-Lite** (primary) or Plotly.js        | Declarative, reproducible, math-friendly. Recharts as React fallback |
| Data transforms    | Arquero + plain TS + **DuckDB-WASM**        | Bloat-free, SQL-capable, runs in Node and browser |
| MCP App UI         | React (or vanilla) inside `ui://` resource  | Reuse existing component knowledge |
| Landing / Showcase | **Hono** (plain HTML or minimal Vue)        | Extremely lightweight, no SPA tax |
| Persistence (share)| Cloudflare KV / R2 or signed JSON URLs      | No database, no auth |
| Package manager    | Bun or npm                                  | Bun already used in original repo |
| Export             | html-to-image / Playwright / pdf-lib / pptxgenjs (optional) | PNG, PDF, HTML, MDX, PPTX |

**Explicitly rejected for Phase 1**
- Python port
- Convex
- Full Next.js / heavy React SPA for the public site
- Dither Kit / Microcharts (re-add later as theme)
- User accounts / OAuth

---

## 5. MCP Tools (narrow & closed)

| Tool                  | Kind     | Purpose |
|-----------------------|----------|---------|
| `inspect_data`        | Read     | Schema, null counts, sample rows, basic stats |
| `propose_transform`   | Propose  | Suggest a single step without applying |
| `apply_transform`     | Write    | Apply an approved step (version-checked) |
| `propose_widget`      | Propose  | Suggest a chart / KPI / table |
| `add_widget`          | Write    | Add approved widget to the board |
| `update_widget`       | Write    | Change an existing widget (if not locked) |
| `get_board_state`     | Read     | Full board JSON + version |
| `lock_widget`         | Write    | Human-only freeze against agent edits |
| `export_board`        | Action   | `png` \| `pdf` \| `html` \| `mdx` \| `pptx` \| `json` |

Every write tool returns a receipt and checks the board version it was proposed against. Fail closed on conflict.

---

## 6. Public Routes (minimal Hono site)

```
/                 → Landing page (pitch + install snippets + 30s demo)
/showcase         → Curated public example boards
/share/:id        → 5-character random identifier → view / light-edit / export
/u/:user          → Optional simple user page (or drop entirely)
```

- No authentication required to view or export a shared board.
- Optional lightweight “claim” via a signed link if we ever want ownership without accounts.
- Persistence: store the board JSON under the short ID (KV / R2 / file).

---

## 7. Export Surface

| Format          | Priority | Notes |
|-----------------|----------|-------|
| PNG             | P0       | High-quality static image |
| Interactive HTML| P0       | Self-contained, works offline |
| Board JSON      | P0       | The portable recipe |
| PDF             | P1       | Multi-page friendly |
| MDX             | P1       | For docs / blogs / Notion |
| PPTX            | P2       | Nice-to-have |

---

## 8. Data Analysis & Transforms

**Primary path (TypeScript only)**
- Arquero for dataframe operations
- DuckDB-WASM for SQL (`SELECT … FROM board`)
- Plain TypeScript for custom math (residuals, confidence intervals, simple tests, hierarchical aggregations, etc.)

**Escape hatches (optional, later)**
- Pyodide (Python in WASM) — only if a user really needs pandas/scikit
- Julia — only with strong justification (heavy)

Every transform must be serializable into the `steps[]` array so the entire board remains replayable and auditable.

---

## 9. Phased Delivery Checklist

### Phase 0 – Cleanup (1–2 days)
- [ ] Fork / branch the existing repo
- [ ] Move Dither Kit + Microcharts into `legacy/` or `experimental/`
- [ ] Delete Convex auth, users, mailing, showcase-with-auth, AgentMail
- [ ] Delete full editor routes and heavy Zustand editor store
- [ ] Keep only board schema + transform utilities
- [ ] Clean `package.json` of unused dependencies
- [ ] Write this `repurpose.md` into the repo root

### Phase 1 – MCP Core + Charting (3–5 days)
- [ ] Scaffold MCP server with official TypeScript SDK (stdio)
- [ ] Implement Board model + versioned mutations
- [ ] Implement core tools (`inspect_data`, `propose/apply_transform`, `propose/add_widget`, `get_board_state`, `export_board`)
- [ ] Choose and integrate primary chart library (Vega-Lite recommended)
- [ ] PNG export working
- [ ] Basic interactive HTML export
- [ ] `npx microboard` works locally
- [ ] Document Claude Desktop / Cursor / VS Code install snippets

### Phase 2 – MCP Apps + Thin Human Surface (2–3 days)
- [ ] Add MCP Apps (`ui://`) resource that renders the current board
- [ ] Thin editable surface inside the iframe (inspect, approve, lock)
- [ ] Version conflict handling polished
- [ ] Test in Claude, ChatGPT (remote), Cursor, VS Code

### Phase 3 – Public Site + Sharing (2–3 days)
- [ ] Hono server
- [ ] `/` landing page with install instructions and demo
- [ ] `/share/:id` (5-char ID) – view, light edit, export
- [ ] `/showcase` – static or KV-backed example boards
- [ ] Persistence for shared boards (KV / R2 / signed URL)
- [ ] Export buttons (PNG, PDF, HTML, MDX, JSON)

### Phase 4 – Polish & Differentiation (ongoing)
- [ ] Math-grade helpers (residuals, CI bands, simple statistical tests, hierarchical agg)
- [ ] DuckDB-WASM SQL transforms
- [ ] Optional dither / micro-chart theme
- [ ] PPTX export
- [ ] Remote Streamable HTTP endpoint for ChatGPT connectors
- [ ] Example boards + prompt library
- [ ] README “30-second start” + video walkthrough

---

## 10. Distribution Targets

| Client              | How users install                                      |
|---------------------|--------------------------------------------------------|
| Claude Desktop      | `claude_desktop_config.json` → `npx -y microboard`     |
| Claude.ai           | Remote connector (Streamable HTTP)                     |
| ChatGPT             | Developer mode → remote MCP server                     |
| Cursor / VS Code    | MCP settings → `npx -y microboard`                     |
| Gemini / Codex      | As supported by their MCP clients                      |
| Any other host      | stdio or HTTP                                          |

Package name suggestion: `microboard` or `@anjulbhatia/microboard-mcp`.

---

## 11. Success Criteria

- [ ] A user can install with one `npx` command and start making charts in Claude/Cursor within 60 seconds
- [ ] A board can be fully reconstructed from its JSON recipe alone
- [ ] Every agent write is version-checked and can be rejected by a human
- [ ] Shared link (`/share/abc12`) works without login
- [ ] Exports (PNG + interactive HTML + JSON) are reliable
- [ ] No user accounts, no billing, no “my dashboards” list
- [ ] Cold start of the MCP server is fast (< 200 ms preferred)
- [ ] The project clearly demonstrates rigorous data thinking (audit trail + math-friendly tools)

---

## 12. Open Questions (resolve early)

1. **Final name** — keep Microboard or rename?
2. **Primary chart library** — Vega-Lite vs Plotly vs Recharts?
3. **Persistence for `/share/:id`** — Cloudflare KV, R2, or pure signed URLs?
4. **How aggressive on human editing** — only approve/reject + lock, or also allow free-form widget property edits?
5. **Remote hosting** — do we need a public Streamable HTTP endpoint from day one, or is local `npx` enough for launch?

---

## 13. Immediate Next Actions

1. Create a new branch `repurpose/mcp` (or a fresh repo if preferred).
2. Commit this `repurpose.md`.
3. Execute Phase 0 cleanup.
4. Scaffold the MCP server skeleton + Board model.
5. Pick the chart library and get a single `render_chart` tool returning PNG working end-to-end.

Once Phase 1 is solid, the rest of the system becomes mostly composition.

---

*Last updated: 2026-10-24*  
*Original project: https://github.com/anjulbhatia/microboard*  
*License remains MIT unless changed.*
