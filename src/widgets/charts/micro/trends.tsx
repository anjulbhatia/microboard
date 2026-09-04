import { C2, C3, DES, MUT } from "@/widgets/charts/micro/types";
import { areaPath, extent, fmt, linear, linePath } from "@/widgets/charts/micro/scale";

export function Sparkline({ values = [], w = 120, h = 36 }: { values?: number[]; w?: number; h?: number }) {
  if (values.length === 0) return null;
  const last = values[values.length - 1];
  const [lo, hi] = extent(values);
  const X = linear(0, values.length - 1, w, 2);
  const Y = linear(lo, hi, h, 4);
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="sparkline">
      <path d={linePath(values, w, h)} fill="none" stroke={C3} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={X(values.length - 1)} cy={h - Y(last)} r="2.5" fill={C3} />
    </svg>
  );
}

export function SparkBar({ values = [], w = 120, h = 36 }: { values?: number[]; w?: number; h?: number }) {
  if (values.length === 0) return null;
  const [lo, hi] = extent(values);
  const base = lo < 0 ? 0 : lo;
  const Y = linear(Math.min(lo, 0), hi, h, 2);
  const bw = w / values.length;
  const zeroY = h - Y(base);
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="spark bars">
      {values.map((v, i) => {
        const y = h - Y(v);
        const top = Math.min(y, zeroY);
        const bh = Math.max(1, Math.abs(y - zeroY));
        return (
          <rect
            key={i}
            x={(i * bw + 1).toFixed(1)}
            y={top.toFixed(1)}
            width={Math.max(1, bw - 2).toFixed(1)}
            height={bh.toFixed(1)}
            rx="1"
            fill={v < 0 ? DES : C3}
            opacity={v < 0 ? 0.8 : 0.45 + (0.55 * (v - lo)) / (hi - lo || 1)}
          />
        );
      })}
    </svg>
  );
}

export function DualSparkline({ a = [], b = [] }: { a?: number[]; b?: number[] }) {
  const w = 120;
  const h = 36;
  const all = [...a, ...b];
  if (all.length === 0) return null;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="dual sparkline">
      {b.length > 0 && (
        <path d={linePath(b, w, h)} fill="none" stroke={C2} strokeWidth="1.5" strokeDasharray="4 2" strokeLinejoin="round" />
      )}
      {a.length > 0 && (
        <path d={linePath(a, w, h)} fill="none" stroke={C3} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      )}
    </svg>
  );
}

export function StackedArea({ a = [], b = [] }: { a?: number[]; b?: number[] }) {
  const w = 120;
  const h = 48;
  const n = Math.max(a.length, b.length);
  if (n === 0) return null;
  const A = Array.from({ length: n }, (_, i) => a[i] ?? 0);
  const stacked = A.map((v, i) => v + (b[i] ?? 0));
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="stacked area">
      <path d={areaPath(stacked, w, h)} fill={C2} opacity="0.45" />
      <path d={linePath(stacked, w, h)} fill="none" stroke={C2} strokeWidth="1.5" />
      <path d={areaPath(A, w, h)} fill={C3} opacity="0.55" />
      <path d={linePath(A, w, h)} fill="none" stroke={C3} strokeWidth="1.5" />
    </svg>
  );
}

export function BumpStrip({ series = [] }: { series?: number[][] }) {
  const w = 120;
  const h = 48;
  const colors = [C3, C2, MUT, DES];
  if (series.length === 0) return null;
  const ranks = series.flat();
  const maxRank = Math.max(...ranks, 1);
  const n = Math.max(...series.map((s) => s.length));
  const X = linear(0, n - 1, w, 6);
  const Y = linear(1, maxRank, h, 6);
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="bump chart">
      {series.map((s, k) => (
        <path
          key={k}
          d={s.map((r, i) => `${i === 0 ? "M" : "L"}${X(i).toFixed(1)},${(h - Y(r)).toFixed(1)}`).join(" ")}
          fill="none"
          stroke={colors[k % colors.length]}
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}

export function TrendArrow({ delta = 0 }: { delta?: number }) {
  const color = delta > 0 ? C3 : delta < 0 ? DES : MUT;
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" role="img" aria-label={delta > 0 ? "trending up" : delta < 0 ? "trending down" : "flat"}>
      {delta === 0 ? (
        <line x1="5" y1="14" x2="23" y2="14" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      ) : (
        <g stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {delta > 0 ? (
            <>
              <line x1="14" y1="23" x2="14" y2="7" />
              <polyline points="8,13 14,7 20,13" />
            </>
          ) : (
            <>
              <line x1="14" y1="5" x2="14" y2="21" />
              <polyline points="8,15 14,21 20,15" />
            </>
          )}
        </g>
      )}
    </svg>
  );
}

export function Delta({ value = 0, previous = 0 }: { value?: number; previous?: number }) {
  const diff = value - previous;
  const pct = previous !== 0 ? (diff / Math.abs(previous)) * 100 : 0;
  const up = diff >= 0;
  return (
    <span className="inline-flex items-center gap-1.5">
      <TrendArrow delta={diff} />
      <span className="font-mono text-sm font-semibold" style={{ color: up ? C3 : DES }}>
        {up ? "+" : ""}
        {fmt(pct)}%
      </span>
    </span>
  );
}
