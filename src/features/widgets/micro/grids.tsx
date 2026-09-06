import { C1, C2, C3, MUT } from "@/widgets/charts/micro/types";
import { extent, fmt, linear } from "@/widgets/charts/micro/scale";

export function ActivityGrid({ weeks = [], cols = 12 }: { weeks?: number[][]; cols?: number }) {
  const flat = weeks.flat().slice(0, 7 * cols);
  if (flat.length === 0) return null;
  const max = Math.max(...flat, 0) || 1;
  const cell = 10;
  const gap = 2;
  const rows = 7;
  const nCols = Math.ceil(flat.length / rows);
  return (
    <svg
      width="100%"
      viewBox={`0 0 ${nCols * (cell + gap)} ${rows * (cell + gap)}`}
      role="img"
      aria-label="activity grid"
    >
      {flat.map((v, i) => {
        const c = Math.floor(i / rows);
        const r = i % rows;
        return (
          <rect
            key={i}
            x={(c * (cell + gap)).toFixed(1)}
            y={(r * (cell + gap)).toFixed(1)}
            width={cell}
            height={cell}
            rx="2"
            fill={C3}
            opacity={v <= 0 ? 0.08 : 0.15 + (0.85 * v) / max}
          />
        );
      })}
    </svg>
  );
}

export function HeatCell({ value = 0.5, min = 0, max = 1 }: { value?: number; min?: number; max?: number }) {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
  return (
    <span className="inline-flex items-center gap-2">
      <svg width="28" height="28" viewBox="0 0 28 28" role="img" aria-label={`heat ${Math.round(t * 100)} percent`}>
        <rect x="2" y="2" width="24" height="24" rx="6" fill={C3} opacity={0.1 + t * 0.9} />
      </svg>
      <span className="font-mono text-sm font-semibold">{fmt(value)}</span>
    </span>
  );
}

export function HeatStripe({ values = [], w = 160 }: { values?: number[]; w?: number }) {
  if (values.length === 0) return null;
  const max = Math.max(...values, 0) || 1;
  const cw = w / values.length;
  return (
    <svg width="100%" height="18" viewBox={`0 0 ${w} 18`} role="img" aria-label="heat stripe">
      {values.map((v, i) => (
        <rect
          key={i}
          x={(i * cw + 0.5).toFixed(1)}
          y="2"
          width={Math.max(1, cw - 1).toFixed(1)}
          height="14"
          rx="2"
          fill={C3}
          opacity={0.08 + (0.92 * v) / max}
        />
      ))}
    </svg>
  );
}

export function CalendarStrip({ values = [], offset = 0 }: { values?: number[]; offset?: number }) {
  const cells = [...Array(offset % 7).fill(null), ...values].slice(0, 28) as (number | null)[];
  if (values.length === 0) return null;
  const nums = values.filter((v) => v > 0);
  const max = Math.max(...nums, 0) || 1;
  const cell = 16;
  const gap = 3;
  return (
    <svg width="100%" viewBox={`0 0 ${7 * (cell + gap)} ${4 * (cell + gap)}`} role="img" aria-label="calendar strip">
      {cells.map((v, i) => {
        const c = i % 7;
        const r = Math.floor(i / 7);
        return (
          <rect
            key={i}
            x={(c * (cell + gap)).toFixed(1)}
            y={(r * (cell + gap)).toFixed(1)}
            width={cell}
            height={cell}
            rx="3"
            fill={C3}
            opacity={v == null ? 0.05 : 0.12 + (0.88 * v) / max}
          />
        );
      })}
    </svg>
  );
}

export function PictogramRow({ filled = 3, total = 5 }: { filled?: number; total?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5" role="img" aria-label={`${filled} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className="size-3.5 rounded-full border"
          style={{
            background: i < filled ? C3 : "transparent",
            borderColor: i < filled ? C3 : MUT,
            opacity: i < filled ? 1 : 0.5,
          }}
        />
      ))}
      <span className="font-mono text-xs text-muted-foreground">
        {filled}/{total}
      </span>
    </span>
  );
}

export function Segmented({ parts = [] }: { parts?: { label: string; value: number }[] }) {
  if (parts.length === 0) return null;
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  const colors = [C3, C2, C1, MUT];
  return (
    <div style={{ width: "100%" }}>
      <div className="flex h-4 w-full gap-px overflow-hidden rounded-md">
        {parts.map((p, i) => (
          <div key={i} style={{ width: `${(p.value / total) * 100}%`, background: colors[i % colors.length] }} title={`${p.label}: ${fmt(p.value)}`} />
        ))}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
        {parts.map((p, i) => (
          <span key={i} className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
            <span className="size-2 rounded-full" style={{ background: colors[i % colors.length] }} />
            {p.label} · {Math.round((p.value / total) * 100)}%
          </span>
        ))}
      </div>
    </div>
  );
}

export function MicroBox({ min = 0, q1 = 0, median = 0, q3 = 0, max = 0 }: { min?: number; q1?: number; median?: number; q3?: number; max?: number }) {
  const w = 160;
  const h = 28;
  const [lo, hi] = extent([min, q1, median, q3, max]);
  const X = linear(lo, hi, w, 6);
  const y = h / 2;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="box plot">
      <line x1={X(min).toFixed(1)} y1={y} x2={X(max).toFixed(1)} y2={y} stroke={MUT} strokeWidth="1.5" />
      <line x1={X(min).toFixed(1)} y1={y - 6} x2={X(min).toFixed(1)} y2={y + 6} stroke={MUT} strokeWidth="1.5" />
      <line x1={X(max).toFixed(1)} y1={y - 6} x2={X(max).toFixed(1)} y2={y + 6} stroke={MUT} strokeWidth="1.5" />
      <rect x={X(q1).toFixed(1)} y={y - 8} width={Math.max(2, X(q3) - X(q1)).toFixed(1)} height="16" rx="2" fill={C3} opacity="0.5" />
      <line x1={X(median).toFixed(1)} y1={y - 8} x2={X(median).toFixed(1)} y2={y + 8} stroke={C3} strokeWidth="2.5" />
    </svg>
  );
}

export function HistogramStrip({ values = [], bins = 12 }: { values?: number[]; bins?: number }) {
  const w = 160;
  const h = 44;
  if (values.length === 0) return null;
  const [lo, hi] = extent(values);
  const counts = Array.from({ length: bins }, () => 0);
  values.forEach((v) => {
    const i = Math.min(bins - 1, Math.floor(((v - lo) / (hi - lo || 1)) * bins));
    counts[i]++;
  });
  const max = Math.max(...counts, 1);
  const bw = w / bins;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="histogram">
      {counts.map((c, i) => (
        <rect
          key={i}
          x={(i * bw + 1).toFixed(1)}
          y={(h - (c / max) * (h - 4)).toFixed(1)}
          width={Math.max(1, bw - 2).toFixed(1)}
          height={Math.max(1, (c / max) * (h - 4)).toFixed(1)}
          rx="1"
          fill={C3}
          opacity={0.35 + (0.65 * c) / max}
        />
      ))}
    </svg>
  );
}
