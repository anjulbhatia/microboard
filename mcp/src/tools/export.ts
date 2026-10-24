import { mkdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { boardSummary } from "@microboard/core";
import { boardToHtml, boardToPng, widgetToPng, widgetToSvg } from "../render.js";
import { jsonResult, receipt, runTool } from "../result.js";
import { loadBoard } from "../store.js";

function slug(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "board";
}

function exportRoot(): string {
  return resolve(process.env.MICROBOARD_EXPORT_DIR ?? join(process.cwd(), ".microboard", "exports"));
}

function targetPath(outputPath: string | undefined, fallbackName: string): string {
  const root = exportRoot();
  const target = outputPath ? resolve(root, outputPath) : join(root, fallbackName);
  const rel = relative(root, target);
  if (rel.startsWith("..") || isAbsolute(rel)) {
    throw new Error(`outputPath must stay inside ${root}.`);
  }
  return target;
}

async function write(path: string, data: string | Buffer): Promise<number> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, data);
  return typeof data === "string" ? Buffer.byteLength(data) : data.byteLength;
}

export function registerExportTools(server: McpServer): void {
  server.registerTool(
    "export_board",
    {
      title: "Export board",
      description:
        "Export the board as PNG, interactive self-contained HTML, or the portable board JSON recipe. PNG is returned inline and also written to disk.",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      inputSchema: {
        format: z.enum(["png", "html", "json"]).describe("png | html | json (PDF/MDX/PPTX land in Phase 4)."),
        outputPath: z
          .string()
          .optional()
          .describe("Optional path relative to the export directory. Defaults to a generated filename."),
      },
    },
    async ({ format, outputPath }) =>
      runTool(async () => {
        const board = await loadBoard();
        const base = `${slug(board.title)}-v${board.version}-${Date.now()}`;
        const summary = boardSummary(board);

        if (format === "json") {
          const path = targetPath(outputPath, `${base}.json`);
          const json = `${JSON.stringify(board, null, 2)}\n`;
          const bytes = await write(path, json);
          return jsonResult(receipt("export_board", board, { format, path, bytes, summary }));
        }

        if (format === "html") {
          const path = targetPath(outputPath, `${base}.html`);
          const html = boardToHtml(board);
          const bytes = await write(path, html);
          return jsonResult(receipt("export_board", board, { format, path, bytes, summary }));
        }

        const png = await boardToPng(board);
        const path = targetPath(outputPath, `${base}.png`);
        const bytes = await write(path, png);
        const info = receipt("export_board", board, { format, path, bytes, summary });
        return {
          content: [
            { type: "image" as const, data: png.toString("base64"), mimeType: "image/png" },
            { type: "text" as const, text: JSON.stringify(info, null, 2) },
          ],
          structuredContent: info,
        };
      })
  );

  server.registerTool(
    "render_chart",
    {
      title: "Render chart",
      description: "Render one widget as PNG or SVG without exporting the whole board.",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      inputSchema: {
        widgetId: z.string(),
        format: z.enum(["png", "svg"]).default("png"),
        outputPath: z.string().optional().describe("Optional path relative to the export directory."),
      },
    },
    async ({ widgetId, format, outputPath }) =>
      runTool(async () => {
        const board = await loadBoard();
        const widget = board.widgets[widgetId];
        if (!widget) throw new Error(`No widget "${widgetId}".`);
        const base = `${slug(widget.title)}-${widgetId.slice(0, 8)}`;
        if (format === "svg") {
          const path = targetPath(outputPath, `${base}.svg`);
          const svg = await widgetToSvg(board, widget);
          const bytes = await write(path, svg);
          return jsonResult(receipt("render_chart", board, { format, widgetId, path, bytes }));
        }
        const png = await widgetToPng(board, widget);
        const path = targetPath(outputPath, `${base}.png`);
        const bytes = await write(path, png);
        const info = receipt("render_chart", board, { format, widgetId, path, bytes });
        return {
          content: [
            { type: "image" as const, data: png.toString("base64"), mimeType: "image/png" },
            { type: "text" as const, text: JSON.stringify(info, null, 2) },
          ],
          structuredContent: info,
        };
      })
  );
}
