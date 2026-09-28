import { MICRO_REGISTRY } from "@/features/widgets/micro/registry";
import { toNumber } from "@/features/data/lib/data-utils";

export type Row = Record<string, string>;

/**
 * JSON schema entry points for every micro chart:
 * X = label column, Y = value column, Y2 = second value column.
 * `deriveChartProps(chart, rows, x, y, y2)` maps board columns onto the
 * abstract's props (micro-bar X=Xdata Y=Ydata + labels + legends).
 */

function nums(rows: Row[], col: string): number[] {
  if (!col) return [];
  return rows
    .map((r) => toNumber(r[col] ?? ""))
    .filter((n): n is number => n != null);
}

function strs(rows: Row[], col: string): string[] {
  if (!col) return [];
  return rows.map((r) => String(r[col] ?? ""));
}

function splitHalf(v: number[]): { a: number[]; b: number[] } {
  const half = Math.max(1, Math.floor(v.length / 2));
  return { a: v.slice(0, half), b: v.slice(half) };
}

/** Charts whose labels come from X. Everything else ignores labels. */
const LABELED = new Set([
  "minibar", "pairedbars", "dumbbell", "dotplot", "slope",
  "waterfall", "funnel", "segmented", "microdonut",
]);

export function deriveChartProps(
  chart: string,
  rows: Row[],
  x: string,
  y: string,
  y2?: string
): Record<string, unknown> {
  const def = MICRO_REGISTRY[chart];
  const v = nums(rows, y);
  const labels = strs(rows, x).slice(0, 30);
  // Empty in, empty out — never invent data. The widget shows the
  // registry sample as a placeholder when nothing is bound.
  if (!def) return { values: v.slice(0, 30) };

  const base = def.derive(v) as Record<string, unknown>;

  switch (chart) {
    // Two-series charts read Y2 when bound, else split Y in halves.
    case "dualsparkline":
    case "stackedarea":
    case "spreadband":
    case "slope":
    case "pairedbars": {
      if (y2) {
        const b = nums(rows, y2);
        return { ...base, a: v.slice(0, 12), b: b.slice(0, 12), labels: labels.slice(0, 12) };
      }
      const { a, b } = splitHalf(v.slice(0, 24));
      return { ...base, a, b, labels: labels.slice(0, Math.max(a.length, b.length)) };
    }
    case "dumbbell": {
      if (y2) {
        const to = nums(rows, y2);
        const n = Math.min(v.length, to.length, 6);
        return { from: v.slice(0, n), to: to.slice(0, n), labels: labels.slice(0, n) };
      }
      return { ...base, labels: labels.slice(0, 6) };
    }
    // Scatter binds X and Y as pairs.
    case "microscatter": {
      if (x && y) {
        const pts = rows
          .map((r) => [toNumber(r[x] ?? ""), toNumber(r[y] ?? "")] as [number | null, number | null])
          .filter((p): p is [number, number] => p[0] != null && p[1] != null)
          .slice(0, 20);
        if (pts.length > 0) return { points: pts };
      }
      return base;
    }
    // Gauges and single-value shapes read the last Y; label from X name.
    case "heatcell":
    case "pictogramrow":
    case "progressring":
    case "progress":
    case "bullet":
    case "trendarrow":
    case "delta":
    case "statusdot": {
      if (chart === "statusdot") {
        return { level: "idle", label: x || y, value: v[v.length - 1] ?? "" };
      }
      return base;
    }
    default: {
      // Series + optional labels (minibar, dotplot, waterfall, funnel,
      // segmented, microdonut, sparkline, sparkbar, heatstripe, ...).
      if (LABELED.has(chart) && labels.length > 0) {
        if (chart === "segmented" || chart === "microdonut") {
          const n = Math.min(v.length, labels.length, 4);
          return {
            parts: v.slice(0, n).map((val, i) => ({ label: labels[i] || `p${i + 1}`, value: Math.abs(val) })),
          };
        }
        return { ...base, labels: labels.slice(0, 8) };
      }
      return base;
    }
  }
}

/** Binding contract each chart honors (for docs + validation). */
export function chartBindings(chart: string): { x: boolean; y: boolean; y2: boolean } {
  switch (chart) {
    case "microscatter":
      return { x: true, y: true, y2: false };
    case "dualsparkline":
    case "stackedarea":
    case "spreadband":
    case "slope":
    case "pairedbars":
    case "dumbbell":
      return { x: true, y: true, y2: true };
    case "minibar":
    case "dotplot":
    case "waterfall":
    case "funnel":
    case "segmented":
    case "microdonut":
      return { x: true, y: true, y2: false };
    default:
      return { x: false, y: true, y2: false };
  }
}
