import { C1, C2, C3, DES, MUT } from "@/widgets/charts/micro/types";
import { extent, fmt, linear } from "@/widgets/charts/micro/scale";

export function MiniBar({ values = [], labels = [], w = 160 }: { values?: number[]; labels?: string[]; w?: number }) {
  if (values.length === 0) return null;
  const max = Math.max(...values, 0) || 1;
  const top = Math.max(...values);
  return (
    <div style={{ width: "100%", maxWidth: w }} className="space-y-1">
      {values.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          {labels[i] && (
            <span className="w-16 shrink-0 truncate font-mono text-[10px] text-muted-foreground">{labels[i]}</span>
          )}
          <div className="h-3 flex-1 rounded-sm bg-muted/40">
            <div
              className="h-full rounded-sm"
              style={{ width: `${(v / max) * 100}%`, background: v === top ? C3 : C2, opacity: v === top ? 1 : 0.55 }}
            />
          </div>
          <span className="w-10 shrink-0 text-right font-mono text-[10px]">{fmt(v)}</span>
        </div>
      ))}
    </div>
  );
}

export function PairedBars({ a = [], b = [], labels = [] }: { a?: number[]; b?: number[]; labels?: string[] }) {
  const w = 160;
  const h = 64;
  const n = Math.max(a.length, b.length);
  if (n === 0) return null;
  const max = Math.max(...a, ...b, 0) || 1;
  const gw = w / n;
  const bw = Math.max(2, (gw - 6) / 2);
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="paired bars">
      {Array.from({ length: n }).map((_, i) => {
        const va = a[i] ?? 0;
        const vb = b[i] ?? 0;
        return (
          <g key={i}>
            <rect x={(i * gw + 2).toFixed(1)} y={(h - (va / max) * (h - 4)).toFixed(1)} width={bw.toFixed(1)} height={Math.max(1, (va / max) * (h - 4)).toFixed(1)} rx="1" fill={C3} />
            <rect x={(i * gw + 2 + bw + 2).toFixed(1)} y={(h - (vb / max) * (h - 4)).toFixed(1)} width={bw.toFixed(1)} height={Math.max(1, (vb / max) * (h - 4)).toFixed(1)} rx="1" fill={C2} opacity="0.7" />
            {labels[i] && (
              <text x={(i * gw + gw / 2).toFixed(1)} y={h - 1} textAnchor="middle" fontSize="6" fill={MUT} fontFamily="monospace">
                {labels[i]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function Dumbbell({ from = [], to = [], labels = [] }: { from?: number[]; to?: number[]; labels?: string[] }) {
  const w = 160;
  const rh = 18;
  const n = Math.max(from.length, to.length);
  if (n === 0) return null;
  const [lo, hi] = extent([...from, ...to]);
  const X = linear(lo, hi, w, 8);
  return (
    <svg width="100%" height={rh * n} viewBox={`0 0 ${w} ${rh * n}`} role="img" aria-label="dumbbell">
      {Array.from({ length: n }).map((_, i) => {
        const f = from[i] ?? lo;
        const t = to[i] ?? lo;
        const y = i * rh + rh / 2;
        return (
          <g key={i}>
            {labels[i] && (
              <text x="2" y={y - 5} fontSize="7" fill={MUT} fontFamily="monospace">
                {labels[i]}
              </text>
            )}
            <line x1={X(f).toFixed(1)} y1={y} x2={X(t).toFixed(1)} y2={y} stroke={MUT} strokeWidth="1" opacity="0.5" />
            <circle cx={X(f).toFixed(1)} cy={y} r="3.5" fill="none" stroke={C2} strokeWidth="1.5" />
            <circle cx={X(t).toFixed(1)} cy={y} r="3.5" fill={C3} />
          </g>
        );
      })}
    </svg>
  );
}

export function Dotplot({ values = [], labels = [] }: { values?: number[]; labels?: string[] }) {
  const w = 160;
  const rh = 16;
  if (values.length === 0) return null;
  const [lo, hi] = extent(values);
  const X = linear(lo, hi, w, 8);
  return (
    <svg width="100%" height={rh * values.length} viewBox={`0 0 ${w} ${rh * values.length}`} role="img" aria-label="dot plot">
      {values.map((v, i) => {
        const y = i * rh + rh / 2;
        return (
          <g key={i}>
            <line x1="8" y1={y} x2={w - 8} y2={y} stroke={MUT} strokeWidth="1" opacity="0.3" />
            <circle cx={X(v).toFixed(1)} cy={y} r="4" fill={C3} />
            {labels[i] && (
              <text x="2" y={y - 6} fontSize="7" fill={MUT} fontFamily="monospace">
                {labels[i]} · {fmt(v)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function Slope({ a = [], b = [], labels = [] }: { a?: number[]; b?: number[]; labels?: string[] }) {
  const w = 140;
  const h = 72;
  const n = Math.max(a.length, b.length);
  if (n === 0) return null;
  const [lo, hi] = extent([...a, ...b]);
  const Y = linear(lo, hi, h, 8);
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="slope chart">
      {Array.from({ length: n }).map((_, i) => {
        const va = a[i] ?? lo;
        const vb = b[i] ?? lo;
        const up = vb >= va;
        return (
          <g key={i}>
            <line x1="34" y1={(h - Y(va)).toFixed(1)} x2={w - 34} y2={(h - Y(vb)).toFixed(1)} stroke={up ? C3 : DES} strokeWidth="1.5" opacity="0.85" />
            {labels[i] && (
              <text x="2" y={(h - Y(va) + 3).toFixed(1)} fontSize="7" fill={MUT} fontFamily="monospace">
                {labels[i]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function Waterfall({ values = [], labels = [] }: { values?: number[]; labels?: string[] }) {
  const w = 160;
  const h = 72;
  if (values.length === 0) return null;
  let run = 0;
  const cum = values.map((v) => {
    const start = run;
    run += v;
    return { start, end: run, v };
  });
  const [lo, hi] = extent([0, ...cum.flatMap((c) => [c.start, c.end])]);
  const Y = linear(lo, hi, h, 6);
  const bw = w / values.length;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="waterfall">
      {cum.map((c, i) => {
        const top = h - Y(Math.max(c.start, c.end));
        const bh = Math.max(1, Math.abs(Y(c.end) - Y(c.start)));
        const last = i === values.length - 1;
        return (
          <g key={i}>
            <rect
              x={(i * bw + 2).toFixed(1)}
              y={top.toFixed(1)}
              width={Math.max(2, bw - 4).toFixed(1)}
              height={bh.toFixed(1)}
              rx="1"
              fill={last ? C1 : c.v >= 0 ? C3 : DES}
              opacity={last ? 1 : 0.8}
            />
            {labels[i] && (
              <text x={(i * bw + bw / 2).toFixed(1)} y={h - 1} textAnchor="middle" fontSize="6" fill={MUT} fontFamily="monospace">
                {labels[i]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function Funnel({ values = [], labels = [] }: { values?: number[]; labels?: string[] }) {
  const w = 140;
  const rh = 20;
  if (values.length === 0) return null;
  const max = Math.max(...values, 0) || 1;
  return (
    <svg width="100%" height={rh * values.length} viewBox={`0 0 ${w} ${rh * values.length}`} role="img" aria-label="funnel">
      {values.map((v, i) => {
        const bw = (v / max) * (w - 8);
        const x = (w - bw) / 2;
        return (
          <g key={i}>
            <rect x={x.toFixed(1)} y={(i * rh + 2).toFixed(1)} width={bw.toFixed(1)} height={rh - 6} rx="2" fill={C3} opacity={1 - (i / values.length) * 0.55} />
            {labels[i] && (
              <text x={w / 2} y={(i * rh + rh / 2 + 3).toFixed(1)} textAnchor="middle" fontSize="7" fill="#fff" fontFamily="monospace">
                {labels[i]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
