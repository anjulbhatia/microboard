export type Row = Record<string, unknown>;

export type StepType =
  | "filter"
  | "groupBy"
  | "select"
  | "rename"
  | "dropNulls"
  | "sort"
  | "header"
  | "dropDuplicates"
  | "fill"
  | "flashfill"
  | "replace"
  | "limit"
  | "derive";

export interface Step {
  id: string;
  type: StepType;
  params: Record<string, unknown>;
  description: string;
}

export type WidgetType = "bar" | "line" | "area" | "point" | "kpi" | "table" | "sparkline";

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  x?: string;
  y?: string;
  y2?: string;
  props?: Record<string, unknown>;
}

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ColumnMeta {
  name: string;
  type: "number" | "string";
  nulls: number;
}

export type DataSource = "inline" | "url" | "upload";

export interface BoardData {
  source: DataSource | null;
  raw: Row[] | null;
  cleaned: Row[] | null;
  columns: ColumnMeta[];
}

export interface Board {
  id: string;
  title: string;
  version: number;
  data: BoardData;
  steps: Step[];
  layout: LayoutItem[];
  widgets: Record<string, Widget>;
  locks: string[];
  meta?: {
    createdAt: string;
    updatedAt: string;
    author?: string;
  };
}

export const BOARD_GRID = { cols: 8, rows: 5 } as const;

export const STEP_TYPES: readonly StepType[] = [
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
];

export const WIDGET_TYPES: readonly WidgetType[] = [
  "bar",
  "line",
  "area",
  "point",
  "kpi",
  "table",
  "sparkline",
];

export const WIDGET_SPANS: Record<WidgetType, { w: number; h: number }> = {
  bar: { w: 4, h: 3 },
  line: { w: 4, h: 3 },
  area: { w: 4, h: 3 },
  point: { w: 4, h: 3 },
  kpi: { w: 2, h: 2 },
  table: { w: 4, h: 3 },
  sparkline: { w: 3, h: 1 },
};

export function isStepType(value: string): value is StepType {
  return (STEP_TYPES as readonly string[]).includes(value);
}

export function isWidgetType(value: string): value is WidgetType {
  return (WIDGET_TYPES as readonly string[]).includes(value);
}
