import type { Widget } from "@/types/board";

export function ShapesWidget({ widget }: { widget: Widget }) {
  const shape = String(widget.props?.shape ?? "rectangle");
  const color = String(widget.props?.color ?? "#8b5cf6");
  const common = {
    stroke: color,
    strokeWidth: 2,
    fill: color,
    fillOpacity: 0.15,
  };
  return (
    <svg viewBox="0 0 200 120" className="h-32 w-full" role="img" aria-label={shape}>
      {shape === "ellipse" ? (
        <ellipse cx="100" cy="60" rx="80" ry="45" {...common} />
      ) : shape === "line" ? (
        <line x1="20" y1="60" x2="180" y2="60" stroke={color} strokeWidth={2} strokeLinecap="round" />
      ) : (
        <rect x="30" y="15" width="140" height="90" rx="8" {...common} />
      )}
    </svg>
  );
}
