import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { Board } from "@microboard/core";

export interface Receipt {
  ok: true;
  tool: string;
  boardId: string;
  version: number;
  [key: string]: unknown;
}

export function jsonResult(value: unknown): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
    structuredContent: value as Record<string, unknown>,
  };
}

export function errorResult(message: string): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify({ ok: false, error: message }, null, 2) }],
    isError: true,
  };
}

export function receipt(tool: string, board: Board, extra: Record<string, unknown> = {}): Receipt {
  return { ok: true, tool, boardId: board.id, version: board.version, ...extra };
}

export async function runTool(fn: () => Promise<CallToolResult>): Promise<CallToolResult> {
  try {
    return await fn();
  } catch (error) {
    return errorResult(error instanceof Error ? error.message : "Tool failed.");
  }
}
