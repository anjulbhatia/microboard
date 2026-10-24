import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  assertVersion,
  ingestData,
  inspectBoard,
  setBoardData,
  setTitle,
  type ClipSep,
  type IngestInput,
} from "@microboard/core";
import { loadBoard, saveBoard, withBoardLock } from "../store.js";
import { jsonResult, receipt, runTool } from "../result.js";

const CLIP_SEPS = ["tab", "comma", "semicolon", "colon", "space"] as const;

export function registerDataTools(server: McpServer): void {
  server.registerTool(
    "load_data",
    {
      title: "Load data",
      description:
        "Replace the board dataset from CSV text, JSON, clipboard text, a public URL/Google Sheet, the built-in sample, or an inline rows array. Clears steps, widgets, and locks. A new board is created automatically.",
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
      inputSchema: {
        type: z.enum(["csv", "json", "clipboard", "url", "sample", "rows"]).describe("Where the data comes from."),
        text: z.string().optional().describe("CSV, JSON, or pasted text."),
        url: z.string().url().optional().describe("Public http(s) URL or Google Sheets link for type=url."),
        sep: z.enum(CLIP_SEPS).optional().describe("Clipboard separator override."),
        rows: z.unknown().optional().describe("Inline array of objects for type=rows."),
        title: z.string().optional().describe("Optional board title."),
        expectedVersion: z
          .number()
          .int()
          .nonnegative()
          .optional()
          .describe("Required when replacing an existing dataset. Must equal the current board version."),
      },
    },
    async ({ type, text, url, sep, rows, title, expectedVersion }) =>
      runTool(async () =>
        withBoardLock(async () => {
          const board = await loadBoard();
          if (board.data.raw && expectedVersion === undefined) {
            throw new Error(
              `Board already has data (v${board.version}). Pass expectedVersion to confirm replacement.`
            );
          }
          if (expectedVersion !== undefined) assertVersion(board, expectedVersion);

          const input: IngestInput = { type };
          if (text !== undefined) input.text = text;
          if (url !== undefined) input.url = url;
          if (sep !== undefined) input.sep = sep as ClipSep;
          if (rows !== undefined) input.rows = rows;

          const loaded = await ingestData(input);
          let next = setBoardData(board, loaded.rows, loaded.source);
          if (title) next = setTitle(next, title);
          await saveBoard(next);

          return jsonResult(
            receipt("load_data", next, {
              rows: next.data.cleaned?.length ?? 0,
              columns: next.data.columns.map((c) => c.name),
              source: next.data.source,
              title: next.title,
            })
          );
        })
      )
  );

  server.registerTool(
    "inspect_data",
    {
      title: "Inspect data",
      description:
        "Read the cleaned dataset: row count, column types, null counts, numeric min/max/mean, sample rows, and applied steps. Call this before proposing transforms or widgets.",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        sample: z.number().int().min(0).max(100).default(5).describe("Number of sample rows (0–100)."),
      },
    },
    async ({ sample }) =>
      runTool(async () => {
        const board = await loadBoard();
        if (!board.data.raw) {
          throw new Error("Board has no data. Call load_data first.");
        }
        return jsonResult(inspectBoard(board, sample));
      })
  );
}
