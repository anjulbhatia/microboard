/**
 * src/lib/webmcp.ts
 *
 * Registers Microboard's WebMCP tools against document.modelContext.
 *
 * Drop this file in as `src/lib/webmcp.ts` and call `registerBoardTools()`
 * once, near app start (e.g. in CreatePage.tsx's top-level useEffect, or in
 * App.tsx). It returns a cleanup function — call it on unmount so tools
 * don't outlive the page they were registered from.
 *
 *   useEffect(() => registerBoardTools(), []);
 *
 * Requires: `bun add @mcp-b/global` (polyfills document.modelContext in
 * browsers that don't support the native WebMCP API yet — Chrome ships it
 * behind a flag/origin trial as of mid-2026, so you want the polyfill for
 * anything else). If document.modelContext already exists natively, the
 * polyfill import below is a no-op.
 *
 * Assumes a Zustand store at `./board-store` shaped like:
 *
 *   export const useBoardStore = create<BoardStoreState>((set, get) => ({
 *     board: initialBoard,
 *     setBoard: (board) => set({ board }),
 *   }));
 *
 * If your store exposes different action names, only `getBoard()` /
 * `commitBoard()` at the bottom of this file need to change — every tool
 * below is written against those two functions, not against Zustand
 * directly, so the rest of the file is store-shape-agnostic.
 */

import "@mcp-b/global";
import { useBoardStore } from "./board-store";
import type { Board, Step, Widget, LayoutItem } from "../types/board";

// ---------------------------------------------------------------------------
// Store bridge — the only two functions the tools below actually depend on.
// ---------------------------------------------------------------------------

function getBoard(): Board {
  return useBoardStore.getState().board;
}

function commitBoard(mutate: (board: Board) => Board): Board {
  const current = useBoardStore.getState().board;
  const next = mutate(structuredClone(current));
  next.version = current.version + 1;
  next.updatedAt = new Date().toISOString();
  useBoardStore.getState().setBoard(next);
  return next;
}

// ---------------------------------------------------------------------------
// Propose → approve → apply
//
// Proposals never touch the board. They sit in this in-memory map until a
// human-triggered apply_step / add_widget confirms them. Every proposal is
// stamped with the board version it was made against; if the board moved on
// in the meantime, apply fails closed instead of applying a step to data
// that no longer matches what the agent inspected.
// ---------------------------------------------------------------------------

type StepProposal = { kind: "step"; step: Step; atVersion: number };
type WidgetProposal = { kind: "widget"; widget: Widget; atVersion: number };
const proposals = new Map<string, StepProposal | WidgetProposal>();

function newId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

// ---------------------------------------------------------------------------
// Deterministic transform engine — mirrors AGENT.md §7 (MVP operation set).
// Pure function: same rows + same step always produces the same output.
// ---------------------------------------------------------------------------

function runStep(rows: any[], step: Step): any[] {
  const p = step.params;
  switch (step.type) {
    case "filter": {
      const { column, op, value } = p as { column: string; op: string; value: any };
      const cmp: Record<string, (a: any, b: any) => boolean> = {
        eq: (a, b) => a === b,
        neq: (a, b) => a !== b,
        gt: (a, b) => a > b,
        gte: (a, b) => a >= b,
        lt: (a, b) => a < b,
        lte: (a, b) => a <= b,
        contains: (a, b) => String(a).toLowerCase().includes(String(b).toLowerCase()),
      };
      const fn = cmp[op];
      if (!fn) throw new Error(`Unknown filter op "${op}"`);
      return rows.filter((r) => fn(r[column], value));
    }

    case "dropNulls": {
      const { columns } = p as { columns?: string[] };
      const cols = columns ?? Object.keys(rows[0] ?? {});
      return rows.filter((r) => cols.every((c) => r[c] !== null && r[c] !== undefined && r[c] !== ""));
    }

    case "select": {
      const { columns } = p as { columns: string[] };
      return rows.map((r) => Object.fromEntries(columns.map((c) => [c, r[c]])));
    }

    case "rename": {
      const { from, to } = p as { from: string; to: string };
      return rows.map((r) => {
        const { [from]: val, ...rest } = r;
        return { ...rest, [to]: val };
      });
    }

    case "sort": {
      const { column, direction = "asc" } = p as { column: string; direction?: "asc" | "desc" };
      const sorted = [...rows].sort((a, b) => (a[column] > b[column] ? 1 : a[column] < b[column] ? -1 : 0));
      return direction === "desc" ? sorted.reverse() : sorted;
    }

    case "groupBy": {
      const { by, agg, column, as } = p as {
        by: string | string[];
        agg: "sum" | "count" | "average" | "min" | "max";
        column?: string; // not required for count
        as?: string;
      };
      const byCols = Array.isArray(by) ? by : [by];
      const groups = new Map<string, any[]>();
      for (const row of rows) {
        const key = JSON.stringify(byCols.map((c) => row[c]));
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(row);
      }
      const aggFns: Record<string, (vals: number[]) => number> = {
        sum: (v) => v.reduce((a, b) => a + b, 0),
        count: (v) => v.length,
        average: (v) => v.reduce((a, b) => a + b, 0) / v.length,
        min: (v) => Math.min(...v),
        max: (v) => Math.max(...v),
      };
      const outKey = as ?? `${agg}_${column ?? "count"}`;
      return Array.from(groups.values()).map((groupRows) => {
        const base = Object.fromEntries(byCols.map((c) => [c, groupRows[0][c]]));
        const values = column ? groupRows.map((r) => Number(r[column])) : groupRows.map(() => 1);
        return { ...base, [outKey]: aggFns[agg](values) };
      });
    }

    default:
      throw new Error(`Unsupported step type "${(step as Step).type}"`);
  }
}

// ---------------------------------------------------------------------------
// Tool registration
// ---------------------------------------------------------------------------

export function registerBoardTools(): () => void {
  const controller = new AbortController();
  const { signal } = controller;

  // --- get_board_state --------------------------------------------------
  document.modelContext.registerTool(
    {
      name: "get_board_state",
      description:
        "Returns the full current board document (data, steps, widgets, layout, locks) and its version number. Call this first, and again after any apply, to stay in sync with what the human sees.",
      inputSchema: { type: "object", properties: {} },
      async execute() {
        const board = getBoard();
        return { content: [{ type: "text", text: JSON.stringify(board) }] };
      },
    },
    { signal },
  );

  // --- inspect_data --------------------------------------------------
  document.modelContext.registerTool(
    {
      name: "inspect_data",
      description:
        "Returns column names/types, null counts, a sample of rows, and basic numeric statistics for the board's current data (cleaned if available, otherwise raw). Use before proposing steps or widgets.",
      inputSchema: {
        type: "object",
        properties: {
          sampleSize: { type: "number", description: "Rows to include in the sample (default 5)" },
        },
      },
      async execute({ sampleSize = 5 }: { sampleSize?: number }) {
        const board = getBoard();
        const rows = board.data.cleaned ?? board.data.raw ?? [];
        if (rows.length === 0) {
          return { content: [{ type: "text", text: JSON.stringify({ columns: [], sample: [], rowCount: 0 }) }] };
        }
        const columns = Object.keys(rows[0]);
        const stats = Object.fromEntries(
          columns.map((col) => {
            const values = rows.map((r) => r[col]);
            const nulls = values.filter((v) => v === null || v === undefined || v === "").length;
            const numeric = values.filter((v) => typeof v === "number");
            return [
              col,
              {
                type: numeric.length === values.length ? "number" : "string",
                nullCount: nulls,
                ...(numeric.length > 0
                  ? { min: Math.min(...numeric), max: Math.max(...numeric) }
                  : {}),
              },
            ];
          }),
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ columns, rowCount: rows.length, sample: rows.slice(0, sampleSize), stats }),
            },
          ],
        };
      },
    },
    { signal },
  );

  // --- propose_step --------------------------------------------------
  document.modelContext.registerTool(
    {
      name: "propose_step",
      description:
        "Suggests a cleaning/aggregation step (filter, groupBy, sum, count, average, rename, dropNulls, select, sort) WITHOUT applying it. Returns a proposalId the human must approve via apply_step. Does not mutate the board.",
      inputSchema: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["filter", "groupBy", "sum", "count", "average", "rename", "dropNulls", "select", "sort"],
          },
          params: { type: "object", description: "Step-specific parameters, e.g. { column, op, value } for filter" },
          description: { type: "string", description: "Human-readable summary of what this step does and why" },
        },
        required: ["type", "params"],
      },
      async execute({ type, params, description }: { type: Step["type"]; params: Record<string, any>; description?: string }) {
        const board = getBoard();
        const step: Step = { id: newId("step"), type, params, timestamp: new Date().toISOString(), description };
        // Dry-run so the proposal is validated before the human ever sees it.
        try {
          runStep(board.data.cleaned ?? board.data.raw ?? [], step);
        } catch (err) {
          return { content: [{ type: "text", text: JSON.stringify({ error: String(err) }) }], isError: true };
        }
        const proposalId = newId("proposal");
        proposals.set(proposalId, { kind: "step", step, atVersion: board.version });
        return {
          content: [{ type: "text", text: JSON.stringify({ proposalId, step, boardVersion: board.version }) }],
        };
      },
    },
    { signal },
  );

  // --- apply_step --------------------------------------------------
  document.modelContext.registerTool(
    {
      name: "apply_step",
      description:
        "Applies a previously proposed step (from propose_step) to the board. Requires the human to have approved the proposal out-of-band — the UI is expected to gate calling this tool behind an explicit click. Fails closed if the board changed since the proposal was made.",
      inputSchema: {
        type: "object",
        properties: { proposalId: { type: "string" } },
        required: ["proposalId"],
      },
      async execute({ proposalId }: { proposalId: string }) {
        const proposal = proposals.get(proposalId);
        if (!proposal || proposal.kind !== "step") {
          return { content: [{ type: "text", text: "No such step proposal." }], isError: true };
        }
        const board = getBoard();
        if (proposal.atVersion !== board.version) {
          return {
            content: [
              {
                type: "text",
                text: `Stale proposal: board is at version ${board.version}, proposal was made against ${proposal.atVersion}. Re-run inspect_data and propose_step.`,
              },
            ],
            isError: true,
          };
        }
        const baseRows = board.data.cleaned ?? board.data.raw ?? [];
        const nextRows = runStep(baseRows, proposal.step);
        const updated = commitBoard((b) => {
          b.data.cleaned = nextRows;
          b.steps.push(proposal.step);
          return b;
        });
        proposals.delete(proposalId);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                applied: proposal.step,
                rowCountBefore: baseRows.length,
                rowCountAfter: nextRows.length,
                boardVersion: updated.version,
              }),
            },
          ],
        };
      },
    },
    { signal },
  );

  // --- propose_widget --------------------------------------------------
  document.modelContext.registerTool(
    {
      name: "propose_widget",
      description:
        "Suggests a new chart widget (type, title, x/y columns, size) WITHOUT adding it to the board. Returns a proposalId the human must approve via add_widget.",
      inputSchema: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["bar-chart-micro", "line-chart-micro", "dither-area", "dither-bar", "mono-line", "mono-bar", "kpi", "table"],
          },
          title: { type: "string" },
          x: { type: "string" },
          y: { type: ["string", "array"], items: { type: "string" } },
          size: { type: "string", enum: ["1x1", "1x2", "2x2", "2x4", "4x4", "full"] },
          config: { type: "object" },
        },
        required: ["type", "title", "size"],
      },
      async execute(input: Omit<Widget, "id">) {
        const board = getBoard();
        const columns = board.data.columns.map((c) => c.name ?? c);
        if (input.x && !columns.includes(input.x)) {
          return { content: [{ type: "text", text: `Column "${input.x}" not found on board.` }], isError: true };
        }
        const widget: Widget = { id: newId("widget"), ...input };
        const proposalId = newId("proposal");
        proposals.set(proposalId, { kind: "widget", widget, atVersion: board.version });
        return { content: [{ type: "text", text: JSON.stringify({ proposalId, widget, boardVersion: board.version }) }] };
      },
    },
    { signal },
  );

  // --- add_widget --------------------------------------------------
  document.modelContext.registerTool(
    {
      name: "add_widget",
      description:
        "Adds a previously proposed widget (from propose_widget) to the board canvas, placing it in the first open grid slot. Requires human approval of the proposal.",
      inputSchema: {
        type: "object",
        properties: { proposalId: { type: "string" } },
        required: ["proposalId"],
      },
      async execute({ proposalId }: { proposalId: string }) {
        const proposal = proposals.get(proposalId);
        if (!proposal || proposal.kind !== "widget") {
          return { content: [{ type: "text", text: "No such widget proposal." }], isError: true };
        }
        const board = getBoard();
        if (proposal.atVersion !== board.version) {
          return {
            content: [{ type: "text", text: `Stale proposal: board is at version ${board.version}.` }],
            isError: true,
          };
        }
        const sizeToWH: Record<Widget["size"], { w: number; h: number }> = {
          "1x1": { w: 1, h: 1 },
          "1x2": { w: 1, h: 2 },
          "2x2": { w: 2, h: 2 },
          "2x4": { w: 2, h: 4 },
          "4x4": { w: 4, h: 4 },
          full: { w: 4, h: 2 },
        };
        const { w, h } = sizeToWH[proposal.widget.size];
        const maxY = board.layout.reduce((m, l) => Math.max(m, l.y + l.h), 0);
        const layoutItem: LayoutItem = { i: proposal.widget.id, x: 0, y: maxY, w, h };

        const updated = commitBoard((b) => {
          b.widgets[proposal.widget.id] = proposal.widget;
          b.layout.push(layoutItem);
          return b;
        });
        proposals.delete(proposalId);
        return {
          content: [{ type: "text", text: JSON.stringify({ added: proposal.widget, layout: layoutItem, boardVersion: updated.version }) }],
        };
      },
    },
    { signal },
  );

  // --- update_layout --------------------------------------------------
  document.modelContext.registerTool(
    {
      name: "update_layout",
      description: "Moves or resizes an existing widget on the grid. Refuses to move locked widgets.",
      inputSchema: {
        type: "object",
        properties: {
          widgetId: { type: "string" },
          x: { type: "number" },
          y: { type: "number" },
          w: { type: "number" },
          h: { type: "number" },
        },
        required: ["widgetId"],
      },
      async execute({ widgetId, x, y, w, h }: { widgetId: string; x?: number; y?: number; w?: number; h?: number }) {
        const board = getBoard();
        if (board.locks.includes(widgetId)) {
          return { content: [{ type: "text", text: `Widget ${widgetId} is locked by the human and cannot be moved.` }], isError: true };
        }
        const existing = board.layout.find((l) => l.i === widgetId);
        if (!existing) {
          return { content: [{ type: "text", text: `No widget ${widgetId} on the layout.` }], isError: true };
        }
        const updated = commitBoard((b) => {
          const item = b.layout.find((l) => l.i === widgetId)!;
          if (x !== undefined) item.x = x;
          if (y !== undefined) item.y = y;
          if (w !== undefined) item.w = w;
          if (h !== undefined) item.h = h;
          return b;
        });
        return { content: [{ type: "text", text: JSON.stringify({ widgetId, boardVersion: updated.version }) }] };
      },
    },
    { signal },
  );

  // --- lock_widget --------------------------------------------------
  // Human-authority tool. Exposed to the agent as read/inspectable, but in
  // the UI this should only ever be invoked by a direct user action (e.g.
  // a lock icon click calling this same tool's execute function directly),
  // not offered to the agent as something to call on its own initiative.
  document.modelContext.registerTool(
    {
      name: "lock_widget",
      description:
        "Locks or unlocks a widget so the agent cannot modify or move it. This tool represents human authority over the board — it should be invoked from a direct user action, not autonomously by the agent.",
      inputSchema: {
        type: "object",
        properties: { widgetId: { type: "string" }, locked: { type: "boolean" } },
        required: ["widgetId", "locked"],
      },
      async execute({ widgetId, locked }: { widgetId: string; locked: boolean }) {
        const board = getBoard();
        if (!board.widgets[widgetId]) {
          return { content: [{ type: "text", text: `No widget ${widgetId} on the board.` }], isError: true };
        }
        const updated = commitBoard((b) => {
          b.locks = locked ? Array.from(new Set([...b.locks, widgetId])) : b.locks.filter((id) => id !== widgetId);
          return b;
        });
        return { content: [{ type: "text", text: JSON.stringify({ widgetId, locked, boardVersion: updated.version }) }] };
      },
    },
    { signal },
  );

  // --- export_board --------------------------------------------------
  document.modelContext.registerTool(
    {
      name: "export_board",
      description:
        "Generates a PNG/PDF of the current canvas or a public share link. This is a terminal action — it does not publish anything without the human having triggered the export from the UI; calling it returns a placeholder receipt describing what would be exported.",
      inputSchema: {
        type: "object",
        properties: { format: { type: "string", enum: ["png", "pdf", "link"] } },
        required: ["format"],
      },
      async execute({ format }: { format: "png" | "pdf" | "link" }) {
        const board = getBoard();
        // Wire this up to your actual lib/export.ts + Convex share mutation.
        // Left as an explicit stub so it's obvious this still needs the
        // human-confirmed export/share flow behind it, per AGENT.md §8:
        // "No tool can finalize or publish without human confirmation."
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                status: "pending_human_confirmation",
                format,
                boardId: board.id,
                boardVersion: board.version,
              }),
            },
          ],
        };
      },
    },
    { signal },
  );

  return () => controller.abort();
}