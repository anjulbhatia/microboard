import { useRef, useState } from "react";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Copy01Icon, Drag01Icon, Settings01Icon } from "@hugeicons/core-free-icons";
import { useStageCols, useStageUnit } from "@/components/canvas/Stage";
import { useBoard } from "@/lib/board-store";
import { PropsEditor } from "@/widgets/PropsEditor";
import { clampSpan, WIDGET_REGISTRY } from "@/widgets/registry";
import type { WidgetCardProps } from "@/app/create/interface";

type ResizeDir = "e" | "s" | "se";

export function WidgetCard({ widget, selected, onSelect, onRemove, onDuplicate, onDragStart, onDrop }: WidgetCardProps) {
  const updateWidget = useBoard((s) => s.updateWidget);
  const unit = useStageUnit();
  const cols = useStageCols();
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState<{ w: number; h: number } | null>(null);
  const dragRef = useRef<{ dir: ResizeDir; startX: number; startY: number; w: number; h: number } | null>(null);
  const meta = WIDGET_REGISTRY[widget.type];
  const Body = meta.render;

  const w = preview?.w ?? widget.w;
  const h = preview?.h ?? widget.h;
  const height = meta.resize.fixedH ? "auto" : meta.resize.square ? w * unit : h * unit;

  const beginResize = (dir: ResizeDir) => (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { dir, startX: e.clientX, startY: e.clientY, w: widget.w, h: widget.h };
    const move = (ev: PointerEvent) => {
      const s = dragRef.current;
      if (!s) return;
      const du = (ev.clientX - s.startX) / unit;
      const dv = (ev.clientY - s.startY) / unit;
      let next = { w: s.w, h: s.h };
      if (meta.resize.square) {
        const d = Math.max(du, dv);
        next = { w: s.w + d, h: s.w + d };
      } else if (meta.resize.fixedH) {
        next = { w: s.w + du, h: s.h };
      } else if (s.dir === "e") {
        next = { w: s.w + du, h: s.h };
      } else if (s.dir === "s") {
        next = { w: s.w, h: s.h + dv };
      } else {
        next = { w: s.w + du, h: s.h + dv };
      }
      setPreview(clampSpan(widget.type, next, cols));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setPreview((p) => {
        if (p && (p.w !== widget.w || p.h !== widget.h)) updateWidget(widget.id, { w: p.w, h: p.h });
        return null;
      });
      dragRef.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const handleCls = "absolute z-10 rounded-full border-2 border-background bg-primary shadow touch-none";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      style={{ gridColumn: `span ${w} / span ${w}` }}
      className="relative"
    >
      {selected && (
        <div className="absolute -top-11 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 rounded-lg border bg-popover p-1 shadow-xl ring-1 ring-border">
          <span
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", widget.id);
              onDragStart(widget.id);
            }}
            title="Drag to move"
            className="cursor-grab rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
          >
            <HugeiconsIcon icon={Drag01Icon} size={15} strokeWidth={1.5} />
          </span>
          {meta.fields.length > 0 && (
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              title="Settings"
              aria-label="Widget settings"
              className={`rounded-md p-1.5 transition-colors hover:bg-muted hover:text-foreground ${
                editing ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <HugeiconsIcon icon={Settings01Icon} size={15} strokeWidth={1.5} />
            </button>
          )}
          <button
            type="button"
            onClick={onDuplicate}
            title="Duplicate"
            aria-label="Duplicate widget"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <HugeiconsIcon icon={Copy01Icon} size={15} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            title="Remove"
            aria-label="Remove widget"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={15} strokeWidth={1.5} />
          </button>
        </div>
      )}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onDrop(widget.id);
        }}
        style={{ height }}
        className={`overflow-hidden rounded-md transition-shadow ${
          selected ? "shadow-lg ring-1 ring-primary" : "hover:shadow-sm"
        }`}
      >
        <Body widget={widget} />
        {editing && (
          <div className="mt-2 rounded-md border bg-card p-2">
            <PropsEditor widget={widget} onChange={(props) => updateWidget(widget.id, { props })} />
          </div>
        )}
      </div>
      {selected && !meta.resize.fixedH && (
        <span
          onPointerDown={beginResize("s")}
          title="Resize height"
          className={`${handleCls} bottom-0 left-1/2 h-2.5 w-8 -translate-x-1/2 translate-y-1/2 cursor-ns-resize`}
        />
      )}
      {selected && (
        <span
          onPointerDown={beginResize("e")}
          title={meta.resize.square ? "Resize (square)" : "Resize width"}
          className={`${handleCls} top-1/2 right-0 h-8 w-2.5 translate-x-1/2 -translate-y-1/2 cursor-ew-resize`}
        />
      )}
      {selected && !meta.resize.fixedH && (
        <span
          onPointerDown={beginResize("se")}
          title="Resize both"
          className={`${handleCls} right-0 bottom-0 size-3.5 translate-x-1/3 translate-y-1/3 cursor-nwse-resize`}
        />
      )}
    </motion.div>
  );
}
