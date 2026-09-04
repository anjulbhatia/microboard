import type { Widget } from "@/types/board";

export function BoardWidget({ widget }: { widget: Widget }) {
  const ratio = String(widget.props?.ratio ?? "16:10");
  const label = String(widget.props?.label ?? "Slide board");
  return (
    <div
      className="flex w-full flex-col items-center justify-center gap-1 rounded-lg border p-6 text-center"
      style={{
        aspectRatio: ratio === "3:4" ? "3 / 4" : "16 / 10",
        backgroundImage:
          "radial-gradient(color-mix(in oklch, var(--foreground) 16%, transparent) 1.2px, transparent 1.2px)",
        backgroundSize: "18px 18px",
      }}
    >
      <p className="font-mono text-xs text-muted-foreground">{ratio}</p>
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
