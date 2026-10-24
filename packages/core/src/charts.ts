import type { Board, Row, Widget } from "./types";

export const CHART_THEME = {
  background: "#fafaf9",
  foreground: "#292524",
  muted: "#78716c",
  grid: "#e7e5e4",
  colors: ["#6d5efc", "#c08457", "#2f8f83", "#b4537a", "#5b6b8c"],
} as const;

export interface ChartDataPoint {
  x: string | number;
  y: number;
}

export interface WidgetSpec {
  widgetId: string;
  title: string;
  type: Widget["type"];
  spec: Record<string, unknown> | null;
  values?: ChartDataPoint[];
  table?: { columns: string[]; rows: Row[] };
  kpi?: { value: number; label: string; rows: number };
}

function columnType(board: Board, name: string | undefined): "number" | "string" {
  if (!name) return "string";
  return board.data.columns.find((c) => c.name === name)?.type ?? "string";
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function chartValues(board: Board, widget: Widget): ChartDataPoint[] {
  const rows = board.data.cleaned ?? [];
  const xCol = widget.x ?? "";
  const yCol = widget.y ?? "";
  const points: ChartDataPoint[] = [];
  for (const row of rows) {
    const y = toNumber(row[yCol]);
    if (y == null) continue;
    const rawX = row[xCol];
    points.push({
      x: columnType(board, xCol) === "number" ? (toNumber(rawX) ?? 0) : String(rawX ?? ""),
      y,
    });
  }
  return points;
}

export function buildWidgetSpec(board: Board, widget: Widget): WidgetSpec {
  if (widget.type === "kpi") {
    const values = chartValues(board, widget);
    const total = values.reduce((sum, point) => sum + point.y, 0);
    return {
      widgetId: widget.id,
      title: widget.title,
      type: widget.type,
      spec: null,
      kpi: {
        value: Math.round(total * 100) / 100,
        label: widget.y ?? "value",
        rows: values.length,
      },
    };
  }

  if (widget.type === "table") {
    const rows = board.data.cleaned ?? [];
    const columns = board.data.columns.map((c) => c.name);
    return {
      widgetId: widget.id,
      title: widget.title,
      type: widget.type,
      spec: null,
      table: { columns, rows: rows.slice(0, 12) },
    };
  }

  const values = chartValues(board, widget);
  if (values.length === 0) {
    return { widgetId: widget.id, title: widget.title, type: widget.type, spec: null, values };
  }

  const xCol = widget.x ?? "";
  const yCol = widget.y ?? "";
  const xType = columnType(board, xCol) === "number" ? "quantitative" : "nominal";
  const markType = widget.type === "sparkline" ? "line" : widget.type;
  const sparkline = widget.type === "sparkline";
  const color = typeof widget.props?.color === "string" ? String(widget.props.color) : CHART_THEME.colors[0];
  const stacked = widget.type === "area" || widget.type === "bar";

  const spec: Record<string, unknown> = {
    $schema: "https://vega.github.io/schema/vega-lite/v6.json",
    width: sparkline ? 180 : 260,
    height: sparkline ? 56 : 170,
    padding: sparkline ? 2 : 8,
    background: "transparent",
    data: { values },
    mark: {
      type: markType,
      tooltip: !sparkline,
      ...(markType === "line" ? { point: false, strokeWidth: 2 } : {}),
      ...(markType === "area" ? { line: { strokeWidth: 2 }, opacity: 0.55 } : {}),
      ...(markType === "point" ? { filled: true, size: 56 } : {}),
      color,
    },
    encoding: {
      x: {
        field: "x",
        type: xType,
        ...(xType === "nominal" && stacked ? { sort: "-y" } : {}),
        axis: sparkline
          ? null
          : {
              title: xCol || null,
              labelColor: CHART_THEME.muted,
              titleColor: CHART_THEME.foreground,
              labelAngle: 0,
              labelLimit: 90,
              labelOverlap: "greedy",
            },
      },
      y: {
        field: "y",
        type: "quantitative",
        axis: sparkline ? null : { title: yCol || null, labelColor: CHART_THEME.muted, titleColor: CHART_THEME.foreground, gridColor: CHART_THEME.grid },
      },
      ...(sparkline ? {} : { tooltip: [{ field: "x", title: xCol }, { field: "y", title: yCol }] }),
    },
    config: {
      view: { stroke: null },
      axis: { domainColor: CHART_THEME.grid, tickColor: CHART_THEME.grid },
      font: "Geist, ui-sans-serif, system-ui, sans-serif",
    },
  };

  return { widgetId: widget.id, title: widget.title, type: widget.type, spec, values };
}

export function buildBoardSpecs(board: Board): WidgetSpec[] {
  return board.layout
    .map((item) => board.widgets[item.i])
    .filter((widget): widget is Widget => Boolean(widget))
    .map((widget) => buildWidgetSpec(board, widget));
}
