import { parseCSV } from "@/lib/data-utils";
import { toRecords, type TabularData } from "@/lib/data-providers/types";

export function csvFromText(text: string): TabularData {
  const records = parseCSV(text);
  if (records.length === 0) throw new Error("No data rows found in CSV.");
  const columns = Object.keys(records[0]);
  return {
    columns,
    rows: records.map((r) => columns.map((c) => r[c] ?? "")),
  };
}

export function csvRecords(text: string): Record<string, string>[] {
  return toRecords(csvFromText(text));
}
