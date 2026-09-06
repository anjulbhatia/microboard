import { C1, C2, C3, DES, MUT } from "@/widgets/charts/micro/types";
import { extent, fmt, linear } from "@/widgets/charts/micro/scale";

export function MicroScatter({ points = [] }: { points?: [number, number][] }) {
  const w = 140;
  const h = 72;
  if (points.length === 0) return null;
  const [lox, hix] = extent(points.map((p) => p[0]));
  const [loy, hiy] = extent(points.map((p) => p[1]));
  const X = linear(lox, hix, w, 8);
  const Y = linear(loy, hiy, h, 8);
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="scatter">
      {points.map((p, i) => (
        <circle key={i} cx={X(p[0]).toFixed(1)} cy={(h - Y(p[1])).toFixed(1)} r="3" fill={C3} opacity="0.7" />
      ))}
    </svg>
  );
}

export function SpreadBand({ a = [], b = [] }: { a?: number[]; b?: number[] }) {
  const w = 140;
  const h = 56;
  const n = Math.max(a.length, b.length);
  if (n === 0) return null;
  const A = Array.from({ length: n }, (_, i) => a[i] ?? 0);
  const B = Array.from({ length: n }, (_, i) => b[i] ?? 0);
  const [lo, hi] = extent([...A, ...B]);
  const X = linear(0, n - 1, w, 4);
  const Y = linear(lo, hi, h, 6);
  const top = A.map((v, i) => `${i === 0 ? "M" : "L"}${X(i).toFixed(1)},${(h - Y(v)).toFixed(1)}`).join(" ");
  const bot = B.map((v, i) => `${i === 0 ? "M" : "L"}${X(i).toFixed(1)},${(h - Y(v)).toFixed(1)}`).join(" ");
  const band = `${top} ${B.map((_, i) => `L${X(n - 1 - i).toFixed(1)},${(h - Y(B[n - 1 - i])).toFixed(1)}`).join(" ")} Z`;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="spread band">
      <path d={band} fill={C2} opacity="0.3" />
      <path d={top} fill="none" stroke={C3} strokeWidth="1.5" />
      <path d={bot} fill="none" stroke={C2} strokeWidth="1.5" strokeDasharray="3 2" />
    </svg>
  );
}

export function ForecastCone({ actual = [], forecast = [], lo = [], hi = [] }: { actual?: number[]; forecast?: number[]; lo?: number[]; hi?: number[] }) {
  const w = 140;
  const h = 56;
  const n = actual.length + forecast.length;
  if (n === 0) return null;
  const full = [...actual, ...forecast];
  const [mn, mx] = extent([...full, ...lo, ...hi]);
  const X = linear(0, n - 1, w, 4);
  const Y = linear(mn, mx, h, 6);
  const k = actual.length;
  const cone =
    forecast.length > 0
      ? `M${X(k - 1).toFixed(1)},${(h - Y(actual[k - 1] ?? forecast[0] ?? 0)).toFixed(1)} ` +
        forecast.map((_, i) => `L${X(k + i).toFixed(1)},${(h - Y(hi[i] ?? 0)).toFixed(1)}`).join(" ") +
        " " +
        forecast
          .map((_, i) => `L${X(n - 1 - i).toFixed(1)},${(h - Y(lo[n - 1 - i] ?? 0)).toFixed(1)}`)
          .join(" ") +
        " Z"
      : "";
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="forecast cone">
      {cone && <path d={cone} fill={C2} opacity="0.3" />}
      <path
        d={full.map((v, i) => `${i === 0 ? "M" : "L"}${X(i).toFixed(1)},${(h - Y(v)).toFixed(1)}`).join(" ")}
        fill="none"
        stroke={C3}
        strokeWidth="1.5"
      />
      {forecast.length > 0 && (
        <path
          d={forecast.map((v, i) => `${i === 0 ? "M" : "L"}${X(k + i).toFixed(1)},${(h - Y(v)).toFixed(1)}`).join(" ")}
          fill="none"
          stroke={C2}
          strokeWidth="1.5"
          strokeDasharray="4 2"
        />
      )}
    </svg>
  );
}

export function OHLC({ candles = [] }: { candles?: { o: number; h: number; l: number; c: number }[] }) {
  const w = 140;
  const h = 64;
  if (candles.length === 0) return null;
  const [lo, hi] = extent(candles.flatMap((k) => [k.h, k.l]));
  const Y = linear(lo, hi, h, 6);
  const bw = w / candles.length;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="ohlc">
      {candles.map((k, i) => {
        const up = k.c >= k.o;
        const x = i * bw + bw / 2;
        const bodyTop = h - Y(Math.max(k.o, k.c));
        const bodyH = Math.max(1.5, Math.abs(Y(k.o) - Y(k.c)));
        const color = up ? C3 : DES;
        return (
          <g key={i} stroke={color} strokeWidth="1.5">
            <line x1={x.toFixed(1)} y1={(h - Y(k.h)).toFixed(1)} x2={x.toFixed(1)} y2={(h - Y(k.l)).toFixed(1)} />
            <line x1={x.toFixed(1)} y1={bodyTop.toFixed(1)} x2={x.toFixed(1)} y2={(bodyTop + bodyH).toFixed(1)} strokeWidth="4" />
          </g>
        );
      })}
    </svg>
  );
}

export function NetFlow({ values = [] }: { values?: number[] }) {
  const w = 160;
  const h = 64;
  if (values.length === 0) return null;
  const [lo, hi] = extent([0, ...values]);
  const Y = linear(Math.min(lo, 0), hi, h, 8);
  const zeroY = h - Y(0);
  const bw = w / values.length;
  let net = 0;
  values.forEach((v) => {
    net += v;
  });
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="net flow">
      <line x1="0" y1={zeroY.toFixed(1)} x2={w} y2={zeroY.toFixed(1)} stroke={MUT} strokeWidth="1" />
      {values.map((v, i) => {
        const y = h - Y(v);
        return (
          <rect
            key={i}
            x={(i * bw + 2).toFixed(1)}
            y={Math.min(y, zeroY).toFixed(1)}
            width={Math.max(2, bw - 4).toFixed(1)}
            height={Math.max(1, Math.abs(y - zeroY)).toFixed(1)}
            rx="1"
            fill={v >= 0 ? C3 : DES}
            opacity="0.85"
          />
        );
      })}
      <text x={w - 2} y="10" textAnchor="end" fontSize="8" fill={net >= 0 ? C3 : DES} fontFamily="monospace" fontWeight="700">
        net {fmt(net)}
      </text>
    </svg>
  );
}

export function RateVolume({ rates = [], volumes = [] }: { rates?: number[]; volumes?: number[] }) {
  const w = 160;
  const h = 64;
  const n = Math.max(rates.length, volumes.length);
  if (n === 0) return null;
  const vmax = Math.max(...volumes, 0) || 1;
  const [rlo, rhi] = extent(rates.length ? rates : [0]);
  const RY = linear(rlo, rhi, h, 14);
  const bw = w / n;
  const X = linear(0, n - 1, w, 6);
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="rate volume">
      {Array.from({ length: n }).map((_, i) => {
        const v = volumes[i] ?? 0;
        return (
          <rect
            key={i}
            x={(i * bw + 2).toFixed(1)}
            y={(h - (v / vmax) * (h - 10)).toFixed(1)}
            width={Math.max(2, bw - 4).toFixed(1)}
            height={Math.max(1, (v / vmax) * (h - 10)).toFixed(1)}
            rx="1"
            fill={C1}
            opacity="0.45"
          />
        );
      })}
      {rates.length > 1 && (
        <path
          d={rates.map((v, i) => `${i === 0 ? "M" : "L"}${X(i).toFixed(1)},${(h - RY(v)).toFixed(1)}`).join(" ")}
          fill="none"
          stroke={C3}
          strokeWidth="1.5"
        />
      )}
    </svg>
  );
}
