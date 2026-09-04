import { csvFromText } from "@/lib/data-providers/csv";
import { toRecords, type TabularData } from "@/lib/data-providers/types";

function sheetIdFromUrl(url: string): string | null {
  const match = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

export async function sheetFromUrl(url: string): Promise<TabularData> {
  const id = sheetIdFromUrl(url.trim());
  if (!id) throw new Error("Not a Google Sheets link (expected docs.google.com/spreadsheets/d/…).");
  const res = await fetch(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv`);
  if (!res.ok) throw new Error("Sheet is not shared publicly (File → Share → Anyone with the link).");
  return csvFromText(await res.text());
}

export async function sheetRecords(url: string): Promise<Record<string, string>[]> {
  return toRecords(await sheetFromUrl(url));
}
