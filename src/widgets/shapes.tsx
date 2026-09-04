import type { Widget } from "@/types/board";

export function ShapesWidget({ widget }: { widget: Widget }) {
  const shape = String(widget.props?.shape ?? "rectangle");
  const color = String(widget.props?.color ?? "var(--chart-3)");
  const paint = {
    stroke: color,
    strokeWidth: 2,
    fill: color,
    fillOpacity: 0.15,
  } as const;
  const line = { stroke: color, strokeWidth: 2 } as const;
  return (
    <svg viewBox="0 0 200 120" className="h-32 w-full" role="img" aria-label={shape}>
      {shape === "square" ? (
        <rect x="55" y="15" width="90" height="90" rx="6" style={paint} />
      ) : shape === "circle" ? (
        <circle cx="100" cy="60" r="45" style={paint} />
      ) : shape === "rounded rect" ? (
        <rect x="25" y="25" width="150" height="70" rx="22" style={paint} />
      ) : shape === "arrow" ? (
        <g style={line} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <line x1="25" y1="60" x2="150" y2="60" />
          <polyline points="120,35 152,60 120,85" />
        </g>
      ) : shape === "ellipse" ? (
        <ellipse cx="100" cy="60" rx="80" ry="45" style={paint} />
      ) : shape === "line" ? (
        <line x1="20" y1="60" x2="180" y2="60" style={line} strokeLinecap="round" />
      ) : (
        <rect x="30" y="15" width="140" height="90" rx="2" style={paint} />
      )}
    </svg>
  );
}
