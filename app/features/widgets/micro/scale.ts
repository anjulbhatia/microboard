export function extent(values: number[]): [number, number] {
  if (values.length === 0) return [0, 1];
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  return [lo, hi];
}

export function linear(min: number, max: number, size: number, pad = 0) {
  const span = max - min || 1;
  return (v: number) => pad + ((v - min) / span) * (size - pad * 2);
}

export function linePath(values: number[], w: number, h: number, pad = 2): string {
  if (values.length === 0) return "";
  const [lo, hi] = extent(values);
  const X = linear(0, values.length - 1, w, pad);
  const Y = linear(lo, hi, h, pad);
  return values.map((v, i) => `${i === 0 ? "M" : "L"}${X(i).toFixed(1)},${(h - Y(v)).toFixed(1)}`).join(" ");
}

export function areaPath(values: number[], w: number, h: number, pad = 2): string {
  const line = linePath(values, w, h, pad);
  if (!line) return "";
  return `${line} L${(w - pad).toFixed(1)},${h - pad} L${pad},${h - pad} Z`;
}

export function fmt(n: number): string {
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${Math.round(n * 100) / 100}`;
}
