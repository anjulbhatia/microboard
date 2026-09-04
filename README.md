# Microboard

**Make modern data stories using AI.**

Live: [microboard-three.vercel.app](https://microboard-three.vercel.app)

A collaborative data-to-dashboard workspace. You bring the data, an agent proposes what to do with it, you approve or reject, and both of you build a microchart dashboard on the same live canvas. Neither side works from a copy — there is exactly one board, and the agent's only way to touch it is through the same door you use.

---

## Why this exists

Most "AI dashboard" demos are one of two things: a chatbot that describes a chart in prose, or an agent that silently rewrites your workspace and hopes you like the result when you tab back in. Both break the thing that makes a dashboard trustworthy — you no longer know exactly why a number looks the way it does, or who changed it.

The actual workflow analysts and PMs live in — Sheets, a scratch Python script, a chart tool, a screenshot into a deck — has no shared state at all. Every handoff is a re-explanation.

Microboard is built around one constraint: **the agent and the human read and write the same versioned document, and nothing consequential happens without a human clicking approve.** WebMCP is what makes that possible — it gives an agent tool calls that operate on live, in-page state rather than a sandbox the agent can't see and you can't inspect. The interesting part isn't "AI makes charts." It's that the provenance of every chart — which raw rows, which transform steps, in which order — is inspectable, replayable, and never silently mutated.

---

## What's built

A single-page app where:

1. You load data (CSV, JSON, or paste).
2. You or the agent proposes a cleaning/aggregation step — filter, group, sum, rename, sort, whatever's needed.
3. You approve. The step is recorded, applied, and the board's version counter ticks up.
4. The agent proposes chart widgets against the cleaned data.
5. You approve. Widgets land on a grid canvas.
6. You drag, resize, and lock widgets the agent shouldn't touch.
7. You share a link, or export the board as an image/PDF.

The entire board — raw data, transform history, widgets, layout, locks — is one JSON document. Replaying the transform log against the raw data deterministically reproduces the cleaned data. There is no hidden state anywhere: not in the agent's context, not in a backend cache. What you see is the document, and the document is what the agent sees.

### The propose → approve → apply loop

This is the core design decision, not a UI nicety:

```
Agent calls get_board_state
        ↓
Agent calls propose_step / propose_widget
        ↓
Proposal renders in the Agent Activity panel
        ↓
Human approves
        ↓
apply_step / add_widget mutates the board
        ↓
version++, UI updates
```

No WebMCP tool can finalize, publish, or overwrite a locked widget on its own. Every write returns a receipt. Every proposal checks the board version it was made against, so if the human changed something in between, the proposal fails closed instead of clobbering the newer state.

### WebMCP tools

| Tool | Kind | What it does |
|---|---|---|
| `get_board_state` | Read | Full board JSON + current version |
| `inspect_data` | Read | Column types, null counts, sample rows, basic stats |
| `propose_step` | Propose | Suggests a transform without applying it |
| `apply_step` | Write | Applies an approved step (requires human confirmation) |
| `propose_widget` | Propose | Suggests a chart |
| `add_widget` | Write | Adds an approved widget to the canvas |
| `update_layout` | Write | Moves / resizes widgets |
| `lock_widget` | Write | Human-only: freezes a widget against agent edits |
| `export_board` | Action | PNG / PDF / share link |

Schemas are narrow and closed on purpose — an agent that can call `propose_step` with an open-ended `params` object is an agent you can't reason about. Every one of these tools does exactly one thing.

---

## The board document

```typescript
interface Board {
  id: string;
  title: string;
  version: number;          // bumped on every mutation
  data: {
    source: "inline" | "url" | "convex";
    raw: any[] | null;
    cleaned: any[] | null;
    columns: ColumnMeta[];
  };
  steps: Step[];             // ordered transform history — the audit trail
  layout: LayoutItem[];      // grid positions
  widgets: Record<string, Widget>;
  locks: string[];           // widget IDs the agent may not touch
}
```

`steps` is the load-bearing part of this schema. It's a Power BI–style applied-steps list: `filter`, `groupBy`, `sum`/`count`/`average`/`min`/`max`, `select`, `rename`, `dropNulls`, `sort`. Replay it on `raw` and you always get `cleaned`. That means a shared board isn't a snapshot of pixels — it's a recipe. Anyone who opens `/b/:id` gets the same document and can see exactly how the data got to where it is.

---

## Architecture

Almost everything runs in the browser. There's no backend to keep in sync because there's nothing to sync — the board lives in a single Zustand store, and WebMCP tools are just functions registered against that store via `document.modelContext`. Convex only exists for two moments: saving a board when you click **Share**, and loading a public board or the showcase gallery.

```
Landing → Create (editor) → Live Canvas + Agent Panel
                                    ↓
                          Zustand Board Store (JSON)
                                    ↓
                    WebMCP Tools (document.modelContext)
                                    │
                            only on Share
                                    ↓
                          Convex (boards + links)
```

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | React 19 + TypeScript + Vite | No server round-trip for board mutations |
| Routing | React Router v7 | Four routes, no more |
| Styling | Tailwind v4 + shadcn/ui | Fast to theme, easy to keep consistent |
| State | Zustand | One store, one source of truth |
| Backend | Convex | Share + showcase only — not in the critical path |
| Charts | Dither Kit, Mono Charts, `@microcharts/react` | Dithered/monochrome for the primary look, true sparklines for 1×1 cells |
| Transforms | Plain TypeScript (+ optional Arquero) | Deterministic, replayable, no server needed |
| Deploy | Vercel | — |

## Routes

```
/          Landing
/create    Board editor — where the agent loop happens
/b/:id     Public, read-only shared board
/showcase  Gallery of shared boards
```

---

## Running it

```bash
bun install
bun dev
```

Convex is only required if you want `/create` → Share or `/showcase` to work end to end; the editor itself runs fully client-side without it.

---

## What's deliberately not here yet

User accounts, real-time multiplayer editing, and full auth are out of scope for this build. The bet was on getting the propose/approve/apply loop and the deterministic document model right for one user and one agent working the same board, rather than spreading the same time across features that don't test the core idea.

## License

MIT