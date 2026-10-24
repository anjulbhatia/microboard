# Agent notes — Microboard MCP

Microboard is a local stdio MCP server that turns data into auditable, replayable chart recipes. It is no longer a SaaS or a Convex app.

Source of truth: `repurpose.md`. Read it before changing product scope.

## Layout

- `packages/core` — board model, deterministic transforms, ingest, inspect, Vega-Lite specs. No React, no DOM.
- `mcp` — the product: stdio server, tools, persistence, rendering, tests.
- `examples` — sample boards and prompts.
- `legacy` — frozen pre-repurpose app/Convex/tests/docs. Never import from it.
- `docs/architecture.md` — implementation map.

## Commands

```bash
bun install
bun run dev          # MCP server from source
bun run typecheck
bun run test
bun run lint
bun run build        # mcp/dist/index.js
```

## Invariants

1. `applySteps(raw, steps) === cleaned` must hold for every board.
2. Every write increments `version` and returns a receipt.
3. Proposals carry `baseVersion`; apply fails closed on mismatch.
4. Locked widgets cannot be updated/removed by tools.
5. Unknown step/widget types and unknown columns fail closed.
6. Tool schemas stay narrow. Do not add free-form `params` that bypass a validator.
7. `mcp` may import `packages/core`; `packages/core` must not import `mcp`.
8. No Convex, auth, mailing, accounts, or “my boards” surfaces. Do not reintroduce them.

## Style

- TypeScript, ESM, strict.
- No comments unless the reason is non-obvious.
- Every new tool: schema, receipt, version check, lock check if it writes, test.
- Logs go to stderr. stdout is reserved for MCP JSON-RPC.
