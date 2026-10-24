# Architecture

> Source of truth: [`repurpose.md`](../repurpose.md). This file maps the plan to code.

## Layers

```text
MCP host (Claude, Cursor, VS Code, ...)
        │ stdio JSON-RPC
        ▼
mcp/src/index.ts            entry
mcp/src/server.ts           tool registration + instructions
mcp/src/tools/data.ts       load_data, inspect_data
mcp/src/tools/board.ts      propose/apply/update/lock/get
mcp/src/tools/export.ts     export_board, render_chart
mcp/src/store.ts            .microboard/board.json persistence + write lock
mcp/src/proposals.ts        in-memory propose → approve handoff
mcp/src/render.ts           Vega → SVG → PNG; self-contained HTML
        │
        ▼
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

## Rendering

- Each widget builds a Vega-Lite spec from `cleaned` rows.
- PNG: compile to Vega, render to SVG with `renderer: "none"`, compose the board SVG, rasterize with sharp.
- HTML: embed the UMD bundles for Vega, Vega-Lite, and Vega-Embed; render each chart in the browser. No network needed.
- KPI and table widgets render as native SVG/HTML because they are not Vega marks.

## Deliberate omissions

Phase 2 adds an MCP App (`ui://`) iframe for approve/reject/lock. Phase 3 adds a Hono
landing/showcase/share site backed by signed self-contained URLs. Phase 4 adds math
helpers, DuckDB-WASM, themes, PPTX, and remote Streamable HTTP.
