import { useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cards01Icon,
  ImageUpload01Icon,
  PlusSignIcon,
  ShapesIcon,
} from "@hugeicons/core-free-icons";
import { useBoard } from "@/lib/board-store";
import { WIDGET_REGISTRY } from "@/widgets/registry";
import type { WidgetType } from "@/types/board";

function useMenu() {
  const [open, setOpen] = useState<string | null>(null);
  return {
    open,
    toggle: (id: string) => setOpen((o) => (o === id ? null : id)),
    close: () => setOpen(null),
  };
}

export function QuickAddBar() {
  const addWidget = useBoard((s) => s.addWidget);
  const menu = useMenu();
  const imgRef = useRef<HTMLInputElement>(null);

  const add = (type: WidgetType, title?: string, props?: Record<string, string | number>) => {
    const meta = WIDGET_REGISTRY[type];
    addWidget({
      type,
      title: title ?? meta.defaults.title,
      w: meta.defaultSpan.w,
      h: meta.defaultSpan.h,
      props: { ...meta.defaults.props, ...props },
    });
    menu.close();
  };

  const placeImages = (files: FileList | null) => {
    if (!files) return;
    [...files]
      .filter((f) => f.type.startsWith("image/"))
      .forEach((f) =>
        add("image", f.name, { src: URL.createObjectURL(f), fit: "cover" })
      );
  };

  const btn =
    "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";
  const item =
    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted";

  return (
    <div className="flex shrink-0 items-center gap-0.5 border-b bg-card px-2 py-1">
      <div className="relative">
        <button type="button" onClick={() => menu.toggle("widget")} className={btn} aria-label="Add widget">
          <HugeiconsIcon icon={PlusSignIcon} size={15} strokeWidth={1.5} />
          Widget
        </button>
        {menu.open === "widget" && (
          <>
            <span className="fixed inset-0 z-10" onClick={menu.close} aria-hidden />
            <span className="absolute top-full left-0 z-20 mt-1 w-40 rounded-lg border bg-popover p-1 shadow-xl">
              <button type="button" onClick={() => add("heading")} className={item}>Heading</button>
              <button type="button" onClick={() => add("textbox")} className={item}>Rich text</button>
              <button type="button" onClick={() => add("card")} className={item}>Card</button>
              <button type="button" onClick={() => add("icon")} className={item}>Icon</button>
            </span>
          </>
        )}
      </div>

      <div className="relative">
        <button type="button" onClick={() => menu.toggle("shapes")} className={btn} aria-label="Add shape">
          <HugeiconsIcon icon={ShapesIcon} size={15} strokeWidth={1.5} />
          Shapes
        </button>
        {menu.open === "shapes" && (
          <>
            <span className="fixed inset-0 z-10" onClick={menu.close} aria-hidden />
            <span className="absolute top-full left-0 z-20 mt-1 w-40 rounded-lg border bg-popover p-1 shadow-xl">
              {["square", "circle", "rounded rect", "rect", "arrow", "ellipse", "line"].map((s) => (
                <button key={s} type="button" onClick={() => add("shape", "Shape", { shape: s })} className={`${item} capitalize`}>
                  {s}
                </button>
              ))}
            </span>
          </>
        )}
      </div>

      <button type="button" onClick={() => imgRef.current?.click()} className={btn} aria-label="Upload image">
        <HugeiconsIcon icon={ImageUpload01Icon} size={15} strokeWidth={1.5} />
        Image
      </button>
      <input
        ref={imgRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          placeImages(e.target.files);
          e.target.value = "";
        }}
      />

      <button
        type="button"
        onClick={() => add("card")}
        className={btn}
        aria-label="Add card"
      >
        <HugeiconsIcon icon={Cards01Icon} size={15} strokeWidth={1.5} />
        Card
      </button>
    </div>
  );
}
