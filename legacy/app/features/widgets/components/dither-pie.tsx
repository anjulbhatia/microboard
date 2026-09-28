import { useMemo } from "react";
import { useBoard } from "@/store/board";
import { applySteps, toNumber } from "@/features/data/lib/data-utils";
import { widgetDataX, widgetDataY, type Widget } from "@/features/board/types";
import { pieSlices, polarX, polarY } from "@/shared/components/charts/polar";
import { C1, C2, C3, C4, C5, MUT } from "@/features/widgets/micro/types";

const SLICE_FILLS = [C3, C1, C2, C4, C5, MUT];
const R = 44;
const CX = 50;
const CY = 50;
const HOLE = 0.58;

function arcPath(cx: number, cy: number, r: number, start: number, end: number, hole: number): string {
  const large = end - start > Math.PI ? 1 : 0;
  const ox = polarX(cx, r, start);
  const oy = polarY(cy, r, start);
  const ix = polarX(cx, r, end);
  const iy = polarY(cy, r, end);
  const hx2 = polarX(cx, r * hole, end);
  const hy2 = polarY(cy, r * hole, end);
  const hx1 = polarX(cx, r * hole, start);
  const hy1 = polarY(cy, r * hole, start);
  return [
    `M${ox.toFixed(1)},${oy.toFixed(1)}`,
    `A${r},${r} 0 ${large} 1 ${ix.toFixed(1)},${iy.toFixed(1)}`,
    `L${hx2.toFixed(1)},${hy2.toFixed(1)}`,
    `A${r * hole},${r * hole} 0 ${large} 0 ${hx1.toFixed(1)},${hy1.toFixed(1)}`,
    "Z",
  ].join(" ");
}

/**
 * Dither Pie — theme slices with a legend. X names the slice, Y sizes it.
 * JSON: { "chart": "dither-pie", "x": "channel", "y": "signups" }.
 */
export function DitherPie({ widget }: { widget: Widget }) {
  const board = useBoard((s) => s.board);
  const cleaned = useMemo(() => applySteps(board.data.raw, board.steps), [board.data.raw, board.steps]);
  const xCol = widgetDataX(widget);
  const yCol = widgetDataY(widget);

  const rows = useMemo(
    () =>
      cleaned.slice(0, 6).map((r) => ({
        name: String(r[xCol] ?? ""),
        v: toNumber(r[yCol] ?? "") ?? 0,
      })),
    [cleaned, xCol, yCol]
  );
  const slices = useMemo(() => pieSlices(rows, "v", "name"), [rows]);
  const total = rows.reduce((a, r) => a + r.v, 0) || 1;

  if (rows.length === 0) {
    return <p className="font-mono text-xs text-muted-foreground">Bind X and Y columns.</p>;
  }

  return (
    <div className="flex h-full items-center gap-3">
      <svg viewBox="0 0 100 100" className="h-full max-h-40 shrink-0" role="img" aria-label="pie chart">
        {slices.map((s, i) => (
          <path
            key={i}
            d={arcPath(CX, CY, R, s.start, s.end, HOLE)}
            fill={SLICE_FILLS[i % SLICE_FILLS.length]}
            opacity={0.9}
            stroke="var(--background)"
            strokeWidth="1.5"
          >
            <title>{`${s.name}: ${s.value}`}</title>
          </path>
        ))}
        <text x={CX} y={CY - 2} textAnchor="middle" fontSize="11" fontWeight="700" fill="currentColor">
          {total.toLocaleString()}
        </text>
        <text x={CX} y={CY + 10} textAnchor="middle" fontSize="6" fill="var(--muted-foreground)">
          {yCol || "total"}
        </text>
      </svg>
      <ul className="flex min-w-0 flex-1 flex-col gap-1">
        {slices.map((s, i) => (
          <li key={i} className="flex items-center gap-1.5 text-[11px]">
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-[3px]"
              style={{ background: SLICE_FILLS[i % SLICE_FILLS.length] }}
            />
            <span className="min-w-0 flex-1 truncate">{s.name}</span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {Math.round((s.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
