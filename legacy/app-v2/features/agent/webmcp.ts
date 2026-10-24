import { opSpecs, runInline, runOp, type ParamDef } from "@/features/data/ops";
import { handleChatMessage, type AgentBoardApi, type ChartKind } from "@/features/agent/chat-agent";
import type { StepType } from "@/features/board/types";

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

const STEPS: StepType[] = [
  "filter", "groupBy", "select", "rename", "dropNulls", "sort",
  "header", "dropDuplicates", "fill", "flashfill", "replace", "limit", "derive",
];

const CHARTS: ChartKind[] = ["micro", "spark", "kpi", "table", "dither-area", "dither-bar"];

const BOARD_TOOLS: WebMCPTool[] = [
  {
    name: "board.get_state",
    description: "Read the board: title, version, step/widget counts, column names. Call first.",
    params: [],
    scope: "board",
  },
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
    if (name === "board.get_state") {
      return { ok: true, reply: JSON.stringify(api.state()) };
    }
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
      if (!(STEPS as string[]).includes(type)) {
        throw new Error(`Unknown step "${type}". One of: ${STEPS.join(", ")}.`);
      }
      const raw = args.params ?? {};
      if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
        throw new Error("params must be an object.");
      }
      const params: Record<string, string> = {};
      for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
        params[k] = typeof v === "string" ? v : JSON.stringify(v);
      }
      api.addStep(
        type as StepType,
        params,
        String(args.description ?? `${type} step`)
      );
      return { ok: true, reply: `Step added: ${type}.` };
    }
    if (name === "board.add_chart") {
      const kind = String(args.kind ?? "dither-bar");
      if (!(CHARTS as string[]).includes(kind)) {
        throw new Error(`Unknown chart "${kind}". One of: ${CHARTS.join(", ")}.`);
      }
      const x = String(args.x ?? "").trim();
      const y = String(args.y ?? "").trim();
      if (!x || !y) throw new Error("x and y columns are both required.");
      api.addChart(
        kind as ChartKind,
        x,
        y
      );
      return { ok: true, reply: `Chart added: ${kind} ${y} by ${x}.` };
    }
    // Data ops run in-function — never round-trip args through inline text
    // (quoting breaks on spaces; datasets cannot travel as text at all).
    const ds = await runOp(name, args);
    return { ok: true, reply: `${name}: ${ds.columns.length} cols, ${ds.rows.length} rows.` };
  } catch (e) {
    return { ok: false, reply: e instanceof Error ? e.message : "Tool failed." };
  }
}
