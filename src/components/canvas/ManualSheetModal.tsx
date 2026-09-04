import { useMemo, useState } from "react";
import { DataGrid, type Column } from "react-data-grid";
import "react-data-grid/lib/styles.css";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import {
  defaultHeaders,
  emptyGrid,
  manualRecords,
  type CellValue,
} from "@/lib/data-providers";

type GridRow = Record<string, CellValue>;

const COL_KEYS = ["c0", "c1", "c2", "c3", "c4"];

function toRows(grid: CellValue[][]): GridRow[] {
  return grid.map((row) => {
    const obj: GridRow = {};
    COL_KEYS.forEach((k, i) => {
      obj[k] = row[i] ?? null;
    });
    return obj;
  });
}

function fromRows(rows: readonly GridRow[]): CellValue[][] {
  return rows.map((r) => COL_KEYS.map((k) => r[k] ?? null));
}

export function ManualSheetModal({ onClose, onImport }: { onClose: () => void; onImport: (records: Record<string, string>[]) => void }) {
  const [headers, setHeaders] = useState<string[]>(defaultHeaders(COL_KEYS.length));
  const [rows, setRows] = useState<GridRow[]>(() => toRows(emptyGrid(10, COL_KEYS.length)));
  const [error, setError] = useState("");

  const columns: Column<GridRow>[] = useMemo(
    () =>
      COL_KEYS.map((key, i) => ({
        key,
        name: headers[i] || `col_${i + 1}`,
        editable: true,
        resizable: true,
      })),
    [headers]
  );

  const submit = () => {
    try {
      onImport(manualRecords(headers, fromRows(rows)));
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read grid.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Enter data manually"
    >
      <div
        className="flex max-h-[85svh] w-full max-w-4xl flex-col rounded-xl border bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h2 className="font-semibold">Add data manually</h2>
            <p className="text-xs text-muted-foreground">Edit headers, fill cells, then import.</p>
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

        <div className="grid grid-cols-5 gap-px border-b bg-border px-0">
          {headers.map((h, i) => (
            <input
              key={i}
              value={h}
              onChange={(e) =>
                setHeaders((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))
              }
              aria-label={`Column ${i + 1} header`}
              className="bg-muted/50 px-2 py-1.5 font-mono text-xs font-semibold focus-visible:bg-muted focus-visible:outline-none"
            />
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <DataGrid columns={columns} rows={rows} onRowsChange={setRows} className="rdg-light" />
        </div>

        {error && <p className="border-t px-4 pt-2 font-mono text-xs text-destructive">{error}</p>}

        <div className="flex justify-end gap-2 border-t px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Import grid
          </button>
        </div>
      </div>
    </div>
  );
}
