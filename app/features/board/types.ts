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
  | "micro"
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
  /** Data column bindings (chart field names). Prefer dataX/dataY; x/y kept for compat. */
  x?: string;
  y?: string;
  dataX?: string;
  dataY?: string;
  /** Grid position in cell units. 0-based, col in [0, cols). */
  col: number;
  row: number;
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

export type DataSource = "inline" | "file" | "sample" | "sheet" | "api";

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
    /** API source config: JSON endpoint + poll interval. */
    sourceUrl?: string;
    refreshMinutes?: number;
    lastRefresh?: string;
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

/** Data binding readers — dataX/dataY win, legacy x/y fall back. */
export function widgetDataX(w: Pick<Widget, "x" | "dataX">): string {
  return w.dataX ?? w.x ?? "";
}

export function widgetDataY(w: Pick<Widget, "y" | "dataY">): string {
  return w.dataY ?? w.y ?? "";
}

/** Fill missing position/bindings on load so old snapshots parse. */
export function normalizeWidget(w: Widget): Widget {
  return {
    ...w,
    col: Number.isFinite(w.col) ? Math.max(0, Math.floor(w.col)) : 0,
    row: Number.isFinite(w.row) ? Math.max(0, Math.floor(w.row)) : 0,
    dataX: w.dataX ?? w.x,
    dataY: w.dataY ?? w.y,
  };
}

/** Flow-place a span after existing widgets on a cols-wide grid. */
export function nextPosition(
  order: string[],
  widgets: Record<string, Widget>,
  span: GridSpan,
  cols = 16
): { col: number; row: number } {
  let col = 0;
  let row = 0;
  let rowH = 0;
  for (const id of order) {
    const w = widgets[id];
    if (!w) continue;
    if (col + w.w > cols) {
      col = 0;
      row += rowH;
      rowH = 0;
    }
    col += w.w;
    rowH = Math.max(rowH, w.h);
    if (col >= cols) {
      col = 0;
      row += rowH;
      rowH = 0;
    }
  }
  const w = Math.min(span.w, cols);
  if (col + w > cols) {
    col = 0;
    row += rowH;
  }
  return { col, row };
}

/** Clamp span + position into a cols×rows grid. Pure, no UI. */
export function clampWidgetToGrid(
  w: Widget,
  cols = 16,
  rows = 10
): Widget {
  const cw = Math.max(1, Math.min(Math.round(w.w), cols));
  const ch = Math.max(1, Math.min(Math.round(w.h), rows));
  return {
    ...w,
    w: cw,
    h: ch,
    col: Math.max(0, Math.min(Math.floor(w.col), Math.max(0, cols - cw))),
    row: Math.max(0, Math.floor(w.row)),
  };
}

export type DockTab = "visualize" | "transform";

export interface Upload {
  id: string;
  url: string;
  name: string;
}

export interface CreateLayoutProps {
  title: string;
  onTitle: (title: string) => void;
  tab: DockTab;
  onTab: (tab: DockTab) => void;
  panelOpen: boolean;
  onPanelToggle: () => void;
  toolbar?: import("react").ReactNode;
  panel: import("react").ReactNode;
  agentPanel: import("react").ReactNode;
  children: import("react").ReactNode;
}

export interface WidgetCardProps {
  widget: Widget;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onDragStart: (id: string) => void;
  onDrop: (id: string) => void;
}

export interface StepFormProps {
  columns: string[];
}

export interface WidgetBuilderProps {
  columns: string[];
  hasData: boolean;
  chartOnly: boolean;
  gridCols: number;
}

export interface VisualsPanelProps {
  columns: string[];
  hasData: boolean;
  uploads: Upload[];
  onAddUploads: (files: FileList | null) => void;
  gridCols: number;
}

export interface TransformPanelProps {
  rawCols: string[];
  hasData: boolean;
}

export interface AgentPanelProps {
  goal: string;
  onGoal: (goal: string) => void;
}

export interface PageStripProps {
  ratio: import("./components/stage").StageRatio;
  onRatio: (r: import("./components/stage").StageRatio) => void;
  cleanedCount: number;
  usedCells: number;
  capacity: number;
}

export interface UploadPhaseProps {
  onLoad: (source: DataSource, records: Record<string, string>[]) => void;
}
