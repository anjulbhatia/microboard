import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, AspectRatioIcon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { useBoard } from "@/lib/board-store";
import { SaveStatus } from "@/components/canvas/controls";
import type { PageStripProps } from "@/app/create/interface";

export function PageStrip({ ratio, onRatio, cleanedCount, usedCells, capacity, onBackToData }: PageStripProps) {
  const board = useBoard((s) => s.board);
  const { addPage, removePage, setActivePage } = useBoard();

  return (
    <div className="flex shrink-0 items-center gap-1 pt-1">
      <div className="flex w-28 shrink-0 items-center gap-1">
        <div className="group relative">
          <button
            type="button"
            onClick={onBackToData}
            aria-label="Back to data"
            className="flex size-7 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={13} strokeWidth={1.5} />
          </button>
          <span className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 hidden -translate-x-1/2 rounded-md border bg-popover px-2 py-1 font-mono text-[11px] whitespace-nowrap text-popover-foreground shadow group-hover:block">
            Back to data
          </span>
        </div>
        <SaveStatus version={board.version} />
      </div>
      <div className="flex flex-1 items-center justify-center gap-1">
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
      <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
        {cleanedCount}r · {usedCells}/{capacity}
      </span>
    </div>
  );
}
