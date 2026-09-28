import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  Sparkline,
  Tooltip,
  XAxis,
  YAxis,
} from "@/shared/components/charts";
import { useBoard } from "@/store/board";
import { applySteps, inferColumns, toNumber } from "@/features/data/lib/data-utils";
import { MICRO_REGISTRY } from "@/features/widgets/micro/registry";
import { deriveChartProps } from "@/features/widgets/micro/columns";
import type { ChartEngine, Widget } from "@/features/board/types";
import { widgetDataX, widgetDataY, widgetDataY2 } from "@/features/board/types";

/**
 * Chart widgets by engine. `dither` engine is live (Dither Kit),
 * `micro` engine is live (own abstracts). `mono` plugs in when it lands.
 */
export const CHART_ENGINES: Record<string, ChartEngine> = {
  kpi: "micro",
  spark: "micro",
  micro: "micro",
  table: "none",
  "dither-area": "dither",
  "dither-bar": "dither",
  "dither-line": "dither",
  "dither-pie": "dither",
};

export function ChartWidget({ widget }: { widget: Widget }) {
  const board = useBoard((s) => s.board);
  const cleaned = useMemo(() => applySteps(board.data.raw, board.steps), [board.data.raw, board.steps]);

  if (widget.type === "micro") {
    const chart = String(widget.props?.chart ?? "sparkline");
    const def = MICRO_REGISTRY[chart] ?? MICRO_REGISTRY.sparkline;
    const xCol = widgetDataX(widget);
    const yCol = widgetDataY(widget);
    const y2Col = widgetDataY2(widget);
    // Empty board → registry sample as a placeholder (never stored).
    const derived =
      cleaned.length === 0
        ? { ...def.sample }
        : deriveChartProps(chart, cleaned, xCol, yCol, y2Col || undefined);
    const { chart: _c, xLabel, yLabel, legend, ...stored } = (widget.props ?? {}) as Record<string, unknown>;
    const Body = def.Component;
    const caption = [legend, xLabel, yLabel].filter(Boolean).join(" · ");
    return (
      <div className="flex h-full flex-col gap-1">
        <div className="min-h-0 flex-1">
          <Body {...stored} {...derived} />
        </div>
        {(caption || yCol) && (
          <p className="truncate font-mono text-[10px] text-muted-foreground">
            {caption || `${xCol} · ${yCol}`}
          </p>
        )}
      </div>
    );
  }

  if (widget.type === "table") {
    const cols = inferColumns(cleaned).map((c) => c.name);
    return (
      <div className="overflow-x-auto">
        <table className="w-full font-mono text-xs">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              {cols.map((c) => (
                <th key={c} className="px-2 py-1 font-medium">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cleaned.slice(0, 8).map((r, i) => (
              <tr key={i} className="border-b last:border-0">
                {cols.map((c) => (
                  <td key={c} className="px-2 py-1">{r[c]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const yCol = widgetDataY(widget);
  const xCol = widgetDataX(widget);
  const nums = cleaned.map((r) => toNumber(r[yCol] ?? "")).filter((n): n is number => n != null);
  if (widget.type === "kpi") {
    const total = nums.reduce((a, b) => a + b, 0);
    const rounded = Math.round(total * 100) / 100;
    return (
      <div>
        <p className="text-4xl font-bold tracking-tight">{rounded.toLocaleString()}</p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          {yCol} · {cleaned.length} rows
        </p>
      </div>
    );
  }

  if (widget.type === "spark") {
    return <Sparkline data={nums.slice(0, 30)} color="purple" />;
  }

  const points = cleaned.slice(0, 12).map((r) => ({
    x: String(r[xCol] ?? ""),
    v: toNumber(r[yCol] ?? "") ?? 0,
  }));
  const config = { v: { label: yCol || "value", color: "purple" as const } };
  if (widget.type === "dither-area") {
    return (
      <div className="h-64">
        <AreaChart data={points} config={config} bloom="aura">
          <XAxis dataKey="x" />
          <YAxis />
          <Tooltip labelKey="x" />
          <Area dataKey="v" variant="gradient" />
        </AreaChart>
      </div>
    );
  }
  if (widget.type === "dither-line") {
    return (
      <div className="h-64">
        <LineChart data={points} config={config} bloom="aura">
          <XAxis dataKey="x" />
          <YAxis />
          <Tooltip labelKey="x" />
          <Line dataKey="v" variant="gradient" />
        </LineChart>
      </div>
    );
  }
  return (
    <div className="h-64">
      <BarChart data={points} config={config} bloom="aura">
        <XAxis dataKey="x" />
        <YAxis />
        <Tooltip labelKey="x" />
        <Bar dataKey="v" variant="gradient" />
      </BarChart>
    </div>
  );
}
