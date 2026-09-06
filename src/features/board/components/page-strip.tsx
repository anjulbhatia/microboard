import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, ArrowUp01Icon, AspectRatioIcon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { useBoard } from "@/lib/board-store";
import { BOARD_GRID } from "@/types/board";
import { SaveStatus } from "@/components/canvas/controls";
import type { PageStripProps } from "@/app/create/interface";

export function PageStrip({ ratio, onRatio, cleanedCount, usedCells, capacity }: PageStripProps) {
  const board = useBoard((s) => s.board);
  const { addPage, removePage, setActivePage } = useBoard();
  const [expanded, setExpanded] = useState(false);
  const cols = BOARD_GRID[ratio].cols;

  return (
    <div className="shrink-0">
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="overflow-hidden"
          >
            <div className="mb-1 flex items-stretch justify-center gap-2 overflow-x-auto rounded-xl border bg-card/60 p-2">
              {board.pages.map((p, i) => {
                const active = p.id === board.activePageId;
                const ids = p.order.filter((id) => p.widgets[id]);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActivePage(p.id)}
                    title={`${p.name} · ${ids.length} widgets`}
                    className={`flex w-28 shrink-0 flex-col gap-1 rounded-lg border p-1.5 text-left transition-colors ${
                      active ? "border-primary bg-primary/5" : "hover:border-primary/50"
                    }`}
                  >
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {i + 1} · {p.name}
                    </span>
                    <span
                      aria-hidden
                      className="flex flex-wrap content-start gap-px rounded border bg-background p-1"
                      style={{ aspectRatio: ratio === "3:4" ? "3 / 4" : "16 / 10" }}
                    >
                      {ids.length === 0 && <span className="m-auto font-mono text-[9px] text-muted-foreground">empty</span>}
                      {ids.map((id) => {
                        const w = p.widgets[id];
                        return (
                          <span
                            key={id}
                            className="h-1.5 rounded-[2px] bg-primary/50"
                            style={{ width: `${Math.max(8, (w.w / cols) * 100)}%` }}
                          />
                        );
                      })}
                    </span>
                    {active && board.pages.length > 1 && (
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label={`Delete page ${i + 1}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          removePage(p.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.stopPropagation();
                            removePage(p.id);
                          }
                        }}
                        className="font-mono text-[10px] text-muted-foreground hover:text-destructive"
                      >
                        delete
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex shrink-0 items-center gap-1 pt-1">
      <div className="flex w-28 shrink-0 items-center gap-1">
        <SaveStatus version={board.version} />
      </div>
        <div className="flex flex-1 items-center justify-center gap-1">
          <div className="group relative">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? "Collapse pages" : "Expand pages"}
              aria-expanded={expanded}
              className={`flex size-7 items-center justify-center rounded-md border transition-colors hover:bg-muted hover:text-foreground ${
                expanded ? "border-primary text-foreground" : "text-muted-foreground"
              }`}
            >
              <HugeiconsIcon icon={expanded ? ArrowDown01Icon : ArrowUp01Icon} size={13} strokeWidth={1.5} />
            </button>
            <span className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 hidden -translate-x-1/2 rounded-md border bg-popover px-2 py-1 font-mono text-[11px] whitespace-nowrap text-popover-foreground shadow group-hover:block">
              Birdseye view
            </span>
          </div>
          {board.pages.map((p, i) => {
            const active = p.id === board.activePageId;
            const count = p.order.length;
            return (
              <div key={p.id} className="group relative">
                <button
                  type="button"
                  onClick={() => setActivePage(p.id)}
                  aria-label={`Page ${i + 1}`}
                  className={`flex size-7 items-center justify-center rounded-md border font-mono text-[11px] transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {i + 1}
                </button>
                <span className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 hidden -translate-x-1/2 rounded-md border bg-popover px-2 py-1 font-mono text-[11px] whitespace-nowrap text-popover-foreground shadow group-hover:block">
                  {p.name} · {count} widgets
                </span>
                {active && board.pages.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePage(p.id)}
                    aria-label={`Delete page ${i + 1}`}
                    className="absolute -top-1.5 -right-1.5 hidden size-4 items-center justify-center rounded-full border bg-background font-mono text-[10px] leading-none text-muted-foreground hover:text-foreground group-hover:flex"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
          <div className="group relative">
            <button
              type="button"
              onClick={addPage}
              aria-label="Add page"
              className="flex size-7 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={13} strokeWidth={1.5} />
            </button>
            <span className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 hidden -translate-x-1/2 rounded-md border bg-popover px-2 py-1 font-mono text-[11px] whitespace-nowrap text-popover-foreground shadow group-hover:block">
              Add canvas
            </span>
          </div>
          <div className="group relative">
            <button
              type="button"
              onClick={() => onRatio(ratio === "16:10" ? "3:4" : "16:10")}
              aria-label="Toggle resolution"
              className="flex h-7 items-center gap-1 rounded-md border px-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <HugeiconsIcon icon={AspectRatioIcon} size={13} strokeWidth={1.5} />
              {ratio}
            </button>
            <span className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 hidden -translate-x-1/2 rounded-md border bg-popover px-2 py-1 font-mono text-[11px] whitespace-nowrap text-popover-foreground shadow group-hover:block">
              Resolution · {ratio} · {capacity} cells
            </span>
          </div>
        </div>
        <span className="w-28 shrink-0 text-right font-mono text-[10px] text-muted-foreground">
          {cleanedCount}r · {usedCells}/{capacity}
        </span>
      </div>
    </div>
  );
}
