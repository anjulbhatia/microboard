import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { boardSummary } from "@microboard/core";
import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { consumeProposal, getProposal } from "../proposals.js";
import { widgetToSvg } from "../render.js";
import { jsonResult, runTool } from "../result.js";
import { loadBoard } from "../store.js";

const UNIT_W = 180;
const UNIT_H = 132;

export function registerAppTools(server: McpServer): void {
  registerAppTool(
    server,
    "get_board_view",
    {
      title: "Get board view",
      description:
        "Read the board as the interactive view needs it: summary, recipe, sample rows, and one pre-rendered SVG per widget. Intended for the Microboard app surface.",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: {},
      _meta: { ui: { visibility: ["app"] } },
    },
    async () =>
      runTool(async () => {
        const board = await loadBoard();
        const widgets = [];
        for (const item of board.layout) {
          const widget = board.widgets[item.i];
          if (!widget) continue;
          const width = Math.max(360, item.w * UNIT_W);
          const height = Math.max(240, item.h * UNIT_H);
          widgets.push({
            ...item,
            id: widget.id,
            type: widget.type,
            title: widget.title,
            locked: board.locks.includes(widget.id),
            svg: await widgetToSvg(board, widget, width, height),
          });
        }
        return jsonResult({
          ok: true,
          summary: boardSummary(board),
          board: {
            id: board.id,
            title: board.title,
            version: board.version,
            ...(board.meta ? { meta: board.meta } : {}),
          },
          rows: board.data.cleaned?.length ?? 0,
          rawRows: board.data.raw?.length ?? 0,
          steps: board.steps,
          columns: board.data.columns,
          sampleRows: board.data.cleaned?.slice(0, 5) ?? [],
          widgets,
        });
      })
  );

  registerAppTool(
    server,
    "reject_proposal",
    {
      title: "Reject proposal",
      description:
        "Discard a pending proposal without changing the board. Intended for the human approval surface, not the agent.",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        proposalId: z.string().describe("Proposal id from propose_transform or propose_widget."),
      },
      _meta: { ui: { visibility: ["app"] } },
    },
    async ({ proposalId }) =>
      runTool(async () => {
        const proposal = getProposal(proposalId);
        if (!proposal) {
          throw new Error(`No proposal "${proposalId}". It may have been applied or already rejected.`);
        }
        consumeProposal(proposalId);
        return jsonResult({
          ok: true,
          tool: "reject_proposal",
          proposalId,
          kind: proposal.kind,
          baseVersion: proposal.baseVersion,
          rejected: true,
        });
      })
  );
}
