import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { BOARD_GRID } from "@/features/board/types";

export type StageBackdrop = "dotted" | "grid" | "plain";

/** Fitted stage metrics — provided to widgets for unit math. */
const StageContext = createContext({ unit: 56, cols: BOARD_GRID.cols });

export function useStageUnit(): number {
  return useContext(StageContext).unit;
}

export function useStageCols(): number {
  return useContext(StageContext).cols;
}

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

/**
 * Fluid 8x5 stage. Fits its container and scales presentation to screen —
 * one canvas, no aspect variants.
 */
export function Stage({
  backdrop,
  toolbar,
  children,
}: {
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

  const { cols, rows } = BOARD_GRID;
  // Reserve the board's own my-2 breathing room from the fit area.
  const scale = size.w > 0 && size.h > 0 ? Math.min(size.w / cols, (size.h - 16) / rows) : 0;
  const unit = scale > 0 ? Math.max(24, Math.floor(scale)) : 56;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {toolbar}
      <div ref={wrapRef} className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-muted/30 p-3">
        {scale > 0 && (
          <div
            id="board-stage"
            className="slim-scroll my-2 overflow-y-auto rounded-lg border border-border/60 bg-background"
            style={{ width: Math.floor(cols * scale), height: Math.floor(rows * scale), ...BACKDROPS[backdrop] }}
          >
            <StageContext.Provider value={{ unit, cols }}>
              <div className="min-h-full p-3">{children}</div>
            </StageContext.Provider>
          </div>
        )}
      </div>
    </div>
  );
}
