import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, CleanIcon, Table01Icon } from "@hugeicons/core-free-icons";
import type { ColumnMeta } from "@/types/board";

export function DataLandedModal({
  columns,
  rows,
  onQuickClean,
  onClose,
}: {
  columns: ColumnMeta[];
  rows: number;
  onQuickClean: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Data loaded"
    >
      <div
        className="w-full max-w-md rounded-xl border bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Table01Icon} size={18} strokeWidth={1.5} className="text-primary" />
            <h2 className="font-semibold">Data landed</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="space-y-3 px-4 py-3">
          <p className="font-mono text-xs text-muted-foreground">
            {rows} rows · {columns.length} columns detected
          </p>
          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {columns.map((c) => (
              <li key={c.name} className="flex items-center justify-between rounded-md border bg-card px-2 py-1.5 font-mono text-xs">
                <span className="truncate">{c.name}</span>
                <span className="shrink-0 text-muted-foreground">
                  {c.type}{c.nulls > 0 ? ` · ${c.nulls} null` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end gap-2 border-t px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={() => {
              onQuickClean();
              onClose();
            }}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <span className="inline-flex items-center gap-1.5">
              <HugeiconsIcon icon={CleanIcon} size={15} strokeWidth={1.5} />
              Drop all nulls
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
