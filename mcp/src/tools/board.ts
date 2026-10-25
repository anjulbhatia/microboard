import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  addStep,
  addWidget,
  assertVersion,
  boardSummary,
  lockWidget,
  updateWidget,
  type NewWidgetInput,
  type WidgetType,
} from "@microboard/core";
import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { createProposal, consumeProposal, getProposal } from "../proposals.js";
import { widgetToSvg } from "../render.js";
import { jsonResult, receipt, runTool } from "../result.js";
import { loadBoard, saveBoard, withBoardLock } from "../store.js";
import { BOARD_UI_URI } from "../ui.js";

const STEP_TYPES = [
  "filter",
  "groupBy",
  "select",
  "rename",
  "dropNulls",
  "sort",
  "header",
  "dropDuplicates",
  "fill",
  "flashfill",
  "replace",
  "limit",
  "derive",
] as const;

const WIDGET_TYPES = ["bar", "line", "area", "point", "kpi", "table", "sparkline"] as const;

const paramsSchema = z.record(z.string(), z.unknown()).optional();

const widgetInputs = {
  type: z.enum(WIDGET_TYPES),
  title: z.string().optional(),
  x: z.string().optional().describe("X / category / label column."),
  y: z.string().optional().describe("Y / value column."),
  y2: z.string().optional().describe("Optional second value column."),
  props: z.record(z.string(), z.unknown()).optional(),
  w: z.number().int().min(1).max(8).optional(),
  h: z.number().int().min(1).max(10).optional(),
};

function widgetInput(args: {
  type: WidgetType;
  title?: string;
  x?: string;
  y?: string;
  y2?: string;
  props?: Record<string, unknown>;
  w?: number;
  h?: number;
}): NewWidgetInput {
  return {
    type: args.type,
    ...(args.title !== undefined ? { title: args.title } : {}),
    ...(args.x !== undefined ? { x: args.x } : {}),
    ...(args.y !== undefined ? { y: args.y } : {}),
    ...(args.y2 !== undefined ? { y2: args.y2 } : {}),
    ...(args.props !== undefined ? { props: args.props } : {}),
    ...(args.w !== undefined ? { w: args.w } : {}),
    ...(args.h !== undefined ? { h: args.h } : {}),
  };
}

export function registerBoardTools(server: McpServer): void {
  registerAppTool(
    server,
    "propose_transform",
    {
      title: "Propose transform",
      description:
        "Validate and describe one transform step without applying it. Returns a proposalId and a preview. A human or the host must approve before apply_transform.",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        type: z.enum(STEP_TYPES),
        params: paramsSchema.describe("Step parameters, e.g. { column, cond, value } for filter."),
        description: z.string().optional().describe("Human-readable label."),
      },
      _meta: { ui: { resourceUri: BOARD_UI_URI } },
    },
    async ({ type, params, description }) =>
      runTool(async () => {
        const board = await loadBoard();
        if (!board.data.raw) throw new Error("Board has no data. Call load_data first.");
        const next = addStep(board, type, params ?? {}, description);
        const proposal = createProposal({
          kind: "transform",
          baseVersion: board.version,
          payload: { type, params: params ?? {}, ...(description ? { description } : {}) },
        });
        return jsonResult({
          ok: true,
          proposalId: proposal.id,
          baseVersion: proposal.baseVersion,
          kind: proposal.kind,
          step: { type, params: params ?? {}, description: description ?? null },
          preview: {
            rowsBefore: board.data.cleaned?.length ?? 0,
            rowsAfter: next.data.cleaned?.length ?? 0,
            columnsAfter: next.data.columns.map((c) => c.name),
          },
        });
      })
  );

  server.registerTool(
    "apply_transform",
    {
      title: "Apply transform",
      description:
        "Apply an approved transform proposal. Fails closed if the board version changed since the proposal was created.",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      inputSchema: {
        proposalId: z.string().describe("Proposal id from propose_transform."),
        expectedVersion: z.number().int().nonnegative().describe("Board version observed before applying."),
      },
    },
    async ({ proposalId, expectedVersion }) =>
      runTool(async () =>
        withBoardLock(async () => {
          const board = await loadBoard();
          assertVersion(board, expectedVersion);
          const proposal = getProposal(proposalId);
          if (!proposal || proposal.kind !== "transform") {
            throw new Error(`No transform proposal "${proposalId}". Re-run propose_transform.`);
          }
          if (proposal.baseVersion !== board.version) {
            throw new Error(
              `Version conflict: proposal was made at v${proposal.baseVersion}, board is v${board.version}. Re-propose.`
            );
          }
          const next = addStep(
            board,
            proposal.payload.type,
            proposal.payload.params,
            proposal.payload.description
          );
          await saveBoard(next);
          consumeProposal(proposalId);
          return jsonResult(
            receipt("apply_transform", next, {
              proposalId,
              step: {
                type: proposal.payload.type,
                params: proposal.payload.params,
                description: next.steps[next.steps.length - 1]?.description ?? null,
              },
              rows: next.data.cleaned?.length ?? 0,
              columns: next.data.columns.map((c) => c.name),
            })
          );
        })
      )
  );

  registerAppTool(
    server,
    "propose_widget",
    {
      title: "Propose widget",
      description:
        "Validate and describe a chart, KPI, sparkline, or table widget without adding it to the board. Returns a proposalId for add_widget.",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: widgetInputs,
      _meta: { ui: { resourceUri: BOARD_UI_URI } },
    },
    async (args) =>
      runTool(async () => {
        const board = await loadBoard();
        if (!board.data.raw) throw new Error("Board has no data. Call load_data first.");
        const next = addWidget(board, widgetInput(args));
        const created = Object.values(next.widgets).at(-1);
        const proposal = createProposal({
          kind: "widget",
          baseVersion: board.version,
          payload: widgetInput(args),
        });
        const payload = {
          ok: true,
          proposalId: proposal.id,
          baseVersion: proposal.baseVersion,
          kind: proposal.kind,
          widget: {
            type: created?.type ?? args.type,
            title: created?.title ?? args.title ?? null,
            x: created?.x ?? null,
            y: created?.y ?? null,
            y2: created?.y2 ?? null,
          },
        };
        const result = jsonResult(payload);
        result.structuredContent = {
          ...payload,
          preview: {
            svg: created ? await widgetToSvg(next, created, 720, 420) : null,
          },
        };
        return result;
      })
  );

  server.registerTool(
    "add_widget",
    {
      title: "Add widget",
      description:
        "Add an approved widget proposal to the board. Fails closed on a version mismatch. Locked widgets are never affected.",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      inputSchema: {
        proposalId: z.string().describe("Proposal id from propose_widget."),
        expectedVersion: z.number().int().nonnegative().describe("Board version observed before applying."),
      },
    },
    async ({ proposalId, expectedVersion }) =>
      runTool(async () =>
        withBoardLock(async () => {
          const board = await loadBoard();
          assertVersion(board, expectedVersion);
          const proposal = getProposal(proposalId);
          if (!proposal || proposal.kind !== "widget") {
            throw new Error(`No widget proposal "${proposalId}". Re-run propose_widget.`);
          }
          if (proposal.baseVersion !== board.version) {
            throw new Error(
              `Version conflict: proposal was made at v${proposal.baseVersion}, board is v${board.version}. Re-propose.`
            );
          }
          const next = addWidget(board, proposal.payload);
          await saveBoard(next);
          consumeProposal(proposalId);
          const added = Object.values(next.widgets).at(-1);
          return jsonResult(
            receipt("add_widget", next, {
              proposalId,
              widget: added
                ? {
                    id: added.id,
                    type: added.type,
                    title: added.title,
                    x: added.x ?? null,
                    y: added.y ?? null,
                  }
                : null,
              layout: added ? next.layout.find((item) => item.i === added.id) ?? null : null,
            })
          );
        })
      )
  );

  server.registerTool(
    "update_widget",
    {
      title: "Update widget",
      description: "Edit an existing widget. Refuses locked widgets. Requires the current board version.",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      inputSchema: {
        widgetId: z.string(),
        expectedVersion: z.number().int().nonnegative(),
        type: z.enum(WIDGET_TYPES).optional(),
        title: z.string().optional(),
        x: z.string().optional(),
        y: z.string().optional(),
        y2: z.string().optional(),
        props: z.record(z.string(), z.unknown()).optional(),
      },
    },
    async ({ widgetId, expectedVersion, type, title, x, y, y2, props }) =>
      runTool(async () =>
        withBoardLock(async () => {
          const board = await loadBoard();
          assertVersion(board, expectedVersion);
          const patch: Partial<NewWidgetInput> = {};
          if (type !== undefined) patch.type = type;
          if (title !== undefined) patch.title = title;
          if (x !== undefined) patch.x = x;
          if (y !== undefined) patch.y = y;
          if (y2 !== undefined) patch.y2 = y2;
          if (props !== undefined) patch.props = props;
          const next = updateWidget(board, widgetId, patch);
          await saveBoard(next);
          return jsonResult(receipt("update_widget", next, { widgetId, widget: next.widgets[widgetId] ?? null }));
        })
      )
  );

  registerAppTool(
    server,
    "lock_widget",
    {
      title: "Lock widget",
      description:
        "Freeze or unfreeze a widget against agent edits. Intended for the human approval surface; hosts should require explicit user confirmation.",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        widgetId: z.string(),
        expectedVersion: z.number().int().nonnegative(),
        locked: z.boolean().default(true).describe("true locks the widget; false unlocks it."),
      },
      _meta: { ui: { visibility: ["app"] } },
    },
    async ({ widgetId, expectedVersion, locked }) =>
      runTool(async () =>
        withBoardLock(async () => {
          const board = await loadBoard();
          assertVersion(board, expectedVersion);
          const next = lockWidget(board, widgetId, locked);
          await saveBoard(next);
          return jsonResult(receipt("lock_widget", next, { widgetId, locked: next.locks.includes(widgetId) }));
        })
      )
  );

  registerAppTool(
    server,
    "get_board_state",
    {
      title: "Get board state",
      description:
        "Read the full board recipe (data, steps, widgets, layout, locks) plus a summary. Pass includeRows=false for a sampled view when the dataset is large. Hosts with MCP Apps render the interactive board surface.",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        includeRows: z.boolean().default(true).describe("Include full raw/cleaned rows."),
        sample: z.number().int().min(0).max(100).default(10).describe("Rows per side when includeRows=false."),
      },
      _meta: { ui: { resourceUri: BOARD_UI_URI } },
    },
    async ({ includeRows, sample }) =>
      runTool(async () => {
        const board = await loadBoard();
        const view = includeRows
          ? board
          : {
              ...board,
              data: {
                ...board.data,
                raw: board.data.raw?.slice(0, sample) ?? null,
                cleaned: board.data.cleaned?.slice(0, sample) ?? null,
              },
            };
        return jsonResult({
          ok: true,
          summary: boardSummary(board),
          rowsTruncated: !includeRows,
          board: view,
        });
      })
  );
}
