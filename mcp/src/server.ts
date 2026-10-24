import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerBoardTools } from "./tools/board.js";
import { registerDataTools } from "./tools/data.js";
import { registerExportTools } from "./tools/export.js";

export const SERVER_NAME = "microboard";
export const SERVER_VERSION = "0.1.0";

const INSTRUCTIONS = `Microboard turns data into an auditable, replayable chart recipe and renders it anywhere.

Workflow:
1. load_data — load CSV/JSON/clipboard/URL/sample. Creates a board automatically.
2. inspect_data — read columns, nulls, stats, sample rows.
3. propose_transform -> human approves -> apply_transform.
4. propose_widget -> human approves -> add_widget.
5. export_board (png | html | json) or render_chart (png | svg).

Rules:
- Every write requires the current expectedVersion and fails closed on conflict.
- Steps are append-only and replay on raw data; never fabricate rows.
- Locked widgets cannot be updated by the agent.
- Prefer the smallest chart that answers the question: sparkline, point, bar, line, then area.
- Keep boards small (8-column grid, 5+ rows). Use the source columns exactly as returned by inspect_data.

State lives in .microboard/board.json under the working directory (override with MICROBOARD_BOARD_PATH). Exports go to .microboard/exports (override with MICROBOARD_EXPORT_DIR).`;

export function createServer(): McpServer {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION, title: "Microboard" },
    {
      instructions: INSTRUCTIONS,
      capabilities: {
        tools: {},
      },
    }
  );

  registerDataTools(server);
  registerBoardTools(server);
  registerExportTools(server);
  return server;
}
