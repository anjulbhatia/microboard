# Architecture

> Source of truth: [`repurpose.md`](../repurpose.md). This file maps the plan to code.

## Layers

```text
MCP host (Claude, Cursor, VS Code, ...)
        │ stdio JSON-RPC
        ▼
mcp/src/index.ts            entry
mcp/src/server.ts           tool/resource registration + instructions
mcp/src/tools/data.ts       load_data, inspect_data
mcp/src/tools/board.ts      propose/apply/update/lock/get
mcp/src/tools/app.ts        get_board_view, reject_proposal (app-only)
mcp/src/tools/export.ts     export_board, render_chart
mcp/src/ui.ts               ui:// resource + self-contained MCP App HTML
mcp/ui/view.js              iframe app: render, approve/reject, lock
mcp/ui/view.css             host-themed board surface
mcp/src/store.ts            .microboard/board.json persistence + write lock
mcp/src/proposals.ts        in-memory propose -> approve handoff
mcp/src/render.ts           Vega -> SVG -> PNG; self-contained HTML
        │
        └─
packages/core/src
  types.ts                  Board, Step, Widget, LayoutItem
  board.ts                  versioned, pure mutations + replay
  steps.ts                  deterministic transform engine
  ingest.ts                 CSV/JSON/clipboard/URL guards + limits
  inspect.ts                column stats + samples
  charts.ts                 Vega-Lite spec builder
```

## Invariants

1. `applySteps(raw, steps) === cleaned`.
2. Every mutation increments `version` and returns a receipt.
3. Proposals carry `baseVersion`; applies require the same version or fail.
4. Locked widget IDs cannot be updated or removed by tools.
5. Unknown step/widget types fail closed; column bindings are validated.
6. A board is portable: JSON contains data, steps, widgets, layout, locks.
7. Tool schemas are narrow: no open-ended transform params, no free-form SQL.

## State

- Board: `.microboard/board.json` in the server working directory.
- Override with `MICROBOARD_BOARD_PATH`.
- Exports: `.microboard/exports`, override with `MICROBOARD_EXPORT_DIR`.
- Proposals: in-memory, max 100, consumed on apply. Server restart loses them; re-propose.
- Writes are serialized by a promise queue so parallel tool calls cannot clobber.

## Ingest safety

- 20,000 rows, 200 columns, 10,000 chars/cell, 10 MB remote payloads.
- Only `http(s)` URLs; private, loopback, link-local, and `.local` hosts are refused.
- Google Sheets links are rewritten to CSV export URLs.
- DNS rebinding is not fully mitigated. Do not expose remote HTTP without a network policy.

## MCP Apps surface

- Resource: `ui://microboard/board.html`, MIME `text/html;profile=mcp-app`.
- Tools with UI metadata: `get_board_state`, `propose_transform`, `propose_widget`.
- App-only tools: `get_board_view`, `reject_proposal`, `lock_widget` (`_meta.ui.visibility: ["app"]`).
- The resource is self-contained: it inlines `@modelcontextprotocol/ext-apps/app-with-deps`, the view JS, and the view CSS. No network or CDN.
- The host passes the tool result to the iframe. The view uses `app.callServerTool` for refresh, approve, reject, and lock.
- Widgets arrive as server-rendered SVG so the iframe does not need Vega at runtime.
- Approve uses the proposal's `baseVersion`; reject only drops the in-memory proposal; lock uses the current board version. Every conflict is shown with a refresh path.
- Host theme and style variables are applied through `applyDocumentTheme` / `applyHostStyleVariables` when available.

## Rendering

- Each widget builds a Vega-Lite spec from `cleaned` rows.
- PNG: compile to Vega, render to SVG with `renderer: "none"`, compose the board SVG, rasterize with sharp.
- MCP App: render each widget to an SVG string and return it from `get_board_view`; the iframe lays them out responsively.
- HTML: embed the UMD bundles for Vega, Vega-Lite, and Vega-Embed; render each chart in the browser. No network needed.
- KPI and table widgets render as native SVG/HTML because they are not Vega marks.

## Deliberate omissions

Phase 3 adds a Hono landing/showcase/share site backed by signed self-contained URLs. Phase 4 adds math
helpers, DuckDB-WASM, themes, PPTX, and remote Streamable HTTP.
