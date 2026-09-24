import type { DataSource } from "@/features/board/types";
import { cellToString } from "@/features/data/providers/types";

export interface SourceMeta {
  kind: DataSource;
  label: string;
  blurb: string;
  /** Ready to use today (api included — JSON endpoints). */
  live: boolean;
}

/** Everywhere data can come from. API polls a JSON array endpoint. */
export const SOURCE_REGISTRY: SourceMeta[] = [
  { kind: "file", label: "File", blurb: "CSV or Excel upload", live: true },
  { kind: "inline", label: "Paste", blurb: "Clipboard / typed rows", live: true },
  { kind: "sheet", label: "Google Sheet", blurb: "Public sheet link", live: true },
  { kind: "api", label: "API", blurb: "JSON endpoint with auto-refresh", live: true },
  { kind: "sample", label: "Sample", blurb: "12-row demo set", live: true },
];

export const REFRESH_OPTIONS = [0, 5, 15, 30, 60] as const;

export function refreshLabel(minutes: number): string {
  if (minutes <= 0) return "Off";
  if (minutes < 60) return `Every ${minutes}m`;
  return `Every ${minutes / 60}h`;
}

/** Ingest ceilings: a pasted/fetched payload must stay renderable. */
export const MAX_INGEST_ROWS = 20_000;
export const MAX_INGEST_COLS = 200;
export const MAX_INGEST_CELL = 10_000;
export const MAX_INGEST_BYTES = 10_000_000;

/** Coerce a JSON payload into string records. Expects an array of objects. */
export function recordsFromJson(value: unknown): Record<string, string>[] {
  const rows = Array.isArray(value) ? value : (value as { rows?: unknown })?.rows;
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("API source needs a JSON array of objects (or { rows: [...] }).");
  }
  if (rows.length > MAX_INGEST_ROWS) {
    throw new Error(`Endpoint returned ${rows.length} rows (max ${MAX_INGEST_ROWS}).`);
  }
  return rows.map((r) => {
    if (typeof r !== "object" || r === null || Array.isArray(r)) {
      throw new Error("API source needs a JSON array of objects.");
    }
    const entries = Object.entries(r as Record<string, unknown>);
    if (entries.length > MAX_INGEST_COLS) {
      throw new Error(`A row has ${entries.length} columns (max ${MAX_INGEST_COLS}).`);
    }
    const obj: Record<string, string> = {};
    for (const [k, v] of entries) {
      const cell =
        typeof v === "string" || typeof v === "number" || typeof v === "boolean" || v == null
          ? cellToString(v as string | number | boolean | null)
          : JSON.stringify(v);
      if (cell.length > MAX_INGEST_CELL) {
        throw new Error(`A cell exceeds ${MAX_INGEST_CELL} chars — trim the payload.`);
      }
      obj[k.slice(0, 128)] = cell;
    }
    return obj;
  });
}

export async function fetchApiRecords(url: string): Promise<Record<string, string>[]> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("That URL does not look valid.");
  }
  // No file:, javascript:, or intranet chasing from the loader.
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http(s) endpoints are supported.");
  }
  let res: Response;
  try {
    res = await fetch(parsed.toString());
  } catch {
    throw new Error("Could not reach that URL. Check CORS and connectivity.");
  }
  if (!res.ok) throw new Error(`Endpoint returned ${res.status}.`);
  const hint = Number(res.headers.get("content-length") ?? 0);
  if (hint > MAX_INGEST_BYTES) throw new Error("Endpoint payload is too large (>10MB).");
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new Error("Endpoint did not return JSON.");
  }
  return recordsFromJson(json);
}
