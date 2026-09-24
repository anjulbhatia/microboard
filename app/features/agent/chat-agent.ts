import type { StepType, WidgetType } from "@/features/board/types";

export type ChartKind = "micro" | "spark" | "kpi" | "table" | "dither-area" | "dither-bar";

/** Board surface the agent acts on. UI injects the real store; tests inject fakes. */
export interface AgentBoardApi {
  columns(): string[];
  hasData(): boolean;
  loadSample(): void;
  addStep(type: StepType, params: Record<string, string>, description: string): void;
  addChart(kind: ChartKind, x: string, y: string): void;
  summary(): string;
  /** Structured board snapshot for read tools (no raw rows — capped). */
  state(): { title: string; version: number; steps: number; widgets: number; columns: string[] };
}

export interface ChatReply {
  text: string;
}

function findColumn(columns: string[], token: string): string | null {
  const t = token.trim().toLowerCase().replace(/^["']|["']$/g, "");
  if (!t) return null;
  return (
    columns.find((c) => c.toLowerCase() === t) ??
    columns.find((c) => c.toLowerCase().includes(t)) ??
    null
  );
}

const CHART_WORDS: { word: RegExp; kind: ChartKind }[] = [
  { word: /\bkpi\b|\btotal\b|\bsum\b/, kind: "kpi" },
  { word: /\bspark/, kind: "spark" },
  { word: /\btable\b/, kind: "table" },
  { word: /\barea\b/, kind: "dither-area" },
  { word: /\bbar\b/, kind: "dither-bar" },
];

/**
 * Rule-based local agent. Transparent and testable: every input maps to
 * either a board action or an explanatory reply. No model calls — the
 * Convex AI gateway slots in front of this later.
 */
export function handleChatMessage(raw: string, api: AgentBoardApi): ChatReply {
  const input = raw.trim();
  const low = input.toLowerCase();
  if (!input) return { text: "Ask for data, a transform, or a chart." };

  // Explicit inline op syntax always runs for real — check before intents
  // (e.g. `transform_data --op dropNulls` must not match "clean nulls").
  if (/^get_data\b|^transform_data\b|^inspect_data\b/.test(low)) {
    return { text: `INLINE ${input}` };
  }

  if (/\bhelp\b|\bwhat can you\b/.test(low)) {
    return {
      text: [
        "I can: load sample · clean nulls · sort by <col> · filter <col> <cond> <value> ·",
        "chart <y> by <x> (bar, area, spark, kpi, table) · summarize.",
        "I also run inline ops like `transform_data --op dropNulls`.",
      ].join(" "),
    };
  }

  if (/\bsample\b|\bdemo data\b|\bload data\b/.test(low) && !api.hasData()) {
    api.loadSample();
    return { text: "Loaded the sample set. Ask me to clean or chart it." };
  }

  if (/\b(drop|remove|clean).*(null|empty)|clean/.test(low)) {
    if (!api.hasData()) return { text: "Load data first — say `load sample`." };
    api.addStep("dropNulls", {}, "drop rows with empty cells");
    return { text: "Added a drop-nulls step. Steps replay on every refresh." };
  }

  const sort = low.match(/\bsort\b.*?by\s+([a-z0-9_ ]+?)(?:\s+(desc|asc))?\s*$/);
  if (sort && api.hasData()) {
    const col = findColumn(api.columns(), sort[1]);
    if (!col) return { text: `No column matching "${sort[1].trim()}". Columns: ${api.columns().join(", ")}.` };
    const dir = sort[2] === "desc" ? "desc" : "asc";
    api.addStep("sort", { column: col, dir }, `sort ${col} ${dir}`);
    return { text: `Sorting by ${col} (${dir}).` };
  }

  const filter = low.match(/\bfilter\b\s+([a-z0-9_]+)\s*(==|!=|contains|>|<|>=|<=)\s*(.+)$/);
  if (filter && api.hasData()) {
    const col = findColumn(api.columns(), filter[1]);
    if (!col) return { text: `No column matching "${filter[1]}". Columns: ${api.columns().join(", ")}.` };
    api.addStep(
      "filter",
      { column: col, cond: filter[2], value: filter[3].trim() },
      `filter ${col} ${filter[2]} ${filter[3].trim()}`
    );
    return { text: `Filtering ${col} ${filter[2]} ${filter[3].trim()}.` };
  }

  const chartBy = low.match(/\bchart\b\s+(.+?)\s+by\s+(.+)$/);
  if (chartBy && api.hasData()) {
    const kind = CHART_WORDS.find((c) => c.word.test(low))?.kind ?? "dither-bar";
    const y = findColumn(api.columns(), chartBy[1]);
    const x = findColumn(api.columns(), chartBy[2]);
    if (!y || !x) {
      return { text: `Need two columns I know. Columns: ${api.columns().join(", ")}.` };
    }
    api.addChart(kind, x, y);
    return { text: `Added a ${kind} of ${y} by ${x}.` };
  }

  if (/\bsummar|inspect|overview|columns/.test(low)) {
    if (!api.hasData()) return { text: "No data yet — say `load sample`." };
    return { text: api.summary() };
  }

  return {
    text: "I act on boards: load, clean, sort, filter, chart, summarize. Say `help` for the list.",
  };
}

/** Map a widget type string to a chart kind for the builder. */
export function chartKindFor(type: WidgetType): ChartKind | null {
  switch (type) {
    case "micro":
    case "spark":
    case "kpi":
    case "table":
    case "dither-area":
    case "dither-bar":
      return type;
    default:
      return null;
  }
}
