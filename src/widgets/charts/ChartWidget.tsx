import { useMemo } from "react";
import { AreaChart } from "@/components/dither-kit/area-chart";
import { Area } from "@/components/dither-kit/area";
import { XAxis } from "@/components/dither-kit/x-axis";
import { YAxis } from "@/components/dither-kit/y-axis";
import { Tooltip } from "@/components/dither-kit/tooltip";
import { BarChart } from "@/components/dither-kit/bar-chart";
import { Bar } from "@/components/dither-kit/bar";
import { Sparkline } from "@/components/dither-kit/sparkline";
import { useBoard } from "@/lib/board-store";
import { applySteps, inferColumns, toNumber } from "@/lib/data-utils";
import type { ChartEngine, Widget } from "@/types/board";

/**
 * Chart widgets by engine. `dither` engine is live (Dither Kit).
 * `micro` and `mono` engines plug in here when their sources land.
 */
export const CHART_ENGINES: Record<string, ChartEngine> = {
  kpi: "micro",
  spark: "micro",
  table: "none",
  "dither-area": "dither",
  "dither-bar": "dither",
};

export function ChartWidget({ widget }: { widget: Widget }) {
  const board = useBoard((s) => s.board);
  const cleaned = useMemo(() => applySteps(board.data.raw, board.steps), [board.data.raw, board.steps]);

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

  const nums = cleaned.map((r) => toNumber(r[widget.y ?? ""] ?? "")).filter((n): n is number => n != null);
  if (widget.type === "kpi") {
    const total = nums.reduce((a, b) => a + b, 0);
    const rounded = Math.round(total * 100) / 100;
    return (
      <div>
        <p className="text-4xl font-bold tracking-tight">{rounded.toLocaleString()}</p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          {widget.y} · {cleaned.length} rows
        </p>
      </div>
    );
  }

  if (widget.type === "spark") {
    return <Sparkline data={nums.slice(0, 30)} color="purple" />;
  }

  const points = cleaned.slice(0, 12).map((r) => ({
    x: String(r[widget.x ?? ""] ?? ""),
    v: toNumber(r[widget.y ?? ""] ?? "") ?? 0,
  }));
  const config = { v: { label: widget.y ?? "value", color: "purple" as const } };
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
