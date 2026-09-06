/** Shared math for src/widgets/charts/micro/*. No deps, no store reads —
 * every micro chart is a pure function of props so it can render inside
 * the board, the /charts gallery, or a WebMCP tool result identically. */

export function scale(v: number, dMin: number, dMax: number, rMin: number, rMax: number): number {
  if (dMax === dMin) return (rMin + rMax) / 2;
  return rMin + ((v - dMin) / (dMax - dMin)) * (rMax - rMin);
}

export function extent(data: number[]): [number, number] {
  if (data.length === 0) return [0, 1];
  return [Math.min(...data), Math.max(...data)];
}

/** Build a `M..L..L..` path for `data` inside a w×h box, optional padding. */
export function linePath(data: number[], w: number, h: number, pad = 2): string {
  if (data.length === 0) return "";
  const [dMin, dMax] = extent(data);
  const step = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;
  return data
    .map((v, i) => {
      const x = pad + i * step;
      const y = scale(v, dMin, dMax, h - pad, pad);
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

/** Closed area path (line + baseline) for fills. */
export function areaPath(data: number[], w: number, h: number, pad = 2): string {
  if (data.length === 0) return "";
  const line = linePath(data, w, h, pad);
  const step = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;
  const lastX = pad + (data.length - 1) * step;
  return `${line} L${lastX.toFixed(2)},${h - pad} L${pad},${h - pad} Z`;
}

export function points(data: number[], w: number, h: number, pad = 2): { x: number; y: number }[] {
  if (data.length === 0) return [];
  const [dMin, dMax] = extent(data);
  const step = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;
  return data.map((v, i) => ({ x: pad + i * step, y: scale(v, dMin, dMax, h - pad, pad) }));
}

export const COLORS = {
  primary: "var(--chart-3)",
  deep: "var(--chart-1)",
  soft: "var(--chart-4)",
  mist: "var(--chart-5)",
  up: "var(--chart-4)",
  down: "var(--destructive)",
  muted: "var(--muted-foreground)",
  border: "var(--border)",
  fg: "var(--foreground)",
} as const;

export function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}