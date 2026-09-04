import { HugeiconsIcon } from "@hugeicons/react";
import { Image01Icon } from "@hugeicons/core-free-icons";
import type { Widget } from "@/types/board";

export function ImageWidget({ widget }: { widget: Widget }) {
  const src = String(widget.props?.src ?? "");
  const fit = String(widget.props?.fit ?? "cover") as "cover" | "contain";
  if (!src) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-muted-foreground">
        <HugeiconsIcon icon={Image01Icon} size={28} strokeWidth={1.5} />
        <p className="font-mono text-xs">set an image URL in settings</p>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={widget.title}
      loading="lazy"
      className={`max-h-64 w-full rounded-lg border ${fit === "contain" ? "object-contain" : "object-cover"}`}
    />
  );
}
