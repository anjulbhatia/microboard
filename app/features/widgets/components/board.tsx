import type { Widget } from "@/features/board/types";

export function BoardWidget({ widget }: { widget: Widget }) {
  const label = String(widget.props?.label ?? "Slide board");
  return (
    <div
      className="flex w-full flex-col items-center justify-center gap-1 rounded-lg border p-6 text-center"
      style={{
        aspectRatio: "8 / 5",
        backgroundImage:
          "radial-gradient(color-mix(in oklch, var(--foreground) 16%, transparent) 1.2px, transparent 1.2px)",
        backgroundSize: "18px 18px",
      }}
    >
      <p className="font-mono text-xs text-muted-foreground">8×5</p>
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
