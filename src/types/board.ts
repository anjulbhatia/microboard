export type StepType =
  | "filter"
  | "groupBy"
  | "select"
  | "rename"
  | "dropNulls"
  | "sort";

export interface Step {
  id: string;
  type: StepType;
  params: Record<string, string>;
  description: string;
}

export type WidgetType =
  | "textbox"
  | "heading"
  | "shape"
  | "icon"
  | "image"
  | "board"
  | "card"
  | "kpi"
  | "spark"
  | "table"
  | "dither-area"
  | "dither-bar";

/** Chart engine tag — micro/mono engines plug in here later. */
export type ChartEngine = "micro" | "mono" | "dither" | "none";

export type WidgetSize = "1x1" | "1x2" | "2x2" | "full";

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  x?: string;
  y?: string;
  size: WidgetSize;
  props?: Record<string, string | number>;
}

export interface ColumnMeta {
  name: string;
  type: "number" | "string";
  nulls: number;
}

export type DataSource = "inline" | "file" | "sample";

export interface Board {
  id: string;
  title: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  data: {
    source: DataSource | null;
    raw: Record<string, string>[];
    columns: ColumnMeta[];
  };
  steps: Step[];
  order: string[];
  widgets: Record<string, Widget>;
  locks: string[];
}
