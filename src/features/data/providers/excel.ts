import { readSheet } from "read-excel-file/browser";
import { toRecords, type CellValue, type TabularData } from "@/lib/data-providers/types";

function normalize(value: unknown): CellValue {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  return String(value);
}

export async function excelFromFile(file: File): Promise<TabularData> {
  const data = await readSheet(file);
  if (data.length < 2) throw new Error("Sheet has no data rows (needs header + rows).");
  const columns = data[0].map((c, i) => {
    const name = String(c ?? "").trim();
    return name || `col_${i + 1}`;
  });
  const rows = data.slice(1).map((r) => columns.map((_, i) => normalize(r[i])));
  return { columns, rows };
}

export async function excelRecords(file: File): Promise<Record<string, string>[]> {
  return toRecords(await excelFromFile(file));
}
