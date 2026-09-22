import { opSpecs, runInline, type ParamDef } from "@/features/data/ops";
import { handleChatMessage, type AgentBoardApi } from "@/features/agent/chat-agent";

export interface WebMCPTool {
  name: string;
  description: string;
  params: ParamDef[];
  scope: "data" | "board";
}

export interface WebMCPManifest {
  version: 1;
  scopes: string[];
  tools: WebMCPTool[];
}

const BOARD_TOOLS: WebMCPTool[] = [
  {
    name: "board.chat",
    description: "Send a natural-language board request (load, clean, sort, filter, chart, summarize).",
    params: [{ name: "text", type: "string", required: true, description: "The request." }],
    scope: "board",
  },
  {
    name: "board.load_sample",
    description: "Load the sample dataset into the board.",
    params: [],
    scope: "board",
  },
  {
    name: "board.add_step",
    description: "Append a transform step (filter, sort, dropNulls, select, rename, ...).",
    params: [
      { name: "type", type: "string", required: true, description: "Step type." },
      { name: "params", type: "json", description: "Step params as an object." },
      { name: "description", type: "string", description: "Human-readable label." },
    ],
    scope: "board",
  },
  {
    name: "board.add_chart",
    description: "Add a chart widget bound to two columns.",
    params: [
      { name: "kind", type: "string", required: true, enum: ["micro", "spark", "kpi", "table", "dither-area", "dither-bar"], description: "Chart kind." },
      { name: "x", type: "string", required: true, description: "X column." },
      { name: "y", type: "string", required: true, description: "Y column." },
    ],
    scope: "board",
  },
];

/** Tool catalog for external agents: data ops plus board actions. */
export function webmcpManifest(): WebMCPManifest {
  const data: WebMCPTool[] = opSpecs().map((o) => ({
    name: o.name,
    description: o.description,
    params: o.params,
    scope: "data" as const,
  }));
  return { version: 1, scopes: ["data", "board"], tools: [...data, ...BOARD_TOOLS] };
}

export interface ToolResult {
  ok: boolean;
  reply: string;
}

/**
 * Execute one WebMCP tool call. Data ops run and report row/column counts;
 * board tools run through the chat agent so UI and agents share semantics.
 */
export async function runWebmcpTool(
  name: string,
  args: Record<string, unknown>,
  api: AgentBoardApi
): Promise<ToolResult> {
  try {
    if (name === "board.chat") {
      const reply = handleChatMessage(String(args.text ?? ""), api);
      if (reply.text.startsWith("INLINE ")) {
        const ds = await runInline(reply.text.slice("INLINE ".length));
        return { ok: true, reply: `Ran inline op: ${ds.columns.length} cols, ${ds.rows.length} rows.` };
      }
      return { ok: true, reply: reply.text };
    }
    if (name === "board.load_sample") {
      api.loadSample();
      return { ok: true, reply: "Sample loaded." };
    }
    if (name === "board.add_step") {
      const type = String(args.type ?? "");
      const params = (args.params ?? {}) as Record<string, string>;
      api.addStep(
        type as Parameters<AgentBoardApi["addStep"]>[0],
        params,
        String(args.description ?? `${type} step`)
      );
      return { ok: true, reply: `Step added: ${type}.` };
    }
    if (name === "board.add_chart") {
      api.addChart(
        String(args.kind ?? "dither-bar") as Parameters<AgentBoardApi["addChart"]>[0],
        String(args.x ?? ""),
        String(args.y ?? "")
      );
      return { ok: true, reply: `Chart added: ${args.kind} ${args.y} by ${args.x}.` };
    }
    const ds = await runInline(
      `${name} ${Object.entries(args).map(([k, v]) => `--${k} ${JSON.stringify(v)}`).join(" ")}`
    );
    return { ok: true, reply: `${name}: ${ds.columns.length} cols, ${ds.rows.length} rows.` };
  } catch (e) {
    return { ok: false, reply: e instanceof Error ? e.message : "Tool failed." };
  }
}
