import { C1, C2, C3, DES, MUT } from "@/widgets/charts/micro/types";
import { fmt } from "@/widgets/charts/micro/scale";

export function MicroDonut({ parts = [] }: { parts?: { label: string; value: number }[] }) {
  const size = 64;
  const r = 24;
  const circ = 2 * Math.PI * r;
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  const colors = [C3, C2, C1, MUT];
  let acc = 0;
  return (
    <span className="inline-flex items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="donut">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={MUT} strokeWidth="9" opacity="0.15" />
        {parts.map((p, i) => {
          const frac = p.value / total;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={colors[i % colors.length]}
              strokeWidth="9"
              strokeDasharray={`${(frac * circ).toFixed(1)} ${circ.toFixed(1)}`}
              strokeDashoffset={(-acc * circ).toFixed(1)}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              strokeLinecap="butt"
            />
          );
          acc += frac;
          return el;
        })}
      </svg>
      <span className="space-y-0.5">
        {parts.slice(0, 3).map((p, i) => (
          <span key={i} className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
            <span className="size-2 rounded-full" style={{ background: colors[i % colors.length] }} />
            {p.label}
          </span>
        ))}
      </span>
    </span>
  );
}

export function ProgressRing({ value = 0 }: { value?: number }) {
  const size = 56;
  const r = 21;
  const circ = 2 * Math.PI * r;
  const t = Math.max(0, Math.min(1, value));
  return (
    <span className="inline-flex items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${Math.round(t * 100)} percent`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={MUT} strokeWidth="7" opacity="0.2" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C3}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${(t * circ).toFixed(1)} ${circ.toFixed(1)}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text x={size / 2} y={size / 2 + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="currentColor" fontFamily="monospace">
          {Math.round(t * 100)}
        </text>
      </svg>
    </span>
  );
}

export function Progress({ value = 0 }: { value?: number }) {
  const t = Math.max(0, Math.min(1, value));
  return (
    <span className="flex w-full items-center gap-2" style={{ minWidth: 120 }}>
      <span className="h-2.5 flex-1 rounded-full bg-muted/50">
        <span className="block h-full rounded-full" style={{ width: `${t * 100}%`, background: C3 }} />
      </span>
      <span className="font-mono text-xs font-semibold">{Math.round(t * 100)}%</span>
    </span>
  );
}

export function Bullet({ value = 0, target = 0, bands = [] }: { value?: number; target?: number; bands?: number[] }) {
  const w = 160;
  const h = 26;
  const max = Math.max(value, target, ...(bands.length ? bands : [0]), 0) || 1;
  const X = (v: number) => (v / max) * (w - 4) + 2;
  const sorted = [...bands].sort((a, b) => a - b);
  const shades = [0.12, 0.22, 0.32];
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="bullet chart">
      {sorted.map((b, i) => (
        <rect key={i} x="2" y="4" width={(X(b) - 2).toFixed(1)} height={h - 8} rx="2" fill={MUT} opacity={shades[Math.min(i, 2)]} />
      ))}
      <rect x="2" y={h / 2 - 4} width={Math.max(1, X(value) - 2).toFixed(1)} height="8" rx="2" fill={C3} />
      <line x1={X(target).toFixed(1)} y1="2" x2={X(target).toFixed(1)} y2={h - 2} stroke={DES} strokeWidth="2" />
    </svg>
  );
}

export function LikertStrip({ name = "", counts = [] }: { name?: string; counts?: number[] }) {
  const total = counts.reduce((a, c) => a + c, 0) || 1;
  const mid = Math.floor(counts.length / 2);
  const colorAt = (i: number) => {
    if (i < mid) return i === 0 ? DES : "#e11d48";
    if (i === mid && counts.length % 2 === 1) return MUT;
    return i >= counts.length - 1 ? C3 : C2;
  };
  return (
    <div style={{ width: "100%" }}>
      {name && <p className="mb-1 text-xs font-medium">{name}</p>}
      <div className="flex h-4 w-full gap-px overflow-hidden rounded-md">
        {counts.map((c, i) => (
          <div key={i} style={{ width: `${(c / total) * 100}%`, background: colorAt(i) }} title={`${fmt(c)}`} />
        ))}
      </div>
    </div>
  );
}
