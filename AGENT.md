# AGENT.md — Microboard

> **Microboard** is a collaborative data-to-dashboard workspace where a human and an AI agent build clean, beautiful microchart dashboards together on the same live canvas.
>
> **Clean data. Craft microcharts. Ship dashboards — with your agent.**

---

## 1. Product Vision

Microboard lets users:

1. Upload or paste data (CSV / JSON / direct paste)
2. Clean and aggregate the data through simple, deterministic steps
3. Build a visual board of microcharts and larger charts
4. Arrange widgets on a responsive grid
5. Export (PNG / PDF) or share a live link

**WebMCP** makes the agent a first-class collaborator. Both human and agent operate on the exact same deterministic board state. The agent proposes changes; the human retains final authority.

---

## 2. Core Principles

* **Deterministic by design** — The entire board is a versioned JSON document.
* **Shared source of truth** — Human UI and agent tools read/write the same state.
* **Human authority** — Consequential actions require explicit human approval.
* **Propose → Approve → Apply** — Agent never silently mutates critical state.
* **Visible collaboration** — Agent activity and receipts are shown on the page.
* **Minimal backend** — Almost everything runs client-side. Convex is used only for sharing and showcase.

---

## 3. Tech Stack

| Layer              | Choice                                                  | Notes                       |
| ------------------ | ------------------------------------------------------- | --------------------------- |
| Framework          | React 19 + TypeScript + Vite                            | Lightweight SPA             |
| Routing            | React Router v7                                         | Simple routes               |
| Styling            | Tailwind CSS v4 + shadcn/ui                             | Modern, clean               |
| Theme              | `npx shadcn add https://paletteui.xyz/r/wednesday.json` | Gothic black + muted purple |
| State              | Zustand                                                 | Single board store          |
| Backend            | Convex                                                  | Only for share + showcase   |
| Charts (primary)   | Dither Kit (`tripwire.sh/dither-kit`)                   | Beautiful dithered charts   |
| Charts (secondary) | Mono Charts (Amicro)                                    | Minimalist monochrome       |
| Charts (micro)     | `@microcharts/react`                                    | Tiny sparklines / 1×1 cells |
| Data transforms    | Pure TypeScript helpers (+ Arquero optional)            | Browser-first               |
| Deployment         | Vercel                                                  | Fast & simple               |
| Icons              | Lucide React                                            | Comes with shadcn           |

---

## 4. Routes

```text
/          → Landing page (Hero, Showcase preview, Footer)
/create    → Main board editor (primary experience)
/b/:id     → Public shared board (read-only or light interaction)
/showcase  → Public gallery of shared boards (optional)
```

---

## 5. High-Level Architecture

```text
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Vite)                     │
│                                                         │
│   Landing → Create Board → Live Canvas + Agent Panel   │
│                            ↓                            │
│                  Zustand Board Store                   │
│                         (JSON)                          │
│                            ↓                            │
│              WebMCP Tools                              │
│           (document.modelContext)                       │
└───────────────────────────┬─────────────────────────────┘
                            │
                            │ only on Share
                            ↓
                  ┌─────────────────┐
                  │     Convex      │
                  │   boards+links  │
                  └─────────────────┘
```

* The live board state lives entirely in the browser (Zustand).
* WebMCP tools read and propose changes to this state.
* Convex is used only when the user clicks **Share** or when loading a public board / showcase.

---

## 6. Deterministic Board Document

Every board is a single versioned JSON document. This is the single source of truth.

### `Board`

```typescript
interface Board {
  id: string;
  title: string;
  version: number; // Incremented on every mutation
  createdAt: string;
  updatedAt: string;

  data: {
    source: "inline" | "url" | "convex";
    raw: any[] | null; // Original data
    cleaned: any[] | null; // After steps are applied
    columns: ColumnMeta[];
  };

  steps: Step[]; // Ordered transformation history (Power BI style)

  layout: LayoutItem[]; // Grid positions
  widgets: Record<string, Widget>; // Chart definitions
  locks: string[]; // Locked widget IDs (human authority)

  meta?: Record<string, any>;
}
```

### `Step` — Transformation

```typescript
interface Step {
  id: string;
  type:
    | "filter"
    | "groupBy"
    | "sum"
    | "count"
    | "average"
    | "rename"
    | "dropNulls"
    | "select"
    | "sort";

  params: Record<string, any>;
  timestamp: string;
  description?: string; // Human-readable
}
```

### `Widget`

```typescript
interface Widget {
  id: string;

  type:
    | "bar-chart-micro"
    | "line-chart-micro"
    | "dither-area"
    | "dither-bar"
    | "mono-line"
    | "mono-bar"
    | "kpi"
    | "table";

  title: string;

  x?: string; // Column
  y?: string | string[]; // Column(s)

  config?: Record<string, any>; // Chart-specific options

  size: "1x1" | "1x2" | "2x2" | "2x4" | "4x4" | "full";
}
```

### `LayoutItem`

```typescript
interface LayoutItem {
  i: string; // Widget ID
  x: number;
  y: number;
  w: number;
  h: number;
}
```

---

## 7. Data Transformation Approach

* All transformations are client-side and deterministic.
* Each transformation is recorded as a `Step` in the board document.
* Replaying the `steps` array on raw data always produces the same cleaned data.

### Preferred Libraries

* **Arquero** (University of Washington)
* Pure TypeScript transformation helpers

### Supported Operations (MVP)

* `filter`
* `groupBy` + aggregations:

  * `sum`
  * `count`
  * `average`
  * `min`
  * `max`
* `select`
* `rename`
* `dropNulls`
* `sort`

---

## 8. WebMCP Tools

All tools operate on the board JSON.

They follow the pattern:

> **Read → Propose → Human Approves → Apply**

### Core Tools

| Tool              | Type    | Description                                                          |
| ----------------- | ------- | -------------------------------------------------------------------- |
| `get_board_state` | Read    | Returns full current board JSON + version                            |
| `inspect_data`    | Read    | Returns column types, null counts, sample rows, and basic statistics |
| `propose_step`    | Propose | Suggests a cleaning / aggregation step without applying it           |
| `apply_step`      | Write   | Applies a previously proposed step; requires human approval          |
| `propose_widget`  | Propose | Suggests a new chart widget                                          |
| `add_widget`      | Write   | Adds an approved widget to the board                                 |
| `update_layout`   | Write   | Moves / resizes widgets                                              |
| `lock_widget`     | Write   | Human locks a widget so the agent cannot modify it                   |
| `export_board`    | Action  | Generates PNG / PDF or a share link                                  |

### Tool Design Rules

* Use narrow, closed input schemas.
* Every write operation returns a clear receipt.
* Stale proposals fail closed on version mismatch.
* No tool can finalize or publish without human confirmation.
* Locked widgets cannot be modified by the agent.
* Every mutation increments the board version.

---

## 9. Folder Structure

```text
microboard/
├── public/
│
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   │
│   ├── app/
│   │   ├── LandingPage.tsx
│   │   ├── CreatePage.tsx          # Main editor
│   │   ├── SharedBoardPage.tsx     # /b/:id
│   │   └── ShowcasePage.tsx
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── AgentActivityPanel.tsx  # Visible tool calls & receipts
│   │   │
│   │   ├── board/
│   │   │   ├── BoardCanvas.tsx
│   │   │   ├── ChartWidget.tsx
│   │   │   └── EmptyState.tsx
│   │   │
│   │   ├── data/
│   │   │   ├── DataUploader.tsx
│   │   │   ├── DataPreview.tsx
│   │   │   └── CleanPanel.tsx
│   │   │
│   │   ├── charts/
│   │   │   ├── MicroChart.tsx
│   │   │   ├── MonoChart.tsx
│   │   │   ├── DitherChart.tsx
│   │   │   └── ChartSelector.tsx
│   │   │
│   │   ├── export/
│   │   │   ├── ExportButton.tsx
│   │   │   └── ShareDialog.tsx
│   │   │
│   │   └── ui/                    # shadcn components
│   │
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── board-store.ts          # Zustand store
│   │   ├── data-utils.ts           # Transformation helpers
│   │   ├── export.ts
│   │   └── webmcp.ts               # registerTool helpers
│   │
│   ├── types/
│   │   ├── board.ts
│   │   ├── chart.ts
│   │   └── data.ts
│   │
│   └── hooks/
│       ├── useBoard.ts
│       ├── useWebMCP.ts
│       └── useShare.ts
│
├── convex/
│   ├── schema.ts
│   ├── boards.ts                   # Create / get shared board
│   └── showcase.ts
│
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── components.json
└── package.json
```

---

## 10. Key User Flows

### A. Create Flow

1. User lands on `/create`.
2. User uploads or pastes data.
3. Agent (or human) proposes cleaning steps.
4. Human approves → steps are applied and recorded.
5. Agent proposes charts.
6. Human approves → widgets appear on the canvas.
7. Human rearranges / locks widgets.
8. User exports or shares.

### B. Share Flow

1. User clicks **Share**.
2. Current board JSON is saved to Convex.
3. A short public link `/b/:id` is generated.
4. Anyone with the link can view the board.

### C. Agent Collaboration Loop

```text
Agent calls get_board_state
        ↓
Agent calls propose_step or propose_widget
        ↓
Human sees proposal in Agent Activity panel
        ↓
Human approves
        ↓
Agent or UI calls apply_step / add_widget
        ↓
Board version increments
        ↓
UI updates instantly
```

---

## 11. Winning Criteria Alignment

| Judging Criteria     | How Microboard Addresses It                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| **WebMCP Leverage**  | Tools operate on a deterministic JSON board with a clear propose / approve / apply pattern.     |
| **Execution**        | Focused MVP with one polished end-to-end loop.                                                  |
| **Potential Impact** | Real workflow for analysts and PMs who currently jump between Sheets, scripts, and chart tools. |
| **Creativity**       | Visual co-creation canvas + deterministic document model + visible human authority.             |

---

## 12. Implementation Priorities (Time-Boxed)

### Must Ship

* Board JSON model + Zustand store
* Data upload + basic transformations
* 4–6 WebMCP tools with propose/apply pattern
* Simple grid + chart widgets (Dither + Micro)
* Agent Activity panel
* Share → `/b/:id`
* Landing page
* Working live URL + demo video

### Nice to Have

* Showcase gallery
* PNG / PDF export
* Widget locking UI
* Arquero integration

### Drop for Now

* Full user accounts / profiles
* Real-time multiplayer
* Complex authentication

---

## 13. Success Metric for the Demo

In **under 90 seconds**, a judge should see:

1. Data loaded.
2. Agent proposes a cleaning step → human approves.
3. Agent proposes charts → charts appear on the canvas.
4. Human rearranges or locks a widget.
5. Clear visual proof that the human and agent are collaborating on the **same deterministic state**.

---

## 14. Definition of Done

The MVP is considered complete when a fresh user can:

* Load a dataset without backend setup.
* Inspect the dataset.
* Perform deterministic transformations.
* See every transformation represented in the board document.
* Ask the agent to propose useful transformations.
* Approve or reject proposals.
* Ask the agent to propose charts.
* Approve charts and see them rendered on the same live canvas.
* Rearrange widgets.
* Lock widgets against agent modification.
* Share the resulting board through `/b/:id`.
* Reload the shared link and reproduce the same board state.
* Observe clear agent activity and mutation receipts throughout the workflow.

**Core invariant:**

> The UI, transformation engine, chart system, and WebMCP agent must all operate against the same versioned `Board` document.
