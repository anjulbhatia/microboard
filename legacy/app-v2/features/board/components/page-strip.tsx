import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, ArrowUp01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { useBoard } from "@/store/board";
import { BOARD_GRID } from "@/features/board/types";
import { SaveStatus } from "@/features/board/components/controls";
import { usePageThumb } from "@/features/board/lib/page-thumb";
import type { PageStripProps } from "@/features/board/types";

const BACKDROPS = ["dotted", "grid", "plain"] as const;

export function PageStrip({ cleanedCount, usedCells, capacity, backdrop, onBackdrop }: PageStripProps) {
  const board = useBoard((s) => s.board);
  const { addPage, removePage, setActivePage } = useBoard();
  const [expanded, setExpanded] = useState(false);

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
            <div className="mb-1 flex items-stretch justify-center gap-2 overflow-x-auto border-y bg-background p-2">
              {board.pages.map((p, i) => (
                <PageCard
                  key={p.id}
                  pageId={p.id}
                  index={i}
                  name={p.name}
                  active={p.id === board.activePageId}
                  watch={p.id === board.activePageId ? board.version : null}
                  widgetCount={p.order.filter((id) => p.widgets[id]).length}
                  widgets={p.order
                    .filter((id) => p.widgets[id])
                    .map((id) => ({ id, w: p.widgets[id].w ?? 4 }))}
                  canDelete={board.pages.length > 1}
                  onSelect={() => setActivePage(p.id)}
                  onDelete={() => removePage(p.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex shrink-0 items-center gap-1 px-2 py-1">
      <div className="flex w-28 shrink-0 items-center gap-1">
        <SaveStatus version={board.version} />
      </div>
        <div className="flex flex-1 items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? "Collapse pages" : "Expand pages"}
            aria-expanded={expanded}
            title="Pages"
            className={`flex size-7 items-center justify-center rounded-md transition-colors hover:bg-muted hover:text-foreground ${
              expanded ? "bg-muted text-foreground" : "text-muted-foreground"
            }`}
          >
            <HugeiconsIcon icon={expanded ? ArrowDown01Icon : ArrowUp01Icon} size={13} strokeWidth={1.5} />
          </button>
          {board.pages.map((p, i) => {
            const active = p.id === board.activePageId;
            const count = p.order.length;
            return (
              <div key={p.id} className="group relative">
                <button
                  type="button"
                  onClick={() => setActivePage(p.id)}
                  aria-label={`Page ${i + 1}: ${p.name}, ${count} widgets`}
                  title={`${p.name} · ${count} widgets`}
                  className={`flex size-7 items-center justify-center rounded-md font-mono text-[11px] transition-colors ${
                    active
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {i + 1}
                </button>
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
          <button
            type="button"
            onClick={addPage}
            aria-label="Add page"
            title="Add canvas"
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={13} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => onBackdrop(BACKDROPS[(BACKDROPS.indexOf(backdrop) + 1) % BACKDROPS.length])}
            aria-label={`Backdrop: ${backdrop}. Activate to change.`}
            title={`Backdrop: ${backdrop}`}
            className="flex h-7 items-center rounded-md px-1.5 font-mono text-[11px] capitalize text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {backdrop}
          </button>
        </div>
        <span className="w-28 shrink-0 text-right font-mono text-[10px] text-muted-foreground">
          {cleanedCount}r · {usedCells}/{capacity}
        </span>
      </div>
    </div>
  );
}

/** Birdseye card: live raster when captured, block diagram fallback. */
function PageCard({
  pageId,
  index,
  name,
  active,
  watch,
  widgetCount,
  widgets,
  canDelete,
  onSelect,
  onDelete,
}: {
  pageId: string;
  index: number;
  name: string;
  active: boolean;
  watch: number | null;
  widgetCount: number;
  widgets: { id: string; w: number }[];
  canDelete: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const thumb = usePageThumb(pageId, watch);
  const cols = BOARD_GRID.cols;
  return (
    <button
      type="button"
      onClick={onSelect}
      title={`${name} · ${widgetCount} widgets`}
      className={`flex w-32 shrink-0 flex-col gap-1 rounded-lg border p-1.5 text-left transition-colors ${
        active ? "border-foreground/40" : "hover:border-foreground/25"
      }`}
    >
      <span className="font-mono text-[10px] text-muted-foreground">
        {index + 1} · {name}
      </span>
      {thumb ? (
        <img
          src={thumb}
          alt=""
          aria-hidden
          draggable={false}
          className="rounded border bg-background"
          style={{ aspectRatio: "8 / 5", objectFit: "cover" }}
        />
      ) : (
        <span
          aria-hidden
          className="flex flex-wrap content-start gap-px rounded border bg-background p-1"
          style={{ aspectRatio: "8 / 5" }}
        >
          {widgets.length === 0 && <span className="m-auto font-mono text-[9px] text-muted-foreground">empty</span>}
          {widgets.map(({ id, w }) => (
            <span
              key={id}
              className="h-1.5 rounded-[2px] bg-foreground/30"
              style={{ width: `${Math.max(8, (w / cols) * 100)}%` }}
            />
          ))}
        </span>
      )}
      {active && canDelete && (
        <span
          role="button"
          tabIndex={0}
          aria-label={`Delete page ${index + 1}`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.stopPropagation();
              onDelete();
            }
          }}
          className="font-mono text-[10px] text-muted-foreground hover:text-destructive"
        >
          delete
        </span>
      )}
    </button>
  );
}
