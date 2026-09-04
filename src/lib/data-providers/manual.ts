import { toRecords, type CellValue, type TabularData } from "@/lib/data-providers/types";

export const MANUAL_ROWS = 10;
export const MANUAL_COLS = 5;

export function emptyGrid(rows = MANUAL_ROWS, cols = MANUAL_COLS): CellValue[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));
}

export function defaultHeaders(cols = MANUAL_COLS): string[] {
  return Array.from({ length: cols }, (_, i) => `col_${i + 1}`);
}

/** Drops fully-empty trailing rows/columns, requires a header row. */
export function manualFromGrid(headers: string[], grid: CellValue[][]): TabularData {
  const cellFilled = (v: CellValue): boolean => v != null && String(v).trim() !== "";
  let lastRow = -1;
  for (let i = 0; i < grid.length; i++) {
    if (grid[i].some(cellFilled)) lastRow = i;
  }
  if (lastRow < 0) throw new Error("Grid is empty.");
  const trimmed = grid.slice(0, lastRow + 1);
  let lastCol = -1;
  for (const row of trimmed) {
    for (let j = 0; j < row.length; j++) {
      if (cellFilled(row[j])) lastCol = Math.max(lastCol, j);
    }
  }
  const columns = headers.slice(0, lastCol + 1).map((h, i) => h.trim() || `col_${i + 1}`);
  return {
    columns,
    rows: trimmed.map((row) => columns.map((_, i) => row[i] ?? null)),
  };
}

export function manualRecords(headers: string[], grid: CellValue[][]): Record<string, string>[] {
  return toRecords(manualFromGrid(headers, grid));
}
