import { useEffect, useRef, useState, type ReactNode } from "react";

export type StageRatio = "16:10" | "3:4";
export type StageBackdrop = "dotted" | "grid" | "plain";

const BACKDROPS: Record<StageBackdrop, React.CSSProperties> = {
  dotted: {
    backgroundImage:
      "radial-gradient(color-mix(in oklch, var(--foreground) 14%, transparent) 1.2px, transparent 1.2px)",
    backgroundSize: "18px 18px",
  },
  grid: {
    backgroundImage:
      "linear-gradient(color-mix(in oklch, var(--foreground) 8%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklch, var(--foreground) 8%, transparent) 1px, transparent 1px)",
    backgroundSize: "28px 28px",
  },
  plain: {},
};

/** Screen-size-aware stage: largest ratio box that fits its container. */
export function Stage({
  ratio,
  backdrop,
  toolbar,
  children,
}: {
  ratio: StageRatio;
  backdrop: StageBackdrop;
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const box = el.getBoundingClientRect();
      setSize({ w: box.width, h: box.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [rw, rh] = ratio === "3:4" ? [3, 4] : [16, 10];
  const scale = size.w > 0 && size.h > 0 ? Math.min(size.w / rw, size.h / rh) : 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {toolbar}
      <div ref={wrapRef} className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        {scale > 0 && (
          <div
            className="overflow-y-auto rounded-xl border bg-card/40 shadow-sm"
            style={{ width: Math.floor(rw * scale), height: Math.floor(rh * scale), ...BACKDROPS[backdrop] }}
          >
            <div className="min-h-full p-3">{children}</div>
          </div>
        )}
      </div>
    </div>
  );
}
