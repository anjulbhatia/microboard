import { newId } from "./ids";
import { applySteps, cellText, toNumber } from "./steps";
import type {
  Board,
  ColumnMeta,
  DataSource,
  LayoutItem,
  Row,
  Step,
  StepType,
  Widget,
  WidgetType,
} from "./types";
import { BOARD_GRID, isStepType, isWidgetType, WIDGET_SPANS } from "./types";

export interface NewWidgetInput {
  type: WidgetType;
  title?: string;
  x?: string;
  y?: string;
  y2?: string;
  props?: Record<string, unknown>;
  w?: number;
  h?: number;
}

export function createBoard(title = "Untitled board"): Board {
  const now = new Date().toISOString();
  return {
    id: newId(),
    title,
    version: 0,
    data: { source: null, raw: null, cleaned: null, columns: [] },
    steps: [],
    layout: [],
    widgets: {},
    locks: [],
    meta: { createdAt: now, updatedAt: now },
  };
}

export function inferColumns(rows: Row[]): ColumnMeta[] {
  if (rows.length === 0) return [];
  const names: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    for (const name of Object.keys(row)) {
      if (!seen.has(name)) {
        seen.add(name);
        names.push(name);
      }
    }
  }
  return names.map((name) => {
    let nulls = 0;
    let numeric = true;
    for (const row of rows) {
      const value = row[name];
      if (value == null || value === "") {
        nulls++;
        continue;
      }
      if (toNumber(value) == null) numeric = false;
    }
    return { name, type: numeric ? "number" : "string", nulls };
  });
}

function touch(board: Board, patch: Partial<Board>): Board {
  return {
    ...board,
    ...patch,
    version: board.version + 1,
    meta: {
      createdAt: board.meta?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(board.meta?.author ? { author: board.meta.author } : {}),
    },
  };
}

export function recompute(board: Board): Board {
  const cleaned = applySteps(board.data.raw, board.steps);
  return {
    ...board,
    data: { ...board.data, cleaned, columns: inferColumns(cleaned) },
  };
}

export function setBoardData(board: Board, rows: Row[], source: DataSource): Board {
  const cleaned = applySteps(rows, []);
  return touch(board, {
    data: { source, raw: rows, cleaned, columns: inferColumns(cleaned) },
    steps: [],
    layout: [],
    widgets: {},
    locks: [],
  });
}

export function setTitle(board: Board, title: string): Board {
  const value = title.trim();
  if (!value) throw new Error("Board title cannot be empty.");
  if (value.length > 160) throw new Error("Board title is too long (max 160 chars).");
  return touch(board, { title: value });
}

function assertParams(params: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue;
    if (typeof value === "object") throw new Error(`Step param "${key}" must be a scalar value.`);
  }
}

export function addStep(
  board: Board,
  type: string,
  params: Record<string, unknown> = {},
  description?: string
): Board {
  if (!isStepType(type)) {
    throw new Error(`Unknown step type "${type}". Use one of: filter, groupBy, select, rename, dropNulls, sort, header, dropDuplicates, fill, flashfill, replace, limit, derive.`);
  }
  assertParams(params);
  if (!board.data.raw) throw new Error("Load data before adding transforms.");
  const step: Step = {
    id: newId(),
    type,
    params,
    description: description?.trim() || defaultStepDescription(type, params),
  };
  const next = recompute(touch(board, { steps: [...board.steps, step] }));
  return next;
}

export function removeStep(board: Board, stepId: string): Board {
  if (!board.steps.some((s) => s.id === stepId)) throw new Error(`No step "${stepId}".`);
  return recompute(touch(board, { steps: board.steps.filter((s) => s.id !== stepId) }));
}

export function defaultStepDescription(type: StepType, params: Record<string, unknown>): string {
  const p = (k: string) => cellText(params[k]);
  switch (type) {
    case "filter":
      return `filter ${p("column")} ${p("cond") || "=="} ${p("value")}`.trim();
    case "groupBy":
      return `group by ${p("column")} (${p("agg") || "count"})`;
    case "sort":
      return `sort ${p("column")} ${p("dir") || "asc"}`;
    case "select":
      return `select ${p("columns")}`;
    case "rename":
      return `rename ${p("column")} to ${p("to")}`;
    case "dropNulls":
      return `drop empty rows${p("column") ? ` on ${p("column")}` : ""}`;
    case "dropDuplicates":
      return `drop duplicates${p("columns") ? ` on ${p("columns")}` : ""}`;
    case "fill":
      return `fill ${p("column") || "all"} (${p("mode") || "value"})`;
    case "flashfill":
      return `flash fill ${p("column")} into ${p("into")}`;
    case "replace":
      return `replace "${p("find")}" with "${p("with")}" in ${p("column")}`;
    case "limit":
      return `limit to ${p("n")} rows`;
    case "derive":
      return `derive ${p("into")} = ${p("column")} ${p("fn")} ${p("right")}`;
    case "header":
      return "promote first row to header";
    default:
      return type;
  }
}

function nextPosition(
  layout: LayoutItem[],
  span: { w: number; h: number },
  cols: number = BOARD_GRID.cols
): { x: number; y: number } {
  let x = 0;
  let y = 0;
  let rowH = 0;
  for (const item of layout) {
    if (x + item.w > cols) {
      x = 0;
      y += rowH;
      rowH = 0;
    }
    x += item.w;
    rowH = Math.max(rowH, item.h);
    if (x >= cols) {
      x = 0;
      y += rowH;
      rowH = 0;
    }
  }
  const w = Math.min(span.w, cols);
  if (x + w > cols) {
    x = 0;
    y += rowH;
  }
  return { x, y };
}

function spanFor(type: WidgetType, w?: number, h?: number): { w: number; h: number } {
  const base = WIDGET_SPANS[type];
  const clamp = (v: number | undefined, fallback: number) =>
    Math.max(1, Math.min(Math.round(v ?? fallback), BOARD_GRID.cols));
  return { w: clamp(w, base.w), h: Math.max(1, Math.min(Math.round(h ?? base.h), BOARD_GRID.rows * 2)) };
}

function assertColumns(board: Board, names: Array<string | undefined>): void {
  const available = board.data.columns.map((c) => c.name);
  for (const name of names) {
    if (!name) continue;
    if (!available.includes(name)) {
      throw new Error(`Unknown column "${name}". Available: ${available.join(", ") || "(none)"}.`);
    }
  }
}

function assertBindings(board: Board, widget: Pick<Widget, "type" | "x" | "y" | "y2">): void {
  const needs = widget.type === "table" ? [] : widget.type === "kpi" || widget.type === "sparkline" ? ["y"] : ["x", "y"];
  for (const key of needs) {
    if (!widget[key as "x" | "y"]) throw new Error(`${widget.type} widget needs ${key} column.`);
  }
  assertColumns(board, [widget.x, widget.y, widget.y2]);
}

export function addWidget(board: Board, input: NewWidgetInput): Board {
  if (!isWidgetType(input.type)) throw new Error(`Unknown widget type "${input.type}".`);
  if (input.type !== "table" && !board.data.cleaned) throw new Error("Load data before adding charts.");
  const widget: Omit<Widget, "id"> = {
    type: input.type,
    title: input.title?.trim() || defaultWidgetTitle(input.type),
    ...(input.x ? { x: input.x } : {}),
    ...(input.y ? { y: input.y } : {}),
    ...(input.y2 ? { y2: input.y2 } : {}),
    ...(input.props ? { props: input.props } : {}),
  };
  assertBindings(board, widget);
  const id = newId();
  const span = spanFor(input.type, input.w, input.h);
  const pos = nextPosition(board.layout, span);
  const full: Widget = { ...widget, id };
  return touch(board, {
    widgets: { ...board.widgets, [id]: full },
    layout: [...board.layout, { i: id, x: pos.x, y: pos.y, w: span.w, h: span.h }],
  });
}

export function updateWidget(board: Board, id: string, patch: Partial<NewWidgetInput>): Board {
  const current = board.widgets[id];
  if (!current) throw new Error(`No widget "${id}".`);
  if (board.locks.includes(id)) throw new Error(`Widget "${id}" is locked by a human.`);
  const type = patch.type ?? current.type;
  if (!isWidgetType(type)) throw new Error(`Unknown widget type "${String(type)}".`);
  const next: Widget = {
    ...current,
    ...(patch.title !== undefined ? { title: patch.title.trim() || current.title } : {}),
    type,
    ...(patch.x !== undefined ? { x: patch.x } : {}),
    ...(patch.y !== undefined ? { y: patch.y } : {}),
    ...(patch.y2 !== undefined ? { y2: patch.y2 } : {}),
    ...(patch.props !== undefined ? { props: { ...current.props, ...patch.props } } : {}),
  };
  assertBindings(board, next);
  return touch(board, { widgets: { ...board.widgets, [id]: next } });
}

export function lockWidget(board: Board, id: string, locked = true): Board {
  if (!board.widgets[id]) throw new Error(`No widget "${id}".`);
  const has = board.locks.includes(id);
  if (locked === has) return board;
  return touch(board, {
    locks: locked ? [...board.locks, id] : board.locks.filter((w) => w !== id),
  });
}

export function removeWidget(board: Board, id: string): Board {
  if (!board.widgets[id]) throw new Error(`No widget "${id}".`);
  if (board.locks.includes(id)) throw new Error(`Widget "${id}" is locked by a human.`);
  const widgets = { ...board.widgets };
  delete widgets[id];
  return touch(board, {
    widgets,
    layout: board.layout.filter((item) => item.i !== id),
    locks: board.locks.filter((w) => w !== id),
  });
}

export function defaultWidgetTitle(type: WidgetType): string {
  switch (type) {
    case "bar":
      return "Bar chart";
    case "line":
      return "Line chart";
    case "area":
      return "Area chart";
    case "point":
      return "Scatter plot";
    case "kpi":
      return "KPI";
    case "table":
      return "Table";
    case "sparkline":
      return "Sparkline";
  }
}

export function assertVersion(board: Board, expected: number): void {
  if (!Number.isInteger(expected) || expected < 0) throw new Error("expectedVersion must be a non-negative integer.");
  if (board.version !== expected) {
    throw new Error(`Version conflict: board is v${board.version}, request expected v${expected}. Call get_board_state and retry.`);
  }
}

export interface BoardSummary {
  id: string;
  title: string;
  version: number;
  rows: number;
  columns: ColumnMeta[];
  steps: number;
  widgets: number;
  locks: string[];
}

export function boardSummary(board: Board): BoardSummary {
  return {
    id: board.id,
    title: board.title,
    version: board.version,
    rows: board.data.cleaned?.length ?? 0,
    columns: board.data.columns,
    steps: board.steps.length,
    widgets: Object.keys(board.widgets).length,
    locks: [...board.locks],
  };
}
