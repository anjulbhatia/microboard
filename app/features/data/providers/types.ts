export type CellValue = string | number | boolean | null;

export interface TabularData {
  columns: string[];
  rows: CellValue[][];
}

export function cellToString(v: CellValue): string {
  if (v == null) return "";
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  return String(v);
}

/** Providers hand string records to the board store (single source of truth). */
export function toRecords(data: TabularData): Record<string, string>[] {
  return data.rows.map((row) => {
    const obj: Record<string, string> = {};
    data.columns.forEach((c, i) => {
      obj[c] = cellToString(row[i] ?? null);
    });
    return obj;
  });
}

export function isEmpty(data: TabularData): boolean {
  return data.columns.length === 0 || data.rows.length === 0;
}
