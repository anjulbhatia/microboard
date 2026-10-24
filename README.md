<div align="center">

# Microboard

### MCP that turns data into auditable, shareable chart recipes — rendered inside any MCP host.

[![MCP](https://img.shields.io/badge/MCP-Streamable%20stdio-6d5efc?style=for-the-badge)](#install)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

</div>

Microboard is a local MCP server. Bring data, let an AI agent inspect it, propose deterministic transforms, and build a small board of charts. The board is a portable JSON recipe: `raw data → ordered steps → cleaned data + widgets`. Every write is version-checked, replayable, and refusable by a human.

No accounts. No SaaS. `npx microboard` in Claude Desktop, Claude Code, Cursor, VS Code, or any stdio MCP host.

## Why

Most AI chart tools give you a screenshot or silently rewrite state. Microboard keeps the recipe:

- **Deterministic** — replaying `steps` on `raw` always produces `cleaned`.
- **Auditable** — every transform, widget, and lock is recorded in one versioned document.
- **Human authority** — propose → approve → apply. Stale proposals fail closed.
- **Portable** — export PNG, a self-contained interactive HTML file, or the board JSON itself.
- **Small** — an 8-column grid, focused chart types, no drag-resize editor.

## Install

### Claude Desktop

`claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "microboard": {
      "command": "npx",
      "args": ["-y", "microboard"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add microboard -- npx -y microboard
```

### Cursor

`.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "microboard": {
      "command": "npx",
      "args": ["-y", "microboard"]
    }
  }
}
```

### VS Code

`.vscode/mcp.json`:

```json
{
  "servers": {
    "microboard": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "microboard"]
    }
  }
}
```

### From source

```bash
git clone https://github.com/anjulbhatia/microboard.git
cd microboard
bun install
bun run build
node mcp/dist/index.js
```

Then point your host at `node /absolute/path/to/microboard/mcp/dist/index.js`.

> npm publishing is pending. Until then use the source install.

## Use

Prompts that work:

- `Load this CSV, inspect it, then chart signups by channel.`
- `Group visitors by month, then add a KPI and a line chart.`
- `Filter out empty signups, dedupe by month+channel, and show a bar chart.`
- `Export the board as a PNG and as a self-contained HTML file.`

State lives in `.microboard/board.json` relative to the server's working directory. Exports go to `.microboard/exports/`.

| Env var | Default | Meaning |
|---|---|---|
| `MICROBOARD_BOARD_PATH` | `.microboard/board.json` | Board document path |
| `MICROBOARD_EXPORT_DIR` | `.microboard/exports` | Export output root |

## Tools

| Tool | Kind | Purpose |
|---|---|---|
| `load_data` | Write | Load CSV/JSON/clipboard/URL/Google Sheet/sample/inline rows |
| `inspect_data` | Read | Types, nulls, min/max/mean, sample rows, applied steps |
| `propose_transform` | Propose | Validate one transform and return a proposal + preview |
| `apply_transform` | Write | Apply an approved proposal at an expected version |
| `propose_widget` | Propose | Validate a chart/KPI/table and return a proposal |
| `add_widget` | Write | Add an approved widget at an expected version |
| `update_widget` | Write | Edit a widget; refuses locked widgets |
| `lock_widget` | Write | Freeze/unfreeze a widget against agent edits |
| `get_board_state` | Read | Full recipe + summary, or a sampled view |
| `export_board` | Action | PNG, self-contained HTML, or board JSON |
| `render_chart` | Action | Render one widget as PNG or SVG |

Every write returns a receipt and increments `version`. A write proposed against an older version fails with a version-conflict error instead of clobbering newer state.

## Transforms

`filter`, `select`, `rename`, `dropNulls`, `sort`, `groupBy`, `derive`, `header`, `dropDuplicates`, `fill`, `flashfill`, `replace`, `limit`.

Aggregations: `sum`, `count`, `average`, `min`, `max`. Conditions: `==`, `!=`, `contains`, `>`, `<`, `>=`, `<=`.

## Charts

`bar`, `line`, `area`, `point`, `sparkline`, `kpi`, `table`.

Built with [Vega-Lite](https://vega.github.io/vega-lite/) and rendered in Node with [Vega](https://vega.github.io/vega/) + [sharp](https://sharp.pixelplumbing.com/). Interactive HTML embeds Vega/Vega-Lite/Vega-Embed, so it works offline.

## Board document

```ts
interface Board {
  id: string;
  title: string;
  version: number;               // bumped on every write
  data: {
    source: "inline" | "url" | "upload" | null;
    raw: Row[] | null;
    cleaned: Row[] | null;
    columns: ColumnMeta[];
  };
  steps: Step[];                 // ordered, replayable audit trail
  layout: LayoutItem[];          // 8-column grid
  widgets: Record<string, Widget>;
  locks: string[];               // human-held widget IDs
  meta?: { createdAt: string; updatedAt: string; author?: string };
}
```

`steps` is load-bearing: `applySteps(raw, steps) === cleaned`. A shared board is a recipe, not a pixel snapshot.

See [`repurpose.md`](./repurpose.md) for the full plan and [`docs/architecture.md`](./docs/architecture.md) for the implementation map.

## Project layout

```text
microboard/
├── packages/core/        # framework-agnostic board model, transforms, ingest, chart specs
│   ├── src/
│   └── tests/
├── mcp/                  # stdio MCP server (the product)
│   ├── src/
│   │   ├── index.ts
│   │   ├── server.ts
│   │   ├── tools/
│   │   ├── render.ts
│   │   ├── store.ts
│   │   └── proposals.ts
│   └── tests/
├── examples/             # sample boards + prompt library
├── docs/                 # thin docs
├── legacy/               # frozen pre-repurpose app + Convex backend
└── repurpose.md          # source of truth
```

## Development

```bash
bun install
bun run dev          # run MCP server from source
bun run typecheck
bun run test
bun run lint
bun run build        # bundle mcp/dist/index.js
```

Configure the server in an MCP host, or smoke-test stdio with any MCP client.

## Not in scope yet

- Accounts, billing, “my dashboards” lists
- Remote Streamable HTTP (local stdio only for now)
- PDF/MDX/PPTX export
- Full drag-resize editor
- Dither/micro-chart visual theme
- Convex, AgentMail, auth, mailing

## License

[MIT](./LICENSE) © 2026 [Anjul Bhatia](https://github.com/anjulbhatia)
