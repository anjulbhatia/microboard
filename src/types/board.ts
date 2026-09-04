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

/** Grid unit = 1 cell of the board. 1x1 fits an icon, 16x16 is a full page. */
export interface GridSpan {
  w: number;
  h: number;
}

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  x?: string;
  y?: string;
  /** Size in grid units. */
  w: number;
  h: number;
  props?: Record<string, string | number>;
}

/** Board grid dimensions per aspect ratio — equal 160-cell capacity. */
export const BOARD_GRID = {
  "16:10": { cols: 16, rows: 10 },
  "3:4": { cols: 10, rows: 16 },
} as const;

export type BoardRatio = keyof typeof BOARD_GRID;

export interface ColumnMeta {
  name: string;
  type: "number" | "string";
  nulls: number;
}

export type DataSource = "inline" | "file" | "sample";

export interface Page {
  id: string;
  name: string;
  order: string[];
  widgets: Record<string, Widget>;
}

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
  pages: Page[];
  activePageId: string;
  locks: string[];
}

export function freshPage(name: string): Page {
  return { id: crypto.randomUUID(), name, order: [], widgets: {} };
}

export function activePage(board: Board): Page {
  return board.pages.find((p) => p.id === board.activePageId) ?? board.pages[0];
}
